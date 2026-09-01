import { Response } from 'express';
import { pool } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { ResourceService } from '../services/resourceService.js';
import { UserService } from '../services/userService.js';

export const getResources = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resources = await ResourceService.getAllResources();
    res.status(200).json(resources);
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Failed to fetch resources.' });
  }
};

export const getResourceById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const resource = await ResourceService.getResourceById(Number(id));
    if (!resource) {
      res.status(404).json({ message: 'Resource profile not found.' });
      return;
    }
    res.status(200).json(resource);
  } catch (error: any) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ message: 'Failed to fetch resource.' });
  }
};

export const getMyResourceProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }
    const resource = await ResourceService.getResourceByUserId(userId);
    if (!resource) {
      res.status(404).json({ message: 'Resource profile not found for logged-in user.' });
      return;
    }
    res.status(200).json(resource);
  } catch (error: any) {
    console.error('Error fetching my resource profile:', error);
    res.status(500).json({ message: 'Failed to fetch resource profile.' });
  }
};

export const updateMyResourceProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    const resource = await ResourceService.getResourceByUserId(userId);
    if (!resource) {
      res.status(404).json({ message: 'Resource profile not found.' });
      return;
    }

    const { current_status, assignment_id, end_date, phone_number, profile_image_url } = req.body;

    if (phone_number !== undefined) {
      await ResourceService.updateResourceProfile(resource.id, { phone_number });
    }

    if (profile_image_url !== undefined) {
      await pool.query(`UPDATE users SET profile_image_url = $1 WHERE id = $2`, [profile_image_url, userId]);
    }

    // Handle assignment end date update
    if (assignment_id && end_date) {
      const today = new Date().toISOString().split('T')[0];
      const isEnded = end_date <= today;

      await pool.query(
        `UPDATE assignments SET end_date = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND resource_id = $4`,
        [end_date, isEnded ? 'completed' : 'active', assignment_id, resource.id]
      );

      if (isEnded) {
        await ResourceService.updateResourceProfile(resource.id, { current_status: 'bench' });
      }
    }

    if (current_status && ['assigned', 'bench', 'training'].includes(current_status)) {
      await ResourceService.updateResourceProfile(resource.id, { current_status });
    }

    const updatedResource = await ResourceService.getResourceByUserId(userId);
    res.status(200).json(updatedResource);
  } catch (error: any) {
    console.error('Error updating my resource profile:', error);
    res.status(500).json({ message: 'Failed to update resource profile.' });
  }
};

export const createResource = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      employeeId,
      region_id,
      practice_id,
      regional_lead_id,
      designation,
      experience_years,
      current_status,
    } = req.body;

    if (!name || !email || !password || !employeeId || !designation) {
      res.status(400).json({ message: 'Name, Email, Password, Employee ID, and Designation are required.' });
      return;
    }

    // 1. Create User account with role 'Resource'
    const newUser = await UserService.createUser({
      name,
      email,
      password,
      employeeId,
      roleIds: [], // Will link Resource role
      regionId: region_id ? Number(region_id) : null,
      practiceId: practice_id ? Number(practice_id) : null,
      status: 'active',
    });

    // 2. Create Resource Profile
    const resource = await ResourceService.createOrUpdateResource({
      user_id: newUser.id,
      region_id: region_id ? Number(region_id) : null,
      practice_id: practice_id ? Number(practice_id) : null,
      regional_lead_id: regional_lead_id ? Number(regional_lead_id) : null,
      designation,
      experience_years: experience_years ? Number(experience_years) : 1.0,
      current_status: current_status || 'bench',
    });

    res.status(201).json(resource);
  } catch (error: any) {
    console.error('Error creating resource:', error);
    res.status(400).json({ message: error.message || 'Failed to create resource profile.' });
  }
};

export const updateResource = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      region_id,
      practice_id,
      regional_lead_id,
      designation,
      experience_years,
      current_status,
    } = req.body;

    const updated = await ResourceService.updateResourceProfile(Number(id), {
      region_id: region_id ? Number(region_id) : null,
      practice_id: practice_id ? Number(practice_id) : null,
      regional_lead_id: regional_lead_id ? Number(regional_lead_id) : null,
      designation,
      experience_years: experience_years !== undefined ? Number(experience_years) : undefined,
      current_status,
    });

    if (!updated) {
      res.status(404).json({ message: 'Resource profile not found.' });
      return;
    }
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating resource profile:', error);
    res.status(400).json({ message: 'Failed to update resource profile.' });
  }
};
