import { Request, Response, NextFunction } from 'express';
import * as devPlanService from '../services/developmentPlanService.js';

export const getDevelopmentPlansHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await devPlanService.getDevelopmentPlans((req as any).user);
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

export const getResourceDevelopmentPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resourceId = parseInt(String(req.params.resourceId), 10);
    const plan = await devPlanService.getResourceDevelopmentPlan(resourceId);
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

export const createDevelopmentPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resource_id, target_role_profile_id, start_date, end_date, items } = req.body;
    if (!resource_id || !target_role_profile_id || !start_date || !end_date) {
      res.status(400).json({
        success: false,
        message: 'resource_id, target_role_profile_id, start_date, and end_date are required.',
      });
      return;
    }

    const creatorUserId = (req as any).user?.userId || (req as any).user?.id;
    if (!creatorUserId) {
      res.status(401).json({
        success: false,
        message: 'Invalid user session. User ID missing.',
      });
      return;
    }

    const plan = await devPlanService.createDevelopmentPlan(
      { resource_id, target_role_profile_id, start_date, end_date, items },
      creatorUserId
    );

    res.status(201).json({ success: true, message: 'Development plan created successfully.', data: plan });
  } catch (error) {
    next(error);
  }
};

export const addPlanItemsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planId = parseInt(String(req.params.id), 10);
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'items array is required.' });
      return;
    }

    await devPlanService.addPlanItems(planId, items);
    res.status(200).json({ success: true, message: 'Plan items added successfully.' });
  } catch (error) {
    next(error);
  }
};

export const updateDevelopmentPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planId = parseInt(String(req.params.id), 10);
    await devPlanService.updateDevelopmentPlan(planId, req.body);
    res.status(200).json({ success: true, message: 'Development plan updated successfully.' });
  } catch (error) {
    next(error);
  }
};

export const approveDevelopmentPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planId = parseInt(String(req.params.id), 10);
    const result = await devPlanService.approveDevelopmentPlan(planId, (req as any).user);
    res.status(200).json({ success: true, message: result.message });
  } catch (error: any) {
    if (error.statusCode === 403) {
      res.status(403).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

export const rejectDevelopmentPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planId = parseInt(String(req.params.id), 10);
    const result = await devPlanService.rejectDevelopmentPlan(planId, (req as any).user);
    res.status(200).json({ success: true, message: result.message });
  } catch (error: any) {
    if (error.statusCode === 403) {
      res.status(403).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

export const completeDevelopmentPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planId = parseInt(String(req.params.id), 10);
    const result = await devPlanService.completeDevelopmentPlan(planId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

export const deleteDevelopmentPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planId = parseInt(String(req.params.id), 10);
    const result = await devPlanService.deleteDevelopmentPlan(planId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};
