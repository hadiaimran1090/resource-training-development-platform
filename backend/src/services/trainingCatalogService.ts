import { pool } from '../config/db.js';
import {
  TrainingTrack,
  TrainingProgram,
  TrainingModule,
  TrackFullTree,
  CreateTrackDTO,
  UpdateTrackDTO,
  CreateProgramDTO,
  UpdateProgramDTO,
  CreateModuleDTO,
  UpdateModuleDTO,
  ReorderModuleItem,
} from '../types/trainingCatalog.js';

export class TrainingCatalogService {
  // ==========================================
  // 1. TRAINING TRACKS
  // ==========================================

  static async getAllTracks(targetRoleProfileId?: number): Promise<TrainingTrack[]> {
    let query = `
      SELECT 
        tt.id,
        tt.name,
        tt.target_role_profile_id,
        rp.name as target_role_profile_name,
        tt.description,
        tt.duration_days,
        tt.created_at,
        tt.updated_at,
        COUNT(tp.id)::int as program_count
      FROM training_tracks tt
      LEFT JOIN role_profiles rp ON tt.target_role_profile_id = rp.id
      LEFT JOIN training_programs tp ON tt.id = tp.track_id
    `;

    const params: any[] = [];
    if (targetRoleProfileId) {
      query += ` WHERE tt.target_role_profile_id = $1`;
      params.push(targetRoleProfileId);
    }

    query += ` GROUP BY tt.id, rp.name ORDER BY tt.name ASC`;

    const res = await pool.query(query, params);
    return res.rows;
  }

  static async getTrackById(id: number): Promise<TrackFullTree | null> {
    const trackQuery = `
      SELECT 
        tt.id,
        tt.name,
        tt.target_role_profile_id,
        rp.name as target_role_profile_name,
        tt.description,
        tt.duration_days,
        tt.created_at,
        tt.updated_at
      FROM training_tracks tt
      LEFT JOIN role_profiles rp ON tt.target_role_profile_id = rp.id
      WHERE tt.id = $1
    `;
    const trackRes = await pool.query(trackQuery, [id]);
    if (trackRes.rows.length === 0) return null;

    const track = trackRes.rows[0];

    // Get all programs for this track
    const programsQuery = `
      SELECT id, track_id, name, skill_level, duration_days, prerequisites, created_at, updated_at
      FROM training_programs
      WHERE track_id = $1
      ORDER BY id ASC
    `;
    const programsRes = await pool.query(programsQuery, [id]);
    const programs = programsRes.rows;

    // Get modules for each program
    for (const program of programs) {
      const modulesQuery = `
        SELECT id, program_id, name, sequence_order, day_number, content_type, content_url, created_at, updated_at
        FROM training_modules
        WHERE program_id = $1
        ORDER BY sequence_order ASC
      `;
      const modulesRes = await pool.query(modulesQuery, [program.id]);
      program.modules = modulesRes.rows;
    }

    return {
      ...track,
      program_count: programs.length,
      programs,
    };
  }

  static async createTrack(dto: CreateTrackDTO): Promise<TrainingTrack> {
    const query = `
      INSERT INTO training_tracks (name, target_role_profile_id, description, duration_days)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const res = await pool.query(query, [
      dto.name,
      dto.target_role_profile_id || null,
      dto.description || null,
      dto.duration_days,
    ]);
    return res.rows[0];
  }

  static async updateTrack(id: number, dto: UpdateTrackDTO): Promise<TrainingTrack | null> {
    const existing = await pool.query(`SELECT * FROM training_tracks WHERE id = $1`, [id]);
    if (existing.rows.length === 0) return null;

    const current = existing.rows[0];
    const name = dto.name !== undefined ? dto.name : current.name;
    const targetRoleProfileId =
      dto.target_role_profile_id !== undefined
        ? dto.target_role_profile_id
        : current.target_role_profile_id;
    const description = dto.description !== undefined ? dto.description : current.description;
    const durationDays =
      dto.duration_days !== undefined ? dto.duration_days : current.duration_days;

    const query = `
      UPDATE training_tracks
      SET name = $1, target_role_profile_id = $2, description = $3, duration_days = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    const res = await pool.query(query, [name, targetRoleProfileId, description, durationDays, id]);
    return res.rows[0];
  }

