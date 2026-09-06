import { apiClient } from './apiClient';
import type {
  Assessment,
  AssessmentWithQuestions,
  AssessmentAttempt,
  AttemptWithAnswers,
  AssessmentQuestion,
  CreateAssessmentInput,
  UpdateAssessmentInput,
  CreateQuestionInput,
  UpdateQuestionInput,
  SubmitAnswerInput,
} from '../types/assessment';

// ==========================================
// 1. ASSESSMENT CRUD
// ==========================================

export const assessmentApi = {
  getAll: async (type?: string): Promise<Assessment[]> => {
    const params = type ? { type } : {};
    const res = await apiClient.get('/assessments', { params });
    return res.data.data;
  },

  getById: async (id: number): Promise<AssessmentWithQuestions> => {
    const res = await apiClient.get(`/assessments/${id}`);
    return res.data.data;
  },

  create: async (data: CreateAssessmentInput): Promise<AssessmentWithQuestions> => {
    const res = await apiClient.post('/assessments', data);
    return res.data.data;
  },

  update: async (id: number, data: UpdateAssessmentInput): Promise<Assessment> => {
    const res = await apiClient.put(`/assessments/${id}`, data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/assessments/${id}`);
  },

  // ==========================================
  // 2. QUESTION MANAGEMENT
  // ==========================================

  addQuestion: async (assessmentId: number, data: CreateQuestionInput): Promise<AssessmentQuestion> => {
    const res = await apiClient.post(`/assessments/${assessmentId}/questions`, data);
    return res.data.data;
  },

  updateQuestion: async (questionId: number, data: UpdateQuestionInput): Promise<AssessmentQuestion> => {
    const res = await apiClient.put(`/assessments/questions/${questionId}`, data);
    return res.data.data;
  },

  deleteQuestion: async (questionId: number): Promise<void> => {
    await apiClient.delete(`/assessments/questions/${questionId}`);
  },

  // ==========================================
  // 3. ATTEMPTS & GRADING
  // ==========================================

  startAttempt: async (assessmentId: number, resourceId: number): Promise<AssessmentAttempt> => {
    const res = await apiClient.post(`/assessments/${assessmentId}/attempts`, { resource_id: resourceId });
    return res.data.data;
  },

  submitAttempt: async (attemptId: number, answers: SubmitAnswerInput[]): Promise<AttemptWithAnswers> => {
    const res = await apiClient.post(`/assessments/attempts/${attemptId}/submit`, { answers });
    return res.data.data;
  },

  getMyAttempts: async (resourceId: number): Promise<AssessmentAttempt[]> => {
    const res = await apiClient.get('/assessments/my-attempts', { params: { resource_id: resourceId } });
    return res.data.data;
  },

  getAssessmentAttempts: async (assessmentId: number): Promise<AssessmentAttempt[]> => {
    const res = await apiClient.get(`/assessments/${assessmentId}/attempts`);
    return res.data.data;
  },

  getAttemptDetails: async (attemptId: number): Promise<AttemptWithAnswers> => {
    const res = await apiClient.get(`/assessments/attempts/${attemptId}`);
    return res.data.data;
  },
};
