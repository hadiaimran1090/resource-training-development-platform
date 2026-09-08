import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  createSkillRequest,
  getPendingSkillRequests,
  getMySkillRequests,
  approveSkillRequest,
  rejectSkillRequest,
} from '../controllers/skillRequestController.js';

const router = Router();

router.use(authenticateToken);

router.post('/requests', createSkillRequest);
router.get('/requests/my', getMySkillRequests);
router.get(
  '/requests/pending',
  requireRoles('Regional Lead', 'System Administrator', 'Training Manager'),
  getPendingSkillRequests
);
router.put(
  '/requests/:id/approve',
  requireRoles('Regional Lead', 'System Administrator', 'Training Manager'),
  approveSkillRequest
);
router.put(
  '/requests/:id/reject',
  requireRoles('Regional Lead', 'System Administrator', 'Training Manager'),
  rejectSkillRequest
);

export default router;
