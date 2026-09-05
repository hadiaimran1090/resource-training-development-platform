import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  getTrainingTracks,
  getTrainingTrackById,
  createTrainingTrack,
  updateTrainingTrack,
  deleteTrainingTrack,
  getTrainingProgramsByTrack,
  createTrainingProgram,
  updateTrainingProgram,
  deleteTrainingProgram,
  getTrainingModulesByProgram,
  createTrainingModule,
  updateTrainingModule,
  deleteTrainingModule,
  reorderTrainingModules,
} from '../controllers/trainingCatalogController.js';

const router = Router();

// All catalog endpoints require user authentication
router.use(authenticateToken);

const writeAccess = requireRoles('System Administrator', 'Training Manager', 'Admin');

// ==========================================
// 1. TRAINING TRACKS ROUTES
// ==========================================
router.get('/training-tracks', getTrainingTracks);
router.get('/training-tracks/:id', getTrainingTrackById);
router.post('/training-tracks', writeAccess, createTrainingTrack);
router.put('/training-tracks/:id', writeAccess, updateTrainingTrack);
router.delete('/training-tracks/:id', writeAccess, deleteTrainingTrack);

// ==========================================
// 2. TRAINING PROGRAMS ROUTES
// ==========================================
router.get('/training-tracks/:trackId/programs', getTrainingProgramsByTrack);
router.post('/training-tracks/:trackId/programs', writeAccess, createTrainingProgram);
router.put('/training-programs/:id', writeAccess, updateTrainingProgram);
router.delete('/training-programs/:id', writeAccess, deleteTrainingProgram);

// ==========================================
// 3. TRAINING MODULES ROUTES
// ==========================================
router.get('/training-programs/:programId/modules', getTrainingModulesByProgram);
router.post('/training-programs/:programId/modules', writeAccess, createTrainingModule);
router.put('/training-modules/:id', writeAccess, updateTrainingModule);
router.delete('/training-modules/:id', writeAccess, deleteTrainingModule);
router.put('/training-programs/:programId/modules/reorder', writeAccess, reorderTrainingModules);

export default router;
