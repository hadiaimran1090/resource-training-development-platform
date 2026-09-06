import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  getAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  startAttempt,
  submitAttempt,
  getMyAttempts,
  getAssessmentAttempts,
  getAttemptDetails,
} from '../controllers/assessmentController.js';

const router = Router();

// All assessment endpoints require authentication
router.use(authenticateToken);

const writeAccess = requireRoles('System Administrator', 'Training Manager', 'Regional Lead', 'Admin');

// ==========================================
// 1. ASSESSMENT CRUD
// ==========================================
router.get('/assessments', getAssessments);
router.get('/assessments/my-attempts', getMyAttempts);
router.get('/assessments/:id', getAssessmentById);
router.post('/assessments', writeAccess, createAssessment);
router.put('/assessments/:id', writeAccess, updateAssessment);
router.delete('/assessments/:id', writeAccess, deleteAssessment);

// ==========================================
// 2. QUESTION MANAGEMENT
// ==========================================
router.post('/assessments/:assessmentId/questions', writeAccess, addQuestion);
router.put('/assessments/questions/:questionId', writeAccess, updateQuestion);
router.delete('/assessments/questions/:questionId', writeAccess, deleteQuestion);

// ==========================================
// 3. ATTEMPTS & GRADING
// ==========================================
router.post('/assessments/:assessmentId/attempts', startAttempt);
router.post('/assessments/attempts/:attemptId/submit', submitAttempt);
router.get('/assessments/:assessmentId/attempts', writeAccess, getAssessmentAttempts);
router.get('/assessments/attempts/:attemptId', getAttemptDetails);

export default router;
