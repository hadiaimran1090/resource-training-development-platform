import app from './app.js';
import dotenv from 'dotenv';
import { seedDatabase } from './database/seed.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  seedDatabase();
});
