export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  employee_id: string;
  role_id: number;
  region_id: number;
  profile_image_url?: string | null;
  status: string;
  joining_date?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserDTO {
  id: number;
  name: string;
  email: string;
  employeeId: string;
  role: string;
  region: string;
  profileImageUrl?: string | null;
  status: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthPayload {
  userId: number;
  email: string;
  role: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export const ACCESS_TOKEN_COOKIE = 'rtdp_access';
export const REFRESH_TOKEN_COOKIE = 'rtdp_refresh';
