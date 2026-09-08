import { pool } from '../config/db.js';
import { recalculateReadinessScore } from './readinessScoreService.js';

export interface DevelopmentPlanItemInput {
  week_number: number;
  focus_area: string;
  training_track_id?: number | null;
}

export interface CreateDevelopmentPlanInput {
  resource_id: number;
  target_role_profile_id: number;
  start_date: string;
  end_date: string;
  items?: DevelopmentPlanItemInput[];
}

export interface UpdateDevelopmentPlanInput {
  target_role_profile_id?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  items?: DevelopmentPlanItemInput[];
}

export const getDevelopmentPlans = async (reqUser: any) => {
  const userRoles = reqUser.roles || (reqUser.role ? [reqUser.role] : []);
  let query = `
    SELECT 
      dp.*,
      u_res.name AS resource_name,
      u_res.email AS resource_email,
      r.id AS resource_id,
      r.region_id,
      reg.name AS region_name,
      rp.name AS target_role_profile_name,
      u_creator.name AS created_by_name,
      u_approver.name AS approved_by_name
    FROM development_plans dp
    JOIN resources r ON dp.resource_id = r.id
    JOIN users u_res ON r.user_id = u_res.id
    LEFT JOIN regions reg ON r.region_id = reg.id
    JOIN role_profiles rp ON dp.target_role_profile_id = rp.id
    JOIN users u_creator ON dp.created_by = u_creator.id
    LEFT JOIN users u_approver ON dp.approved_by = u_approver.id
  `;
  const params: any[] = [];

  // Regional Lead scoping: view own region resources
  if (userRoles.includes('Regional Lead') && !userRoles.includes('System Administrator') && !userRoles.includes('Practice Lead') && !userRoles.includes('Training Manager')) {
    query += ` WHERE r.region_id = $1`;
    params.push(reqUser.regionId);
  }

  query += ` ORDER BY dp.created_at DESC`;
  const result = await pool.query(query, params);
  
  // Fetch items for each plan
  const plans = result.rows;
  for (const plan of plans) {
    const itemsRes = await pool.query(
      `SELECT dpi.*, tt.name AS training_track_name
       FROM development_plan_items dpi
       LEFT JOIN training_tracks tt ON dpi.training_track_id = tt.id
       WHERE dpi.plan_id = $1
       ORDER BY dpi.week_number ASC`,
      [plan.id]
    );
    plan.items = itemsRes.rows;
  }

  return plans;
};

export const getResourceDevelopmentPlan = async (resourceId: number) => {
  const planRes = await pool.query(
    `SELECT 
      dp.*,
      u_res.name AS resource_name,
      u_res.email AS resource_email,
      r.user_id AS resource_user_id,
      rp.name AS target_role_profile_name,
      rp.description AS target_role_profile_description,
      u_creator.name AS created_by_name,
      u_approver.name AS approved_by_name
    FROM development_plans dp
    JOIN resources r ON dp.resource_id = r.id
    JOIN users u_res ON r.user_id = u_res.id
    JOIN role_profiles rp ON dp.target_role_profile_id = rp.id
    JOIN users u_creator ON dp.created_by = u_creator.id
    LEFT JOIN users u_approver ON dp.approved_by = u_approver.id
    WHERE dp.resource_id = $1
    ORDER BY dp.created_at DESC
    LIMIT 1`,
    [resourceId]
  );

  if (planRes.rows.length === 0) {
    return null;
  }

  const plan = planRes.rows[0];
  const itemsRes = await pool.query(
    `SELECT dpi.*, tt.name AS training_track_name
     FROM development_plan_items dpi
     LEFT JOIN training_tracks tt ON dpi.training_track_id = tt.id
     WHERE dpi.plan_id = $1
     ORDER BY dpi.week_number ASC`,
    [plan.id]
  );
  plan.items = itemsRes.rows;
  return plan;
};

