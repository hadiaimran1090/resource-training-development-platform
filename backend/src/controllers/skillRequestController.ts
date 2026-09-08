import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { SkillRequestService } from '../services/skillRequestService.js';

export const createSkillRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const { skill_name, category, justification } = req.body;
    const request = await SkillRequestService.createRequest({
      requested_by: userId,
      skill_name,
      category,
      justification,
    });

    res.status(201).json(request);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to submit skill request.' });
  }
};

export const getPendingSkillRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRoles = req.user?.roles || (req.user?.role ? [req.user.role] : []);
    const isSystemAdmin = userRoles.includes('System Administrator');

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const requests = await SkillRequestService.getPendingRequests(userId, isSystemAdmin);
    res.status(200).json(requests);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch pending skill requests.' });
  }
};

export const getMySkillRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const requests = await SkillRequestService.getMyRequests(userId);
    res.status(200).json(requests);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch your skill requests.' });
  }
};

export const approveSkillRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviewerUserId = req.user?.userId;
    if (!reviewerUserId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const { id } = req.params;
    const result = await SkillRequestService.approveRequest(Number(id), reviewerUserId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to approve skill request.' });
  }
};

export const rejectSkillRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviewerUserId = req.user?.userId;
    if (!reviewerUserId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const { id } = req.params;
    const result = await SkillRequestService.rejectRequest(Number(id), reviewerUserId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to reject skill request.' });
  }
};
