import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  getResourceMentoringSessions,
  getMyLoggedMentoringSessions,
  createMentoringSession,
  updateMentoringSession,
  deleteMentoringSession,
} from '../controllers/mentoringSessionController.js';

const router = Router();
router.use(authenticateToken);

// GET /api/resources/:resourceId/mentoring-sessions
router.get(
  '/resources/:resourceId/mentoring-sessions',
  requireRoles('Resource', 'Mentor', 'Regional Lead', 'System Administrator'),
  getResourceMentoringSessions
);

// GET /api/mentoring-sessions/my-sessions
router.get(
  '/mentoring-sessions/my-sessions',
  requireRoles('Mentor', 'System Administrator'),
  getMyLoggedMentoringSessions
);

// POST /api/mentoring-sessions
router.post(
  '/mentoring-sessions',
  requireRoles('Mentor', 'System Administrator'),
  createMentoringSession
);

// PUT /api/mentoring-sessions/:id
router.put(
  '/mentoring-sessions/:id',
  requireRoles('Mentor', 'System Administrator'),
  updateMentoringSession
);

// DELETE /api/mentoring-sessions/:id
router.delete(
  '/mentoring-sessions/:id',
  requireRoles('Mentor', 'System Administrator'),
  deleteMentoringSession
);

export default router;
