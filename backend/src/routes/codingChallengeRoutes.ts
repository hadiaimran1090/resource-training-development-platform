import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  getCodingChallenges,
  getCodingChallengeById,
  createCodingChallenge,
  updateCodingChallenge,
  deleteCodingChallenge,
  getChallengeForAttempt,
  submitCodingChallenge,
  getResourceSubmissions,
  getPendingReviewSubmissions,
  reviewSubmission,
} from '../controllers/codingChallengeController.js';

const router = Router();

// Require authentication for all routes
router.use(authenticateToken);

// ==========================================
// 1. CODING CHALLENGES CATALOG
// ==========================================

// List all challenges (filterable by language, difficulty_level, target_role_profile_id)
router.get('/coding-challenges', getCodingChallenges);

// Detail view for attempt (Resource facing: strips expected_output)
router.get('/coding-challenges/:id/attempt', getChallengeForAttempt);

// Full detail view with test cases (Regional Lead, Training Manager, Admin, Mentor)
router.get(
  '/coding-challenges/:id',
  requireRoles('Regional Lead', 'Training Manager', 'System Administrator', 'Admin', 'Mentor'),
  getCodingChallengeById
);

// Challenge Catalog CRUD (Regional Lead + Training Manager ONLY; Admin read-only)
router.post(
  '/coding-challenges',
  requireRoles('Regional Lead', 'Training Manager'),
  createCodingChallenge
);

router.put(
  '/coding-challenges/:id',
  requireRoles('Regional Lead', 'Training Manager'),
  updateCodingChallenge
);

router.delete(
  '/coding-challenges/:id',
  requireRoles('Regional Lead', 'Training Manager'),
  deleteCodingChallenge
);

// ==========================================
// 2. SUBMISSIONS & REVIEW QUEUE
// ==========================================

// Resource submits code answer
router.post('/coding-challenges/:id/submissions', submitCodingChallenge);

// List submission history for a resource
router.get('/resources/:resourceId/coding-submissions', getResourceSubmissions);
router.get('/coding-submissions/my-submissions', getResourceSubmissions);

// Mentor Review Queue: list submissions pending review
router.get(
  '/coding-submissions/review-queue',
  requireRoles('Mentor', 'Regional Lead', 'Training Manager', 'System Administrator', 'Admin'),
  getPendingReviewSubmissions
);

// Review & grade submission
router.put(
  '/coding-submissions/:id/review',
  requireRoles('Mentor', 'Regional Lead', 'Training Manager', 'System Administrator', 'Admin'),
  reviewSubmission
);

export default router;
