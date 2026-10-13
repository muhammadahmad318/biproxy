"use client";

import React, { useRef } from "react";

export interface DynamicIslandControlsProps {
  isMuted: boolean;
  onToggleMic: () => void;
  isUploading: boolean;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  isSummaryOpen: boolean;
  onToggleSummary: () => void;
  onEndSession: () => void;
  hasSummary: boolean;
}

/**
 * Floating dynamic island providing unified meeting controls with smooth hover and active animations.
 */
export const DynamicIslandControls: React.FC<DynamicIslandControlsProps> = ({ isMuted, onToggleMic, isUploading, onUploadFile, isChatOpen, onToggleChat, isSummaryOpen, onToggleSummary, onEndSession, hasSummary, }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <nav
      aria-label="Meeting Controls"
      className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-neutral-900/85 backdrop-blur-xl border border-neutral-700/60 rounded-full shadow-lg transition-all duration-300"
    >
      {/* Microphone Control */}
      <button
        type="button"
        onClick={onToggleMic}
        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        className={`p-3 rounded-full transition-all duration-200 ${isMuted
          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white"
          }`}
      >
        {isMuted ? (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </button>

      {/* Document Upload Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        aria-label="Upload document"
        className="p-3 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white rounded-full transition-all duration-200 disabled:opacity-50"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onUploadFile}
          disabled={isUploading}
          className="hidden"
        />
        {isUploading ? (
          <svg
            className="w-5 h-5 animate-spin text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
        )}
      </button>

      {/* Handoff Report Toggle (Left Drawer) */}
      <button
        type="button"
        onClick={onToggleSummary}
        aria-label="Toggle Project Summary"
        className={`relative p-3 rounded-full transition-all duration-200 ${isSummaryOpen
          ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white"
          }`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {hasSummary && !isSummaryOpen && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-neutral-900 animate-pulse" />
        )}
      </button>

      {/* Chat / Transcript Toggle (Right Drawer) */}
      <button
        type="button"
        onClick={onToggleChat}
        aria-label="Toggle chat room"
        className={`p-3 rounded-full transition-all duration-200 ${isChatOpen
          ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white"
          }`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      <div className="w-px h-6 bg-neutral-700/80 mx-1" />

      {/* Leave / End Consultation */}
      <button
        type="button"
        onClick={onEndSession}
        aria-label="End session"
        className="px-4 py-2 bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold rounded-full transition-all duration-200 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
      >
        End Call
      </button>
    </nav>
  );
};
