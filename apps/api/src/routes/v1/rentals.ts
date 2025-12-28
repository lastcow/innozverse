import { FastifyInstance } from 'fastify';
import { pool } from '../../db';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  CreateRentalRequest,
  UpdateRentalRequest,
  ListRentalsRequest,
  createRentalRequestSchema,
  updateRentalRequestSchema,
} from '@innozverse/shared';

interface RentalIdParams {
  id: string;
}

interface CancelBody {
  reason?: string;
}

export async function rentalRoutes(fastify: FastifyInstance) {
  // List rentals with pagination and filtering
  // Regular users see only their own rentals, admins can see all
  fastify.get<{ Querystring: ListRentalsRequest }>(
    '/rentals',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const isAdmin = ['admin', 'super_user'].includes(user.role);

        const {
          page = 1,
          limit = 20,
          status,
          user_id,
          equipment_id,
          start_date_from,
          start_date_to,
        } = request.query;
        const offset = (page - 1) * limit;

        // Build WHERE clause with filters
        let whereClause = 'WHERE 1=1';
        const params: (string | number)[] = [];
        let paramCount = 1;

        // Non-admins can only see their own rentals
        if (!isAdmin) {
          whereClause += ` AND r.user_id = $${paramCount}`;
          params.push(user.userId);
          paramCount++;
        } else if (user_id) {
          whereClause += ` AND r.user_id = $${paramCount}`;
          params.push(user_id);
          paramCount++;
        }

        if (status) {
          whereClause += ` AND r.status = $${paramCount}`;
          params.push(status);
          paramCount++;
        }

        if (equipment_id) {
          whereClause += ` AND r.equipment_id = $${paramCount}`;
          params.push(equipment_id);
          paramCount++;
        }

        if (start_date_from) {
          whereClause += ` AND r.start_date >= $${paramCount}`;
          params.push(start_date_from);
          paramCount++;
        }

        if (start_date_to) {
          whereClause += ` AND r.start_date <= $${paramCount}`;
          params.push(start_date_to);
          paramCount++;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM rentals r ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Build full query with SELECT and JOINs
        let query = `
          SELECT r.id, r.user_id, r.equipment_id, r.start_date, r.end_date,
                 r.daily_rate, r.total_amount, r.status, r.notes,
                 r.pickup_date, r.return_date, r.cancelled_at, r.cancelled_reason,
                 r.created_at, r.updated_at,
                 json_build_object('id', u.id, 'name', u.name, 'email', u.email) as user,
                 json_build_object('id', e.id, 'name', e.name, 'category', e.category, 'image_url', e.image_url, 'serial_number', e.serial_number, 'condition', e.condition, 'brand', e.brand, 'model', e.model) as equipment
          FROM rentals r
          JOIN users u ON r.user_id = u.id
          JOIN equipment e ON r.equipment_id = e.id
          ${whereClause}
        `;

        // Add pagination
        query += ` ORDER BY r.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        return reply.send({
          status: 'ok',
          data: {
            rentals: result.rows,
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
          message: 'Failed to fetch rentals',
          statusCode: 500,
        });
      }
    }
  );

  // Get user's own rentals (convenience endpoint)
  fastify.get(
    '/rentals/my',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const user = (request as any).user;

        const result = await pool.query(
          `SELECT r.id, r.user_id, r.equipment_id, r.start_date, r.end_date,
                  r.daily_rate, r.total_amount, r.status, r.notes,
                  r.pickup_date, r.return_date, r.cancelled_at, r.cancelled_reason,
                  r.created_at, r.updated_at,
                  json_build_object('id', u.id, 'name', u.name, 'email', u.email) as user,
                  json_build_object('id', e.id, 'name', e.name, 'category', e.category, 'image_url', e.image_url) as equipment
           FROM rentals r
           JOIN users u ON r.user_id = u.id
           JOIN equipment e ON r.equipment_id = e.id
           WHERE r.user_id = $1
           ORDER BY r.created_at DESC`,
          [user.userId]
        );

        return reply.send({
          status: 'ok',
          data: {
            rentals: result.rows,
            pagination: {
              page: 1,
              limit: result.rows.length,
              total: result.rows.length,
              totalPages: 1,
            },
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch rentals',
          statusCode: 500,
        });
      }
    }
  );

  // Get rental by ID
  fastify.get<{ Params: RentalIdParams }>(
    '/rentals/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const user = (request as any).user;
        const isAdmin = ['admin', 'super_user'].includes(user.role);

        const result = await pool.query(
          `SELECT r.id, r.user_id, r.equipment_id, r.start_date, r.end_date,
                  r.daily_rate, r.total_amount, r.status, r.notes,
                  r.pickup_date, r.return_date, r.cancelled_at, r.cancelled_reason,
                  r.created_at, r.updated_at,
                  json_build_object('id', u.id, 'name', u.name, 'email', u.email) as user,
                  json_build_object('id', e.id, 'name', e.name, 'category', e.category, 'image_url', e.image_url) as equipment
           FROM rentals r
           JOIN users u ON r.user_id = u.id
           JOIN equipment e ON r.equipment_id = e.id
           WHERE r.id = $1`,
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Rental not found',
            statusCode: 404,
          });
        }

        const rental = result.rows[0];

        // Check ownership or admin role
        if (!isAdmin && rental.user_id !== user.userId) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You can only view your own rentals',
            statusCode: 403,
          });
        }

        return reply.send({
          status: 'ok',
          data: { rental },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch rental',
          statusCode: 500,
        });
      }
    }
  );

  // Create rental
  fastify.post<{ Body: CreateRentalRequest }>(
    '/rentals',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const validation = createRentalRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const { equipment_id, user_id: requestedUserId, start_date, end_date, notes } = validation.data;
        const user = (request as any).user;
        const isAdmin = ['admin', 'super_user'].includes(user.role);

        // Use requested user_id if admin, otherwise use logged-in user
        const rentalUserId = (isAdmin && requestedUserId) ? requestedUserId : user.userId;

        // Check if equipment exists and is available
        const equipmentResult = await pool.query(
          'SELECT id, daily_rate, status FROM equipment WHERE id = $1',
          [equipment_id]
        );

        if (equipmentResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Equipment not found',
            statusCode: 404,
          });
        }

        const equipment = equipmentResult.rows[0];

        if (equipment.status === 'retired') {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Equipment is retired and not available for rent',
            statusCode: 400,
          });
        }

        if (equipment.status === 'maintenance') {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Equipment is under maintenance and not available for rent',
            statusCode: 400,
          });
        }

        // Check for conflicting rentals
        const conflictResult = await pool.query(
          `SELECT id FROM rentals
           WHERE equipment_id = $1
             AND status IN ('pending', 'confirmed', 'active')
             AND (start_date <= $3 AND end_date >= $2)`,
          [equipment_id, start_date, end_date]
        );

        if (conflictResult.rows.length > 0) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Equipment is not available for the selected dates',
            statusCode: 409,
          });
        }

        // Calculate total amount
        const startDateObj = new Date(start_date);
        const endDateObj = new Date(end_date);
        const days = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const dailyRate = parseFloat(equipment.daily_rate);
        const totalAmount = dailyRate * days;

        // Create rental
        const result = await pool.query(
          `INSERT INTO rentals (user_id, equipment_id, start_date, end_date, daily_rate, total_amount, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, user_id, equipment_id, start_date, end_date, daily_rate, total_amount,
                     status, notes, pickup_date, return_date, cancelled_at, cancelled_reason,
                     created_at, updated_at`,
          [rentalUserId, equipment_id, start_date, end_date, dailyRate, totalAmount, notes || null]
        );

        return reply.status(201).send({
          status: 'created',
          data: { rental: result.rows[0] },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create rental',
          statusCode: 500,
        });
      }
    }
  );

  // Update rental (admin can update status, user can update notes)
  fastify.put<{ Params: RentalIdParams; Body: UpdateRentalRequest }>(
    '/rentals/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const user = (request as any).user;
        const isAdmin = ['admin', 'super_user'].includes(user.role);

        const validation = updateRentalRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        // Get current rental
        const rentalResult = await pool.query(
          'SELECT id, user_id, status FROM rentals WHERE id = $1',
          [id]
        );

        if (rentalResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Rental not found',
            statusCode: 404,
          });
        }

        const rental = rentalResult.rows[0];

        // Check permissions
        if (!isAdmin && rental.user_id !== user.userId) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You can only update your own rentals',
            statusCode: 403,
          });
        }

        const data = validation.data;

        // Non-admins can only update notes
        if (!isAdmin && data.status !== undefined) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Only admins can update rental status',
            statusCode: 403,
          });
        }

        // Build update query
        const updates: string[] = [];
        const params: (string | null)[] = [];
        let paramCount = 1;

        if (data.status !== undefined) {
          updates.push(`status = $${paramCount}`);
          params.push(data.status);
          paramCount++;
        }

        if (data.notes !== undefined) {
          updates.push(`notes = $${paramCount}`);
          params.push(data.notes);
          paramCount++;
        }

        if (data.cancelled_reason !== undefined) {
          updates.push(`cancelled_reason = $${paramCount}`);
          params.push(data.cancelled_reason);
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
          UPDATE rentals
          SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramCount}
          RETURNING id, user_id, equipment_id, start_date, end_date, daily_rate, total_amount,
                    status, notes, pickup_date, return_date, cancelled_at, cancelled_reason,
                    created_at, updated_at
        `;

        const result = await pool.query(query, params);

        return reply.send({
          status: 'ok',
          data: { rental: result.rows[0] },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update rental',
          statusCode: 500,
        });
      }
    }
  );

  // Cancel rental (user can cancel own pending/confirmed rentals)
  fastify.post<{ Params: RentalIdParams; Body: CancelBody }>(
    '/rentals/:id/cancel',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { reason } = request.body || {};
        const user = (request as any).user;
        const isAdmin = ['admin', 'super_user'].includes(user.role);

        // Get current rental
        const rentalResult = await pool.query(
          'SELECT id, user_id, equipment_id, status FROM rentals WHERE id = $1',
          [id]
        );

        if (rentalResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Rental not found',
            statusCode: 404,
          });
        }

        const rental = rentalResult.rows[0];

        // Check ownership (admin can cancel any rental)
        if (!isAdmin && rental.user_id !== user.userId) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You can only cancel your own rentals',
            statusCode: 403,
          });
        }

        // Check if rental can be cancelled
        const cancellableStatuses = ['pending', 'confirmed'];
        if (!cancellableStatuses.includes(rental.status)) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: `Cannot cancel a rental with status '${rental.status}'`,
            statusCode: 400,
          });
        }

        // Cancel the rental
        const result = await pool.query(
          `UPDATE rentals
           SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, cancelled_reason = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING id, user_id, equipment_id, start_date, end_date, daily_rate, total_amount,
                     status, notes, pickup_date, return_date, cancelled_at, cancelled_reason,
                     created_at, updated_at`,
          [id, reason || null]
        );

        return reply.send({
          status: 'ok',
          data: {
            rental: result.rows[0],
            message: 'Rental cancelled successfully',
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to cancel rental',
          statusCode: 500,
        });
      }
    }
  );

  // Admin: Confirm rental
  fastify.post<{ Params: RentalIdParams }>(
    '/rentals/:id/confirm',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;

        const rentalResult = await pool.query(
          'SELECT id, status FROM rentals WHERE id = $1',
          [id]
        );

        if (rentalResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Rental not found',
            statusCode: 404,
          });
        }

        if (rentalResult.rows[0].status !== 'pending') {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Only pending rentals can be confirmed',
            statusCode: 400,
          });
        }

        const result = await pool.query(
          `UPDATE rentals
           SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING id, user_id, equipment_id, start_date, end_date, daily_rate, total_amount,
                     status, notes, pickup_date, return_date, cancelled_at, cancelled_reason,
                     created_at, updated_at`,
          [id]
        );

        return reply.send({
          status: 'ok',
          data: { rental: result.rows[0] },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to confirm rental',
          statusCode: 500,
        });
      }
    }
  );

  // Admin: Mark rental as picked up (equipment collected)
  fastify.post<{ Params: RentalIdParams }>(
    '/rentals/:id/pickup',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      const client = await pool.connect();
      try {
        const { id } = request.params;

        await client.query('BEGIN');

        const rentalResult = await client.query(
          'SELECT id, equipment_id, status FROM rentals WHERE id = $1 FOR UPDATE',
          [id]
        );

        if (rentalResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Rental not found',
            statusCode: 404,
          });
        }

        if (rentalResult.rows[0].status !== 'confirmed') {
          await client.query('ROLLBACK');
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Only confirmed rentals can be marked as picked up',
            statusCode: 400,
          });
        }

        // Update rental status
        const result = await client.query(
          `UPDATE rentals
           SET status = 'active', pickup_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING id, user_id, equipment_id, start_date, end_date, daily_rate, total_amount,
                     status, notes, pickup_date, return_date, cancelled_at, cancelled_reason,
                     created_at, updated_at`,
          [id]
        );

        // Update equipment status
        await client.query(
          `UPDATE equipment SET status = 'rented', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [rentalResult.rows[0].equipment_id]
        );

        await client.query('COMMIT');

        return reply.send({
          status: 'ok',
          data: { rental: result.rows[0] },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to mark rental as picked up',
          statusCode: 500,
        });
      } finally {
        client.release();
      }
    }
  );

  // Admin: Mark rental as returned (equipment returned)
  fastify.post<{ Params: RentalIdParams }>(
    '/rentals/:id/return',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      const client = await pool.connect();
      try {
        const { id } = request.params;

        await client.query('BEGIN');

        const rentalResult = await client.query(
          'SELECT id, equipment_id, status FROM rentals WHERE id = $1 FOR UPDATE',
          [id]
        );

        if (rentalResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Rental not found',
            statusCode: 404,
          });
        }

        if (rentalResult.rows[0].status !== 'active') {
          await client.query('ROLLBACK');
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Only active rentals can be marked as returned',
            statusCode: 400,
          });
        }

        // Update rental status
        const result = await client.query(
          `UPDATE rentals
           SET status = 'completed', return_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING id, user_id, equipment_id, start_date, end_date, daily_rate, total_amount,
                     status, notes, pickup_date, return_date, cancelled_at, cancelled_reason,
                     created_at, updated_at`,
          [id]
        );

        // Update equipment status
        await client.query(
          `UPDATE equipment SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [rentalResult.rows[0].equipment_id]
        );

        await client.query('COMMIT');

        return reply.send({
          status: 'ok',
          data: { rental: result.rows[0] },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to mark rental as returned',
          statusCode: 500,
        });
      } finally {
        client.release();
      }
    }
  );
}
