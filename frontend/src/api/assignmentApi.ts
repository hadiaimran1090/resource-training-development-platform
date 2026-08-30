import { apiClient } from './apiClient';

export interface AssignmentDetail {
  id: number;
  resource_id: number;
  resource_name: string;
  resource_email: string;
  resource_employee_id: string;
  designation: string;
  resource_status: string;
  client_name: string;
  project_name?: string;
  start_date: string;
  end_date?: string | null;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreateAssignmentData {
  resource_id: number;
  client_name: string;
  project_name?: string;
  start_date: string;
  end_date?: string | null;
  status?: 'active' | 'completed' | 'cancelled';
}

export interface AssignableResource {
  resource_id: number;
  user_id: number;
  name: string;
  email: string;
  employee_id: string;
  designation: string;
  current_status: string;
  region_name?: string;
  region_code?: string;
}

export const assignmentApi = {
  getAssignments: async (): Promise<AssignmentDetail[]> => {
    const response = await apiClient.get('/assignments');
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },

  getAssignableResources: async (): Promise<AssignableResource[]> => {
    const response = await apiClient.get('/assignments/assignable-resources');
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },

  createAssignment: async (data: CreateAssignmentData): Promise<AssignmentDetail> => {
    const response = await apiClient.post('/assignments', data);
    return response.data;
  },

  updateAssignment: async (id: number, data: Partial<CreateAssignmentData>): Promise<AssignmentDetail> => {
    const response = await apiClient.put(`/assignments/${id}`, data);
    return response.data;
  },

  toggleAssignmentStatus: async (id: number, status: 'active' | 'completed' | 'cancelled', endDate?: string): Promise<AssignmentDetail> => {
    const response = await apiClient.patch(`/assignments/${id}/status`, { status, end_date: endDate });
    return response.data;
  },

  deleteAssignment: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/assignments/${id}`);
    return response.data;
  },
};
