import { FastifyInstance } from 'fastify';
import { pool } from '../../db';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  CreateProductCategoryRequest,
  UpdateProductCategoryRequest,
  CreateProductTemplateRequest,
  UpdateProductTemplateRequest,
  createProductCategoryRequestSchema,
  updateProductCategoryRequestSchema,
  createProductTemplateRequestSchema,
  updateProductTemplateRequestSchema,
  addProductColorRequestSchema,
} from '@innozverse/shared';

interface IdParams {
  id: string;
}

interface CategorySlugParams {
  slug: string;
}

interface ListQuery {
  page?: number;
  limit?: number;
  is_active?: boolean;
  category_id?: string;
  search?: string;
}

interface ColorIdParams extends IdParams {
  colorId: string;
}

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function catalogRoutes(fastify: FastifyInstance) {
  // ==================== PUBLIC CATALOG ROUTES ====================

  // List all active categories (public)
  fastify.get<{ Querystring: ListQuery }>(
    '/catalog/categories',
    async (request, reply) => {
      try {
        const result = await pool.query(
          `SELECT id, name, slug, description, icon, color, display_order
           FROM product_categories
           WHERE is_active = true
           ORDER BY display_order ASC, name ASC`
        );

        return reply.send({
          status: 'ok',
          data: { categories: result.rows },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch categories',
          statusCode: 500,
        });
      }
    }
  );

  // List products with optional filtering (public)
  fastify.get<{ Querystring: ListQuery }>(
    '/catalog/products',
    async (request, reply) => {
      try {
        const { page = 1, limit = 20, category_id, search } = request.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE pt.is_active = true';
        const params: (string | number)[] = [];
        let paramCount = 1;

        if (category_id) {
          whereClause += ` AND pt.category_id = $${paramCount}`;
          params.push(category_id);
          paramCount++;
        }

        if (search) {
          whereClause += ` AND (pt.name ILIKE $${paramCount} OR pt.subtitle ILIKE $${paramCount})`;
          params.push(`%${search}%`);
          paramCount++;
        }

        // Get total count
        const countResult = await pool.query(
          `SELECT COUNT(*) FROM product_templates pt ${whereClause}`,
          params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get products with category info and colors
        const query = `
          SELECT
            pt.id, pt.category_id, pt.name, pt.subtitle, pt.description,
            pt.weekly_rate, pt.monthly_rate, pt.deposit_amount,
            pt.specs, pt.screen_size, pt.highlights, pt.includes, pt.image_url,
            pt.is_popular, pt.has_accessories, pt.is_new, pt.display_order,
            pc.name as category_name, pc.slug as category_slug, pc.icon as category_icon, pc.color as category_color,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', pco.id,
                  'color_name', pco.color_name,
                  'hex_code', pco.hex_code,
                  'text_color', pco.text_color,
                  'border_color', pco.border_color
                ) ORDER BY pco.display_order
              ) FILTER (WHERE pco.id IS NOT NULL),
              '[]'
            ) as colors
          FROM product_templates pt
          JOIN product_categories pc ON pt.category_id = pc.id
          LEFT JOIN product_colors pco ON pt.id = pco.product_template_id AND pco.is_active = true
          ${whereClause}
          GROUP BY pt.id, pc.id
          ORDER BY pt.display_order ASC, pt.name ASC
          LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        return reply.send({
          status: 'ok',
          data: {
            products: result.rows,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch products',
          statusCode: 500,
        });
      }
    }
  );

  // Get single product by ID with colors and compatible accessories (public)
  fastify.get<{ Params: IdParams }>(
    '/catalog/products/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;

        // Get product with category and colors
        const productResult = await pool.query(
          `SELECT
            pt.id, pt.category_id, pt.name, pt.subtitle, pt.description,
            pt.weekly_rate, pt.monthly_rate, pt.deposit_amount,
            pt.specs, pt.screen_size, pt.highlights, pt.includes, pt.image_url,
            pt.is_popular, pt.has_accessories, pt.is_new, pt.display_order,
            pt.created_at, pt.updated_at,
            pc.name as category_name, pc.slug as category_slug, pc.icon as category_icon, pc.color as category_color,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', pco.id,
                  'color_name', pco.color_name,
                  'hex_code', pco.hex_code,
                  'text_color', pco.text_color,
                  'border_color', pco.border_color
                )
              ) FILTER (WHERE pco.id IS NOT NULL),
              '[]'
            ) as colors
          FROM product_templates pt
          JOIN product_categories pc ON pt.category_id = pc.id
          LEFT JOIN product_colors pco ON pt.id = pco.product_template_id AND pco.is_active = true
          WHERE pt.id = $1 AND pt.is_active = true
          GROUP BY pt.id, pc.id`,
          [id]
        );

        if (productResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Product not found',
            statusCode: 404,
          });
        }

        const product = productResult.rows[0];

        // Get compatible accessories
        const accessoriesResult = await pool.query(
          `SELECT DISTINCT
            a.id, a.name, a.description, a.weekly_rate, a.monthly_rate, a.deposit_amount, a.image_url,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', ac.id,
                  'color_name', ac.color_name,
                  'hex_code', ac.hex_code,
                  'text_color', ac.text_color,
                  'border_color', ac.border_color
                )
              ) FILTER (WHERE ac.id IS NOT NULL),
              '[]'
            ) as colors
          FROM accessories a
          JOIN product_accessory_links pal ON a.id = pal.accessory_id AND pal.is_active = true
          LEFT JOIN accessory_colors ac ON a.id = ac.accessory_id AND ac.is_active = true
          WHERE a.is_active = true
            AND (
              pal.product_template_id = $1
              OR (pal.category_id = $2 AND (pal.screen_size_filter IS NULL OR pal.screen_size_filter = $3))
            )
          GROUP BY a.id
          ORDER BY a.display_order ASC, a.name ASC`,
          [id, product.category_id, product.screen_size]
        );

        return reply.send({
          status: 'ok',
          data: {
            product: {
              ...product,
              accessories: accessoriesResult.rows,
            },
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch product',
          statusCode: 500,
        });
      }
    }
  );

  // Get category by slug with products (public)
  fastify.get<{ Params: CategorySlugParams }>(
    '/catalog/categories/:slug',
    async (request, reply) => {
      try {
        const { slug } = request.params;

        const categoryResult = await pool.query(
          `SELECT id, name, slug, description, icon, color, display_order
           FROM product_categories
           WHERE slug = $1 AND is_active = true`,
          [slug]
        );

        if (categoryResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Category not found',
            statusCode: 404,
          });
        }

        const category = categoryResult.rows[0];

        // Get products in this category
        const productsResult = await pool.query(
          `SELECT
            pt.id, pt.name, pt.subtitle, pt.description,
            pt.weekly_rate, pt.monthly_rate, pt.deposit_amount,
            pt.specs, pt.screen_size, pt.highlights, pt.includes, pt.image_url,
            pt.is_popular, pt.has_accessories, pt.is_new, pt.display_order,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', pco.id,
                  'color_name', pco.color_name,
                  'hex_code', pco.hex_code,
                  'text_color', pco.text_color,
                  'border_color', pco.border_color
                ) ORDER BY pco.display_order
              ) FILTER (WHERE pco.id IS NOT NULL),
              '[]'
            ) as colors
          FROM product_templates pt
          LEFT JOIN product_colors pco ON pt.id = pco.product_template_id AND pco.is_active = true
          WHERE pt.category_id = $1 AND pt.is_active = true
          GROUP BY pt.id
          ORDER BY pt.display_order ASC, pt.name ASC`,
          [category.id]
        );

        return reply.send({
          status: 'ok',
          data: {
            category: {
              ...category,
              products: productsResult.rows,
            },
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch category',
          statusCode: 500,
        });
      }
    }
  );

  // ==================== ADMIN CATEGORY ROUTES ====================

  // List all categories with pagination (admin)
  fastify.get<{ Querystring: ListQuery }>(
    '/admin/categories',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { page = 1, limit = 50, is_active } = request.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params: (string | number | boolean)[] = [];
        let paramCount = 1;

        if (is_active !== undefined) {
          whereClause += ` AND is_active = $${paramCount}`;
          params.push(is_active);
          paramCount++;
        }

        const countResult = await pool.query(
          `SELECT COUNT(*) FROM product_categories ${whereClause}`,
          params
        );
        const total = parseInt(countResult.rows[0].count);

        const query = `
          SELECT id, name, slug, description, icon, color, display_order, is_active, created_at, updated_at
          FROM product_categories
          ${whereClause}
          ORDER BY display_order ASC, name ASC
          LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        return reply.send({
          status: 'ok',
          data: {
            categories: result.rows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch categories',
          statusCode: 500,
        });
      }
    }
  );

  // Create category (admin)
  fastify.post<{ Body: CreateProductCategoryRequest }>(
    '/admin/categories',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const validation = createProductCategoryRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const { name, slug, description, icon, color, display_order, is_active } = validation.data;
        const finalSlug = slug || generateSlug(name);

        const result = await pool.query(
          `INSERT INTO product_categories (name, slug, description, icon, color, display_order, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [name, finalSlug, description || null, icon || null, color || null, display_order ?? 0, is_active ?? true]
        );

        return reply.status(201).send({
          status: 'created',
          data: { category: result.rows[0] },
        });
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof Error && error.message.includes('duplicate key')) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Category with this slug already exists',
            statusCode: 409,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create category',
          statusCode: 500,
        });
      }
    }
  );

  // Update category (admin)
  fastify.put<{ Params: IdParams; Body: UpdateProductCategoryRequest }>(
    '/admin/categories/:id',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const validation = updateProductCategoryRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const data = validation.data;
        const updates: string[] = [];
        const params: (string | number | boolean | null)[] = [];
        let paramCount = 1;

        if (data.name !== undefined) {
          updates.push(`name = $${paramCount}`);
          params.push(data.name);
          paramCount++;
        }
        if (data.slug !== undefined) {
          updates.push(`slug = $${paramCount}`);
          params.push(data.slug);
          paramCount++;
        }
        if (data.description !== undefined) {
          updates.push(`description = $${paramCount}`);
          params.push(data.description);
          paramCount++;
        }
        if (data.icon !== undefined) {
          updates.push(`icon = $${paramCount}`);
          params.push(data.icon);
          paramCount++;
        }
        if (data.color !== undefined) {
          updates.push(`color = $${paramCount}`);
          params.push(data.color);
          paramCount++;
        }
        if (data.display_order !== undefined) {
          updates.push(`display_order = $${paramCount}`);
          params.push(data.display_order);
          paramCount++;
        }
        if (data.is_active !== undefined) {
          updates.push(`is_active = $${paramCount}`);
          params.push(data.is_active);
          paramCount++;
        }

        if (updates.length === 0) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'No fields to update',
            statusCode: 400,
          });
        }

        params.push(id);
        const result = await pool.query(
          `UPDATE product_categories
           SET ${updates.join(', ')}, updated_at = NOW()
           WHERE id = $${paramCount}
           RETURNING *`,
          params
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Category not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { category: result.rows[0] },
        });
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof Error && error.message.includes('duplicate key')) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Category with this slug already exists',
            statusCode: 409,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update category',
          statusCode: 500,
        });
      }
    }
  );

  // Delete category (admin)
  fastify.delete<{ Params: IdParams }>(
    '/admin/categories/:id',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;

        // Check for products in this category
        const productsCheck = await pool.query(
          'SELECT id FROM product_templates WHERE category_id = $1 LIMIT 1',
          [id]
        );

        if (productsCheck.rows.length > 0) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Cannot delete category with existing products. Reassign or delete products first.',
            statusCode: 400,
          });
        }

        const result = await pool.query(
          'DELETE FROM product_categories WHERE id = $1 RETURNING id',
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Category not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { message: 'Category deleted successfully' },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete category',
          statusCode: 500,
        });
      }
    }
  );

  // ==================== ADMIN PRODUCT ROUTES ====================

  // List all products with pagination (admin)
  fastify.get<{ Querystring: ListQuery }>(
    '/admin/products',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { page = 1, limit = 20, category_id, is_active, search } = request.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params: (string | number | boolean)[] = [];
        let paramCount = 1;

        if (category_id) {
          whereClause += ` AND pt.category_id = $${paramCount}`;
          params.push(category_id);
          paramCount++;
        }
        if (is_active !== undefined) {
          whereClause += ` AND pt.is_active = $${paramCount}`;
          params.push(is_active);
          paramCount++;
        }
        if (search) {
          whereClause += ` AND (pt.name ILIKE $${paramCount} OR pt.subtitle ILIKE $${paramCount})`;
          params.push(`%${search}%`);
          paramCount++;
        }

        const countResult = await pool.query(
          `SELECT COUNT(*) FROM product_templates pt ${whereClause}`,
          params
        );
        const total = parseInt(countResult.rows[0].count);

        const query = `
          SELECT
            pt.*,
            pc.name as category_name, pc.slug as category_slug,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', pco.id,
                  'color_name', pco.color_name,
                  'hex_code', pco.hex_code,
                  'text_color', pco.text_color,
                  'border_color', pco.border_color,
                  'is_active', pco.is_active
                ) ORDER BY pco.display_order
              ) FILTER (WHERE pco.id IS NOT NULL),
              '[]'
            ) as colors
          FROM product_templates pt
          JOIN product_categories pc ON pt.category_id = pc.id
          LEFT JOIN product_colors pco ON pt.id = pco.product_template_id
          ${whereClause}
          GROUP BY pt.id, pc.id
          ORDER BY pt.display_order ASC, pt.name ASC
          LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        return reply.send({
          status: 'ok',
          data: {
            products: result.rows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch products',
          statusCode: 500,
        });
      }
    }
  );

  // Get single product by ID (admin - includes inactive)
  fastify.get<{ Params: IdParams }>(
    '/admin/products/:id',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;

        const result = await pool.query(
          `SELECT
            pt.*,
            pc.name as category_name, pc.slug as category_slug,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', pco.id,
                  'color_name', pco.color_name,
                  'hex_code', pco.hex_code,
                  'text_color', pco.text_color,
                  'border_color', pco.border_color,
                  'display_order', pco.display_order,
                  'is_active', pco.is_active
                ) ORDER BY pco.display_order
              ) FILTER (WHERE pco.id IS NOT NULL),
              '[]'
            ) as colors
          FROM product_templates pt
          JOIN product_categories pc ON pt.category_id = pc.id
          LEFT JOIN product_colors pco ON pt.id = pco.product_template_id
          WHERE pt.id = $1
          GROUP BY pt.id, pc.id`,
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Product not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { product: result.rows[0] },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch product',
          statusCode: 500,
        });
      }
    }
  );

  // Create product (admin)
  fastify.post<{ Body: CreateProductTemplateRequest }>(
    '/admin/products',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      const client = await pool.connect();
      try {
        const validation = createProductTemplateRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const {
          category_id, name, subtitle, description, weekly_rate, monthly_rate, deposit_amount,
          specs, screen_size, highlights, includes, image_url,
          is_popular, has_accessories, is_new, is_active, display_order, colors,
        } = validation.data;

        await client.query('BEGIN');

        // Create product template
        const productResult = await client.query(
          `INSERT INTO product_templates (
            category_id, name, subtitle, description, weekly_rate, monthly_rate, deposit_amount,
            specs, screen_size, highlights, includes, image_url,
            is_popular, has_accessories, is_new, is_active, display_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          RETURNING *`,
          [
            category_id, name, subtitle || null, description || null,
            weekly_rate, monthly_rate, deposit_amount,
            specs ? JSON.stringify(specs) : null, screen_size || null, highlights || null,
            includes || null, image_url || null,
            is_popular ?? false, has_accessories ?? false, is_new ?? false, is_active ?? true, display_order ?? 0,
          ]
        );

        const product = productResult.rows[0];

        // Add colors if provided
        if (colors && colors.length > 0) {
          for (const color of colors) {
            await client.query(
              `INSERT INTO product_colors (product_template_id, color_name, hex_code, text_color, border_color, display_order)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [product.id, color.color_name, color.hex_code || null, color.text_color || null, color.border_color || null, color.display_order ?? 0]
            );
          }
        }

        await client.query('COMMIT');

        // Fetch complete product with colors
        const completeResult = await pool.query(
          `SELECT
            pt.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', pco.id,
                  'color_name', pco.color_name,
                  'hex_code', pco.hex_code,
                  'text_color', pco.text_color,
                  'border_color', pco.border_color
                ) ORDER BY pco.display_order
              ) FILTER (WHERE pco.id IS NOT NULL),
              '[]'
            ) as colors
          FROM product_templates pt
          LEFT JOIN product_colors pco ON pt.id = pco.product_template_id
          WHERE pt.id = $1
          GROUP BY pt.id`,
          [product.id]
        );

        return reply.status(201).send({
          status: 'created',
          data: { product: completeResult.rows[0] },
        });
      } catch (error: unknown) {
        await client.query('ROLLBACK');
        request.log.error(error);
        if (error instanceof Error && error.message.includes('violates foreign key')) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Invalid category ID',
            statusCode: 400,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create product',
          statusCode: 500,
        });
      } finally {
        client.release();
      }
    }
  );

  // Update product (admin)
  fastify.put<{ Params: IdParams; Body: UpdateProductTemplateRequest }>(
    '/admin/products/:id',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const validation = updateProductTemplateRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const data = validation.data;
        const updates: string[] = [];
        const params: (string | number | boolean | null)[] = [];
        let paramCount = 1;

        const fields: (keyof typeof data)[] = [
          'category_id', 'name', 'subtitle', 'description', 'weekly_rate', 'monthly_rate', 'deposit_amount',
          'screen_size', 'highlights', 'image_url', 'is_popular', 'has_accessories', 'is_new', 'is_active', 'display_order',
        ];

        for (const field of fields) {
          if (data[field] !== undefined) {
            updates.push(`${field} = $${paramCount}`);
            params.push(data[field] as string | number | boolean | null);
            paramCount++;
          }
        }

        if (data.specs !== undefined) {
          updates.push(`specs = $${paramCount}`);
          params.push(JSON.stringify(data.specs));
          paramCount++;
        }

        if (data.includes !== undefined) {
          updates.push(`includes = $${paramCount}`);
          params.push(data.includes as unknown as string);
          paramCount++;
        }

        if (updates.length === 0) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'No fields to update',
            statusCode: 400,
          });
        }

        params.push(id);
        const result = await pool.query(
          `UPDATE product_templates
           SET ${updates.join(', ')}, updated_at = NOW()
           WHERE id = $${paramCount}
           RETURNING *`,
          params
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Product not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { product: result.rows[0] },
        });
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof Error && error.message.includes('violates foreign key')) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Invalid category ID',
            statusCode: 400,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update product',
          statusCode: 500,
        });
      }
    }
  );

  // Delete product (admin)
  fastify.delete<{ Params: IdParams }>(
    '/admin/products/:id',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;

        // Check for active rentals
        const rentalsCheck = await pool.query(
          `SELECT id FROM rentals
           WHERE product_template_id = $1 AND status IN ('pending', 'confirmed', 'active')
           LIMIT 1`,
          [id]
        );

        if (rentalsCheck.rows.length > 0) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Cannot delete product with active rentals',
            statusCode: 400,
          });
        }

        const result = await pool.query(
          'DELETE FROM product_templates WHERE id = $1 RETURNING id',
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Product not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { message: 'Product deleted successfully' },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete product',
          statusCode: 500,
        });
      }
    }
  );

  // ==================== PRODUCT COLOR ROUTES ====================

  // Add color to product (admin)
  fastify.post<{ Params: IdParams; Body: { color_name: string; hex_code?: string; text_color?: string; border_color?: string; display_order?: number } }>(
    '/admin/products/:id/colors',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const validation = addProductColorRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const { color_name, hex_code, text_color, border_color, display_order } = validation.data;

        // Verify product exists
        const productCheck = await pool.query(
          'SELECT id FROM product_templates WHERE id = $1',
          [id]
        );
        if (productCheck.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Product not found',
            statusCode: 404,
          });
        }

        const result = await pool.query(
          `INSERT INTO product_colors (product_template_id, color_name, hex_code, text_color, border_color, display_order)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [id, color_name, hex_code || null, text_color || null, border_color || null, display_order ?? 0]
        );

        return reply.status(201).send({
          status: 'created',
          data: { color: result.rows[0] },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to add color',
          statusCode: 500,
        });
      }
    }
  );

  // Delete color from product (admin)
  fastify.delete<{ Params: ColorIdParams }>(
    '/admin/products/:id/colors/:colorId',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id, colorId } = request.params;

        const result = await pool.query(
          'DELETE FROM product_colors WHERE id = $1 AND product_template_id = $2 RETURNING id',
          [colorId, id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Color not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { message: 'Color deleted successfully' },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete color',
          statusCode: 500,
        });
      }
    }
  );
}
