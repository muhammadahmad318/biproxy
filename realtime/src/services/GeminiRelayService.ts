import WebSocket from "ws";
import { Socket } from "socket.io";
import {
  LaravelApiClient,
  SessionContext,
  FinalizePayload,
} from "./LaravelApiClient";

// ---------------------------------------------------------------------------
// Gemini Multimodal Live API — Outbound Message Interfaces
// ---------------------------------------------------------------------------

/** Top-level setup message sent immediately on WebSocket open. */
interface GeminiSetupMessage {
  setup: {
    model: string;
    generationConfig: GeminiGenerationConfig;
    systemInstruction: GeminiContent;
    tools: GeminiTool[];
  };
}

interface GeminiGenerationConfig {
  responseModalities: string[];
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: string;
      };
    };
  };
}

interface GeminiContent {
  parts: GeminiPart[];
}

interface GeminiPart {
  text?: string;
  inlineData?: GeminiInlineData;
}

interface GeminiInlineData {
  mimeType: string;
  data: string;
}

interface GeminiTool {
  functionDeclarations: GeminiFunctionDeclaration[];
}

interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

/** Realtime audio input envelope. */
interface GeminiRealtimeInput {
  realtimeInput: {
    audio?: GeminiInlineData;
    video?: GeminiInlineData;
    text?: string;
  };
}

/** Tool response sent back to Gemini after executing a function call. */
interface GeminiToolResponse {
  toolResponse: {
    functionResponses: GeminiFunctionResponse[];
  };
}

interface GeminiFunctionResponse {
  id: string;
  response: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Gemini Multimodal Live API — Inbound Message Interfaces
// ---------------------------------------------------------------------------

/** Parsed shape of a Gemini server message (union of possible payloads). */
interface GeminiServerMessage {
  setupComplete?: Record<string, unknown>;
  serverContent?: GeminiServerContent;
  toolCall?: GeminiToolCall;
}

interface GeminiServerContent {
  modelTurn?: {
    parts: GeminiPart[];
  };
  turnComplete?: boolean;
}

interface GeminiToolCall {
  functionCalls: GeminiFunctionCall[];
}

interface GeminiFunctionCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Document shape for system instruction context
// ---------------------------------------------------------------------------

/** Represents an extracted document attached to the session context. */
interface ContextDocument {
  file_name: string;
  extracted_text: string | null;
}

/**
 * Extended session context including optional fields for Gemini system instruction.
 *
 * These fields may not be present in all Laravel responses today but are
 * forward-compatible for when the context endpoint is enhanced.
 */
export interface ExtendedSessionContext extends SessionContext {
  system_prompt?: string;
  developer_skills?: string;
  documents?: ContextDocument[];
}

// ---------------------------------------------------------------------------
// GeminiRelayService
// ---------------------------------------------------------------------------

const GEMINI_MODEL = "models/gemini-3.1-flash-live-preview";
const AUDIO_MIME_TYPE = "audio/pcm;rate=16000";

/**
 * Manages a bidirectional WebSocket connection to the Google Gemini Multimodal Live API.
 *
 * Responsibilities:
 * 1. Opens a WebSocket to Gemini and sends the setup frame with system instruction + tools.
 * 2. Relays audio chunks from the Next.js client to Gemini.
 * 3. Relays audio responses from Gemini back to the Next.js client.
 * 4. Handles the `finalize_intake` function call by persisting data to Laravel and closing.
 */
export class GeminiRelayService {
  private ws: WebSocket | null = null;
  private readonly socket: Socket;
  private readonly context: ExtendedSessionContext;
  private readonly laravelClient: LaravelApiClient;
  private readonly sessionId: string;

  /**
   * @param socket - The Socket.io client connection (Next.js frontend).
   * @param context - The session context fetched from Laravel.
   * @param laravelClient - The Laravel API client for finalization.
   */
  constructor(
    socket: Socket,
    context: ExtendedSessionContext,
    laravelClient: LaravelApiClient,
  ) {
    this.socket = socket;
    this.context = context;
    this.laravelClient = laravelClient;
    this.sessionId = context.id;

    this.connect();
  }

  /**
   * Opens the WebSocket connection to Gemini and registers event handlers.
   */
  private connect(): void {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("[Gemini] GEMINI_API_KEY environment variable is not set.");
      this.socket.emit("error", {
        message: "Server misconfiguration: missing Gemini API key.",
      });
      return;
    }

    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    this.ws = new WebSocket(url);

