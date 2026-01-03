import { FastifyInstance } from 'fastify';
import { PoolClient } from 'pg';
import { pool } from '../../db';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  CreateEnhancedRentalRequest,
  AddRentalAccessoryRequest,
  AssignInventoryRequest,
  createEnhancedRentalRequestSchema,
  addRentalAccessoryRequestSchema,
  assignInventoryRequestSchema,
  rentalPricingRequestSchema,
} from '@innozverse/shared';

interface IdParams {
  id: string;
}

interface PricingQuery {
  product_template_id: string;
  pricing_period: 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  accessories?: string; // JSON array of accessory IDs
  apply_student_discount?: boolean;
}

// Helper function to calculate rental pricing
async function calculateRentalPricing(
  productTemplateId: string,
  pricingPeriod: 'weekly' | 'monthly',
  startDate: string,
  endDate: string,
  accessoryIds: string[],
  applyStudentDiscount: boolean,
  isNewEquipment: boolean = false
): Promise<{
  productRate: number;
  productDeposit: number;
  accessoryRates: { id: string; rate: number; deposit: number }[];
  subtotal: number;
  totalDeposit: number;
  studentDiscount: number;
  newEquipmentFee: number;
  finalTotal: number;
  finalDeposit: number;
  duration: number;
  periods: number;
}> {
  // Get product pricing
  const productResult = await pool.query(
    'SELECT weekly_rate, monthly_rate, deposit_amount FROM product_templates WHERE id = $1',
    [productTemplateId]
  );

  if (productResult.rows.length === 0) {
    throw new Error('Product not found');
  }

  const product = productResult.rows[0];
  const productRate = parseFloat(pricingPeriod === 'weekly' ? product.weekly_rate : product.monthly_rate);
  const productDeposit = parseFloat(product.deposit_amount);

  // Calculate duration
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const periods = pricingPeriod === 'weekly' ? Math.ceil(days / 7) : Math.ceil(days / 30);

  // Get accessory pricing
  const accessoryRates: { id: string; rate: number; deposit: number }[] = [];
  let accessorySubtotal = 0;
  let accessoryDeposit = 0;

  if (accessoryIds.length > 0) {
    const accessoriesResult = await pool.query(
      `SELECT id, weekly_rate, monthly_rate, deposit_amount
       FROM accessories
       WHERE id = ANY($1) AND is_active = true`,
      [accessoryIds]
    );

    for (const accessory of accessoriesResult.rows) {
      const rate = parseFloat(pricingPeriod === 'weekly' ? accessory.weekly_rate : accessory.monthly_rate);
      const deposit = parseFloat(accessory.deposit_amount);
      accessoryRates.push({ id: accessory.id, rate, deposit });
      accessorySubtotal += rate * periods;
      accessoryDeposit += deposit;
    }
  }

  // Calculate subtotals
  const productSubtotal = productRate * periods;
  const subtotal = productSubtotal + accessorySubtotal;
  const totalDeposit = productDeposit + accessoryDeposit;

  // Get pricing modifiers
  let studentDiscount = 0;
  let newEquipmentFee = 0;

  if (applyStudentDiscount) {
    const discountResult = await pool.query(
      "SELECT percentage, applies_to FROM pricing_modifiers WHERE name = 'student_discount' AND is_active = true"
    );
    if (discountResult.rows.length > 0) {
      const { percentage, applies_to } = discountResult.rows[0];
      const discountRate = parseFloat(percentage) / 100;
      if (applies_to === 'all') {
        studentDiscount = (subtotal + totalDeposit) * discountRate;
      } else if (applies_to === 'rental_only') {
        studentDiscount = subtotal * discountRate;
      } else if (applies_to === 'deposit_only') {
        studentDiscount = totalDeposit * discountRate;
      }
    }
  }

  if (isNewEquipment) {
    const feeResult = await pool.query(
      "SELECT percentage, applies_to FROM pricing_modifiers WHERE name = 'new_equipment_fee' AND is_active = true"
    );
    if (feeResult.rows.length > 0) {
      const { percentage, applies_to } = feeResult.rows[0];
      const feeRate = parseFloat(percentage) / 100;
      if (applies_to === 'all') {
        newEquipmentFee = (subtotal + totalDeposit) * feeRate;
      } else if (applies_to === 'rental_only') {
        newEquipmentFee = subtotal * feeRate;
      } else if (applies_to === 'deposit_only') {
        newEquipmentFee = totalDeposit * feeRate;
      }
    }
  }

  const finalTotal = subtotal - studentDiscount + newEquipmentFee;
  const finalDeposit = totalDeposit - (applyStudentDiscount ? totalDeposit * 0.15 : 0);

  return {
    productRate,
    productDeposit,
    accessoryRates,
    subtotal,
    totalDeposit,
    studentDiscount,
    newEquipmentFee,
    finalTotal,
    finalDeposit,
    duration: days,
    periods,
  };
}

