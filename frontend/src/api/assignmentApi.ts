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

export const assignmentApi = {
  getAssignments: async (): Promise<AssignmentDetail[]> => {
    const response = await apiClient.get('/assignments');
    return response.data;
  },

  createAssignment: async (data: CreateAssignmentData): Promise<AssignmentDetail> => {
    const response = await apiClient.post('/assignments', data);
    return response.data;
  },

  updateAssignment: async (id: number, data: Partial<CreateAssignmentData>): Promise<AssignmentDetail> => {
    const response = await apiClient.put(`/assignments/${id}`, data);
    return response.data;
  },

  toggleAssignmentStatus: async (id: number, status: 'active' | 'completed' | 'cancelled'): Promise<AssignmentDetail> => {
    const response = await apiClient.patch(`/assignments/${id}/status`, { status });
    return response.data;
  },
};
