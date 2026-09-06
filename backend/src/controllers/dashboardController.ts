import type { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService.js';

export class DashboardController {
  static async getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await DashboardService.getDashboardStats();
      res.status(200).json({
        success: true,
        message: 'Admin dashboard statistics retrieved successfully.',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
