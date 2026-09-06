import { pool } from '../config/db.js';
import {
  CreateAssignmentDTO,
  TrainingAssignment,
  DailyActivity,
  ActivityType,
} from '../types/trainingAssignment.js';

export class TrainingAssignmentService {
  /**
   * Helper: Map module properties to Daily Activity type
   */
  private static determineActivityType(moduleName: string, contentType: string): ActivityType {
    const lowerName = moduleName.toLowerCase();
    if (lowerName.includes('assessment') || lowerName.includes('exam') || lowerName.includes('quiz')) {
      return 'assessment';
    }
    if (lowerName.includes('interview')) {
      return 'mock_interview';
    }
    if (lowerName.includes('mentor')) {
      return 'mentor_session';
    }
    if (lowerName.includes('poc') || lowerName.includes('proof of concept')) {
      return 'poc';
    }
    if (contentType === 'lab' || lowerName.includes('coding') || lowerName.includes('lab')) {
      return 'coding';
    }
    if (contentType === 'document' && lowerName.includes('reading')) {
      return 'reading';
    }
    return 'training';
  }

  /**
   * Create a training assignment & auto-generate daily activities
   */
  static async createAssignment(
    dto: CreateAssignmentDTO,
    assignedByUserId: number,
    userRoles: string[],
    userRegionId?: number | null
  ): Promise<TrainingAssignment> {
    const { resource_id, track_id, start_date } = dto;

    // 1. Fetch resource and verify region permissions
    const resResult = await pool.query(
      `SELECT r.id, r.user_id, r.region_id, r.current_status
       FROM resources r WHERE r.id = $1`,
      [resource_id]
    );

    if (resResult.rows.length === 0) {
      throw { status: 404, message: 'Resource not found.' };
    }

    const resource = resResult.rows[0];

    // Block self-assignment regardless of user roles (including System Administrator)
    if (resource.user_id === assignedByUserId) {
      throw {
        status: 403,
        message:
          'You cannot assign, approve, or reject training for your own profile. This must be handled by another authorized Regional Lead, Practice Lead, or Admin.',
      };
    }

    const isSystemAdmin = userRoles.includes('System Administrator');

    if (!isSystemAdmin) {
      if (userRegionId && resource.region_id && userRegionId !== resource.region_id) {
        throw {
          status: 403,
          message: 'Forbidden: Regional Leads can only assign training to resources in their own region.',
        };
      }
    }

    // 2. Fetch track details
    const trackRes = await pool.query(`SELECT id, name FROM training_tracks WHERE id = $1`, [track_id]);
    if (trackRes.rows.length === 0) {
      throw { status: 404, message: 'Training track not found.' };
    }

    // 3. Insert training_assignment
    const insertAssignmentQuery = `
      INSERT INTO training_assignments (resource_id, track_id, assigned_by, start_date, status, approval_status)
      VALUES ($1, $2, $3, $4, 'assigned', 'pending')
      RETURNING id, resource_id, track_id, assigned_by, start_date, status, approval_status, created_at, updated_at
    `;
    const assignmentResult = await pool.query(insertAssignmentQuery, [
      resource_id,
      track_id,
      assignedByUserId,
      start_date,
    ]);
    const assignment: TrainingAssignment = assignmentResult.rows[0];

    // 4. Auto-generate daily_activities from track modules
    const modulesRes = await pool.query(
      `SELECT tm.id, tm.name, tm.sequence_order, tm.day_number, tm.content_type
       FROM training_modules tm
       INNER JOIN training_programs tp ON tm.program_id = tp.id
       WHERE tp.track_id = $1
       ORDER BY tm.day_number ASC, tm.sequence_order ASC`,
      [track_id]
    );

    const createdActivities: DailyActivity[] = [];

    for (const mod of modulesRes.rows) {
      const activityType = this.determineActivityType(mod.name, mod.content_type);
      const description = `Complete module: ${mod.name}`;

      const insertActivityQuery = `
        INSERT INTO daily_activities (training_assignment_id, day_number, activity_type, description, status)
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING id, training_assignment_id, day_number, activity_type, description, status, created_at, updated_at
      `;
      const actResult = await pool.query(insertActivityQuery, [
        assignment.id,
        mod.day_number,
        activityType,
        description,
      ]);
      createdActivities.push(actResult.rows[0]);
    }

    assignment.daily_activities = createdActivities;
    assignment.total_activities = createdActivities.length;
    assignment.completed_activities = 0;

    return assignment;
  }

