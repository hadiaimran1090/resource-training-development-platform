import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

/**
 * Industry-Level Database Seed Script
 * Responsible ONLY for seeding initial/development data idempotently.
 * All DDL schema structures belong in schema.sql.
 */
export const seedDatabase = async () => {
  let client;
  try {
    client = await pool.connect();

    // 1. Ensure Database Schema Exists (Run schema.sql DDL if present)
    const possiblePaths = [
      path.resolve(process.cwd(), 'src/database/schema.sql'),
      path.resolve(process.cwd(), 'backend/src/database/schema.sql'),
      path.join(__dirname, 'schema.sql'),
      path.resolve(process.cwd(), 'dist/database/schema.sql'),
    ];

    let schemaSql = '';
    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          schemaSql = fs.readFileSync(p, 'utf8');
          break;
        }
      } catch { }
    }

    if (schemaSql) {
      await client.query(schemaSql);
    }

    // 2. Seed Initial System Roles
    const roles = [
      { name: 'System Administrator', description: 'Full system control and administrative privileges' },
      { name: 'Practice Lead', description: 'Practice oversight and resource management' },
      { name: 'Regional Lead', description: 'Regional operations and bench monitoring' },
      { name: 'Training Manager', description: 'Curriculum management and assessment tracking' },
      { name: 'Mentor', description: 'Mentorship pairings, code reviews, and mock interviews' },
      { name: 'Resource', description: 'Engineering resource learning and deployment readiness' },
      { name: 'Management', description: 'Executive summary and strategic dashboard access' },
    ];

    for (const role of roles) {
      await client.query(
        `INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [role.name, role.description]
      );
    }

    // 3. Seed Initial Regions
    const regions = [
      { name: 'APAC', code: 'APAC' },
      { name: 'KSA', code: 'KSA' },
      { name: 'UAE', code: 'UAE' },
      { name: 'VSI', code: 'VSI' },
    ];

    for (const region of regions) {
      await client.query(
        `INSERT INTO regions (name, code, is_active, status) VALUES ($1, $2, TRUE, 'active') ON CONFLICT (name) DO NOTHING`,
        [region.name, region.code]
      );
    }

    // 4. Fetch Role, Region mappings for Practice creation
    const rolesRes = await client.query(`SELECT id, name FROM roles`);
    const regionsRes = await client.query(`SELECT id, name FROM regions`);

    const roleMap = new Map<string, number>(rolesRes.rows.map((r: any) => [r.name, r.id]));
    const regionMap = new Map<string, number>(regionsRes.rows.map((r: any) => [r.name, r.id]));

    // 5. Seed Initial Practices with Region Mapping (1:N Region -> Practice)
    const apacId = regionMap.get('APAC');
    const ksaId = regionMap.get('KSA');
    const uaeId = regionMap.get('UAE');
    const vsiId = regionMap.get('VSI');

    const practicesToSeed = [
      { name: 'Software Engineering', regionId: apacId },
      { name: 'Quality Assurance', regionId: vsiId },
      { name: 'Data & Analytics', regionId: ksaId },
      { name: 'DevOps & Cloud', regionId: uaeId },
    ];

    for (const p of practicesToSeed) {
      if (!p.regionId) continue;

      const existingPractice = await client.query(
        `SELECT id FROM practices WHERE LOWER(name) = LOWER($1)`,
        [p.name]
      );

      if (existingPractice.rows.length === 0) {
        await client.query(
          `INSERT INTO practices (name, region_id, is_active, status) VALUES ($1, $2, TRUE, 'active')`,
          [p.name, p.regionId]
        );
      } else {
        await client.query(
          `UPDATE practices SET region_id = $1, status = 'active', is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [p.regionId, existingPractice.rows[0].id]
        );
      }
    }

    // Seed Many-to-Many region_practices junction table
    const allRegionsRes = await client.query(`SELECT id FROM regions`);
    const allPracticesRes = await client.query(`SELECT id FROM practices`);
    for (const r of allRegionsRes.rows) {
      for (const p of allPracticesRes.rows) {
        await client.query(
          `INSERT INTO region_practices (region_id, practice_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [r.id, p.id]
        );
      }
    }

    // Refresh practices map after insert
    const updatedPracticesRes = await client.query(`SELECT id, name, region_id FROM practices`);
    const practiceMap = new Map<string, number>(updatedPracticesRes.rows.map((p: any) => [p.name, p.id]));


    // Default password hash using bcrypt
    const defaultPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@786';
    const commonPasswordHash = await bcrypt.hash(defaultPassword, 10);

    // 5. Seed Default Platform & Demo Users (must_reset_password set to FALSE for dev test accounts)
    const usersToSeed = [
      {
        name: 'System Administrator',
        email: 'admin@rtdp.com',
        employeeId: 'EMP-0001',
        roleNames: ['System Administrator'],
        regionName: 'APAC',
        practiceName: null,
        mustResetPassword: true,
      },
      {
        name: 'Sarah Practice Lead',
        email: 'sarah@rtdp.com',
        employeeId: 'EMP-0002',
        roleNames: ['Practice Lead'],
        regionName: 'APAC',
        practiceName: 'Software Engineering',
        mustResetPassword: true,
      },
      {
        name: 'Rohan Regional Lead',
        email: 'rohan@rtdp.com',
        employeeId: 'EMP-0003',
        roleNames: ['Regional Lead'],
        regionName: 'KSA',
        practiceName: null,
        mustResetPassword: true,
      },
      {
        name: 'Tania Training Manager',
        email: 'tania@rtdp.com',
        employeeId: 'EMP-0004',
        roleNames: ['Training Manager'],
        regionName: 'UAE',
        practiceName: null,
        mustResetPassword: true,
      },
      {
        name: 'Michael Mentor',
        email: 'michael@rtdp.com',
        employeeId: 'EMP-0005',
        roleNames: ['Mentor', 'Practice Lead'],
        regionName: 'VSI',
        practiceName: 'Quality Assurance',
        mustResetPassword: true,
      },
      {
        name: 'Rachel Resource',
        email: 'rachel@rtdp.com',
        employeeId: 'EMP-0006',
        roleNames: ['Resource'],
        regionName: 'APAC',
        practiceName: 'Software Engineering',
        mustResetPassword: true,
      },
      {
        name: 'Marcus Management',
        email: 'marcus@rtdp.com',
        employeeId: 'EMP-0007',
        roleNames: ['Management'],
        regionName: 'APAC',
        practiceName: null,
        mustResetPassword: true,
      },
    ];

    for (const u of usersToSeed) {
      const regionId = u.regionName ? regionMap.get(u.regionName) : null;
      const practiceId = u.practiceName ? practiceMap.get(u.practiceName) : null;

      let userId: number;
      const userCheck = await client.query(`SELECT id FROM users WHERE email = $1`, [u.email]);
      if (userCheck.rows.length === 0) {
        const userInsertRes = await client.query(
          `INSERT INTO users (name, email, password_hash, employee_id, must_reset_password, region_id, practice_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
           RETURNING id`,
          [
            u.name,
            u.email,
            commonPasswordHash,
            u.employeeId,
            u.mustResetPassword,
            regionId || null,
            practiceId || null,
          ]
        );
        userId = userInsertRes.rows[0].id;
      } else {
        userId = userCheck.rows[0].id;
        await client.query(
          `UPDATE users SET must_reset_password = $1, region_id = $2, practice_id = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
          [u.mustResetPassword, regionId || null, practiceId || null, userId]
        );
      }

      // Link roles in user_roles junction table (Supports multi-role mapping)
      for (const roleName of u.roleNames) {
        const roleId = roleMap.get(roleName);
        if (roleId && userId) {
          await client.query(
            `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [userId, roleId]
          );
        }
      }

      // 6. Universal Profile Creation in resources table for ALL users (1:1 Extension)
      const regionalLeadCheck = await client.query(`SELECT id FROM users WHERE email = 'rohan@rtdp.com'`);
      const regionalLeadId = regionalLeadCheck.rows[0]?.id || null;

      const resInsert = await client.query(
        `INSERT INTO resources (user_id, region_id, practice_id, regional_lead_id, phone_number, designation, experience_years, current_status)
         VALUES ($1, $2, $3, $4, '+1-555-0192', 'Engineering Professional', 3.5, $5)
         ON CONFLICT (user_id) DO NOTHING
         RETURNING id`,
        [
          userId,
          regionId || null,
          practiceId || null,
          regionalLeadId,
          u.roleNames.includes('Resource') ? 'assigned' : 'bench',
        ]
      );

      let resourceId = resInsert.rows[0]?.id;
      if (!resourceId) {
        const rFind = await client.query(`SELECT id FROM resources WHERE user_id = $1`, [userId]);
        resourceId = rFind.rows[0]?.id;
      }

      // 7. Seed Sample Bench History Records
      const benchCheck = await client.query(`SELECT id FROM bench_records WHERE user_id = $1`, [userId]);
      if (benchCheck.rows.length === 0) {
        // Initial closed bench period (e.g. 30 days)
        await client.query(
          `INSERT INTO bench_records (user_id, start_date, end_date)
           VALUES ($1, '2026-01-01', '2026-01-31')`,
          [userId]
        );
        // Active bench record if not currently assigned
        if (!u.roleNames.includes('Resource')) {
          await client.query(
            `INSERT INTO bench_records (user_id, start_date, end_date)
             VALUES ($1, '2026-02-01', NULL)`,
            [userId]
          );
        }
      }

      // 8. Seed Sample Assignment for Resource role user (Created by Regional Lead)
      if (u.roleNames.includes('Resource') && resourceId) {
        const asgCheck = await client.query(`SELECT id FROM assignments WHERE resource_id = $1`, [resourceId]);
        if (asgCheck.rows.length === 0 && regionalLeadId) {
          await client.query(
            `INSERT INTO assignments (resource_id, assigned_by_user_id, client_name, project_name, start_date, status)
             VALUES ($1, $2, 'Acme Corp', 'Fintech Platform Modernization', '2026-02-01', 'active')`,
            [resourceId, regionalLeadId]
          );
        }
      }
    }

    // 9. Link Practice Leads in Practices table
    const sarahUser = await client.query(`SELECT id FROM users WHERE email = 'sarah@rtdp.com'`);
    if (sarahUser.rows.length > 0 && practiceMap.has('Software Engineering')) {
      await client.query(
        `UPDATE practices SET lead_user_id = $1 WHERE id = $2 AND lead_user_id IS NULL`,
        [sarahUser.rows[0].id, practiceMap.get('Software Engineering')]
      );
    }

    // 10. Adjust employee_id sequence start
    await client.query(`SELECT setval('employee_id_seq', 1000, true)`);

    // ==========================================
    // 11.  Seed: Skills Catalog
    // ==========================================
    const sampleSkills = [
      { name: 'Java', category: 'technical' },
      { name: 'Spring Boot', category: 'technical' },
      { name: 'REST APIs', category: 'technical' },
      { name: 'SQL', category: 'technical' },
      { name: 'React', category: 'technical' },
      { name: 'JavaScript', category: 'technical' },
      { name: 'AWS / Azure', category: 'secondary' },
      { name: 'Docker', category: 'secondary' },
      { name: 'Testing & QA', category: 'secondary' },
      { name: 'System Design', category: 'technical' },
      { name: 'Git & Version Control', category: 'secondary' },
      { name: 'CI/CD Pipelines', category: 'secondary' },
      { name: 'Agile & Scrum', category: 'soft' },
      { name: 'Technical Communication', category: 'soft' },
    ];

    for (const s of sampleSkills) {
      await client.query(
        `INSERT INTO skills (name, category) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [s.name, s.category]
      );
    }

    const skillsRes = await client.query(`SELECT id, name FROM skills`);
    const skillMap = new Map<string, number>(skillsRes.rows.map((s: any) => [s.name, s.id]));

    // ==========================================
    // 12. Seed: Role Profiles & Role Profile Skills
    // ==========================================
    const roleProfileName = 'Full Stack Java Engineer';
    const roleProfileDesc = 'Full Stack Developer proficient in Java, Spring Boot microservices, React frontend, database architecture, and cloud deployment.';

    let roleProfileId: number;
    const rpCheck = await client.query(`SELECT id FROM role_profiles WHERE name = $1`, [roleProfileName]);
    if (rpCheck.rows.length === 0) {
      const rpInsert = await client.query(
        `INSERT INTO role_profiles (name, description) VALUES ($1, $2) RETURNING id`,
        [roleProfileName, roleProfileDesc]
      );
      roleProfileId = rpInsert.rows[0].id;
    } else {
      roleProfileId = rpCheck.rows[0].id;
    }

    const requiredSkillsForJavaEngineer = [
      { name: 'Java', level: 4.0 },
      { name: 'Spring Boot', level: 4.0 },
      { name: 'REST APIs', level: 4.0 },
      { name: 'SQL', level: 3.0 },
      { name: 'React', level: 3.0 },
      { name: 'JavaScript', level: 3.0 },
      { name: 'AWS / Azure', level: 3.0 },
      { name: 'Docker', level: 3.0 },
      { name: 'Testing & QA', level: 3.0 },
      { name: 'System Design', level: 3.0 },
      { name: 'Git & Version Control', level: 3.0 },
      { name: 'CI/CD Pipelines', level: 2.0 },
    ];

    for (const reqSkill of requiredSkillsForJavaEngineer) {
      const skillId = skillMap.get(reqSkill.name);
      if (skillId && roleProfileId) {
        await client.query(
          `INSERT INTO role_profile_skills (role_profile_id, skill_id, required_level)
           VALUES ($1, $2, $3)
           ON CONFLICT (role_profile_id, skill_id) DO UPDATE SET required_level = EXCLUDED.required_level`,
          [roleProfileId, skillId, reqSkill.level]
        );
      }
    }

    // ==========================================
    // 13. Seed: Sample Resource Skills Matrix
    // ==========================================
    const rachelUserRes = await client.query(`SELECT id FROM users WHERE email = 'rachel@rtdp.com'`);
    if (rachelUserRes.rows.length > 0) {
      const rachelUserId = rachelUserRes.rows[0].id;
      const rachelRes = await client.query(`SELECT id FROM resources WHERE user_id = $1`, [rachelUserId]);
      if (rachelRes.rows.length > 0) {
        const resourceId = rachelRes.rows[0].id;

        const sampleResourceSkills = [
          { skillName: 'Java', current: 3.0, target: 4.0, source: 'self' },
          { skillName: 'Spring Boot', current: 2.5, target: 4.0, source: 'assessment' },
          { skillName: 'REST APIs', current: 3.5, target: 4.0, source: 'self' },
          { skillName: 'SQL', current: 3.0, target: 3.0, source: 'self' },
          { skillName: 'React', current: 2.0, target: 3.0, source: 'training' },
          { skillName: 'Git & Version Control', current: 4.0, target: 4.0, source: 'mentor' },
        ];

        for (const s of sampleResourceSkills) {
          const skillId = skillMap.get(s.skillName);
          if (skillId) {
            await client.query(
              `INSERT INTO resource_skills (resource_id, skill_id, current_level, target_level, source)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (resource_id, skill_id)
               DO UPDATE SET current_level = EXCLUDED.current_level, target_level = EXCLUDED.target_level, source = EXCLUDED.source, last_updated = CURRENT_TIMESTAMP`,
              [resourceId, skillId, s.current, s.target, s.source]
            );
          }
        }
      }
    }

    console.log('[Database] Connected & initialized successfully.');
  } catch (error: any) {
    console.error('[Database Error]', error?.message || error);
  } finally {
    if (client) {
      try {
        client.release();
      } catch { }
    }
  }
};

// Run directly if invoked as standalone script
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

