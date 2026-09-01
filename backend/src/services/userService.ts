import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import {
  UserDetailDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UserFilterDTO,
  RoleCatalogDTO,
  RegionCatalogDTO,
  PracticeCatalogDTO,
  BenchRecordDTO,
} from '../types/user.js';

export class UserService {
  private static emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Helper to map DB row to UserDetailDTO
   */
  private static mapRowToUserDetail(row: any): UserDetailDTO {
    const rawRoleIds = Array.isArray(row.role_ids) ? row.role_ids : (typeof row.role_ids === 'string' ? JSON.parse(row.role_ids) : []);
    const rawRoles = Array.isArray(row.role_names) ? row.role_names : (typeof row.role_names === 'string' ? JSON.parse(row.role_names) : []);

    const roleIds: number[] = rawRoleIds.filter((id: any) => id !== null);
    const roles: string[] = rawRoles.filter((r: any) => r !== null);

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      employeeId: row.employee_id,
      mustResetPassword: row.must_reset_password ?? false,
      roleIds,
      roles,
      roleId: roleIds[0],
      role: roles[0] || 'Resource',
      regionId: row.region_id,
      region: row.region_name || null,
      practiceId: row.practice_id,
      practice: row.practice_name || null,
      profileImageUrl: row.profile_image_url,
      phoneNumber: row.phone_number || null,
      designation: row.designation || 'Engineering Professional',
      experienceYears: row.experience_years ? parseFloat(row.experience_years) : 1.0,
      currentStatus: row.current_status || 'bench',
      status: row.status || 'active',
      joiningDate: row.joining_date ? new Date(row.joining_date).toISOString().split('T')[0] : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Get All Users with JOINs and optional filters
   */
  static async getAllUsers(filters?: UserFilterDTO, excludeUserId?: number): Promise<UserDetailDTO[]> {
    let query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.employee_id,
        u.must_reset_password,
        u.region_id,
        u.practice_id,
        u.profile_image_url,
        u.status,
        u.joining_date,
        u.created_at,
        u.updated_at,
        reg.name AS region_name,
        p.name AS practice_name,
        res.phone_number,
        res.designation,
        res.experience_years,
        res.current_status,
        COALESCE(JSON_AGG(r.id) FILTER (WHERE r.id IS NOT NULL), '[]'::json) AS role_ids,
        COALESCE(JSON_AGG(r.name) FILTER (WHERE r.name IS NOT NULL), '[]'::json) AS role_names
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN regions reg ON u.region_id = reg.id
      LEFT JOIN practices p ON u.practice_id = p.id
      LEFT JOIN resources res ON u.id = res.user_id
      WHERE 1=1
    `;

    const queryParams: any[] = [];

    if (excludeUserId) {
      queryParams.push(excludeUserId);
      query += ` AND u.id != $${queryParams.length}`;
    }

    if (filters?.search) {
      queryParams.push(`%${filters.search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(u.name) LIKE $${queryParams.length} OR LOWER(u.email) LIKE $${queryParams.length} OR LOWER(u.employee_id) LIKE $${queryParams.length})`;
    }

    if (filters?.roleId) {
      queryParams.push(filters.roleId);
      query += ` AND u.id IN (SELECT user_id FROM user_roles WHERE role_id = $${queryParams.length})`;
    }

    if (filters?.regionId) {
      queryParams.push(filters.regionId);
      query += ` AND u.region_id = $${queryParams.length}`;
    }

    if (filters?.status) {
      queryParams.push(filters.status);
      query += ` AND u.status = $${queryParams.length}`;
    }

    query += ` GROUP BY u.id, reg.id, p.id, res.id ORDER BY u.id ASC`;

    const result = await pool.query(query, queryParams);
    return result.rows.map(this.mapRowToUserDetail);
  }

  /**
   * Get User Bench History by User ID
   */
  static async getUserBenchHistory(userId: number): Promise<{ benchRecords: BenchRecordDTO[]; maxBenchDays: number }> {
    const query = `
      SELECT 
        id,
        user_id AS "userId",
        start_date AS "startDate",
        end_date AS "endDate",
        reason,
        GREATEST(1, (COALESCE(end_date, CURRENT_DATE) - start_date))::int AS "durationDays"
      FROM bench_records
      WHERE user_id = $1
      ORDER BY start_date DESC, id DESC
    `;

    const result = await pool.query(query, [userId]);
    const benchRecords: BenchRecordDTO[] = result.rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      startDate: new Date(row.startDate).toISOString().split('T')[0],
      endDate: row.endDate ? new Date(row.endDate).toISOString().split('T')[0] : null,
      reason: row.reason,
      durationDays: row.durationDays,
    }));

    const totalBenchDays = benchRecords.reduce((sum, r) => sum + (r.durationDays || 0), 0);

    return { benchRecords, maxBenchDays: totalBenchDays };
  }

  /**
   * Get Single User by ID with Full Detail and Bench History
   */
  static async getUserById(id: number): Promise<UserDetailDTO> {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.employee_id,
        u.must_reset_password,
        u.region_id,
        u.practice_id,
        u.profile_image_url,
        u.status,
        u.joining_date,
        u.created_at,
        u.updated_at,
        reg.name AS region_name,
        p.name AS practice_name,
        res.phone_number,
        res.designation,
        res.experience_years,
        res.current_status,
        COALESCE(JSON_AGG(r.id) FILTER (WHERE r.id IS NOT NULL), '[]'::json) AS role_ids,
        COALESCE(JSON_AGG(r.name) FILTER (WHERE r.name IS NOT NULL), '[]'::json) AS role_names
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN regions reg ON u.region_id = reg.id
      LEFT JOIN practices p ON u.practice_id = p.id
      LEFT JOIN resources res ON u.id = res.user_id
      WHERE u.id = $1
      GROUP BY u.id, reg.id, p.id, res.id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error('User not found.');
    }

    const userDetail = this.mapRowToUserDetail(result.rows[0]);
    const { benchRecords, maxBenchDays } = await this.getUserBenchHistory(id);

    userDetail.benchRecords = benchRecords;
    userDetail.maxBenchDays = maxBenchDays;

    return userDetail;
  }

  /**
   * Create New User (Auto-generates employee_id if missing; initializes 1:1 Universal Profile)
   */
  static async createUser(dto: CreateUserDTO): Promise<UserDetailDTO> {
    const { name, email, password, employeeId, roleIds: rawRoleIds, roleId: fallbackRoleId, regionId, practiceId, status, profileImageUrl, phoneNumber, designation } = dto;

    const targetRoleIds: number[] = Array.isArray(rawRoleIds) && rawRoleIds.length > 0
      ? rawRoleIds
      : fallbackRoleId ? [fallbackRoleId] : [];

    if (!name || !email || targetRoleIds.length === 0) {
      throw new Error('Name, Email, and at least one Role are required.');
    }

    if (!this.emailRegex.test(email)) {
      throw new Error('Invalid email format.');
    }

    // Check duplicate email
    const emailCheck = await pool.query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [email.trim()]);
    if (emailCheck.rows.length > 0) {
      throw new Error('A user with this email already exists.');
    }

    // Auto-generate employee_id if not provided
    let finalEmployeeId = employeeId ? employeeId.trim() : '';
    if (!finalEmployeeId) {
      const seqRes = await pool.query(`SELECT CONCAT('EMP-', LPAD(nextval('employee_id_seq')::text, 4, '0')) AS emp_id`);
      finalEmployeeId = seqRes.rows[0].emp_id;
    } else {
      const empCheck = await pool.query(`SELECT id FROM users WHERE LOWER(employee_id) = LOWER($1)`, [finalEmployeeId.toLowerCase()]);
      if (empCheck.rows.length > 0) {
        throw new Error('A user with this Employee ID already exists.');
      }
    }

    // Check target roles existence and ADMIN RESTRICTION
    const rolesCheck = await pool.query(`SELECT id, name FROM roles WHERE id = ANY($1::int[])`, [targetRoleIds]);
    if (rolesCheck.rows.length !== targetRoleIds.length) {
      throw new Error('One or more selected roles do not exist.');
    }

    const hasAdminRole = rolesCheck.rows.some((r: any) => r.name === 'System Administrator');
    if (hasAdminRole) {
      throw new Error('Admin account creation is restricted to database seeding only. You cannot assign the System Administrator role via API.');
    }

    // Check region existence if provided
    if (regionId) {
      const regCheck = await pool.query(`SELECT id FROM regions WHERE id = $1`, [regionId]);
      if (regCheck.rows.length === 0) {
        throw new Error('Selected region does not exist.');
      }
    }

    // Check practice existence if provided
    if (practiceId) {
      const pracCheck = await pool.query(`SELECT id FROM practices WHERE id = $1`, [practiceId]);
      if (pracCheck.rows.length === 0) {
        throw new Error('Selected practice does not exist.');
      }
    }

    // Default temporary password if omitted
    const tempPassword = password && password.trim().length > 0 ? password.trim() : 'Welcome@123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(tempPassword, saltRounds);
    const userStatus = status || 'active';

    const insertQuery = `
      INSERT INTO users (name, email, password_hash, employee_id, must_reset_password, region_id, practice_id, status, profile_image_url)
      VALUES ($1, $2, $3, $4, TRUE, $5, $6, $7, $8)
      RETURNING id
    `;

    const insertResult = await pool.query(insertQuery, [
      name.trim(),
      email.trim(),
      passwordHash,
      finalEmployeeId,
      regionId || null,
      practiceId || null,
      userStatus,
      profileImageUrl || null,
    ]);

    const newUserId = insertResult.rows[0].id;

    // Link user roles in user_roles table
    for (const rid of targetRoleIds) {
      await pool.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [newUserId, rid]);
    }

    // Universal Profile Extension Record Insertion (1:1 with users)
    await pool.query(
      `INSERT INTO resources (user_id, region_id, practice_id, phone_number, designation, current_status)
       VALUES ($1, $2, $3, $4, $5, 'bench')
       ON CONFLICT (user_id) DO NOTHING`,
      [
        newUserId,
        regionId || null,
        practiceId || null,
        phoneNumber || null,
        designation || 'Engineering Professional',
      ]
    );

    // Initial Bench History Record
    await pool.query(
      `INSERT INTO bench_records (user_id, start_date, reason) VALUES ($1, CURRENT_DATE, 'Initial Bench Placement')`,
      [newUserId]
    );

    return this.getUserById(newUserId);
  }

  /**
   * Update Existing User Profile
   */
  static async updateUser(id: number, dto: UpdateUserDTO, isAdmin: boolean = false): Promise<UserDetailDTO> {
    const currentUser = await this.getUserById(id);

    const name = dto.name !== undefined ? dto.name.trim() : currentUser.name;
    const email = dto.email !== undefined ? dto.email.trim() : currentUser.email;
    const regionId = dto.regionId !== undefined ? dto.regionId : currentUser.regionId;
    const practiceId = dto.practiceId !== undefined ? dto.practiceId : currentUser.practiceId;
    const status = dto.status !== undefined ? dto.status : currentUser.status;
    const profileImageUrl = dto.profileImageUrl !== undefined ? dto.profileImageUrl : currentUser.profileImageUrl;

    let targetRoleIds: number[] | undefined = undefined;
    if (dto.roleIds !== undefined && Array.isArray(dto.roleIds) && dto.roleIds.length > 0) {
      targetRoleIds = dto.roleIds;
    } else if (dto.roleId !== undefined) {
      targetRoleIds = [dto.roleId];
    }

    if (email && !this.emailRegex.test(email)) {
      throw new Error('Invalid email format.');
    }

    // Duplicate email check
    if (email && email.toLowerCase() !== currentUser.email.toLowerCase()) {
      const emailCheck = await pool.query(
        `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2`,
        [email, id]
      );
      if (emailCheck.rows.length > 0) {
        throw new Error('A user with this email already exists.');
      }
    }

    // Role updates validation
    if (targetRoleIds) {
      const rolesCheck = await pool.query(`SELECT id, name FROM roles WHERE id = ANY($1::int[])`, [targetRoleIds]);
      if (rolesCheck.rows.length !== targetRoleIds.length) {
        throw new Error('One or more selected roles do not exist.');
      }

      const hasAdminRole = rolesCheck.rows.some((r: any) => r.name === 'System Administrator');
      if (hasAdminRole) {
        throw new Error('Admin role modification via API is restricted.');
      }
    }

    let passwordHash = undefined;
    if (dto.password && dto.password.trim().length > 0) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (passwordHash) {
      await pool.query(
        `UPDATE users 
         SET name = $1, email = $2, region_id = $3, practice_id = $4, status = $5, profile_image_url = $6, password_hash = $7, updated_at = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [name, email, regionId, practiceId, status, profileImageUrl, passwordHash, id]
      );
    } else {
      await pool.query(
        `UPDATE users 
         SET name = $1, email = $2, region_id = $3, practice_id = $4, status = $5, profile_image_url = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [name, email, regionId, practiceId, status, profileImageUrl, id]
      );
    }

    // Update user_roles junction table if roleIds provided
    if (targetRoleIds) {
      await pool.query(`DELETE FROM user_roles WHERE user_id = $1`, [id]);
      for (const rid of targetRoleIds) {
        await pool.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, rid]);
      }
    }

    // Update Universal Profile in resources table
    const phoneNumber = dto.phoneNumber !== undefined ? dto.phoneNumber : currentUser.phoneNumber;
    const designation = dto.designation !== undefined ? dto.designation : currentUser.designation;
    const experienceYears = dto.experienceYears !== undefined ? dto.experienceYears : currentUser.experienceYears;

    // Resource status updates: ONLY Admin can modify current_status
    let newCurrentStatus = currentUser.currentStatus;
    if (isAdmin && dto.currentStatus && dto.currentStatus !== currentUser.currentStatus) {
      newCurrentStatus = dto.currentStatus;

      // Handle bench_records tracking state machine transitions
      if (newCurrentStatus === 'bench') {
        // Create new open bench record
        await pool.query(
          `INSERT INTO bench_records (user_id, start_date, reason) VALUES ($1, CURRENT_DATE, 'Re-entered Bench Status')`,
          [id]
        );
      } else if (currentUser.currentStatus === 'bench') {
        // Close active bench record
        await pool.query(
          `UPDATE bench_records SET end_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND end_date IS NULL`,
          [id]
        );
      }
    }

    await pool.query(
      `INSERT INTO resources (user_id, region_id, practice_id, phone_number, designation, experience_years, current_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE 
       SET region_id = EXCLUDED.region_id,
           practice_id = EXCLUDED.practice_id,
           phone_number = EXCLUDED.phone_number,
           designation = EXCLUDED.designation,
           experience_years = EXCLUDED.experience_years,
           current_status = EXCLUDED.current_status,
           updated_at = CURRENT_TIMESTAMP`,
      [id, regionId, practiceId, phoneNumber, designation, experienceYears, newCurrentStatus]
    );

    return this.getUserById(id);
  }

  /**
   * Update User Account Status (Active/Inactive)
   */
  static async updateUserStatus(id: number, status: string): Promise<UserDetailDTO> {
    if (!status || !['active', 'inactive'].includes(status.toLowerCase())) {
      throw new Error('Status must be either "active" or "inactive".');
    }

    await this.getUserById(id);

    await pool.query(
      `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status.toLowerCase(), id]
    );

    return this.getUserById(id);
  }