  /**
   * Approve assignment
   */
  static async approveAssignment(
    assignmentId: number,
    approverUserId: number,
    userRoles: string[],
    userRegionId?: number | null
  ): Promise<TrainingAssignment> {
    const isSystemAdmin = userRoles.includes('System Administrator');

    const asgRes = await pool.query(
      `SELECT ta.*, r.region_id, r.user_id as resource_user_id
       FROM training_assignments ta
       INNER JOIN resources r ON ta.resource_id = r.id
       WHERE ta.id = $1`,
      [assignmentId]
    );

    if (asgRes.rows.length === 0) {
      throw { status: 404, message: 'Training assignment not found.' };
    }

    const assignment = asgRes.rows[0];

    // Block self-approval regardless of user roles (including System Administrator)
    if (assignment.resource_user_id === approverUserId) {
      throw {
        status: 403,
        message:
          'You cannot assign, approve, or reject training for your own profile. This must be handled by another authorized Regional Lead, Practice Lead, or Admin.',
      };
    }

    if (!isSystemAdmin) {
      if (userRegionId && assignment.region_id && userRegionId !== assignment.region_id) {
        throw {
          status: 403,
          message: 'Forbidden: Regional Leads can only approve assignments in their own region.',
        };
      }
    }

    // Determine status: if start_date <= current_date, move to 'in_progress', else keep 'assigned'
    const todayStr = new Date().toISOString().split('T')[0];
    const startDateStr = new Date(assignment.start_date).toISOString().split('T')[0];
    const newStatus = startDateStr <= todayStr ? 'in_progress' : 'assigned';

    const updateQuery = `
      UPDATE training_assignments
      SET approval_status = 'approved',
          approved_by = $1,
          status = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const updatedRes = await pool.query(updateQuery, [approverUserId, newStatus, assignmentId]);
    const updatedAssignment = updatedRes.rows[0];

    // If assignment becomes in_progress, update resource's current_status to 'training'
    if (newStatus === 'in_progress') {
      await pool.query(
        `UPDATE resources SET current_status = 'training', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [assignment.resource_id]
      );
    }

    return this.getAssignmentById(assignmentId, {
      userId: approverUserId,
      userRoles,
      userRegionId,
    });
  }

  /**
   * Reject assignment
   */
  static async rejectAssignment(
    assignmentId: number,
    rejecterUserId: number,
    userRoles: string[],
    userRegionId?: number | null
  ): Promise<TrainingAssignment> {
    const isSystemAdmin = userRoles.includes('System Administrator');

    const asgRes = await pool.query(
      `SELECT ta.*, r.region_id, r.user_id as resource_user_id
       FROM training_assignments ta
       INNER JOIN resources r ON ta.resource_id = r.id
       WHERE ta.id = $1`,
      [assignmentId]
    );

    if (asgRes.rows.length === 0) {
      throw { status: 404, message: 'Training assignment not found.' };
    }

    const assignment = asgRes.rows[0];

    // Block self-rejection regardless of user roles (including System Administrator)
    if (assignment.resource_user_id === rejecterUserId) {
      throw {
        status: 403,
        message:
          'You cannot assign, approve, or reject training for your own profile. This must be handled by another authorized Regional Lead, Practice Lead, or Admin.',
      };
    }

    if (!isSystemAdmin) {
      if (userRegionId && assignment.region_id && userRegionId !== assignment.region_id) {
        throw {
          status: 403,
          message: 'Forbidden: Regional Leads can only reject assignments in their own region.',
        };
      }
    }

    const updateQuery = `
      UPDATE training_assignments
      SET approval_status = 'rejected',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    await pool.query(updateQuery, [assignmentId]);

    return this.getAssignmentById(assignmentId, {
      userId: rejecterUserId,
      userRoles,
      userRegionId,
    });
  }

  /**
   * Get all assignments scoped by user role
   */
  static async getAssignments(userFilter: {
    userId: number;
    userRoles: string[];
    userRegionId?: number | null;
  }): Promise<TrainingAssignment[]> {
    const { userId, userRoles, userRegionId } = userFilter;

    const isSystemAdmin = userRoles.includes('System Administrator');
    const isPracticeLead = userRoles.includes('Practice Lead');
    const isTrainingManager = userRoles.includes('Training Manager');
    const isRegionalLead = userRoles.includes('Regional Lead');
    const isResource = userRoles.includes('Resource');

    let whereClause = '';
    const params: any[] = [];

    if (isSystemAdmin || isPracticeLead || isTrainingManager) {
      // Unrestricted read access
      whereClause = '';
    } else if (isRegionalLead) {
      params.push(userRegionId || 0);
      whereClause = `WHERE r.region_id = $${params.length}`;
    } else if (isResource) {
      params.push(userId);
      whereClause = `WHERE r.user_id = $${params.length}`;
    }

    const query = `
      SELECT ta.id, ta.resource_id, ta.track_id, ta.assigned_by, ta.start_date, ta.status, ta.approval_status, ta.approved_by, ta.created_at, ta.updated_at,
             u.name as resource_name, u.email as resource_email, u.employee_id as resource_employee_id, r.user_id as resource_user_id,
             reg.id as region_id, reg.name as region_name,
             tt.name as track_name, tt.duration_days as track_duration_days,
             u_assigner.name as assigned_by_name,
             u_approver.name as approved_by_name,
             (SELECT COUNT(*) FROM daily_activities da WHERE da.training_assignment_id = ta.id) as total_activities,
             (SELECT COUNT(*) FROM daily_activities da WHERE da.training_assignment_id = ta.id AND da.status = 'completed') as completed_activities
      FROM training_assignments ta
      INNER JOIN resources r ON ta.resource_id = r.id
      INNER JOIN users u ON r.user_id = u.id
      LEFT JOIN regions reg ON r.region_id = reg.id
      INNER JOIN training_tracks tt ON ta.track_id = tt.id
      INNER JOIN users u_assigner ON ta.assigned_by = u_assigner.id
      LEFT JOIN users u_approver ON ta.approved_by = u_approver.id
      ${whereClause}
      ORDER BY ta.created_at DESC
    `;

    const result = await pool.query(query, params);
    return result.rows.map((row) => ({
      ...row,
      total_activities: parseInt(row.total_activities || '0', 10),
      completed_activities: parseInt(row.completed_activities || '0', 10),
    }));
  }

  /**
   * Get single assignment with full details and activities list
   */
  static async getAssignmentById(
    assignmentId: number,
    userFilter: {
      userId: number;
      userRoles: string[];
      userRegionId?: number | null;
    }
  ): Promise<TrainingAssignment> {
    const { userId, userRoles, userRegionId } = userFilter;
    const isSystemAdmin = userRoles.includes('System Administrator');
    const isPracticeLead = userRoles.includes('Practice Lead');
    const isTrainingManager = userRoles.includes('Training Manager');

    const query = `
      SELECT ta.id, ta.resource_id, ta.track_id, ta.assigned_by, ta.start_date, ta.status, ta.approval_status, ta.approved_by, ta.created_at, ta.updated_at,
             u.name as resource_name, u.email as resource_email, u.employee_id as resource_employee_id, r.user_id as resource_user_id,
             reg.id as region_id, reg.name as region_name,
             tt.name as track_name, tt.duration_days as track_duration_days,
             u_assigner.name as assigned_by_name,
             u_approver.name as approved_by_name,
             (SELECT COUNT(*) FROM daily_activities da WHERE da.training_assignment_id = ta.id) as total_activities,
             (SELECT COUNT(*) FROM daily_activities da WHERE da.training_assignment_id = ta.id AND da.status = 'completed') as completed_activities
      FROM training_assignments ta
      INNER JOIN resources r ON ta.resource_id = r.id
      INNER JOIN users u ON r.user_id = u.id
      LEFT JOIN regions reg ON r.region_id = reg.id
      INNER JOIN training_tracks tt ON ta.track_id = tt.id
      INNER JOIN users u_assigner ON ta.assigned_by = u_assigner.id
      LEFT JOIN users u_approver ON ta.approved_by = u_approver.id
      WHERE ta.id = $1
    `;

    const result = await pool.query(query, [assignmentId]);
    if (result.rows.length === 0) {
      throw { status: 404, message: 'Training assignment not found.' };
    }

    const row = result.rows[0];

    // Scoping check — prioritize higher-privilege role for dual-role users
    if (!isSystemAdmin && !isPracticeLead && !isTrainingManager) {
      const isRegionalLead = userRoles.includes('Regional Lead');
      const isResource = userRoles.includes('Resource');

      if (isRegionalLead) {
        // Regional Leads can view assignments in their region
        if (userRegionId && row.region_id && row.region_id !== userRegionId) {
          throw { status: 403, message: 'Forbidden: You can only view assignments in your region.' };
        }
      } else if (isResource) {
        // Pure Resource role — can only view own assignments
        if (row.resource_user_id !== userId) {
          throw { status: 403, message: 'Forbidden: You can only view your own training assignments.' };
        }
      }
    }

    // Fetch activities
    const activitiesRes = await pool.query(
      `SELECT id, training_assignment_id, day_number, activity_type, description, status, completed_date, created_at, updated_at
       FROM daily_activities
       WHERE training_assignment_id = $1
       ORDER BY day_number ASC, id ASC`,
      [assignmentId]
    );

    return {
      ...row,
      total_activities: parseInt(row.total_activities || '0', 10),
      completed_activities: parseInt(row.completed_activities || '0', 10),
      daily_activities: activitiesRes.rows,
    };
  }

  /**
   * Update a pending training assignment (change track or start_date)
   */
  static async updateAssignment(
    assignmentId: number,
    updates: { track_id?: number; start_date?: string },
    userId: number,
    userRoles: string[],
    userRegionId?: number | null
  ): Promise<TrainingAssignment> {
    const isSystemAdmin = userRoles.includes('System Administrator');

    const asgRes = await pool.query(
      `SELECT ta.*, r.region_id, r.user_id as resource_user_id
       FROM training_assignments ta
       INNER JOIN resources r ON ta.resource_id = r.id
       WHERE ta.id = $1`,
      [assignmentId]
    );

    if (asgRes.rows.length === 0) {
      throw { status: 404, message: 'Training assignment not found.' };
    }

    const assignment = asgRes.rows[0];

    // Block self-edit
    if (assignment.resource_user_id === userId) {
      throw {
        status: 403,
        message: 'You cannot assign, approve, or reject training for your own profile. This must be handled by another authorized Regional Lead, Practice Lead, or Admin.',
      };
    }

    if (!isSystemAdmin) {
      if (userRegionId && assignment.region_id && userRegionId !== assignment.region_id) {
        throw { status: 403, message: 'Forbidden: Regional Leads can only edit assignments in their own region.' };
      }
    }

    const newTrackId = updates.track_id || assignment.track_id;
    const newStartDate = updates.start_date || assignment.start_date;
    const trackChanged = updates.track_id && updates.track_id !== assignment.track_id;

    // Update the assignment record
    await pool.query(
      `UPDATE training_assignments SET track_id = $1, start_date = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [newTrackId, newStartDate, assignmentId]
    );

    // If track changed, regenerate daily activities
    if (trackChanged) {
      await pool.query(`DELETE FROM daily_activities WHERE training_assignment_id = $1`, [assignmentId]);

      const modulesRes = await pool.query(
        `SELECT tm.id, tm.name, tm.sequence_order, tm.day_number, tm.content_type
         FROM training_modules tm
         INNER JOIN training_programs tp ON tm.program_id = tp.id
         WHERE tp.track_id = $1
         ORDER BY tm.day_number ASC, tm.sequence_order ASC`,
        [newTrackId]
      );

      for (const mod of modulesRes.rows) {
        const activityType = this.determineActivityType(mod.name, mod.content_type);
        const description = `Complete module: ${mod.name}`;
        await pool.query(
          `INSERT INTO daily_activities (training_assignment_id, day_number, activity_type, description, status)
           VALUES ($1, $2, $3, $4, 'pending')`,
          [assignmentId, mod.day_number, activityType, description]
        );
      }
    }

    return this.getAssignmentById(assignmentId, { userId, userRoles, userRegionId });
  }

  /**
   * Delete a pending training assignment and its daily activities
   */
  static async deleteAssignment(
    assignmentId: number,
    userId: number,
    userRoles: string[],
    userRegionId?: number | null
  ): Promise<void> {
    const isSystemAdmin = userRoles.includes('System Administrator');

    const asgRes = await pool.query(
      `SELECT ta.*, r.region_id, r.user_id as resource_user_id
       FROM training_assignments ta
       INNER JOIN resources r ON ta.resource_id = r.id
       WHERE ta.id = $1`,
      [assignmentId]
    );

    if (asgRes.rows.length === 0) {
      throw { status: 404, message: 'Training assignment not found.' };
    }

    const assignment = asgRes.rows[0];

    // Block self-delete
    if (assignment.resource_user_id === userId) {
      throw {
        status: 403,
        message: 'You cannot assign, approve, or reject training for your own profile. This must be handled by another authorized Regional Lead, Practice Lead, or Admin.',
      };
    }

    if (!isSystemAdmin) {
      if (userRegionId && assignment.region_id && userRegionId !== assignment.region_id) {
        throw { status: 403, message: 'Forbidden: Regional Leads can only delete assignments in their own region.' };
      }
    }

    // Delete daily activities first, then the assignment
    await pool.query(`DELETE FROM daily_activities WHERE training_assignment_id = $1`, [assignmentId]);
    await pool.query(`DELETE FROM training_assignments WHERE id = $1`, [assignmentId]);
  }

  /**
   * Get Today's activities for a specific resource — across ALL active approved assignments
   */
  static async getTodaysActivitiesForResource(
    resourceId: number,
    requestingUser: {
      userId: number;
      userRoles: string[];
      userRegionId?: number | null;
    }
  ): Promise<{ assignments: Array<{ assignment: TrainingAssignment; activities: DailyActivity[]; dayNumber: number }> }> {
    const { userId, userRoles, userRegionId } = requestingUser;
    const isSystemAdmin = userRoles.includes('System Administrator');

    // 1. Fetch resource
    const resResult = await pool.query(
      `SELECT r.id, r.user_id, r.region_id FROM resources r WHERE r.id = $1`,
      [resourceId]
    );

    if (resResult.rows.length === 0) {
      throw { status: 404, message: 'Resource not found.' };
    }

    const resource = resResult.rows[0];

    // 2. Validate authorization (Resource themselves, RL in same region, or System Admin)
    if (!isSystemAdmin) {
      const isOwner = resource.user_id === userId;
      const isRLSameRegion = userRoles.includes('Regional Lead') && userRegionId && resource.region_id === userRegionId;

      if (!isOwner && !isRLSameRegion) {
        throw {
          status: 403,
          message: 'Forbidden: You can only view today activities for yourself or resources in your region.',
        };
      }
    }

    // 3. Fetch ALL active approved assignments (no LIMIT)
    const asgRes = await pool.query(
      `SELECT ta.*, tt.name as track_name, tt.duration_days as track_duration_days
       FROM training_assignments ta
       INNER JOIN training_tracks tt ON ta.track_id = tt.id
       WHERE ta.resource_id = $1 AND ta.approval_status = 'approved' AND ta.status != 'completed'
       ORDER BY ta.start_date ASC, ta.created_at ASC`,
      [resourceId]
    );

    if (asgRes.rows.length === 0) {
      return { assignments: [] };
    }

    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const results: Array<{ assignment: TrainingAssignment; activities: DailyActivity[]; dayNumber: number }> = [];

    for (const asg of asgRes.rows) {
      let sYear: number, sMonth: number, sDate: number;
      if (asg.start_date instanceof Date) {
        sYear = asg.start_date.getFullYear();
        sMonth = asg.start_date.getMonth();
        sDate = asg.start_date.getDate();
      } else {
        const cleanStr = String(asg.start_date).split('T')[0];
        const parts = cleanStr.split('-').map(Number);
        sYear = parts[0];
        sMonth = parts[1] - 1;
        sDate = parts[2];
      }
      const startDateOnly = new Date(sYear, sMonth, sDate);

      const diffMs = todayDateOnly.getTime() - startDateOnly.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const dayNumber = diffDays + 1;

      if (dayNumber < 1) {
        // Assignment starts in the future — do not include in Today's Activities
        continue;
      }

      const actRes = await pool.query(
        `SELECT id, training_assignment_id, day_number, activity_type, description, status, completed_date, created_at, updated_at
         FROM daily_activities
         WHERE training_assignment_id = $1 AND ((day_number = $2) OR (day_number < $2 AND status != 'completed'))
         ORDER BY day_number ASC, id ASC`,
        [asg.id, dayNumber]
      );

      results.push({ assignment: asg, activities: actRes.rows, dayNumber });
    }

    return { assignments: results };
  }

  /**
   * Mark daily activity complete
   */
  static async completeDailyActivity(
    activityId: number,
    resourceUserId: number
  ): Promise<{ activity: DailyActivity; assignmentCompleted: boolean }> {
    // 1. Fetch activity & parent assignment owner
    const actRes = await pool.query(
      `SELECT da.*, ta.id as assignment_id, ta.resource_id, r.user_id as resource_user_id
       FROM daily_activities da
       INNER JOIN training_assignments ta ON da.training_assignment_id = ta.id
       INNER JOIN resources r ON ta.resource_id = r.id
       WHERE da.id = $1`,
      [activityId]
    );

    if (actRes.rows.length === 0) {
      throw { status: 404, message: 'Daily activity not found.' };
    }

    const actRow = actRes.rows[0];

    // 2. Validate Resource ownership
    if (actRow.resource_user_id !== resourceUserId) {
      throw {
        status: 403,
        message: 'Forbidden: Only the assigned resource can mark their own daily activities complete.',
      };
    }

    // 3. Mark activity complete
    const updateActQuery = `
      UPDATE daily_activities
      SET status = 'completed',
          completed_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const updatedActRes = await pool.query(updateActQuery, [activityId]);
    const updatedActivity: DailyActivity = updatedActRes.rows[0];

    // 4. Check if all activities under this assignment are completed
    const countRes = await pool.query(
      `SELECT COUNT(*) as remaining
       FROM daily_activities
       WHERE training_assignment_id = $1 AND status != 'completed'`,
      [actRow.assignment_id]
    );

    const remainingCount = parseInt(countRes.rows[0].remaining || '0', 10);
    let assignmentCompleted = false;

    if (remainingCount === 0) {
      await pool.query(
        `UPDATE training_assignments
         SET status = 'completed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [actRow.assignment_id]
      );

      // Return resource status to 'bench' or keep as is
      await pool.query(
        `UPDATE resources SET current_status = 'bench', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [actRow.resource_id]
      );

      assignmentCompleted = true;
    }

    return {
      activity: updatedActivity,
      assignmentCompleted,
    };
  }
}
