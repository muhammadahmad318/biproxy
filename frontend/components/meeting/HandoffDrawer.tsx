"use client";

import React, { useState, useEffect } from "react";
import { AISummary } from "../../types/api";

export interface HandoffDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  summary: AISummary | null;
  email: string;
  onEmailChange: (value: string) => void;
  onApprove: (editedSummary: string, editedRequirements: string) => void;
  isApproving: boolean;
}

export const HandoffDrawer: React.FC<HandoffDrawerProps> = ({
  isOpen,
  onClose,
  summary,
  email,
  onEmailChange,
  onApprove,
  isApproving,
}) => {
  // Local state for real-time editing
  const [localSummary, setLocalSummary] = useState("");
  const [localRequirements, setLocalRequirements] = useState("");
  const [prevSummary, setPrevSummary] = useState<AISummary | null>(null);


  if (summary !== prevSummary) {
    setPrevSummary(summary);
    setLocalSummary(summary?.project_summary || "");
    setLocalRequirements(
      summary?.requirements_json
        ? JSON.stringify(summary.requirements_json, null, 2)
        : ""
    );
  }

  return (
    <aside
      className={`bg-neutral-950 lg:bg-neutral-900/80 border-neutral-800 flex flex-col overflow-hidden transition-all duration-300 ease-in-out z-50 lg:z-auto ${isOpen
        ? "fixed inset-0 w-full h-[100dvh] rounded-none border-0 opacity-100 translate-x-0 lg:relative lg:h-full lg:w-[450px] lg:flex-none lg:rounded-3xl lg:border lg:mr-4"
        : "fixed inset-0 w-full h-[100dvh] rounded-none border-0 opacity-0 pointer-events-none -translate-x-full lg:relative lg:h-full lg:w-0 lg:translate-x-0 lg:m-0 lg:p-0"
        }`}
    >
      <header className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/90 w-full lg:w-[450px] whitespace-nowrap">
        <div>
          <h2 className="text-sm font-bold text-neutral-100">Intake Handoff Report</h2>
          <p className="text-[10px] text-neutral-400">Review & edit project scope</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close summary panel"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <section className="flex-1 overflow-y-auto p-5 w-full lg:w-[450px]">
        {summary ? (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Executive Summary
              </label>
              <textarea
                value={localSummary}
                onChange={(e) => setLocalSummary(e.target.value)}
                className="w-full h-40 text-sm text-neutral-200 bg-neutral-950 p-4 rounded-xl border border-neutral-700/50 leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Identified Tech Stack & Requirements
              </label>
              <textarea
                value={localRequirements}
                onChange={(e) => setLocalRequirements(e.target.value)}
                className="w-full h-64 text-xs font-mono text-emerald-400 bg-neutral-950 p-4 rounded-xl border border-neutral-700/50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500">
            <svg className="w-8 h-8 mb-3 opacity-50 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-neutral-400">Awaiting AI Finalization...</p>
            <p className="text-[10px] mt-1 max-w-[200px]">
              The drafted proposal will appear here once the AI ends its intake phase.
            </p>
          </div>
        )}
      </section>

      {summary && (
        <footer className="p-5 border-t border-neutral-800 bg-neutral-900/90 space-y-3 w-full lg:w-[450px]">
          <div>
            <label htmlFor="client-email" className="block text-xs font-medium text-neutral-300 mb-1">
              Sign-Off Email
            </label>
            <input
              id="client-email"
              type="email"
              required
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="client@company.com"
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => onApprove(localSummary, localRequirements)}
            disabled={isApproving || !email}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-all shadow-lg"
          >
            {isApproving ? "Submitting Sign-Off..." : "Approve & Submit Specifications"}
          </button>
        </footer>
      )}
    </aside>
  );
};