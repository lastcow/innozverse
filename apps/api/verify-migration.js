const { Client } = require('pg');
require('dotenv').config();

async function verifyMigration() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '25060'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check if role column exists
    const columnCheck = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'role'
    `);

    if (columnCheck.rows.length > 0) {
      console.log('✓ Role column exists');
      console.log('  Column details:', columnCheck.rows[0]);
    } else {
      console.log('✗ Role column does NOT exist');
    }

    // Check if user_role type exists
    const typeCheck = await client.query(`
      SELECT typname, enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE typname = 'user_role'
      ORDER BY enumlabel
    `);

    if (typeCheck.rows.length > 0) {
      console.log('\n✓ user_role ENUM type exists');
      console.log('  Available roles:');
      typeCheck.rows.forEach(row => {
        console.log('   -', row.enumlabel);
      });
    } else {
      console.log('\n✗ user_role ENUM type does NOT exist');
    }

    // Check if index exists
    const indexCheck = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'users' AND indexname = 'idx_users_role'
    `);

    if (indexCheck.rows.length > 0) {
      console.log('\n✓ Index idx_users_role exists');
    } else {
      console.log('\n✗ Index idx_users_role does NOT exist');
    }

    // Count users by role
    const userCount = await client.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY role
    `);

    console.log('\n✓ Users by role:');
    if (userCount.rows.length > 0) {
      userCount.rows.forEach(row => {
        console.log(`   ${row.role}: ${row.count} user(s)`);
      });
    } else {
      console.log('   No users found');
    }

  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyMigration();
