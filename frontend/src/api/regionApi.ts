import { apiClient } from './apiClient';

export interface Region {
  id: number;
  name: string;
  code: string;
  status: 'active' | 'inactive';
  is_active: boolean;
  total_users?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRegionData {
  name: string;
  code: string;
  status?: 'active' | 'inactive';
}

export const regionApi = {
  getRegions: async (): Promise<Region[]> => {
    const response = await apiClient.get('/regions');
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.regions)) return data.regions;
    return [];
  },

  getRegionById: async (id: number): Promise<Region> => {
    const response = await apiClient.get(`/regions/${id}`);
    return response.data;
  },

  createRegion: async (data: CreateRegionData): Promise<Region> => {
    const response = await apiClient.post('/regions', data);
    return response.data;
  },

  updateRegion: async (id: number, data: CreateRegionData): Promise<Region> => {
    const response = await apiClient.put(`/regions/${id}`, data);
    return response.data;
  },

  toggleRegionStatus: async (id: number, status: 'active' | 'inactive'): Promise<Region> => {
    const response = await apiClient.patch(`/regions/${id}/status`, { status });
    return response.data;
  },
};
