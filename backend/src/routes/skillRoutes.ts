import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
} from '../controllers/skillController.js';

const router = Router();

router.use(authenticateToken);

// GET /api/skills - All authenticated users can view skills catalog
router.get('/', getSkills);

// Admin & Training Manager only endpoints for skills catalog management
router.post('/', requireRoles('System Administrator', 'Training Manager'), createSkill);
router.put('/:id', requireRoles('System Administrator', 'Training Manager'), updateSkill);
router.delete('/:id', requireRoles('System Administrator', 'Training Manager'), deleteSkill);

export default router;
