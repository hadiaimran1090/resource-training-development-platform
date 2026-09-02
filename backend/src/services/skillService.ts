import { pool } from '../config/db.js';
import {
  Skill,
  ResourceSkill,
  RoleProfile,
  RoleProfileSkill,
  SkillCategory,
  SkillSource,
  SkillGapItem,
} from '../types/skills.js';

export class SkillService {
  // ==========================================
  // 1. SKILLS CATALOG
  // ==========================================

  static async getAllSkills(category?: string): Promise<Skill[]> {
    if (category) {
      const res = await pool.query(
        `SELECT * FROM skills WHERE category = $1 ORDER BY category ASC, name ASC`,
        [category]
      );
      return res.rows;
    }
    const res = await pool.query(`SELECT * FROM skills ORDER BY category ASC, name ASC`);
    return res.rows;
  }

  static async getSkillById(id: number): Promise<Skill | null> {
    const res = await pool.query(`SELECT * FROM skills WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  static async createSkill(name: string, category: SkillCategory): Promise<Skill> {
    const res = await pool.query(
      `INSERT INTO skills (name, category) VALUES ($1, $2) RETURNING *`,
      [name, category]
    );
    return res.rows[0];
  }

  static async updateSkill(id: number, name: string, category: SkillCategory): Promise<Skill | null> {
    const res = await pool.query(
      `UPDATE skills SET name = $1, category = $2 WHERE id = $3 RETURNING *`,
      [name, category, id]
    );
    return res.rows[0] || null;
  }

  static async deleteSkill(id: number): Promise<void> {
    // Check if skill is in use by resource_skills
    const resCheck = await pool.query(
      `SELECT COUNT(*)::int as count FROM resource_skills WHERE skill_id = $1`,
      [id]
    );
    if (resCheck.rows[0].count > 0) {
      throw new Error(`Cannot delete skill: It is currently assigned to ${resCheck.rows[0].count} resource skill matrix entry/entries.`);
    }

    // Check if skill is in use by role_profile_skills
    const roleCheck = await pool.query(
      `SELECT COUNT(*)::int as count FROM role_profile_skills WHERE skill_id = $1`,
      [id]
    );
    if (roleCheck.rows[0].count > 0) {
      throw new Error(`Cannot delete skill: It is required by ${roleCheck.rows[0].count} role profile(s).`);
    }

    await pool.query(`DELETE FROM skills WHERE id = $1`, [id]);
  }

  // ==========================================
  // 2. RESOURCE SKILLS MATRIX
  // ==========================================

  static async getResourceSkills(resourceId: number): Promise<ResourceSkill[]> {
    const query = `
      SELECT 
        rs.id,
        rs.resource_id,
        rs.skill_id,
        rs.current_level::float as current_level,
        rs.target_level::float as target_level,
        rs.source,
        rs.last_updated,
        s.name as skill_name,
        s.category
      FROM resource_skills rs
      JOIN skills s ON rs.skill_id = s.id
      WHERE rs.resource_id = $1
      ORDER BY s.category ASC, s.name ASC
    `;
    const res = await pool.query(query, [resourceId]);
    return res.rows;
  }

  static async getResourceSkillBySkillId(resourceId: number, skillId: number): Promise<ResourceSkill | null> {
    const query = `
      SELECT 
        rs.id,
        rs.resource_id,
        rs.skill_id,
        rs.current_level::float as current_level,
        rs.target_level::float as target_level,
        rs.source,
        rs.last_updated,
        s.name as skill_name,
        s.category
      FROM resource_skills rs
      JOIN skills s ON rs.skill_id = s.id
      WHERE rs.resource_id = $1 AND rs.skill_id = $2
    `;
    const res = await pool.query(query, [resourceId, skillId]);
    return res.rows[0] || null;
  }

  static async addResourceSkill(
    resourceId: number,
    skillId: number,
    currentLevel: number,
    targetLevel: number | null,
    source: SkillSource
  ): Promise<ResourceSkill> {
    await pool.query(
      `INSERT INTO resource_skills (resource_id, skill_id, current_level, target_level, source, last_updated)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (resource_id, skill_id)
       DO UPDATE SET current_level = EXCLUDED.current_level, target_level = EXCLUDED.target_level, source = EXCLUDED.source, last_updated = CURRENT_TIMESTAMP`,
      [resourceId, skillId, currentLevel, targetLevel, source]
    );

    const fullSkill = await this.getResourceSkillBySkillId(resourceId, skillId);
    if (!fullSkill) {
      throw new Error('Failed to retrieve saved resource skill entry.');
    }
    return fullSkill;
  }

  static async updateResourceSkill(
    resourceId: number,
    skillId: number,
    currentLevel?: number,
    targetLevel?: number | null,
    source?: SkillSource
  ): Promise<ResourceSkill | null> {
    const existing = await this.getResourceSkillBySkillId(resourceId, skillId);
    if (!existing) return null;

    const newCurrentLevel = currentLevel !== undefined ? currentLevel : existing.current_level;
    const newTargetLevel = targetLevel !== undefined ? targetLevel : existing.target_level;
    const newSource = source !== undefined ? source : existing.source;

    await pool.query(
      `UPDATE resource_skills
       SET current_level = $1, target_level = $2, source = $3, last_updated = CURRENT_TIMESTAMP
       WHERE resource_id = $4 AND skill_id = $5`,
      [newCurrentLevel, newTargetLevel, newSource, resourceId, skillId]
    );

    return this.getResourceSkillBySkillId(resourceId, skillId);
  }

  static async deleteResourceSkill(resourceId: number, skillId: number): Promise<boolean> {
    const res = await pool.query(
      `DELETE FROM resource_skills WHERE resource_id = $1 AND skill_id = $2`,
      [resourceId, skillId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  // ==========================================
  // 3. ROLE PROFILES
  // ==========================================

  static async getAllRoleProfiles(): Promise<(RoleProfile & { skill_count: number })[]> {
    const query = `
      SELECT 
        rp.id,
        rp.name,
        rp.description,
        rp.created_at,
        rp.updated_at,
        COUNT(rps.skill_id)::int as skill_count
      FROM role_profiles rp
      LEFT JOIN role_profile_skills rps ON rp.id = rps.role_profile_id
      GROUP BY rp.id
      ORDER BY rp.name ASC
    `;
    const res = await pool.query(query);
    return res.rows;
  }

  static async getRoleProfileById(id: number): Promise<RoleProfile | null> {
    const roleRes = await pool.query(`SELECT * FROM role_profiles WHERE id = $1`, [id]);
    if (roleRes.rows.length === 0) return null;

    const role = roleRes.rows[0];

    const skillsRes = await pool.query(
      `SELECT 
         rps.role_profile_id,
         rps.skill_id,
         rps.required_level::float as required_level,
         s.name as skill_name,
         s.category
       FROM role_profile_skills rps
       JOIN skills s ON rps.skill_id = s.id
       WHERE rps.role_profile_id = $1
       ORDER BY s.category ASC, s.name ASC`,
      [id]
    );

    role.skills = skillsRes.rows;
    return role;
  }

  static async createRoleProfile(name: string, description?: string | null): Promise<RoleProfile> {
    const res = await pool.query(
      `INSERT INTO role_profiles (name, description, created_at, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [name, description || null]
    );
    return res.rows[0];
  }

  static async updateRoleProfile(
    id: number,
    name: string,
    description?: string | null
  ): Promise<RoleProfile | null> {
    const res = await pool.query(
      `UPDATE role_profiles
       SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [name, description || null, id]
    );
    return res.rows[0] || null;
  }

  static async deleteRoleProfile(id: number): Promise<void> {
    // Dynamically check if role profile is referenced by downstream tables if they exist
    const tablesToCheck = ['training_tracks', 'coding_challenges', 'interviews', 'development_plans'];
    for (const table of tablesToCheck) {
      try {
        const tableCheck = await pool.query(
          `SELECT EXISTS (
             SELECT FROM information_schema.tables 
             WHERE table_name = $1
           )`,
          [table]
        );
        if (tableCheck.rows[0].exists) {
          const refCheck = await pool.query(
            `SELECT COUNT(*)::int as count FROM ${table} WHERE target_role_profile_id = $1 OR role_profile_id = $1`,
            [id]
          );
          if (refCheck.rows[0]?.count > 0) {
            throw new Error(`Cannot delete role profile: It is currently referenced in ${table}.`);
          }
        }
      } catch (err: any) {
        if (err.message?.includes('Cannot delete role profile')) throw err;
        // If column doesn't exist yet, safe to ignore check
      }
    }

    await pool.query(`DELETE FROM role_profiles WHERE id = $1`, [id]);
  }

  static async addOrUpdateRoleProfileSkill(
    roleProfileId: number,
    skillId: number,
    requiredLevel: number
  ): Promise<RoleProfileSkill> {
    await pool.query(
      `INSERT INTO role_profile_skills (role_profile_id, skill_id, required_level)
       VALUES ($1, $2, $3)
       ON CONFLICT (role_profile_id, skill_id)
       DO UPDATE SET required_level = EXCLUDED.required_level`,
      [roleProfileId, skillId, requiredLevel]
    );

    const res = await pool.query(
      `SELECT 
         rps.role_profile_id,
         rps.skill_id,
         rps.required_level::float as required_level,
         s.name as skill_name,
         s.category
       FROM role_profile_skills rps
       JOIN skills s ON rps.skill_id = s.id
       WHERE rps.role_profile_id = $1 AND rps.skill_id = $2`,
      [roleProfileId, skillId]
    );
    return res.rows[0];
  }

  static async deleteRoleProfileSkill(roleProfileId: number, skillId: number): Promise<boolean> {
    const res = await pool.query(
      `DELETE FROM role_profile_skills WHERE role_profile_id = $1 AND skill_id = $2`,
      [roleProfileId, skillId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  // ==========================================
  // 4. GAP CALCULATION ENDPOINT
  // ==========================================

  static async calculateSkillGap(
    resourceId: number,
    roleProfileId?: number
  ): Promise<SkillGapItem[]> {
    const resourceSkills = await this.getResourceSkills(resourceId);

    if (!roleProfileId) {
      // Standard Gap calculation against resource's own target_level
      return resourceSkills.map((rs) => {
        const target = rs.target_level ?? 0;
        const current = rs.current_level ?? 0;
        const gap = Number((target - current).toFixed(1));
        return {
          skill_id: rs.skill_id,
          skill_name: rs.skill_name || '',
          category: rs.category || 'technical',
          current_level: current,
          target_level: rs.target_level,
          gap,
          source: rs.source,
          has_entry: true,
        };
      });
    }

    // Role profile comparison variant
    const roleProfile = await this.getRoleProfileById(roleProfileId);
    if (!roleProfile) {
      throw new Error(`Role profile with id ${roleProfileId} not found.`);
    }

    const resourceSkillsMap = new Map<number, ResourceSkill>();
    resourceSkills.forEach((rs) => resourceSkillsMap.set(rs.skill_id, rs));

    const gapItems: SkillGapItem[] = [];
    const processedSkillIds = new Set<number>();

    // Process all skills required by the role profile
    (roleProfile.skills || []).forEach((rps) => {
      processedSkillIds.add(rps.skill_id);
      const resSkill = resourceSkillsMap.get(rps.skill_id);
      if (resSkill) {
        const current = resSkill.current_level ?? 0;
        const req = rps.required_level ?? 0;
        const gap = Number((req - current).toFixed(1));
        gapItems.push({
          skill_id: rps.skill_id,
          skill_name: rps.skill_name || '',
          category: rps.category || 'technical',
          current_level: current,
          required_level: req,
          gap,
          source: resSkill.source,
          has_entry: true,
        });
      } else {
        // Resource has no entry for this required skill -> default current_level to 0.0
        const current = 0.0;
        const req = rps.required_level ?? 0;
        const gap = Number((req - current).toFixed(1));
        gapItems.push({
          skill_id: rps.skill_id,
          skill_name: rps.skill_name || '',
          category: rps.category || 'technical',
          current_level: current,
          required_level: req,
          gap,
          source: null,
          has_entry: false,
        });
      }
    });

    return gapItems;
  }
}
