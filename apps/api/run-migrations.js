const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '25060'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute migration 001
    console.log('\n📝 Running migration: 001_create_users_table.sql');
    const migration001 = fs.readFileSync(
      path.join(__dirname, 'migrations', '001_create_users_table.sql'),
      'utf8'
    );
    await client.query(migration001);
    console.log('✅ Migration 001 completed');

    // Read and execute migration 002
    console.log('\n📝 Running migration: 002_create_oauth_providers_table.sql');
    const migration002 = fs.readFileSync(
      path.join(__dirname, 'migrations', '002_create_oauth_providers_table.sql'),
      'utf8'
    );
    await client.query(migration002);
    console.log('✅ Migration 002 completed');

    console.log('\n🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
