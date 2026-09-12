<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Handles admin authentication via Sanctum token issuance.
 *
 * This controller is lean — it handles the HTTP concern of authenticating
 * and returning a bearer token. No session/cookie-based auth is used.
 */
class AuthController extends Controller
{
    /**
     * Authenticate an admin and issue a Sanctum API token.
     *
     * @param LoginRequest $request Validated request containing email and password.
     *
     * @return JsonResponse Contains the plaintext bearer token on success.
     *
     * @throws ValidationException If credentials are invalid.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        return response()->json([
            'token' => $user->createToken('admin-token')->plainTextToken,
        ]);
    }
}
