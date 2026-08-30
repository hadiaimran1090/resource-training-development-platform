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

export default router;
