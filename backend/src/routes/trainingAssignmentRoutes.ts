import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import { TrainingAssignmentController } from '../controllers/trainingAssignmentController.js';

const router = Router();

// Protect all endpoints with JWT auth
router.use(authenticateToken);

// 1. Create Training Assignment (RL & Admin)
router.post(
  '/training-assignments',
  requireRoles('Regional Lead', 'System Administrator'),
  TrainingAssignmentController.createAssignment
);

// 2. Approve Training Assignment (RL & Admin)
router.put(
  '/training-assignments/:id/approve',
  requireRoles('Regional Lead', 'System Administrator'),
  TrainingAssignmentController.approveAssignment
);

// 3. Reject Training Assignment (RL & Admin)
router.put(
  '/training-assignments/:id/reject',
  requireRoles('Regional Lead', 'System Administrator'),
  TrainingAssignmentController.rejectAssignment
);

// Update Pending Training Assignment (RL & Admin)
router.put(
  '/training-assignments/:id',
  requireRoles('Regional Lead', 'System Administrator'),
  TrainingAssignmentController.updateAssignment
);

// Delete Pending Training Assignment (RL & Admin)
router.delete(
  '/training-assignments/:id',
  requireRoles('Regional Lead', 'System Administrator'),
  TrainingAssignmentController.deleteAssignment
);

// 4. List Training Assignments
router.get(
  '/training-assignments',
  requireRoles('Regional Lead', 'Resource', 'System Administrator', 'Practice Lead', 'Training Manager'),
  TrainingAssignmentController.getAssignments
);

// 5. Get Single Training Assignment Detail with Daily Activities
router.get(
  '/training-assignments/:id',
  requireRoles('Regional Lead', 'Resource', 'System Administrator', 'Practice Lead', 'Training Manager'),
  TrainingAssignmentController.getAssignmentById
);

// 6. Get Resource Today's Activities
router.get(
  '/resources/:resourceId/daily-activities',
  requireRoles('Resource', 'Regional Lead', 'System Administrator'),
  TrainingAssignmentController.getTodaysActivities
);

// 7. Complete Daily Activity (Resource only)
router.put(
  '/daily-activities/:id/complete',
  requireRoles('Resource'),
  TrainingAssignmentController.completeDailyActivity
);

export default router;
