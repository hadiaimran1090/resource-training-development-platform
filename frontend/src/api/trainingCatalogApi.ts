import { apiClient } from './apiClient';
import type {
  TrainingTrack,
  TrainingProgram,
  TrainingModule,
  TrackFullTree,
  CreateTrackInput,
  UpdateTrackInput,
  CreateProgramInput,
  UpdateProgramInput,
  CreateModuleInput,
  UpdateModuleInput,
  ReorderModuleItem,
} from '../types/trainingCatalog';

export const trainingCatalogApi = {
  // 1. Training Tracks
  getTracks: async (targetRoleProfileId?: number): Promise<TrainingTrack[]> => {
    const response = await apiClient.get<{ success: boolean; data: TrainingTrack[] }>('/training-tracks', {
      params: targetRoleProfileId ? { target_role_profile_id: targetRoleProfileId } : undefined,
    });
    return response.data.data;
  },

  getTrackById: async (id: number): Promise<TrackFullTree> => {
    const response = await apiClient.get<{ success: boolean; data: TrackFullTree }>(`/training-tracks/${id}`);
    return response.data.data;
  },

  createTrack: async (data: CreateTrackInput): Promise<TrainingTrack> => {
    const response = await apiClient.post<{ success: boolean; data: TrainingTrack }>('/training-tracks', data);
    return response.data.data;
  },

  updateTrack: async (id: number, data: UpdateTrackInput): Promise<TrainingTrack> => {
    const response = await apiClient.put<{ success: boolean; data: TrainingTrack }>(`/training-tracks/${id}`, data);
    return response.data.data;
  },

  deleteTrack: async (id: number): Promise<void> => {
    await apiClient.delete(`/training-tracks/${id}`);
  },

  // 2. Training Programs
  getProgramsByTrack: async (trackId: number): Promise<TrainingProgram[]> => {
    const response = await apiClient.get<{ success: boolean; data: TrainingProgram[] }>(
      `/training-tracks/${trackId}/programs`
    );
    return response.data.data;
  },

  createProgram: async (trackId: number, data: CreateProgramInput): Promise<TrainingProgram> => {
    const response = await apiClient.post<{ success: boolean; data: TrainingProgram }>(
      `/training-tracks/${trackId}/programs`,
      data
    );
    return response.data.data;
  },

  updateProgram: async (id: number, data: UpdateProgramInput): Promise<TrainingProgram> => {
    const response = await apiClient.put<{ success: boolean; data: TrainingProgram }>(
      `/training-programs/${id}`,
      data
    );
    return response.data.data;
  },

  deleteProgram: async (id: number): Promise<void> => {
    await apiClient.delete(`/training-programs/${id}`);
  },

  // 3. Training Modules
  getModulesByProgram: async (programId: number): Promise<TrainingModule[]> => {
    const response = await apiClient.get<{ success: boolean; data: TrainingModule[] }>(
      `/training-programs/${programId}/modules`
    );
    return response.data.data;
  },

  createModule: async (programId: number, data: CreateModuleInput): Promise<TrainingModule> => {
    const response = await apiClient.post<{ success: boolean; data: TrainingModule }>(
      `/training-programs/${programId}/modules`,
      data
    );
    return response.data.data;
  },

  updateModule: async (id: number, data: UpdateModuleInput): Promise<TrainingModule> => {
    const response = await apiClient.put<{ success: boolean; data: TrainingModule }>(
      `/training-modules/${id}`,
      data
    );
    return response.data.data;
  },

  deleteModule: async (id: number): Promise<void> => {
    await apiClient.delete(`/training-modules/${id}`);
  },

  reorderModules: async (programId: number, items: ReorderModuleItem[]): Promise<TrainingModule[]> => {
    const response = await apiClient.put<{ success: boolean; data: TrainingModule[] }>(
      `/training-programs/${programId}/modules/reorder`,
      { items }
    );
    return response.data.data;
  },
};
