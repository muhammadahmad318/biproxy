<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\LeadController;
use App\Http\Controllers\Internal\IntakeController as InternalIntakeController;
use App\Http\Controllers\Public\IntakeController;
use App\Http\Middleware\VerifyInternalApiSecret;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Intake Endpoints
|--------------------------------------------------------------------------
|
| These routes are publicly accessible and do not require authentication.
| They power the client-facing intake session verification and approval flow.
|
*/

Route::prefix('intake/{session}')->group(function () {
    Route::get('/verify', [IntakeController::class, 'verify']);
    Route::post('/approve', [IntakeController::class, 'approve']);
    Route::post('/documents', [IntakeController::class, 'uploadDocument']);
});

/*
|--------------------------------------------------------------------------
| Internal API Endpoints (Shared Secret)
|--------------------------------------------------------------------------
|
| Consumed by the realtime relay server. Authenticated via a shared
| bearer token validated by the VerifyInternalApiSecret middleware.
|
*/

Route::prefix('internal')
    ->middleware(VerifyInternalApiSecret::class)
    ->group(function () {
        Route::post('/intake/{session}/finalize', [InternalIntakeController::class, 'finalize']);
    });

/*
|--------------------------------------------------------------------------
| Admin Endpoints
|--------------------------------------------------------------------------
|
| Login is public. All other admin routes require a valid Sanctum token.
|
*/

Route::prefix('admin')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/leads', [LeadController::class, 'index']);
        Route::patch('/leads/{session}', [LeadController::class, 'update']);
    });
});
