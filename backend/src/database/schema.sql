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
    current_status VARCHAR(30) DEFAULT 'bench' CHECK (current_status IN ('assigned', 'bench', 'training')),
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



