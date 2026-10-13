'use client';

import React from 'react';

export interface ConnectionCardProps {
    title?: string;
    description?: string;
    buttonText?: string;
    isLoading?: boolean;
    error?: string | null;
    onAction: () => void;
}

/**
 * Shared presentational component for initiating or resuming a WebRTC session.
 */
export const ConnectionCard: React.FC<ConnectionCardProps> = ({
    title = "Ready to Connect",
    description = "Click below to initialize your microphone and join the secure WebRTC audio stream.",
    buttonText = "Join Consultation",
    isLoading = false,
    error = null,
    onAction,
}) => {
    return (
        <article className="col-span-full flex flex-col items-center justify-center bg-neutral-900/50 border border-neutral-800 rounded-3xl p-10 text-center">
            <div className="w-16 h-16 bg-neutral-800/80 rounded-full flex items-center justify-center mb-6 border border-neutral-700/50 shadow-inner">
                <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </div>

            <h2 className="text-xl font-semibold text-neutral-100 mb-2">{title}</h2>

            <p className="text-sm text-neutral-400 max-w-md mb-8 leading-relaxed">
                {description}
            </p>

            {error && (
                <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm max-w-md w-full">
                    {error}
                </div>
            )}

            <button
                type="button"
                onClick={onAction}
                disabled={isLoading}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-full font-medium text-sm transition-all shadow-[0_0_25px_rgba(37,99,235,0.35)] flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Connecting...
                    </>
                ) : (
                    buttonText
                )}
            </button>
        </article>
    );
};