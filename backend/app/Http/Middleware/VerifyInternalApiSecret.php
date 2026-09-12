<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authenticates internal server-to-server API requests via a shared Bearer secret.
 *
 * Applied to routes consumed by the realtime relay server (not by end users).
 * The secret is compared against the INTERNAL_API_SECRET environment variable.
 */
class VerifyInternalApiSecret
{
    /**
     * Handle an incoming request.
     *
     * @param Request  $request The incoming HTTP request.
     * @param Closure  $next    The next middleware in the pipeline.
     *
     * @return Response
     *
     * @throws AuthenticationException If the bearer token is missing or invalid.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->bearerToken() !== config('services.internal.secret')) {
            throw new AuthenticationException('Invalid Internal Secret.');
        }

        return $next($request);
    }
}
