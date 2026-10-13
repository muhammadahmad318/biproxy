import { useState, useEffect, useRef, useCallback, useMemo, Dispatch, SetStateAction } from "react";
import { io, Socket } from "socket.io-client";
import { intakeService } from "../services/intakeService";
import { AISummary } from "../types/api";

export type ConnectionState = "idle" | "connecting" | "connected" | "finalized" | "error";

interface SessionRefs {
  socket: React.RefObject<Socket | null>;
  audioContext: React.RefObject<AudioContext | null>;
  mediaStream: React.RefObject<MediaStream | null>;
  worklet: React.RefObject<AudioWorkletNode | null>;
  playbackContext: React.RefObject<AudioContext | null>;
  nextPlaybackTime: React.RefObject<number>;
  isMuted: React.RefObject<boolean>;
  activeNodes: React.RefObject<Set<AudioBufferSourceNode>>;
  isUserSpeaking: React.RefObject<boolean>; // ARCHITECT FIX: Track exact user vocal state
}

interface SessionSetters {
  setConnectionState: Dispatch<SetStateAction<ConnectionState>>;
  setAiSummary: Dispatch<SetStateAction<AISummary | null>>;
  setIsSpeaking: Dispatch<SetStateAction<boolean>>;
  setIsMuted: Dispatch<SetStateAction<boolean>>;
}

interface MeetingFinalizedPayload {
  session_id: string;
  message?: string;
  summaryData?: AISummary;
}

