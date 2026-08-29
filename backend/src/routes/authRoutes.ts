import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Health Check
router.get('/health', AuthController.healthCheck);

// Authentication Routes
router.post('/auth/login', AuthController.login);
router.get('/auth/me', authenticateToken, AuthController.getCurrentUser);

export default router;
