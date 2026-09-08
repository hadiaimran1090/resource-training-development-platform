import { apiClient } from './apiClient';

export interface TestCase {
  input: string;
  expected_output?: string;
}

export interface CodingChallenge {
  id: number;
  title: string;
  language: string;
  difficulty_level: number;
  target_role_profile_id: number | null;
  target_role_profile_name?: string;
  description: string;
  test_cases: TestCase[] | string;
  created_by: number;
  creator_name?: string;
  submission_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface CodingSubmission {
  id: number;
  challenge_id: number;
  challenge_title: string;
  language: string;
  difficulty_level: number;
  challenge_description: string;
  test_cases?: TestCase[] | string;
  resource_id: number;
  resource_name?: string;
  resource_email?: string;
  submitted_code: string;
  submission_date: string;
  test_pass_count: number;
  total_tests: number;
  score: number;
  status: 'pending_review' | 'passed' | 'failed';
  reviewed_by?: number;
  reviewer_name?: string;
}

export const codingChallengeApi = {
  // 1. Catalog
  getAll: async (params?: { language?: string; difficulty_level?: string; target_role_profile_id?: string }): Promise<CodingChallenge[]> => {
    const res = await apiClient.get('/coding-challenges', { params });
    return res.data.data;
  },

  getById: async (id: number): Promise<CodingChallenge> => {
    const res = await apiClient.get(`/coding-challenges/${id}`);
    return res.data.data;
  },

  getForAttempt: async (id: number): Promise<CodingChallenge> => {
    const res = await apiClient.get(`/coding-challenges/${id}/attempt`);
    return res.data.data;
  },

  create: async (data: Partial<CodingChallenge>): Promise<CodingChallenge> => {
    const res = await apiClient.post('/coding-challenges', data);
    return res.data.data;
  },

  update: async (id: number, data: Partial<CodingChallenge>): Promise<CodingChallenge> => {
    const res = await apiClient.put(`/coding-challenges/${id}`, data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/coding-challenges/${id}`);
  },

  // 2. Submissions & Review Queue
  submitSolution: async (challengeId: number, submittedCode: string): Promise<CodingSubmission> => {
    const res = await apiClient.post(`/coding-challenges/${challengeId}/submissions`, {
      submitted_code: submittedCode,
    });
    return res.data.data;
  },

  getMySubmissions: async (): Promise<CodingSubmission[]> => {
    const res = await apiClient.get('/coding-submissions/my-submissions');
    return res.data.data;
  },

  getResourceSubmissions: async (resourceId: number): Promise<CodingSubmission[]> => {
    const res = await apiClient.get(`/resources/${resourceId}/coding-submissions`);
    return res.data.data;
  },

  getReviewQueue: async (): Promise<CodingSubmission[]> => {
    const res = await apiClient.get('/coding-submissions/review-queue');
    return res.data.data;
  },

  reviewSubmission: async (id: number, data: { test_pass_count: number; total_tests: number }): Promise<CodingSubmission> => {
    const res = await apiClient.put(`/coding-submissions/${id}/review`, data);
    return res.data.data;
  },
};
