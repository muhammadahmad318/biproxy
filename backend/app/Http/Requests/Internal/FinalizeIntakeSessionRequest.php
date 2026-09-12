<?php

declare(strict_types=1);

namespace App\Http\Requests\Internal;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload sent by the realtime relay server when finalizing an intake session.
 *
 * This request is authenticated via the VerifyInternalApiSecret middleware,
 * not via user-based authorization.
 */
class FinalizeIntakeSessionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Always true — authorization is handled by the VerifyInternalApiSecret middleware.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'client_name' => ['nullable', 'string'],
            'project_summary' => ['required', 'string'],
            'requirements_json' => ['required', 'array'],
        ];
    }
}
