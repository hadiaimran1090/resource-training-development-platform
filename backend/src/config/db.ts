import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/rtdp_db';

const isProduction =
  process.env.NODE_ENV === 'production' ||
  !!process.env.VERCEL ||
  connectionString.includes('sslmode=') ||
  connectionString.includes('neon.tech');

export const pool = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Helper to provide clear guidance for PostgreSQL connection issues
export const handlePgError = (error: any) => {
  if (error?.code === '28P01') {
    console.error(
      '[PostgreSQL Error 28P01] Password authentication failed.'
    );
  } else if (error?.code === '3D000') {
    console.error(
      '[PostgreSQL Error 3D000] Database does not exist.'
    );
  } else if (error?.code === 'ECONNREFUSED') {
    console.error(
      '[PostgreSQL Connection Error] Could not connect to database host.'
    );
  } else {
    console.error('[Database Connection Error]', error?.message || error);
  }
};

// Test database connection function
export const checkDbConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch (error: any) {
    handlePgError(error);
    return false;
  }
};

