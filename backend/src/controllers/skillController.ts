import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { SkillService } from '../services/skillService.js';
import { ResourceService } from '../services/resourceService.js';
import { SkillCategory, SkillSource } from '../types/skills.js';

// Helper to verify resource access for Regional Leads and Resource users
async function verifyResourceAccess(
  req: AuthRequest,
  res: Response,
  resourceId: number,
  isWriteOp: boolean = false,
  targetSource?: string
): Promise<{ allowed: boolean; resource?: any }> {
  const user = req.user;
  if (!user) {
    res.status(401).json({ message: 'Unauthorized access.' });
    return { allowed: false };
  }

  const userRoles = user.roles || (user.role ? [user.role] : []);
  const isAdminOrTrainingManager = userRoles.some((r) =>
    ['System Administrator', 'Training Manager'].includes(r)
  );

  const resource = await ResourceService.getResourceById(resourceId);
  if (!resource) {
    res.status(404).json({ message: 'Resource profile not found.' });
    return { allowed: false };
  }

  // If System Admin or Training Manager, full access is granted
  if (isAdminOrTrainingManager) {
    return { allowed: true, resource };
  }

  // Check Regional Lead Scoping
  if (userRoles.includes('Regional Lead') && !userRoles.includes('System Administrator')) {
    if (resource.region_id !== user.regionId) {
      res.status(403).json({
        message: 'Forbidden: Regional Leads can only view/manage skills matrices for resources in their assigned region.',
      });
      return { allowed: false };
    }
  }

  // Check Resource Self Scoping
  const isSelfResource = resource.user_id === user.userId;
  if (userRoles.includes('Resource') && !userRoles.includes('System Administrator')) {
    if (!isSelfResource) {
      res.status(403).json({
        message: 'Forbidden: Resources can only access their own skill matrix.',
      });
      return { allowed: false };
    }

    if (isWriteOp) {
      if (targetSource && targetSource !== 'self') {
        res.status(403).json({
          message: "Forbidden: Resources can only create or edit skill matrix entries with source 'self'.",
        });
        return { allowed: false };
      }
    }
  }

  return { allowed: true, resource };
}

// ==========================================
// 1. SKILLS CATALOG CONTROLLER
// ==========================================

export const getSkills = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const category = req.query.category as string | undefined;
    const skills = await SkillService.getAllSkills(category);
    res.status(200).json(skills);
  } catch (error: any) {
    console.error('Error fetching skills catalog:', error);
    res.status(500).json({ message: 'Failed to fetch skills catalog.' });
  }
};

export const createSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, category } = req.body;
    if (!name || !category) {
      res.status(400).json({ message: 'Skill name and category are required.' });
      return;
    }

    if (!['technical', 'secondary', 'soft'].includes(category)) {
      res.status(400).json({ message: 'Category must be technical, secondary, or soft.' });
      return;
    }

    const skill = await SkillService.createSkill(name.trim(), category as SkillCategory);
    res.status(201).json(skill);
  } catch (error: any) {
    console.error('Error creating skill:', error);
    if (error.code === '23505') {
      res.status(400).json({ message: `Skill '${req.body.name}' already exists.` });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to create skill.' });
  }
};

export const updateSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, category } = req.body;

    if (!name || !category) {
      res.status(400).json({ message: 'Skill name and category are required.' });
      return;
    }

    if (!['technical', 'secondary', 'soft'].includes(category)) {
      res.status(400).json({ message: 'Category must be technical, secondary, or soft.' });
      return;
    }

    const updated = await SkillService.updateSkill(Number(id), name.trim(), category as SkillCategory);
    if (!updated) {
      res.status(404).json({ message: 'Skill not found.' });
      return;
    }

    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating skill:', error);
    if (error.code === '23505') {
      res.status(400).json({ message: `Skill name '${req.body.name}' already exists.` });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to update skill.' });
  }
};

export const deleteSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await SkillService.deleteSkill(Number(id));
    res.status(200).json({ message: 'Skill deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting skill:', error);
    res.status(400).json({ message: error.message || 'Failed to delete skill.' });
  }
};

// ==========================================
// 2. RESOURCE SKILLS MATRIX CONTROLLER
// ==========================================

