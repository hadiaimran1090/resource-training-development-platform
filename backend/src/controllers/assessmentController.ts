import { Request, Response } from 'express';
import { AssessmentService } from '../services/assessmentService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const getParam = (paramVal: any): string => {
  if (Array.isArray(paramVal)) return paramVal[0];
  return String(paramVal || '');
};

// ==========================================
// 1. ASSESSMENT CRUD
// ==========================================

export const getAssessments = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = req.query.type ? getParam(req.query.type) : undefined;
    const assessments = await AssessmentService.getAllAssessments(type);
    res.status(200).json({ success: true, data: assessments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to retrieve assessments.' });
  }
};

export const getAssessmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(getParam(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid assessment ID.' });
      return;
    }

    const assessment = await AssessmentService.getAssessmentById(id);
    if (!assessment) {
      res.status(404).json({ success: false, message: 'Assessment not found.' });
      return;
    }

    res.status(200).json({ success: true, data: assessment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to retrieve assessment.' });
  }
};

export const createAssessment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, type, related_module_id, passing_score, questions } = req.body;

    if (!name || !type || passing_score === undefined) {
      res.status(400).json({
        success: false,
        message: 'Name, type, and passing_score are required.',
      });
      return;
    }

    const createdBy = req.user?.userId;
    if (!createdBy) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const assessment = await AssessmentService.createAssessment(
      {
        name,
        type,
        related_module_id: related_module_id ? parseInt(String(related_module_id), 10) : null,
        passing_score: parseFloat(String(passing_score)),
        questions,
      },
      createdBy
    );

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully.',
      data: assessment,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to create assessment.' });
  }
};

export const updateAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(getParam(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid assessment ID.' });
      return;
    }

    const { name, type, related_module_id, passing_score } = req.body;

    const assessment = await AssessmentService.updateAssessment(id, {
      name,
      type,
      related_module_id: related_module_id !== undefined ? (related_module_id ? parseInt(String(related_module_id), 10) : null) : undefined,
      passing_score: passing_score !== undefined ? parseFloat(String(passing_score)) : undefined,
    });

    if (!assessment) {
      res.status(404).json({ success: false, message: 'Assessment not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Assessment updated successfully.',
      data: assessment,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to update assessment.' });
  }
};

export const deleteAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(getParam(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid assessment ID.' });
      return;
    }

    await AssessmentService.deleteAssessment(id);
    res.status(200).json({ success: true, message: 'Assessment deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to delete assessment.' });
  }
};

// ==========================================
// 2. QUESTION MANAGEMENT
// ==========================================

export const addQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const assessmentId = parseInt(getParam(req.params.assessmentId), 10);
    if (isNaN(assessmentId)) {
      res.status(400).json({ success: false, message: 'Invalid assessment ID.' });
      return;
    }

    const { question_text, question_type, options, correct_answer, marks, sequence_order } = req.body;

    if (!question_text || !question_type || !correct_answer) {
      res.status(400).json({
        success: false,
        message: 'question_text, question_type, and correct_answer are required.',
      });
      return;
    }

    const question = await AssessmentService.addQuestion(assessmentId, {
      question_text,
      question_type,
      options,
      correct_answer,
      marks: marks !== undefined ? parseFloat(String(marks)) : undefined,
      sequence_order: sequence_order !== undefined ? parseInt(String(sequence_order), 10) : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Question added successfully.',
      data: question,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to add question.' });
  }
};

export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const questionId = parseInt(getParam(req.params.questionId), 10);
    if (isNaN(questionId)) {
      res.status(400).json({ success: false, message: 'Invalid question ID.' });
      return;
    }

    const { question_text, question_type, options, correct_answer, marks, sequence_order } = req.body;

    const question = await AssessmentService.updateQuestion(questionId, {
      question_text,
      question_type,
      options,
      correct_answer,
      marks: marks !== undefined ? parseFloat(String(marks)) : undefined,
      sequence_order: sequence_order !== undefined ? parseInt(String(sequence_order), 10) : undefined,
    });

    if (!question) {
      res.status(404).json({ success: false, message: 'Question not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Question updated successfully.',
      data: question,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to update question.' });
  }
};

export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const questionId = parseInt(getParam(req.params.questionId), 10);
    if (isNaN(questionId)) {
      res.status(400).json({ success: false, message: 'Invalid question ID.' });
      return;
    }

    await AssessmentService.deleteQuestion(questionId);
    res.status(200).json({ success: true, message: 'Question deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to delete question.' });
  }
};

// ==========================================
// 3. ATTEMPTS & GRADING
// ==========================================

export const startAttempt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const assessmentId = parseInt(getParam(req.params.assessmentId), 10);
    if (isNaN(assessmentId)) {
      res.status(400).json({ success: false, message: 'Invalid assessment ID.' });
      return;
    }

    const resourceId = req.body.resource_id ? parseInt(String(req.body.resource_id), 10) : undefined;
    if (!resourceId) {
      res.status(400).json({ success: false, message: 'resource_id is required.' });
      return;
    }

    const attempt = await AssessmentService.startAttempt(assessmentId, resourceId);
    res.status(201).json({
      success: true,
      message: 'Assessment attempt started.',
      data: attempt,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to start attempt.' });
  }
};

export const submitAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const attemptId = parseInt(getParam(req.params.attemptId), 10);
    if (isNaN(attemptId)) {
      res.status(400).json({ success: false, message: 'Invalid attempt ID.' });
      return;
    }

    const { answers } = req.body;
    if (!Array.isArray(answers)) {
      res.status(400).json({ success: false, message: 'answers must be an array of { question_id, given_answer }.' });
      return;
    }

    const result = await AssessmentService.submitAttempt(attemptId, { answers });
    res.status(200).json({
      success: true,
      message: 'Assessment submitted and graded successfully.',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || 'Failed to submit attempt.' });
  }
};

export const getMyAttempts = async (req: Request, res: Response): Promise<void> => {
  try {
    const resourceId = req.query.resource_id ? parseInt(getParam(req.query.resource_id), 10) : undefined;
    if (!resourceId) {
      res.status(400).json({ success: false, message: 'resource_id query parameter is required.' });
      return;
    }

    const attempts = await AssessmentService.getAttemptsByResource(resourceId);
    res.status(200).json({ success: true, data: attempts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to retrieve attempts.' });
  }
};

export const getAssessmentAttempts = async (req: Request, res: Response): Promise<void> => {
  try {
    const assessmentId = parseInt(getParam(req.params.assessmentId), 10);
    if (isNaN(assessmentId)) {
      res.status(400).json({ success: false, message: 'Invalid assessment ID.' });
      return;
    }

    const attempts = await AssessmentService.getAttemptsByAssessment(assessmentId);
    res.status(200).json({ success: true, data: attempts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to retrieve attempts.' });
  }
};

export const getAttemptDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const attemptId = parseInt(getParam(req.params.attemptId), 10);
    if (isNaN(attemptId)) {
      res.status(400).json({ success: false, message: 'Invalid attempt ID.' });
      return;
    }

    const attempt = await AssessmentService.getAttemptDetails(attemptId);
    if (!attempt) {
      res.status(404).json({ success: false, message: 'Attempt not found.' });
      return;
    }

    res.status(200).json({ success: true, data: attempt });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to retrieve attempt details.' });
  }
};
