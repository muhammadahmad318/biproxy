<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Actions\UpdateLeadStatusAction;
use App\Enums\SessionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateLeadStatusRequest;
use App\Http\Resources\IntakeSessionResource;
use App\Models\IntakeSession;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Handles admin lead management endpoints.
 *
 * This controller is lean — all business logic is delegated to Action classes.
 * Protected by auth:sanctum middleware at the route level.
 */
class LeadController extends Controller
{
    /**
     * List all intake sessions pending admin approval.
     *
     * @return AnonymousResourceCollection Collection of IntakeSessionResource.
     */
    public function index(): AnonymousResourceCollection
    {
        $leads = IntakeSession::where('status', SessionStatus::PENDING_APPROVAL)->get();

        return IntakeSessionResource::collection($leads);
    }

    /**
     * Update the status of a lead (approve or discard).
     *
     * @param UpdateLeadStatusRequest $request Validated request containing the new status.
     * @param IntakeSession           $session Route-model-bound session instance.
     * @param UpdateLeadStatusAction  $action  Injected action handling the status transition.
     *
     * @return IntakeSessionResource
     */
    public function update(
        UpdateLeadStatusRequest $request,
        IntakeSession $session,
        UpdateLeadStatusAction $action,
    ): IntakeSessionResource {
        $newStatus = SessionStatus::from($request->validated('status'));

        $updatedSession = $action->execute($session, $newStatus);

        return new IntakeSessionResource($updatedSession);
    }
}