  /**
   * Delete User (Admin Only)
   */
  static async deleteUser(id: number, currentAdminUserId?: number): Promise<void> {
    const userToDelete = await this.getUserById(id);

    if (currentAdminUserId && id === currentAdminUserId) {
      throw new Error('You cannot delete your own Administrator account.');
    }

    if (userToDelete.roles.includes('System Administrator')) {
      throw new Error('System Administrator account cannot be deleted.');
    }

    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
  }

  /**
   * Catalog Queries
   */
  static async getRoles(): Promise<RoleCatalogDTO[]> {
    const res = await pool.query(`SELECT id, name, description FROM roles WHERE name != 'System Administrator' ORDER BY id ASC`);
    return res.rows;
  }

  static async getRegions(): Promise<RegionCatalogDTO[]> {
    const res = await pool.query(`SELECT id, name, code, is_active AS "isActive" FROM regions ORDER BY id ASC`);
    return res.rows;
  }

  static async getPractices(): Promise<PracticeCatalogDTO[]> {
    const query = `
      SELECT 
        p.id, 
        p.name, 
        p.region_id AS "regionId",
        reg.name AS "regionName",
        p.lead_user_id AS "leadUserId", 
        u.name AS "leadUserName",
        p.is_active AS "isActive" 
      FROM practices p
      LEFT JOIN regions reg ON p.region_id = reg.id
      LEFT JOIN users u ON p.lead_user_id = u.id
      ORDER BY p.id ASC
    `;
    const res = await pool.query(query);
    return res.rows;
  }

  static async getPracticesByRegion(regionId: number): Promise<PracticeCatalogDTO[]> {
    const query = `
      SELECT 
        p.id, 
        p.name, 
        p.region_id AS "regionId",
        reg.name AS "regionName",
        p.lead_user_id AS "leadUserId", 
        u.name AS "leadUserName",
        p.is_active AS "isActive" 
      FROM practices p
      LEFT JOIN regions reg ON p.region_id = reg.id
      LEFT JOIN users u ON p.lead_user_id = u.id
      WHERE p.region_id = $1
      ORDER BY p.id ASC
    `;
    const res = await pool.query(query, [regionId]);
    return res.rows;
  }
}
