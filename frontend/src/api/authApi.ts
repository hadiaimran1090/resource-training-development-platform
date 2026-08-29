import { apiClient } from './apiClient';

export interface User {
  id: number;
  name: string;
  email: string;
  employeeId: string;
  role: string;
  region: string;
  profileImageUrl?: string | null;
  status: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: User;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse['data']> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<UserResponse>('/auth/me');
    return response.data.data;
  },
};
