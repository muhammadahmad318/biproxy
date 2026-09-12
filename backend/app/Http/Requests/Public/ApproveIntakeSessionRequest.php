<?php

declare(strict_types=1);

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the client's approval submission for an intake session.
 *
 * This is a public endpoint — authorization always returns true.
 */
class ApproveIntakeSessionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Always returns true — this is a public-facing endpoint.
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
            'client_email' => ['required', 'string', 'email:rfc,dns', 'max:255'],
        ];
    }
}
