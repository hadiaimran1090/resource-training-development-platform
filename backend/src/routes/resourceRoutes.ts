import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  getResources,
  getResourceById,
  getMyResourceProfile,
  updateMyResourceProfile,
  createResource,
  updateResource,
} from '../controllers/resourceController.js';
import {
  getResourceSkills,
  addResourceSkill,
  updateResourceSkill,
  deleteResourceSkill,
  getSkillGap,
} from '../controllers/skillController.js';

const router = Router();

router.use(authenticateToken);

// Logged-in user's own resource profile endpoint
router.get('/profile/me', getMyResourceProfile);
router.put('/profile/me', updateMyResourceProfile);

// Resource catalog endpoints
router.get('/', getResources);
router.get('/:id', getResourceById);

// Admin-only write endpoints
router.post('/', requireRoles('System Administrator'), createResource);
router.put('/:id', requireRoles('System Administrator'), updateResource);

// Resource Skills Matrix & Live Gap Calculation Endpoints
router.get('/:resourceId/skills', getResourceSkills);
router.post('/:resourceId/skills', addResourceSkill);
router.put('/:resourceId/skills/:skillId', updateResourceSkill);
router.delete('/:resourceId/skills/:skillId', deleteResourceSkill);
router.get('/:resourceId/skill-gap', getSkillGap);

export default router;
