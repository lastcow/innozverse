-- Diagnostic Query: Check if accessory links are properly configured
-- Run this to verify the product_accessory_links table has data
-- Usage: psql $DATABASE_URL -f check_accessory_links.sql

\echo 'Checking Product Accessory Links Configuration...'
\echo ''

-- Check if product_accessory_links table has data
\echo '=== Accessory Links Count ==='
SELECT COUNT(*) as total_links FROM product_accessory_links;

\echo ''
\echo '=== Links by Category ==='
SELECT
  pc.name as category_name,
  pc.slug as category_slug,
  COUNT(pal.id) as accessory_count
FROM product_categories pc
LEFT JOIN product_accessory_links pal ON pal.category_id = pc.id AND pal.is_active = true
GROUP BY pc.id
ORDER BY pc.display_order;

\echo ''
\echo '=== Links by Product Template ==='
SELECT
  pt.name as product_name,
  COUNT(pal.id) as accessory_count
FROM product_templates pt
LEFT JOIN product_accessory_links pal ON pal.product_template_id = pt.id AND pal.is_active = true
GROUP BY pt.id
ORDER BY pt.display_order;

\echo ''
\echo '=== All Accessory Links (Detailed) ==='
SELECT
  pal.id,
  pt.name as product_name,
  pc.name as category_name,
  a.name as accessory_name,
  pal.screen_size_filter,
  pal.is_active
FROM product_accessory_links pal
LEFT JOIN product_templates pt ON pal.product_template_id = pt.id
LEFT JOIN product_categories pc ON pal.category_id = pc.id
JOIN accessories a ON pal.accessory_id = a.id
ORDER BY
  COALESCE(pc.display_order, 999),
  COALESCE(pt.display_order, 999),
  a.display_order;

\echo ''
\echo '=== Sample Query: Accessories for Surface Pro 11 ==='
SELECT
  a.id,
  a.name,
  a.weekly_rate,
  a.monthly_rate
FROM accessories a
INNER JOIN product_accessory_links pal ON a.id = pal.accessory_id
INNER JOIN product_templates pt ON
  (pal.product_template_id = pt.id)
  OR (pal.category_id = pt.category_id AND (pal.screen_size_filter IS NULL OR pal.screen_size_filter = pt.screen_size))
WHERE pt.name = 'Surface Pro 11'
  AND a.is_active = true
  AND pal.is_active = true;

\echo ''
\echo 'If no accessory links found, run the seed data:'
\echo '  psql $DATABASE_URL -f seed_product_catalog.sql'
\echo ''
