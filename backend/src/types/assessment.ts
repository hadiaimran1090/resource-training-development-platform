export type AssessmentType = 'knowledge' | 'technical' | 'interview' | 'certification_prep';
export type QuestionType = 'mcq' | 'true_false' | 'short_answer';

export interface Assessment {
  id: number;
  name: string;
  type: AssessmentType;
  related_module_id: number | null;
  total_questions: number;
  passing_score: number;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  creator_name?: string;
  module_name?: string;
  question_count?: number;
  attempt_count?: number;
}

export interface AssessmentQuestion {
  id: number;
  assessment_id: number;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  correct_answer: string;
  marks: number;
  sequence_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface AssessmentWithQuestions extends Assessment {
  questions: AssessmentQuestion[];
}

export interface AssessmentAttempt {
  id: number;
  assessment_id: number;
  resource_id: number;
  score: number | null;
  passed: boolean | null;
  started_at: string;
  completed_at: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  assessment_name?: string;
  assessment_type?: string;
  resource_name?: string;
  total_questions?: number;
  passing_score?: number;
}

export interface AssessmentAnswer {
  id: number;
  attempt_id: number;
  question_id: number;
  given_answer: string | null;
  is_correct: boolean | null;
  marks_obtained: number;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  question_text?: string;
  question_type?: QuestionType;
  options?: string[] | null;
  correct_answer?: string;
  marks?: number;
}

export interface AttemptWithAnswers extends AssessmentAttempt {
  answers: AssessmentAnswer[];
}

// DTOs
export interface CreateAssessmentDTO {
  name: string;
  type: AssessmentType;
  related_module_id?: number | null;
  passing_score: number;
  questions?: CreateQuestionDTO[];
}

export interface UpdateAssessmentDTO {
  name?: string;
  type?: AssessmentType;
  related_module_id?: number | null;
  passing_score?: number;
}

export interface CreateQuestionDTO {
  question_text: string;
  question_type: QuestionType;
  options?: string[] | null;
  correct_answer: string;
  marks?: number;
  sequence_order?: number;
}

export interface UpdateQuestionDTO {
  question_text?: string;
  question_type?: QuestionType;
  options?: string[] | null;
  correct_answer?: string;
  marks?: number;
  sequence_order?: number;
}

export interface SubmitAnswerDTO {
  question_id: number;
  given_answer: string;
}

export interface SubmitAttemptDTO {
  answers: SubmitAnswerDTO[];
}
