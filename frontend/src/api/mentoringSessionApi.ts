import { apiClient } from './apiClient';

export type MentoringSessionType = 'review' | 'mock_interview' | 'feedback';

export interface MentoringSession {
  id: number;
  mentor_id: number;
  mentor_name?: string | null;
  resource_id: number;
  resource_name?: string | null;
  resource_email?: string | null;
  designation?: string | null;
  session_date: string;
  session_type: MentoringSessionType;
  notes?: string | null;
  created_at: string;
}

export interface CreateMentoringSessionPayload {
  resource_id: number;
  session_date: string;
  session_type: MentoringSessionType;
  notes?: string;
}

export interface UpdateMentoringSessionPayload {
  session_date?: string;
  session_type?: MentoringSessionType;
  notes?: string;
}

export const mentoringSessionApi = {
  getMentoringSessionsByResource: async (resourceId: number): Promise<MentoringSession[]> => {
    const response = await apiClient.get(`/resources/${resourceId}/mentoring-sessions`);
    return response.data;
  },

  getMyLoggedSessions: async (): Promise<MentoringSession[]> => {
    const response = await apiClient.get('/mentoring-sessions/my-sessions');
    return response.data;
  },

  createSession: async (payload: CreateMentoringSessionPayload): Promise<MentoringSession> => {
    const response = await apiClient.post('/mentoring-sessions', payload);
    return response.data;
  },

  updateSession: async (id: number, payload: UpdateMentoringSessionPayload): Promise<MentoringSession> => {
    const response = await apiClient.put(`/mentoring-sessions/${id}`, payload);
    return response.data;
  },

  deleteSession: async (id: number): Promise<void> => {
    await apiClient.delete(`/mentoring-sessions/${id}`);
  },
};