export const getResourceSkills = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resourceId } = req.params;
    const access = await verifyResourceAccess(req, res, Number(resourceId), false);
    if (!access.allowed) return;

    const skills = await SkillService.getResourceSkills(Number(resourceId));
    res.status(200).json(skills);
  } catch (error: any) {
    console.error('Error fetching resource skills:', error);
    res.status(500).json({ message: 'Failed to fetch resource skills matrix.' });
  }
};

export const addResourceSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resourceId } = req.params;
    const { skill_id, current_level, target_level, source } = req.body;

    if (!skill_id || current_level === undefined || !source) {
      res.status(400).json({ message: 'skill_id, current_level, and source are required.' });
      return;
    }

    const validSources = ['self', 'assessment', 'coding', 'mentor', 'interview', 'training'];
    if (!validSources.includes(source)) {
      res.status(400).json({ message: `Invalid source. Must be one of: ${validSources.join(', ')}` });
      return;
    }

    const curr = Number(current_level);
    const targ = target_level !== undefined && target_level !== null ? Number(target_level) : null;
    if (curr < 0 || curr > 5 || (targ !== null && (targ < 0 || targ > 5))) {
      res.status(400).json({ message: 'Skill levels must be numeric values between 0.0 and 5.0.' });
      return;
    }

    const access = await verifyResourceAccess(req, res, Number(resourceId), true, source);
    if (!access.allowed) return;

    const entry = await SkillService.addResourceSkill(
      Number(resourceId),
      Number(skill_id),
      curr,
      targ,
      source as SkillSource
    );
    res.status(201).json(entry);
  } catch (error: any) {
    console.error('Error adding resource skill:', error);
    if (error.code === '23505') {
      res.status(400).json({ message: 'Skill entry already exists for this resource.' });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to add resource skill entry.' });
  }
};

export const updateResourceSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resourceId, skillId } = req.params;
    const { current_level, target_level, source } = req.body;

    const existingSkill = await SkillService.getResourceSkillBySkillId(Number(resourceId), Number(skillId));
    if (!existingSkill) {
      res.status(404).json({ message: 'Resource skill entry not found.' });
      return;
    }

    const newSource = source || existingSkill.source;

    // Check if the resource user is trying to modify a non-'self' row or update source to non-'self'
    const user = req.user;
    const userRoles = user?.roles || (user?.role ? [user.role] : []);
    const isResourceOnly = userRoles.includes('Resource') && !userRoles.some((r) => ['System Administrator', 'Training Manager', 'Regional Lead'].includes(r));

    if (isResourceOnly) {
      if (existingSkill.source !== 'self' || newSource !== 'self') {
        res.status(403).json({
          message: "Forbidden: Resources can only modify skill matrix entries with source 'self'.",
        });
        return;
      }
    }

    const access = await verifyResourceAccess(req, res, Number(resourceId), true, newSource);
    if (!access.allowed) return;

    const curr = current_level !== undefined ? Number(current_level) : undefined;
    const targ = target_level !== undefined ? (target_level === null ? null : Number(target_level)) : undefined;

    if ((curr !== undefined && (curr < 0 || curr > 5)) || (targ !== undefined && targ !== null && (targ < 0 || targ > 5))) {
      res.status(400).json({ message: 'Skill levels must be numeric values between 0.0 and 5.0.' });
      return;
    }

    const updated = await SkillService.updateResourceSkill(
      Number(resourceId),
      Number(skillId),
      curr,
      targ,
      newSource as SkillSource
    );
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating resource skill:', error);
    res.status(400).json({ message: error.message || 'Failed to update resource skill entry.' });
  }
};

export const deleteResourceSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resourceId, skillId } = req.params;
    const existingSkill = await SkillService.getResourceSkillBySkillId(Number(resourceId), Number(skillId));
    if (!existingSkill) {
      res.status(404).json({ message: 'Resource skill entry not found.' });
      return;
    }

    const user = req.user;
    const userRoles = user?.roles || (user?.role ? [user.role] : []);
    const isResourceOnly = userRoles.includes('Resource') && !userRoles.some((r) => ['System Administrator', 'Training Manager', 'Regional Lead'].includes(r));

    if (isResourceOnly && existingSkill.source !== 'self') {
      res.status(403).json({
        message: "Forbidden: Resources can only delete skill matrix entries with source 'self'.",
      });
      return;
    }

    const access = await verifyResourceAccess(req, res, Number(resourceId), true);
    if (!access.allowed) return;

    await SkillService.deleteResourceSkill(Number(resourceId), Number(skillId));
    res.status(200).json({ message: 'Resource skill entry deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting resource skill:', error);
    res.status(400).json({ message: error.message || 'Failed to delete resource skill entry.' });
  }
};

