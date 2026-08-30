import app from '../src/app.js';
import { seedDatabase } from '../src/database/seed.js';

// Run initial database seeding check on cold start
seedDatabase().catch((err) => {
  console.error('[Serverless] Database init warning:', err?.message || err);
});

export default app;
