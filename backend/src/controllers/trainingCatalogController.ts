import { Request, Response } from 'express';
import { TrainingCatalogService } from '../services/trainingCatalogService.js';

// Helper to safely extract route param as string
const getParam = (paramVal: any): string => {
  if (Array.isArray(paramVal)) return paramVal[0];
  return String(paramVal || '');
};

// ==========================================
// 1. TRAINING TRACKS CONTROLLERS
// ==========================================

export const getTrainingTracks = async (req: Request, res: Response): Promise<void> => {
  try {
    const targetRoleProfileId = req.query.target_role_profile_id
      ? parseInt(getParam(req.query.target_role_profile_id), 10)
      : undefined;

    const tracks = await TrainingCatalogService.getAllTracks(targetRoleProfileId);
    res.status(200).json({
      success: true,
      data: tracks,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to retrieve training tracks.',
    });
  }
};

export const getTrainingTrackById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(getParam(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid track ID.' });
      return;
    }

    const trackTree = await TrainingCatalogService.getTrackById(id);
    if (!trackTree) {
      res.status(404).json({ success: false, message: 'Training track not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: trackTree,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to retrieve training track details.',
    });
  }
};

export const createTrainingTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, target_role_profile_id, description, duration_days } = req.body;

    if (!name || duration_days === undefined || duration_days === null) {
      res.status(400).json({
        success: false,
        message: 'Name and duration_days are required fields.',
      });
      return;
    }

    const track = await TrainingCatalogService.createTrack({
      name,
      target_role_profile_id: target_role_profile_id ? parseInt(String(target_role_profile_id), 10) : null,
      description,
      duration_days: parseInt(String(duration_days), 10),
    });

    res.status(201).json({
      success: true,
      message: 'Training track created successfully.',
      data: track,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to create training track.',
    });
  }
};

export const updateTrainingTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(getParam(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid track ID.' });
      return;
    }

    const { name, target_role_profile_id, description, duration_days } = req.body;

    const track = await TrainingCatalogService.updateTrack(id, {
      name,
      target_role_profile_id: target_role_profile_id !== undefined ? (target_role_profile_id ? parseInt(String(target_role_profile_id), 10) : null) : undefined,
      description,
      duration_days: duration_days !== undefined ? parseInt(String(duration_days), 10) : undefined,
    });

    if (!track) {
      res.status(404).json({ success: false, message: 'Training track not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Training track updated successfully.',
      data: track,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to update training track.',
    });
  }
};

export const deleteTrainingTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(getParam(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid track ID.' });
      return;
    }

    await TrainingCatalogService.deleteTrack(id);

    res.status(200).json({
      success: true,
      message: 'Training track deleted successfully.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to delete training track.',
    });
  }
};

// ==========================================
// 2. TRAINING PROGRAMS CONTROLLERS
// ==========================================

export const getTrainingProgramsByTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const trackId = parseInt(getParam(req.params.trackId), 10);
    if (isNaN(trackId)) {
      res.status(400).json({ success: false, message: 'Invalid track ID.' });
      return;
    }

    const programs = await TrainingCatalogService.getProgramsByTrackId(trackId);
    res.status(200).json({
      success: true,
      data: programs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to retrieve training programs.',
    });
  }
};

export const createTrainingProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const trackId = parseInt(getParam(req.params.trackId), 10);
    if (isNaN(trackId)) {
      res.status(400).json({ success: false, message: 'Invalid track ID.' });
      return;
    }

    const { name, skill_level, duration_days, prerequisites } = req.body;

    if (!name || !skill_level || duration_days === undefined) {
      res.status(400).json({
        success: false,
        message: 'Name, skill_level, and duration_days are required.',
      });
      return;
    }

    const program = await TrainingCatalogService.createProgram(trackId, {
      name,
      skill_level,
      duration_days: parseInt(String(duration_days), 10),
      prerequisites,
    });

    res.status(201).json({
      success: true,
      message: 'Training program created successfully.',
      data: program,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to create training program.',
    });
  }
};

