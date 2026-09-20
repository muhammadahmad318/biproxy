import axios from 'axios';
import { LoginResponse, AdminLead } from '../types/api';

const adminApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_LARAVEL_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to attach the token dynamically
adminApiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const adminService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await adminApiClient.post<LoginResponse>('/api/admin/login', {
      email,
      password,
    });
    return response.data;
  },

  getLeads: async (): Promise<AdminLead[]> => {
    const response = await adminApiClient.get<{ data: AdminLead[] }>('/api/admin/leads');
    return response.data.data;
  },

  updateLeadStatus: async (id: string, status: 'approved' | 'discarded'): Promise<void> => {
    await adminApiClient.patch(`/api/admin/leads/${id}`, { status });
  },
};
