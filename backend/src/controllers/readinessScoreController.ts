import { Request, Response, NextFunction } from 'express';
import * as readinessService from '../services/readinessScoreService.js';

export const recalculateReadinessScoreHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resourceId = parseInt(String(req.params.resourceId), 10);
    const score = await readinessService.recalculateReadinessScore(resourceId);
    res.status(200).json({
      success: true,
      message: 'Readiness score recalculated successfully.',
      data: score,
    });
  } catch (error) {
    next(error);
  }
};

export const getReadinessHistoryHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resourceId = parseInt(String(req.params.resourceId), 10);
    let history = await readinessService.getReadinessHistory(resourceId);
    let latest = history[0] || null;

    // Auto-trigger recalculation if no score exists yet
    if (!latest) {
      try {
        latest = await readinessService.recalculateReadinessScore(resourceId);
        history = [latest];
      } catch (e) {
        console.error('Auto-recalculate readiness on first fetch failed:', e);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        latest,
        history,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getReadinessWeightsHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const weights = await readinessService.getReadinessWeights();
    res.status(200).json({ success: true, data: weights });
  } catch (error) {
    next(error);
  }
};

export const updateReadinessWeightsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { weights } = req.body;
    if (!Array.isArray(weights)) {
      res.status(400).json({ success: false, message: 'weights array is required.' });
      return;
    }
    const updated = await readinessService.updateReadinessWeights(weights);
    res.status(200).json({
      success: true,
      message: 'Readiness score weights updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    if (error.statusCode === 400) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};
