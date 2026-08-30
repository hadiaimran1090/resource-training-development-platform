import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  getRegions,
  getRegionById,
  createRegion,
  updateRegion,
  toggleRegionStatus,
} from '../controllers/regionController.js';

const router = Router();

// Protect all region endpoints
router.use(authenticateToken);

router.get('/', getRegions);
router.get('/:id', getRegionById);

// Admin-only write endpoints
router.post('/', requireRoles('System Administrator'), createRegion);
router.put('/:id', requireRoles('System Administrator'), updateRegion);
router.patch('/:id/status', requireRoles('System Administrator'), toggleRegionStatus);

export default router;
