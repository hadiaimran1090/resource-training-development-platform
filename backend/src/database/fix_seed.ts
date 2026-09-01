import { pool } from '../config/db.js';

export const fixPractices = async () => {
  const regionByCode = new Map<string, number>();
  const regionRows = (await pool.query(`SELECT id, code FROM regions`)).rows;
  for (const row of regionRows) regionByCode.set(row.code, row.id);

  const usersByEmail = new Map<string, number>();
  const userRows = (await pool.query(`SELECT id, email FROM users`)).rows;
  for (const row of userRows) usersByEmail.set(row.email, row.id);

  const mappings = [
    { regionCode: 'APAC', practiceNames: ['Software Engineering', 'Data & Analytics'], leadEmail: 'sarah@rtdp.com' },
    { regionCode: 'VSI', practiceNames: ['Quality Assurance'], leadEmail: 'michael@rtdp.com' },
    { regionCode: 'KSA', practiceNames: ['Data & Analytics'], leadEmail: 'sarah@rtdp.com' },
    { regionCode: 'UAE', practiceNames: ['DevOps & Cloud'], leadEmail: 'sarah@rtdp.com' },
  ];

  for (const mapping of mappings) {
    const regionId = regionByCode.get(mapping.regionCode);
    if (!regionId) continue;

    const leadUserId = mapping.leadEmail ? usersByEmail.get(mapping.leadEmail) ?? null : null;
    for (const practiceName of mapping.practiceNames) {
      await pool.query(
        `UPDATE practices SET region_id = $1, lead_user_id = $2 WHERE name = $3`,
        [regionId, leadUserId, practiceName]
      );
    }
  }

  console.log('[FixSeed] practices regional mapping fixed for one region to many practices.');
};

fixPractices().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
