import { pool } from '../config/db.js';

export interface ResourceData {
  user_id: number;
  region_id?: number | null;
  practice_id?: number | null;
  regional_lead_id?: number | null;
  designation: string;
  experience_years?: number;
  current_status?: 'assigned' | 'bench' | 'training';
}

export class ResourceService {
  static async getAllResources() {
    const query = `
      SELECT r.id, r.user_id, r.designation, r.experience_years, r.current_status, r.created_at, r.updated_at,
             u.name as user_name, u.email as user_email, u.employee_id, u.profile_image_url, u.status as account_status,
             reg.id as region_id, reg.name as region_name, reg.code as region_code,
             prac.id as practice_id, prac.name as practice_name,
             COALESCE(lead.id, reg_lead.id) as regional_lead_id,
             COALESCE(lead.name, reg_lead.name) as regional_lead_name
      FROM resources r
      INNER JOIN users u ON r.user_id = u.id
      LEFT JOIN regions reg ON r.region_id = reg.id
      LEFT JOIN practices prac ON r.practice_id = prac.id
      LEFT JOIN users lead ON r.regional_lead_id = lead.id
      LEFT JOIN (
        SELECT DISTINCT u_lead.id, u_lead.name, u_lead.region_id
        FROM users u_lead
        INNER JOIN user_roles ur_lead ON u_lead.id = ur_lead.user_id
        INNER JOIN roles r_lead ON ur_lead.role_id = r_lead.id
        WHERE r_lead.name = 'Regional Lead'
      ) reg_lead ON reg.id = reg_lead.region_id
      ORDER BY u.name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getResourceById(id: number) {
    const query = `
      SELECT r.id, r.user_id, r.designation, r.experience_years, r.current_status, r.created_at, r.updated_at,
             u.name as user_name, u.email as user_email, u.employee_id, u.profile_image_url, u.status as account_status,
             reg.id as region_id, reg.name as region_name, reg.code as region_code,
             prac.id as practice_id, prac.name as practice_name,
             COALESCE(lead.id, reg_lead.id) as regional_lead_id,
             COALESCE(lead.name, reg_lead.name) as regional_lead_name
      FROM resources r
      INNER JOIN users u ON r.user_id = u.id
      LEFT JOIN regions reg ON r.region_id = reg.id
      LEFT JOIN practices prac ON r.practice_id = prac.id
      LEFT JOIN users lead ON r.regional_lead_id = lead.id
      LEFT JOIN (
        SELECT DISTINCT u_lead.id, u_lead.name, u_lead.region_id
        FROM users u_lead
        INNER JOIN user_roles ur_lead ON u_lead.id = ur_lead.user_id
        INNER JOIN roles r_lead ON ur_lead.role_id = r_lead.id
        WHERE r_lead.name = 'Regional Lead'
      ) reg_lead ON reg.id = reg_lead.region_id
      WHERE r.id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;

    const resource = result.rows[0];

    // Fetch assignments for this resource
    const assignmentsRes = await pool.query(
      `SELECT id, client_name, project_name, start_date, end_date, status, created_at
       FROM assignments
       WHERE resource_id = $1
       ORDER BY start_date DESC`,
      [id]
    );

    resource.assignments = assignmentsRes.rows;
    return resource;
  }

  static async getResourceByUserId(userId: number) {
    const query = `
      SELECT r.id, r.user_id, r.designation, r.experience_years, r.current_status, r.created_at, r.updated_at,
             u.name as user_name, u.email as user_email, u.employee_id, u.profile_image_url, u.status as account_status,
             reg.id as region_id, reg.name as region_name, reg.code as region_code,
             prac.id as practice_id, prac.name as practice_name,
             COALESCE(lead.id, reg_lead.id) as regional_lead_id,
             COALESCE(lead.name, reg_lead.name) as regional_lead_name
      FROM resources r
      INNER JOIN users u ON r.user_id = u.id
      LEFT JOIN regions reg ON r.region_id = reg.id
      LEFT JOIN practices prac ON r.practice_id = prac.id
      LEFT JOIN users lead ON r.regional_lead_id = lead.id
      LEFT JOIN (
        SELECT DISTINCT u_lead.id, u_lead.name, u_lead.region_id
        FROM users u_lead
        INNER JOIN user_roles ur_lead ON u_lead.id = ur_lead.user_id
        INNER JOIN roles r_lead ON ur_lead.role_id = r_lead.id
        WHERE r_lead.name = 'Regional Lead'
      ) reg_lead ON reg.id = reg_lead.region_id
      WHERE r.user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) return null;

    const resource = result.rows[0];
    const assignmentsRes = await pool.query(
      `SELECT id, client_name, project_name, start_date, end_date, status, created_at
       FROM assignments
       WHERE resource_id = $1
       ORDER BY start_date DESC`,
      [resource.id]
    );

    resource.assignments = assignmentsRes.rows;
    return resource;
  }

  static async createOrUpdateResource(data: ResourceData) {
    const {
      user_id,
      region_id = null,
      practice_id = null,
      regional_lead_id = null,
      designation,
      experience_years = 1.0,
      current_status = 'bench',
    } = data;

    const query = `
      INSERT INTO resources (user_id, region_id, practice_id, regional_lead_id, designation, experience_years, current_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        region_id = EXCLUDED.region_id,
        practice_id = EXCLUDED.practice_id,
        regional_lead_id = EXCLUDED.regional_lead_id,
        designation = EXCLUDED.designation,
        experience_years = EXCLUDED.experience_years,
        current_status = EXCLUDED.current_status,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, user_id, designation, experience_years, current_status, created_at, updated_at
    `;
    const result = await pool.query(query, [
      user_id,
      region_id,
      practice_id,
      regional_lead_id,
      designation.trim(),
      experience_years,
      current_status,
    ]);
    return result.rows[0];
  }

  static async updateResourceProfile(id: number, data: Partial<ResourceData>) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.region_id !== undefined) {
      fields.push(`region_id = $${idx++}`);
      values.push(data.region_id);
    }
    if (data.practice_id !== undefined) {
      fields.push(`practice_id = $${idx++}`);
      values.push(data.practice_id);
    }
    if (data.regional_lead_id !== undefined) {
      fields.push(`regional_lead_id = $${idx++}`);
      values.push(data.regional_lead_id);
    }
    if (data.designation !== undefined) {
      fields.push(`designation = $${idx++}`);
      values.push(data.designation.trim());
    }
    if (data.experience_years !== undefined) {
      fields.push(`experience_years = $${idx++}`);
      values.push(data.experience_years);
    }
    if (data.current_status !== undefined) {
      fields.push(`current_status = $${idx++}`);
      values.push(data.current_status);
    }

    if (fields.length === 0) return this.getResourceById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE resources
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, user_id, designation, experience_years, current_status, created_at, updated_at
    `;
    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;
    return this.getResourceById(id);
  }
}
