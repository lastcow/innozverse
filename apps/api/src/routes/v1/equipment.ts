import { FastifyInstance } from 'fastify';
import { pool } from '../../db';
import { requireAuth } from '../../middleware/auth';
import {
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  ListEquipmentRequest,
  createEquipmentRequestSchema,
  updateEquipmentRequestSchema,
} from '@innozverse/shared';

interface EquipmentIdParams {
  id: string;
}

interface AvailabilityQuery {
  start_date: string;
  end_date: string;
}

export async function equipmentRoutes(fastify: FastifyInstance) {
  // List equipment with pagination and filtering
  fastify.get<{ Querystring: ListEquipmentRequest }>(
    '/equipment',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const {
          page = 1,
          limit = 20,
          category,
          status,
          search,
          min_rate,
          max_rate,
        } = request.query;
        const offset = (page - 1) * limit;

        // Build WHERE clause with filters
        let whereClause = 'WHERE 1=1';
        const params: (string | number)[] = [];
        let paramCount = 1;

        if (category) {
          whereClause += ` AND category = $${paramCount}`;
          params.push(category);
          paramCount++;
        }

        if (status) {
          whereClause += ` AND status = $${paramCount}`;
          params.push(status);
          paramCount++;
        }

        if (search) {
          whereClause += ` AND (name ILIKE $${paramCount} OR brand ILIKE $${paramCount} OR model ILIKE $${paramCount})`;
          params.push(`%${search}%`);
          paramCount++;
        }

        if (min_rate !== undefined) {
          whereClause += ` AND daily_rate >= $${paramCount}`;
          params.push(min_rate);
          paramCount++;
        }

        if (max_rate !== undefined) {
          whereClause += ` AND daily_rate <= $${paramCount}`;
          params.push(max_rate);
          paramCount++;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM equipment ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Build full query with SELECT
        let query = `
          SELECT id, name, description, category, brand, model, serial_number,
                 daily_rate, image_url, specs, status, condition, purchase_date,
                 notes, created_at, updated_at
          FROM equipment
          ${whereClause}
        `;

        // Add pagination
        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        return reply.send({
          status: 'ok',
          data: {
            equipment: result.rows,
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
          message: 'Failed to fetch equipment',
          statusCode: 500,
        });
      }
    }
  );

  // Get equipment by ID
  fastify.get<{ Params: EquipmentIdParams }>(
    '/equipment/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { id } = request.params;

        const result = await pool.query(
          `SELECT id, name, description, category, brand, model, serial_number,
                  daily_rate, image_url, specs, status, condition, purchase_date,
                  notes, created_at, updated_at
           FROM equipment WHERE id = $1`,
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Equipment not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { equipment: result.rows[0] },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch equipment',
          statusCode: 500,
        });
      }
    }
  );

  // Check equipment availability for date range
  fastify.get<{ Params: EquipmentIdParams; Querystring: AvailabilityQuery }>(
    '/equipment/:id/availability',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { start_date, end_date } = request.query;

        if (!start_date || !end_date) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'start_date and end_date are required',
            statusCode: 400,
          });
        }

        // Check if equipment exists and is not retired/maintenance
        const equipmentResult = await pool.query(
          'SELECT id, status FROM equipment WHERE id = $1',
          [id]
        );

        if (equipmentResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Equipment not found',
            statusCode: 404,
          });
        }

        const equipmentStatus = equipmentResult.rows[0].status;
        if (equipmentStatus === 'retired' || equipmentStatus === 'maintenance') {
          return reply.send({
            status: 'ok',
            data: {
              available: false,
              reason: `Equipment is currently ${equipmentStatus}`,
            },
          });
        }

        // Check for conflicting rentals
        const conflictResult = await pool.query(
          `SELECT start_date, end_date
           FROM rentals
           WHERE equipment_id = $1
             AND status IN ('pending', 'confirmed', 'active')
             AND (start_date <= $3 AND end_date >= $2)`,
          [id, start_date, end_date]
        );

        const available = conflictResult.rows.length === 0;

        return reply.send({
          status: 'ok',
          data: {
            available,
            conflicting_rentals: available ? undefined : conflictResult.rows,
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

  // Create equipment
  fastify.post<{ Body: CreateEquipmentRequest }>(
    '/equipment',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const validation = createEquipmentRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const {
          name,
          description,
          category,
          brand,
          model,
          serial_number,
          daily_rate,
          image_url,
          specs,
          condition,
          purchase_date,
          notes,
        } = validation.data;

        const result = await pool.query(
          `INSERT INTO equipment (
            name, description, category, brand, model, serial_number,
            daily_rate, image_url, specs, condition, purchase_date, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id, name, description, category, brand, model, serial_number,
                    daily_rate, image_url, specs, status, condition, purchase_date,
                    notes, created_at, updated_at`,
          [
            name,
            description || null,
            category,
            brand || null,
            model || null,
            serial_number || null,
            daily_rate,
            image_url || null,
            specs ? JSON.stringify(specs) : null,
            condition || 'excellent',
            purchase_date || null,
            notes || null,
          ]
        );

        return reply.status(201).send({
          status: 'created',
          data: { equipment: result.rows[0] },
        });
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof Error && error.message.includes('duplicate key')) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Equipment with this serial number already exists',
            statusCode: 409,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create equipment',
          statusCode: 500,
        });
      }
    }
  );

  // Update equipment
  fastify.put<{ Params: EquipmentIdParams; Body: UpdateEquipmentRequest }>(
    '/equipment/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { id } = request.params;

        const validation = updateEquipmentRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const data = validation.data;

        // Build update query
        const updates: string[] = [];
        const params: (string | number | null)[] = [];
        let paramCount = 1;

        if (data.name !== undefined) {
          updates.push(`name = $${paramCount}`);
          params.push(data.name);
          paramCount++;
        }

        if (data.description !== undefined) {
          updates.push(`description = $${paramCount}`);
          params.push(data.description);
          paramCount++;
        }

        if (data.category !== undefined) {
          updates.push(`category = $${paramCount}`);
          params.push(data.category);
          paramCount++;
        }

        if (data.brand !== undefined) {
          updates.push(`brand = $${paramCount}`);
          params.push(data.brand);
          paramCount++;
        }

        if (data.model !== undefined) {
          updates.push(`model = $${paramCount}`);
          params.push(data.model);
          paramCount++;
        }

        if (data.serial_number !== undefined) {
          updates.push(`serial_number = $${paramCount}`);
          params.push(data.serial_number);
          paramCount++;
        }

        if (data.daily_rate !== undefined) {
          updates.push(`daily_rate = $${paramCount}`);
          params.push(data.daily_rate);
          paramCount++;
        }

        if (data.image_url !== undefined) {
          updates.push(`image_url = $${paramCount}`);
          params.push(data.image_url);
          paramCount++;
        }

        if (data.specs !== undefined) {
          updates.push(`specs = $${paramCount}`);
          params.push(JSON.stringify(data.specs));
          paramCount++;
        }

        if (data.status !== undefined) {
          updates.push(`status = $${paramCount}`);
          params.push(data.status);
          paramCount++;
        }

        if (data.condition !== undefined) {
          updates.push(`condition = $${paramCount}`);
          params.push(data.condition);
          paramCount++;
        }

        if (data.notes !== undefined) {
          updates.push(`notes = $${paramCount}`);
          params.push(data.notes);
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

        const query = `
          UPDATE equipment
          SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramCount}
          RETURNING id, name, description, category, brand, model, serial_number,
                    daily_rate, image_url, specs, status, condition, purchase_date,
                    notes, created_at, updated_at
        `;

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Equipment not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { equipment: result.rows[0] },
        });
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof Error && error.message.includes('duplicate key')) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Equipment with this serial number already exists',
            statusCode: 409,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update equipment',
          statusCode: 500,
        });
      }
    }
  );

  // Delete equipment
  fastify.delete<{ Params: EquipmentIdParams }>(
    '/equipment/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { id } = request.params;

        // Check for active rentals
        const activeRentals = await pool.query(
          `SELECT id FROM rentals
           WHERE equipment_id = $1 AND status IN ('pending', 'confirmed', 'active')`,
          [id]
        );

        if (activeRentals.rows.length > 0) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Cannot delete equipment with active rentals. Please cancel or complete all rentals first.',
            statusCode: 400,
          });
        }

        // Delete equipment (rentals with RESTRICT FK will prevent deletion if any exist)
        const result = await pool.query(
          'DELETE FROM equipment WHERE id = $1 RETURNING id',
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Equipment not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { message: 'Equipment deleted successfully' },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete equipment',
          statusCode: 500,
        });
      }
    }
  );
}
