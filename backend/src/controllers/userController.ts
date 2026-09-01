import { Request, Response } from 'express';
import { UserService } from '../services/userService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export class UserController {
  /**
   * GET /api/users
   */
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const search = req.query.search ? String(req.query.search) : undefined;
      const roleId = req.query.roleId ? parseInt(String(req.query.roleId), 10) : undefined;
      const regionId = req.query.regionId ? parseInt(String(req.query.regionId), 10) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;
      const currentUserId = (req as AuthenticatedRequest).user?.userId;

      const users = await UserService.getAllUsers({ search, roleId, regionId, status }, currentUserId);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve users.',
      });
    }
  }

  /**
   * GET /api/users/:id
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID.',
        });
        return;
      }

      const user = await UserService.getUserById(id);

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'User not found.',
      });
    }
  }

  /**
   * GET /api/users/:id/bench-history
   */
  static async getUserBenchHistory(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID.',
        });
        return;
      }

      const benchData = await UserService.getUserBenchHistory(id);

      res.status(200).json({
        success: true,
        message: 'Bench history retrieved successfully',
        data: {
          ...benchData,
          totalBenchDays: benchData.maxBenchDays,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve bench history.',
      });
    }
  }

  /**
   * POST /api/users
   */
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const newUser = await UserService.createUser(req.body);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create user.',
      });
    }
  }

  /**
   * PUT /api/users/:id
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID.',
        });
        return;
      }

      const authUser = (req as AuthenticatedRequest).user;
      const isAdmin = authUser?.roles?.includes('System Administrator') || authUser?.role === 'System Administrator';

      const updatedUser = await UserService.updateUser(id, req.body, isAdmin);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update user.',
      });
    }
  }

  /**
   * PATCH /api/users/:id/status
   */
  static async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID.',
        });
        return;
      }

      const { status } = req.body;
      const updatedUser = await UserService.updateUserStatus(id, status);

      res.status(200).json({
        success: true,
        message: `User status updated to ${status}`,
        data: updatedUser,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update user status.',
      });
    }
  }

  /**
   * DELETE /api/users/:id
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID.',
        });
        return;
      }

      const currentAdminUserId = (req as AuthenticatedRequest).user?.userId;
      await UserService.deleteUser(id, currentAdminUserId);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete user.',
      });
    }
  }

  /**
   * GET /api/roles
   */
  static async getRoles(_req: Request, res: Response): Promise<void> {
    try {
      const roles = await UserService.getRoles();
      res.status(200).json({
        success: true,
        message: 'Roles retrieved successfully',
        data: roles,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve roles.',
      });
    }
  }

  /**
   * GET /api/regions
   */
  static async getRegions(_req: Request, res: Response): Promise<void> {
    try {
      const regions = await UserService.getRegions();
      res.status(200).json({
        success: true,
        message: 'Regions retrieved successfully',
        data: regions,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve regions.',
      });
    }
  }

  /**
   * GET /api/practices
   */
  static async getPractices(req: Request, res: Response): Promise<void> {
    try {
      const regionId = req.query.regionId ? parseInt(String(req.query.regionId), 10) : undefined;
      const practices = regionId ? await UserService.getPracticesByRegion(regionId) : await UserService.getPractices();
      res.status(200).json({
        success: true,
        message: 'Practices retrieved successfully',
        data: practices,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve practices.',
      });
    }
  }

  /**
   * GET /api/regions/:regionId/practices
   */
  static async getPracticesByRegion(req: Request, res: Response): Promise<void> {
    try {
      const regionId = parseInt(String(req.params.regionId), 10);
      if (isNaN(regionId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid region ID.',
        });
        return;
      }
      const practices = await UserService.getPracticesByRegion(regionId);
      res.status(200).json({
        success: true,
        message: 'Practices for region retrieved successfully',
        data: practices,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve practices for region.',
      });
    }
  }
}
