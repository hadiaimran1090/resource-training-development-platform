import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  recalculateReadinessScoreHandler,
  getReadinessHistoryHandler,
  getReadinessWeightsHandler,
  updateReadinessWeightsHandler,
} from '../controllers/readinessScoreController.js';

const router = Router();
router.use(authenticateToken);

// GET /api/readiness-score-weights (Admin only)
router.get(
  '/readiness-score-weights',
  requireRoles('System Administrator'),
  getReadinessWeightsHandler
);

// PUT /api/readiness-score-weights (Admin only)
router.put(
  '/readiness-score-weights',
  requireRoles('System Administrator'),
  updateReadinessWeightsHandler
);

// POST /api/resources/:resourceId/readiness-score/recalculate
// Regional Lead, Admin, and Resource (own score) can trigger recalculation
router.post(
  '/resources/:resourceId/readiness-score/recalculate',
  requireRoles('Regional Lead', 'System Administrator', 'Training Manager', 'Resource'),
  recalculateReadinessScoreHandler
);

// GET /api/resources/:resourceId/readiness-score/history
router.get(
  '/resources/:resourceId/readiness-score/history',
  getReadinessHistoryHandler
);

export default router;
