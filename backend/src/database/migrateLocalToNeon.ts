import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Local PostgreSQL connection string (from pgAdmin)
const localDbUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/rtdp_db';

// Neon Cloud PostgreSQL connection string
const neonDbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_xBZ8qz4dtSoF@ep-flat-art-b30z9d8j-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const localPool = new Pool({ connectionString: localDbUrl });
const neonPool = new Pool({
  connectionString: neonDbUrl,
  ssl: { rejectUnauthorized: false },
});

export const migrateLocalToNeon = async () => {
  let localClient, neonClient;
  try {
    console.log('Connecting to Local PostgreSQL...');
    localClient = await localPool.connect();
    console.log('Connected to Local PostgreSQL successfully.');

    console.log('Connecting to Neon Cloud PostgreSQL...');
    neonClient = await neonPool.connect();
    console.log('Connected to Neon Cloud PostgreSQL successfully.');

    // 1. Roles
    const rolesRes = await localClient.query(`SELECT * FROM roles`);
    for (const r of rolesRes.rows) {
      await neonClient.query(
        `INSERT INTO roles (id, name, description, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
        [r.id, r.name, r.description, r.created_at]
      );
    }
    console.log(`Migrated ${rolesRes.rows.length} roles.`);
    await neonClient.query(`SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM roles))`);

    // 2. Regions
    const regionsRes = await localClient.query(`SELECT * FROM regions`);
    for (const reg of regionsRes.rows) {
      await neonClient.query(
        `INSERT INTO regions (id, name, code, status, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, status = EXCLUDED.status, is_active = EXCLUDED.is_active`,
        [reg.id, reg.name, reg.code, reg.status, reg.is_active, reg.created_at, reg.updated_at]
      );
    }
    console.log(`Migrated ${regionsRes.rows.length} regions.`);
    await neonClient.query(`SELECT setval('regions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM regions))`);

    // 3. Practices
    const practicesRes = await localClient.query(`SELECT * FROM practices`);
    for (const p of practicesRes.rows) {
      await neonClient.query(
        `INSERT INTO practices (id, name, description, lead_user_id, status, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, status = EXCLUDED.status, is_active = EXCLUDED.is_active`,
        [p.id, p.name, p.description, p.lead_user_id, p.status, p.is_active, p.created_at, p.updated_at]
      );
    }
    console.log(`Migrated ${practicesRes.rows.length} practices.`);
    await neonClient.query(`SELECT setval('practices_id_seq', (SELECT COALESCE(MAX(id), 1) FROM practices))`);

    // 4. Users
    const usersRes = await localClient.query(`SELECT * FROM users`);
    for (const u of usersRes.rows) {
      await neonClient.query(
        `INSERT INTO users (id, name, email, password_hash, employee_id, region_id, practice_id, profile_image_url, status, joining_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           employee_id = EXCLUDED.employee_id,
           region_id = EXCLUDED.region_id,
           practice_id = EXCLUDED.practice_id,
           profile_image_url = EXCLUDED.profile_image_url,
           status = EXCLUDED.status,
           updated_at = EXCLUDED.updated_at`,
        [u.id, u.name, u.email, u.password_hash, u.employee_id, u.region_id, u.practice_id, u.profile_image_url, u.status, u.joining_date, u.created_at, u.updated_at]
      );
    }
    console.log(`Migrated ${usersRes.rows.length} users.`);
    await neonClient.query(`SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users))`);

    // 5. User Roles
    const userRolesRes = await localClient.query(`SELECT * FROM user_roles`);
    for (const ur of userRolesRes.rows) {
      await neonClient.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [ur.user_id, ur.role_id]
      );
    }
    console.log(`Migrated ${userRolesRes.rows.length} user_roles.`);

    // 6. Resources
    const resRes = await localClient.query(`SELECT * FROM resources`);
    for (const r of resRes.rows) {
      await neonClient.query(
        `INSERT INTO resources (id, user_id, region_id, practice_id, regional_lead_id, designation, experience_years, current_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (user_id) DO UPDATE SET
           designation = EXCLUDED.designation,
           experience_years = EXCLUDED.experience_years,
           current_status = EXCLUDED.current_status,
           updated_at = EXCLUDED.updated_at`,
        [r.id, r.user_id, r.region_id, r.practice_id, r.regional_lead_id, r.designation, r.experience_years, r.current_status, r.created_at, r.updated_at]
      );
    }
    console.log(`Migrated ${resRes.rows.length} resources.`);
    await neonClient.query(`SELECT setval('resources_id_seq', (SELECT COALESCE(MAX(id), 1) FROM resources))`);

    // 7. Assignments
    const asgRes = await localClient.query(`SELECT * FROM assignments`);
    for (const a of asgRes.rows) {
      const resCheck = await neonClient.query(`SELECT id FROM resources WHERE id = $1`, [a.resource_id]);
      if (resCheck.rows.length > 0) {
        await neonClient.query(
          `INSERT INTO assignments (id, resource_id, client_name, project_name, start_date, end_date, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             client_name = EXCLUDED.client_name,
             project_name = EXCLUDED.project_name,
             status = EXCLUDED.status,
             updated_at = EXCLUDED.updated_at`,
          [a.id, a.resource_id, a.client_name, a.project_name, a.start_date, a.end_date, a.status, a.created_at, a.updated_at]
        );
      }
    }
    console.log(`Migrated ${asgRes.rows.length} assignments.`);
    await neonClient.query(`SELECT setval('assignments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM assignments))`);

    console.log('\n======================================================');
    console.log(' SUCCESS: All local pgAdmin database data successfully migrated to Neon Cloud PostgreSQL!');
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
