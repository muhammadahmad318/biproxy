import { toast } from "sonner";

/**
 * Centralized Notification Service
 * Use this to trigger snackbars across the application.
 */
export const notify = {
    success: (message: string, description?: string) => {
        toast.success(message, { description });
    },

    error: (message: string, description?: string) => {
        toast.error(message, { description });
    },

    warning: (message: string, description?: string) => {
        toast.warning(message, { description });
    },

    info: (message: string, description?: string) => {
        toast.info(message, { description });
    },

    // Useful for async operations (returns an ID to dismiss/update later)
    loading: (message: string, description?: string) => {
        return toast.loading(message, { description });
    },

    // Dismiss a specific toast by ID, or all if no ID is provided
    dismiss: (id?: string | number) => {
        toast.dismiss(id);
    },
};