// Helper function to auto-assign inventory
async function autoAssignInventory(
  client: PoolClient,
  productTemplateId: string,
  color: string,
  startDate: string,
  endDate: string
): Promise<string | null> {
  // Find an available inventory item matching product and color
  const result = await client.query(
    `SELECT ii.id
     FROM inventory_items ii
     WHERE ii.product_template_id = $1
       AND ii.color = $2
       AND ii.status = 'available'
       AND ii.id NOT IN (
         SELECT r.inventory_item_id
         FROM rentals r
         WHERE r.inventory_item_id IS NOT NULL
           AND r.status IN ('pending', 'confirmed', 'active')
           AND r.start_date <= $4
           AND r.end_date >= $3
       )
     ORDER BY ii.condition DESC
     LIMIT 1`,
    [productTemplateId, color, startDate, endDate]
  );

  return result.rows.length > 0 ? result.rows[0].id : null;
}

export async function enhancedRentalRoutes(fastify: FastifyInstance) {
  // Calculate rental pricing (public preview)
  fastify.get<{ Querystring: PricingQuery }>(
    '/rentals/calculate-pricing',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const validation = rentalPricingRequestSchema.safeParse({
          ...request.query,
          accessories: request.query.accessories ? JSON.parse(request.query.accessories) : [],
        });

        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const { product_template_id, pricing_period, start_date, end_date, accessories, apply_student_discount } = validation.data;
        const accessoryIds = accessories?.map(a => a.accessory_id) || [];

        // Check if user is student
        const user = (request as any).user;
        let isStudent = false;
        if (apply_student_discount) {
          const userResult = await pool.query(
            'SELECT is_student FROM users WHERE id = $1',
            [user.userId]
          );
          isStudent = userResult.rows[0]?.is_student || false;
        }

        const pricing = await calculateRentalPricing(
          product_template_id,
          pricing_period,
          start_date,
          end_date,
          accessoryIds,
          (apply_student_discount ?? false) && isStudent
        );

        return reply.send({
          status: 'ok',
          data: {
            pricing: {
              ...pricing,
              student_discount_eligible: isStudent,
              pricing_period,
            },
          },
        });
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof Error && error.message === 'Product not found') {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Product not found',
            statusCode: 404,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to calculate pricing',
          statusCode: 500,
        });
      }
    }
  );

  // Create enhanced rental with product template and accessories
  fastify.post<{ Body: CreateEnhancedRentalRequest }>(
    '/rentals/enhanced',
    { preHandler: requireAuth },
    async (request, reply) => {
      const client = await pool.connect();
      try {
        const validation = createEnhancedRentalRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const {
          product_template_id, user_id: requestedUserId, selected_color, pricing_period,
          start_date, end_date, accessories, notes,
        } = validation.data;

        const user = (request as any).user;
        const isAdmin = ['admin', 'super_user'].includes(user.role);
        const rentalUserId = (isAdmin && requestedUserId) ? requestedUserId : user.userId;

        await client.query('BEGIN');

        // Verify product exists and is active
        const productResult = await client.query(
          `SELECT pt.*, pc.color as is_new_equipment
           FROM product_templates pt
           JOIN product_categories pc ON pt.category_id = pc.id
           WHERE pt.id = $1 AND pt.is_active = true`,
          [product_template_id]
        );

        if (productResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Product not found',
            statusCode: 404,
          });
        }

        const product = productResult.rows[0];

        // Verify color is available for this product
        const colorResult = await client.query(
          'SELECT id FROM product_colors WHERE product_template_id = $1 AND color_name = $2 AND is_active = true',
          [product_template_id, selected_color]
        );

        if (colorResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Selected color is not available for this product',
            statusCode: 400,
          });
        }

        // Check user student status
        const userResult = await client.query(
          'SELECT is_student FROM users WHERE id = $1',
          [rentalUserId]
        );
        const isStudent = userResult.rows[0]?.is_student || false;

        // Auto-assign inventory item
        const inventoryItemId = await autoAssignInventory(
          client,
          product_template_id,
          selected_color,
          start_date,
          end_date
        );

        if (!inventoryItemId) {
          await client.query('ROLLBACK');
          return reply.status(409).send({
            error: 'Conflict',
            message: 'No inventory available for the selected product and color',
            statusCode: 409,
          });
        }

        // Calculate pricing
        const accessoryIds = accessories?.map(a => a.accessory_id) || [];
        const pricing = await calculateRentalPricing(
          product_template_id,
          pricing_period,
          start_date,
          end_date,
          accessoryIds,
          isStudent,
          product.is_new
        );

        // Create rental
        const rentalResult = await client.query(
          `INSERT INTO rentals (
            user_id, product_template_id, inventory_item_id, selected_color, pricing_period,
            start_date, end_date, weekly_rate, monthly_rate, deposit_amount,
            student_discount_applied, new_equipment_fee_applied, discount_amount, fee_amount, final_total,
            notes, total_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          RETURNING *`,
          [
            rentalUserId,
            product_template_id,
            inventoryItemId,
            selected_color,
            pricing_period,
            start_date,
            end_date,
            product.weekly_rate,
            product.monthly_rate,
            product.deposit_amount,
            isStudent,
            product.is_new,
            pricing.studentDiscount,
            pricing.newEquipmentFee,
            pricing.finalTotal,
            notes || null,
            pricing.finalTotal,
          ]
        );

        const rental = rentalResult.rows[0];

        // Add accessories
        const rentalAccessories = [];
        if (accessories && accessories.length > 0) {
          for (const accessory of accessories) {
            // Get accessory details
            const accessoryResult = await client.query(
              'SELECT weekly_rate, monthly_rate, deposit_amount FROM accessories WHERE id = $1 AND is_active = true',
              [accessory.accessory_id]
            );

            if (accessoryResult.rows.length === 0) continue;

            const acc = accessoryResult.rows[0];

            // Auto-assign accessory inventory if color specified
            let accessoryInventoryId = null;
            if (accessory.selected_color) {
              const invResult = await client.query(
                `SELECT ii.id
                 FROM inventory_items ii
                 WHERE ii.accessory_id = $1
                   AND ii.color = $2
                   AND ii.status = 'available'
                   AND ii.id NOT IN (
                     SELECT ra.inventory_item_id
                     FROM rental_accessories ra
                     JOIN rentals r ON ra.rental_id = r.id
                     WHERE ra.inventory_item_id IS NOT NULL
                       AND r.status IN ('pending', 'confirmed', 'active')
                       AND r.start_date <= $4
                       AND r.end_date >= $3
                   )
                 ORDER BY ii.condition DESC
                 LIMIT 1`,
                [accessory.accessory_id, accessory.selected_color, start_date, end_date]
              );
              accessoryInventoryId = invResult.rows[0]?.id || null;
            }

            const raResult = await client.query(
              `INSERT INTO rental_accessories (
                rental_id, accessory_id, inventory_item_id, selected_color,
                weekly_rate, monthly_rate, deposit_amount
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING *`,
              [
                rental.id,
                accessory.accessory_id,
                accessoryInventoryId,
                accessory.selected_color || null,
                acc.weekly_rate,
                acc.monthly_rate,
                acc.deposit_amount,
              ]
            );

            rentalAccessories.push(raResult.rows[0]);
          }
        }

        await client.query('COMMIT');

        return reply.status(201).send({
          status: 'created',
          data: {
            rental: {
              ...rental,
              accessories: rentalAccessories,
              pricing,
            },
          },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create rental',
          statusCode: 500,
        });
      } finally {
        client.release();
      }
    }
  );

  // Get enhanced rental by ID with full details
  fastify.get<{ Params: IdParams }>(
    '/rentals/:id/details',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const user = (request as any).user;
        const isAdmin = ['admin', 'super_user'].includes(user.role);

        // Get rental with product and inventory details
        const rentalResult = await pool.query(
          `SELECT
            r.*,
            pt.name as product_name, pt.subtitle as product_subtitle, pt.image_url as product_image,
            pc.name as category_name, pc.color as category_color,
            ii.serial_number as inventory_serial, ii.condition as inventory_condition,
            u.name as user_name, u.email as user_email
          FROM rentals r
          LEFT JOIN product_templates pt ON r.product_template_id = pt.id
          LEFT JOIN product_categories pc ON pt.category_id = pc.id
          LEFT JOIN inventory_items ii ON r.inventory_item_id = ii.id
          JOIN users u ON r.user_id = u.id
          WHERE r.id = $1`,
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

        // Check ownership
        if (!isAdmin && rental.user_id !== user.userId) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You can only view your own rentals',
            statusCode: 403,
          });
        }

        // Get accessories
        const accessoriesResult = await pool.query(
          `SELECT
            ra.*,
            a.name as accessory_name, a.image_url as accessory_image,
            ii.serial_number as inventory_serial, ii.condition as inventory_condition
          FROM rental_accessories ra
          JOIN accessories a ON ra.accessory_id = a.id
          LEFT JOIN inventory_items ii ON ra.inventory_item_id = ii.id
          WHERE ra.rental_id = $1`,
          [id]
        );

        return reply.send({
          status: 'ok',
          data: {
            rental: {
              ...rental,
              accessories: accessoriesResult.rows,
            },
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch rental details',
          statusCode: 500,
        });
      }
    }
  );

  // Add accessory to existing rental (admin only)
  fastify.post<{ Params: IdParams; Body: AddRentalAccessoryRequest }>(
    '/rentals/:id/accessories',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      const client = await pool.connect();
      try {
        const { id } = request.params;
        const validation = addRentalAccessoryRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const { accessory_id, selected_color } = validation.data;

        await client.query('BEGIN');

        // Get rental
        const rentalResult = await client.query(
          'SELECT id, start_date, end_date, status, pricing_period FROM rentals WHERE id = $1',
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

        const rental = rentalResult.rows[0];

        if (!['pending', 'confirmed'].includes(rental.status)) {
          await client.query('ROLLBACK');
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Can only add accessories to pending or confirmed rentals',
            statusCode: 400,
          });
        }

        // Check if accessory already added
        const existingCheck = await client.query(
          'SELECT id FROM rental_accessories WHERE rental_id = $1 AND accessory_id = $2',
          [id, accessory_id]
        );

        if (existingCheck.rows.length > 0) {
          await client.query('ROLLBACK');
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Accessory already added to this rental',
            statusCode: 409,
          });
        }

        // Get accessory details
        const accessoryResult = await client.query(
          'SELECT weekly_rate, monthly_rate, deposit_amount FROM accessories WHERE id = $1 AND is_active = true',
          [accessory_id]
        );

        if (accessoryResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Accessory not found',
            statusCode: 404,
          });
        }

        const accessory = accessoryResult.rows[0];

        // Auto-assign inventory if color specified
        let inventoryItemId = null;
        if (selected_color) {
          const invResult = await client.query(
            `SELECT ii.id
             FROM inventory_items ii
             WHERE ii.accessory_id = $1
               AND ii.color = $2
               AND ii.status = 'available'
               AND ii.id NOT IN (
                 SELECT ra.inventory_item_id
                 FROM rental_accessories ra
                 JOIN rentals r ON ra.rental_id = r.id
                 WHERE ra.inventory_item_id IS NOT NULL
                   AND r.status IN ('pending', 'confirmed', 'active')
                   AND r.start_date <= $4
                   AND r.end_date >= $3
               )
             ORDER BY ii.condition DESC
             LIMIT 1`,
            [accessory_id, selected_color, rental.start_date, rental.end_date]
          );
          inventoryItemId = invResult.rows[0]?.id || null;
        }

        // Add accessory
        const result = await client.query(
          `INSERT INTO rental_accessories (
            rental_id, accessory_id, inventory_item_id, selected_color,
            weekly_rate, monthly_rate, deposit_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *`,
          [
            id,
            accessory_id,
            inventoryItemId,
            selected_color || null,
            accessory.weekly_rate,
            accessory.monthly_rate,
            accessory.deposit_amount,
          ]
        );

        // Recalculate rental total
        const rate = parseFloat(rental.pricing_period === 'weekly' ? accessory.weekly_rate : accessory.monthly_rate);
        const start = new Date(rental.start_date);
        const end = new Date(rental.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const periods = rental.pricing_period === 'weekly' ? Math.ceil(days / 7) : Math.ceil(days / 30);
        const additionalAmount = rate * periods;

        await client.query(
          `UPDATE rentals SET
            total_amount = total_amount + $2,
            final_total = final_total + $2,
            updated_at = NOW()
          WHERE id = $1`,
          [id, additionalAmount]
        );

        await client.query('COMMIT');

        return reply.status(201).send({
          status: 'created',
          data: { rental_accessory: result.rows[0] },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to add accessory',
          statusCode: 500,
        });
      } finally {
        client.release();
      }
    }
  );

  // Manually assign inventory to rental (admin only)
  fastify.post<{ Params: IdParams; Body: AssignInventoryRequest }>(
    '/rentals/:id/assign-inventory',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      const client = await pool.connect();
      try {
        const { id } = request.params;
        const validation = assignInventoryRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const { inventory_item_id, accessory_inventory_assignments } = validation.data;

        await client.query('BEGIN');

        // Get rental
        const rentalResult = await client.query(
          'SELECT id, product_template_id, start_date, end_date, status FROM rentals WHERE id = $1',
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

        const rental = rentalResult.rows[0];

        if (!['pending', 'confirmed'].includes(rental.status)) {
          await client.query('ROLLBACK');
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Can only assign inventory to pending or confirmed rentals',
            statusCode: 400,
          });
        }

        // Verify main inventory item
        const invResult = await client.query(
          'SELECT id, product_template_id FROM inventory_items WHERE id = $1 AND status = $2',
          [inventory_item_id, 'available']
        );

        if (invResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Inventory item not available',
            statusCode: 400,
          });
        }

        if (invResult.rows[0].product_template_id !== rental.product_template_id) {
          await client.query('ROLLBACK');
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Inventory item does not match rental product',
            statusCode: 400,
          });
        }

        // Assign main inventory
        await client.query(
          'UPDATE rentals SET inventory_item_id = $2, updated_at = NOW() WHERE id = $1',
          [id, inventory_item_id]
        );

        // Assign accessory inventory
        if (accessory_inventory_assignments && accessory_inventory_assignments.length > 0) {
          for (const assignment of accessory_inventory_assignments) {
            await client.query(
              'UPDATE rental_accessories SET inventory_item_id = $2 WHERE id = $1',
              [assignment.rental_accessory_id, assignment.inventory_item_id]
            );
          }
        }

        await client.query('COMMIT');

        return reply.send({
          status: 'ok',
          data: { message: 'Inventory assigned successfully' },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to assign inventory',
          statusCode: 500,
        });
      } finally {
        client.release();
      }
    }
  );

  // Release deposit (admin only)
  fastify.post<{ Params: IdParams; Body: { notes?: string } }>(
    '/rentals/:id/release-deposit',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { notes } = request.body || {};

        const rentalResult = await pool.query(
          'SELECT id, status, deposit_status FROM rentals WHERE id = $1',
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

        if (rental.status !== 'completed') {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Can only release deposit for completed rentals',
            statusCode: 400,
          });
        }

        if (rental.deposit_status !== 'held') {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Deposit has already been processed',
            statusCode: 400,
          });
        }

        const result = await pool.query(
          `UPDATE rentals
           SET deposit_status = 'released', deposit_released_at = NOW(), deposit_notes = $2, updated_at = NOW()
           WHERE id = $1
           RETURNING *`,
          [id, notes || null]
        );

        // Also update rental accessories deposit status
        await pool.query(
          "UPDATE rental_accessories SET deposit_status = 'released' WHERE rental_id = $1",
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
          message: 'Failed to release deposit',
          statusCode: 500,
        });
      }
    }
  );

  // Get pricing modifiers (public)
  fastify.get('/pricing-modifiers', async (request, reply) => {
    try {
      const result = await pool.query(
        `SELECT id, name, display_name, type, percentage, applies_to, requires_verification, description
         FROM pricing_modifiers
         WHERE is_active = true
         ORDER BY type, name`
      );

      return reply.send({
        status: 'ok',
        data: { modifiers: result.rows },
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch pricing modifiers',
        statusCode: 500,
      });
    }
  });
}
