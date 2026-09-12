import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { intakeService } from '../services/intakeService';
import { AISummary } from '../types/api';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'finalized' | 'error';

export const useLiveSession = (sessionId: string) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);

  // Helper to convert Int16Array to Base64
  const int16ToBase64 = (int16Array: Int16Array): string => {
    let binary = '';
    const bytes = new Uint8Array(int16Array.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const cleanup = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const startSession = useCallback(async () => {
    if (!sessionId) return;
    setConnectionState('connecting');

    try {
      // 1. Setup Socket
      const socket = io(process.env.NEXT_PUBLIC_NODE_RELAY_URL as string, {
        query: { sessionId },
        transports: ['websocket'],
      });
      socketRef.current = socket;

      // 2. Setup Audio Playback Context
      playbackContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      socket.on('connect', () => {
        // Socket connected, wait for server_ready
      });

      socket.on('server_ready', () => {
        setConnectionState('connected');
      });

      socket.on('audio_chunk', async (data: { base64: string }) => {
        if (!playbackContextRef.current) return;
        setIsSpeaking(true);
        try {
          const binaryString = window.atob(data.base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // Assuming the incoming audio from Gemini is also raw PCM 16kHz or something we can decode
          // Actually, if it's raw PCM we might need to play it directly, but typically it comes as wav/mp3.
          // Let's decode it natively if possible.
          const audioBuffer = await playbackContextRef.current.decodeAudioData(bytes.buffer);
          const source = playbackContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(playbackContextRef.current.destination);
          
          source.onended = () => {
            setIsSpeaking(false);
          };
          
          source.start();
        } catch (err) {
          console.error('Error playing audio chunk', err);
          setIsSpeaking(false);
        }
      });

      socket.on('meeting_finalized', async () => {
        cleanup();
        setConnectionState('finalized');
        try {
          const session = await intakeService.verifySession(sessionId);
          if (session.project_summary && session.requirements_json) {
            setAiSummary({
              project_summary: session.project_summary,
              requirements_json: session.requirements_json,
            });
          }
        } catch (error) {
          console.error('Error fetching final summary', error);
          setConnectionState('error');
        }
      });

      socket.on('disconnect', () => {
        if (connectionState !== 'finalized') {
          // Could handle unexpected disconnects
        }
      });

      socket.on('error', () => {
        setConnectionState('error');
      });

      // 3. Setup Audio Capture (16kHz Raw PCM)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      // createScriptProcessor is deprecated but effectively required for MVP if no AudioWorklet is set up
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!socketRef.current || socketRef.current.disconnected) return;
        
        const float32Array = e.inputBuffer.getChannelData(0);
        const int16Array = new Int16Array(float32Array.length);

        // Convert float32 [-1.0, 1.0] to int16 [-32768, 32767]
        for (let i = 0; i < float32Array.length; i++) {
          const s = Math.max(-1, Math.min(1, float32Array[i]));
          int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        const base64Audio = int16ToBase64(int16Array);
        socketRef.current.emit('client_audio', { base64: base64Audio });
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

    } catch (error) {
      console.error('Error starting live session', error);
      setConnectionState('error');
      cleanup();
    }
  }, [sessionId, cleanup, connectionState]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    connectionState,
    aiSummary,
    isSpeaking,
    startSession,
  };
};
