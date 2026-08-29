import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { checkDbConnection } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export class AuthController {
  /**
   * GET /api/health
   */
  static async healthCheck(_req: Request, res: Response): Promise<void> {
    const isDbConnected = await checkDbConnection();

    res.status(200).json({
      success: true,
      message: 'RTDP API is running',
      database: isDbConnected ? 'connected' : 'disconnected',
    });
  }

  /**
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Please provide both email and password.',
        });
        return;
      }

      const result = await AuthService.login({ email, password });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed.',
      });
    }
  }

  /**
   * GET /api/auth/me
   */
  static async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized access.',
        });
        return;
      }

      const user = await AuthService.getCurrentUser(userId);

      res.status(200).json({
        success: true,
        message: 'Current user fetched successfully',
        data: user,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'User not found.',
      });
    }
  }
}
