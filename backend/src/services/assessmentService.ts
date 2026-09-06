import { pool } from '../config/db.js';
import type {
  Assessment,
  AssessmentWithQuestions,
  AssessmentQuestion,
  AssessmentAttempt,
  AttemptWithAnswers,
  CreateAssessmentDTO,
  UpdateAssessmentDTO,
  CreateQuestionDTO,
  UpdateQuestionDTO,
  SubmitAttemptDTO,
} from '../types/assessment.js';

export class AssessmentService {
  // ==========================================
  // 1. ASSESSMENT CRUD
  // ==========================================

  static async getAllAssessments(type?: string): Promise<Assessment[]> {
    let query = `
      SELECT 
        a.id,
        a.name,
        a.type,
        a.related_module_id,
        tm.name as module_name,
        a.total_questions,
        a.passing_score,
        a.created_by,
        u.name as creator_name,
        a.created_at,
        a.updated_at,
        COUNT(DISTINCT aq.id)::int as question_count,
        COUNT(DISTINCT aa.id)::int as attempt_count
      FROM assessments a
      LEFT JOIN training_modules tm ON a.related_module_id = tm.id
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN assessment_questions aq ON a.id = aq.assessment_id
      LEFT JOIN assessment_attempts aa ON a.id = aa.assessment_id
    `;

    const params: any[] = [];
    if (type) {
      query += ` WHERE a.type = $1`;
      params.push(type);
    }

    query += ` GROUP BY a.id, tm.name, u.name ORDER BY a.created_at DESC`;

    const res = await pool.query(query, params);
    return res.rows;
  }

  static async getAssessmentById(id: number): Promise<AssessmentWithQuestions | null> {
    const assessmentQuery = `
      SELECT 
        a.id,
        a.name,
        a.type,
        a.related_module_id,
        tm.name as module_name,
        a.total_questions,
        a.passing_score,
        a.created_by,
        u.name as creator_name,
        a.created_at,
        a.updated_at
      FROM assessments a
      LEFT JOIN training_modules tm ON a.related_module_id = tm.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.id = $1
    `;
    const assessmentRes = await pool.query(assessmentQuery, [id]);
    if (assessmentRes.rows.length === 0) return null;

    const assessment = assessmentRes.rows[0];

    const questionsQuery = `
      SELECT id, assessment_id, question_text, question_type, options, correct_answer, marks, sequence_order, created_at, updated_at
      FROM assessment_questions
      WHERE assessment_id = $1
      ORDER BY sequence_order ASC
    `;
    const questionsRes = await pool.query(questionsQuery, [id]);

    return {
      ...assessment,
      question_count: questionsRes.rows.length,
      questions: questionsRes.rows,
    };
  }

  static async createAssessment(dto: CreateAssessmentDTO, createdBy: number): Promise<AssessmentWithQuestions> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const questions = dto.questions || [];

      const assessmentQuery = `
        INSERT INTO assessments (name, type, related_module_id, total_questions, passing_score, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const assessmentRes = await client.query(assessmentQuery, [
        dto.name,
        dto.type,
        dto.related_module_id || null,
        questions.length,
        dto.passing_score,
        createdBy,
      ]);
      const assessment = assessmentRes.rows[0];

      const insertedQuestions: AssessmentQuestion[] = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const questionQuery = `
          INSERT INTO assessment_questions (assessment_id, question_text, question_type, options, correct_answer, marks, sequence_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        const qRes = await client.query(questionQuery, [
          assessment.id,
          q.question_text,
          q.question_type,
          q.options ? JSON.stringify(q.options) : null,
          q.correct_answer,
          q.marks || 1.0,
          q.sequence_order || i + 1,
        ]);
        insertedQuestions.push(qRes.rows[0]);
      }

      await client.query('COMMIT');

