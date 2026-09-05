import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const { Pool } = pg;

// Local & Neon Cloud PostgreSQL Connection Strings
const localDbUrl = process.env.DATABASE_URL;
const neonDbUrl = process.env.DATABASE_URL_NEON;

if (!localDbUrl || !neonDbUrl) {
  console.error('Error: DATABASE_URL or DATABASE_URL_NEON environment variables are not set.');
  process.exit(1);
}

const localPool = new Pool({ connectionString: localDbUrl });
const neonPool = new Pool({
  connectionString: neonDbUrl,
  ssl: { rejectUnauthorized: false },
});

localPool.on('error', (err) => console.error('[Local Pool Error]', err.message));
neonPool.on('error', (err) => console.error('[Neon Pool Error]', err.message));

export const migrateLocalToNeon = async () => {
  let localClient, neonClient;
  try {
    console.log('Connecting to Local PostgreSQL...');
    localClient = await localPool.connect();
    console.log('Connected to Local PostgreSQL successfully.');

    console.log('Connecting to Neon Cloud PostgreSQL...');
    neonClient = await neonPool.connect();
    console.log('Connected to Neon Cloud PostgreSQL successfully.');

    // 0. Ensure DDL Schema Tables & Migration Columns Exist on Neon Cloud DB
    console.log('Ensuring Neon Cloud schema tables exist...');
    await neonClient.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS regions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        code VARCHAR(10) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS practices (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        region_id INT REFERENCES regions(id) ON DELETE SET NULL,
        description TEXT,
        lead_user_id INT,
        status VARCHAR(20) DEFAULT 'active',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS region_practices (
        region_id INT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
        practice_id INT NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (region_id, practice_id)
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        employee_id VARCHAR(50) UNIQUE,
        must_reset_password BOOLEAN DEFAULT TRUE,
        region_id INT REFERENCES regions(id) ON DELETE SET NULL,
        practice_id INT REFERENCES practices(id) ON DELETE SET NULL,
        profile_image_url TEXT,
        status VARCHAR(20) DEFAULT 'active',
        joining_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN DEFAULT TRUE;

      CREATE TABLE IF NOT EXISTS user_roles (
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, role_id)
      );

      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        region_id INT REFERENCES regions(id) ON DELETE SET NULL,
        practice_id INT REFERENCES practices(id) ON DELETE SET NULL,
        regional_lead_id INT REFERENCES users(id) ON DELETE SET NULL,
        phone_number VARCHAR(30),
        designation VARCHAR(100),
        experience_years NUMERIC(3,1) DEFAULT 0.0,
        current_status VARCHAR(20) DEFAULT 'bench',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE resources ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30);

      CREATE TABLE IF NOT EXISTS bench_records (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        start_date DATE NOT NULL DEFAULT CURRENT_DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        resource_id INT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        assigned_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
        client_name VARCHAR(150) NOT NULL,
        project_name VARCHAR(150),
        start_date DATE DEFAULT CURRENT_DATE,
        end_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assigned_by_user_id INT REFERENCES users(id) ON DELETE SET NULL;

      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) UNIQUE NOT NULL,
        category VARCHAR(30) NOT NULL CHECK (category IN ('technical', 'secondary', 'soft')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS resource_skills (
        id SERIAL PRIMARY KEY,
        resource_id INT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        current_level NUMERIC(3,1) NOT NULL CHECK (current_level >= 0.0 AND current_level <= 5.0),
        target_level NUMERIC(3,1) CHECK (target_level IS NULL OR (target_level >= 0.0 AND target_level <= 5.0)),
        source VARCHAR(30) NOT NULL CHECK (source IN ('self', 'assessment', 'coding', 'mentor', 'interview', 'training')),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_resource_skill UNIQUE (resource_id, skill_id)
      );

      CREATE TABLE IF NOT EXISTS role_profiles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS role_profile_skills (
        role_profile_id INT NOT NULL REFERENCES role_profiles(id) ON DELETE CASCADE,
        skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        required_level NUMERIC(3,1) NOT NULL CHECK (required_level >= 0.0 AND required_level <= 5.0),
        PRIMARY KEY (role_profile_id, skill_id)
      );

      CREATE TABLE IF NOT EXISTS training_tracks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        target_role_profile_id INT REFERENCES role_profiles(id) ON DELETE SET NULL,
        description TEXT,
        duration_days INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS training_programs (
        id SERIAL PRIMARY KEY,
        track_id INT NOT NULL REFERENCES training_tracks(id) ON DELETE RESTRICT,
        name VARCHAR(150) NOT NULL,
        skill_level VARCHAR(20) NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
        duration_days INT NOT NULL,
        prerequisites TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS training_modules (
        id SERIAL PRIMARY KEY,
        program_id INT NOT NULL REFERENCES training_programs(id) ON DELETE RESTRICT,
        name VARCHAR(150) NOT NULL,
        sequence_order INT NOT NULL,
        day_number INT NOT NULL,
        content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'document', 'lab')),
        content_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_training_tracks_target_role ON training_tracks(target_role_profile_id);
      CREATE INDEX IF NOT EXISTS idx_training_programs_track_id ON training_programs(track_id);
      CREATE INDEX IF NOT EXISTS idx_training_modules_program_id ON training_modules(program_id);
    `);

    // Clean sync: Truncate Neon tables to mirror Local PostgreSQL cleanly
    console.log('Truncating existing Neon tables for clean mirror sync...');
    await neonClient.query(`
      TRUNCATE TABLE
        training_modules,
        training_programs,
        training_tracks,
        assignments,
        bench_records,
        resource_skills,
        resources,
        user_roles,
        users,
        region_practices,
        practices,
        regions,
        roles,
        role_profile_skills,
        role_profiles,
        skills
      CASCADE;
    `);

    // 1. Roles
    const rolesRes = await localClient.query(`SELECT * FROM roles ORDER BY id`);
    for (const r of rolesRes.rows) {
      await neonClient.query(
        `INSERT INTO roles (id, name, description, created_at)
         VALUES ($1, $2, $3, $4)`,
        [r.id, r.name, r.description, r.created_at]
      );
    }
    console.log(`Migrated ${rolesRes.rows.length} roles.`);
    await neonClient.query(`SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM roles))`);

    // 2. Regions
    const regionsRes = await localClient.query(`SELECT * FROM regions ORDER BY id`);
    for (const reg of regionsRes.rows) {
      await neonClient.query(
        `INSERT INTO regions (id, name, code, status, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [reg.id, reg.name, reg.code, reg.status, reg.is_active, reg.created_at, reg.updated_at]
      );
    }
    console.log(`Migrated ${regionsRes.rows.length} regions.`);
    await neonClient.query(`SELECT setval('regions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM regions))`);

    // 3. Users (Initial insert without practice_id/region_id FK locks)
    const usersRes = await localClient.query(`SELECT * FROM users ORDER BY id`);
    for (const u of usersRes.rows) {
      await neonClient.query(
        `INSERT INTO users (id, name, email, password_hash, employee_id, must_reset_password, region_id, practice_id, profile_image_url, status, joining_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL, $7, $8, $9, $10, $11)`,
        [
          u.id,
          u.name,
          u.email,
          u.password_hash,
          u.employee_id,
          u.must_reset_password ?? false,
          u.profile_image_url,
          u.status,
          u.joining_date,
          u.created_at,
          u.updated_at,
        ]
      );
    }
    console.log(`Migrated ${usersRes.rows.length} users (initial stage).`);
    await neonClient.query(`SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users))`);

    // 4. Practices (Now lead_user_id FK references existing users)
    const practicesRes = await localClient.query(`SELECT * FROM practices ORDER BY id`);
    for (const p of practicesRes.rows) {
      await neonClient.query(
        `INSERT INTO practices (id, name, description, region_id, lead_user_id, status, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [p.id, p.name, p.description, p.region_id, p.lead_user_id, p.status, p.is_active, p.created_at, p.updated_at]
      );
    }
    console.log(`Migrated ${practicesRes.rows.length} practices.`);
    await neonClient.query(`SELECT setval('practices_id_seq', (SELECT COALESCE(MAX(id), 1) FROM practices))`);

    // 4.5 Link region_id and practice_id back on Users
    for (const u of usersRes.rows) {
      await neonClient.query(
        `UPDATE users SET region_id = $1, practice_id = $2 WHERE id = $3`,
        [u.region_id, u.practice_id, u.id]
      );
    }
    console.log(`Updated region_id & practice_id FK references for ${usersRes.rows.length} users.`);

    // 5. Region-Practices Junction Table
    const regPracRes = await localClient.query(`SELECT * FROM region_practices`);
    for (const rp of regPracRes.rows) {
      await neonClient.query(
        `INSERT INTO region_practices (region_id, practice_id, created_at)
         VALUES ($1, $2, $3)`,
        [rp.region_id, rp.practice_id, rp.created_at || new Date()]
      );
    }
    console.log(`Migrated ${regPracRes.rows.length} region_practices junction links.`);

    // 6. User Roles
    const userRolesRes = await localClient.query(`SELECT * FROM user_roles`);
    for (const ur of userRolesRes.rows) {
      await neonClient.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
        [ur.user_id, ur.role_id]
      );
    }
    console.log(`Migrated ${userRolesRes.rows.length} user_roles.`);

    // 7. Resources
    const resRes = await localClient.query(`SELECT * FROM resources ORDER BY id`);
    for (const r of resRes.rows) {
      await neonClient.query(
        `INSERT INTO resources (id, user_id, region_id, practice_id, regional_lead_id, phone_number, designation, experience_years, current_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          r.id,
          r.user_id,
          r.region_id,
          r.practice_id,
          r.regional_lead_id,
          r.phone_number || null,
          r.designation,
          r.experience_years,
          r.current_status,
          r.created_at,
          r.updated_at,
        ]
      );
    }
    console.log(`Migrated ${resRes.rows.length} resources.`);
    await neonClient.query(`SELECT setval('resources_id_seq', (SELECT COALESCE(MAX(id), 1) FROM resources))`);

    // 8. Bench History Records
    const benchRes = await localClient.query(`SELECT * FROM bench_records ORDER BY id`);
    for (const b of benchRes.rows) {
      await neonClient.query(
        `INSERT INTO bench_records (id, user_id, start_date, end_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [b.id, b.user_id, b.start_date, b.end_date, b.created_at, b.updated_at]
      );
    }
    console.log(`Migrated ${benchRes.rows.length} bench_records.`);
    await neonClient.query(`SELECT setval('bench_records_id_seq', (SELECT COALESCE(MAX(id), 1) FROM bench_records))`);

    // 9. Assignments
    const asgRes = await localClient.query(`SELECT * FROM assignments ORDER BY id`);
    for (const a of asgRes.rows) {
      await neonClient.query(
        `INSERT INTO assignments (id, resource_id, assigned_by_user_id, client_name, project_name, start_date, end_date, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [a.id, a.resource_id, a.assigned_by_user_id || null, a.client_name, a.project_name, a.start_date, a.end_date, a.status, a.created_at, a.updated_at]
      );
    }
    console.log(`Migrated ${asgRes.rows.length} assignments.`);
    await neonClient.query(`SELECT setval('assignments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM assignments))`);

    // 10. Skills Catalog (Day 5)
    const skillsRes = await localClient.query(`SELECT * FROM skills ORDER BY id`);
    for (const s of skillsRes.rows) {
      await neonClient.query(
        `INSERT INTO skills (id, name, category, created_at)
         VALUES ($1, $2, $3, $4)`,
        [s.id, s.name, s.category, s.created_at]
      );
    }
    console.log(`Migrated ${skillsRes.rows.length} skills.`);
    await neonClient.query(`SELECT setval('skills_id_seq', (SELECT COALESCE(MAX(id), 1) FROM skills))`);

    // 11. Role Profiles (Day 5)
    const rpRes = await localClient.query(`SELECT * FROM role_profiles ORDER BY id`);
    for (const rp of rpRes.rows) {
      await neonClient.query(
        `INSERT INTO role_profiles (id, name, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [rp.id, rp.name, rp.description, rp.created_at, rp.updated_at]
      );
    }
    console.log(`Migrated ${rpRes.rows.length} role_profiles.`);
    await neonClient.query(`SELECT setval('role_profiles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM role_profiles))`);

    // 12. Role Profile Skills (Day 5)
    const rpsRes = await localClient.query(`SELECT * FROM role_profile_skills`);
    for (const rps of rpsRes.rows) {
      await neonClient.query(
        `INSERT INTO role_profile_skills (role_profile_id, skill_id, required_level)
         VALUES ($1, $2, $3)`,
        [rps.role_profile_id, rps.skill_id, rps.required_level]
      );
    }
    console.log(`Migrated ${rpsRes.rows.length} role_profile_skills.`);

    // 13. Resource Skills Matrix (Day 5)
    const rsRes = await localClient.query(`SELECT * FROM resource_skills ORDER BY id`);
    for (const rs of rsRes.rows) {
      await neonClient.query(
        `INSERT INTO resource_skills (id, resource_id, skill_id, current_level, target_level, source, last_updated)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [rs.id, rs.resource_id, rs.skill_id, rs.current_level, rs.target_level, rs.source, rs.last_updated]
      );
    }
    console.log(`Migrated ${rsRes.rows.length} resource_skills.`);
    await neonClient.query(`SELECT setval('resource_skills_id_seq', (SELECT COALESCE(MAX(id), 1) FROM resource_skills))`);

    // 14. Training Tracks (Day 6)
    const ttRes = await localClient.query(`SELECT * FROM training_tracks ORDER BY id`);
    for (const tt of ttRes.rows) {
      await neonClient.query(
        `INSERT INTO training_tracks (id, name, target_role_profile_id, description, duration_days, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tt.id, tt.name, tt.target_role_profile_id || null, tt.description, tt.duration_days, tt.created_at, tt.updated_at]
      );
    }
    console.log(`Migrated ${ttRes.rows.length} training_tracks.`);
    await neonClient.query(`SELECT setval('training_tracks_id_seq', (SELECT COALESCE(MAX(id), 1) FROM training_tracks))`);

    // 15. Training Programs (Day 6)
    const tpRes = await localClient.query(`SELECT * FROM training_programs ORDER BY id`);
    for (const tp of tpRes.rows) {
      await neonClient.query(
        `INSERT INTO training_programs (id, track_id, name, skill_level, duration_days, prerequisites, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [tp.id, tp.track_id, tp.name, tp.skill_level, tp.duration_days, tp.prerequisites, tp.created_at, tp.updated_at]
      );
    }
    console.log(`Migrated ${tpRes.rows.length} training_programs.`);
    await neonClient.query(`SELECT setval('training_programs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM training_programs))`);

    // 16. Training Modules (Day 6)
    const tmRes = await localClient.query(`SELECT * FROM training_modules ORDER BY id`);
    for (const tm of tmRes.rows) {
      await neonClient.query(
        `INSERT INTO training_modules (id, program_id, name, sequence_order, day_number, content_type, content_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [tm.id, tm.program_id, tm.name, tm.sequence_order, tm.day_number, tm.content_type, tm.content_url, tm.created_at, tm.updated_at]
      );
    }
    console.log(`Migrated ${tmRes.rows.length} training_modules.`);
    await neonClient.query(`SELECT setval('training_modules_id_seq', (SELECT COALESCE(MAX(id), 1) FROM training_modules))`);

    console.log('\n======================================================');
    console.log(' SUCCESS: All local database data & Day 6 Training Catalog fully migrated to Neon Cloud PostgreSQL!');
    console.log('======================================================\n');
  } catch (error: any) {
    console.error('Migration error:', error?.message || error);
  } finally {
    if (localClient) localClient.release();
    if (neonClient) neonClient.release();
    await localPool.end();
    await neonPool.end();
  }
};

migrateLocalToNeon();
