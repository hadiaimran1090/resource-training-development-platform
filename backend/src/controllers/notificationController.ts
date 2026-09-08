import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { NotificationService } from '../services/notificationService.js';

export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }
  try {
    await NotificationService.syncPendingSkillRequestNotifications(userId);
    res.status(200).json(await NotificationService.getForUser(userId));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }
  try {
    const updated = await NotificationService.markAsRead(Number(req.params.id), userId);
    if (!updated) {
      res.status(404).json({ message: 'Notification not found.' });
      return;
    }
    res.status(200).json({ message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification.' });
  }
};
