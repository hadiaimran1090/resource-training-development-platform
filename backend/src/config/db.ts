import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/rtdp_db';

export const pool = new Pool({
  connectionString,
});

// Helper to provide clear guidance for PostgreSQL connection issues
export const handlePgError = (error: any) => {
  if (error?.code === '28P01') {
    console.error(
      '[PostgreSQL Error 28P01] Password authentication failed for user "postgres".'
    );
    console.error(
      'SOLUTION: Open "backend/.env" and set the password in DATABASE_URL to your local PostgreSQL password:'
    );
    console.error(
      'DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/rtdp_db\n'
    );
  } else if (error?.code === '3D000') {
    console.error(
      '[PostgreSQL Error 3D000] Database "rtdp_db" does not exist.'
    );
    console.error(
      'SOLUTION: Run the following SQL command in psql or pgAdmin:'
    );
    console.error('CREATE DATABASE rtdp_db;\n');
  } else if (error?.code === 'ECONNREFUSED') {
    console.error(
      '[PostgreSQL Connection Error] Could not connect to PostgreSQL on localhost:5432.'
    );
    console.error('SOLUTION: Ensure your local PostgreSQL service is running.\n');
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