// ==========================================
// 3. ROLE PROFILES CONTROLLER
// ==========================================

export const getRoleProfiles = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profiles = await SkillService.getAllRoleProfiles();
    res.status(200).json(profiles);
  } catch (error: any) {
    console.error('Error fetching role profiles:', error);
    res.status(500).json({ message: 'Failed to fetch role profiles.' });
  }
};

export const getRoleProfileById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const profile = await SkillService.getRoleProfileById(Number(id));
    if (!profile) {
      res.status(404).json({ message: 'Role profile not found.' });
      return;
    }
    res.status(200).json(profile);
  } catch (error: any) {
    console.error('Error fetching role profile:', error);
    res.status(500).json({ message: 'Failed to fetch role profile.' });
  }
};

export const createRoleProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Role profile name is required.' });
      return;
    }

    const profile = await SkillService.createRoleProfile(name.trim(), description);
    res.status(201).json(profile);
  } catch (error: any) {
    console.error('Error creating role profile:', error);
    if (error.code === '23505') {
      res.status(400).json({ message: `Role profile '${req.body.name}' already exists.` });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to create role profile.' });
  }
};

export const updateRoleProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Role profile name is required.' });
      return;
    }

    const updated = await SkillService.updateRoleProfile(Number(id), name.trim(), description);
    if (!updated) {
      res.status(404).json({ message: 'Role profile not found.' });
      return;
    }
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('Error updating role profile:', error);
    if (error.code === '23505') {
      res.status(400).json({ message: `Role profile name '${req.body.name}' already exists.` });
      return;
    }
    res.status(400).json({ message: error.message || 'Failed to update role profile.' });
  }
};

export const deleteRoleProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await SkillService.deleteRoleProfile(Number(id));
    res.status(200).json({ message: 'Role profile deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting role profile:', error);
    res.status(400).json({ message: error.message || 'Failed to delete role profile.' });
  }
};

export const addOrUpdateRoleProfileSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { skill_id, required_level } = req.body;

    if (!skill_id || required_level === undefined) {
      res.status(400).json({ message: 'skill_id and required_level are required.' });
      return;
    }

    const reqLevel = Number(required_level);
    if (reqLevel < 0 || reqLevel > 5) {
      res.status(400).json({ message: 'required_level must be between 0.0 and 5.0.' });
      return;
    }

    const roleProfileSkill = await SkillService.addOrUpdateRoleProfileSkill(
      Number(id),
      Number(skill_id),
      reqLevel
    );
    res.status(200).json(roleProfileSkill);
  } catch (error: any) {
    console.error('Error adding/updating role profile skill:', error);
    res.status(400).json({ message: error.message || 'Failed to update role profile skill.' });
  }
};

export const deleteRoleProfileSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, skillId } = req.params;
    await SkillService.deleteRoleProfileSkill(Number(id), Number(skillId));
    res.status(200).json({ message: 'Required skill removed from role profile successfully.' });
  } catch (error: any) {
    console.error('Error deleting role profile skill:', error);
    res.status(400).json({ message: error.message || 'Failed to delete role profile skill.' });
  }
};

// ==========================================
// 4. GAP CALCULATION ENDPOINT CONTROLLER
// ==========================================

export const getSkillGap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resourceId } = req.params;
    const { roleProfileId } = req.query;

    const access = await verifyResourceAccess(req, res, Number(resourceId), false);
    if (!access.allowed) return;

    const gapItems = await SkillService.calculateSkillGap(
      Number(resourceId),
      roleProfileId ? Number(roleProfileId) : undefined
    );

    res.status(200).json(gapItems);
  } catch (error: any) {
    console.error('Error calculating skill gap:', error);
    res.status(400).json({ message: error.message || 'Failed to calculate skill gap.' });
  }
};
