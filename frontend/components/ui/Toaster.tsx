"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Global Toaster configuration.
 * Handles the styling for all notification variants using Tailwind CSS.
 */
export const Toaster = () => {
    return (
        <SonnerToaster
            theme="dark"
            position="bottom-right"
            expand={false} // Set to true if you want them expanded by default instead of stacked
            richColors
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:bg-neutral-950 group-[.toaster]:text-neutral-100 group-[.toaster]:border-neutral-800 group-[.toaster]:shadow-2xl rounded-xl border",
                    description: "group-[.toast]:text-neutral-400 text-xs",
                    actionButton: "group-[.toast]:bg-blue-600 group-[.toast]:text-white",
                    cancelButton: "group-[.toast]:bg-neutral-800 group-[.toast]:text-neutral-400",
                    // Type-specific overrides
                    success: "group-[.toaster]:border-emerald-500/30",
                    error: "group-[.toaster]:border-red-500/30",
                    warning: "group-[.toaster]:border-amber-500/30",
                    info: "group-[.toaster]:border-blue-500/30",
                },
            }}
        />
    );
};