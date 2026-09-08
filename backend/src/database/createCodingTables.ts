import { pool } from '../config/db.js';

async function createCodingTables() {
  try {
    console.log('Creating coding_challenges and coding_submissions tables...');
    await pool.query(`
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

      CREATE INDEX IF NOT EXISTS idx_coding_challenges_target_role ON coding_challenges(target_role_profile_id);
      CREATE INDEX IF NOT EXISTS idx_coding_submissions_challenge ON coding_submissions(challenge_id);
      CREATE INDEX IF NOT EXISTS idx_coding_submissions_resource ON coding_submissions(resource_id);
      CREATE INDEX IF NOT EXISTS idx_coding_submissions_status ON coding_submissions(status);
    `);
    console.log('Successfully created Day 9 tables!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to create tables:', error);
    process.exit(1);
  }
}

createCodingTables();
