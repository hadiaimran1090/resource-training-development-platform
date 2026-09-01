import { apiClient } from './apiClient';

export interface BenchRecord {
  id: number;
  userId: number;
  startDate: string;
  endDate?: string | null;
  reason?: string;
  durationDays: number;
}

export interface Assignment {
  id: number;
  resource_id: number;
  client_name: string;
  project_name?: string;
  start_date: string;
  end_date?: string | null;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export interface ResourceProfile {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  employee_id: string;
  phone_number?: string | null;
  profile_image_url?: string | null;
  account_status: string;
  region_id?: number | null;
  region_name?: string | null;
  region_code?: string | null;
  practice_id?: number | null;
  practice_name?: string | null;
  regional_lead_id?: number | null;
  regional_lead_name?: string | null;
  designation: string;
  experience_years: number;
  current_status: 'assigned' | 'bench' | 'training';
  created_at: string;
  updated_at: string;
  assignments?: Assignment[];
  bench_records?: BenchRecord[];
  total_bench_days?: number;
}

export interface CreateResourceData {
  name: string;
  email: string;
  password: string;
  employeeId: string;
  region_id?: number | null;
  practice_id?: number | null;
  regional_lead_id?: number | null;
  designation: string;
  experience_years?: number;
  current_status?: 'assigned' | 'bench' | 'training';
}

export interface UpdateResourceData {
  region_id?: number | null;
  practice_id?: number | null;
  regional_lead_id?: number | null;
  phone_number?: string | null;
  designation?: string;
  experience_years?: number;
  current_status?: 'assigned' | 'bench' | 'training';
}

export const resourceApi = {
  getResources: async (): Promise<ResourceProfile[]> => {
    const response = await apiClient.get('/resources');
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.resources)) return data.resources;
    return [];
  },

  getResourceById: async (id: number): Promise<ResourceProfile> => {
    const response = await apiClient.get(`/resources/${id}`);
    return response.data;
  },

  getMyProfile: async (): Promise<ResourceProfile> => {
    const response = await apiClient.get('/resources/profile/me');
    return response.data;
  },

  updateMyProfile: async (data: {
    current_status?: 'assigned' | 'bench' | 'training';
    phone_number?: string;
    assignment_id?: number;
    end_date?: string;
  }): Promise<ResourceProfile> => {
    const response = await apiClient.put('/resources/profile/me', data);
    return response.data;
  },

  createResource: async (data: CreateResourceData): Promise<ResourceProfile> => {
    const response = await apiClient.post('/resources', data);
    return response.data;
  },

  updateResource: async (id: number, data: UpdateResourceData): Promise<ResourceProfile> => {
    const response = await apiClient.put(`/resources/${id}`, data);
    return response.data;
  },
};
