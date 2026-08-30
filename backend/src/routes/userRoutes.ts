import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Catalog Metadata Endpoints (Protected for Authenticated Users)
router.get('/roles', authenticateToken, UserController.getRoles);
router.get('/regions', authenticateToken, UserController.getRegions);
router.get('/practices', authenticateToken, UserController.getPractices);

// User Management Endpoints (STRICTLY Protected for System Administrator Only)
router.get(
  '/users',
  authenticateToken,
  requireRoles('System Administrator'),
  UserController.getAllUsers
);

router.get(
  '/users/:id',
  authenticateToken,
  requireRoles('System Administrator'),
  UserController.getUserById
);

router.post(
  '/users',
  authenticateToken,
  requireRoles('System Administrator'),
  UserController.createUser
);

router.put(
  '/users/:id',
  authenticateToken,
  requireRoles('System Administrator'),
  UserController.updateUser
);

router.patch(
  '/users/:id/status',
  authenticateToken,
  requireRoles('System Administrator'),
  UserController.updateUserStatus
);

router.delete(
  '/users/:id',
  authenticateToken,
  requireRoles('System Administrator'),
  UserController.deleteUser
);

export default router;
