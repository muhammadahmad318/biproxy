export type SessionStatus = 'pending_approval' | 'active' | 'finalized' | 'approved'|'discarded';

export interface SessionData {
  id: string;
  status: SessionStatus;
  client_name: string | null;
  project_summary: string | null;
  requirements_json: Record<string, unknown> | null;
  started_at: string;
  completed_at: string | null;
}

export interface AISummary {
  project_summary: string;
  requirements_json: Record<string, unknown>;
}

export interface UploadResponse {
  success: boolean;
  message: string;
}

export interface ApproveResponse {
  success: boolean;
  message: string;
}

export interface LoginResponse {
  token: string;
}

export interface AdminLead extends SessionData {
  client_email: string | null;
}
