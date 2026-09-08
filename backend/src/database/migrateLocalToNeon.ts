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
  let neonTransactionStarted = false;
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
      ALTER TABLE resources ADD COLUMN IF NOT EXISTS mentor_id INT REFERENCES users(id) ON DELETE SET NULL;

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

      CREATE TABLE IF NOT EXISTS training_assignments (
        id SERIAL PRIMARY KEY,
        resource_id INT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        track_id INT NOT NULL REFERENCES training_tracks(id) ON DELETE RESTRICT,
        assigned_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        start_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
        approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
        approved_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS daily_activities (
        id SERIAL PRIMARY KEY,
        training_assignment_id INT NOT NULL REFERENCES training_assignments(id) ON DELETE CASCADE,
        day_number INT NOT NULL,
        activity_type VARCHAR(30) NOT NULL CHECK (activity_type IN ('training', 'assessment', 'coding', 'reading', 'poc', 'mock_interview', 'mentor_session', 'documentation')),
        description VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
        completed_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_revoked BOOLEAN DEFAULT FALSE,
        replaced_by_token VARCHAR(255),
        user_agent VARCHAR(500),
        ip_address VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id INT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS skill_requests (
        id SERIAL PRIMARY KEY,
        requested_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        skill_name VARCHAR(150) NOT NULL,
        category VARCHAR(30) NOT NULL CHECK (category IN ('technical', 'secondary', 'soft')),
        justification TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        reviewed_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        message VARCHAR(300) NOT NULL,
        related_entity_type VARCHAR(50),
        related_entity_id INT,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(30) NOT NULL CHECK (type IN ('knowledge', 'technical', 'interview', 'certification_prep')),
        related_module_id INT REFERENCES training_modules(id) ON DELETE SET NULL,
        total_questions INT NOT NULL DEFAULT 0,
        passing_score NUMERIC(5,2) NOT NULL DEFAULT 70.00,
        created_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assessment_questions (
        id SERIAL PRIMARY KEY,
        assessment_id INT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('mcq', 'true_false', 'short_answer')),
        options JSONB,
        correct_answer TEXT NOT NULL,
        marks NUMERIC(5,2) NOT NULL DEFAULT 1.00,
        sequence_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assessment_attempts (
        id SERIAL PRIMARY KEY,
        assessment_id INT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
        resource_id INT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        score NUMERIC(5,2),
        passed BOOLEAN,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assessment_answers (
        id SERIAL PRIMARY KEY,
        attempt_id INT NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
        question_id INT NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
        given_answer TEXT,
        is_correct BOOLEAN,
        marks_obtained NUMERIC(5,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS coding_challenges (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        language VARCHAR(50) NOT NULL,
        difficulty_level INT NOT NULL CHECK (difficulty_level BETWEEN 1 AND 5),
        target_role_profile_id INT REFERENCES role_profiles(id) ON DELETE SET NULL,
        description TEXT NOT NULL,
        test_cases JSONB NOT NULL,
        created_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS coding_submissions (
        id SERIAL PRIMARY KEY,
        challenge_id INT NOT NULL REFERENCES coding_challenges(id) ON DELETE RESTRICT,
        resource_id INT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        submitted_code TEXT NOT NULL,
        submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        test_pass_count INT NOT NULL DEFAULT 0,
        total_tests INT NOT NULL DEFAULT 0,
        score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(30) NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'passed', 'failed')),
        reviewed_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS certifications (
        id SERIAL PRIMARY KEY,
        resource_id INT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        issuing_body VARCHAR(255),
        date_earned DATE NOT NULL,
        certificate_url VARCHAR(500) NOT NULL,
        verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
        verified_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS interviews (
        id SERIAL PRIMARY KEY,
        resource_id INT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        client_name VARCHAR(255),
        role_profile_id INT REFERENCES role_profiles(id) ON DELETE SET NULL,
        interview_type VARCHAR(30) NOT NULL CHECK (interview_type IN ('client', 'mock', 'technical', 'behavioral')),
        interview_date TIMESTAMP NOT NULL,
        result VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (result IN ('selected', 'rejected', 'pending')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS interview_feedback (
        id SERIAL PRIMARY KEY,
        interview_id INT NOT NULL UNIQUE REFERENCES interviews(id) ON DELETE CASCADE,
        technical_gaps TEXT,
        communication_gaps TEXT,
        recommendations TEXT,
        overall_rating NUMERIC(2,1) CHECK (overall_rating IS NULL OR (overall_rating >= 0.0 AND overall_rating <= 5.0)),
        given_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS mentoring_sessions (
        id SERIAL PRIMARY KEY,
        mentor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        resource_id INT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        session_date TIMESTAMP NOT NULL,
        session_type VARCHAR(30) NOT NULL CHECK (session_type IN ('review', 'mock_interview', 'feedback')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_training_assignments_resource_id ON training_assignments(resource_id);
      CREATE INDEX IF NOT EXISTS idx_training_assignments_track_id ON training_assignments(track_id);
      CREATE INDEX IF NOT EXISTS idx_training_assignments_assigned_by ON training_assignments(assigned_by);
      CREATE INDEX IF NOT EXISTS idx_daily_activities_assignment_id ON daily_activities(training_assignment_id);
      CREATE INDEX IF NOT EXISTS idx_daily_activities_day_number ON daily_activities(day_number);
      CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);
      CREATE INDEX IF NOT EXISTS idx_assessments_created_by ON assessments(created_by);
      CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON assessment_questions(assessment_id);
      CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);
      CREATE INDEX IF NOT EXISTS idx_assessment_attempts_resource ON assessment_attempts(resource_id);
      CREATE INDEX IF NOT EXISTS idx_assessment_answers_attempt ON assessment_answers(attempt_id);
      CREATE INDEX IF NOT EXISTS idx_skill_requests_requested_by ON skill_requests(requested_by);
      CREATE INDEX IF NOT EXISTS idx_skill_requests_status ON skill_requests(status);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(related_entity_type, related_entity_id);
      CREATE INDEX IF NOT EXISTS idx_coding_challenges_target_role ON coding_challenges(target_role_profile_id);
      CREATE INDEX IF NOT EXISTS idx_coding_submissions_challenge ON coding_submissions(challenge_id);
      CREATE INDEX IF NOT EXISTS idx_coding_submissions_resource ON coding_submissions(resource_id);
      CREATE INDEX IF NOT EXISTS idx_coding_submissions_status ON coding_submissions(status);
      CREATE INDEX IF NOT EXISTS idx_certifications_resource ON certifications(resource_id);
      CREATE INDEX IF NOT EXISTS idx_certifications_status ON certifications(verification_status);
      CREATE INDEX IF NOT EXISTS idx_interviews_resource ON interviews(resource_id);
      CREATE INDEX IF NOT EXISTS idx_interviews_role_profile ON interviews(role_profile_id);
      CREATE INDEX IF NOT EXISTS idx_interviews_result ON interviews(result);
      CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview ON interview_feedback(interview_id);
      CREATE INDEX IF NOT EXISTS idx_interview_feedback_given_by ON interview_feedback(given_by);
      CREATE INDEX IF NOT EXISTS idx_mentoring_sessions_mentor ON mentoring_sessions(mentor_id);
      CREATE INDEX IF NOT EXISTS idx_mentoring_sessions_resource ON mentoring_sessions(resource_id);
    `);

    // Keep the clean sync atomic. A failed import must not leave Neon empty or
    // only partially populated after the truncate below.
    await neonClient.query('BEGIN');
    neonTransactionStarted = true;

    // Clean sync: Truncate Neon tables to mirror Local PostgreSQL cleanly
    console.log('Truncating existing Neon tables for clean mirror sync...');
    await neonClient.query(`
      TRUNCATE TABLE
        mentoring_sessions,
        interview_feedback,
        interviews,
        certifications,
        coding_submissions,
        coding_challenges,
        notifications,
        skill_requests,
        assessment_answers,
        assessment_attempts,
        assessment_questions,
        assessments,
        audit_logs,
        refresh_tokens,
        daily_activities,
        training_assignments,
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

    // Valid Sets for FK Lookup
    const validUserIdsRes = await neonClient.query(`SELECT id FROM users`);
    const validUserIds = new Set(validUserIdsRes.rows.map((r: any) => r.id));

    const validRegionIdsRes = await neonClient.query(`SELECT id FROM regions`);
    const validRegionIds = new Set(validRegionIdsRes.rows.map((r: any) => r.id));

    // 4. Practices (Now lead_user_id FK references existing users)
    const practicesRes = await localClient.query(`SELECT * FROM practices ORDER BY id`);
    for (const p of practicesRes.rows) {
      const leadUserId = p.lead_user_id && validUserIds.has(p.lead_user_id) ? p.lead_user_id : null;
      const regId = p.region_id && validRegionIds.has(p.region_id) ? p.region_id : null;
      await neonClient.query(
        `INSERT INTO practices (id, name, description, region_id, lead_user_id, status, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [p.id, p.name, p.description, regId, leadUserId, p.status, p.is_active, p.created_at, p.updated_at]
      );
    }
    console.log(`Migrated ${practicesRes.rows.length} practices.`);
    await neonClient.query(`SELECT setval('practices_id_seq', (SELECT COALESCE(MAX(id), 1) FROM practices))`);

    const validPracticeIdsRes = await neonClient.query(`SELECT id FROM practices`);
    const validPracticeIds = new Set(validPracticeIdsRes.rows.map((r: any) => r.id));

    // 4.5 Link region_id and practice_id back on Users
    for (const u of usersRes.rows) {
      const regId = u.region_id && validRegionIds.has(u.region_id) ? u.region_id : null;
      const pracId = u.practice_id && validPracticeIds.has(u.practice_id) ? u.practice_id : null;
      await neonClient.query(
        `UPDATE users SET region_id = $1, practice_id = $2 WHERE id = $3`,
        [regId, pracId, u.id]
      );
    }
    console.log(`Updated region_id & practice_id FK references for ${usersRes.rows.length} users.`);

    // 5. Region-Practices Junction Table
    const regPracRes = await localClient.query(
      `SELECT rp.* FROM region_practices rp
       INNER JOIN regions r ON rp.region_id = r.id
       INNER JOIN practices p ON rp.practice_id = p.id`
    );
    for (const rp of regPracRes.rows) {
      await neonClient.query(
        `INSERT INTO region_practices (region_id, practice_id, created_at)
         VALUES ($1, $2, $3)`,
        [rp.region_id, rp.practice_id, rp.created_at || new Date()]
      );
    }
    console.log(`Migrated ${regPracRes.rows.length} region_practices junction links.`);

    // 6. User Roles
    const validRoleIdsRes = await neonClient.query(`SELECT id FROM roles`);
    const validRoleIds = new Set(validRoleIdsRes.rows.map((r: any) => r.id));

    const userRolesRes = await localClient.query(
      `SELECT ur.* FROM user_roles ur
       INNER JOIN users u ON ur.user_id = u.id
       INNER JOIN roles r ON ur.role_id = r.id`
    );
    for (const ur of userRolesRes.rows) {
      if (!validUserIds.has(ur.user_id) || !validRoleIds.has(ur.role_id)) continue;
      await neonClient.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
        [ur.user_id, ur.role_id]
      );
    }
    console.log(`Migrated ${userRolesRes.rows.length} user_roles.`);

    // 7. Resources
    const resRes = await localClient.query(
      `SELECT r.* FROM resources r
       INNER JOIN users u ON r.user_id = u.id
       ORDER BY r.id`
    );
    for (const r of resRes.rows) {
      const regId = r.region_id && validRegionIds.has(r.region_id) ? r.region_id : null;
      const pracId = r.practice_id && validPracticeIds.has(r.practice_id) ? r.practice_id : null;
      const regLeadId = r.regional_lead_id && validUserIds.has(r.regional_lead_id) ? r.regional_lead_id : null;
      const mentorId = r.mentor_id && validUserIds.has(r.mentor_id) ? r.mentor_id : null;
      await neonClient.query(
        `INSERT INTO resources (id, user_id, region_id, practice_id, regional_lead_id, mentor_id, phone_number, designation, experience_years, current_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          r.id,
          r.user_id,
          regId,
          pracId,
          regLeadId,
          mentorId,
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

    const validResourceIdsRes = await neonClient.query(`SELECT id FROM resources`);
    const validResourceIds = new Set(validResourceIdsRes.rows.map((r: any) => r.id));

    // 8. Bench History Records
    const benchRes = await localClient.query(
      `SELECT b.* FROM bench_records b
       INNER JOIN users u ON b.user_id = u.id
       ORDER BY b.id`
    );
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
    const asgRes = await localClient.query(
      `SELECT a.* FROM assignments a
       INNER JOIN resources r ON a.resource_id = r.id
       ORDER BY a.id`
    );
    for (const a of asgRes.rows) {
      const assignedBy = a.assigned_by_user_id && validUserIds.has(a.assigned_by_user_id) ? a.assigned_by_user_id : null;
      await neonClient.query(
        `INSERT INTO assignments (id, resource_id, assigned_by_user_id, client_name, project_name, start_date, end_date, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [a.id, a.resource_id, assignedBy, a.client_name, a.project_name, a.start_date, a.end_date, a.status, a.created_at, a.updated_at]
      );
    }
    console.log(`Migrated ${asgRes.rows.length} assignments.`);
    await neonClient.query(`SELECT setval('assignments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM assignments))`);

    // 10. Skills Catalog
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

    const validSkillIdsRes = await neonClient.query(`SELECT id FROM skills`);
    const validSkillIds = new Set(validSkillIdsRes.rows.map((s: any) => s.id));

    // 11. Role Profiles
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

    const validRpIdsRes = await neonClient.query(`SELECT id FROM role_profiles`);
    const validRpIds = new Set(validRpIdsRes.rows.map((rp: any) => rp.id));

    // 12. Role Profile Skills
    const rpsRes = await localClient.query(
      `SELECT rps.* FROM role_profile_skills rps
       INNER JOIN role_profiles rp ON rps.role_profile_id = rp.id
       INNER JOIN skills s ON rps.skill_id = s.id`
    );
    for (const rps of rpsRes.rows) {
      await neonClient.query(
        `INSERT INTO role_profile_skills (role_profile_id, skill_id, required_level)
         VALUES ($1, $2, $3)`,
        [rps.role_profile_id, rps.skill_id, rps.required_level]
      );
    }
    console.log(`Migrated ${rpsRes.rows.length} role_profile_skills.`);

    // 13. Resource Skills Matrix
    const rsRes = await localClient.query(
      `SELECT rs.* FROM resource_skills rs
       INNER JOIN resources r ON rs.resource_id = r.id
       INNER JOIN skills s ON rs.skill_id = s.id
       ORDER BY rs.id`
    );
    for (const rs of rsRes.rows) {
      await neonClient.query(
        `INSERT INTO resource_skills (id, resource_id, skill_id, current_level, target_level, source, last_updated)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [rs.id, rs.resource_id, rs.skill_id, rs.current_level, rs.target_level, rs.source, rs.last_updated]
      );
    }
    console.log(`Migrated ${rsRes.rows.length} resource_skills.`);
    await neonClient.query(`SELECT setval('resource_skills_id_seq', (SELECT COALESCE(MAX(id), 1) FROM resource_skills))`);

    // 14. Training Tracks
    const ttRes = await localClient.query(`SELECT * FROM training_tracks ORDER BY id`);
    for (const tt of ttRes.rows) {
      const targetRpId = tt.target_role_profile_id && validRpIds.has(tt.target_role_profile_id) ? tt.target_role_profile_id : null;
      await neonClient.query(
        `INSERT INTO training_tracks (id, name, target_role_profile_id, description, duration_days, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tt.id, tt.name, targetRpId, tt.description, tt.duration_days, tt.created_at, tt.updated_at]
      );
    }
    console.log(`Migrated ${ttRes.rows.length} training_tracks.`);
    await neonClient.query(`SELECT setval('training_tracks_id_seq', (SELECT COALESCE(MAX(id), 1) FROM training_tracks))`);

    const validTrackIdsRes = await neonClient.query(`SELECT id FROM training_tracks`);
    const validTrackIds = new Set(validTrackIdsRes.rows.map((t: any) => t.id));

    // 15. Training Programs
    const tpRes = await localClient.query(
      `SELECT tp.* FROM training_programs tp
       INNER JOIN training_tracks tt ON tp.track_id = tt.id
       ORDER BY tp.id`
    );
    for (const tp of tpRes.rows) {
      await neonClient.query(
        `INSERT INTO training_programs (id, track_id, name, skill_level, duration_days, prerequisites, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [tp.id, tp.track_id, tp.name, tp.skill_level, tp.duration_days, tp.prerequisites, tp.created_at, tp.updated_at]
      );
    }
    console.log(`Migrated ${tpRes.rows.length} training_programs.`);
    await neonClient.query(`SELECT setval('training_programs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM training_programs))`);

    // 16. Training Modules
    const tmRes = await localClient.query(
      `SELECT tm.* FROM training_modules tm
       INNER JOIN training_programs tp ON tm.program_id = tp.id
       ORDER BY tm.id`
    );
    for (const tm of tmRes.rows) {
      await neonClient.query(
        `INSERT INTO training_modules (id, program_id, name, sequence_order, day_number, content_type, content_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [tm.id, tm.program_id, tm.name, tm.sequence_order, tm.day_number, tm.content_type, tm.content_url, tm.created_at, tm.updated_at]
      );
    }
    console.log(`Migrated ${tmRes.rows.length} training_modules.`);
    await neonClient.query(`SELECT setval('training_modules_id_seq', (SELECT COALESCE(MAX(id), 1) FROM training_modules))`);

    // 17. Training Assignments
    const taRes = await localClient.query(
      `SELECT ta.* FROM training_assignments ta
       INNER JOIN resources r ON ta.resource_id = r.id
       INNER JOIN training_tracks tt ON ta.track_id = tt.id
       INNER JOIN users u ON ta.assigned_by = u.id
       ORDER BY ta.id`
    );
    for (const ta of taRes.rows) {
      const approvedBy = ta.approved_by && validUserIds.has(ta.approved_by) ? ta.approved_by : null;
      await neonClient.query(
        `INSERT INTO training_assignments (id, resource_id, track_id, assigned_by, start_date, status, approval_status, approved_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [ta.id, ta.resource_id, ta.track_id, ta.assigned_by, ta.start_date, ta.status, ta.approval_status, approvedBy, ta.created_at, ta.updated_at]
      );
    }
    console.log(`Migrated ${taRes.rows.length} training_assignments.`);
    await neonClient.query(`SELECT setval('training_assignments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM training_assignments))`);

    // 18. Daily Activities
    const daRes = await localClient.query(
      `SELECT da.* FROM daily_activities da
       INNER JOIN training_assignments ta ON da.training_assignment_id = ta.id
       ORDER BY da.id`
    );
    for (const da of daRes.rows) {
      await neonClient.query(
        `INSERT INTO daily_activities (id, training_assignment_id, day_number, activity_type, description, status, completed_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [da.id, da.training_assignment_id, da.day_number, da.activity_type, da.description, da.status, da.completed_date, da.created_at, da.updated_at]
      );
    }
    console.log(`Migrated ${daRes.rows.length} daily_activities.`);
    await neonClient.query(`SELECT setval('daily_activities_id_seq', (SELECT COALESCE(MAX(id), 1) FROM daily_activities))`);

    // 19. Refresh Tokens — SKIPPED (stale session tokens are not needed on prod)
    console.log('Skipping refresh_tokens migration (session data not needed on deployment).');
    await neonClient.query(`TRUNCATE TABLE refresh_tokens CASCADE`);
    await neonClient.query(`SELECT setval('refresh_tokens_id_seq', 1, false)`);

    // 20. Audit Logs
    const alRes = await localClient.query(`SELECT * FROM audit_logs ORDER BY id`);
    for (const al of alRes.rows) {
      const userId = al.user_id && validUserIds.has(al.user_id) ? al.user_id : null;
      await neonClient.query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [al.id, userId, al.action, al.entity_type, al.entity_id, al.details, al.created_at]
      );
    }
    console.log(`Migrated ${alRes.rows.length} audit_logs.`);
    await neonClient.query(`SELECT setval('audit_logs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM audit_logs))`);

    // 21. Skill Requests
    const skillRequestsRes = await localClient.query(`SELECT * FROM skill_requests ORDER BY id`);
    for (const request of skillRequestsRes.rows) {
      if (!validUserIds.has(request.requested_by)) continue;
      const reviewedBy = request.reviewed_by && validUserIds.has(request.reviewed_by) ? request.reviewed_by : null;
      await neonClient.query(
        `INSERT INTO skill_requests (id, requested_by, skill_name, category, justification, status, reviewed_by, created_at, reviewed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [request.id, request.requested_by, request.skill_name, request.category, request.justification, request.status, reviewedBy, request.created_at, request.reviewed_at]
      );
    }
    console.log(`Migrated ${skillRequestsRes.rows.length} skill_requests.`);
    await neonClient.query(`SELECT setval('skill_requests_id_seq', (SELECT COALESCE(MAX(id), 1) FROM skill_requests))`);

    // 22. Notifications
    const notificationsRes = await localClient.query(`SELECT * FROM notifications ORDER BY id`);
    for (const notification of notificationsRes.rows) {
      if (!validUserIds.has(notification.user_id)) continue;
      await neonClient.query(
        `INSERT INTO notifications (id, user_id, type, message, related_entity_type, related_entity_id, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [notification.id, notification.user_id, notification.type, notification.message, notification.related_entity_type, notification.related_entity_id, notification.is_read, notification.created_at]
      );
    }
    console.log(`Migrated ${notificationsRes.rows.length} notifications.`);
    await neonClient.query(`SELECT setval('notifications_id_seq', (SELECT COALESCE(MAX(id), 1) FROM notifications))`);

    // 23. Assessments
    const assRes = await localClient.query(`SELECT * FROM assessments ORDER BY id`);
    for (const a of assRes.rows) {
      const createdBy = a.created_by && validUserIds.has(a.created_by) ? a.created_by : null;
      if (!createdBy) continue;
      await neonClient.query(
        `INSERT INTO assessments (id, name, type, related_module_id, total_questions, passing_score, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [a.id, a.name, a.type, a.related_module_id || null, a.total_questions, a.passing_score, createdBy, a.created_at, a.updated_at]
      );
    }
    console.log(`Migrated ${assRes.rows.length} assessments.`);
    await neonClient.query(`SELECT setval('assessments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM assessments))`);

    // 24. Assessment Questions
    const aqRes = await localClient.query(`SELECT * FROM assessment_questions ORDER BY id`);
    for (const q of aqRes.rows) {
      await neonClient.query(
        `INSERT INTO assessment_questions (id, assessment_id, question_text, question_type, options, correct_answer, marks, sequence_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          q.id,
          q.assessment_id,
          q.question_text,
          q.question_type,
          typeof q.options === 'string' ? q.options : JSON.stringify(q.options),
          q.correct_answer,
          q.marks,
          q.sequence_order,
          q.created_at,
          q.updated_at,
        ]
      );
    }
    console.log(`Migrated ${aqRes.rows.length} assessment_questions.`);
    await neonClient.query(`SELECT setval('assessment_questions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM assessment_questions))`);

    // 25. Assessment Attempts
    const attRes = await localClient.query(`SELECT * FROM assessment_attempts ORDER BY id`);
    for (const att of attRes.rows) {
      await neonClient.query(
        `INSERT INTO assessment_attempts (id, assessment_id, resource_id, score, passed, started_at, completed_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [att.id, att.assessment_id, att.resource_id, att.score, att.passed, att.started_at, att.completed_at, att.created_at, att.updated_at]
      );
    }
    console.log(`Migrated ${attRes.rows.length} assessment_attempts.`);
    await neonClient.query(`SELECT setval('assessment_attempts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM assessment_attempts))`);

    // 26. Assessment Answers
    const ansRes = await localClient.query(`SELECT * FROM assessment_answers ORDER BY id`);
    for (const ans of ansRes.rows) {
      await neonClient.query(
        `INSERT INTO assessment_answers (id, attempt_id, question_id, given_answer, is_correct, marks_obtained, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [ans.id, ans.attempt_id, ans.question_id, ans.given_answer, ans.is_correct, ans.marks_obtained, ans.created_at, ans.updated_at]
      );
    }
    console.log(`Migrated ${ansRes.rows.length} assessment_answers.`);
    await neonClient.query(`SELECT setval('assessment_answers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM assessment_answers))`);

    // 27. Coding Challenges
    const ccRes = await localClient.query(`SELECT * FROM coding_challenges ORDER BY id`);
    for (const cc of ccRes.rows) {
      const createdBy = cc.created_by && validUserIds.has(cc.created_by) ? cc.created_by : null;
      if (!createdBy) continue;
      await neonClient.query(
        `INSERT INTO coding_challenges (id, title, language, difficulty_level, target_role_profile_id, description, test_cases, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          cc.id,
          cc.title,
          cc.language,
          cc.difficulty_level,
          cc.target_role_profile_id || null,
          cc.description,
          typeof cc.test_cases === 'string' ? cc.test_cases : JSON.stringify(cc.test_cases),
          createdBy,
          cc.created_at,
          cc.updated_at,
        ]
      );
    }
    console.log(`Migrated ${ccRes.rows.length} coding_challenges.`);
    await neonClient.query(`SELECT setval('coding_challenges_id_seq', (SELECT COALESCE(MAX(id), 1) FROM coding_challenges))`);

    // 28. Coding Submissions
    const csRes = await localClient.query(`SELECT * FROM coding_submissions ORDER BY id`);
    for (const cs of csRes.rows) {
      const reviewedBy = cs.reviewed_by && validUserIds.has(cs.reviewed_by) ? cs.reviewed_by : null;
      await neonClient.query(
        `INSERT INTO coding_submissions (id, challenge_id, resource_id, submitted_code, submission_date, test_pass_count, total_tests, score, status, reviewed_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          cs.id,
          cs.challenge_id,
          cs.resource_id,
          cs.submitted_code,
          cs.submission_date,
          cs.test_pass_count,
          cs.total_tests,
          cs.score,
          cs.status,
          reviewedBy,
          cs.created_at,
        ]
      );
    }
    console.log(`Migrated ${csRes.rows.length} coding_submissions.`);
    await neonClient.query(`SELECT setval('coding_submissions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM coding_submissions))`);

    // 29. Certifications
    const certsRes = await localClient.query(`SELECT * FROM certifications ORDER BY id`);
    for (const cert of certsRes.rows) {
      const verifiedBy = cert.verified_by && validUserIds.has(cert.verified_by) ? cert.verified_by : null;
      await neonClient.query(
        `INSERT INTO certifications (id, resource_id, name, issuing_body, date_earned, certificate_url, verification_status, verified_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          cert.id,
          cert.resource_id,
          cert.name,
          cert.issuing_body,
          cert.date_earned,
          cert.certificate_url,
          cert.verification_status,
          verifiedBy,
          cert.created_at,
          cert.updated_at,
        ]
      );
    }
    console.log(`Migrated ${certsRes.rows.length} certifications.`);
    await neonClient.query(`SELECT setval('certifications_id_seq', (SELECT COALESCE(MAX(id), 1) FROM certifications))`);

    // 30. Interviews
    const intRes = await localClient.query(`SELECT * FROM interviews ORDER BY id`);
    for (const item of intRes.rows) {
      const rpId = item.role_profile_id && validRpIds.has(item.role_profile_id) ? item.role_profile_id : null;
      await neonClient.query(
        `INSERT INTO interviews (id, resource_id, client_name, role_profile_id, interview_type, interview_date, result, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          item.id,
          item.resource_id,
          item.client_name,
          rpId,
          item.interview_type,
          item.interview_date,
          item.result,
          item.created_at,
          item.updated_at,
        ]
      );
    }
    console.log(`Migrated ${intRes.rows.length} interviews.`);
    await neonClient.query(`SELECT setval('interviews_id_seq', (SELECT COALESCE(MAX(id), 1) FROM interviews))`);

    // 31. Interview Feedback
    const fbRes = await localClient.query(`SELECT * FROM interview_feedback ORDER BY id`);
    for (const fb of fbRes.rows) {
      const givenBy = fb.given_by && validUserIds.has(fb.given_by) ? fb.given_by : null;
      if (!givenBy) continue;
      await neonClient.query(
        `INSERT INTO interview_feedback (id, interview_id, technical_gaps, communication_gaps, recommendations, overall_rating, given_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          fb.id,
          fb.interview_id,
          fb.technical_gaps,
          fb.communication_gaps,
          fb.recommendations,
          fb.overall_rating,
          givenBy,
          fb.created_at,
        ]
      );
    }
    console.log(`Migrated ${fbRes.rows.length} interview_feedback.`);
    await neonClient.query(`SELECT setval('interview_feedback_id_seq', (SELECT COALESCE(MAX(id), 1) FROM interview_feedback))`);

    // 32. Mentoring Sessions
    const msRes = await localClient.query(`SELECT * FROM mentoring_sessions ORDER BY id`);
    for (const ms of msRes.rows) {
      const mentorId = ms.mentor_id && validUserIds.has(ms.mentor_id) ? ms.mentor_id : null;
      if (!mentorId) continue;
      await neonClient.query(
        `INSERT INTO mentoring_sessions (id, mentor_id, resource_id, session_date, session_type, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          ms.id,
          mentorId,
          ms.resource_id,
          ms.session_date,
          ms.session_type,
          ms.notes,
          ms.created_at,
        ]
      );
    }
    console.log(`Migrated ${msRes.rows.length} mentoring_sessions.`);
    await neonClient.query(`SELECT setval('mentoring_sessions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM mentoring_sessions))`);

    await neonClient.query('COMMIT');
    neonTransactionStarted = false;

    console.log('\n======================================================');
    console.log(' SUCCESS: All local database data & Day 10 Certifications/Interviews/Mentoring data fully migrated to Neon Cloud PostgreSQL!');
    console.log('======================================================\n');
  } catch (error: any) {
    if (neonClient && neonTransactionStarted) {
      try {
        await neonClient.query('ROLLBACK');
      } catch (rollbackError: any) {
        console.error('Migration rollback error:', rollbackError?.message || rollbackError);
      }
    }
    console.error('Migration error:', error?.message || error);
    process.exitCode = 1;
  } finally {
    if (localClient) localClient.release();
    if (neonClient) neonClient.release();
    await localPool.end();
    await neonPool.end();
  }
};

migrateLocalToNeon();
