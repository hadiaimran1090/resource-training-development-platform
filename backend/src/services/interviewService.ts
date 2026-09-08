import { pool } from '../config/db.js';
import { CreateInterviewFeedbackInput, CreateInterviewInput, UpdateInterviewInput } from '../types/interview.js';

export class InterviewService {
  static async getInterviewsByResource(resourceId: number) {
    const query = `
      SELECT i.*,
             u_res.name as resource_name,
             rp.name as role_profile_name,
             f.id as feedback_id,
             f.technical_gaps,
             f.communication_gaps,
             f.recommendations,
             f.overall_rating,
             f.given_by as feedback_given_by,
             u_fb.name as feedback_given_by_name,
             f.created_at as feedback_created_at
      FROM interviews i
      INNER JOIN resources r ON i.resource_id = r.id
      INNER JOIN users u_res ON r.user_id = u_res.id
      LEFT JOIN role_profiles rp ON i.role_profile_id = rp.id
      LEFT JOIN interview_feedback f ON i.id = f.interview_id
      LEFT JOIN users u_fb ON f.given_by = u_fb.id
      WHERE i.resource_id = $1
      ORDER BY i.interview_date DESC
    `;
    const result = await pool.query(query, [resourceId]);
    return result.rows.map((row: any) => {
      const {
        feedback_id,
        technical_gaps,
        communication_gaps,
        recommendations,
        overall_rating,
        feedback_given_by,
        feedback_given_by_name,
        feedback_created_at,
        ...interview
      } = row;

      if (feedback_id) {
        interview.feedback = {
          id: feedback_id,
          interview_id: interview.id,
          technical_gaps,
          communication_gaps,
          recommendations,
          overall_rating: overall_rating ? parseFloat(overall_rating) : null,
          given_by: feedback_given_by,
          given_by_name: feedback_given_by_name,
          created_at: feedback_created_at,
        };
      } else {
        interview.feedback = null;
      }
      return interview;
    });
  }

  static async getInterviewById(id: number) {
    const query = `
      SELECT i.*,
             r.user_id as resource_user_id,
             r.region_id as resource_region_id,
             r.mentor_id as resource_mentor_id,
             u_res.name as resource_name,
             rp.name as role_profile_name,
             f.id as feedback_id,
             f.technical_gaps,
             f.communication_gaps,
             f.recommendations,
             f.overall_rating,
             f.given_by as feedback_given_by,
             u_fb.name as feedback_given_by_name,
             f.created_at as feedback_created_at
      FROM interviews i
      INNER JOIN resources r ON i.resource_id = r.id
      INNER JOIN users u_res ON r.user_id = u_res.id
      LEFT JOIN role_profiles rp ON i.role_profile_id = rp.id
      LEFT JOIN interview_feedback f ON i.id = f.interview_id
      LEFT JOIN users u_fb ON f.given_by = u_fb.id
      WHERE i.id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const {
      feedback_id,
      technical_gaps,
      communication_gaps,
      recommendations,
      overall_rating,
      feedback_given_by,
      feedback_given_by_name,
      feedback_created_at,
      ...interview
    } = row;

    if (feedback_id) {
      interview.feedback = {
        id: feedback_id,
        interview_id: interview.id,
        technical_gaps,
        communication_gaps,
        recommendations,
        overall_rating: overall_rating ? parseFloat(overall_rating) : null,
        given_by: feedback_given_by,
        given_by_name: feedback_given_by_name,
        created_at: feedback_created_at,
      };
    } else {
      interview.feedback = null;
    }
    return interview;
  }

  static async createInterview(data: CreateInterviewInput) {
    const { resource_id, client_name, role_profile_id, interview_type, interview_date, result = 'pending' } = data;
    const query = `
      INSERT INTO interviews (resource_id, client_name, role_profile_id, interview_type, interview_date, result)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const res = await pool.query(query, [
      resource_id,
      client_name ? client_name.trim() : null,
      role_profile_id || null,
      interview_type,
      interview_date,
      result,
    ]);
    return res.rows[0];
  }

  static async updateInterview(id: number, data: UpdateInterviewInput) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.client_name !== undefined) {
      fields.push(`client_name = $${idx++}`);
      values.push(data.client_name ? data.client_name.trim() : null);
    }
    if (data.role_profile_id !== undefined) {
      fields.push(`role_profile_id = $${idx++}`);
      values.push(data.role_profile_id || null);
    }
    if (data.interview_type !== undefined) {
      fields.push(`interview_type = $${idx++}`);
      values.push(data.interview_type);
    }
    if (data.interview_date !== undefined) {
      fields.push(`interview_date = $${idx++}`);
      values.push(data.interview_date);
    }
    if (data.result !== undefined) {
      fields.push(`result = $${idx++}`);
      values.push(data.result);
    }

    if (fields.length === 0) return this.getInterviewById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE interviews
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;
    const res = await pool.query(query, values);
    return res.rows[0] ? this.getInterviewById(id) : null;
  }

  static async addInterviewFeedback(
    interviewId: number,
    givenByUserId: number,
    data: CreateInterviewFeedbackInput
  ) {
    const { technical_gaps, communication_gaps, recommendations, overall_rating } = data;
    const query = `
      INSERT INTO interview_feedback (interview_id, technical_gaps, communication_gaps, recommendations, overall_rating, given_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (interview_id) DO UPDATE SET
        technical_gaps = EXCLUDED.technical_gaps,
        communication_gaps = EXCLUDED.communication_gaps,
        recommendations = EXCLUDED.recommendations,
        overall_rating = EXCLUDED.overall_rating,
        given_by = EXCLUDED.given_by
      RETURNING *
    `;
    const result = await pool.query(query, [
      interviewId,
      technical_gaps ? technical_gaps.trim() : null,
      communication_gaps ? communication_gaps.trim() : null,
      recommendations ? recommendations.trim() : null,
      overall_rating !== undefined && overall_rating !== null ? overall_rating : null,
      givenByUserId,
    ]);
    return result.rows[0];
  }
}