      return {
        ...assessment,
        questions: insertedQuestions,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateAssessment(id: number, dto: UpdateAssessmentDTO): Promise<Assessment | null> {
    const existing = await pool.query(`SELECT * FROM assessments WHERE id = $1`, [id]);
    if (existing.rows.length === 0) return null;

    const current = existing.rows[0];
    const name = dto.name !== undefined ? dto.name : current.name;
    const type = dto.type !== undefined ? dto.type : current.type;
    const relatedModuleId = dto.related_module_id !== undefined ? dto.related_module_id : current.related_module_id;
    const passingScore = dto.passing_score !== undefined ? dto.passing_score : current.passing_score;

    const query = `
      UPDATE assessments
      SET name = $1, type = $2, related_module_id = $3, passing_score = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    const res = await pool.query(query, [name, type, relatedModuleId, passingScore, id]);
    return res.rows[0];
  }

  static async deleteAssessment(id: number): Promise<void> {
    const checkRes = await pool.query(
      `SELECT COUNT(*)::int as count FROM assessment_attempts WHERE assessment_id = $1`,
      [id]
    );
    if (checkRes.rows[0].count > 0) {
      throw new Error(`Cannot delete assessment with existing attempts (${checkRes.rows[0].count} attempt(s) recorded).`);
    }

    await pool.query(`DELETE FROM assessments WHERE id = $1`, [id]);
  }

  // ==========================================
  // 2. QUESTION MANAGEMENT
  // ==========================================

  static async getQuestionsByAssessmentId(assessmentId: number): Promise<AssessmentQuestion[]> {
    const res = await pool.query(
      `SELECT * FROM assessment_questions WHERE assessment_id = $1 ORDER BY sequence_order ASC`,
      [assessmentId]
    );
    return res.rows;
  }

  static async addQuestion(assessmentId: number, dto: CreateQuestionDTO): Promise<AssessmentQuestion> {
    const assessmentRes = await pool.query(`SELECT id FROM assessments WHERE id = $1`, [assessmentId]);
    if (assessmentRes.rows.length === 0) {
      throw new Error('Assessment not found.');
    }

    // Auto-calculate sequence_order if not provided
    let sequenceOrder = dto.sequence_order;
    if (!sequenceOrder || sequenceOrder <= 0) {
      const maxSeqRes = await pool.query(
        `SELECT COALESCE(MAX(sequence_order), 0) + 1 as next_seq FROM assessment_questions WHERE assessment_id = $1`,
        [assessmentId]
      );
      sequenceOrder = maxSeqRes.rows[0].next_seq;
    }

    const query = `
      INSERT INTO assessment_questions (assessment_id, question_text, question_type, options, correct_answer, marks, sequence_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const res = await pool.query(query, [
      assessmentId,
      dto.question_text,
      dto.question_type,
      dto.options ? JSON.stringify(dto.options) : null,
      dto.correct_answer,
      dto.marks || 1.0,
      sequenceOrder,
    ]);

    // Update total_questions count
    await pool.query(
      `UPDATE assessments SET total_questions = (SELECT COUNT(*)::int FROM assessment_questions WHERE assessment_id = $1), updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [assessmentId]
    );

    return res.rows[0];
  }

  static async updateQuestion(questionId: number, dto: UpdateQuestionDTO): Promise<AssessmentQuestion | null> {
    const existing = await pool.query(`SELECT * FROM assessment_questions WHERE id = $1`, [questionId]);
    if (existing.rows.length === 0) return null;

    const current = existing.rows[0];
    const questionText = dto.question_text !== undefined ? dto.question_text : current.question_text;
    const questionType = dto.question_type !== undefined ? dto.question_type : current.question_type;
    const options = dto.options !== undefined ? (dto.options ? JSON.stringify(dto.options) : null) : current.options;
    const correctAnswer = dto.correct_answer !== undefined ? dto.correct_answer : current.correct_answer;
    const marks = dto.marks !== undefined ? dto.marks : current.marks;
    const sequenceOrder = dto.sequence_order !== undefined ? dto.sequence_order : current.sequence_order;

    const query = `
      UPDATE assessment_questions
      SET question_text = $1, question_type = $2, options = $3, correct_answer = $4, marks = $5, sequence_order = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    const res = await pool.query(query, [questionText, questionType, options, correctAnswer, marks, sequenceOrder, questionId]);
    return res.rows[0];
  }

  static async deleteQuestion(questionId: number): Promise<void> {
    const existing = await pool.query(`SELECT assessment_id FROM assessment_questions WHERE id = $1`, [questionId]);
    if (existing.rows.length === 0) {
      throw new Error('Question not found.');
    }
    const assessmentId = existing.rows[0].assessment_id;

    await pool.query(`DELETE FROM assessment_questions WHERE id = $1`, [questionId]);

    // Update total_questions count
    await pool.query(
      `UPDATE assessments SET total_questions = (SELECT COUNT(*)::int FROM assessment_questions WHERE assessment_id = $1), updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [assessmentId]
    );
  }

  // ==========================================
  // 3. ATTEMPTS & GRADING
  // ==========================================

  static async startAttempt(assessmentId: number, resourceId: number): Promise<AssessmentAttempt> {
    const assessmentRes = await pool.query(`SELECT id FROM assessments WHERE id = $1`, [assessmentId]);
    if (assessmentRes.rows.length === 0) {
      throw new Error('Assessment not found.');
    }

    // Check if resource has already attempted this assessment
    const existingAttempt = await pool.query(
      `SELECT id, completed_at FROM assessment_attempts WHERE assessment_id = $1 AND resource_id = $2`,
      [assessmentId, resourceId]
    );

    if (existingAttempt.rows.length > 0) {
      throw new Error('You have already attempted this assessment. Re-attempts are not allowed.');
    }

    const query = `
      INSERT INTO assessment_attempts (assessment_id, resource_id, started_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const res = await pool.query(query, [assessmentId, resourceId]);
    return res.rows[0];
  }

  static async submitAttempt(attemptId: number, dto: SubmitAttemptDTO): Promise<AttemptWithAnswers> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch attempt
      const attemptRes = await client.query(`SELECT * FROM assessment_attempts WHERE id = $1`, [attemptId]);
      if (attemptRes.rows.length === 0) {
        throw new Error('Attempt not found.');
      }
      const attempt = attemptRes.rows[0];

      if (attempt.completed_at) {
        throw new Error('This attempt has already been submitted.');
      }

      // Fetch assessment and questions for grading
      const assessmentRes = await client.query(`SELECT * FROM assessments WHERE id = $1`, [attempt.assessment_id]);
      const assessment = assessmentRes.rows[0];

      const questionsRes = await client.query(
        `SELECT * FROM assessment_questions WHERE assessment_id = $1`,
        [attempt.assessment_id]
      );
      const questionsMap = new Map(questionsRes.rows.map((q: any) => [q.id, q]));

      let totalMarksObtained = 0;
      let totalMarksPossible = 0;
      const insertedAnswers: any[] = [];

      for (const answer of dto.answers) {
        const question = questionsMap.get(answer.question_id);
        if (!question) continue;

        totalMarksPossible += parseFloat(question.marks);

        // Auto-grade MCQ and true_false
        let isCorrect: boolean | null = null;
        let marksObtained = 0;

        if (question.question_type === 'mcq' || question.question_type === 'true_false') {
          isCorrect = answer.given_answer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
          marksObtained = isCorrect ? parseFloat(question.marks) : 0;
        } else {
          // short_answer — exact match (case-insensitive)
          isCorrect = answer.given_answer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
          marksObtained = isCorrect ? parseFloat(question.marks) : 0;
        }

        totalMarksObtained += marksObtained;

        const answerQuery = `
          INSERT INTO assessment_answers (attempt_id, question_id, given_answer, is_correct, marks_obtained)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        const ansRes = await client.query(answerQuery, [
          attemptId,
          answer.question_id,
          answer.given_answer,
          isCorrect,
          marksObtained,
        ]);
        insertedAnswers.push(ansRes.rows[0]);
      }

      // Calculate score as percentage
      const score = totalMarksPossible > 0
        ? parseFloat(((totalMarksObtained / totalMarksPossible) * 100).toFixed(2))
        : 0;
      const passed = score >= parseFloat(assessment.passing_score);

      // Update attempt
      const updateQuery = `
        UPDATE assessment_attempts
        SET score = $1, passed = $2, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      const updatedAttempt = await client.query(updateQuery, [score, passed, attemptId]);

      await client.query('COMMIT');

      return {
        ...updatedAttempt.rows[0],
        answers: insertedAnswers,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getAttemptsByResource(resourceId: number): Promise<AssessmentAttempt[]> {
    const query = `
      SELECT 
        aa.id,
        aa.assessment_id,
        aa.resource_id,
        aa.score,
        aa.passed,
        aa.started_at,
        aa.completed_at,
        aa.created_at,
        aa.updated_at,
        a.name as assessment_name,
        a.type as assessment_type,
        a.total_questions,
        a.passing_score
      FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      WHERE aa.resource_id = $1
      ORDER BY aa.started_at DESC
    `;
    const res = await pool.query(query, [resourceId]);
    return res.rows;
  }

  static async getAttemptsByAssessment(assessmentId: number): Promise<AssessmentAttempt[]> {
    const query = `
      SELECT 
        aa.id,
        aa.assessment_id,
        aa.resource_id,
        aa.score,
        aa.passed,
        aa.started_at,
        aa.completed_at,
        aa.created_at,
        aa.updated_at,
        u.name as resource_name,
        a.total_questions,
        a.passing_score
      FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      JOIN resources r ON aa.resource_id = r.id
      JOIN users u ON r.user_id = u.id
      WHERE aa.assessment_id = $1
      ORDER BY aa.started_at DESC
    `;
    const res = await pool.query(query, [assessmentId]);
    return res.rows;
  }

  static async getAttemptDetails(attemptId: number): Promise<AttemptWithAnswers | null> {
    const attemptQuery = `
      SELECT 
        aa.id,
        aa.assessment_id,
        aa.resource_id,
        aa.score,
        aa.passed,
        aa.started_at,
        aa.completed_at,
        aa.created_at,
        aa.updated_at,
        a.name as assessment_name,
        a.type as assessment_type,
        a.total_questions,
        a.passing_score,
        u.name as resource_name
      FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      JOIN resources r ON aa.resource_id = r.id
      JOIN users u ON r.user_id = u.id
      WHERE aa.id = $1
    `;
    const attemptRes = await pool.query(attemptQuery, [attemptId]);
    if (attemptRes.rows.length === 0) return null;

    const answersQuery = `
      SELECT 
        ans.id,
        ans.attempt_id,
        ans.question_id,
        ans.given_answer,
        ans.is_correct,
        ans.marks_obtained,
        ans.created_at,
        ans.updated_at,
        aq.question_text,
        aq.question_type,
        aq.options,
        aq.correct_answer,
        aq.marks
      FROM assessment_answers ans
      JOIN assessment_questions aq ON ans.question_id = aq.id
      WHERE ans.attempt_id = $1
      ORDER BY aq.sequence_order ASC
    `;
    const answersRes = await pool.query(answersQuery, [attemptId]);

    return {
      ...attemptRes.rows[0],
      answers: answersRes.rows,
    };
  }
}
