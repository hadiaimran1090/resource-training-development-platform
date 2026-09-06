import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { TrainingAssignmentService } from '../services/trainingAssignmentService.js';

export class TrainingAssignmentController {
  /**
   * POST /api/training-assignments
   */
  static async createAssignment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { resource_id, track_id, start_date } = req.body;

      if (!resource_id || !track_id || !start_date) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: resource_id, track_id, and start_date are required.',
        });
        return;
      }

      const userId = req.user!.userId;
      const roles = req.user!.roles || (req.user!.role ? [req.user!.role] : []);
      const regionId = req.user!.regionId;

      const assignment = await TrainingAssignmentService.createAssignment(
        { resource_id: Number(resource_id), track_id: Number(track_id), start_date },
        userId,
        roles,
        regionId
      );

      res.status(201).json({
        success: true,
        message: 'Training assignment created and daily activities auto-generated successfully.',
        data: assignment,
      });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to create training assignment.',
      });
    }
  }

  /**
   * PUT /api/training-assignments/:id
   */
  static async updateAssignment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const assignmentId = Number(req.params.id);
      const { track_id, start_date } = req.body;
      const userId = req.user!.userId;
      const roles = req.user!.roles || (req.user!.role ? [req.user!.role] : []);
      const regionId = req.user!.regionId;

      const updatedAssignment = await TrainingAssignmentService.updateAssignment(
        assignmentId,
        { track_id: track_id ? Number(track_id) : undefined, start_date },
        userId,
        roles,
        regionId
      );

      res.status(200).json({
        success: true,
        message: 'Training assignment updated successfully.',
        data: updatedAssignment,
      });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to update training assignment.',
      });
    }
  }

  /**
   * DELETE /api/training-assignments/:id
   */
  static async deleteAssignment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const assignmentId = Number(req.params.id);
      const userId = req.user!.userId;
      const roles = req.user!.roles || (req.user!.role ? [req.user!.role] : []);
      const regionId = req.user!.regionId;

      await TrainingAssignmentService.deleteAssignment(assignmentId, userId, roles, regionId);

      res.status(200).json({
        success: true,
        message: 'Training assignment deleted successfully.',
      });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to delete training assignment.',
      });
    }
  }

  /**
   * PUT /api/training-assignments/:id/approve
   */
  static async approveAssignment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const assignmentId = Number(req.params.id);
      const userId = req.user!.userId;
      const roles = req.user!.roles || (req.user!.role ? [req.user!.role] : []);
      const regionId = req.user!.regionId;

      const updatedAssignment = await TrainingAssignmentService.approveAssignment(
        assignmentId,
        userId,
        roles,
        regionId
      );

      res.status(200).json({
        success: true,
        message: 'Training assignment approved successfully.',
        data: updatedAssignment,
      });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to approve training assignment.',
      });
    }
  }

  /**
   * PUT /api/training-assignments/:id/reject
   */
  static async rejectAssignment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const assignmentId = Number(req.params.id);
      const userId = req.user!.userId;
      const roles = req.user!.roles || (req.user!.role ? [req.user!.role] : []);
      const regionId = req.user!.regionId;

      const updatedAssignment = await TrainingAssignmentService.rejectAssignment(
        assignmentId,
        userId,
        roles,
        regionId
      );

      res.status(200).json({
        success: true,
        message: 'Training assignment rejected successfully.',
        data: updatedAssignment,
      });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to reject training assignment.',
      });
    }
  }

  /**
   * GET /api/training-assignments
   */
  static async getAssignments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const roles = req.user!.roles || (req.user!.role ? [req.user!.role] : []);
      const regionId = req.user!.regionId;

      const assignments = await TrainingAssignmentService.getAssignments({
        userId,
        userRoles: roles,
        userRegionId: regionId,
      });

      res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to fetch training assignments.',
      });
    }
  }

  /**
   * GET /api/training-assignments/:id
   */
  static async getAssignmentById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const assignmentId = Number(req.params.id);
      const userId = req.user!.userId;
      const roles = req.user!.roles || (req.user!.role ? [req.user!.role] : []);
      const regionId = req.user!.regionId;

      const assignment = await TrainingAssignmentService.getAssignmentById(assignmentId, {
        userId,
        userRoles: roles,
        userRegionId: regionId,
      });

      res.status(200).json({
        success: true,
        data: assignment,
      });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to fetch training assignment detail.',
      });
    }
  }

  /**
   * GET /api/resources/:resourceId/daily-activities?date=today
   */
  static async getTodaysActivities(req: AuthRequest, res: Response): Promise<void> {
    try {
      const resourceId = Number(req.params.resourceId);
      const userId = req.user!.userId;
      const roles = req.user!.roles || (req.user!.role ? [req.user!.role] : []);
      const regionId = req.user!.regionId;

      const result = await TrainingAssignmentService.getTodaysActivitiesForResource(
        resourceId,
        {
          userId,
          userRoles: roles,
          userRegionId: regionId,
        }
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        success: false,
        message: error.message || "Failed to fetch today's activities.",
      });
    }
  }

  /**
   * PUT /api/daily-activities/:id/complete
   */
  static async completeDailyActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      const activityId = Number(req.params.id);
      const userId = req.user!.userId;

      const result = await TrainingAssignmentService.completeDailyActivity(activityId, userId);

      res.status(200).json({
        success: true,
        message: result.assignmentCompleted
          ? 'Daily activity completed! Training track assignment is now fully completed!'
          : 'Daily activity marked as complete.',
        data: result,
      });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to mark daily activity complete.',
      });
    }
  }
}
