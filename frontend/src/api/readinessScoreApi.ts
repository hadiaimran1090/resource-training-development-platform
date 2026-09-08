import { apiClient } from './apiClient';

export interface ReadinessScore {
  id: number;
  resource_id: number;
  calculated_date: string;
  technical_skills_pct: number;
  coding_pct: number;
  assessment_pct: number;
  interview_readiness_pct: number;
  project_experience_pct: number;
  communication_pct: number;
  certification_pct: number;
  overall_pct: number;
  category: 'ready' | 'almost_ready' | 'needs_development' | 'high_risk';
}

export interface ReadinessScoreWeight {
  id: number;
  component_name: string;
  weight_pct: number;
  is_active: boolean;
  updated_at?: string;
}

export const recalculateReadinessScore = async (resourceId: number) => {
  const response = await apiClient.post(`/resources/${resourceId}/readiness-score/recalculate`);
  return response.data;
};

export const getReadinessScoreHistory = async (resourceId: number) => {
  const response = await apiClient.get(`/resources/${resourceId}/readiness-score/history`);
  return response.data;
};

export const getReadinessScoreWeights = async () => {
  const response = await apiClient.get('/readiness-score-weights');
  return response.data;
};

export const updateReadinessScoreWeights = async (weights: ReadinessScoreWeight[]) => {
  const response = await apiClient.put('/readiness-score-weights', { weights });
  return response.data;
};
