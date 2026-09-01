import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Local & Neon Cloud PostgreSQL Connection Strings
const localDbUrl = process.env.DATABASE_URL;
const neonDbUrl = process.env.DATABASE_URL_NEON;

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

    // 0. Ensure DDL Schema Tables & Migration Columns Exist on Neon
    await neonClient.query(`
      CREATE TABLE IF NOT EXISTS region_practices (
        region_id INT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
        practice_id INT NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (region_id, practice_id)
      );

      CREATE TABLE IF NOT EXISTS bench_records (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        start_date DATE NOT NULL DEFAULT CURRENT_DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE resources ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30);
      ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assigned_by_user_id INT REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE bench_records DROP COLUMN IF EXISTS reason;
    `);

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

    // 3.5 Region-Practices Junction Table
    const regPracRes = await localClient.query(`SELECT * FROM region_practices`);
    for (const rp of regPracRes.rows) {
      await neonClient.query(
        `INSERT INTO region_practices (region_id, practice_id, created_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (region_id, practice_id) DO NOTHING`,
        [rp.region_id, rp.practice_id, rp.created_at || new Date()]
      );
    }
    console.log(`Migrated ${regPracRes.rows.length} region_practices junction links.`);

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

    // 6. Resources (Including phone_number)
    const resRes = await localClient.query(`SELECT * FROM resources`);
    for (const r of resRes.rows) {
      await neonClient.query(
        `INSERT INTO resources (user_id, region_id, practice_id, regional_lead_id, phone_number, designation, experience_years, current_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (user_id) DO UPDATE SET
           region_id = EXCLUDED.region_id,
           practice_id = EXCLUDED.practice_id,
           regional_lead_id = EXCLUDED.regional_lead_id,
           phone_number = EXCLUDED.phone_number,
           designation = EXCLUDED.designation,
           experience_years = EXCLUDED.experience_years,
           current_status = EXCLUDED.current_status,
           updated_at = EXCLUDED.updated_at`,
        [r.user_id, r.region_id, r.practice_id, r.regional_lead_id, r.phone_number || null, r.designation, r.experience_years, r.current_status, r.created_at, r.updated_at]
      );
    }
    console.log(`Migrated ${resRes.rows.length} resources.`);
    await neonClient.query(`SELECT setval('resources_id_seq', (SELECT COALESCE(MAX(id), 1) FROM resources))`);

    // 7. Bench History Records
    const benchRes = await localClient.query(`SELECT * FROM bench_records`);
    for (const b of benchRes.rows) {
      await neonClient.query(
        `INSERT INTO bench_records (id, user_id, start_date, end_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           start_date = EXCLUDED.start_date,
           end_date = EXCLUDED.end_date,
           updated_at = EXCLUDED.updated_at`,
        [b.id, b.user_id, b.start_date, b.end_date, b.created_at, b.updated_at]
      );
    }
    console.log(`Migrated ${benchRes.rows.length} bench_records.`);
    await neonClient.query(`SELECT setval('bench_records_id_seq', (SELECT COALESCE(MAX(id), 1) FROM bench_records))`);

    // 8. Assignments (Including assigned_by_user_id)
    const asgRes = await localClient.query(`SELECT * FROM assignments`);
    for (const a of asgRes.rows) {
      const resCheck = await neonClient.query(`SELECT id FROM resources WHERE id = $1`, [a.resource_id]);
      if (resCheck.rows.length > 0) {
        await neonClient.query(
          `INSERT INTO assignments (id, resource_id, assigned_by_user_id, client_name, project_name, start_date, end_date, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET
             assigned_by_user_id = EXCLUDED.assigned_by_user_id,
             client_name = EXCLUDED.client_name,
             project_name = EXCLUDED.project_name,
             status = EXCLUDED.status,
             updated_at = EXCLUDED.updated_at`,
          [a.id, a.resource_id, a.assigned_by_user_id || null, a.client_name, a.project_name, a.start_date, a.end_date, a.status, a.created_at, a.updated_at]
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
