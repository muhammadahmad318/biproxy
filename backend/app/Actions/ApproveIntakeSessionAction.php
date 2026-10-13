<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\SessionStatus;
use App\Models\IntakeSession;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Executes the client approval state transition on an intake session.
 *
 * Single-responsibility: validates the current state, applies the approval
 * mutation, and persists the updated session.
 */
class ApproveIntakeSessionAction
{
    /**
     * Execute the approval transition and save manual edits.
     *
     * @param IntakeSession $session       The session being approved.
     * @param array         $validatedData The validated input containing email, summary, and requirements.
     *
     * @return IntakeSession The freshly persisted session instance.
     *
     * @throws UnprocessableEntityHttpException If the session is already finalized.
     */
    public function execute(IntakeSession $session, array $validatedData): IntakeSession
    {
        if ($session->status !== SessionStatus::ACTIVE && $session->status !== SessionStatus::PENDING_APPROVAL) {
            throw new UnprocessableEntityHttpException('Session is already finalized.');
        }

        $session->client_email = $validatedData['client_email'];
        $session->project_summary = $validatedData['project_summary'];
        $session->requirements_json = $validatedData['requirements_json'];

        $session->status = SessionStatus::PENDING_APPROVAL;
        $session->completed_at = now();

        $session->save();

        return $session->fresh();
    }
}
