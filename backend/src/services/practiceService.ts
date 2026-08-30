import { pool } from '../config/db.js';

export interface PracticeData {
  name: string;
  description?: string;
  lead_user_id?: number | null;
  status?: string;
}

export class PracticeService {
  static async getAllPractices() {
    const query = `
      SELECT p.id, p.name,
             COALESCE(p.description, '') as description,
             p.lead_user_id,
             COALESCE(p.status, CASE WHEN p.is_active THEN 'active' ELSE 'inactive' END, 'active') as status,
             COALESCE(p.is_active, TRUE) as is_active,
             COALESCE(p.created_at, CURRENT_TIMESTAMP) as created_at,
             COALESCE(p.updated_at, CURRENT_TIMESTAMP) as updated_at,
             u.name as lead_name, u.email as lead_email,
             COUNT(usr.id)::int as total_users
      FROM practices p
      LEFT JOIN users u ON p.lead_user_id = u.id
      LEFT JOIN users usr ON usr.practice_id = p.id
      GROUP BY p.id, u.name, u.email
      ORDER BY p.name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getPracticeById(id: number) {
    const query = `
      SELECT p.id, p.name,
             COALESCE(p.description, '') as description,
             p.lead_user_id,
             COALESCE(p.status, CASE WHEN p.is_active THEN 'active' ELSE 'inactive' END, 'active') as status,
             COALESCE(p.is_active, TRUE) as is_active,
             COALESCE(p.created_at, CURRENT_TIMESTAMP) as created_at,
             COALESCE(p.updated_at, CURRENT_TIMESTAMP) as updated_at,
             u.name as lead_name, u.email as lead_email,
             COUNT(usr.id)::int as total_users
      FROM practices p
      LEFT JOIN users u ON p.lead_user_id = u.id
      LEFT JOIN users usr ON usr.practice_id = p.id
      WHERE p.id = $1
      GROUP BY p.id, u.name, u.email
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  static async createPractice(data: PracticeData) {
    const { name, description = '', lead_user_id = null, status = 'active' } = data;
    const is_active = status === 'active';
    const query = `
      INSERT INTO practices (name, description, lead_user_id, status, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, lead_user_id, status, is_active, created_at, updated_at
    `;
    const result = await pool.query(query, [name.trim(), description.trim(), lead_user_id, status, is_active]);
    return result.rows[0];
  }

  static async updatePractice(id: number, data: PracticeData) {
    const { name, description = '', lead_user_id = null, status = 'active' } = data;
    const is_active = status === 'active';
    const query = `
      UPDATE practices
      SET name = $1, description = $2, lead_user_id = $3, status = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, name, description, lead_user_id, status, is_active, created_at, updated_at
    `;
    const result = await pool.query(query, [name.trim(), description.trim(), lead_user_id, status, is_active, id]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  static async togglePracticeStatus(id: number, status: string) {
    const is_active = status === 'active';
    const query = `
      UPDATE practices
      SET status = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, name, description, lead_user_id, status, is_active, created_at, updated_at
    `;
    const result = await pool.query(query, [status, is_active, id]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }
}
