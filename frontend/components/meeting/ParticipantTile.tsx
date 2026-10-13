"use client";

import React from "react";

export interface ParticipantTileProps {
  name: string;
  role: string;
  initials: string;
  isSpeaking: boolean;
  isPinned: boolean;
  onTogglePin: () => void;
  accentColor?: "blue" | "emerald";
}

/**
 * Presentational participant tile representing a call attendee.
 * Features smooth border glow animation upon speech detection and pin morphing.
 */
export const ParticipantTile: React.FC<ParticipantTileProps> = ({
  name,
  role,
  initials,
  isSpeaking,
  isPinned,
  onTogglePin,
  accentColor = "blue",
}) => {
  const glowStyles =
    accentColor === "emerald"
      ? "border-emerald-500/70 shadow-[0_0_35px_rgba(16,185,129,0.25)] ring-2 ring-emerald-500/40"
      : "border-blue-500/70 shadow-[0_0_35px_rgba(59,130,246,0.25)] ring-2 ring-blue-500/40";

  return (
    <article
      onClick={onTogglePin}
      className={`relative flex flex-col items-center justify-center rounded-3xl cursor-pointer select-none transition-all duration-300 ease-out overflow-hidden border w-full h-full min-h-0 ${isSpeaking ? glowStyles : "border-neutral-800 bg-neutral-900/60"
        } ${isPinned ? "col-span-full row-span-full z-10" : ""}`}
    >
      {/* Background Ambience on Voice Activity */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${isSpeaking
            ? accentColor === "emerald"
              ? "bg-gradient-to-b from-emerald-500/10 to-transparent opacity-100"
              : "bg-gradient-to-b from-blue-500/10 to-transparent opacity-100"
            : "opacity-0"
          }`}
      />

      {/* Avatar Node */}
      <div className="relative flex items-center justify-center">
        {/* Animated Outer Voice Ring */}
        <div
          className={`absolute rounded-full transition-all duration-300 ${isPinned ? "w-36 h-36" : "w-24 h-24"
            } ${isSpeaking
              ? `${accentColor === "emerald"
                ? "bg-emerald-500/20"
                : "bg-blue-500/20"
              } scale-125 animate-pulse`
              : "scale-100 opacity-0"
            }`}
        />

        {/* Stable Avatar Container */}
        <div
          className={`relative rounded-full flex items-center justify-center font-bold text-neutral-100 bg-neutral-800 border border-neutral-700 shadow-inner z-10 transition-transform duration-300 ${isPinned ? "w-28 h-28 text-3xl" : "w-20 h-20 text-xl"
            }`}
        >
          {initials}
        </div>
      </div>

      {/* Participant Metadata & Badges */}
      <footer className="absolute bottom-5 left-5 right-5 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 bg-neutral-950/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-800">
          <span
            className={`w-2 h-2 rounded-full transition-colors ${isSpeaking
                ? accentColor === "emerald"
                  ? "bg-emerald-400 animate-ping"
                  : "bg-blue-400 animate-ping"
                : "bg-neutral-500"
              }`}
          />
          <p className="text-xs font-medium text-neutral-200">{name}</p>
          <span className="text-[10px] text-neutral-400 font-mono">
            ({role})
          </span>
        </div>

        {isPinned && (
          <span className="bg-neutral-950/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-neutral-800 text-[10px] text-neutral-300">
            Pinned
          </span>
        )}
      </footer>
    </article>
  );
};
