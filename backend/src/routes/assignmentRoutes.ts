import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  toggleAssignmentStatus,
} from '../controllers/assignmentController.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAssignments);

// Authorized admin & leads endpoints
router.post('/', requireRoles('System Administrator', 'Regional Lead', 'Practice Lead'), createAssignment);
router.put('/:id', requireRoles('System Administrator', 'Regional Lead', 'Practice Lead'), updateAssignment);
router.patch('/:id/status', requireRoles('System Administrator', 'Regional Lead', 'Practice Lead'), toggleAssignmentStatus);

export default router;
