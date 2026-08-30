import { apiClient } from './apiClient';

export interface Practice {
  id: number;
  name: string;
  description?: string;
  lead_user_id?: number | null;
  lead_name?: string | null;
  lead_email?: string | null;
  status: 'active' | 'inactive';
  is_active: boolean;
  total_users?: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePracticeData {
  name: string;
  description?: string;
  lead_user_id?: number | null;
  status?: 'active' | 'inactive';
}

export const practiceApi = {
  getPractices: async (): Promise<Practice[]> => {
    const response = await apiClient.get('/practices');
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.practices)) return data.practices;
    return [];
  },

  getPracticeById: async (id: number): Promise<Practice> => {
    const response = await apiClient.get(`/practices/${id}`);
    return response.data;
  },

  createPractice: async (data: CreatePracticeData): Promise<Practice> => {
    const response = await apiClient.post('/practices', data);
    return response.data;
  },

  updatePractice: async (id: number, data: CreatePracticeData): Promise<Practice> => {
    const response = await apiClient.put(`/practices/${id}`, data);
    return response.data;
  },

  togglePracticeStatus: async (id: number, status: 'active' | 'inactive'): Promise<Practice> => {
    const response = await apiClient.patch(`/practices/${id}/status`, { status });
    return response.data;
  },
};
