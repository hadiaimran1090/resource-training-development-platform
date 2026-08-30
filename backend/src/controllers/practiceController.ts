import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { PracticeService } from '../services/practiceService.js';

export const getPractices = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const practices = await PracticeService.getAllPractices();
    res.status(200).json(practices);
  } catch (error: any) {
    console.error('Error fetching practices:', error);
    res.status(500).json({ message: 'Failed to fetch practices.' });
  }
};

export const getPracticeById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const practice = await PracticeService.getPracticeById(Number(id));
    if (!practice) {
      res.status(404).json({ message: 'Practice not found.' });
      return;
    }
    res.status(200).json(practice);
  } catch (error: any) {
    console.error('Error fetching practice:', error);
    res.status(500).json({ message: 'Failed to fetch practice.' });
  }
};

export const createPractice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, lead_user_id, status } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Practice Name is required.' });
      return;
    }
    const newPractice = await PracticeService.createPractice({
      name,
      description,
      lead_user_id: lead_user_id ? Number(lead_user_id) : null,
      status,
    });
    res.status(201).json(newPractice);
  } catch (error: any) {
    console.error('Error creating practice:', error);
    const msg = error.code === '23505' ? 'Practice Name already exists.' : 'Failed to create practice.';
    res.status(400).json({ message: msg });
  }
};

export const updatePractice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, lead_user_id, status } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Practice Name is required.' });
      return;
    }
    const updated = await PracticeService.updatePractice(Number(id), {
      name,
      description,
      lead_user_id: lead_user_id ? Number(lead_user_id) : null,
      status,
    });
    if (!updated) {
      res.status(404).json({ message: 'Practice not found.' });
      return;
    }
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating practice:', error);
    res.status(400).json({ message: 'Failed to update practice.' });
  }
};

export const togglePracticeStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['active', 'inactive'].includes(status)) {
      res.status(400).json({ message: 'Status must be active or inactive.' });
      return;
    }
    const updated = await PracticeService.togglePracticeStatus(Number(id), status);
    if (!updated) {
      res.status(404).json({ message: 'Practice not found.' });
      return;
    }
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error toggling practice status:', error);
    res.status(500).json({ message: 'Failed to toggle practice status.' });
  }
};
