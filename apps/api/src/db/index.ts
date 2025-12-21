import dotenv from 'dotenv';
import { Pool, PoolConfig } from 'pg';

// Load environment variables first
dotenv.config();

// Database configuration from environment variables
const config: PoolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '25060'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
};

// Debug: Log connection config (without password)
console.log('Database config:', {
  host: config.host,
  port: config.port,
  database: config.database,
  user: config.user,
  ssl: config.ssl,
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set'
});

// Create the connection pool using individual config (not DATABASE_URL)
export const pool = new Pool(config);

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  await pool.end();
}

// Handle process termination
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});
