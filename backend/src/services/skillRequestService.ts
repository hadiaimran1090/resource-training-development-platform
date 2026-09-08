import { pool } from '../config/db.js';

export interface CreateSkillRequestDTO {
  requested_by: number;
  skill_name: string;
  category: 'technical' | 'secondary' | 'soft';
  justification?: string;
}

export class SkillRequestService {
  /**
   * Submit a new skill request (propose brand new skill)
   */
  static async createRequest(dto: CreateSkillRequestDTO) {
    const { requested_by, skill_name, category, justification } = dto;

    if (!skill_name || !skill_name.trim()) {
      throw new Error('Skill name is required.');
    }
    if (!category || !['technical', 'secondary', 'soft'].includes(category)) {
      throw new Error('Valid category (technical, secondary, soft) is required.');
    }

    const trimmedName = skill_name.trim();

    // Check if skill already exists in master skills catalog
    const existingSkill = await pool.query(
      `SELECT id FROM skills WHERE LOWER(name) = LOWER($1)`,
      [trimmedName]
    );

    if (existingSkill.rows.length > 0) {
      throw new Error(`The skill "${trimmedName}" already exists in the Skills Catalog. You can add it directly to your profile.`);
    }

    // Check if user already submitted a pending request for this skill name
    const existingReq = await pool.query(
      `SELECT id FROM skill_requests WHERE requested_by = $1 AND LOWER(skill_name) = LOWER($2) AND status = 'pending'`,
      [requested_by, trimmedName]
    );

    if (existingReq.rows.length > 0) {
      throw new Error(`You already have a pending request for "${trimmedName}".`);
    }

    const query = `
      INSERT INTO skill_requests (requested_by, skill_name, category, justification, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id, requested_by, skill_name, category, justification, status, created_at
    `;

    const result = await pool.query(query, [
      requested_by,
      trimmedName,
      category,
      justification ? justification.trim() : null,
    ]);

    return result.rows[0];
  }

  /**
   * Fetch pending skill requests for Regional Lead / Admin
   */
  static async getPendingRequests(reviewerUserId: number, isSystemAdmin: boolean = false) {
    let query = `
      SELECT sr.id, sr.requested_by, sr.skill_name, sr.category, sr.justification, sr.status, sr.created_at,
             u.name as requester_name, u.email as requester_email, u.employee_id as requester_employee_id,
             reg.name as region_name, prac.name as practice_name
      FROM skill_requests sr
      INNER JOIN users u ON sr.requested_by = u.id
      LEFT JOIN regions reg ON u.region_id = reg.id
      LEFT JOIN practices prac ON u.practice_id = prac.id
      WHERE sr.status = 'pending'
    `;

    const queryParams: any[] = [];

    if (!isSystemAdmin) {
      // Filter by Regional Lead's region
      const leadRegionRes = await pool.query(`SELECT region_id FROM users WHERE id = $1`, [reviewerUserId]);
      const leadRegionId = leadRegionRes.rows[0]?.region_id;

      if (leadRegionId) {
        queryParams.push(leadRegionId);
        query += ` AND u.region_id = $${queryParams.length}`;
      }
    }

    query += ` ORDER BY sr.created_at DESC`;

    const result = await pool.query(query, queryParams);
    return result.rows;
  }

  /**
   * Fetch user's own skill requests
   */
  static async getMyRequests(userId: number) {
    const query = `
      SELECT sr.id, sr.requested_by, sr.skill_name, sr.category, sr.justification, sr.status, sr.created_at, sr.reviewed_at,
             reviewer.name as reviewer_name
      FROM skill_requests sr
      LEFT JOIN users reviewer ON sr.reviewed_by = reviewer.id
      WHERE sr.requested_by = $1
      ORDER BY sr.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Approve skill request: Add skill to catalog and add to user's resource_skills
   */
  static async approveRequest(requestId: number, reviewerUserId: number) {
    const reqRes = await pool.query(`SELECT * FROM skill_requests WHERE id = $1`, [requestId]);
    if (reqRes.rows.length === 0) {
      throw new Error('Skill request not found.');
    }

    const req = reqRes.rows[0];
    if (req.status !== 'pending') {
      throw new Error(`Skill request is already ${req.status}.`);
    }

    // 1. Insert or find skill in master catalog
    const skillInsert = await pool.query(
      `INSERT INTO skills (name, category)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category
       RETURNING id`,
      [req.skill_name, req.category]
    );

    const skillId = skillInsert.rows[0].id;

    // 2. Ensure resource record exists for user
    let resCheck = await pool.query(`SELECT id FROM resources WHERE user_id = $1`, [req.requested_by]);
    let resourceId: number;

    if (resCheck.rows.length === 0) {
      const resIns = await pool.query(
        `INSERT INTO resources (user_id, phone_number, designation, current_status)
         VALUES ($1, '+1-555-0192', 'Engineering Resource', 'bench')
         RETURNING id`,
        [req.requested_by]
      );
      resourceId = resIns.rows[0].id;
    } else {
      resourceId = resCheck.rows[0].id;
    }

    // 3. Add skill to user's resource_skills matrix (source = 'self')
    await pool.query(
      `INSERT INTO resource_skills (resource_id, skill_id, current_level, target_level, source)
       VALUES ($1, $2, 1.0, 3.0, 'self')
       ON CONFLICT (resource_id, skill_id) DO NOTHING`,
      [resourceId, skillId]
    );

    // 4. Update request status to approved
    await pool.query(
      `UPDATE skill_requests
       SET status = 'approved', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [reviewerUserId, requestId]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'approve skill request', 'skill_requests', $2, $3)`,
      [reviewerUserId, requestId, `Approved skill "${req.skill_name}" requested by user #${req.requested_by}`]
    );

    return { message: `Skill "${req.skill_name}" approved successfully and added to catalog.`, skillId };
  }

  /**
   * Reject skill request
   */
  static async rejectRequest(requestId: number, reviewerUserId: number) {
    const reqRes = await pool.query(`SELECT * FROM skill_requests WHERE id = $1`, [requestId]);
    if (reqRes.rows.length === 0) {
      throw new Error('Skill request not found.');
    }

    const req = reqRes.rows[0];
    if (req.status !== 'pending') {
      throw new Error(`Skill request is already ${req.status}.`);
    }

    await pool.query(
      `UPDATE skill_requests
       SET status = 'rejected', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [reviewerUserId, requestId]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'reject skill request', 'skill_requests', $2, $3)`,
      [reviewerUserId, requestId, `Rejected skill request "${req.skill_name}"`]
    );

    return { message: `Skill request for "${req.skill_name}" was rejected.` };
  }
}
