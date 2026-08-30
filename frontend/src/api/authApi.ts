import { apiClient } from './apiClient';

export interface User {
  id: number;
  name: string;
  email: string;
  employeeId: string;
  roles: string[];
  role?: string;
  region: string;
  profileImageUrl?: string | null;
  status: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: User;
}

export const authApi = {
  login: async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data.data.user;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refresh: async (): Promise<User> => {
    const response = await apiClient.post<LoginResponse>('/auth/refresh');
    return response.data.data.user;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<UserResponse>('/auth/me');
    return response.data.data;
  },
};
