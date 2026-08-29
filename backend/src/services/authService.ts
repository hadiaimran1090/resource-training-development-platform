import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { LoginDTO, UserDTO } from '../types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'rtdp_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export class AuthService {
  /**
   * Authenticate user with email and password
   */
  static async login(loginDto: LoginDTO): Promise<{ token: string; user: UserDTO }> {
    const { email, password } = loginDto;

    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    // Query user with joined role and region names
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.password_hash, 
        u.employee_id, 
        u.profile_image_url, 
        u.status,
        r.name AS role_name, 
        reg.name AS region_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN regions reg ON u.region_id = reg.id
      WHERE LOWER(u.email) = LOWER($1)
    `;

    const result = await pool.query(query, [email.trim()]);

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password.');
    }

    const row = result.rows[0];

    // Check account status
    if (row.status !== 'active') {
      throw new Error('Account is inactive. Please contact system administrator.');
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, row.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password.');
    }

    // Prepare safe UserDTO (never include password_hash)
    const userDto: UserDTO = {
      id: row.id,
      name: row.name,
      email: row.email,
      employeeId: row.employee_id,
      role: row.role_name || 'Resource',
      region: row.region_name || 'Global',
      profileImageUrl: row.profile_image_url,
      status: row.status,
    };

    // Generate JWT Token
    const options: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as jwt.Secret | any,
    };

    const token = jwt.sign(
      {
        userId: userDto.id,
        email: userDto.email,
        role: userDto.role,
      },
      JWT_SECRET,
      options
    );

    return { token, user: userDto };
  }

  /**
   * Fetch current user profile by user ID
   */
  static async getCurrentUser(userId: number): Promise<UserDTO> {
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.employee_id, 
        u.profile_image_url, 
        u.status,
        r.name AS role_name, 
        reg.name AS region_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN regions reg ON u.region_id = reg.id
      WHERE u.id = $1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new Error('User not found.');
    }

    const row = result.rows[0];

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      employeeId: row.employee_id,
      role: row.role_name || 'Resource',
      region: row.region_name || 'Global',
      profileImageUrl: row.profile_image_url,
      status: row.status,
    };
  }
}
