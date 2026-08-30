import { pool } from '../config/db.js';

export interface RegionData {
  name: string;
  code: string;
  status?: string;
}

export class RegionService {
  static async getAllRegions() {
    const query = `
      SELECT r.id, r.name, r.code,
             COALESCE(r.status, CASE WHEN r.is_active THEN 'active' ELSE 'inactive' END, 'active') as status,
             COALESCE(r.is_active, TRUE) as is_active,
             COALESCE(r.created_at, CURRENT_TIMESTAMP) as created_at,
             COALESCE(r.updated_at, CURRENT_TIMESTAMP) as updated_at,
             COUNT(u.id)::int as total_users
      FROM regions r
      LEFT JOIN users u ON u.region_id = r.id
      GROUP BY r.id
      ORDER BY r.name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getRegionById(id: number) {
    const query = `
      SELECT r.id, r.name, r.code,
             COALESCE(r.status, CASE WHEN r.is_active THEN 'active' ELSE 'inactive' END, 'active') as status,
             COALESCE(r.is_active, TRUE) as is_active,
             COALESCE(r.created_at, CURRENT_TIMESTAMP) as created_at,
             COALESCE(r.updated_at, CURRENT_TIMESTAMP) as updated_at,
             COUNT(u.id)::int as total_users
      FROM regions r
      LEFT JOIN users u ON u.region_id = r.id
      WHERE r.id = $1
      GROUP BY r.id
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  static async createRegion(data: RegionData) {
    const { name, code, status = 'active' } = data;
    const is_active = status === 'active';
    const query = `
      INSERT INTO regions (name, code, status, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, code, status, is_active, created_at, updated_at
    `;
    const result = await pool.query(query, [name.trim(), code.trim().toUpperCase(), status, is_active]);
    return result.rows[0];
  }

  static async updateRegion(id: number, data: RegionData) {
    const { name, code, status = 'active' } = data;
    const is_active = status === 'active';
    const query = `
      UPDATE regions
      SET name = $1, code = $2, status = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, code, status, is_active, created_at, updated_at
    `;
    const result = await pool.query(query, [name.trim(), code.trim().toUpperCase(), status, is_active, id]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  static async toggleRegionStatus(id: number, status: string) {
    const is_active = status === 'active';
    const query = `
      UPDATE regions
      SET status = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, name, code, status, is_active, created_at, updated_at
    `;
    const result = await pool.query(query, [status, is_active, id]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }
}
