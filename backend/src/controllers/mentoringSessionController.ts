import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { MentoringSessionService } from '../services/mentoringSessionService.js';
import { ResourceService } from '../services/resourceService.js';

export const getResourceMentoringSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.resourceId) ? req.params.resourceId[0] : req.params.resourceId;
    const resourceId = parseInt(rawId, 10);
    if (isNaN(resourceId)) {
      res.status(400).json({ error: 'Invalid resource ID' });
      return;
    }

    const resource = await ResourceService.getResourceById(resourceId);
    if (!resource) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    const user = req.user!;
    const userRoles = user.roles || (user.role ? [user.role] : []);

    const isAdmin = userRoles.includes('System Administrator');
    const isSelf = resource.user_id === user.userId;
    const isRegionalLead = userRoles.includes('Regional Lead') && resource.region_id === user.regionId;
    const isMentor = userRoles.includes('Mentor') && resource.mentor_id === user.userId;

    if (!isAdmin && !isSelf && !isRegionalLead && !isMentor) {
      res.status(403).json({ error: 'Access forbidden: You cannot view mentoring sessions for this resource' });
      return;
    }

    const sessions = await MentoringSessionService.getMentoringSessionsByResource(resourceId);
    res.status(200).json(sessions);
  } catch (error: any) {
    console.error('Error fetching mentoring sessions:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getMyLoggedMentoringSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const sessions = await MentoringSessionService.getMentoringSessionsByMentor(user.userId);
    res.status(200).json(sessions);
  } catch (error: any) {
    console.error('Error fetching mentor sessions:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const createMentoringSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resource_id, session_date, session_type, notes } = req.body;

    if (!resource_id || !session_date || !session_type) {
      res.status(400).json({ error: 'resource_id, session_date, and session_type are required' });
      return;
    }

    const resource = await ResourceService.getResourceById(resource_id);
    if (!resource) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    const user = req.user!;
    const userRoles = user.roles || (user.role ? [user.role] : []);

    const isAdmin = userRoles.includes('System Administrator');
    const isMentor = userRoles.includes('Mentor');
    const isRegionalLead = userRoles.includes('Regional Lead');

    if (!isAdmin && !isMentor && !isRegionalLead) {
      res.status(403).json({ error: 'Access forbidden: Only Mentor, Regional Lead, or Admin can log mentoring sessions' });
      return;
    }

    const created = await MentoringSessionService.createMentoringSession(user.userId, {
      resource_id,
      session_date,
      session_type,
      notes,
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating mentoring session:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const updateMentoringSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid session ID' });
      return;
    }

    const session = await MentoringSessionService.getMentoringSessionById(id);
    if (!session) {
      res.status(404).json({ error: 'Mentoring session not found' });
      return;
    }

    const user = req.user!;
    const userRoles = user.roles || (user.role ? [user.role] : []);

    const isAdmin = userRoles.includes('System Administrator');
    const isAuthorMentor = session.mentor_id === user.userId;

    if (!isAdmin && !isAuthorMentor) {
      res.status(403).json({ error: 'Access forbidden: Mentors can only edit their own logged sessions' });
      return;
    }

    const updated = await MentoringSessionService.updateMentoringSession(id, req.body);
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating mentoring session:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const deleteMentoringSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid session ID' });
      return;
    }

    const session = await MentoringSessionService.getMentoringSessionById(id);
    if (!session) {
      res.status(404).json({ error: 'Mentoring session not found' });
      return;
    }

    const user = req.user!;
    const userRoles = user.roles || (user.role ? [user.role] : []);

    const isAdmin = userRoles.includes('System Administrator');
    const isAuthorMentor = session.mentor_id === user.userId;

    if (!isAdmin && !isAuthorMentor) {
      res.status(403).json({ error: 'Access forbidden: Mentors can only delete their own logged sessions' });
      return;
    }

    await MentoringSessionService.deleteMentoringSession(id);
    res.status(200).json({ message: 'Mentoring session deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting mentoring session:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