const int16ToBase64 = (int16Array: Int16Array): string => {
  let binary = "";
  const bytes = new Uint8Array(int16Array.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const processRemoteAudioChunk = (
  payload: { data: string; mimeType: string },
  refs: SessionRefs,
  setters: SessionSetters
): void => {
  const playbackContext = refs.playbackContext.current;
  if (!playbackContext) return;

  setters.setIsSpeaking(true);

  try {
    const binaryString = window.atob(payload.data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);

    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = playbackContext.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = playbackContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(playbackContext.destination);

    const currentTime = playbackContext.currentTime;
    if (refs.nextPlaybackTime.current !== null && refs.nextPlaybackTime.current < currentTime) {
      refs.nextPlaybackTime.current = currentTime + 0.5;
    }

    source.start(refs.nextPlaybackTime.current as number);
    refs.activeNodes.current?.add(source);

    if (refs.nextPlaybackTime.current !== null) {
      refs.nextPlaybackTime.current += audioBuffer.duration;
    }

    source.onended = () => {
      refs.activeNodes.current?.delete(source);
      if (
        refs.nextPlaybackTime.current !== null &&
        playbackContext.currentTime >= refs.nextPlaybackTime.current - 0.1
      ) {
        setters.setIsSpeaking(false);
      }
    };
  } catch (err) {
    console.error("Audio chunk playback failed", err);
    setters.setIsSpeaking(false);
  }
};

const handleUserBargeIn = (refs: SessionRefs, setters: SessionSetters): void => {
  if (refs.activeNodes.current) {
    refs.activeNodes.current.forEach((node) => {
      try { node.stop(); } catch (e) { }
    });
    refs.activeNodes.current.clear();
  }

  if (refs.playbackContext.current) {
    refs.nextPlaybackTime.current = refs.playbackContext.current.currentTime;
  }
  setters.setIsSpeaking(false);
};

const processLocalMicrophoneData = (float32Array: Float32Array, refs: SessionRefs): void => {
  const socket = refs.socket.current;
  if (!socket || socket.disconnected || refs.isMuted.current) return;

  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  socket.emit("client_audio", { base64: int16ToBase64(int16Array) });
};

const fetchFinalizedSummary = async (sessionId: string, setters: SessionSetters): Promise<void> => {
  try {
    const session = await intakeService.verifySession(sessionId);
    if (session.project_summary && session.requirements_json) {
      setters.setAiSummary({
        project_summary: session.project_summary,
        requirements_json: session.requirements_json,
      });
    }
  } catch (error) {
    console.error("Summary fetch failed", error);
    setters.setConnectionState("error");
  }
};

const releaseResources = (refs: SessionRefs): void => {
  refs.nextPlaybackTime.current = 0;
  refs.isUserSpeaking.current = false;

  if (refs.activeNodes.current) {
    refs.activeNodes.current.forEach((node) => {
      try { node.stop(); } catch (e) { }
    });
    refs.activeNodes.current.clear();
  }

  if (refs.worklet.current) {
    refs.worklet.current.disconnect();
    refs.worklet.current.port.close();
    refs.worklet.current = null;
  }
  if (refs.mediaStream.current) {
    refs.mediaStream.current.getTracks().forEach((track) => track.stop());
    refs.mediaStream.current = null;
  }
  if (refs.audioContext.current && refs.audioContext.current.state !== "closed") {
    refs.audioContext.current.close().catch(() => { });
    refs.audioContext.current = null;
  }
  if (refs.playbackContext.current && refs.playbackContext.current.state !== "closed") {
    refs.playbackContext.current.close().catch(() => { });
    refs.playbackContext.current = null;
  }
  if (refs.socket.current) {
    refs.socket.current.disconnect();
    refs.socket.current = null;
  }
};

const toggleHardwareMute = (refs: SessionRefs, setters: SessionSetters): void => {
  const nextMuted = !refs.isMuted.current;
  refs.isMuted.current = nextMuted;
  setters.setIsMuted(nextMuted);

  if (refs.mediaStream.current) {
    refs.mediaStream.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
  }
};

const bindSocketEvents = (socket: Socket, sessionId: string, refs: SessionRefs, setters: SessionSetters): void => {
  socket.on("server_ready", () => setters.setConnectionState("connected"));
  socket.on("error", () => setters.setConnectionState("error"));

  socket.on("audio_chunk", (payload: { data: string; mimeType: string }) => {
    processRemoteAudioChunk(payload, refs, setters);
  });

  socket.on("meeting_finalized", (payload: MeetingFinalizedPayload) => {
    // ARCHITECT FIX: Instantly hydrate the UI using the typed payload from the WebSocket
    if (payload.summaryData) {
      setters.setAiSummary({
        project_summary: payload.summaryData.project_summary,
        requirements_json: payload.summaryData.requirements_json,
      });
    }
  });
  socket.on("backend_error", (data: { message: string }) => {
    console.error("Backend Error:", data.message);
    alert("Laravel rejected the AI data: " + data.message);
  });
};

const initializeHardware = async (refs: SessionRefs, AudioContextClass: typeof AudioContext, setters: SessionSetters): Promise<void> => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
    }
  });

  refs.mediaStream.current = stream;

  const audioContext = new AudioContextClass({ sampleRate: 16000 });
  refs.audioContext.current = audioContext;
  const source = audioContext.createMediaStreamSource(stream);

  const workletCode = `
    class PCMProcessor extends AudioWorkletProcessor {
      constructor() {
        super();
        this.isSpeaking = false;
        this.activeFrames = 0;
        this.silenceFrames = 0;
      }
      
      process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input && input.length > 0) {
          const channelData = input[0];
          this.port.postMessage({ type: 'audio', data: channelData });

          let sum = 0;
          for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
          }
          const rms = Math.sqrt(sum / channelData.length);

          if (rms > 0.08) { 
             this.silenceFrames = 0;
             this.activeFrames++;
             
             if (!this.isSpeaking && this.activeFrames > 30) {
                this.isSpeaking = true;
                this.port.postMessage({ type: 'speech_started' });
             }
          } else {
             this.activeFrames = 0;
             this.silenceFrames++;
             
             // ARCHITECT FIX: Emit speech_ended after ~800ms of hardware silence
             if (this.isSpeaking && this.silenceFrames > 100) {
                this.isSpeaking = false;
                this.port.postMessage({ type: 'speech_ended' });
             }
          }
        }
        return true;
      }
    }
    registerProcessor("pcm-processor", PCMProcessor);
  `;
  const blob = new Blob([workletCode], { type: "application/javascript" });
  const workletUrl = URL.createObjectURL(blob);

  await audioContext.audioWorklet.addModule(workletUrl);
  const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
  refs.worklet.current = workletNode;

  workletNode.port.onmessage = (e: MessageEvent) => {
    if (e.data.type === 'audio') {
      processLocalMicrophoneData(e.data.data, refs);
    } else if (e.data.type === 'speech_started') {
      refs.isUserSpeaking.current = true;
      handleUserBargeIn(refs, setters);
    } else if (e.data.type === 'speech_ended') {
      refs.isUserSpeaking.current = false;
    }
  };

  source.connect(workletNode);
  workletNode.connect(audioContext.destination);
};

