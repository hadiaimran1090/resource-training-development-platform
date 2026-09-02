export type SkillCategory = 'technical' | 'secondary' | 'soft';

export type SkillSource =
  | 'self'
  | 'assessment'
  | 'coding'
  | 'mentor'
  | 'interview'
  | 'training';

export interface Skill {
  id: number;
  name: string;
  category: SkillCategory;
  created_at?: string;
}

export interface ResourceSkill {
  id: number;
  resource_id: number;
  skill_id: number;
  current_level: number;
  target_level: number | null;
  source: SkillSource;
  last_updated: string;
  skill_name?: string;
  category?: SkillCategory;
}

export interface RoleProfileSkill {
  role_profile_id: number;
  skill_id: number;
  required_level: number;
  skill_name?: string;
  category?: SkillCategory;
}

export interface RoleProfile {
  id: number;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
  skill_count?: number;
  skills?: RoleProfileSkill[];
}

export interface SkillGapItem {
  skill_id: number;
  skill_name: string;
  category: SkillCategory;
  current_level: number;
  target_level?: number | null;
  required_level?: number;
  gap: number;
  source?: SkillSource | null;
  has_entry: boolean;
}
