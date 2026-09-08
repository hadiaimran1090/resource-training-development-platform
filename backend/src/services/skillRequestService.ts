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
      // Recover requests created before a notification failure and avoid making the
      // requester resubmit manually.
      await this.notifyRegionalLeads(existingReq.rows[0].id, trimmedName, requested_by);
      return existingReq.rows[0];
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

    const request = result.rows[0];

    await this.notifyRegionalLeads(request.id, trimmedName, requested_by);

    return request;
  }

  private static async notifyRegionalLeads(requestId: number, skillName: string, requesterUserId: number) {
    // Notify every Regional Lead assigned to the requester's region. The guard
    // makes re-submission safe and prevents duplicate notifications.
    await pool.query(
      `INSERT INTO notifications (user_id, type, message, related_entity_type, related_entity_id)
       SELECT DISTINCT lead.id, 'skill_request', $1, 'skill_request', $2::integer
       FROM users requester
       LEFT JOIN resources requester_resource ON requester_resource.user_id = requester.id
       INNER JOIN users lead ON lead.region_id = COALESCE(requester_resource.region_id, requester.region_id)
       INNER JOIN user_roles ur ON ur.user_id = lead.id
       INNER JOIN roles role ON role.id = ur.role_id AND role.name = 'Regional Lead'
       WHERE requester.id = $3
         AND NOT EXISTS (
           SELECT 1 FROM notifications existing
           WHERE existing.user_id = lead.id
             AND existing.related_entity_type = 'skill_request'
             AND existing.related_entity_id = $2::integer
         )`,
      [`New skill proposal: ${skillName}`, requestId, requesterUserId]
    );
  }

  /**
   * Fetch pending skill requests for the Regional Lead's own region.
   */
  static async getPendingRequests(reviewerUserId: number) {
    let query = `
      SELECT sr.id, sr.requested_by, sr.skill_name, sr.category, sr.justification, sr.status, sr.created_at,
             u.name as requester_name, u.email as requester_email, u.employee_id as requester_employee_id,
             reg.name as region_name, prac.name as practice_name
      FROM skill_requests sr
      INNER JOIN users u ON sr.requested_by = u.id
      LEFT JOIN resources requester_resource ON requester_resource.user_id = u.id
      LEFT JOIN regions reg ON reg.id = COALESCE(requester_resource.region_id, u.region_id)
      LEFT JOIN practices prac ON u.practice_id = prac.id
      WHERE sr.status = 'pending'
    `;

    const queryParams: any[] = [];

    // Filter by Regional Lead's region.
    const leadRegionRes = await pool.query(
      `SELECT COALESCE(r.region_id, u.region_id) AS region_id
       FROM users u LEFT JOIN resources r ON r.user_id = u.id WHERE u.id = $1`,
      [reviewerUserId]
    );
    const leadRegionId = leadRegionRes.rows[0]?.region_id;

    if (leadRegionId) {
      queryParams.push(leadRegionId);
      query += ` AND COALESCE(requester_resource.region_id, u.region_id) = $${queryParams.length}`;
    } else {
      // A lead without a region must not see every pending request.
      query += ` AND FALSE`;
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

    await this.assertReviewerSharesRequesterRegion(req.requested_by, reviewerUserId);

    await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE user_id = $1 AND related_entity_type = 'skill_request' AND related_entity_id = $2`,
      [reviewerUserId, requestId]
    );

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

    await this.assertReviewerSharesRequesterRegion(req.requested_by, reviewerUserId);

    await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE user_id = $1 AND related_entity_type = 'skill_request' AND related_entity_id = $2`,
      [reviewerUserId, requestId]
    );

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

  private static async assertReviewerSharesRequesterRegion(requesterUserId: number, reviewerUserId: number) {
    const result = await pool.query(
      `SELECT u.id, COALESCE(r.region_id, u.region_id) AS region_id
       FROM users u LEFT JOIN resources r ON r.user_id = u.id
       WHERE u.id = ANY($1::int[])`,
      [[requesterUserId, reviewerUserId]]
    );
    const usersById = new Map(result.rows.map((user) => [user.id, user]));
    const requester = usersById.get(requesterUserId);
    const reviewer = usersById.get(reviewerUserId);

    if (!requester || !reviewer || !reviewer.region_id || requester.region_id !== reviewer.region_id) {
      throw new Error('You can only review skill requests from resources in your own region.');
    }
  }
}
