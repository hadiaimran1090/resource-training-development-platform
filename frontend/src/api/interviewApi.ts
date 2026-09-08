import { apiClient } from './apiClient';

export type InterviewType = 'client' | 'mock' | 'technical' | 'behavioral';
export type InterviewResult = 'selected' | 'rejected' | 'pending';

export interface InterviewFeedback {
  id: number;
  interview_id: number;
  technical_gaps?: string | null;
  communication_gaps?: string | null;
  recommendations?: string | null;
  overall_rating?: number | null;
  given_by: number;
  given_by_name?: string | null;
  created_at: string;
}

export interface Interview {
  id: number;
  resource_id: number;
  resource_name?: string | null;
  client_name?: string | null;
  role_profile_id?: number | null;
  role_profile_name?: string | null;
  interview_type: InterviewType;
  interview_date: string;
  result: InterviewResult;
  feedback?: InterviewFeedback | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInterviewPayload {
  resource_id: number;
  client_name?: string;
  role_profile_id?: number;
  interview_type: InterviewType;
  interview_date: string;
  result?: InterviewResult;
}

export interface UpdateInterviewPayload {
  client_name?: string;
  role_profile_id?: number;
  interview_type?: InterviewType;
  interview_date?: string;
  result?: InterviewResult;
}

export interface CreateFeedbackPayload {
  technical_gaps?: string;
  communication_gaps?: string;
  recommendations?: string;
  overall_rating?: number;
}

export const interviewApi = {
  getInterviewsByResource: async (resourceId: number): Promise<Interview[]> => {
    const response = await apiClient.get(`/resources/${resourceId}/interviews`);
    return response.data;
  },

  getInterviewById: async (id: number): Promise<Interview> => {
    const response = await apiClient.get(`/interviews/${id}`);
    return response.data;
  },

  createInterview: async (payload: CreateInterviewPayload): Promise<Interview> => {
    const response = await apiClient.post('/interviews', payload);
    return response.data;
  },

  updateInterview: async (id: number, payload: UpdateInterviewPayload): Promise<Interview> => {
    const response = await apiClient.put(`/interviews/${id}`, payload);
    return response.data;
  },

  addFeedback: async (id: number, payload: CreateFeedbackPayload): Promise<InterviewFeedback> => {
    const response = await apiClient.post(`/interviews/${id}/feedback`, payload);
    return response.data;
  },
};
