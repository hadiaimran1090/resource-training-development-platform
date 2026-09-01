import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Catalog Metadata Endpoints (Protected for Authenticated Users)
router.get('/roles', authenticateToken, UserController.getRoles);
router.get('/users/catalog/roles', authenticateToken, UserController.getRoles);
router.get('/catalog/roles', authenticateToken, UserController.getRoles);

// Bench History Endpoint (Accessible to Admin, Regional Lead, Management, or Self)
router.get('/users/:id/bench-history', authenticateToken, UserController.getUserBenchHistory);

// User Management Endpoints (STRICTLY Protected for System Administrator Only)
router.get(
  '/users',
  authenticateToken,
  requireRoles('System Administrator', 'Regional Lead', 'Practice Lead', 'Management'),
  UserController.getAllUsers
);

router.get(
  '/users/:id',
  authenticateToken,
  requireRoles('System Administrator', 'Regional Lead', 'Practice Lead', 'Management', 'Resource', 'Training Manager', 'Mentor'),
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
  requireRoles('System Administrator', 'Regional Lead', 'Practice Lead', 'Resource', 'Training Manager', 'Mentor', 'Management'),
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
