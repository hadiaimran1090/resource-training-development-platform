import { pool } from '../config/db.js';
import { CreateMentoringSessionInput, UpdateMentoringSessionInput } from '../types/mentoringSession.js';

export class MentoringSessionService {
  static async getMentoringSessionsByResource(resourceId: number) {
    const query = `
      SELECT ms.*,
             u_m.name as mentor_name,
             u_res.name as resource_name
      FROM mentoring_sessions ms
      INNER JOIN users u_m ON ms.mentor_id = u_m.id
      INNER JOIN resources r ON ms.resource_id = r.id
      INNER JOIN users u_res ON r.user_id = u_res.id
      WHERE ms.resource_id = $1
      ORDER BY ms.session_date DESC
    `;
    const result = await pool.query(query, [resourceId]);
    return result.rows;
  }

  static async getMentoringSessionsByMentor(mentorUserId: number) {
    const query = `
      SELECT ms.*,
             u_m.name as mentor_name,
             u_res.name as resource_name,
             u_res.email as resource_email,
             r.designation
      FROM mentoring_sessions ms
      INNER JOIN users u_m ON ms.mentor_id = u_m.id
      INNER JOIN resources r ON ms.resource_id = r.id
      INNER JOIN users u_res ON r.user_id = u_res.id
      WHERE ms.mentor_id = $1
      ORDER BY ms.session_date DESC
    `;
    const result = await pool.query(query, [mentorUserId]);
    return result.rows;
  }

  static async getMentoringSessionById(id: number) {
    const query = `
      SELECT ms.*,
             r.user_id as resource_user_id,
             r.region_id as resource_region_id,
             r.mentor_id as resource_mentor_id,
             u_m.name as mentor_name,
             u_res.name as resource_name
      FROM mentoring_sessions ms
      INNER JOIN users u_m ON ms.mentor_id = u_m.id
      INNER JOIN resources r ON ms.resource_id = r.id
      INNER JOIN users u_res ON r.user_id = u_res.id
      WHERE ms.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async createMentoringSession(mentorUserId: number, data: CreateMentoringSessionInput) {
    const { resource_id, session_date, session_type, notes } = data;
    const query = `
      INSERT INTO mentoring_sessions (mentor_id, resource_id, session_date, session_type, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [
      mentorUserId,
      resource_id,
      session_date,
      session_type,
      notes ? notes.trim() : null,
    ]);
    return result.rows[0];
  }

  static async updateMentoringSession(id: number, data: UpdateMentoringSessionInput) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.session_date !== undefined) {
      fields.push(`session_date = $${idx++}`);
      values.push(data.session_date);
    }
    if (data.session_type !== undefined) {
      fields.push(`session_type = $${idx++}`);
      values.push(data.session_type);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(data.notes ? data.notes.trim() : null);
    }

    if (fields.length === 0) return this.getMentoringSessionById(id);

    values.push(id);

    const query = `
      UPDATE mentoring_sessions
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0] ? this.getMentoringSessionById(id) : null;
  }

  static async deleteMentoringSession(id: number) {
    const query = `DELETE FROM mentoring_sessions WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
}
