import { apiClient } from './apiClient';

export interface UserDetail {
  id: number;
  name: string;
  email: string;
  employeeId: string;
  roleIds: number[];
  roles: string[];
  roleId?: number;
  role?: string;
  regionId?: number | null;
  region?: string | null;
  practiceId?: number | null;
  practice?: string | null;
  profileImageUrl?: string | null;
  status: string;
  joiningDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  employeeId: string;
  roleIds: number[];
  roleId?: number;
  regionId?: number | null;
  practiceId?: number | null;
  status?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  employeeId?: string;
  roleIds?: number[];
  roleId?: number;
  regionId?: number | null;
  practiceId?: number | null;
  status?: string;
}

export interface RoleCatalog {
  id: number;
  name: string;
  description?: string;
}

export interface RegionCatalog {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}

export interface PracticeCatalog {
  id: number;
  name: string;
  leadUserId?: number | null;
  leadUserName?: string | null;
  isActive: boolean;
}

export interface UserListResponse {
  success: boolean;
  message: string;
  data: UserDetail[];
}

export interface SingleUserResponse {
  success: boolean;
  message: string;
  data: UserDetail;
}

export const userApi = {
  getUsers: async (filters?: { search?: string; roleId?: number; status?: string }): Promise<UserDetail[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.roleId) params.append('roleId', filters.roleId.toString());
    if (filters?.status) params.append('status', filters.status);

    const response = await apiClient.get<UserListResponse>(`/users?${params.toString()}`);
    return response.data.data;
  },

  getUserById: async (id: number): Promise<UserDetail> => {
    const response = await apiClient.get<SingleUserResponse>(`/users/${id}`);
    return response.data.data;
  },

  createUser: async (data: CreateUserData): Promise<UserDetail> => {
    const response = await apiClient.post<SingleUserResponse>('/users', data);
    return response.data.data;
  },

  updateUser: async (id: number, data: UpdateUserData): Promise<UserDetail> => {
    const response = await apiClient.put<SingleUserResponse>(`/users/${id}`, data);
    return response.data.data;
  },

  updateUserStatus: async (id: number, status: string): Promise<UserDetail> => {
    const response = await apiClient.patch<SingleUserResponse>(`/users/${id}/status`, { status });
    return response.data.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete<{ success: boolean; message: string }>(`/users/${id}`);
  },

  getRoles: async (): Promise<RoleCatalog[]> => {
    const response = await apiClient.get<{ success: boolean; data: RoleCatalog[] }>('/roles');
    return response.data.data;
  },

  getRegions: async (): Promise<RegionCatalog[]> => {
    const response = await apiClient.get<{ success: boolean; data: RegionCatalog[] }>('/regions');
    return response.data.data;
  },

  getPractices: async (): Promise<PracticeCatalog[]> => {
    const response = await apiClient.get<{ success: boolean; data: PracticeCatalog[] }>('/practices');
    return response.data.data;
  },
};
