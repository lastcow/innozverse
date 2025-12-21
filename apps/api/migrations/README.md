# Database Migrations

This directory contains SQL migration files for the innozverse database.

## Running Migrations

Currently, migrations must be run manually:

```bash
# Connect to the database
psql postgresql://doadmin:password@host:25060/dev?sslmode=require

# Run a migration
\i migrations/001_create_users_table.sql
```

## Migration Naming Convention

Files are named: `{number}_{description}.sql`

Example: `001_create_users_table.sql`

## Future: Automated Migrations

Consider adding a migration tool like:
- `node-pg-migrate`
- `knex`
- `prisma`

## Current Migrations

- `001_create_users_table.sql` - Users table with authentication fields (email/password + OAuth support)
- `002_create_oauth_providers_table.sql` - OAuth providers table for Google and GitHub linking
