export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type ContentType = 'video' | 'document' | 'lab';

export interface TrainingTrack {
  id: number;
  name: string;
  target_role_profile_id: number | null;
  target_role_profile_name?: string | null;
  description: string | null;
  duration_days: number;
  program_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TrainingProgram {
  id: number;
  track_id: number;
  name: string;
  skill_level: SkillLevel;
  duration_days: number;
  prerequisites: string | null;
  module_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TrainingModule {
  id: number;
  program_id: number;
  name: string;
  sequence_order: number;
  day_number: number;
  content_type: ContentType;
  content_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProgramWithModules extends TrainingProgram {
  modules: TrainingModule[];
}

export interface TrackFullTree extends TrainingTrack {
  programs: ProgramWithModules[];
}

export interface CreateTrackDTO {
  name: string;
  target_role_profile_id?: number | null;
  description?: string;
  duration_days: number;
}

export interface UpdateTrackDTO {
  name?: string;
  target_role_profile_id?: number | null;
  description?: string;
  duration_days?: number;
}

export interface CreateProgramDTO {
  name: string;
  skill_level: SkillLevel;
  duration_days: number;
  prerequisites?: string;
}

export interface UpdateProgramDTO {
  name?: string;
  skill_level?: SkillLevel;
  duration_days?: number;
  prerequisites?: string;
}

export interface CreateModuleDTO {
  name: string;
  sequence_order?: number;
  day_number: number;
  content_type: ContentType;
  content_url?: string;
}

export interface UpdateModuleDTO {
  name?: string;
  sequence_order?: number;
  day_number?: number;
  content_type?: ContentType;
  content_url?: string;
}

export interface ReorderModuleItem {
  module_id: number;
  sequence_order: number;
}
