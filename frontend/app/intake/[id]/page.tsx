"use client";

import { useEffect, useState, use, useRef } from "react";
import { intakeService } from "@/services/intakeService";
import { useLiveSession } from "@/hooks/useLiveSession";
import { SessionData } from "@/types/api";
import { ParticipantTile } from "@/components/meeting/ParticipantTile";
import { DynamicIslandControls } from "@/components/meeting/DynamicIslandControls";
import { HandoffDrawer } from "@/components/meeting/HandoffDrawer";
import { ChatDrawer } from "@/components/meeting/ChatDrawer";
import { ConnectionCard } from "@/components/meeting/ConnectionCard";
import { notify } from "@/utils/toastService";

export default function IntakePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;

  // Session & Verification State
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI Interactive States
  const [uploading, setUploading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [pinnedParticipant, setPinnedParticipant] = useState<"ai" | "client" | null>(null);

  // Sign-Off & Approval States
  const [email, setEmail] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  const [hasManuallyEnded, setHasManuallyEnded] = useState(false);

  const { connectionState, aiSummary, isSpeaking, isMuted, toggleMute, startSession, stopSession, sendTextMessage } = useLiveSession(id);
  const currentState = connectionState || "idle";

  // Load and Verify Intake Session from Laravel Core
  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      try {
        const response = await intakeService.verifySession(id);

        if (!isMounted) return;

        const responseObj = response as unknown as { data?: SessionData };
        const payload = responseObj.data ? responseObj.data : response;

        setSession(payload);

        if (payload.status !== "active" && payload.status !== "pending_approval") {
          setError("This link is invalid or expired.");
        }
      } catch {
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

  // ARCHITECT FIX: Autonomously start the WebRTC session once Laravel validates the ID.
  const hasAutoStarted = useRef(false);

  useEffect(() => {
    if (session && currentState === "idle" && !hasAutoStarted.current) {
      hasAutoStarted.current = true;

      const sessionKey = `intake_started_${session.id}`;
      const hasAlreadyStarted = sessionStorage.getItem(sessionKey);

      if (!hasAlreadyStarted) {
        // First time entering this specific room from the landing page
        sessionStorage.setItem(sessionKey, "true");
        startSession();
      }
      // If it HAS already started (meaning this is a page refresh), 
      // we intentionally do nothing. The UI will remain "idle" and display the resume card.
    }
  }, [session, currentState, startSession]);

  const hasDrafted = useRef(false);

  useEffect(() => {
    if (aiSummary && !hasDrafted.current) {
      hasDrafted.current = true;

      const timer = setTimeout(() => {
        setIsChatOpen(false); // Close chat
        setIsSummaryOpen(true); // Open handoff
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [aiSummary]);

  const handleStartSession = () => {
    setHasManuallyEnded(false);
    startSession();
  };

  const handleEndCall = () => {
    stopSession();
    setIsChatOpen(false);
    setHasManuallyEnded(true);
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use a loading toast for the async operation
    const toastId = notify.loading("Uploading document...", "Extracting context for the AI.");
    setUploading(true);

    try {
      const response = await intakeService.uploadDocument(id, file);

      if (currentState === "connected" && response.extracted_text) {
        const systemPrompt = `[SYSTEM AWARENESS]: The user just uploaded a document named "${file.name}". Here is the complete extracted text from the document:\n\n---\n${response.extracted_text}\n---\n\nPlease verbally acknowledge that you received and read the document, and briefly ask if they would like to discuss its specific contents.`;
        sendTextMessage(systemPrompt, false);
      }

      // Dismiss loading state and show success
      notify.dismiss(toastId);
      notify.success("Document Uploaded", `${file.name} has been processed.`);
    } catch {
      notify.dismiss(toastId);
      notify.error("Upload Failed", "There was an error processing your document.");
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (editedSummary: string, editedRequirements: string) => {
    if (!email) {
      notify.warning("Email Required", "Please enter an email address to sign off.");
      return;
    }

    const toastId = notify.loading("Submitting specifications...", "Finalizing your intake room.");
    setApprovalLoading(true);

    try {
      await intakeService.approveSession(id, email, editedSummary, editedRequirements);
      setApproved(true);
      stopSession();

      notify.dismiss(toastId);
      notify.success("Consultation Approved", "Your requirements have been saved.");
    } catch {
      notify.dismiss(toastId);
      notify.error("Approval Failed", "We could not save your specifications.");
    } finally {
      setApprovalLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-400">
        <p className="animate-pulse text-sm font-medium">
          Initializing Virtual Intake Room...
        </p>
      </main>
    );
  }

  if (error || !session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl max-w-sm w-full text-center">
          <h1 className="text-xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-sm text-neutral-400">{error}</p>
        </div>
      </main>
    );
  }

  if (approved) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl max-w-md w-full text-center">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-100 mb-2">Submission Confirmed</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Your technical intake specifications have been approved and saved to the CRM.
          </p>
        </div>
      </main>
    );
  }

  return (
    // 1. Strict Viewport Height (h-screen)
    <main className="h-dvh w-full bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden p-4 md:p-6 gap-4">

      {/* 2. HEADER - Fixed Height */}
      <header className="flex-none flex items-center justify-between px-2 z-10">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-neutral-200">
            DEVPROXY AI • Virtual Intake Room
          </h1>
          <p className="text-xs text-neutral-500">
            {session.client_name ? `Consultation for ${session.client_name}` : "Discovery Call"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${currentState === "connected" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
              }`}
          />
          <span className="text-xs text-neutral-400 capitalize">{currentState}</span>
        </div>
      </header>

      {/* 3. MIDDLE WORKSPACE - Dynamic Height (flex-1 + min-h-0 prevents overflow) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 max-w-350 mx-auto w-full min-h-0 relative">

        {/* Modal Overlay for Handoff */}
        <HandoffDrawer
          isOpen={isSummaryOpen}
          onClose={() => setIsSummaryOpen(false)}
          summary={aiSummary}
          email={email}
          onEmailChange={setEmail}
          onApprove={handleApprove}
          isApproving={approvalLoading}
        />

        {/* Video Grid */}
        {currentState === "idle" ? (
          <section className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl mx-auto w-full mb-20">

            <ConnectionCard
              title={hasManuallyEnded ? "Consultation Ended" : "Resume Consultation"}
              description={
                hasManuallyEnded
                  ? "You have successfully disconnected from the secure room. You can rejoin whenever you are ready."
                  : "Your session was interrupted or paused. Click below to reconnect your microphone and resume."
              }
              buttonText={hasManuallyEnded ? "Rejoin Consultation" : "Resume Session"}
              onAction={handleStartSession}
            />
          </section>
        ) : (
          <section
            className={`flex-1 grid gap-4 transition-all duration-300 ease-in-out min-h-0
              ${isChatOpen
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 lg:grid-rows-1'
                : 'grid-cols-1 md:grid-cols-2 md:grid-rows-1'
              }`}
          >
            <>
              {pinnedParticipant !== "client" && (
                <ParticipantTile
                  name="DEVPROXY AI"
                  role="Technical Sales Lead"
                  initials="AI"
                  isSpeaking={isSpeaking}
                  isPinned={pinnedParticipant === "ai"}
                  onTogglePin={() => setPinnedParticipant((prev) => (prev === "ai" ? null : "ai"))}
                  accentColor="blue"
                />
              )}

              {pinnedParticipant !== "ai" && (
                <ParticipantTile
                  name={session.client_name || "Client Attendee"}
                  role="Lead Client"
                  initials={session.client_name ? session.client_name.substring(0, 2).toUpperCase() : "ME"}
                  isSpeaking={!isSpeaking && currentState === "connected" && !isMuted}
                  isPinned={pinnedParticipant === "client"}
                  onTogglePin={() => setPinnedParticipant((prev) => (prev === "client" ? null : "client"))}
                  accentColor="emerald"
                />
              )}
            </>
          </section>
        )}

        {/* Chat Drawer seamlessly locked in the grid */}
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          sessionTitle={session.client_name || "Technical Consultation"}
          onSendMessage={sendTextMessage}
          isConnected={currentState === "connected"}
        />
      </div>

      {/* 4. FOOTER - Fixed Height (Never overlays grid) */}
      {currentState !== "idle" && (
        <footer className={`flex-none flex justify-center pb-2 ${isChatOpen ? 'hidden lg:flex' : ''}`}>
          <DynamicIslandControls
            isMuted={isMuted}
            onToggleMic={toggleMute}
            isUploading={uploading}
            onUploadFile={handleFileUpload}
            isChatOpen={isChatOpen}
            onToggleChat={() => setIsChatOpen((prev) => !prev)}
            isSummaryOpen={isSummaryOpen}
            onToggleSummary={() => setIsSummaryOpen((prev) => !prev)}
            onEndSession={handleEndCall}
            hasSummary={Boolean(aiSummary)}
          />
        </footer>
      )}


    </main>
  );
}