    this.ws.on("open", () => this.handleOpen());
    this.ws.on("message", (data: WebSocket.Data) => this.handleMessage(data));
    this.ws.on("error", (error: Error) => this.handleError(error));
    this.ws.on("close", (code: number, reason: Buffer) =>
      this.handleClose(code, reason),
    );
  }

  /**
   * Sends the setup frame to Gemini immediately upon WebSocket open.
   *
   * The setup frame configures the model, system instruction, and available tools.
   */
  private handleOpen(): void {
    console.log(`[Gemini] WebSocket connected for session ${this.sessionId}`);

    const systemInstructionText = this.buildSystemInstruction();

    const setupMessage: GeminiSetupMessage = {
      setup: {
        model: GEMINI_MODEL,
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Puck",
              },
            },
          },
        },
        systemInstruction: {
          parts: [{ text: systemInstructionText }],
        },
        tools: [
          {
            functionDeclarations: [
              {
                name: "finalize_intake",
                description:
                  "Called when the intake meeting is complete. Saves the project summary, structured requirements, and client name to the backend.",
                parameters: {
                  type: "object",
                  properties: {
                    client_name: {
                      type: "string",
                      description: "The full name of the client.",
                    },
                    project_summary: {
                      type: "string",
                      description:
                        "A comprehensive summary of the project discussed during the intake meeting.",
                    },
                    requirements_json: {
                      type: "object",
                      description:
                        "Structured JSON object containing the extracted project requirements, features, and technical specifications.",
                    },
                  },
                  required: ["project_summary", "requirements_json"],
                },
              },
            ],
          },
        ],
      },
    };

    this.send(setupMessage);
  }

  /**
   * Processes an incoming message from Gemini.
   *
   * Handles three message types:
   * - `setupComplete`: Logs confirmation.
   * - `serverContent`: Relays audio chunks to the frontend.
   * - `toolCall`: Executes the function call against Laravel.
   */
  private handleMessage(data: WebSocket.Data): void {
    let message: GeminiServerMessage;

    try {
      message = JSON.parse(data.toString()) as GeminiServerMessage;
    } catch (parseError: unknown) {
      const errorMsg =
        parseError instanceof Error
          ? parseError.message
          : "Unknown parse error";
      console.error(
        `[Gemini] Failed to parse message for session ${this.sessionId}:`,
        errorMsg,
      );
      return;
    }

    if (message.setupComplete) {
      console.log(`[Gemini] Setup complete for session ${this.sessionId}`);
      return;
    }

    if (message.serverContent?.modelTurn?.parts) {
      this.handleAudioResponse(message.serverContent.modelTurn.parts);
      return;
    }

    if (message.toolCall) {
      this.handleToolCall(message.toolCall);
      return;
    }
  }

  /**
   * Extracts audio data from Gemini model response parts and emits to the frontend.
   */
  private handleAudioResponse(parts: GeminiPart[]): void {
    for (const part of parts) {
      if (!part.inlineData) {
        continue;
      }

      this.socket.emit("audio_chunk", {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType,
      });
    }
  }

  /**
   * Handles a Gemini function call (tool use).
   *
   * Currently supports only `finalize_intake`. Persists the extracted data to Laravel,
   * sends a tool response back to Gemini, and closes the connection cleanly.
   */
  private async handleToolCall(toolCall: GeminiToolCall): Promise<void> {
    for (const call of toolCall.functionCalls) {
      if (call.name !== "finalize_intake") {
        console.warn(`[Gemini] Unknown function call: ${call.name}`);
        continue;
      }

      console.log(
        `[Gemini] finalize_intake called for session ${this.sessionId}:`,
        call.args,
      );

      const payload: FinalizePayload = {
        client_name: (call.args.client_name as string) ?? null,
        project_summary: call.args.project_summary as string,
        requirements_json:
          (call.args.requirements_json as Record<string, unknown>) ?? {},
      };

      try {
        await this.laravelClient.finalizeSession(this.sessionId, payload);

        console.log(
          `[Gemini] Session ${this.sessionId} finalized successfully.`,
        );

        this.socket.emit("meeting_finalized", {
          message: "Intake meeting has been finalized.",
          session_id: this.sessionId,
        });

        const toolResponse: GeminiToolResponse = {
          toolResponse: {
            functionResponses: [
              {
                id: call.id,
                response: { result: "success" },
              },
            ],
          },
        };

        this.send(toolResponse);
        this.close();
      } catch (error: unknown) {
        const errorMsg = LaravelApiClient.formatError(error);
        console.error(
          `[Gemini] Failed to finalize session ${this.sessionId}:`,
          errorMsg,
        );

        this.socket.emit("error", {
          message: `Failed to finalize session: ${errorMsg}`,
        });
      }
    }
  }

  /**
   * Handles WebSocket errors from the Gemini connection.
   */
  private handleError(error: Error): void {
    console.error(
      `[Gemini] WebSocket error for session ${this.sessionId}:`,
      error.message,
    );
    this.socket.emit("error", {
      message: `Gemini connection error: ${error.message}`,
    });
  }

  /**
   * Handles WebSocket close events from the Gemini connection.
   */
  private handleClose(code: number, reason: Buffer): void {
    console.log(
      `[Gemini] WebSocket closed for session ${this.sessionId} — code: ${code}, reason: ${reason.toString()}`,
    );
    this.ws = null;
  }

  /**
   * Sends a base64-encoded audio chunk to Gemini wrapped in the realtimeInput envelope.
   *
   * @param audioBase64 - Raw PCM audio data encoded as a base64 string.
   */
  public sendAudio(audioData: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    let base64Audio = "";

    if (typeof audioData === "string") {
      base64Audio = audioData;
    } else if (Buffer.isBuffer(audioData)) {
      base64Audio = audioData.toString("base64");
    } else if (audioData instanceof ArrayBuffer) {
      base64Audio = Buffer.from(audioData).toString("base64");
    } else if (ArrayBuffer.isView(audioData)) {
      base64Audio = Buffer.from(
        audioData.buffer,
        audioData.byteOffset,
        audioData.byteLength,
      ).toString("base64");
    } else if (audioData && typeof audioData === "object") {
      // ARCHITECT FIX: Safely cast to Record to satisfy strict TypeScript rules
      const obj = audioData as Record<string, unknown>;
      const payload =
        obj.base64 ?? obj.data ?? obj.audio ?? obj.chunk ?? obj.buffer;

      if (typeof payload === "string") {
        base64Audio = payload;
      } else if (Buffer.isBuffer(payload)) {
        base64Audio = payload.toString("base64");
      } else if (payload instanceof ArrayBuffer) {
        base64Audio = Buffer.from(payload).toString("base64");
      } else if (ArrayBuffer.isView(payload)) {
        base64Audio = Buffer.from(
          payload.buffer,
          payload.byteOffset,
          payload.byteLength,
        ).toString("base64");
      }
    }

    if (!base64Audio) {
      return; // Silently drop unhandled chunks instead of crashing
    }

    const audioMessage: GeminiRealtimeInput = {
      realtimeInput: {
        audio: {
          mimeType: AUDIO_MIME_TYPE,
          data: base64Audio,
        },
      },
    };

    this.send(audioMessage);
  }

  /**
   * Cleanly closes the Gemini WebSocket connection.
   */
  public close(): void {
    if (!this.ws) {
      return;
    }

    if (
      this.ws.readyState === WebSocket.OPEN ||
      this.ws.readyState === WebSocket.CONNECTING
    ) {
      this.ws.close(1000, "Session complete");
    }

    this.ws = null;
  }

  /**
   * Serializes and sends a message to the Gemini WebSocket.
   *
   * @param message - The typed message object to send.
   */
  private send(
    message: GeminiSetupMessage | GeminiRealtimeInput | GeminiToolResponse,
  ): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn(
        `[Gemini] Cannot send — WebSocket not open for session ${this.sessionId}`,
      );
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Builds the system instruction text from the session context.
   *
   * Combines the system prompt, developer skills, and extracted document text
   * into a single instruction string for Gemini.
   */
  private buildSystemInstruction(): string {
    const sections: string[] = [];

    if (this.context.system_prompt) {
      sections.push(this.context.system_prompt);
    } else {
      sections.push(
        "You are an AI intake assistant for a software development agency. " +
          "Conduct a professional client intake meeting. Ask about the project scope, " +
          "requirements, timeline, and budget. When you have gathered enough information, " +
          "call the finalize_intake function with a comprehensive summary.",
      );
    }

    if (this.context.developer_skills) {
      sections.push(
        `\n--- Developer Skills & Expertise ---\n${this.context.developer_skills}`,
      );
    }

    if (this.context.documents && this.context.documents.length > 0) {
      sections.push("\n--- Uploaded Documents ---");

      for (const doc of this.context.documents) {
        if (!doc.extracted_text) {
          continue;
        }

        sections.push(`\n[${doc.file_name}]\n${doc.extracted_text}`);
      }
    }

    return sections.join("\n");
  }
}
