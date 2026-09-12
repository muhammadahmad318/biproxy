<?php

declare(strict_types=1);

namespace App\Http\Controllers\Internal;

use App\Actions\FinalizeIntakeSessionAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Internal\FinalizeIntakeSessionRequest;
use App\Http\Resources\IntakeSessionResource;
use App\Models\IntakeSession;

/**
 * Handles internal server-to-server intake session endpoints.
 *
 * Secured by the VerifyInternalApiSecret middleware (applied at the route level).
 * This controller is lean — all business logic is delegated to Action classes.
 */
class IntakeController extends Controller
{
    /**
     * Finalize an intake session with AI-generated data from the realtime relay.
     *
     * @param FinalizeIntakeSessionRequest $request  Validated request containing summary, requirements, and optional client name.
     * @param IntakeSession               $session  Route-model-bound session instance.
     * @param FinalizeIntakeSessionAction  $action   Injected action handling the finalization logic.
     *
     * @return IntakeSessionResource
     */
    public function finalize(
        FinalizeIntakeSessionRequest $request,
        IntakeSession $session,
        FinalizeIntakeSessionAction $action,
    ): IntakeSessionResource {
        $validated = $request->validated();

        $updatedSession = $action->execute(
            session: $session,
            summary: $validated['project_summary'],
            requirements: $validated['requirements_json'],
            clientName: $validated['client_name'] ?? null,
        );

        return new IntakeSessionResource($updatedSession);
    }
}
