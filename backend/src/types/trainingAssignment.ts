export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ActivityType =
  | 'training'
  | 'assessment'
  | 'coding'
  | 'reading'
  | 'poc'
  | 'mock_interview'
  | 'mentor_session'
  | 'documentation';
export type ActivityStatus = 'pending' | 'in_progress' | 'completed';

export interface DailyActivity {
  id: number;
  training_assignment_id: number;
  day_number: number;
  activity_type: ActivityType;
  description: string;
  status: ActivityStatus;
  completed_date?: string | Date | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface TrainingAssignment {
  id: number;
  resource_id: number;
  track_id: number;
  assigned_by: number;
  start_date: string;
  status: AssignmentStatus;
  approval_status: ApprovalStatus;
  approved_by?: number | null;
  created_at?: string | Date;
  updated_at?: string | Date;

  // Joined fields for display
  resource_name?: string;
  resource_email?: string;
  resource_employee_id?: string;
  region_id?: number;
  region_name?: string;
  track_name?: string;
  track_duration_days?: number;
  assigned_by_name?: string;
  approved_by_name?: string;
  daily_activities?: DailyActivity[];
  total_activities?: number;
  completed_activities?: number;
}

export interface CreateAssignmentDTO {
  resource_id: number;
  track_id: number;
  start_date: string;
}
