import { pool } from '../config/db.js';

export interface RegionData {
  name: string;
  code: string;
  status?: string;
  practiceIds?: number[];
}

export class RegionService {
  static async getAllRegions() {
    const query = `
      SELECT r.id, r.name, r.code,
             COALESCE(r.status, CASE WHEN r.is_active THEN 'active' ELSE 'inactive' END, 'active') as status,
             COALESCE(r.is_active, TRUE) as is_active,
             COALESCE(r.created_at, CURRENT_TIMESTAMP) as created_at,
             COALESCE(r.updated_at, CURRENT_TIMESTAMP) as updated_at,
             COUNT(DISTINCT u.id)::int as total_users,
             COALESCE(
               JSON_AGG(
                 DISTINCT JSONB_BUILD_OBJECT('id', p.id, 'name', p.name, 'status', p.status)
               ) FILTER (WHERE p.id IS NOT NULL), '[]'::json
             ) as practices
      FROM regions r
      LEFT JOIN users u ON u.region_id = r.id
      LEFT JOIN region_practices rp ON rp.region_id = r.id
      LEFT JOIN practices p ON p.id = rp.practice_id
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
             COUNT(DISTINCT u.id)::int as total_users,
             COALESCE(
               JSON_AGG(
                 DISTINCT JSONB_BUILD_OBJECT('id', p.id, 'name', p.name, 'status', p.status)
               ) FILTER (WHERE p.id IS NOT NULL), '[]'::json
             ) as practices
      FROM regions r
      LEFT JOIN users u ON u.region_id = r.id
      LEFT JOIN region_practices rp ON rp.region_id = r.id
      LEFT JOIN practices p ON p.id = rp.practice_id
      WHERE r.id = $1
      GROUP BY r.id
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  static async createRegion(data: RegionData) {
    const { name, code, status = 'active', practiceIds } = data;
    const is_active = status === 'active';
    const query = `
      INSERT INTO regions (name, code, status, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, code, status, is_active, created_at, updated_at
    `;
    const result = await pool.query(query, [name.trim(), code.trim().toUpperCase(), status, is_active]);
    const newRegion = result.rows[0];

    if (Array.isArray(practiceIds) && practiceIds.length > 0) {
      for (const pid of practiceIds) {
        await pool.query(
          `INSERT INTO region_practices (region_id, practice_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [newRegion.id, pid]
        );
      }
    }

    return this.getRegionById(newRegion.id);
  }

  static async updateRegion(id: number, data: RegionData) {
    const { name, code, status = 'active', practiceIds } = data;
    const is_active = status === 'active';
    const query = `
      UPDATE regions
      SET name = $1, code = $2, status = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, code, status, is_active, created_at, updated_at
    `;
    const result = await pool.query(query, [name.trim(), code.trim().toUpperCase(), status, is_active, id]);
    if (result.rows.length === 0) return null;

    if (Array.isArray(practiceIds)) {
      // Re-assign practices in junction table without affecting other regions
      await pool.query(`DELETE FROM region_practices WHERE region_id = $1`, [id]);
      for (const pid of practiceIds) {
        await pool.query(
          `INSERT INTO region_practices (region_id, practice_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id, pid]
        );
      }
    }

    return this.getRegionById(id);
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
    return this.getRegionById(id);
  }
}
