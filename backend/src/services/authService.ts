import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../config/db.js';
import { LoginDTO, UserDTO, AuthPayload, FirstTimeResetPasswordDTO } from '../types/auth.js';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'rtdp_access_secret_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'rtdp_refresh_secret_2026';

export class AuthService {
  /**
   * Helper to hash refresh token string using SHA256 before DB storage
   */
  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate short-lived Access Token (15 min)
   */
  public static generateAccessToken(payload: AuthPayload): string {
    return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
  }

  /**
   * Generate Refresh Token (7 days)
   */
  public static generateRefreshToken(payload: AuthPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  /**
   * Verify Access Token
   */
  public static verifyAccessToken(token: string): AuthPayload {
    return jwt.verify(token, JWT_ACCESS_SECRET) as AuthPayload;
  }

  /**
   * Verify Refresh Token
   */
  public static verifyRefreshToken(token: string): AuthPayload {
    return jwt.verify(token, JWT_REFRESH_SECRET) as AuthPayload;
  }

  /**
   * Authenticate User with Email & Password
   */
  static async login(
    loginDto: LoginDTO,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ accessToken: string; refreshToken: string; user: UserDTO }> {
    const { email, password } = loginDto;

    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.password_hash, 
        u.employee_id,
        u.must_reset_password,
        u.region_id,
        u.practice_id,
        u.profile_image_url, 
        u.status,
        reg.name AS region_name,
        res.phone_number,
        res.current_status,
        COALESCE(
          JSON_AGG(r.name) FILTER (WHERE r.name IS NOT NULL),
          '[]'::json
        ) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN regions reg ON u.region_id = reg.id
      LEFT JOIN resources res ON u.id = res.user_id
      WHERE LOWER(u.email) = LOWER($1)
      GROUP BY u.id, reg.id, res.id
    `;

    const result = await pool.query(query, [email.trim()]);

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password.');
    }

    const row = result.rows[0];

    if (row.status !== 'active') {
      throw new Error('Account is inactive. Please contact system administrator.');
    }

    const isPasswordValid = await bcrypt.compare(password, row.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password.');
    }

    const roles: string[] = Array.isArray(row.roles) ? row.roles : (typeof row.roles === 'string' ? JSON.parse(row.roles) : []);
    const primaryRole = roles[0] || 'Resource';

    const userDto: UserDTO = {
      id: row.id,
      name: row.name,
      email: row.email,
      employeeId: row.employee_id,
      mustResetPassword: row.must_reset_password ?? false,
      roles,
      role: primaryRole,
      regionId: row.region_id,
      region: row.region_name || 'Global',
      practiceId: row.practice_id,
      phoneNumber: row.phone_number || null,
      currentStatus: row.current_status || 'bench',
      profileImageUrl: row.profile_image_url,
      status: row.status,
    };

    const authPayload: AuthPayload = {
      userId: userDto.id,
      email: userDto.email,
      roles: userDto.roles,
      role: primaryRole,
      regionId: userDto.regionId,
      mustResetPassword: userDto.mustResetPassword,
    };

    const accessToken = this.generateAccessToken(authPayload);
    const refreshToken = this.generateRefreshToken(authPayload);

    // Save refresh token hash in DB
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [userDto.id, tokenHash, expiresAt, meta?.userAgent || null, meta?.ipAddress || null]
    );

    return { accessToken, refreshToken, user: userDto };
  }

  /**
   * Reset password on forced first login
   */
  static async resetFirstPassword(
    userId: number,
    dto: FirstTimeResetPasswordDTO
  ): Promise<UserDTO> {
    const { currentPassword, newPassword } = dto;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    const userQuery = await pool.query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
    if (userQuery.rows.length === 0) {
      throw new Error('User not found.');
    }

    const isMatch = await bcrypt.compare(currentPassword, userQuery.rows[0].password_hash);
    if (!isMatch) {
      throw new Error('Current temporary password is incorrect.');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE users SET password_hash = $1, must_reset_password = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newHash, userId]
    );

    return this.getCurrentUser(userId);
  }

  /**
   * Refresh Tokens
   */
  static async refreshTokens(
    oldRefreshToken: string,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ accessToken: string; refreshToken: string; user: UserDTO }> {
    if (!oldRefreshToken) {
      throw new Error('Refresh token is required.');
    }

    let payload: AuthPayload;
    try {
      payload = this.verifyRefreshToken(oldRefreshToken);
    } catch (err) {
      throw new Error('Invalid or expired refresh token.');
    }

    const oldHash = this.hashToken(oldRefreshToken);

    const tokenRes = await pool.query(
      `SELECT id, user_id, is_revoked, expires_at FROM refresh_tokens WHERE token_hash = $1`,
      [oldHash]
    );

    if (tokenRes.rows.length === 0) {
      throw new Error('Refresh token not found.');
    }

    const tokenRecord = tokenRes.rows[0];

    if (tokenRecord.is_revoked) {
      console.warn(`SECURITY ALERT: Revoked refresh token reuse detected for userId=${payload.userId}. Revoking all sessions.`);
      await pool.query(`UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1`, [payload.userId]);
      throw new Error('Security alert: Revoked refresh token reused. Session invalidated.');
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      throw new Error('Refresh token has expired.');
    }

    const userDto = await this.getCurrentUser(payload.userId);

    const newPayload: AuthPayload = {
      userId: userDto.id,
      email: userDto.email,
      roles: userDto.roles,
      role: userDto.role,
      regionId: userDto.regionId,
      mustResetPassword: userDto.mustResetPassword,
    };

    const newAccessToken = this.generateAccessToken(newPayload);
    const newRefreshToken = this.generateRefreshToken(newPayload);

    const newHash = this.hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE refresh_tokens SET is_revoked = TRUE, replaced_by_token = $1 WHERE id = $2`,
      [newHash, tokenRecord.id]
    );

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [userDto.id, newHash, newExpiresAt, meta?.userAgent || null, meta?.ipAddress || null]
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, user: userDto };
  }

  /**
   * Logout User
   */
  static async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await pool.query(
        `UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1`,
        [tokenHash]
      );
    }
  }

  /**
   * Fetch current user profile
   */
  static async getCurrentUser(userId: number): Promise<UserDTO> {
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
        reg.name AS region_name,
        res.phone_number,
        res.current_status,
        COALESCE(
          JSON_AGG(r.name) FILTER (WHERE r.name IS NOT NULL),
          '[]'::json
        ) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN regions reg ON u.region_id = reg.id
      LEFT JOIN resources res ON u.id = res.user_id
      WHERE u.id = $1
      GROUP BY u.id, reg.id, res.id
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new Error('User not found.');
    }

    const row = result.rows[0];
    const roles: string[] = Array.isArray(row.roles) ? row.roles : (typeof row.roles === 'string' ? JSON.parse(row.roles) : []);
    const primaryRole = roles[0] || 'Resource';

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      employeeId: row.employee_id,
      mustResetPassword: row.must_reset_password ?? false,
      roles,
      role: primaryRole,
      regionId: row.region_id,
      region: row.region_name || 'Global',
      practiceId: row.practice_id,
      phoneNumber: row.phone_number || null,
      currentStatus: row.current_status || 'bench',
      profileImageUrl: row.profile_image_url,
      status: row.status,
    };
  }

  /**
   * Update current user profile
   */
  static async updateProfile(
    userId: number,
    data: { password?: string; profileImageUrl?: string | null; phoneNumber?: string | null }
  ): Promise<UserDTO> {
    const { password, profileImageUrl, phoneNumber } = data;

    if (password && password.trim().length > 0) {
      const passwordHash = await bcrypt.hash(password.trim(), 10);
      await pool.query(
        `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [passwordHash, userId]
      );
    }
    if (profileImageUrl !== undefined) {
      await pool.query(
        `UPDATE users SET profile_image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [profileImageUrl, userId]
      );
    }
    if (phoneNumber !== undefined) {
      await pool.query(
        `INSERT INTO resources (user_id, phone_number) VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET phone_number = EXCLUDED.phone_number, updated_at = CURRENT_TIMESTAMP`,
        [userId, phoneNumber]
      );
    }

    return this.getCurrentUser(userId);
  }
}
