"use client";

import { useEffect, useState, use } from "react";
import { intakeService } from "../../../services/intakeService";
import { useLiveSession } from "../../../hooks/useLiveSession";
import { SessionData } from "../../../types/api";

export default function IntakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [email, setEmail] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  const { connectionState, aiSummary, isSpeaking, startSession } =
    useLiveSession(id);

  // ARCHITECT FIX: Force a fallback state so the UI never goes blank if the hook delays.
  const currentState = connectionState || "idle";
  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      try {
        const response = await intakeService.verifySession(id);
        if (!isMounted) return;

        // ARCHITECT FIX: ESLint-compliant way to unwrap Laravel's data envelope.
        // We cast to unknown first, then to a type that optionally contains our SessionData.
        const responseObj = response as unknown as { data?: SessionData };
        const payload = responseObj.data ? responseObj.data : response;

        setSession(payload);

        if (
          payload.status !== "active" &&
          payload.status !== "pending_approval"
        ) {
          setError("This link is invalid or expired.");
        }
      } catch (err) {
        if (isMounted) setError("Invalid or Expired Link.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSession();
    return () => {
      isMounted = false;
    };
  }, [id]);
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await intakeService.uploadDocument(id, file);
      alert("File uploaded successfully!");
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async () => {
    if (!email) {
      alert("Please enter an email address.");
      return;
    }
    setApprovalLoading(true);
    try {
      await intakeService.approveSession(id, email);
      setApproved(true);
    } catch (err) {
      console.error("Approval failed", err);
      alert("Failed to approve session.");
    } finally {
      setApprovalLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 animate-pulse">Loading session...</p>
      </main>
    );
  }

  if (error || !session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </main>
    );
  }

  if (approved) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center max-w-md w-full">
          <h1 className="text-3xl font-bold text-green-500 mb-4">Thank You!</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your consultation has been successfully approved and submitted.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 p-6 md:p-12">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Client Intake Session
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {session.client_name
            ? `Welcome, ${session.client_name}`
            : "Welcome to your consultation"}
        </p>
      </header>

      <section className="flex-1 flex flex-col max-w-3xl mx-auto w-full gap-8">
        {currentState === "idle" && (
          <article className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm text-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Ready to begin?
            </h2>
            <button
              onClick={startSession}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
            >
              Start Consultation
            </button>
          </article>
        )}

        {(currentState === "connecting" || currentState === "connected") && (
          <article className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm flex flex-col items-center">
            <div
              className={`w-32 h-32 rounded-full mb-6 flex items-center justify-center ${
                currentState === "connecting"
                  ? "bg-yellow-100 animate-pulse"
                  : isSpeaking
                    ? "bg-blue-100 animate-bounce"
                    : "bg-green-100"
              }`}
            >
              <span
                className={`text-4xl ${isSpeaking ? "text-blue-600" : "text-green-600"}`}
              >
                🎤
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-8 font-medium">
              {currentState === "connecting"
                ? "Connecting to AI..."
                : "Session is live. You can speak now."}
            </p>

            <div className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Need to upload a document?
              </p>
              <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors inline-block">
                {uploading ? "Uploading..." : "Choose File"}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </article>
        )}

        {currentState === "finalized" && aiSummary && (
          <article className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Project Summary
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-8">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {aiSummary.project_summary}
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Finalize Submission
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleApprove}
                  disabled={approvalLoading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  {approvalLoading ? "Submitting..." : "Approve & Submit"}
                </button>
              </div>
            </div>
          </article>
        )}

        {currentState === "error" && (
          <article className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 shadow-sm text-center border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 font-medium">
              A connection error occurred. Please refresh the page and try
              again.
            </p>
          </article>
        )}
      </section>
    </main>
  );
}