export const updateTrainingProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(getParam(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid program ID.' });
      return;
    }

    const { name, skill_level, duration_days, prerequisites } = req.body;

    const program = await TrainingCatalogService.updateProgram(id, {
      name,
      skill_level,
      duration_days: duration_days !== undefined ? parseInt(String(duration_days), 10) : undefined,
      prerequisites,
    });

    if (!program) {
      res.status(404).json({ success: false, message: 'Training program not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Training program updated successfully.',
      data: program,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to update training program.',
    });
  }
};

export const deleteTrainingProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(getParam(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid program ID.' });
      return;
    }

    await TrainingCatalogService.deleteProgram(id);

    res.status(200).json({
      success: true,
      message: 'Training program deleted successfully.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to delete training program.',
    });
  }
};

// ==========================================
// 3. TRAINING MODULES CONTROLLERS
// ==========================================

export const getTrainingModulesByProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const programId = parseInt(getParam(req.params.programId), 10);
    if (isNaN(programId)) {
      res.status(400).json({ success: false, message: 'Invalid program ID.' });
      return;
    }

    const modules = await TrainingCatalogService.getModulesByProgramId(programId);
    res.status(200).json({
      success: true,
      data: modules,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to retrieve training modules.',
    });
  }
};

export const createTrainingModule = async (req: Request, res: Response): Promise<void> => {
  try {
    const programId = parseInt(getParam(req.params.programId), 10);
    if (isNaN(programId)) {
      res.status(400).json({ success: false, message: 'Invalid program ID.' });
      return;
    }

    const { name, sequence_order, day_number, content_type, content_url } = req.body;

    if (!name || day_number === undefined || !content_type) {
      res.status(400).json({
        success: false,
        message: 'Name, day_number, and content_type are required.',
      });
      return;
    }

    const moduleItem = await TrainingCatalogService.createModule(programId, {
      name,
      sequence_order: sequence_order !== undefined ? parseInt(String(sequence_order), 10) : undefined,
      day_number: parseInt(String(day_number), 10),
      content_type,
      content_url,
    });

    res.status(201).json({
      success: true,
      message: 'Training module created successfully.',
      data: moduleItem,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to create training module.',
    });
  }
};

export const updateTrainingModule = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(getParam(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid module ID.' });
      return;
    }

    const { name, sequence_order, day_number, content_type, content_url } = req.body;

    const moduleItem = await TrainingCatalogService.updateModule(id, {
      name,
      sequence_order: sequence_order !== undefined ? parseInt(String(sequence_order), 10) : undefined,
      day_number: day_number !== undefined ? parseInt(String(day_number), 10) : undefined,
      content_type,
      content_url,
    });

    if (!moduleItem) {
      res.status(404).json({ success: false, message: 'Training module not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Training module updated successfully.',
      data: moduleItem,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to update training module.',
    });
  }
};

export const deleteTrainingModule = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(getParam(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid module ID.' });
      return;
    }

    await TrainingCatalogService.deleteModule(id);

    res.status(200).json({
      success: true,
      message: 'Training module deleted successfully.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to delete training module.',
    });
  }
};

export const reorderTrainingModules = async (req: Request, res: Response): Promise<void> => {
  try {
    const programId = parseInt(getParam(req.params.programId), 10);
    if (isNaN(programId)) {
      res.status(400).json({ success: false, message: 'Invalid program ID.' });
      return;
    }

    const { items } = req.body;
    if (!Array.isArray(items)) {
      res.status(400).json({ success: false, message: 'Items must be an array of { module_id, sequence_order }.' });
      return;
    }

    const updatedModules = await TrainingCatalogService.reorderModules(programId, items);

    res.status(200).json({
      success: true,
      message: 'Modules reordered successfully.',
      data: updatedModules,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to reorder training modules.',
    });
  }
};
