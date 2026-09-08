import { apiClient } from './apiClient';
import type {
  Skill,
  ResourceSkill,
  RoleProfile,
  RoleProfileSkill,
  SkillGapItem,
} from '../types/skill';

export interface SkillRequest {
  id: number;
  requested_by: number;
  skill_name: string;
  category: 'technical' | 'secondary' | 'soft';
  justification?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string | null;
  requester_name?: string;
  requester_email?: string;
  requester_employee_id?: string;
  region_name?: string;
  practice_name?: string;
  reviewer_name?: string;
}

export const skillApi = {
  // 1. Skills Catalog APIs
  getSkills: async (category?: string): Promise<Skill[]> => {
    const response = await apiClient.get<Skill[]>('/skills', {
      params: category ? { category } : undefined,
    });
    return response.data;
  },

  createSkill: async (data: { name: string; category: string }): Promise<Skill> => {
    const response = await apiClient.post<Skill>('/skills', data);
    return response.data;
  },

  updateSkill: async (id: number, data: { name: string; category: string }): Promise<Skill> => {
    const response = await apiClient.put<Skill>(`/skills/${id}`, data);
    return response.data;
  },

  deleteSkill: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/skills/${id}`);
    return response.data;
  },

  // 1b. Skill Requests APIs (New Skill Approval Workflow)
  requestNewSkill: async (data: {
    skill_name: string;
    category: string;
    justification?: string;
  }): Promise<SkillRequest> => {
    const response = await apiClient.post<SkillRequest>('/skills/requests', data);
    return response.data;
  },

  getPendingSkillRequests: async (): Promise<SkillRequest[]> => {
    const response = await apiClient.get<SkillRequest[]>('/skills/requests/pending');
    return response.data;
  },

  getMySkillRequests: async (): Promise<SkillRequest[]> => {
    const response = await apiClient.get<SkillRequest[]>('/skills/requests/my');
    return response.data;
  },

  approveSkillRequest: async (id: number): Promise<{ message: string; skillId?: number }> => {
    const response = await apiClient.put<{ message: string; skillId?: number }>(
      `/skills/requests/${id}/approve`
    );
    return response.data;
  },

  rejectSkillRequest: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>(`/skills/requests/${id}/reject`);
    return response.data;
  },

  // 2. Resource Skills Matrix APIs
  getResourceSkills: async (resourceId: number): Promise<ResourceSkill[]> => {
    const response = await apiClient.get<ResourceSkill[]>(`/resources/${resourceId}/skills`);
    return response.data;
  },

  addResourceSkill: async (
    resourceId: number,
    data: {
      skill_id: number;
      current_level: number;
      target_level?: number | null;
      source: string;
    }
  ): Promise<ResourceSkill> => {
    const response = await apiClient.post<ResourceSkill>(`/resources/${resourceId}/skills`, data);
    return response.data;
  },

  updateResourceSkill: async (
    resourceId: number,
    skillId: number,
    data: {
      current_level?: number;
      target_level?: number | null;
      source?: string;
    }
  ): Promise<ResourceSkill> => {
    const response = await apiClient.put<ResourceSkill>(
      `/resources/${resourceId}/skills/${skillId}`,
      data
    );
    return response.data;
  },

  deleteResourceSkill: async (
    resourceId: number,
    skillId: number
  ): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/resources/${resourceId}/skills/${skillId}`
    );
    return response.data;
  },

  getSkillGap: async (resourceId: number, roleProfileId?: number): Promise<SkillGapItem[]> => {
    const response = await apiClient.get<SkillGapItem[]>(`/resources/${resourceId}/skill-gap`, {
      params: roleProfileId ? { roleProfileId } : undefined,
    });
    return response.data;
  },

  // 3. Role Profiles APIs
  getRoleProfiles: async (): Promise<(RoleProfile & { skill_count: number })[]> => {
    const response = await apiClient.get<(RoleProfile & { skill_count: number })[]>('/role-profiles');
    return response.data;
  },

  getRoleProfileById: async (id: number): Promise<RoleProfile> => {
    const response = await apiClient.get<RoleProfile>(`/role-profiles/${id}`);
    return response.data;
  },

  createRoleProfile: async (data: { name: string; description?: string }): Promise<RoleProfile> => {
    const response = await apiClient.post<RoleProfile>('/role-profiles', data);
    return response.data;
  },

  updateRoleProfile: async (
    id: number,
    data: { name: string; description?: string }
  ): Promise<RoleProfile> => {
    const response = await apiClient.put<RoleProfile>(`/role-profiles/${id}`, data);
    return response.data;
  },

  deleteRoleProfile: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/role-profiles/${id}`);
    return response.data;
  },

  addRoleProfileSkill: async (
    roleProfileId: number,
    data: { skill_id: number; required_level: number }
  ): Promise<RoleProfileSkill> => {
    const response = await apiClient.post<RoleProfileSkill>(
      `/role-profiles/${roleProfileId}/skills`,
      data
    );
    return response.data;
  },

  deleteRoleProfileSkill: async (
    roleProfileId: number,
    skillId: number
  ): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/role-profiles/${roleProfileId}/skills/${skillId}`
    );
    return response.data;
  },
};

