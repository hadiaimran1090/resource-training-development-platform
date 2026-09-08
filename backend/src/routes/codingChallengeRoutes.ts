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
router.get(
  '/coding-challenges',
  requireRoles('Resource', 'Regional Lead', 'Training Manager'),
  getCodingChallenges
);

// Detail view for attempt (Resource facing: strips expected_output)
router.get('/coding-challenges/:id/attempt', requireRoles('Resource'), getChallengeForAttempt);

// Full detail view with test cases (challenge managers only)
router.get(
  '/coding-challenges/:id',
  requireRoles('Regional Lead', 'Training Manager'),
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

// Resources can only submit their own code.
router.post('/coding-challenges/:id/submissions', requireRoles('Resource'), submitCodingChallenge);

// Resources can only access their own submission history.
router.get('/resources/:resourceId/coding-submissions', requireRoles('Resource'), getResourceSubmissions);
router.get('/coding-submissions/my-submissions', requireRoles('Resource'), getResourceSubmissions);

// Mentor Review Queue: list submissions pending review
router.get(
  '/coding-submissions/review-queue',
  requireRoles('Mentor'),
  getPendingReviewSubmissions
);

// Review & grade submission
router.put(
  '/coding-submissions/:id/review',
  requireRoles('Mentor'),
  reviewSubmission
);

export default router;
