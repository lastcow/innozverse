import { FastifyInstance } from 'fastify';
import { pool } from '../../db';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  CreateAccessoryRequest,
  UpdateAccessoryRequest,
  CreateAccessoryLinkRequest,
  createAccessoryRequestSchema,
  updateAccessoryRequestSchema,
  createAccessoryLinkRequestSchema,
  addProductColorRequestSchema,
} from '@innozverse/shared';

interface IdParams {
  id: string;
}

interface ColorIdParams extends IdParams {
  colorId: string;
}

interface LinkIdParams {
  linkId: string;
}

interface ListQuery {
  page?: number;
  limit?: number;
  is_active?: boolean;
  search?: string;
}

export async function accessoryRoutes(fastify: FastifyInstance) {
  // ==================== PUBLIC ACCESSORY ROUTES ====================

  // List all active accessories (public)
  fastify.get<{ Querystring: ListQuery }>(
    '/catalog/accessories',
    async (request, reply) => {
      try {
        const result = await pool.query(
          `SELECT
            a.id, a.name, a.description, a.weekly_rate, a.monthly_rate, a.deposit_amount, a.image_url, a.display_order,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', ac.id,
                  'color_name', ac.color_name,
                  'hex_code', ac.hex_code,
                  'text_color', ac.text_color,
                  'border_color', ac.border_color
                ) ORDER BY ac.display_order
              ) FILTER (WHERE ac.id IS NOT NULL),
              '[]'
            ) as colors
          FROM accessories a
          LEFT JOIN accessory_colors ac ON a.id = ac.accessory_id AND ac.is_active = true
          WHERE a.is_active = true
          GROUP BY a.id
          ORDER BY a.display_order ASC, a.name ASC`
        );

        return reply.send({
          status: 'ok',
          data: { accessories: result.rows },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch accessories',
          statusCode: 500,
        });
      }
    }
  );

  // Get accessory by ID (public)
  fastify.get<{ Params: IdParams }>(
    '/catalog/accessories/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;

        const result = await pool.query(
          `SELECT
            a.id, a.name, a.description, a.weekly_rate, a.monthly_rate, a.deposit_amount, a.image_url, a.display_order,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', ac.id,
                  'color_name', ac.color_name,
                  'hex_code', ac.hex_code,
                  'text_color', ac.text_color,
                  'border_color', ac.border_color
                ) ORDER BY ac.display_order
              ) FILTER (WHERE ac.id IS NOT NULL),
              '[]'
            ) as colors
          FROM accessories a
          LEFT JOIN accessory_colors ac ON a.id = ac.accessory_id AND ac.is_active = true
          WHERE a.id = $1 AND a.is_active = true
          GROUP BY a.id`,
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Accessory not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { accessory: result.rows[0] },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch accessory',
          statusCode: 500,
        });
      }
    }
  );

  // ==================== ADMIN ACCESSORY ROUTES ====================

  // List all accessories with pagination (admin)
  fastify.get<{ Querystring: ListQuery }>(
    '/admin/accessories',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { page = 1, limit = 50, is_active, search } = request.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params: (string | number | boolean)[] = [];
        let paramCount = 1;

        if (is_active !== undefined) {
          whereClause += ` AND a.is_active = $${paramCount}`;
          params.push(is_active);
          paramCount++;
        }

        if (search) {
          whereClause += ` AND (a.name ILIKE $${paramCount} OR a.description ILIKE $${paramCount})`;
          params.push(`%${search}%`);
          paramCount++;
        }

        const countResult = await pool.query(
          `SELECT COUNT(*) FROM accessories a ${whereClause}`,
          params
        );
        const total = parseInt(countResult.rows[0].count);

        const query = `
          SELECT
            a.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', ac.id,
                  'color_name', ac.color_name,
                  'hex_code', ac.hex_code,
                  'text_color', ac.text_color,
                  'border_color', ac.border_color,
                  'is_active', ac.is_active
                ) ORDER BY ac.display_order
              ) FILTER (WHERE ac.id IS NOT NULL),
              '[]'
            ) as colors
          FROM accessories a
          LEFT JOIN accessory_colors ac ON a.id = ac.accessory_id
          ${whereClause}
          GROUP BY a.id
          ORDER BY a.display_order ASC, a.name ASC
          LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        return reply.send({
          status: 'ok',
          data: {
            accessories: result.rows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch accessories',
          statusCode: 500,
        });
      }
    }
  );

  // Get accessory by ID (admin - includes inactive)
  fastify.get<{ Params: IdParams }>(
    '/admin/accessories/:id',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;

        const result = await pool.query(
          `SELECT
            a.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', ac.id,
                  'color_name', ac.color_name,
                  'hex_code', ac.hex_code,
                  'text_color', ac.text_color,
                  'border_color', ac.border_color,
                  'display_order', ac.display_order,
                  'is_active', ac.is_active
                ) ORDER BY ac.display_order
              ) FILTER (WHERE ac.id IS NOT NULL),
              '[]'
            ) as colors,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', pal.id,
                  'product_template_id', pal.product_template_id,
                  'category_id', pal.category_id,
                  'screen_size_filter', pal.screen_size_filter,
                  'product_name', pt.name,
                  'category_name', pc.name
                )
              ) FILTER (WHERE pal.id IS NOT NULL),
              '[]'
            ) as links
          FROM accessories a
          LEFT JOIN accessory_colors ac ON a.id = ac.accessory_id
          LEFT JOIN product_accessory_links pal ON a.id = pal.accessory_id AND pal.is_active = true
          LEFT JOIN product_templates pt ON pal.product_template_id = pt.id
          LEFT JOIN product_categories pc ON pal.category_id = pc.id
          WHERE a.id = $1
          GROUP BY a.id`,
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Accessory not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { accessory: result.rows[0] },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch accessory',
          statusCode: 500,
        });
      }
    }
  );

  // Create accessory (admin)
  fastify.post<{ Body: CreateAccessoryRequest }>(
    '/admin/accessories',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      const client = await pool.connect();
      try {
        const validation = createAccessoryRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const {
          name, description, weekly_rate, monthly_rate, deposit_amount,
          image_url, is_active, display_order, colors,
        } = validation.data;

        await client.query('BEGIN');

        // Create accessory
        const accessoryResult = await client.query(
          `INSERT INTO accessories (name, description, weekly_rate, monthly_rate, deposit_amount, image_url, is_active, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [name, description || null, weekly_rate, monthly_rate, deposit_amount, image_url || null, is_active ?? true, display_order ?? 0]
        );

        const accessory = accessoryResult.rows[0];

        // Add colors if provided
        if (colors && colors.length > 0) {
          for (const color of colors) {
            await client.query(
              `INSERT INTO accessory_colors (accessory_id, color_name, hex_code, text_color, border_color, display_order)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [accessory.id, color.color_name, color.hex_code || null, color.text_color || null, color.border_color || null, color.display_order ?? 0]
            );
          }
        }

        await client.query('COMMIT');

        // Fetch complete accessory with colors
        const completeResult = await pool.query(
          `SELECT
            a.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', ac.id,
                  'color_name', ac.color_name,
                  'hex_code', ac.hex_code,
                  'text_color', ac.text_color,
                  'border_color', ac.border_color
                ) ORDER BY ac.display_order
              ) FILTER (WHERE ac.id IS NOT NULL),
              '[]'
            ) as colors
          FROM accessories a
          LEFT JOIN accessory_colors ac ON a.id = ac.accessory_id
          WHERE a.id = $1
          GROUP BY a.id`,
          [accessory.id]
        );

        return reply.status(201).send({
          status: 'created',
          data: { accessory: completeResult.rows[0] },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create accessory',
          statusCode: 500,
        });
      } finally {
        client.release();
      }
    }
  );

  // Update accessory (admin)
  fastify.put<{ Params: IdParams; Body: UpdateAccessoryRequest }>(
    '/admin/accessories/:id',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const validation = updateAccessoryRequestSchema.safeParse(request.body);
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
          'name', 'description', 'weekly_rate', 'monthly_rate', 'deposit_amount',
          'image_url', 'is_active', 'display_order',
        ];

        for (const field of fields) {
          if (data[field] !== undefined) {
            updates.push(`${field} = $${paramCount}`);
            params.push(data[field] as string | number | boolean | null);
            paramCount++;
          }
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
          `UPDATE accessories
           SET ${updates.join(', ')}, updated_at = NOW()
           WHERE id = $${paramCount}
           RETURNING *`,
          params
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Accessory not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { accessory: result.rows[0] },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update accessory',
          statusCode: 500,
        });
      }
    }
  );

  // Delete accessory (admin)
  fastify.delete<{ Params: IdParams }>(
    '/admin/accessories/:id',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;

        // Check for active rental accessories
        const rentalsCheck = await pool.query(
          `SELECT ra.id FROM rental_accessories ra
           JOIN rentals r ON ra.rental_id = r.id
           WHERE ra.accessory_id = $1 AND r.status IN ('pending', 'confirmed', 'active')
           LIMIT 1`,
          [id]
        );

        if (rentalsCheck.rows.length > 0) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Cannot delete accessory with active rentals',
            statusCode: 400,
          });
        }

        const result = await pool.query(
          'DELETE FROM accessories WHERE id = $1 RETURNING id',
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Accessory not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { message: 'Accessory deleted successfully' },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete accessory',
          statusCode: 500,
        });
      }
    }
  );

  // ==================== ACCESSORY COLOR ROUTES ====================

  // Add color to accessory (admin)
  fastify.post<{ Params: IdParams; Body: { color_name: string; hex_code?: string; text_color?: string; border_color?: string; display_order?: number } }>(
    '/admin/accessories/:id/colors',
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

        // Verify accessory exists
        const accessoryCheck = await pool.query(
          'SELECT id FROM accessories WHERE id = $1',
          [id]
        );
        if (accessoryCheck.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Accessory not found',
            statusCode: 404,
          });
        }

        const result = await pool.query(
          `INSERT INTO accessory_colors (accessory_id, color_name, hex_code, text_color, border_color, display_order)
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

  // Delete color from accessory (admin)
  fastify.delete<{ Params: ColorIdParams }>(
    '/admin/accessories/:id/colors/:colorId',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id, colorId } = request.params;

        const result = await pool.query(
          'DELETE FROM accessory_colors WHERE id = $1 AND accessory_id = $2 RETURNING id',
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

  // ==================== ACCESSORY LINK ROUTES ====================

  // Create accessory link (admin)
  fastify.post<{ Body: CreateAccessoryLinkRequest }>(
    '/admin/accessory-links',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const validation = createAccessoryLinkRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const { product_template_id, category_id, accessory_id, screen_size_filter } = validation.data;

        // Verify accessory exists
        const accessoryCheck = await pool.query(
          'SELECT id FROM accessories WHERE id = $1',
          [accessory_id]
        );
        if (accessoryCheck.rows.length === 0) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Invalid accessory ID',
            statusCode: 400,
          });
        }

        // Check for duplicate link
        let duplicateCheck;
        if (product_template_id) {
          duplicateCheck = await pool.query(
            'SELECT id FROM product_accessory_links WHERE product_template_id = $1 AND accessory_id = $2',
            [product_template_id, accessory_id]
          );
        } else {
          duplicateCheck = await pool.query(
            'SELECT id FROM product_accessory_links WHERE category_id = $1 AND accessory_id = $2 AND (screen_size_filter = $3 OR (screen_size_filter IS NULL AND $3 IS NULL))',
            [category_id, accessory_id, screen_size_filter || null]
          );
        }

        if (duplicateCheck.rows.length > 0) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'This accessory link already exists',
            statusCode: 409,
          });
        }

        const result = await pool.query(
          `INSERT INTO product_accessory_links (product_template_id, category_id, accessory_id, screen_size_filter)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [product_template_id || null, category_id || null, accessory_id, screen_size_filter || null]
        );

        return reply.status(201).send({
          status: 'created',
          data: { link: result.rows[0] },
        });
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof Error && error.message.includes('violates foreign key')) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Invalid product or category ID',
            statusCode: 400,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create accessory link',
          statusCode: 500,
        });
      }
    }
  );

  // Delete accessory link (admin)
  fastify.delete<{ Params: LinkIdParams }>(
    '/admin/accessory-links/:linkId',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { linkId } = request.params;

        const result = await pool.query(
          'DELETE FROM product_accessory_links WHERE id = $1 RETURNING id',
          [linkId]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Link not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { message: 'Accessory link deleted successfully' },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete accessory link',
          statusCode: 500,
        });
      }
    }
  );

  // List accessory links (admin)
  fastify.get<{ Querystring: { accessory_id?: string; product_template_id?: string; category_id?: string } }>(
    '/admin/accessory-links',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { accessory_id, product_template_id, category_id } = request.query;

        let whereClause = 'WHERE pal.is_active = true';
        const params: string[] = [];
        let paramCount = 1;

        if (accessory_id) {
          whereClause += ` AND pal.accessory_id = $${paramCount}`;
          params.push(accessory_id);
          paramCount++;
        }
        if (product_template_id) {
          whereClause += ` AND pal.product_template_id = $${paramCount}`;
          params.push(product_template_id);
          paramCount++;
        }
        if (category_id) {
          whereClause += ` AND pal.category_id = $${paramCount}`;
          params.push(category_id);
          paramCount++;
        }

        const result = await pool.query(
          `SELECT
            pal.*,
            a.name as accessory_name,
            pt.name as product_name,
            pc.name as category_name
          FROM product_accessory_links pal
          JOIN accessories a ON pal.accessory_id = a.id
          LEFT JOIN product_templates pt ON pal.product_template_id = pt.id
          LEFT JOIN product_categories pc ON pal.category_id = pc.id
          ${whereClause}
          ORDER BY a.name, pt.name, pc.name`,
          params
        );

        return reply.send({
          status: 'ok',
          data: { links: result.rows },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch accessory links',
          statusCode: 500,
        });
      }
    }
  );
}
