import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import { getMyNotifications, markNotificationAsRead } from '../controllers/notificationController.js';

const router = Router();
router.use(authenticateToken, requireRoles('Regional Lead'));
router.get('/', getMyNotifications);
router.patch('/:id/read', markNotificationAsRead);

export default router;
