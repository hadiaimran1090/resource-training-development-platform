import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  getRoleProfiles,
  getRoleProfileById,
  createRoleProfile,
  updateRoleProfile,
  deleteRoleProfile,
  addOrUpdateRoleProfileSkill,
  deleteRoleProfileSkill,
} from '../controllers/skillController.js';

const router = Router();

router.use(authenticateToken);

// All authenticated users can list and view role profiles
router.get('/', getRoleProfiles);
router.get('/:id', getRoleProfileById);

// Admin & Training Manager write endpoints
router.post('/', requireRoles('System Administrator', 'Training Manager'), createRoleProfile);
router.put('/:id', requireRoles('System Administrator', 'Training Manager'), updateRoleProfile);
router.delete('/:id', requireRoles('System Administrator', 'Training Manager'), deleteRoleProfile);

// Manage Role Profile Required Skills
router.post('/:id/skills', requireRoles('System Administrator', 'Training Manager'), addOrUpdateRoleProfileSkill);
router.delete('/:id/skills/:skillId', requireRoles('System Administrator', 'Training Manager'), deleteRoleProfileSkill);

export default router;
