export interface BenchRecordDTO {
  id: number;
  userId: number;
  startDate: string;
  endDate: string | null;
  reason?: string | null;
  durationDays: number;
}

export interface UserDetailDTO {
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
  benchRecords?: BenchRecordDTO[];
  maxBenchDays?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
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

export interface UpdateUserDTO {
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

export interface UpdateStatusDTO {
  status: string;
}

export interface UserFilterDTO {
  search?: string;
  roleId?: number;
  status?: string;
  regionId?: number;
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
  regionId?: number | null;
  regionName?: string | null;
  leadUserId?: number | null;
  leadUserName?: string | null;
  isActive: boolean;
}

