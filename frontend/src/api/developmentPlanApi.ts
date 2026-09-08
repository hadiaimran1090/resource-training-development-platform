import { apiClient } from './apiClient';

export interface DevelopmentPlanItem {
  id?: number;
  plan_id?: number;
  week_number: number;
  focus_area: string;
  training_track_id?: number | null;
  training_track_name?: string;
}

export interface DevelopmentPlan {
  id: number;
  resource_id: number;
  resource_name?: string;
  resource_email?: string;
  target_role_profile_id: number;
  target_role_profile_name?: string;
  target_role_profile_description?: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed';
  approval_status: 'pending' | 'approved' | 'rejected';
  created_by: number;
  created_by_name?: string;
  approved_by?: number | null;
  approved_by_name?: string | null;
  created_at: string;
  updated_at: string;
  items?: DevelopmentPlanItem[];
}

export const getDevelopmentPlans = async () => {
  const response = await apiClient.get('/development-plans');
  return response.data;
};

export const getResourceDevelopmentPlan = async (resourceId: number) => {
  const response = await apiClient.get(`/resources/${resourceId}/development-plan`);
  return response.data;
};

export const createDevelopmentPlan = async (payload: {
  resource_id: number;
  target_role_profile_id: number;
  start_date: string;
  end_date: string;
  items?: DevelopmentPlanItem[];
}) => {
  const response = await apiClient.post('/development-plans', payload);
  return response.data;
};

export const updateDevelopmentPlan = async (
  planId: number,
  payload: {
    target_role_profile_id?: number;
    start_date?: string;
    end_date?: string;
    status?: string;
    items?: DevelopmentPlanItem[];
  }
) => {
  const response = await apiClient.put(`/development-plans/${planId}`, payload);
  return response.data;
};

export const approveDevelopmentPlan = async (planId: number) => {
  const response = await apiClient.put(`/development-plans/${planId}/approve`);
  return response.data;
};

export const rejectDevelopmentPlan = async (planId: number) => {
  const response = await apiClient.put(`/development-plans/${planId}/reject`);
  return response.data;
};

export const completeDevelopmentPlan = async (planId: number) => {
  const response = await apiClient.put(`/development-plans/${planId}/complete`);
  return response.data;
};

export const deleteDevelopmentPlan = async (planId: number) => {
  const response = await apiClient.delete(`/development-plans/${planId}`);
  return response.data;
};
