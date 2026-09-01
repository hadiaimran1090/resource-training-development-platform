import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  getAssignments,
  getAssignableResources,
  createAssignment,
  updateAssignment,
  toggleAssignmentStatus,
  deleteAssignment,
} from '../controllers/assignmentController.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAssignments);
router.get('/assignable-resources', getAssignableResources);

// Assignment creation strictly restricted to Regional Lead (Requirement #10)
router.post('/', requireRoles('Regional Lead'), createAssignment);
router.put('/:id', requireRoles('System Administrator', 'Regional Lead'), updateAssignment);
router.patch('/:id/status', requireRoles('System Administrator', 'Regional Lead'), toggleAssignmentStatus);
router.delete('/:id', requireRoles('System Administrator', 'Regional Lead'), deleteAssignment);

export default router;
