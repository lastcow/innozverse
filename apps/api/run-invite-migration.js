const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '25060'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(config);

async function runMigration() {
  try {
    const sql = fs.readFileSync('migrations/004_add_invite_tokens.sql', 'utf8');
    await pool.query(sql);
    console.log('✅ Migration 004_add_invite_tokens.sql completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
