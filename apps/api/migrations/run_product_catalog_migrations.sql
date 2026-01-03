-- Combined migration script for Product Catalog System
-- Run this script to apply all product catalog migrations (010-013)
-- Usage: psql $DATABASE_URL -f run_product_catalog_migrations.sql

\echo 'Starting Product Catalog Migrations...'

\echo ''
\echo '=== Migration 010: Create Product Catalog Tables ==='
\i 010_create_product_catalog_tables.sql

\echo ''
\echo '=== Migration 011: Create Inventory Items Table ==='
\i 011_create_inventory_items_table.sql

\echo ''
\echo '=== Migration 012: Enhance Rentals Table ==='
\i 012_enhance_rentals_table.sql

\echo ''
\echo '=== Migration 013: Create Pricing Modifiers ==='
\i 013_create_pricing_modifiers.sql

\echo ''
\echo 'Product Catalog Migrations Complete!'
\echo 'New tables created:'
\echo '  - product_categories'
\echo '  - product_templates'
\echo '  - product_colors'
\echo '  - accessories'
\echo '  - accessory_colors'
\echo '  - product_accessory_links'
\echo '  - inventory_items'
\echo '  - rental_accessories'
\echo '  - pricing_modifiers'
\echo ''
\echo 'Enhanced tables:'
\echo '  - rentals (new columns for product-based rentals)'
\echo '  - users (student status columns)'
