import axios from 'axios';
import { SessionData, UploadResponse } from '../types/api';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_LARAVEL_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const intakeService = {
  verifySession: async (id: string): Promise<SessionData> => {
    const response = await apiClient.get<SessionData>(`/intake/${id}/verify`);
    return response.data;
  },

  uploadDocument: async (id: string, file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('document', file);

    const response = await apiClient.post<UploadResponse>(
      `/intake/${id}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },



  approveSession: async (
    sessionId: string,
    client_email: string,
    project_summary: string,
    requirements_json: string
  ) => {

    // Parse the edited string back into a strict JSON object for Laravel
    let parsedRequirements = {};
    try {
      parsedRequirements = JSON.parse(requirements_json);
    } catch (e) {
      throw new Error("Invalid JSON format in requirements. Please check your syntax.");
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_LARAVEL_API_URL}/intake/${sessionId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_email,
        project_summary,
        requirements_json: parsedRequirements,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to approve session');
    }

    return response.json();
  },

  /**
   * Initializes a new, empty intake session.
   * 
   * @returns The newly created session payload containing the UUID.
   */
  createSession: async () => {
    const response = await apiClient.post('/intake');
    return response.data;
  }
};
