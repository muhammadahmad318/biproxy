# Backend Issues & Tech Debt

This file tracks issues, missing features, and edge cases discovered during testing that need to be addressed after the initial development sprints are completed.

## 1. Exception Handling & Error Responses
- **Issue 1:** When a Model is not found (e.g., `404 Not Found` for an invalid UUID), Laravel throws a `ModelNotFoundException`. Currently, this returns a stack trace (if `APP_DEBUG=true`) or a generic Laravel error page/JSON, rather than a clean, user-friendly JSON response.
- **Issue 2:** Manually thrown HTTP exceptions (like `UnprocessableEntityHttpException`) also return full stack traces rather than standardized JSON errors.
- **Affected Endpoints & Use Cases:**
  - `GET /api/intake/{session}/verify` -> Use Case: Invalid or Non-existent Session ID (`ModelNotFoundException` stack trace).
  - `POST /api/intake/{session}/approve` -> Use Case: Session Already Finalized / Discarded (`UnprocessableEntityHttpException` stack trace).
- **Fix Required:** Implement custom exception rendering (via `bootstrap/app.php` in Laravel 11) to ensure all exceptions are caught and returned in a standardized, front-end friendly JSON format.

## 2. API Response Standardization
- **Issue:** The backend lacks a unified API Response Trait.
- **Fix Required:** Create an `ApiResponse` trait (e.g., `successResponse`, `errorResponse`) to standardize the structure of all JSON responses across the application, making it easier for the frontend to consume.

## 3. Authentication & Security
- **Issue:** Admin login Sanctum tokens are currently unexpiring (permanent). They are generated using `$user->createToken('admin-token')->plainTextToken` and `config/sanctum.php` has expiration set to `null`. This is a security risk if an admin token is ever leaked.
- **Fix Required:** Update `config/sanctum.php` to set a global `'expiration'` value (e.g., `120` minutes), or explicitly pass an expiration date to `createToken()` in the `AuthController`.

## 4. Unauthenticated Redirection Error
- **Issue:** Hitting Sanctum-protected routes (e.g., `GET /api/admin/leads`) without a valid token and without the `Accept: application/json` header causes a `500 Internal Server Error` (`RouteNotFoundException: Route [login] not defined.`). Laravel tries to redirect unauthenticated users to a web login page instead of returning a `401 Unauthorized` JSON response.
- **Fix Required:** Update `bootstrap/app.php` exception handling or middleware configuration to ensure that all `api/*` routes strictly return JSON authentication errors, rather than attempting to redirect to web routes.
