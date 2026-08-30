export interface UserDetailDTO {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  employeeId: string;
  roleIds: number[];
  roleId?: number;
  regionId?: number | null;
  practiceId?: number | null;
  status?: string;
  profileImageUrl?: string | null;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string;
  employeeId?: string;
  roleIds?: number[];
  roleId?: number;
  regionId?: number | null;
  practiceId?: number | null;
  status?: string;
  profileImageUrl?: string | null;
}

export interface UpdateStatusDTO {
  status: string;
}

export interface UserFilterDTO {
  search?: string;
  roleId?: number;
  status?: string;
}

export interface RoleCatalogDTO {
  id: number;
  name: string;
  description?: string;
}

export interface RegionCatalogDTO {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}

export interface PracticeCatalogDTO {
  id: number;
  name: string;
  leadUserId?: number | null;
  leadUserName?: string | null;
  isActive: boolean;
}
