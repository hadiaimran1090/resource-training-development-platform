export type MentoringSessionType = 'review' | 'mock_interview' | 'feedback';

export interface MentoringSession {
  id: number;
  mentor_id: number;
  mentor_name?: string | null;
  resource_id: number;
  resource_name?: string | null;
  session_date: string;
  session_type: MentoringSessionType;
  notes?: string | null;
  created_at: string;
}

export interface CreateMentoringSessionInput {
  resource_id: number;
  session_date: string;
  session_type: MentoringSessionType;
  notes?: string;
}

export interface UpdateMentoringSessionInput {
  session_date?: string;
  session_type?: MentoringSessionType;
  notes?: string;
}
