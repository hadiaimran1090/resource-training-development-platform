import { Response } from 'express';
import { pool } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

/**
 * GET /api/coding-challenges
 * List all coding challenges with optional filters: language, difficulty_level, target_role_profile_id
 */
export const getCodingChallenges = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { language, difficulty_level, target_role_profile_id } = req.query;

    let query = `
      SELECT 
        cc.id,
        cc.title,
        cc.language,
        cc.difficulty_level,
        cc.target_role_profile_id,
        rp.name as target_role_profile_name,
        cc.description,
        cc.test_cases,
        cc.created_by,
        u.name as creator_name,
        cc.created_at,
        cc.updated_at,
        (SELECT COUNT(*) FROM coding_submissions cs WHERE cs.challenge_id = cc.id)::int as submission_count
      FROM coding_challenges cc
      LEFT JOIN role_profiles rp ON cc.target_role_profile_id = rp.id
      LEFT JOIN users u ON cc.created_by = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (language) {
      params.push(language);
      query += ` AND LOWER(cc.language) = LOWER($${params.length})`;
    }

    if (difficulty_level) {
      params.push(parseInt(difficulty_level as string, 10));
      query += ` AND cc.difficulty_level = $${params.length}`;
    }

    if (target_role_profile_id) {
      params.push(parseInt(target_role_profile_id as string, 10));
      query += ` AND cc.target_role_profile_id = $${params.length}`;
    }

    query += ` ORDER BY cc.created_at DESC`;

    const result = await pool.query(query, params);

    const isChallengeManager = (req.user?.roles || []).some((role) =>
      ['Regional Lead', 'Training Manager'].includes(role)
    );
    const challenges = isChallengeManager
      ? result.rows
      : result.rows.map(({ test_cases, ...challenge }) => challenge);

    res.status(200).json({
      success: true,
      data: challenges,
    });
  } catch (error: any) {
    console.error('Error fetching coding challenges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coding challenges.',
      error: error.message,
    });
  }
};

/**
 * GET /api/coding-challenges/:id
 * Full detail including test cases (For Regional Lead, Training Manager, Admin)
 */
export const getCodingChallengeById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        cc.*,
        rp.name as target_role_profile_name,
        u.name as creator_name
      FROM coding_challenges cc
      LEFT JOIN role_profiles rp ON cc.target_role_profile_id = rp.id
      LEFT JOIN users u ON cc.created_by = u.id
      WHERE cc.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Coding challenge not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching coding challenge by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coding challenge.',
      error: error.message,
    });
  }
};

/**
 * POST /api/coding-challenges
 * Create challenge (Regional Lead + Training Manager only)
 */
export const createCodingChallenge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, language, difficulty_level, target_role_profile_id, description, test_cases } = req.body;

    if (!title || !language || !difficulty_level || !description || !test_cases) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: title, language, difficulty_level, description, and test_cases are required.',
      });
      return;
    }

    const diffInt = parseInt(difficulty_level, 10);
    if (isNaN(diffInt) || diffInt < 1 || diffInt > 5) {
      res.status(400).json({
        success: false,
        message: 'difficulty_level must be an integer between 1 and 5.',
      });
      return;
    }

    const createdBy = req.user?.userId;
    const testCasesJson = typeof test_cases === 'string' ? test_cases : JSON.stringify(test_cases);

    const query = `
      INSERT INTO coding_challenges (title, language, difficulty_level, target_role_profile_id, description, test_cases, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      title,
      language,
      diffInt,
      target_role_profile_id || null,
      description,
      testCasesJson,
      createdBy,
    ]);

    res.status(201).json({
      success: true,
      message: 'Coding challenge created successfully.',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating coding challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create coding challenge.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/coding-challenges/:id
 * Update challenge (Regional Lead + Training Manager only)
 */
export const updateCodingChallenge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, language, difficulty_level, target_role_profile_id, description, test_cases } = req.body;

    const existing = await pool.query(`SELECT id FROM coding_challenges WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Coding challenge not found.',
      });
      return;
    }

    const testCasesJson = test_cases
      ? typeof test_cases === 'string'
        ? test_cases
        : JSON.stringify(test_cases)
      : null;

    const query = `
      UPDATE coding_challenges
      SET 
        title = COALESCE($1, title),
        language = COALESCE($2, language),
        difficulty_level = COALESCE($3, difficulty_level),
        target_role_profile_id = $4,
        description = COALESCE($5, description),
        test_cases = COALESCE($6, test_cases),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;

    const result = await pool.query(query, [
      title || null,
      language || null,
      difficulty_level ? parseInt(difficulty_level, 10) : null,
      target_role_profile_id !== undefined ? (target_role_profile_id ? parseInt(target_role_profile_id, 10) : null) : null,
      description || null,
      testCasesJson,
      id,
    ]);

    res.status(200).json({
      success: true,
      message: 'Coding challenge updated successfully.',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating coding challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update coding challenge.',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/coding-challenges/:id
 * Delete a challenge and all submissions made against it (Regional Lead + Training Manager only).
 */
export const deleteCodingChallenge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Lock the challenge so a new submission cannot be added while its
    // existing submissions and the challenge itself are being deleted.
    const challenge = await client.query(
      `SELECT id FROM coding_challenges WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (challenge.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({
        success: false,
        message: 'Coding challenge not found.',
      });
      return;
    }

    const deletedSubmissions = await client.query(
      `DELETE FROM coding_submissions WHERE challenge_id = $1 RETURNING id`,
      [id]
    );
    await client.query(`DELETE FROM coding_challenges WHERE id = $1`, [id]);
    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Coding challenge and its submissions deleted successfully.',
      deletedSubmissionCount: deletedSubmissions.rows.length,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error deleting coding challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete coding challenge.',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * GET /api/coding-challenges/:id/attempt
 * Resource-facing view: strips expected_output from test_cases
 */
export const getChallengeForAttempt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        cc.id,
        cc.title,
        cc.language,
        cc.difficulty_level,
        cc.target_role_profile_id,
        rp.role_title as target_role_profile_name,
        cc.description,
        cc.test_cases
      FROM coding_challenges cc
      LEFT JOIN role_profiles rp ON cc.target_role_profile_id = rp.id
      WHERE cc.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Coding challenge not found.',
      });
      return;
    }

    const challenge = result.rows[0];
    let parsedTestCases: any[] = [];
    if (Array.isArray(challenge.test_cases)) {
      parsedTestCases = challenge.test_cases;
    } else if (typeof challenge.test_cases === 'string') {
      try {
        parsedTestCases = JSON.parse(challenge.test_cases);
      } catch {
        parsedTestCases = [];
      }
    }

    // Strip expected_output so it's NEVER exposed to the resource
    const sanitizedTestCases = parsedTestCases.map((tc: any) => ({
      input: tc.input || '',
    }));

    res.status(200).json({
      success: true,
      data: {
        ...challenge,
        test_cases: sanitizedTestCases,
      },
    });
  } catch (error: any) {
    console.error('Error fetching challenge attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch challenge details.',
      error: error.message,
    });
  }
};

/**
 * POST /api/coding-challenges/:id/submissions
 * Resource submits code
 */
export const submitCodingChallenge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { submitted_code } = req.body;
    const userId = req.user?.userId;

    if (!submitted_code || !submitted_code.trim()) {
      res.status(400).json({
        success: false,
        message: 'submitted_code is required.',
      });
      return;
    }

    // Lookup resource_id for current user
    const resResult = await pool.query(`SELECT id FROM resources WHERE user_id = $1`, [userId]);
    if (resResult.rows.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Only registered resources can submit coding challenge solutions.',
      });
      return;
    }

    const resourceId = resResult.rows[0].id;

    // Verify challenge exists and fetch total_tests count
    const challengeRes = await pool.query(`SELECT id, title, test_cases FROM coding_challenges WHERE id = $1`, [id]);
    if (challengeRes.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Coding challenge not found.',
      });
      return;
    }

    const challenge = challengeRes.rows[0];
    let testCases: any[] = [];
    if (Array.isArray(challenge.test_cases)) {
      testCases = challenge.test_cases;
    } else if (typeof challenge.test_cases === 'string') {
      try {
        testCases = JSON.parse(challenge.test_cases);
      } catch {
        testCases = [];
      }
    }

    const totalTests = testCases.length;

    // Create submission with status = 'pending_review'
    const query = `
      INSERT INTO coding_submissions 
        (challenge_id, resource_id, submitted_code, test_pass_count, total_tests, score, status)
      VALUES 
        ($1, $2, $3, 0, $4, 0.00, 'pending_review')
      RETURNING *
    `;

    const result = await pool.query(query, [id, resourceId, submitted_code, totalTests]);

    // Create notification for mentors/admins if applicable
    await pool.query(
      `INSERT INTO notifications (user_id, type, message, related_entity_type, related_entity_id)
       SELECT u.id, 'coding_submission', $1, 'coding_submission', $2
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       WHERE r.name IN ('Mentor', 'Training Manager', 'Regional Lead')`,
      [`New coding submission for "${challenge.title}" pending review.`, result.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: 'Your code submission has been sent for review.',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error submitting coding challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit coding challenge.',
      error: error.message,
    });
  }
};

/**
 * GET /api/resources/:resourceId/coding-submissions
 * GET /api/coding-submissions/my-submissions
 * Get submission history for a resource
 */
export const getResourceSubmissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let resourceId = req.params.resourceId;

    // If endpoint accessed as /my-submissions or without resourceId param
    if (!resourceId || resourceId === 'my-submissions') {
      const resResult = await pool.query(`SELECT id FROM resources WHERE user_id = $1`, [req.user?.userId]);
      if (resResult.rows.length === 0) {
        res.status(200).json({ success: true, data: [] });
        return;
      }
      resourceId = resResult.rows[0].id;
    } else {
      const ownResource = await pool.query(`SELECT id FROM resources WHERE id = $1 AND user_id = $2`, [
        resourceId,
        req.user?.userId,
      ]);
      if (ownResource.rows.length === 0) {
        res.status(403).json({ success: false, message: 'You can only view your own submission history.' });
        return;
      }
    }

    const query = `
      SELECT 
        cs.*,
        cc.title as challenge_title,
        cc.language,
        cc.difficulty_level,
        cc.description as challenge_description,
        reviewer.name as reviewer_name
      FROM coding_submissions cs
      JOIN coding_challenges cc ON cs.challenge_id = cc.id
      LEFT JOIN users reviewer ON cs.reviewed_by = reviewer.id
      WHERE cs.resource_id = $1
      ORDER BY cs.submission_date DESC
    `;

    const result = await pool.query(query, [resourceId]);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching resource coding submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submission history.',
      error: error.message,
    });
  }
};

/**
 * GET /api/coding-submissions/review-queue
 * Mentor/Admin view: list all submissions pending review
 */
export const getPendingReviewSubmissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        cs.*,
        cc.title as challenge_title,
        cc.language,
        cc.difficulty_level,
        cc.description as challenge_description,
        cc.test_cases,
        u.name as resource_name,
        u.email as resource_email,
        r.id as resource_id
      FROM coding_submissions cs
      JOIN coding_challenges cc ON cs.challenge_id = cc.id
      JOIN resources r ON cs.resource_id = r.id
      JOIN users u ON r.user_id = u.id
      WHERE cs.status = 'pending_review'
      ORDER BY cs.submission_date ASC
    `;

    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching review queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review queue.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/coding-submissions/:id/review
 * Mentor (or Regional Lead / Admin) reviews submission and sets test_pass_count & total_tests.
 * System auto-calculates score and status (passed if test_pass_count == total_tests, else failed).
 */
export const reviewSubmission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { test_pass_count, total_tests } = req.body;

    if (test_pass_count === undefined || total_tests === undefined) {
      res.status(400).json({
        success: false,
        message: 'test_pass_count and total_tests are required for review.',
      });
      return;
    }

    const passCount = parseInt(test_pass_count, 10);
    const totalCount = parseInt(total_tests, 10);

    if (isNaN(passCount) || isNaN(totalCount) || totalCount < 0 || passCount < 0) {
      res.status(400).json({
        success: false,
        message: 'test_pass_count and total_tests must be non-negative integers.',
      });
      return;
    }

    const existingSub = await pool.query(
      `SELECT cs.*, r.user_id as resource_user_id, cc.title as challenge_title 
       FROM coding_submissions cs 
       JOIN resources r ON cs.resource_id = r.id 
       JOIN coding_challenges cc ON cs.challenge_id = cc.id
       WHERE cs.id = $1`,
      [id]
    );

    if (existingSub.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Coding submission not found.',
      });
      return;
    }

    const subRow = existingSub.rows[0];

    // Score calculation: (test_pass_count / total_tests) * 100
    const calculatedScore = totalCount > 0 ? Number(((passCount / totalCount) * 100).toFixed(2)) : 0.00;

    // Status auto-calculation: passed if test_pass_count == total_tests, else failed
    const calculatedStatus = passCount === totalCount && totalCount > 0 ? 'passed' : 'failed';
    const reviewerId = req.user?.userId;

    const updateQuery = `
      UPDATE coding_submissions
      SET 
        test_pass_count = $1,
        total_tests = $2,
        score = $3,
        status = $4,
        reviewed_by = $5
      WHERE id = $6
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      passCount,
      totalCount,
      calculatedScore,
      calculatedStatus,
      reviewerId,
      id,
    ]);

    // Send notification to the resource
    await pool.query(
      `INSERT INTO notifications (user_id, type, message, related_entity_type, related_entity_id)
       VALUES ($1, 'coding_review_result', $2, 'coding_submission', $3)`,
      [
        subRow.resource_user_id,
        `Your submission for "${subRow.challenge_title}" was reviewed: ${calculatedStatus.toUpperCase()} (${calculatedScore}% score).`,
        id,
      ]
    );

    res.status(200).json({
      success: true,
      message: `Submission review saved successfully. Result: ${calculatedStatus} (${calculatedScore}%).`,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error reviewing coding submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review coding submission.',
      error: error.message,
    });
  }
};