const initializeLiveSession = async (sessionId: string, refs: SessionRefs, setters: SessionSetters): Promise<void> => {
  setters.setConnectionState("connecting");

  try {
    const socket = io(process.env.NEXT_PUBLIC_NODE_RELAY_URL as string, {
      query: { sessionId },
      transports: ["websocket"],
    });
    refs.socket.current = socket;

    const SafariWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextClass = window.AudioContext || SafariWindow.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("Web Audio API is not supported in this browser");
    }

    refs.playbackContext.current = new AudioContextClass();

    bindSocketEvents(socket, sessionId, refs, setters);
    await initializeHardware(refs, AudioContextClass, setters);

  } catch (error) {
    console.error("Live session initialization failed", error);
    setters.setConnectionState("error");
    releaseResources(refs);
  }
};

export const useLiveSession = (sessionId: string) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextPlaybackTimeRef = useRef<number>(0);
  const isMutedRef = useRef<boolean>(false);
  const activeNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isUserSpeakingRef = useRef<boolean>(false);

  const refs = useMemo<SessionRefs>(() => ({
    socket: socketRef,
    audioContext: audioContextRef,
    mediaStream: mediaStreamRef,
    worklet: workletRef,
    playbackContext: playbackContextRef,
    nextPlaybackTime: nextPlaybackTimeRef,
    isMuted: isMutedRef,
    activeNodes: activeNodesRef,
    isUserSpeaking: isUserSpeakingRef,
  }), []);

  const setters = useMemo<SessionSetters>(() => ({
    setConnectionState,
    setAiSummary,
    setIsSpeaking,
    setIsMuted,
  }), []);

  const cleanup = useCallback(() => releaseResources(refs), [refs]);
  const toggleMute = useCallback(() => toggleHardwareMute(refs, setters), [refs, setters]);

  const stopSession = useCallback(() => {
    cleanup();
    setConnectionState("idle");
  }, [cleanup]);

  const startSession = useCallback(async () => {
    if (!sessionId || connectionState !== "idle") return;
    await initializeLiveSession(sessionId, refs, setters);
  }, [sessionId, connectionState, refs, setters]);

  // ARCHITECT FIX: Smart Modality Synchronization
  const sendTextMessage = useCallback((text: string, forceTurnComplete?: boolean) => {
    const socket = refs.socket.current;
    if (socket && !socket.disconnected) {

      // If the user is actively speaking, silently inject the text into the context window.
      // Gemini will process the combined text + audio input when the user finishes their sentence.
      const turnComplete = forceTurnComplete !== undefined
        ? forceTurnComplete
        : !refs.isUserSpeaking.current;

      socket.emit("client_text", { text, turnComplete });
    }
  }, [refs]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    connectionState,
    aiSummary,
    isSpeaking,
    isMuted,
    toggleMute,
    startSession,
    stopSession,
    sendTextMessage,
    fetchFinalizedSummary
  };
};