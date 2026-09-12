<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\SessionStatus;
use App\Models\IntakeSession;

/**
 * Updates the status of an intake session (lead) to a terminal state.
 *
 * Single-responsibility: applies the admin's status decision and persists it.
 */
class UpdateLeadStatusAction
{
    /**
     * Execute the status update.
     *
     * @param IntakeSession $session The session whose status is being updated.
     * @param SessionStatus $status  The new terminal status (approved or discarded).
     *
     * @return IntakeSession The freshly persisted session instance.
     */
    public function execute(IntakeSession $session, SessionStatus $status): IntakeSession
    {
        $session->status = $status;

        $session->save();

        return $session->fresh();
    }
}
