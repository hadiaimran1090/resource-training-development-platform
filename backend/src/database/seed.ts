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

    // 1. Ensure Database Schema Exists (Run schema.sql DDL)
    const schemaPath = path.resolve(process.cwd(), 'src/database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
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

    // 4. Seed Initial Practices
    const practices = ['Software Engineering', 'Quality Assurance', 'Data & Analytics', 'DevOps & Cloud'];
    for (const practiceName of practices) {
      await client.query(
        `INSERT INTO practices (name, is_active, status) VALUES ($1, TRUE, 'active') ON CONFLICT (name) DO NOTHING`,
        [practiceName]
      );
    }

    // 5. Fetch Role, Region, and Practice mappings for User creation
    const rolesRes = await client.query(`SELECT id, name FROM roles`);
    const regionsRes = await client.query(`SELECT id, name FROM regions`);
    const practicesRes = await client.query(`SELECT id, name FROM practices`);

    const roleMap = new Map<string, number>(rolesRes.rows.map((r: any) => [r.name, r.id]));
    const regionMap = new Map<string, number>(regionsRes.rows.map((r: any) => [r.name, r.id]));
    const practiceMap = new Map<string, number>(practicesRes.rows.map((p: any) => [p.name, p.id]));

    // Default password hash using bcrypt
    const defaultPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@786';
    const commonPasswordHash = await bcrypt.hash(defaultPassword, 10);

    // 6. Seed Default Platform & Demo Users
    const usersToSeed = [
      {
        name: 'System Administrator',
        email: 'admin@rtdp.com',
        employeeId: 'RTDP-ADMIN-001',
        roleNames: ['System Administrator'],
        regionName: 'APAC',
        practiceName: null,
      },
      {
        name: 'Sarah Practice Lead',
        email: 'sarah@rtdp.com',
        employeeId: 'RTDP-PL-001',
        roleNames: ['Practice Lead'],
        regionName: 'APAC',
        practiceName: 'Software Engineering',
      },
      {
        name: 'Rohan Regional Lead',
        email: 'rohan@rtdp.com',
        employeeId: 'RTDP-RL-001',
        roleNames: ['Regional Lead'],
        regionName: 'KSA',
        practiceName: null,
      },
      {
        name: 'Tania Training Manager',
        email: 'tania@rtdp.com',
        employeeId: 'RTDP-TM-001',
        roleNames: ['Training Manager'],
        regionName: 'UAE',
        practiceName: null,
      },
      {
        name: 'Michael Mentor',
        email: 'michael@rtdp.com',
        employeeId: 'RTDP-MNT-001',
        roleNames: ['Mentor', 'Practice Lead'],
        regionName: 'VSI',
        practiceName: 'Quality Assurance',
      },
      {
        name: 'Rachel Resource',
        email: 'rachel@rtdp.com',
        employeeId: 'RTDP-RES-001',
        roleNames: ['Resource'],
        regionName: 'APAC',
        practiceName: 'Software Engineering',
      },
      {
        name: 'Marcus Management',
        email: 'marcus@rtdp.com',
        employeeId: 'RTDP-MGMT-001',
        roleNames: ['Management'],
        regionName: 'APAC',
        practiceName: null,
      },
    ];

    for (const u of usersToSeed) {
      const regionId = u.regionName ? regionMap.get(u.regionName) : null;
      const practiceId = u.practiceName ? practiceMap.get(u.practiceName) : null;

      let userId: number;
      const userCheck = await client.query(`SELECT id FROM users WHERE email = $1`, [u.email]);
      if (userCheck.rows.length === 0) {
        const userInsertRes = await client.query(
          `INSERT INTO users (name, email, password_hash, employee_id, region_id, practice_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'active')
           RETURNING id`,
          [
            u.name,
            u.email,
            commonPasswordHash,
            u.employeeId,
            regionId || null,
            practiceId || null,
          ]
        );
        userId = userInsertRes.rows[0].id;
      } else {
        userId = userCheck.rows[0].id;
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

      // 7. Seed Sample Resource Profile & Assignments for Resource Role Users
      if (u.roleNames.includes('Resource')) {
        const regionalLeadCheck = await client.query(
          `SELECT id FROM users WHERE email = 'rohan@rtdp.com'`
        );
        const regionalLeadId = regionalLeadCheck.rows[0]?.id || null;

        const resInsert = await client.query(
          `INSERT INTO resources (user_id, region_id, practice_id, regional_lead_id, designation, experience_years, current_status)
           VALUES ($1, $2, $3, $4, 'Senior Software Engineer', 3.5, 'bench')
           ON CONFLICT (user_id) DO NOTHING
           RETURNING id`,
          [userId, regionId || null, practiceId || null, regionalLeadId]
        );

        let resourceId = resInsert.rows[0]?.id;
        if (!resourceId) {
          const rFind = await client.query(`SELECT id FROM resources WHERE user_id = $1`, [userId]);
          resourceId = rFind.rows[0]?.id;
        }

        if (resourceId) {
          const asgCheck = await client.query(`SELECT id FROM assignments WHERE resource_id = $1`, [resourceId]);
          if (asgCheck.rows.length === 0) {
            await client.query(
              `INSERT INTO assignments (resource_id, client_name, project_name, start_date, status)
               VALUES ($1, 'Acme Corp', 'Fintech Platform Modernization', '2026-01-15', 'active')`,
              [resourceId]
            );
          }
        }
      }
    }

    // 8. Link Practice Leads in Practices table
    const sarahUser = await client.query(`SELECT id FROM users WHERE email = 'sarah@rtdp.com'`);
    if (sarahUser.rows.length > 0 && practiceMap.has('Software Engineering')) {
      await client.query(
        `UPDATE practices SET lead_user_id = $1 WHERE id = $2 AND lead_user_id IS NULL`,
        [sarahUser.rows[0].id, practiceMap.get('Software Engineering')]
      );
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
