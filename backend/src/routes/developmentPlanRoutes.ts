import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  getDevelopmentPlansHandler,
  getResourceDevelopmentPlanHandler,
  createDevelopmentPlanHandler,
  addPlanItemsHandler,
  updateDevelopmentPlanHandler,
  approveDevelopmentPlanHandler,
  rejectDevelopmentPlanHandler,
  completeDevelopmentPlanHandler,
  deleteDevelopmentPlanHandler,
} from '../controllers/developmentPlanController.js';

const router = Router();
router.use(authenticateToken);

// GET /api/development-plans
router.get(
  '/development-plans',
  requireRoles('Regional Lead', 'Practice Lead', 'Training Manager', 'System Administrator'),
  getDevelopmentPlansHandler
);

// GET /api/resources/:resourceId/development-plan
router.get(
  '/resources/:resourceId/development-plan',
  getResourceDevelopmentPlanHandler
);

// POST /api/development-plans
router.post(
  '/development-plans',
  requireRoles('Regional Lead', 'Training Manager', 'System Administrator'),
  createDevelopmentPlanHandler
);

// POST /api/development-plans/:id/items
router.post(
  '/development-plans/:id/items',
  requireRoles('Regional Lead', 'Training Manager', 'System Administrator'),
  addPlanItemsHandler
);

// PUT /api/development-plans/:id
router.put(
  '/development-plans/:id',
  requireRoles('Regional Lead', 'Training Manager', 'System Administrator'),
  updateDevelopmentPlanHandler
);

// PUT /api/development-plans/:id/approve
router.put(
  '/development-plans/:id/approve',
  requireRoles('Regional Lead', 'System Administrator'),
  approveDevelopmentPlanHandler
);

// PUT /api/development-plans/:id/reject
router.put(
  '/development-plans/:id/reject',
  requireRoles('Regional Lead', 'System Administrator'),
  rejectDevelopmentPlanHandler
);

// PUT /api/development-plans/:id/complete
router.put(
  '/development-plans/:id/complete',
  requireRoles('Regional Lead', 'Training Manager', 'Resource', 'System Administrator'),
  completeDevelopmentPlanHandler
);

// DELETE /api/development-plans/:id
router.delete(
  '/development-plans/:id',
  requireRoles('Regional Lead', 'Training Manager', 'System Administrator'),
  deleteDevelopmentPlanHandler
);

export default router;
