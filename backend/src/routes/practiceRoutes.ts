import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  getPractices,
  getPracticeById,
  createPractice,
  updatePractice,
  togglePracticeStatus,
} from '../controllers/practiceController.js';

const router = Router();

// Protect all practice endpoints
router.use(authenticateToken);

router.get('/', getPractices);
router.get('/:id', getPracticeById);

// Admin-only write endpoints
router.post('/', requireRoles('System Administrator'), createPractice);
router.put('/:id', requireRoles('System Administrator'), updatePractice);
router.patch('/:id/status', requireRoles('System Administrator'), togglePracticeStatus);

export default router;
