<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\SessionStatus;
use App\Models\IntakeSession;
use Illuminate\Support\Carbon;

/**
 * Instantiates a new, empty intake session when a client initiates a consultation.
 *
 * Single-responsibility: Creates the database record and sets the initial timestamps.
 */
class CreateIntakeSessionAction
{
    /**
     * Execute the creation mutation.
     *
     * @return IntakeSession The freshly persisted session instance.
     */
    public function execute(): IntakeSession
    {
        $session = new IntakeSession();

        $session->status = SessionStatus::ACTIVE;
        $session->started_at = Carbon::now();

        $session->save();

        return $session;
    }
}