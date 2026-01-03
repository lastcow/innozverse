import { FastifyInstance } from 'fastify';
import { pool } from '../../db';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  CreateInventoryItemRequest,
  UpdateInventoryItemRequest,
  createInventoryItemRequestSchema,
  updateInventoryItemRequestSchema,
} from '@innozverse/shared';

interface IdParams {
  id: string;
}

interface ListQuery {
  page?: number;
  limit?: number;
  product_template_id?: string;
  accessory_id?: string;
  status?: string;
  condition?: string;
  color?: string;
  search?: string;
}

interface AvailabilityQuery {
  product_template_id?: string;
  accessory_id?: string;
  color?: string;
  start_date: string;
  end_date: string;
}

export async function inventoryRoutes(fastify: FastifyInstance) {
  // ==================== ADMIN INVENTORY ROUTES ====================

  // List inventory items with pagination and filters (admin)
  fastify.get<{ Querystring: ListQuery }>(
    '/admin/inventory',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const {
          page = 1, limit = 50, product_template_id, accessory_id,
          status, condition, color, search,
        } = request.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params: (string | number)[] = [];
        let paramCount = 1;

        if (product_template_id) {
          whereClause += ` AND ii.product_template_id = $${paramCount}`;
          params.push(product_template_id);
          paramCount++;
        }
        if (accessory_id) {
          whereClause += ` AND ii.accessory_id = $${paramCount}`;
          params.push(accessory_id);
          paramCount++;
        }
        if (status) {
          whereClause += ` AND ii.status = $${paramCount}`;
          params.push(status);
          paramCount++;
        }
        if (condition) {
          whereClause += ` AND ii.condition = $${paramCount}`;
          params.push(condition);
          paramCount++;
        }
        if (color) {
          whereClause += ` AND ii.color = $${paramCount}`;
          params.push(color);
          paramCount++;
        }
        if (search) {
          whereClause += ` AND (ii.serial_number ILIKE $${paramCount} OR pt.name ILIKE $${paramCount} OR a.name ILIKE $${paramCount})`;
          params.push(`%${search}%`);
          paramCount++;
        }

        const countResult = await pool.query(
          `SELECT COUNT(*)
           FROM inventory_items ii
           LEFT JOIN product_templates pt ON ii.product_template_id = pt.id
           LEFT JOIN accessories a ON ii.accessory_id = a.id
           ${whereClause}`,
          params
        );
        const total = parseInt(countResult.rows[0].count);

        const query = `
          SELECT
            ii.*,
            pt.name as product_name, pt.category_id,
            a.name as accessory_name,
            pc.name as category_name
          FROM inventory_items ii
          LEFT JOIN product_templates pt ON ii.product_template_id = pt.id
          LEFT JOIN product_categories pc ON pt.category_id = pc.id
          LEFT JOIN accessories a ON ii.accessory_id = a.id
          ${whereClause}
          ORDER BY ii.created_at DESC
          LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        return reply.send({
          status: 'ok',
          data: {
            inventory: result.rows,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch inventory',
          statusCode: 500,
        });
      }
    }
  );

  // Get inventory item by ID (admin)
  fastify.get<{ Params: IdParams }>(
    '/admin/inventory/:id',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;

        const result = await pool.query(
          `SELECT
            ii.*,
            pt.name as product_name, pt.category_id, pt.weekly_rate as product_weekly_rate, pt.monthly_rate as product_monthly_rate,
            a.name as accessory_name, a.weekly_rate as accessory_weekly_rate, a.monthly_rate as accessory_monthly_rate,
            pc.name as category_name
          FROM inventory_items ii
          LEFT JOIN product_templates pt ON ii.product_template_id = pt.id
          LEFT JOIN product_categories pc ON pt.category_id = pc.id
          LEFT JOIN accessories a ON ii.accessory_id = a.id
          WHERE ii.id = $1`,
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Inventory item not found',
            statusCode: 404,
          });
        }

        // Get rental history for this item
        const rentalsResult = await pool.query(
          `SELECT r.id, r.user_id, r.status, r.start_date, r.end_date, u.name as user_name
           FROM rentals r
           JOIN users u ON r.user_id = u.id
           WHERE r.inventory_item_id = $1
           ORDER BY r.start_date DESC
           LIMIT 10`,
          [id]
        );

        return reply.send({
          status: 'ok',
          data: {
            inventory: {
              ...result.rows[0],
              rental_history: rentalsResult.rows,
            },
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch inventory item',
          statusCode: 500,
        });
      }
    }
  );

  // Create inventory item (admin)
  fastify.post<{ Body: CreateInventoryItemRequest }>(
    '/admin/inventory',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const validation = createInventoryItemRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const {
          product_template_id, accessory_id, serial_number, color,
          status, condition, purchase_date, purchase_price, retail_price, notes,
        } = validation.data;

        const result = await pool.query(
          `INSERT INTO inventory_items (
            product_template_id, accessory_id, serial_number, color,
            status, condition, purchase_date, purchase_price, retail_price, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *`,
          [
            product_template_id || null,
            accessory_id || null,
            serial_number || null,
            color || null,
            status || 'available',
            condition || 'excellent',
            purchase_date || null,
            purchase_price || null,
            retail_price || null,
            notes || null,
          ]
        );

        return reply.status(201).send({
          status: 'created',
          data: { inventory: result.rows[0] },
        });
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof Error && error.message.includes('duplicate key')) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Inventory item with this serial number already exists',
            statusCode: 409,
          });
        }
        if (error instanceof Error && error.message.includes('violates foreign key')) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Invalid product or accessory ID',
            statusCode: 400,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create inventory item',
          statusCode: 500,
        });
      }
    }
  );

  // Update inventory item (admin)
  fastify.put<{ Params: IdParams; Body: UpdateInventoryItemRequest }>(
    '/admin/inventory/:id',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const validation = updateInventoryItemRequestSchema.safeParse(request.body);
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
          'product_template_id', 'accessory_id', 'serial_number', 'color',
          'status', 'condition', 'purchase_date', 'purchase_price', 'retail_price', 'notes',
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
          `UPDATE inventory_items
           SET ${updates.join(', ')}, updated_at = NOW()
           WHERE id = $${paramCount}
           RETURNING *`,
          params
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Inventory item not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { inventory: result.rows[0] },
        });
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof Error && error.message.includes('duplicate key')) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Inventory item with this serial number already exists',
            statusCode: 409,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update inventory item',
          statusCode: 500,
        });
      }
    }
  );

  // Delete inventory item (admin)
  fastify.delete<{ Params: IdParams }>(
    '/admin/inventory/:id',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;

        // Check for active rentals
        const rentalsCheck = await pool.query(
          `SELECT r.id FROM rentals r
           WHERE r.inventory_item_id = $1 AND r.status IN ('pending', 'confirmed', 'active')
           LIMIT 1`,
          [id]
        );

        if (rentalsCheck.rows.length > 0) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Cannot delete inventory item with active rentals',
            statusCode: 400,
          });
        }

        // Also check rental_accessories
        const accessoryRentalsCheck = await pool.query(
          `SELECT ra.id FROM rental_accessories ra
           JOIN rentals r ON ra.rental_id = r.id
           WHERE ra.inventory_item_id = $1 AND r.status IN ('pending', 'confirmed', 'active')
           LIMIT 1`,
          [id]
        );

        if (accessoryRentalsCheck.rows.length > 0) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Cannot delete inventory item with active accessory rentals',
            statusCode: 400,
          });
        }

        const result = await pool.query(
          'DELETE FROM inventory_items WHERE id = $1 RETURNING id',
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Inventory item not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { message: 'Inventory item deleted successfully' },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete inventory item',
          statusCode: 500,
        });
      }
    }
  );

  // Check inventory availability for date range (public/auth)
  fastify.get<{ Querystring: AvailabilityQuery }>(
    '/inventory/availability',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { product_template_id, accessory_id, color, start_date, end_date } = request.query;

        if (!product_template_id && !accessory_id) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Either product_template_id or accessory_id is required',
            statusCode: 400,
          });
        }

        if (!start_date || !end_date) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'start_date and end_date are required',
            statusCode: 400,
          });
        }

        // Find available inventory items
        let query: string;
        const params: (string | null)[] = [start_date, end_date];
        let paramCount = 3;

        if (product_template_id) {
          query = `
            SELECT ii.id, ii.serial_number, ii.color, ii.condition
            FROM inventory_items ii
            WHERE ii.product_template_id = $${paramCount}
              AND ii.status = 'available'
              AND ii.id NOT IN (
                SELECT r.inventory_item_id
                FROM rentals r
                WHERE r.inventory_item_id IS NOT NULL
                  AND r.status IN ('pending', 'confirmed', 'active')
                  AND r.start_date <= $2
                  AND r.end_date >= $1
              )
          `;
          params.push(product_template_id);
          paramCount++;
        } else {
          query = `
            SELECT ii.id, ii.serial_number, ii.color, ii.condition
            FROM inventory_items ii
            WHERE ii.accessory_id = $${paramCount}
              AND ii.status = 'available'
              AND ii.id NOT IN (
                SELECT ra.inventory_item_id
                FROM rental_accessories ra
                JOIN rentals r ON ra.rental_id = r.id
                WHERE ra.inventory_item_id IS NOT NULL
                  AND r.status IN ('pending', 'confirmed', 'active')
                  AND r.start_date <= $2
                  AND r.end_date >= $1
              )
          `;
          params.push(accessory_id!);
          paramCount++;
        }

        if (color) {
          query += ` AND ii.color = $${paramCount}`;
          params.push(color);
          paramCount++;
        }

        query += ' ORDER BY ii.condition DESC, ii.created_at ASC';

        const result = await pool.query(query, params);

        // Get unique colors from available items
        const availableColors = [...new Set(result.rows.map(r => r.color).filter(Boolean))];

        return reply.send({
          status: 'ok',
          data: {
            available: result.rows.length > 0,
            available_count: result.rows.length,
            available_colors: availableColors,
            items: result.rows,
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to check availability',
          statusCode: 500,
        });
      }
    }
  );

  // Get inventory summary by product (admin)
  fastify.get(
    '/admin/inventory/summary',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        // Get product inventory summary
        const productSummary = await pool.query(
          `SELECT
            pt.id as product_template_id,
            pt.name as product_name,
            pc.name as category_name,
            COUNT(ii.id) as total_count,
            COUNT(ii.id) FILTER (WHERE ii.status = 'available') as available_count,
            COUNT(ii.id) FILTER (WHERE ii.status = 'rented') as rented_count,
            COUNT(ii.id) FILTER (WHERE ii.status = 'maintenance') as maintenance_count,
            json_agg(DISTINCT ii.color) FILTER (WHERE ii.color IS NOT NULL) as colors
          FROM product_templates pt
          JOIN product_categories pc ON pt.category_id = pc.id
          LEFT JOIN inventory_items ii ON pt.id = ii.product_template_id
          WHERE pt.is_active = true
          GROUP BY pt.id, pc.name
          ORDER BY pc.name, pt.name`
        );

        // Get accessory inventory summary
        const accessorySummary = await pool.query(
          `SELECT
            a.id as accessory_id,
            a.name as accessory_name,
            COUNT(ii.id) as total_count,
            COUNT(ii.id) FILTER (WHERE ii.status = 'available') as available_count,
            COUNT(ii.id) FILTER (WHERE ii.status = 'rented') as rented_count,
            COUNT(ii.id) FILTER (WHERE ii.status = 'maintenance') as maintenance_count,
            json_agg(DISTINCT ii.color) FILTER (WHERE ii.color IS NOT NULL) as colors
          FROM accessories a
          LEFT JOIN inventory_items ii ON a.id = ii.accessory_id
          WHERE a.is_active = true
          GROUP BY a.id
          ORDER BY a.name`
        );

        return reply.send({
          status: 'ok',
          data: {
            products: productSummary.rows,
            accessories: accessorySummary.rows,
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch inventory summary',
          statusCode: 500,
        });
      }
    }
  );

  // Bulk create inventory items (admin)
  fastify.post<{ Body: { items: CreateInventoryItemRequest[] } }>(
    '/admin/inventory/bulk',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      const client = await pool.connect();
      try {
        const { items } = request.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Items array is required and must not be empty',
            statusCode: 400,
          });
        }

        if (items.length > 100) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Maximum 100 items per bulk operation',
            statusCode: 400,
          });
        }

        await client.query('BEGIN');

        const createdItems = [];
        const errors = [];

        for (let i = 0; i < items.length; i++) {
          const validation = createInventoryItemRequestSchema.safeParse(items[i]);
          if (!validation.success) {
            errors.push({ index: i, error: validation.error.errors[0].message });
            continue;
          }

          const {
            product_template_id, accessory_id, serial_number, color,
            status, condition, purchase_date, purchase_price, retail_price, notes,
          } = validation.data;

          try {
            const result = await client.query(
              `INSERT INTO inventory_items (
                product_template_id, accessory_id, serial_number, color,
                status, condition, purchase_date, purchase_price, retail_price, notes
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              RETURNING *`,
              [
                product_template_id || null,
                accessory_id || null,
                serial_number || null,
                color || null,
                status || 'available',
                condition || 'excellent',
                purchase_date || null,
                purchase_price || null,
                retail_price || null,
                notes || null,
              ]
            );
            createdItems.push(result.rows[0]);
          } catch (err: unknown) {
            if (err instanceof Error && err.message.includes('duplicate key')) {
              errors.push({ index: i, error: 'Duplicate serial number' });
            } else {
              errors.push({ index: i, error: 'Failed to create item' });
            }
          }
        }

        if (errors.length > 0 && createdItems.length === 0) {
          await client.query('ROLLBACK');
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'All items failed validation',
            errors,
            statusCode: 400,
          });
        }

        await client.query('COMMIT');

        return reply.status(201).send({
          status: 'created',
          data: {
            created_count: createdItems.length,
            error_count: errors.length,
            items: createdItems,
            errors: errors.length > 0 ? errors : undefined,
          },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to bulk create inventory items',
          statusCode: 500,
        });
      } finally {
        client.release();
      }
    }
  );
}
