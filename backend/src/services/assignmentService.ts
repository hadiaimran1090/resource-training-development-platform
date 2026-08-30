import { pool } from '../config/db.js';
import { AuthPayload } from '../types/auth.js';

export interface AssignmentData {
  resource_id: number;
  client_name: string;
  project_name?: string;
  start_date: string;
  end_date?: string | null;
  status?: 'active' | 'completed' | 'cancelled';
}

export class AssignmentService {
  /**
   * Helper to get user's assigned region_id from PostgreSQL users table
   */
  static async getUserRegionId(userId: number): Promise<number | null> {
    const res = await pool.query(`SELECT region_id FROM users WHERE id = $1`, [userId]);
    return res.rows[0]?.region_id || null;
  }

  /**
   * Fetch assignments based on user's role and regional scope
   */
  static async getAllAssignments(user: AuthPayload) {
    const isSystemAdminOrMgmt = user.roles?.some((r) =>
      ['System Administrator', 'Management', 'Practice Lead'].includes(r)
    );
    const isRegionalLead = user.roles?.includes('Regional Lead');
    const isResource = user.roles?.includes('Resource');

    let whereClause = '';
    const queryParams: any[] = [];

    if (!isSystemAdminOrMgmt && isRegionalLead) {
      const userRegionId = await this.getUserRegionId(user.userId);
      if (userRegionId) {
        queryParams.push(userRegionId);
        whereClause = `WHERE (u.region_id = $1 OR r.region_id = $1)`;
      } else {
        whereClause = `WHERE 1=0`; // No region assigned to lead
      }
    } else if (!isSystemAdminOrMgmt && isResource) {
      queryParams.push(user.userId);
      whereClause = `WHERE r.user_id = $1`;
    }

    const query = `
      SELECT a.id, a.resource_id, a.client_name, a.project_name, a.start_date, a.end_date, a.status, a.created_at, a.updated_at,
             u.name as resource_name, u.email as resource_email, u.employee_id as resource_employee_id,
             r.designation, r.current_status as resource_status,
             reg.id as region_id, reg.name as region_name, reg.code as region_code
      FROM assignments a
      INNER JOIN resources r ON a.resource_id = r.id
      INNER JOIN users u ON r.user_id = u.id
      LEFT JOIN regions reg ON u.region_id = reg.id
      ${whereClause}
      ORDER BY a.start_date DESC, a.id DESC
    `;
    const result = await pool.query(query, queryParams);
    return result.rows;
  }

  /**
   * Fetch resources eligible for assignment creation in user's region
   */
  static async getAssignableResources(user: AuthPayload) {
    const isSystemAdminOrMgmt = user.roles?.some((r) =>
      ['System Administrator', 'Management', 'Practice Lead'].includes(r)
    );
    const isRegionalLead = user.roles?.includes('Regional Lead');

    let whereClause = `WHERE u.status = 'active'`;
    const queryParams: any[] = [];

    if (!isSystemAdminOrMgmt && isRegionalLead) {
      const userRegionId = await this.getUserRegionId(user.userId);
      if (userRegionId) {
        queryParams.push(userRegionId);
        whereClause += ` AND (u.region_id = $1 OR r.region_id = $1)`;
      } else {
        whereClause += ` AND 1=0`;
      }
    }

    const query = `
      SELECT r.id as resource_id, u.id as user_id, u.name, u.email, u.employee_id,
             r.designation, r.current_status,
             reg.name as region_name, reg.code as region_code
      FROM resources r
      INNER JOIN users u ON r.user_id = u.id
      LEFT JOIN regions reg ON u.region_id = reg.id
      ${whereClause}
      ORDER BY u.name ASC
    `;
    const result = await pool.query(query, queryParams);
    return result.rows;
  }

