import { pool } from '../config/db.js';

export interface ReadinessWeightsInput {
  id: number;
  component_name: string;
  weight_pct: number;
  is_active: boolean;
}

export const recalculateReadinessScore = async (resourceId: number) => {
  // 1. Fetch weight configuration
  const weightsRes = await pool.query(
    `SELECT id, component_name, weight_pct, is_active FROM readiness_score_weights ORDER BY id`
  );
  const weights = weightsRes.rows;

  const activeWeights = weights.filter((w) => w.is_active);
  const activeWeightSum = activeWeights.reduce(
    (acc, w) => acc + parseFloat(w.weight_pct),
    0
  );

  const normalizedWeights: Record<string, number> = {};
  for (const w of weights) {
    if (w.is_active && activeWeightSum > 0) {
      normalizedWeights[w.component_name] = parseFloat(w.weight_pct) / activeWeightSum;
    } else {
      normalizedWeights[w.component_name] = 0;
    }
  }

  // 2. Component 1: technical_skills_pct
  // Check if resource has an active/approved development plan with target_role_profile_id
  const devPlanRes = await pool.query(
    `SELECT target_role_profile_id FROM development_plans 
     WHERE resource_id = $1 AND (status = 'active' OR approval_status = 'approved')
     ORDER BY created_at DESC LIMIT 1`,
    [resourceId]
  );
  const targetRoleProfileId = devPlanRes.rows[0]?.target_role_profile_id;

  let reqSkillMap = new Map<number, number>();
  if (targetRoleProfileId) {
    const rpsRes = await pool.query(
      `SELECT skill_id, required_level FROM role_profile_skills WHERE role_profile_id = $1`,
      [targetRoleProfileId]
    );
    reqSkillMap = new Map<number, number>(
      rpsRes.rows.map((r: any) => [r.skill_id, parseFloat(r.required_level)])
    );
  }

  const resSkillsRes = await pool.query(
    `SELECT skill_id, current_level, target_level FROM resource_skills WHERE resource_id = $1`,
    [resourceId]
  );

  let technical_skills_pct = 0.0;
  if (resSkillsRes.rows.length > 0) {
    let sumRatios = 0;
    for (const rs of resSkillsRes.rows) {
      const cur = parseFloat(rs.current_level);
      const req = reqSkillMap.get(rs.skill_id) || (rs.target_level ? parseFloat(rs.target_level) : 5.0);
      const ratio = req > 0 ? Math.min(100.0, (cur / req) * 100.0) : 100.0;
      sumRatios += ratio;
    }
    technical_skills_pct = sumRatios / resSkillsRes.rows.length;
  }

  // 3. Component 2: coding_pct
  const codingRes = await pool.query(
    `SELECT AVG(score) as avg_score FROM coding_submissions 
     WHERE resource_id = $1 AND status IN ('passed', 'failed')`,
    [resourceId]
  );
  const coding_pct = codingRes.rows[0]?.avg_score ? parseFloat(codingRes.rows[0].avg_score) : 0.0;

  // 4. Component 3: assessment_pct (Most recent attempt per distinct assessment)
  const assessmentRes = await pool.query(
    `SELECT AVG(score) as avg_score FROM (
       SELECT DISTINCT ON (assessment_id) score 
       FROM assessment_attempts 
       WHERE resource_id = $1 AND score IS NOT NULL 
       ORDER BY assessment_id, started_at DESC
     ) latest_attempts`,
    [resourceId]
  );
  const assessment_pct = assessmentRes.rows[0]?.avg_score ? parseFloat(assessmentRes.rows[0].avg_score) : 0.0;

  // 5. Component 4: interview_readiness_pct
  const interviewRes = await pool.query(
    `SELECT AVG(fb.overall_rating) as avg_rating
     FROM interview_feedback fb
     JOIN interviews i ON fb.interview_id = i.id
     WHERE i.resource_id = $1 AND fb.overall_rating IS NOT NULL`,
    [resourceId]
  );
  const avgInterviewRating = interviewRes.rows[0]?.avg_rating ? parseFloat(interviewRes.rows[0].avg_rating) : null;
  const interview_readiness_pct = avgInterviewRating !== null ? Math.min(100.0, (avgInterviewRating / 5.0) * 100.0) : 0.0;

  // 6. Component 5: project_experience_pct
  const projectRes = await pool.query(
    `SELECT 
       COUNT(*) FILTER (WHERE da.status = 'completed') as completed_count,
       COUNT(*) as total_count
     FROM daily_activities da
     JOIN training_assignments ta ON da.training_assignment_id = ta.id
     WHERE ta.resource_id = $1`,
    [resourceId]
  );
  const completedActs = parseInt(projectRes.rows[0]?.completed_count || '0', 10);
  const totalActs = parseInt(projectRes.rows[0]?.total_count || '0', 10);
  const project_experience_pct = totalActs > 0 ? (completedActs / totalActs) * 100.0 : 0.0;

  // 7. Component 6: communication_pct (Reuses interview feedback overall rating scale)
  const communication_pct = interview_readiness_pct;

  // 8. Component 7: certification_pct
  const certRes = await pool.query(
    `SELECT 
       COUNT(*) FILTER (WHERE verification_status = 'verified') as verified_count,
       COUNT(*) as total_count
     FROM certifications
     WHERE resource_id = $1`,
    [resourceId]
  );
  const verifiedCerts = parseInt(certRes.rows[0]?.verified_count || '0', 10);
  const totalCerts = parseInt(certRes.rows[0]?.total_count || '0', 10);
  const certification_pct = totalCerts > 0 ? (verifiedCerts / totalCerts) * 100.0 : 0.0;

  // 9. Overall weighted sum
  const overall_pct_raw =
    technical_skills_pct * normalizedWeights['technical_skills'] +
    coding_pct * normalizedWeights['coding'] +
    assessment_pct * normalizedWeights['assessment'] +
    interview_readiness_pct * normalizedWeights['interview_readiness'] +
    project_experience_pct * normalizedWeights['project_experience'] +
    communication_pct * normalizedWeights['communication'] +
    certification_pct * normalizedWeights['certification'];

  const overall_pct = Math.round(overall_pct_raw * 100) / 100;

  // 10. Category assignment
  let category: 'ready' | 'almost_ready' | 'needs_development' | 'high_risk';
  if (overall_pct >= 85.0) {
    category = 'ready';
  } else if (overall_pct >= 70.0) {
    category = 'almost_ready';
  } else if (overall_pct >= 50.0) {
    category = 'needs_development';
  } else {
    category = 'high_risk';
  }

  // 11. Insert new row to preserve historical trend
  const insertRes = await pool.query(
    `INSERT INTO readiness_scores 
      (resource_id, calculated_date, technical_skills_pct, coding_pct, assessment_pct, interview_readiness_pct, project_experience_pct, communication_pct, certification_pct, overall_pct, category)
     VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      resourceId,
      Math.round(technical_skills_pct * 100) / 100,
      Math.round(coding_pct * 100) / 100,
      Math.round(assessment_pct * 100) / 100,
      Math.round(interview_readiness_pct * 100) / 100,
      Math.round(project_experience_pct * 100) / 100,
      Math.round(communication_pct * 100) / 100,
      Math.round(certification_pct * 100) / 100,
      overall_pct,
      category,
    ]
  );

  return insertRes.rows[0];
};

export const getReadinessHistory = async (resourceId: number) => {
  const result = await pool.query(
    `SELECT * FROM readiness_scores WHERE resource_id = $1 ORDER BY calculated_date DESC`,
    [resourceId]
  );
  return result.rows;
};

export const getLatestReadinessScore = async (resourceId: number) => {
  const result = await pool.query(
    `SELECT * FROM readiness_scores WHERE resource_id = $1 ORDER BY calculated_date DESC LIMIT 1`,
    [resourceId]
  );
  if (result.rows.length === 0) {
    try {
      return await recalculateReadinessScore(resourceId);
    } catch (e) {
      console.error('Auto-recalculate readiness score failed:', e);
      return null;
    }
  }
  return result.rows[0];
};

export const getReadinessWeights = async () => {
  const result = await pool.query(
    `SELECT id, component_name, weight_pct, is_active, updated_at FROM readiness_score_weights ORDER BY id`
  );
  return result.rows;
};

export const updateReadinessWeights = async (weightsInput: ReadinessWeightsInput[]) => {
  const activeWeights = weightsInput.filter((w) => w.is_active);
  const activeSum = activeWeights.reduce((acc, w) => acc + Number(w.weight_pct), 0);

  // Validate active weights sum to 100% (allowing small decimal tolerance 0.01)
  if (Math.abs(activeSum - 100.0) > 0.01) {
    const error: any = new Error(
      `Active readiness score weights must sum to exactly 100%. Current sum: ${activeSum.toFixed(2)}%`
    );
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const w of weightsInput) {
      await client.query(
        `UPDATE readiness_score_weights
         SET weight_pct = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
         WHERE component_name = $3`,
        [w.weight_pct, w.is_active, w.component_name]
      );
    }
    await client.query('COMMIT');
    return await getReadinessWeights();
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
