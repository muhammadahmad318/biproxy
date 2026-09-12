<?php

declare(strict_types=1);

namespace App\Actions;

use App\Models\IntakeSession;

/**
 * Persists the AI-generated summary, requirements, and client name onto an intake session.
 *
 * Single-responsibility: hydrates the session with finalized data from the realtime relay.
 * This action does NOT change the session status — that transition occurs when the
 * client approves via the public endpoint.
 */
class FinalizeIntakeSessionAction
{
    /**
     * Execute the finalize mutation.
     *
     * @param IntakeSession              $session  The session to finalize.
     * @param string                     $summary  The AI-generated project summary.
     * @param array<string, mixed>       $requirements The structured requirements extracted by AI.
     * @param string|null                $clientName   The client's name (optional).
     *
     * @return IntakeSession The freshly persisted session instance.
     */
    public function execute(
        IntakeSession $session,
        string $summary,
        array $requirements,
        ?string $clientName,
    ): IntakeSession {
        $session->project_summary = $summary;
        $session->requirements_json = $requirements;
        $session->client_name = $clientName;

        $session->save();

        return $session->fresh();
    }
}
