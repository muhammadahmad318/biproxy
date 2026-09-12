<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Actions\ApproveIntakeSessionAction;
use App\Enums\SessionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\ApproveIntakeSessionRequest;
use App\Http\Resources\IntakeSessionResource;
use App\Models\IntakeSession;

/**
 * Handles public-facing intake session endpoints.
 *
 * This controller is lean — all business logic is delegated to Action classes.
 * It handles only HTTP concerns: request validation, response formatting, and status codes.
 */
class IntakeController extends Controller
{
    /**
     * Verify that an intake session exists and is accessible.
     *
     * Returns the session data if it's still active. Returns a 410 (Gone)
     * response if the session has been discarded by an admin.
     *
     * @param IntakeSession $session Route-model-bound session instance.
     *
     * @return IntakeSessionResource|\Illuminate\Http\JsonResponse
     */
    public function verify(IntakeSession $session): IntakeSessionResource|\Illuminate\Http\JsonResponse
    {
        if ($session->status === SessionStatus::DISCARDED) {
            return response()->json(['message' => 'This session is no longer available.'], 410);
        }

        return new IntakeSessionResource($session);
    }

    /**
     * Approve an intake session and submit the client's email.
     *
     * Delegates the state transition to ApproveIntakeSessionAction.
     *
     * @param ApproveIntakeSessionRequest  $request Validated request containing client_email.
     * @param IntakeSession                $session Route-model-bound session instance.
     * @param ApproveIntakeSessionAction   $action  Injected action handling the approval logic.
     *
     * @return IntakeSessionResource
     */
    public function approve(
        ApproveIntakeSessionRequest $request,
        IntakeSession $session,
        ApproveIntakeSessionAction $action,
    ): IntakeSessionResource {
        $updatedSession = $action->execute($session, $request->validated('client_email'));

        return new IntakeSessionResource($updatedSession);
    }
}