export const createDevelopmentPlan = async (input: CreateDevelopmentPlanInput, creatorUserId: number) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const planRes = await client.query(
      `INSERT INTO development_plans 
        (resource_id, target_role_profile_id, start_date, end_date, status, created_by, approval_status)
       VALUES ($1, $2, $3, $4, 'draft', $5, 'pending')
       RETURNING *`,
      [input.resource_id, input.target_role_profile_id, input.start_date, input.end_date, creatorUserId]
    );
    const plan = planRes.rows[0];

    if (input.items && input.items.length > 0) {
      for (const item of input.items) {
        await client.query(
          `INSERT INTO development_plan_items (plan_id, week_number, focus_area, training_track_id)
           VALUES ($1, $2, $3, $4)`,
          [plan.id, item.week_number, item.focus_area, item.training_track_id || null]
        );
      }
    }

    // Dispatch pending approval notifications to Regional Leads & System Administrators
    const recRes = await client.query(
      `SELECT r.region_id, u.name AS resource_name FROM resources r JOIN users u ON r.user_id = u.id WHERE r.id = $1`,
      [input.resource_id]
    );
    if (recRes.rows.length > 0) {
      const { region_id, resource_name } = recRes.rows[0];
      const notifyUsers = await client.query(
        `SELECT DISTINCT u.id FROM users u
         JOIN user_roles ur ON u.id = ur.user_id
         JOIN roles r ON ur.role_id = r.id
         WHERE (r.name = 'System Administrator') OR (r.name = 'Regional Lead' AND u.region_id = $1)`,
        [region_id]
      );
      for (const targetUser of notifyUsers.rows) {
        if (targetUser.id !== creatorUserId) {
          await client.query(
            `INSERT INTO notifications (user_id, type, message, related_entity_type, related_entity_id)
             VALUES ($1, 'development_plan_approval', $2, 'development_plans', $3)`,
            [targetUser.id, `New Development Plan created for ${resource_name} requires review and approval.`, plan.id]
          );
        }
      }
    }

    await client.query('COMMIT');
    return await getResourceDevelopmentPlan(input.resource_id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const addPlanItems = async (planId: number, items: DevelopmentPlanItemInput[]) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      await client.query(
        `INSERT INTO development_plan_items (plan_id, week_number, focus_area, training_track_id)
         VALUES ($1, $2, $3, $4)`,
        [planId, item.week_number, item.focus_area, item.training_track_id || null]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateDevelopmentPlan = async (planId: number, input: UpdateDevelopmentPlanInput) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateFields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (input.target_role_profile_id !== undefined) {
      updateFields.push(`target_role_profile_id = $${idx++}`);
      values.push(input.target_role_profile_id);
    }
    if (input.start_date !== undefined) {
      updateFields.push(`start_date = $${idx++}`);
      values.push(input.start_date);
    }
    if (input.end_date !== undefined) {
      updateFields.push(`end_date = $${idx++}`);
      values.push(input.end_date);
    }
    if (input.status !== undefined) {
      updateFields.push(`status = $${idx++}`);
      values.push(input.status);
    }

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(planId);
      await client.query(
        `UPDATE development_plans SET ${updateFields.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    if (input.items !== undefined) {
      // Replace items
      await client.query(`DELETE FROM development_plan_items WHERE plan_id = $1`, [planId]);
      for (const item of input.items) {
        await client.query(
          `INSERT INTO development_plan_items (plan_id, week_number, focus_area, training_track_id)
           VALUES ($1, $2, $3, $4)`,
          [planId, item.week_number, item.focus_area, item.training_track_id || null]
        );
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const approveDevelopmentPlan = async (planId: number, approverUser: any) => {
  const planCheck = await pool.query(
    `SELECT dp.*, r.user_id AS resource_user_id,
            COALESCE(ARRAY_AGG(role_tab.name) FILTER (WHERE role_tab.name IS NOT NULL), '{}') AS creator_roles
     FROM development_plans dp 
     JOIN resources r ON dp.resource_id = r.id 
     LEFT JOIN user_roles ur ON dp.created_by = ur.user_id
     LEFT JOIN roles role_tab ON ur.role_id = role_tab.id
     WHERE dp.id = $1
     GROUP BY dp.id, r.user_id`,
    [planId]
  );
  if (planCheck.rows.length === 0) {
    throw new Error('Development plan not found.');
  }

  const plan = planCheck.rows[0];
  const approverId = approverUser?.userId || approverUser?.id;
  const approverRoles = approverUser?.roles || (approverUser?.role ? [approverUser.role] : []);

  // Self-approval block check (cannot approve if you are the resource or creator):
  if (plan.resource_user_id === approverId || plan.created_by === approverId) {
    const error: any = new Error('Self-approval block: You cannot approve your own development plan.');
    error.statusCode = 403;
    throw error;
  }

  // Hierarchy Rule: Regional Lead created plans must be approved by System Administrator (Admin)
  const isCreatedByRegionalLead = Array.isArray(plan.creator_roles) && plan.creator_roles.includes('Regional Lead');
  const isApproverAdmin = approverRoles.includes('System Administrator');

  if (isCreatedByRegionalLead && !isApproverAdmin) {
    const error: any = new Error('Hierarchy Rule: Development plans created by Regional Leads require System Administrator approval.');
    error.statusCode = 403;
    throw error;
  }

  await pool.query(
    `UPDATE development_plans
     SET approval_status = 'approved',
         status = 'active',
         approved_by = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [approverId, planId]
  );

  // Auto-trigger readiness score recalculation for the resource
  try {
    await recalculateReadinessScore(plan.resource_id);
  } catch (e) {
    console.error('Score recalculation on approval failed:', e);
  }

  // Send notification to the resource
  await pool.query(
    `INSERT INTO notifications (user_id, type, message, related_entity_type, related_entity_id)
     VALUES ($1, 'development_plan_approved', 'Your development plan has been approved and activated!', 'development_plans', $2)`,
    [plan.resource_user_id, planId]
  );

  return { success: true, message: 'Development plan approved and activated successfully.' };
};

export const completeDevelopmentPlan = async (planId: number) => {
  const planCheck = await pool.query(
    `SELECT dp.*, r.user_id AS resource_user_id 
     FROM development_plans dp 
     JOIN resources r ON dp.resource_id = r.id 
     WHERE dp.id = $1`,
    [planId]
  );
  if (planCheck.rows.length === 0) {
    throw new Error('Development plan not found.');
  }

  const plan = planCheck.rows[0];

  await pool.query(
    `UPDATE development_plans
     SET status = 'completed',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [planId]
  );

  // Auto-trigger readiness score recalculation
  try {
    await recalculateReadinessScore(plan.resource_id);
  } catch (e) {
    console.error('Score recalculation on completion failed:', e);
  }

  // Send notification to the resource
  await pool.query(
    `INSERT INTO notifications (user_id, type, message, related_entity_type, related_entity_id)
     VALUES ($1, 'development_plan_completed', 'Congratulations! Your target role development plan has been marked completed.', 'development_plans', $2)`,
    [plan.resource_user_id, planId]
  );

  return { success: true, message: 'Development plan marked as completed.' };
};

export const rejectDevelopmentPlan = async (planId: number, rejecterUser: any) => {
  const planCheck = await pool.query(
    `SELECT dp.*, r.user_id AS resource_user_id 
     FROM development_plans dp 
     JOIN resources r ON dp.resource_id = r.id 
     WHERE dp.id = $1`,
    [planId]
  );
  if (planCheck.rows.length === 0) {
    throw new Error('Development plan not found.');
  }

  const plan = planCheck.rows[0];
  const rejecterId = rejecterUser?.userId || rejecterUser?.id;

  // Self-approval block check:
  if (plan.resource_user_id === rejecterId) {
    const error: any = new Error('Self-approval block: You cannot reject your own development plan.');
    error.statusCode = 403;
    throw error;
  }

  await pool.query(
    `UPDATE development_plans
     SET approval_status = 'rejected',
         status = 'draft',
         approved_by = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [rejecterId, planId]
  );

  // Send notification to the resource
  await pool.query(
    `INSERT INTO notifications (user_id, type, message, related_entity_type, related_entity_id)
     VALUES ($1, 'development_plan_rejected', 'Your development plan has been reviewed and rejected.', 'development_plans', $2)`,
    [plan.resource_user_id, planId]
  );

  return { success: true, message: 'Development plan rejected.' };
};

export const deleteDevelopmentPlan = async (planId: number) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM development_plan_items WHERE plan_id = $1`, [planId]);
    const res = await client.query(`DELETE FROM development_plans WHERE id = $1 RETURNING id`, [planId]);
    if (res.rows.length === 0) {
      throw new Error('Development plan not found.');
    }
    await client.query('COMMIT');
    return { success: true, message: 'Development plan deleted successfully.' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
