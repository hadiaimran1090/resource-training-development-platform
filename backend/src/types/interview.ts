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

export interface CreateInterviewInput {
  resource_id: number;
  client_name?: string;
  role_profile_id?: number;
  interview_type: InterviewType;
  interview_date: string;
  result?: InterviewResult;
}

export interface UpdateInterviewInput {
  client_name?: string;
  role_profile_id?: number;
  interview_type?: InterviewType;
  interview_date?: string;
  result?: InterviewResult;
}

export interface CreateInterviewFeedbackInput {
  technical_gaps?: string;
  communication_gaps?: string;
  recommendations?: string;
  overall_rating?: number;
}
