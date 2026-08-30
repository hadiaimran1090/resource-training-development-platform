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

// Authorized admin & leads endpoints
router.post('/', requireRoles('System Administrator', 'Regional Lead', 'Practice Lead'), createAssignment);
router.put('/:id', requireRoles('System Administrator', 'Regional Lead', 'Practice Lead'), updateAssignment);
router.patch('/:id/status', requireRoles('System Administrator', 'Regional Lead', 'Practice Lead'), toggleAssignmentStatus);
router.delete('/:id', requireRoles('System Administrator', 'Regional Lead', 'Practice Lead'), deleteAssignment);

export default router;
