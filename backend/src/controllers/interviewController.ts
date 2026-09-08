import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { InterviewService } from '../services/interviewService.js';
import { ResourceService } from '../services/resourceService.js';

export const getResourceInterviews = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const isPracticeLead = userRoles.includes('Practice Lead');
    const isSelf = resource.user_id === user.userId;
    const isRegionalLead = userRoles.includes('Regional Lead') && resource.region_id === user.regionId;
    const isMentor = userRoles.includes('Mentor') && resource.mentor_id === user.userId;

    if (!isAdmin && !isPracticeLead && !isSelf && !isRegionalLead && !isMentor) {
      res.status(403).json({ error: 'Access forbidden: You cannot view interview history for this resource' });
      return;
    }

    const interviews = await InterviewService.getInterviewsByResource(resourceId);
    res.status(200).json(interviews);
  } catch (error: any) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getInterviewById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid interview ID' });
      return;
    }

    const interview = await InterviewService.getInterviewById(id);
    if (!interview) {
      res.status(404).json({ error: 'Interview record not found' });
      return;
    }

    const user = req.user!;
    const userRoles = user.roles || (user.role ? [user.role] : []);

    const isAdmin = userRoles.includes('System Administrator');
    const isPracticeLead = userRoles.includes('Practice Lead');
    const isSelf = interview.resource_user_id === user.userId;
    const isRegionalLead = userRoles.includes('Regional Lead') && interview.resource_region_id === user.regionId;
    const isMentor = userRoles.includes('Mentor') && interview.resource_mentor_id === user.userId;

    if (!isAdmin && !isPracticeLead && !isSelf && !isRegionalLead && !isMentor) {
      res.status(403).json({ error: 'Access forbidden: You cannot view this interview record' });
      return;
    }

    res.status(200).json(interview);
  } catch (error: any) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const createInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resource_id, client_name, role_profile_id, interview_type, interview_date, result } = req.body;

    if (!resource_id || !interview_type || !interview_date) {
      res.status(400).json({ error: 'resource_id, interview_type, and interview_date are required' });
      return;
    }

    const resource = await ResourceService.getResourceById(resource_id);
    if (!resource) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    const user = req.user!;
    const userRoles = user.roles || (user.role ? [user.role] : []);

    // Hard Rule: Resource CANNOT create interview records for themselves or others
    if (resource.user_id === user.userId || (userRoles.includes('Resource') && !userRoles.includes('Regional Lead') && !userRoles.includes('Mentor') && !userRoles.includes('System Administrator'))) {
      res.status(403).json({ error: 'Access forbidden: Resources cannot self-log interviews' });
      return;
    }

    const isAdmin = userRoles.includes('System Administrator');
    const isRegionalLead = userRoles.includes('Regional Lead') && resource.region_id === user.regionId;
    const isMentor = userRoles.includes('Mentor') && resource.mentor_id === user.userId;

    if (!isAdmin && !isRegionalLead && !isMentor) {
      res.status(403).json({ error: 'Access forbidden: Only Regional Lead (own region) or Mentor (assigned mentee) can log interviews' });
      return;
    }

    const created = await InterviewService.createInterview({
      resource_id,
      client_name,
      role_profile_id,
      interview_type,
      interview_date,
      result,
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating interview:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const updateInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid interview ID' });
      return;
    }

    const interview = await InterviewService.getInterviewById(id);
    if (!interview) {
      res.status(404).json({ error: 'Interview record not found' });
      return;
    }

    const user = req.user!;
    const userRoles = user.roles || (user.role ? [user.role] : []);

    // Hard Rule: Resource CANNOT edit interview records
    if (interview.resource_user_id === user.userId) {
      res.status(403).json({ error: 'Access forbidden: Resources cannot edit interview records' });
      return;
    }

    const isAdmin = userRoles.includes('System Administrator');
    const isRegionalLead = userRoles.includes('Regional Lead') && interview.resource_region_id === user.regionId;
    const isMentor = userRoles.includes('Mentor') && interview.resource_mentor_id === user.userId;

    if (!isAdmin && !isRegionalLead && !isMentor) {
      res.status(403).json({ error: 'Access forbidden: Only Regional Lead or Mentor can edit this interview' });
      return;
    }

    const updated = await InterviewService.updateInterview(id, req.body);
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating interview:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const addInterviewFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid interview ID' });
      return;
    }

    const interview = await InterviewService.getInterviewById(id);
    if (!interview) {
      res.status(404).json({ error: 'Interview record not found' });
      return;
    }

    const user = req.user!;
    const userRoles = user.roles || (user.role ? [user.role] : []);

    // Hard Business Rule: Resource being interviewed CANNOT add feedback for themselves
    if (interview.resource_user_id === user.userId) {
      res.status(403).json({ error: 'Access forbidden: Resources being interviewed cannot add feedback for themselves' });
      return;
    }

    const isAdmin = userRoles.includes('System Administrator');
    const isRegionalLead = userRoles.includes('Regional Lead') && interview.resource_region_id === user.regionId;
    const isMentor = userRoles.includes('Mentor') && interview.resource_mentor_id === user.userId;

    if (!isAdmin && !isRegionalLead && !isMentor) {
      res.status(403).json({ error: 'Access forbidden: Only Mentor (assigned mentee) or Regional Lead can submit interview feedback' });
      return;
    }

    const { technical_gaps, communication_gaps, recommendations, overall_rating } = req.body;
    const feedback = await InterviewService.addInterviewFeedback(id, user.userId, {
      technical_gaps,
      communication_gaps,
      recommendations,
      overall_rating: overall_rating !== undefined && overall_rating !== null ? parseFloat(overall_rating) : undefined,
    });

    res.status(201).json(feedback);
  } catch (error: any) {
    console.error('Error adding interview feedback:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
