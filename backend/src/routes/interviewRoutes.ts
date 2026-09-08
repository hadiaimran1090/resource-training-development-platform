import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  getResourceInterviews,
  getInterviewById,
  createInterview,
  updateInterview,
  addInterviewFeedback,
} from '../controllers/interviewController.js';

const router = Router();
router.use(authenticateToken);

// GET /api/resources/:resourceId/interviews
router.get(
  '/resources/:resourceId/interviews',
  requireRoles('Resource', 'Regional Lead', 'Mentor', 'Practice Lead', 'System Administrator'),
  getResourceInterviews
);

// GET /api/interviews/:id
router.get(
  '/interviews/:id',
  requireRoles('Resource', 'Regional Lead', 'Mentor', 'Practice Lead', 'System Administrator'),
  getInterviewById
);

// POST /api/interviews
router.post(
  '/interviews',
  requireRoles('Regional Lead', 'Mentor', 'System Administrator'),
  createInterview
);

// PUT /api/interviews/:id
router.put(
  '/interviews/:id',
  requireRoles('Regional Lead', 'Mentor', 'System Administrator'),
  updateInterview
);

// POST /api/interviews/:id/feedback
router.post(
  '/interviews/:id/feedback',
  requireRoles('Regional Lead', 'Mentor', 'System Administrator'),
  addInterviewFeedback
);

export default router;
