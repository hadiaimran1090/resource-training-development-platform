import app from '../src/app.js';

// Seeding is handled via migration script or explicitly enabled via SEED_ON_START
if (process.env.SEED_ON_START === 'true') {
  import('../src/database/seed.js')
    .then(({ seedDatabase }) => seedDatabase())
    .catch((err) => {
      console.error('[Serverless] Database init warning:', err?.message || err);
    });
}

export default app;
