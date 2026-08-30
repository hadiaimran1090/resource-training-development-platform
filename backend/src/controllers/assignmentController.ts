import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { AssignmentService } from '../services/assignmentService.js';

export const getAssignments = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assignments = await AssignmentService.getAllAssignments();
    res.status(200).json(assignments);
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Failed to fetch assignments.' });
  }
};

export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resource_id, client_name, project_name, start_date, end_date, status } = req.body;
    if (!resource_id || !client_name || !start_date) {
      res.status(400).json({ message: 'Resource, Client Name, and Start Date are required.' });
      return;
    }
    const newAssignment = await AssignmentService.createAssignment({
      resource_id: Number(resource_id),
      client_name,
      project_name,
      start_date,
      end_date: end_date || null,
      status: status || 'active',
    });
    res.status(201).json(newAssignment);
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    res.status(400).json({ message: 'Failed to create assignment.' });
  }
};

export const updateAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { client_name, project_name, start_date, end_date, status } = req.body;
    const updated = await AssignmentService.updateAssignment(Number(id), {
      client_name,
      project_name,
      start_date,
      end_date,
      status,
    });
    if (!updated) {
      res.status(404).json({ message: 'Assignment not found.' });
      return;
    }
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    res.status(400).json({ message: 'Failed to update assignment.' });
  }
};

export const toggleAssignmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['active', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({ message: 'Status must be active, completed, or cancelled.' });
      return;
    }
    const updated = await AssignmentService.toggleAssignmentStatus(Number(id), status);
    if (!updated) {
      res.status(404).json({ message: 'Assignment not found.' });
      return;
    }
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({ message: 'Failed to update assignment status.' });
  }
};
