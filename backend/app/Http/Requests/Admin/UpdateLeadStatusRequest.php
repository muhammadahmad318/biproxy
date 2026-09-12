<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\SessionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates the admin's lead status update request.
 *
 * Only allows transitioning to terminal statuses: approved or discarded.
 */
class UpdateLeadStatusRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Authorization is handled by the auth:sanctum middleware at the route level.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    SessionStatus::APPROVED->value,
                    SessionStatus::DISCARDED->value,
                ]),
            ],
        ];
    }
}
