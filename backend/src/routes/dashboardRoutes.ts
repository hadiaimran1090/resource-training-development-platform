import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.js';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.get(
  '/admin/dashboard-stats',
  authenticateToken,
  requireRoles('System Administrator', 'Practice Lead', 'Regional Lead', 'Management'),
  DashboardController.getDashboardStats
);

export default router;
