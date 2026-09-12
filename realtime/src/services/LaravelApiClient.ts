import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * Mirrors the JSON shape returned by Laravel's IntakeSessionResource.
 * Wrapped in a `data` key by Laravel's JsonResource convention.
 */
export interface SessionContext {
  id: string;
  status: string;
  client_name: string | null;
  project_summary: string | null;
  requirements_json: Record<string, unknown> | null;
  started_at: string;
  completed_at: string | null;
}

/**
 * Payload sent to Laravel's internal finalize endpoint.
 * Matches the FinalizeIntakeSessionRequest validation rules.
 */
export interface FinalizePayload {
  client_name: string | null;
  project_summary: string;
  requirements_json: Record<string, unknown>;
}

/**
 * Wraps the Laravel `JsonResource` envelope.
 */
interface LaravelResourceResponse<T> {
  data: T;
}

/**
 * Strongly typed HTTP client for server-to-server communication with the Laravel backend.
 *
 * All requests are authenticated via the shared INTERNAL_API_SECRET bearer token.
 * This client is the single point of contact between the realtime relay and Laravel.
 */
export class LaravelApiClient {
  private readonly client: AxiosInstance;

  constructor() {
    const baseURL = process.env.LARAVEL_API_URL;
    const secret = process.env.INTERNAL_API_SECRET;

    if (!baseURL) {
      throw new Error('LARAVEL_API_URL environment variable is not set.');
    }

    if (!secret) {
      throw new Error('INTERNAL_API_SECRET environment variable is not set.');
    }

    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetches the current context of an intake session from Laravel.
   *
   * Calls GET /intake/{sessionId}/verify — the public verification endpoint.
   *
   * @param sessionId - UUID of the intake session.
   * @returns The session context data.
   * @throws Error if the request fails or the session is not found.
   */
  async getContext(sessionId: string): Promise<SessionContext> {
    const response = await this.client.get<LaravelResourceResponse<SessionContext>>(
      `/intake/${sessionId}/verify`
    );

    return response.data.data;
  }

  /**
   * Sends AI-generated finalization data to Laravel's internal endpoint.
   *
   * Calls POST /internal/intake/{sessionId}/finalize — secured via shared secret.
   *
   * @param sessionId - UUID of the intake session to finalize.
   * @param payload - The AI-generated summary, requirements, and optional client name.
   * @throws Error if the request fails or validation rejects the payload.
   */
  async finalizeSession(sessionId: string, payload: FinalizePayload): Promise<void> {
    await this.client.post(
      `/internal/intake/${sessionId}/finalize`,
      payload
    );
  }

  /**
   * Extracts a human-readable error message from an Axios error.
   *
   * @param error - The caught error (unknown type from catch blocks).
   * @returns A descriptive error string for logging or client emission.
   */
  static formatError(error: unknown): string {
    if (error instanceof AxiosError) {
      const status = error.response?.status ?? 'N/A';
      const message = error.response?.data?.message ?? error.message;
      return `Laravel API Error [${status}]: ${message}`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unknown error occurred while communicating with Laravel.';
  }
}
