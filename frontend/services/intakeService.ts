import axios from 'axios';
import { SessionData, UploadResponse, ApproveResponse } from '../types/api';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_LARAVEL_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const intakeService = {
  verifySession: async (id: string): Promise<SessionData> => {
    const response = await apiClient.get<SessionData>(`/api/intake/${id}/verify`);
    return response.data;
  },

  uploadDocument: async (id: string, file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('document', file);

    const response = await apiClient.post<UploadResponse>(
      `/api/intake/${id}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  approveSession: async (id: string, email: string): Promise<ApproveResponse> => {
    const response = await apiClient.post<ApproveResponse>(`/api/intake/${id}/approve`, {
      email,
    });
    return response.data;
  },
};
