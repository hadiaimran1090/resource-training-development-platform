-- RTDP Database Schema
-- Industry Standard DDL Architecture (Updated Version 2.0)

-- 1. Create Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Regions Table
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Practices Table (1-to-Many with Regions)
CREATE TABLE IF NOT EXISTS practices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    region_id INT REFERENCES regions(id) ON DELETE CASCADE,
    lead_user_id INT, -- FK added after users table creation
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Safety ALTER TABLE migration statements (Auto-add new columns to pre-existing tables)
ALTER TABLE practices ADD COLUMN IF NOT EXISTS region_id INT REFERENCES regions(id) ON DELETE CASCADE;

-- 4. Employee ID Sequence
CREATE SEQUENCE IF NOT EXISTS employee_id_seq START WITH 1001;

-- 5. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    employee_id VARCHAR(30) UNIQUE NOT NULL DEFAULT CONCAT('EMP-', LPAD(nextval('employee_id_seq')::text, 4, '0')),
    must_reset_password BOOLEAN DEFAULT TRUE NOT NULL,
    region_id INT REFERENCES regions(id) ON DELETE SET NULL,
    practice_id INT REFERENCES practices(id) ON DELETE SET NULL,
    profile_image_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    joining_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT CURRENT_DATE;

-- Foreign Key: practices.lead_user_id -> users(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_practices_lead_user'
    ) THEN
        ALTER TABLE practices 
        ADD CONSTRAINT fk_practices_lead_user 
        FOREIGN KEY (lead_user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 6. Create User Roles Junction Table (Many-to-Many: Users <-> Roles)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 7. Create Resources / Universal User Profiles Extension Table (1:1 Extension for ALL Users)
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    region_id INT REFERENCES regions(id) ON DELETE SET NULL,
    practice_id INT REFERENCES practices(id) ON DELETE SET NULL,
    regional_lead_id INT REFERENCES users(id) ON DELETE SET NULL,
    phone_number VARCHAR(30),
    designation VARCHAR(100) NOT NULL DEFAULT 'Engineering Resource',
    experience_years NUMERIC(4,1) DEFAULT 1.0,
    current_status VARCHAR(30) DEFAULT 'bench' CHECK (current_status IN ('assigned', 'bench')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE resources ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30);

-- 8. Create Assignments Table (Only Regional Leads Can Create)
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    resource_id INT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    assigned_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    client_name VARCHAR(150) NOT NULL,
    project_name VARCHAR(150),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assigned_by_user_id INT REFERENCES users(id) ON DELETE SET NULL;


-- 9. Create Dedicated Bench History Table
CREATE TABLE IF NOT EXISTS bench_records (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE bench_records DROP COLUMN IF EXISTS reason;

-- 10. Create Refresh Tokens Table
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

-- Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_region_id ON users(region_id);
CREATE INDEX IF NOT EXISTS idx_users_practice_id ON users(practice_id);
CREATE INDEX IF NOT EXISTS idx_practices_region_id ON practices(region_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_region_id ON resources(region_id);
CREATE INDEX IF NOT EXISTS idx_assignments_resource_id ON assignments(resource_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_by ON assignments(assigned_by_user_id);
CREATE INDEX IF NOT EXISTS idx_bench_records_user_id ON bench_records(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- 11. Create Region Practices Many-to-Many Junction Table
CREATE TABLE IF NOT EXISTS region_practices (
    region_id INT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    practice_id INT NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (region_id, practice_id)
);

CREATE INDEX IF NOT EXISTS idx_region_practices_region_id ON region_practices(region_id);
CREATE INDEX IF NOT EXISTS idx_region_practices_practice_id ON region_practices(practice_id);

-- 12. Create Skills Table (Skills Catalog)
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('technical', 'secondary', 'soft')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Create Resource Skills Table (Skills Matrix)
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

CREATE INDEX IF NOT EXISTS idx_resource_skills_resource_id ON resource_skills(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_skills_skill_id ON resource_skills(skill_id);

-- 14. Create Role Profiles Table
CREATE TABLE IF NOT EXISTS role_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Create Role Profile Skills Junction Table
CREATE TABLE IF NOT EXISTS role_profile_skills (
    role_profile_id INT NOT NULL REFERENCES role_profiles(id) ON DELETE CASCADE,
    skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    required_level NUMERIC(3,1) NOT NULL CHECK (required_level >= 0.0 AND required_level <= 5.0),
    PRIMARY KEY (role_profile_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_role_profile_skills_role ON role_profile_skills(role_profile_id);
CREATE INDEX IF NOT EXISTS idx_role_profile_skills_skill ON role_profile_skills(skill_id);

-- 16. Create Training Tracks Table
CREATE TABLE IF NOT EXISTS training_tracks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    target_role_profile_id INT REFERENCES role_profiles(id) ON DELETE SET NULL,
    description TEXT,
    duration_days INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Create Training Programs Table
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

-- 18. Create Training Modules Table
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

-- Indexes for Training Catalog Performance
CREATE INDEX IF NOT EXISTS idx_training_tracks_target_role ON training_tracks(target_role_profile_id);
CREATE INDEX IF NOT EXISTS idx_training_programs_track_id ON training_programs(track_id);
CREATE INDEX IF NOT EXISTS idx_training_modules_program_id ON training_modules(program_id);

-- 19. Create Training Assignments Table
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

-- 20. Create Daily Activities Table
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

-- Indexes for Training Assignments and Daily Activities
CREATE INDEX IF NOT EXISTS idx_training_assignments_resource_id ON training_assignments(resource_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_track_id ON training_assignments(track_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_assigned_by ON training_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_daily_activities_assignment_id ON daily_activities(training_assignment_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_day_number ON daily_activities(day_number);

-- 21. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- =============================================
-- DAY 8: ASSESSMENT ENGINE TABLES
-- =============================================

-- 22. Create Assessments Table
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

-- 23. Create Assessment Questions Table
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

-- 24. Create Assessment Attempts Table
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

-- 25. Create Assessment Answers Table
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

-- Indexes for Assessment Engine Performance
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);
CREATE INDEX IF NOT EXISTS idx_assessments_created_by ON assessments(created_by);
CREATE INDEX IF NOT EXISTS idx_assessments_module ON assessments(related_module_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_resource ON assessment_attempts(resource_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_attempt ON assessment_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_question ON assessment_answers(question_id);

-- 26. Create Skill Requests Table (Propose New Skill Workflow)
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

CREATE INDEX IF NOT EXISTS idx_skill_requests_requested_by ON skill_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_skill_requests_status ON skill_requests(status);

-- 27. Notifications (for approval workflows and user alerts)
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

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(related_entity_type, related_entity_id);

-- 28. Coding Challenges
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

CREATE INDEX IF NOT EXISTS idx_coding_challenges_target_role ON coding_challenges(target_role_profile_id);
CREATE INDEX IF NOT EXISTS idx_coding_challenges_created_by ON coding_challenges(created_by);

-- 29. Coding Submissions
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

CREATE INDEX IF NOT EXISTS idx_coding_submissions_challenge ON coding_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_coding_submissions_resource ON coding_submissions(resource_id);
CREATE INDEX IF NOT EXISTS idx_coding_submissions_status ON coding_submissions(status);

-- =============================================
-- DAY 10: CERTIFICATIONS, INTERVIEWS, MENTORING TABLES
-- =============================================

-- Add mentor_id FK reference to resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS mentor_id INT REFERENCES users(id) ON DELETE SET NULL;

-- 30. Certifications Table
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

CREATE INDEX IF NOT EXISTS idx_certifications_resource ON certifications(resource_id);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON certifications(verification_status);

-- 31. Interviews Table
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

CREATE INDEX IF NOT EXISTS idx_interviews_resource ON interviews(resource_id);
CREATE INDEX IF NOT EXISTS idx_interviews_role_profile ON interviews(role_profile_id);
CREATE INDEX IF NOT EXISTS idx_interviews_result ON interviews(result);

-- 32. Interview Feedback Table (1:1 with Interview)
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

CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview ON interview_feedback(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_given_by ON interview_feedback(given_by);

-- 33. Mentoring Sessions Table
CREATE TABLE IF NOT EXISTS mentoring_sessions (
    id SERIAL PRIMARY KEY,
    mentor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id INT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    session_date TIMESTAMP NOT NULL,
    session_type VARCHAR(30) NOT NULL CHECK (session_type IN ('review', 'mock_interview', 'feedback')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentoring_sessions_mentor ON mentoring_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_sessions_resource ON mentoring_sessions(resource_id);


