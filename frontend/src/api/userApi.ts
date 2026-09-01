import { apiClient } from './apiClient';

export interface BenchRecord {
  id: number;
  userId: number;
  startDate: string;
  endDate: string | null;
  durationDays: number;
}

export interface UserDetail {
  id: number;
  name: string;
  email: string;
  employeeId: string;
  mustResetPassword: boolean;
  roleIds: number[];
  roles: string[];
  roleId?: number;
  role?: string;
  regionId?: number | null;
  region?: string | null;
  practiceId?: number | null;
  practice?: string | null;
  profileImageUrl?: string | null;
  phoneNumber?: string | null;
  designation?: string | null;
  experienceYears?: number | null;
  currentStatus?: string | null;
  status: string;
  joiningDate?: string | null;
  benchRecords?: BenchRecord[];
  maxBenchDays?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password?: string;
  employeeId?: string;
  roleIds: number[];
  roleId?: number;
  regionId?: number | null;
  practiceId?: number | null;
  phoneNumber?: string | null;
  designation?: string | null;
  status?: string;
  profileImageUrl?: string | null;
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
  phoneNumber?: string | null;
  designation?: string | null;
  experienceYears?: number | null;
  currentStatus?: string | null;
  status?: string;
  profileImageUrl?: string | null;
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
  regionId?: number | null;
  regionName?: string | null;
  leadUserId?: number | null;
  leadUserName?: string | null;
  isActive: boolean;
}

export interface UsersResponse {
  success: boolean;
  message: string;
  data: UserDetail[];
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: UserDetail;
}

export interface BenchHistoryResponse {
  success: boolean;
  message: string;
  data: {
    userId: number;
    userName: string;
    employeeId: string;
    currentStatus: string;
    totalBenchDays: number;
    benchRecords: BenchRecord[];
  };
}

export interface RolesResponse {
  success: boolean;
  message: string;
  data: RoleCatalog[];
}

export interface RegionsResponse {
  success: boolean;
  message: string;
  data: RegionCatalog[];
}

export interface PracticesResponse {
  success: boolean;
  message: string;
  data: PracticeCatalog[];
}

export const userApi = {
  getUsers: async (filters?: {
    search?: string;
    roleId?: number;
    regionId?: number;
    status?: string;
  }): Promise<UserDetail[]> => {
    return userApi.getAllUsers(filters);
  },

  getAllUsers: async (filters?: {
    search?: string;
    roleId?: number;
    regionId?: number;
    status?: string;
  }): Promise<UserDetail[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.roleId) params.append('roleId', filters.roleId.toString());
    if (filters?.regionId) params.append('regionId', filters.regionId.toString());
    if (filters?.status) params.append('status', filters.status);

    const response = await apiClient.get<UsersResponse>(`/users?${params.toString()}`);
    return response.data.data;
  },

  getUserById: async (id: number): Promise<UserDetail> => {
    const response = await apiClient.get<UserResponse>(`/users/${id}`);
    return response.data.data;
  },

  getUserBenchHistory: async (id: number) => {
    const response = await apiClient.get<BenchHistoryResponse>(`/users/${id}/bench-history`);
    return response.data.data;
  },

  createUser: async (data: CreateUserData): Promise<UserDetail> => {
    const response = await apiClient.post<UserResponse>('/users', data);
    return response.data.data;
  },

  updateUser: async (id: number, data: UpdateUserData): Promise<UserDetail> => {
    const response = await apiClient.put<UserResponse>(`/users/${id}`, data);
    return response.data.data;
  },

  updateUserStatus: async (id: number, status: string): Promise<UserDetail> => {
    const response = await apiClient.patch<UserResponse>(`/users/${id}/status`, { status });
    return response.data.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  getRoles: async (): Promise<RoleCatalog[]> => {
    const response = await apiClient.get<RolesResponse>('/roles');
    return response.data.data;
  },

  getRegions: async (): Promise<RegionCatalog[]> => {
    const response = await apiClient.get<RegionsResponse>('/regions');
    return response.data.data;
  },

  getPractices: async (regionId?: number): Promise<PracticeCatalog[]> => {
    const url = regionId ? `/practices?regionId=${regionId}` : '/practices';
    const response = await apiClient.get<PracticesResponse>(url);
    return response.data.data;
  },
};