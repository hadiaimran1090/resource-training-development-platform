import { pool } from '../config/db.js';

export interface AssignmentData {
  resource_id: number;
  client_name: string;
  project_name?: string;
  start_date: string;
  end_date?: string | null;
  status?: 'active' | 'completed' | 'cancelled';
}

export class AssignmentService {
  static async getAllAssignments() {
    const query = `
      SELECT a.id, a.resource_id, a.client_name, a.project_name, a.start_date, a.end_date, a.status, a.created_at, a.updated_at,
             u.name as resource_name, u.email as resource_email, u.employee_id as resource_employee_id,
             r.designation, r.current_status as resource_status
      FROM assignments a
      INNER JOIN resources r ON a.resource_id = r.id
      INNER JOIN users u ON r.user_id = u.id
      ORDER BY a.start_date DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async createAssignment(data: AssignmentData) {
    const {
      resource_id,
      client_name,
      project_name = '',
      start_date,
      end_date = null,
      status = 'active',
    } = data;

    const query = `
      INSERT INTO assignments (resource_id, client_name, project_name, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, resource_id, client_name, project_name, start_date, end_date, status, created_at, updated_at
    `;
    const result = await pool.query(query, [
      resource_id,
      client_name.trim(),
      project_name.trim(),
      start_date,
      end_date,
      status,
    ]);

    // Automatically update resource status to 'assigned' if assignment is active
    if (status === 'active') {
      await pool.query(
        `UPDATE resources SET current_status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [resource_id]
      );
    }

    return result.rows[0];
  }

  static async updateAssignment(id: number, data: Partial<AssignmentData>) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.client_name !== undefined) {
      fields.push(`client_name = $${idx++}`);
      values.push(data.client_name.trim());
    }
    if (data.project_name !== undefined) {
      fields.push(`project_name = $${idx++}`);
      values.push(data.project_name.trim());
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

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE assignments
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, resource_id, client_name, project_name, start_date, end_date, status, created_at, updated_at
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async toggleAssignmentStatus(id: number, status: 'active' | 'completed' | 'cancelled') {
    const query = `
      UPDATE assignments
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, resource_id, client_name, project_name, start_date, end_date, status, created_at, updated_at
    `;
    const result = await pool.query(query, [status, id]);
    if (result.rows.length === 0) return null;

    const updatedAssignment = result.rows[0];

    // If completed or cancelled, check if resource has any remaining active assignments
    if (status !== 'active') {
      const activeRes = await pool.query(
        `SELECT id FROM assignments WHERE resource_id = $1 AND status = 'active'`,
        [updatedAssignment.resource_id]
      );
      if (activeRes.rows.length === 0) {
        await pool.query(
          `UPDATE resources SET current_status = 'bench', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [updatedAssignment.resource_id]
        );
      }
    } else {
      await pool.query(
        `UPDATE resources SET current_status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [updatedAssignment.resource_id]
      );
    }

    return updatedAssignment;
  }
}