  static async deleteTrack(id: number): Promise<void> {
    // Block delete if child programs exist
    const checkRes = await pool.query(
      `SELECT COUNT(*)::int as count FROM training_programs WHERE track_id = $1`,
      [id]
    );
    if (checkRes.rows[0].count > 0) {
      throw new Error(`Cannot delete track with existing programs (${checkRes.rows[0].count} program(s) remaining).`);
    }

    await pool.query(`DELETE FROM training_tracks WHERE id = $1`, [id]);
  }

  // ==========================================
  // 2. TRAINING PROGRAMS
  // ==========================================

  static async getProgramsByTrackId(trackId: number): Promise<TrainingProgram[]> {
    const query = `
      SELECT 
        tp.id,
        tp.track_id,
        tp.name,
        tp.skill_level,
        tp.duration_days,
        tp.prerequisites,
        tp.created_at,
        tp.updated_at,
        COUNT(tm.id)::int as module_count
      FROM training_programs tp
      LEFT JOIN training_modules tm ON tp.id = tm.program_id
      WHERE tp.track_id = $1
      GROUP BY tp.id
      ORDER BY tp.id ASC
    `;
    const res = await pool.query(query, [trackId]);
    return res.rows;
  }

  static async getProgramById(id: number): Promise<TrainingProgram | null> {
    const res = await pool.query(`SELECT * FROM training_programs WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  static async createProgram(trackId: number, dto: CreateProgramDTO): Promise<TrainingProgram> {
    // Verify parent track exists
    const trackRes = await pool.query(`SELECT id FROM training_tracks WHERE id = $1`, [trackId]);
    if (trackRes.rows.length === 0) {
      throw new Error('Target training track does not exist.');
    }

    const query = `
      INSERT INTO training_programs (track_id, name, skill_level, duration_days, prerequisites)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const res = await pool.query(query, [
      trackId,
      dto.name,
      dto.skill_level,
      dto.duration_days,
      dto.prerequisites || null,
    ]);
    return res.rows[0];
  }

  static async updateProgram(id: number, dto: UpdateProgramDTO): Promise<TrainingProgram | null> {
    const existing = await pool.query(`SELECT * FROM training_programs WHERE id = $1`, [id]);
    if (existing.rows.length === 0) return null;

    const current = existing.rows[0];
    const name = dto.name !== undefined ? dto.name : current.name;
    const skillLevel = dto.skill_level !== undefined ? dto.skill_level : current.skill_level;
    const durationDays = dto.duration_days !== undefined ? dto.duration_days : current.duration_days;
    const prerequisites = dto.prerequisites !== undefined ? dto.prerequisites : current.prerequisites;

    const query = `
      UPDATE training_programs
      SET name = $1, skill_level = $2, duration_days = $3, prerequisites = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    const res = await pool.query(query, [name, skillLevel, durationDays, prerequisites, id]);
    return res.rows[0];
  }

  static async deleteProgram(id: number): Promise<void> {
    // Block delete if child modules exist
    const checkRes = await pool.query(
      `SELECT COUNT(*)::int as count FROM training_modules WHERE program_id = $1`,
      [id]
    );
    if (checkRes.rows[0].count > 0) {
      throw new Error(`Cannot delete program with existing modules (${checkRes.rows[0].count} module(s) remaining).`);
    }

    await pool.query(`DELETE FROM training_programs WHERE id = $1`, [id]);
  }

  // ==========================================
  // 3. TRAINING MODULES
  // ==========================================

  static async getModulesByProgramId(programId: number): Promise<TrainingModule[]> {
    const query = `
      SELECT id, program_id, name, sequence_order, day_number, content_type, content_url, created_at, updated_at
      FROM training_modules
      WHERE program_id = $1
      ORDER BY sequence_order ASC
    `;
    const res = await pool.query(query, [programId]);
    return res.rows;
  }

  static async getModuleById(id: number): Promise<TrainingModule | null> {
    const res = await pool.query(`SELECT * FROM training_modules WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  static async createModule(programId: number, dto: CreateModuleDTO): Promise<TrainingModule> {
    // Fetch parent program for validation
    const programRes = await pool.query(
      `SELECT id, duration_days FROM training_programs WHERE id = $1`,
      [programId]
    );
    if (programRes.rows.length === 0) {
      throw new Error('Target training program does not exist.');
    }

    const program = programRes.rows[0];

    // Validate day_number <= parent program duration_days
    if (dto.day_number > program.duration_days) {
      throw new Error(
        `Module day_number (${dto.day_number}) cannot exceed program duration_days (${program.duration_days}).`
      );
    }

    if (dto.day_number < 1) {
      throw new Error('Module day_number must be at least 1.');
    }

    // Auto-calculate sequence_order if not provided
    let sequenceOrder = dto.sequence_order;
    if (!sequenceOrder || sequenceOrder <= 0) {
      const maxSeqRes = await pool.query(
        `SELECT COALESCE(MAX(sequence_order), 0) + 1 as next_seq FROM training_modules WHERE program_id = $1`,
        [programId]
      );
      sequenceOrder = maxSeqRes.rows[0].next_seq;
    }

    const query = `
      INSERT INTO training_modules (program_id, name, sequence_order, day_number, content_type, content_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const res = await pool.query(query, [
      programId,
      dto.name,
      sequenceOrder,
      dto.day_number,
      dto.content_type,
      dto.content_url || null,
    ]);

    return res.rows[0];
  }

  static async updateModule(id: number, dto: UpdateModuleDTO): Promise<TrainingModule | null> {
    const existing = await pool.query(`SELECT * FROM training_modules WHERE id = $1`, [id]);
    if (existing.rows.length === 0) return null;

    const current = existing.rows[0];

    // Fetch parent program for day_number validation
    const programRes = await pool.query(
      `SELECT id, duration_days FROM training_programs WHERE id = $1`,
      [current.program_id]
    );
    const program = programRes.rows[0];

    const dayNumber = dto.day_number !== undefined ? dto.day_number : current.day_number;

    if (program && dayNumber > program.duration_days) {
      throw new Error(
        `Module day_number (${dayNumber}) cannot exceed program duration_days (${program.duration_days}).`
      );
    }

    if (dayNumber < 1) {
      throw new Error('Module day_number must be at least 1.');
    }

    const name = dto.name !== undefined ? dto.name : current.name;
    const sequenceOrder = dto.sequence_order !== undefined ? dto.sequence_order : current.sequence_order;
    const contentType = dto.content_type !== undefined ? dto.content_type : current.content_type;
    const contentUrl = dto.content_url !== undefined ? dto.content_url : current.content_url;

    const query = `
      UPDATE training_modules
      SET name = $1, sequence_order = $2, day_number = $3, content_type = $4, content_url = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;
    const res = await pool.query(query, [name, sequenceOrder, dayNumber, contentType, contentUrl, id]);
    return res.rows[0];
  }

  static async deleteModule(id: number): Promise<void> {
    await pool.query(`DELETE FROM training_modules WHERE id = $1`, [id]);
  }

  static async reorderModules(programId: number, items: ReorderModuleItem[]): Promise<TrainingModule[]> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const item of items) {
        await client.query(
          `UPDATE training_modules SET sequence_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND program_id = $3`,
          [item.sequence_order, item.module_id, programId]
        );
      }

      await client.query('COMMIT');

      const res = await pool.query(
        `SELECT * FROM training_modules WHERE program_id = $1 ORDER BY sequence_order ASC`,
        [programId]
      );
      return res.rows;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