  /**
   * Create a new client/project assignment with Regional Lead authorization check
   */
  static async createAssignment(user: AuthPayload, data: AssignmentData) {
    const {
      resource_id,
      client_name,
      project_name = '',
      start_date,
      end_date = null,
      status = 'active',
    } = data;

    // Fetch resource and region info
    const resQuery = await pool.query(
      `SELECT r.id, r.user_id, COALESCE(u.region_id, r.region_id) as region_id
       FROM resources r
       INNER JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [resource_id]
    );

    if (resQuery.rows.length === 0) {
      throw new Error('Selected resource does not exist.');
    }

    const resourceObj = resQuery.rows[0];

    // Authorization check for Regional Lead
    const isSystemAdminOrMgmt = user.roles?.some((r) =>
      ['System Administrator', 'Management'].includes(r)
    );
    if (!isSystemAdminOrMgmt && user.roles?.includes('Regional Lead')) {
      const leadRegionId = await this.getUserRegionId(user.userId);
      if (!leadRegionId || Number(leadRegionId) !== Number(resourceObj.region_id)) {
        throw new Error('Forbidden: You can only assign client projects to resources within your assigned region.');
      }
    }

    // Single active assignment rule: If creating active assignment, auto-complete previous active assignments
    if (status === 'active') {
      const activeAssignments = await pool.query(
        `SELECT id FROM assignments WHERE resource_id = $1 AND status = 'active'`,
        [resource_id]
      );

      for (const oldAsg of activeAssignments.rows) {
        await pool.query(
          `UPDATE assignments
           SET status = 'completed', end_date = COALESCE(end_date, $1::date), updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [start_date, oldAsg.id]
        );
      }
    }

    const query = `
      INSERT INTO assignments (resource_id, client_name, project_name, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, resource_id, client_name, project_name, start_date, end_date, status, created_at, updated_at
    `;
    const result = await pool.query(query, [
      resource_id,
      client_name.trim(),
      project_name ? project_name.trim() : null,
      start_date,
      end_date,
      status,
    ]);

    // Update resource status in resources table
    if (status === 'active') {
      await pool.query(
        `UPDATE resources SET current_status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [resource_id]
      );
    }

    return result.rows[0];
  }

  /**
   * Update an existing assignment with Regional Lead authorization check
   */
  static async updateAssignment(user: AuthPayload, id: number, data: Partial<AssignmentData>) {
    // Fetch assignment & resource region info
    const asgRes = await pool.query(
      `SELECT a.id, a.resource_id, a.status as old_status, COALESCE(u.region_id, r.region_id) as region_id
       FROM assignments a
       INNER JOIN resources r ON a.resource_id = r.id
       INNER JOIN users u ON r.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (asgRes.rows.length === 0) {
      return null;
    }

    const existingAsg = asgRes.rows[0];

    // Authorization check for Regional Lead
    const isSystemAdminOrMgmt = user.roles?.some((r) =>
      ['System Administrator', 'Management'].includes(r)
    );
    if (!isSystemAdminOrMgmt && user.roles?.includes('Regional Lead')) {
      const leadRegionId = await this.getUserRegionId(user.userId);
      if (!leadRegionId || Number(leadRegionId) !== Number(existingAsg.region_id)) {
        throw new Error('Forbidden: You can only modify assignments for resources within your assigned region.');
      }
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.client_name !== undefined) {
      fields.push(`client_name = $${idx++}`);
      values.push(data.client_name.trim());
    }
    if (data.project_name !== undefined) {
      fields.push(`project_name = $${idx++}`);
      values.push(data.project_name ? data.project_name.trim() : null);
    }
    if (data.start_date !== undefined) {
      fields.push(`start_date = $${idx++}`);
      values.push(data.start_date);
    }
    if (data.end_date !== undefined) {
      fields.push(`end_date = $${idx++}`);
      values.push(data.end_date);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }

    // Business rule: If completing assignment and end_date is missing, default to current date
    if (data.status === 'completed' && data.end_date === undefined) {
      fields.push(`end_date = COALESCE(end_date, CURRENT_DATE)`);
    }

    if (fields.length === 0) return existingAsg;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE assignments
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, resource_id, client_name, project_name, start_date, end_date, status, created_at, updated_at
    `;
    const result = await pool.query(query, values);
    const updatedAsg = result.rows[0];

    // Sync resource bench status
    const targetStatus = data.status || existingAsg.old_status;
    if (targetStatus === 'completed' || targetStatus === 'cancelled') {
      const activeRes = await pool.query(
        `SELECT id FROM assignments WHERE resource_id = $1 AND status = 'active'`,
        [existingAsg.resource_id]
      );
      if (activeRes.rows.length === 0) {
        await pool.query(
          `UPDATE resources SET current_status = 'bench', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [existingAsg.resource_id]
        );
      }
    } else if (targetStatus === 'active') {
      await pool.query(
        `UPDATE resources SET current_status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [existingAsg.resource_id]
      );
    }

    return updatedAsg;
  }

  /**
   * Toggle or update assignment status
   */
  static async toggleAssignmentStatus(user: AuthPayload, id: number, status: 'active' | 'completed' | 'cancelled', endDate?: string) {
    return this.updateAssignment(user, id, { status, end_date: endDate || (status === 'completed' ? new Date().toISOString().split('T')[0] : null) });
  }

  /**
   * Delete assignment with Regional Lead authorization check
   */
  static async deleteAssignment(user: AuthPayload, id: number) {
    const asgRes = await pool.query(
      `SELECT a.id, a.resource_id, a.status, COALESCE(u.region_id, r.region_id) as region_id
       FROM assignments a
       INNER JOIN resources r ON a.resource_id = r.id
       INNER JOIN users u ON r.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (asgRes.rows.length === 0) {
      return null;
    }

    const existingAsg = asgRes.rows[0];

    // Authorization check for Regional Lead
    const isSystemAdminOrMgmt = user.roles?.some((r) =>
      ['System Administrator', 'Management'].includes(r)
    );
    if (!isSystemAdminOrMgmt && user.roles?.includes('Regional Lead')) {
      const leadRegionId = await this.getUserRegionId(user.userId);
      if (!leadRegionId || Number(leadRegionId) !== Number(existingAsg.region_id)) {
        throw new Error('Forbidden: You can only delete assignments for resources within your assigned region.');
      }
    }

    await pool.query(`DELETE FROM assignments WHERE id = $1`, [id]);

    // If deleted assignment was active, check if resource has remaining active assignments
    if (existingAsg.status === 'active') {
      const activeRes = await pool.query(
        `SELECT id FROM assignments WHERE resource_id = $1 AND status = 'active'`,
        [existingAsg.resource_id]
      );
      if (activeRes.rows.length === 0) {
        await pool.query(
          `UPDATE resources SET current_status = 'bench', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [existingAsg.resource_id]
        );
      }
    }

    return true;
  }
}
