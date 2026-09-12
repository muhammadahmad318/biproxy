import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { LaravelApiClient } from './services/LaravelApiClient';
import { GeminiRelayService, ExtendedSessionContext } from './services/GeminiRelayService';

/**
 * DEVPROXY AI — Real-Time Relay Server
 *
 * Responsibilities:
 * 1. Accept Socket.io connections from the frontend client.
 * 2. Fetch session context from Laravel on connection.
 * 3. Open a bidirectional WebSocket to Google Gemini Live API.
 * 4. Relay audio between the Next.js client and Gemini.
 */

const PORT = parseInt(process.env.PORT ?? '3001', 10);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

/**
 * Health check endpoint for monitoring and load balancer probes.
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Handles a new Socket.io client connection.
 *
 * Flow:
 * 1. Extract and validate sessionId from handshake query.
 * 2. Fetch session context from Laravel.
 * 3. Emit `server_ready` with the context on success.
 * 4. Open the Gemini relay and bind audio/disconnect events.
 * 5. Emit `error` and disconnect on failure.
 */
io.on('connection', async (socket: Socket) => {
  const sessionId = socket.handshake.query.sessionId;

  if (!sessionId || typeof sessionId !== 'string') {
    socket.emit('error', { message: 'Missing or invalid sessionId.' });
    socket.disconnect(true);
    return;
  }

  console.log(`[Socket.io] Client connected — session: ${sessionId}`);

  const apiClient = new LaravelApiClient();
  let geminiService: GeminiRelayService | null = null;

  try {
    const context = await apiClient.getContext(sessionId) as ExtendedSessionContext;

    console.log(`[Socket.io] Context loaded for session ${sessionId}:`, context);

    socket.emit('server_ready', { session: context });

    // Initialize the Gemini relay — opens the WebSocket and sends the setup frame.
    geminiService = new GeminiRelayService(socket, context, apiClient);
  } catch (error: unknown) {
    const errorMessage = LaravelApiClient.formatError(error);

    console.error(`[Socket.io] Failed to load context for session ${sessionId}:`, errorMessage);

    socket.emit('error', { message: errorMessage });
    socket.disconnect(true);
    return;
  }

  /**
   * Relay audio from the Next.js client to Gemini.
   * The client sends base64-encoded PCM audio chunks.
   */
  socket.on('client_audio', (data: string) => {
    if (!geminiService) {
      return;
    }

    geminiService.sendAudio(data);
  });

  /**
   * Clean up the Gemini WebSocket when the client disconnects.
   */
  socket.on('disconnect', (reason: string) => {
    console.log(`[Socket.io] Client disconnected — session: ${sessionId}, reason: ${reason}`);

    if (geminiService) {
      geminiService.close();
      geminiService = null;
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Realtime] Server listening on port ${PORT}`);
});
