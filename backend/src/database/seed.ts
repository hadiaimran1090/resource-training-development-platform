import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export const seedDatabase = async () => {
  let client;
  try {
    client = await pool.connect();

    // 1. Run schema.sql (Creates tables)
    const schemaPath = path.resolve(process.cwd(), 'src/database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
    }

    // 2. Run seed.sql (Static data: Roles, Regions)
    const seedSqlPath = path.resolve(process.cwd(), 'src/database/seed.sql');
    if (fs.existsSync(seedSqlPath)) {
      const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
      await client.query(seedSql);
    }

    // 3. Dynamic Admin User Creation with Password Hashing
    const adminEmail = 'admin@rtdp.com';
    const adminEmployeeId = 'RTDP-ADMIN-001';
    const rawPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@786';

    const roleRes = await client.query(`SELECT id FROM roles WHERE name = $1`, ['System Administrator']);
    const regionRes = await client.query(`SELECT id FROM regions WHERE name = $1`, ['APAC']);

    const adminRoleId = roleRes.rows[0]?.id;
    const adminRegionId = regionRes.rows[0]?.id;

    if (adminRoleId && adminRegionId) {
      const userCheck = await client.query(`SELECT id FROM users WHERE email = $1`, [adminEmail]);

      if (userCheck.rows.length === 0) {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

        await client.query(
          `INSERT INTO users (name, email, password_hash, employee_id, role_id, region_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'active')`,
          [
            'System Administrator',
            adminEmail,
            passwordHash,
            adminEmployeeId,
            adminRoleId,
            adminRegionId,
          ]
        );
      }
    }

    console.log('[Database] Connected & initialized successfully.');
  } catch (error: any) {
    console.error('[Database Error]', error?.message || error);
  } finally {
    if (client) {
      try {
        client.release();
      } catch {}
    }
  }
};

// Run directly if invoked as standalone script
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
