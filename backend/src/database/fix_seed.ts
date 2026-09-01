import { pool } from '../config/db.js';

export const fixPractices = async () => {
  const apac = (await pool.query(`SELECT id FROM regions WHERE code = 'APAC'`)).rows[0]?.id;
  const ksa = (await pool.query(`SELECT id FROM regions WHERE code = 'KSA'`)).rows[0]?.id;
  const uae = (await pool.query(`SELECT id FROM regions WHERE code = 'UAE'`)).rows[0]?.id;
  const vsi = (await pool.query(`SELECT id FROM regions WHERE code = 'VSI'`)).rows[0]?.id;

  const sarah = (await pool.query(`SELECT id FROM users WHERE email = 'sarah@rtdp.com'`)).rows[0]?.id;
  const michael = (await pool.query(`SELECT id FROM users WHERE email = 'michael@rtdp.com'`)).rows[0]?.id;

  if (apac) await pool.query(`UPDATE practices SET region_id = $1, lead_user_id = $2 WHERE name = 'Software Engineering'`, [apac, sarah || null]);
  if (vsi) await pool.query(`UPDATE practices SET region_id = $1, lead_user_id = $2 WHERE name = 'Quality Assurance'`, [vsi, michael || null]);
  if (ksa) await pool.query(`UPDATE practices SET region_id = $1, lead_user_id = $2 WHERE name = 'Data & Analytics'`, [ksa, sarah || null]);
  if (uae) await pool.query(`UPDATE practices SET region_id = $1, lead_user_id = $2 WHERE name = 'DevOps & Cloud'`, [uae, sarah || null]);

  console.log('[FixSeed] Practices region_id & lead_user_id updated successfully.');
};

fixPractices().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
