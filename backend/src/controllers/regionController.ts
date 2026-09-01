import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { RegionService } from '../services/regionService.js';

export const getRegions = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const regions = await RegionService.getAllRegions();
    res.status(200).json(regions);
  } catch (error: any) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ message: 'Failed to fetch regions.' });
  }
};

export const getRegionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const region = await RegionService.getRegionById(Number(id));
    if (!region) {
      res.status(404).json({ message: 'Region not found.' });
      return;
    }
    res.status(200).json(region);
  } catch (error: any) {
    console.error('Error fetching region:', error);
    res.status(500).json({ message: 'Failed to fetch region.' });
  }
};

export const createRegion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, status, practiceIds } = req.body;
    if (!name || !code) {
      res.status(400).json({ message: 'Region Name and Code are required.' });
      return;
    }
    const newRegion = await RegionService.createRegion({ name, code, status, practiceIds });
    res.status(201).json(newRegion);
  } catch (error: any) {
    console.error('Error creating region:', error);
    const msg = error.code === '23505' ? 'Region Name or Code already exists.' : 'Failed to create region.';
    res.status(400).json({ message: msg });
  }
};

export const updateRegion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, code, status, practiceIds } = req.body;
    if (!name || !code) {
      res.status(400).json({ message: 'Region Name and Code are required.' });
      return;
    }
    const updated = await RegionService.updateRegion(Number(id), { name, code, status, practiceIds });
    if (!updated) {
      res.status(404).json({ message: 'Region not found.' });
      return;
    }
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating region:', error);
    res.status(400).json({ message: 'Failed to update region.' });
  }
};

export const toggleRegionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['active', 'inactive'].includes(status)) {
      res.status(400).json({ message: 'Status must be active or inactive.' });
      return;
    }
    const updated = await RegionService.toggleRegionStatus(Number(id), status);
    if (!updated) {
      res.status(404).json({ message: 'Region not found.' });
      return;
    }
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error toggling region status:', error);
    res.status(500).json({ message: 'Failed to toggle region status.' });
  }
};
