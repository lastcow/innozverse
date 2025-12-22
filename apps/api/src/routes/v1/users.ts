import { FastifyInstance } from 'fastify';
import { pool } from '../../db';
import { requireAuth } from '../../middleware/auth';
import {
  ListUsersRequest,
  UpdateUserRequest,
  InviteUserRequest,
} from '@innozverse/shared';
import crypto from 'crypto';
import { emailService } from '../../utils/email';

interface UserIdParams {
  id: string;
}

export async function usersRoutes(fastify: FastifyInstance) {
  // List users with pagination and filtering
  fastify.get<{ Querystring: ListUsersRequest }>(
    '/users',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { page = 1, limit = 20, role, search } = request.query;
        const offset = (page - 1) * limit;

        // Build query with filters
        let query = 'SELECT id, email, name, avatar_url, role, is_active, email_verified, email_verified_at, last_login_at, created_at, updated_at FROM users WHERE 1=1';
        const params: any[] = [];
        let paramCount = 1;

        if (role) {
          query += ` AND role = $${paramCount}`;
          params.push(role);
          paramCount++;
        }

        if (search) {
          query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
          params.push(`%${search}%`);
          paramCount++;
        }

        // Get total count
        const countQuery = query.replace(
          'SELECT id, email, name, avatar_url, role, is_active, email_verified, email_verified_at, last_login_at, created_at, updated_at FROM users',
          'SELECT COUNT(*) FROM users'
        );
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Add pagination
        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        return reply.send({
          status: 'ok',
          data: {
            users: result.rows,
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
          message: 'Failed to fetch users',
        });
      }
    }
  );

  // Get user by ID
  fastify.get<{ Params: UserIdParams }>(
    '/users/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { id } = request.params;

        // Get user
        const userResult = await pool.query(
          'SELECT id, email, name, avatar_url, role, is_active, email_verified, email_verified_at, last_login_at, created_at, updated_at FROM users WHERE id = $1',
          [id]
        );

        if (userResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'User not found',
          });
        }

        // Get OAuth providers
        const providersResult = await pool.query(
          'SELECT id, user_id, provider, provider_user_id, provider_email, provider_name, provider_avatar_url, created_at, updated_at FROM oauth_providers WHERE user_id = $1',
          [id]
        );

        const user = {
          ...userResult.rows[0],
          oauth_providers: providersResult.rows,
        };

        return reply.send({
          status: 'ok',
          data: { user },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch user',
        });
      }
    }
  );

  // Update user
  fastify.put<{ Params: UserIdParams; Body: UpdateUserRequest }>(
    '/users/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { name, role, is_active } = request.body;

        // Build update query
        const updates: string[] = [];
        const params: any[] = [];
        let paramCount = 1;

        if (name !== undefined) {
          updates.push(`name = $${paramCount}`);
          params.push(name);
          paramCount++;
        }

        if (role !== undefined) {
          updates.push(`role = $${paramCount}`);
          params.push(role);
          paramCount++;
        }

        if (is_active !== undefined) {
          updates.push(`is_active = $${paramCount}`);
          params.push(is_active);
          paramCount++;
        }

        if (updates.length === 0) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'No fields to update',
          });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const query = `
          UPDATE users
          SET ${updates.join(', ')}
          WHERE id = $${paramCount}
          RETURNING id, email, name, avatar_url, role, is_active, email_verified, email_verified_at, last_login_at, created_at, updated_at
        `;

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'User not found',
          });
        }

        return reply.send({
          status: 'ok',
          data: { user: result.rows[0] },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update user',
        });
      }
    }
  );

  // Delete user
  fastify.delete<{ Params: UserIdParams }>(
    '/users/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { id } = request.params;

        // Delete OAuth providers first (foreign key constraint)
        await pool.query('DELETE FROM oauth_providers WHERE user_id = $1', [id]);

        // Delete user
        const result = await pool.query(
          'DELETE FROM users WHERE id = $1 RETURNING id',
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'User not found',
          });
        }

        return reply.send({
          status: 'ok',
          data: { message: 'User deleted successfully' },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete user',
        });
      }
    }
  );

  // Invite user
  fastify.post<{ Body: InviteUserRequest }>(
    '/users/invite',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { email, name, role } = request.body;

        // Check if user already exists
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );

        if (existingUser.rows.length > 0) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'User with this email already exists',
          });
        }

        // Generate an invite token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

        // Create user with invite token (they'll need to set password via invite link)
        const result = await pool.query(
          `INSERT INTO users (email, name, role, password_hash, email_verified, is_active, invite_token, invite_expires_at)
           VALUES ($1, $2, $3, $4, false, true, $5, $6)
           RETURNING id, email, name, avatar_url, role, is_active, email_verified, email_verified_at, last_login_at, created_at, updated_at`,
          [email, name, role, '', inviteToken, inviteExpiresAt] // Empty password hash - user needs to set password via invite link
        );

        // Generate invite URL
        const webAppUrl = process.env.WEB_APP_URL || 'http://localhost:3000';
        const inviteUrl = `${webAppUrl}/accept-invite?token=${inviteToken}`;

        // Get the inviter's name from the authenticated user
        const inviterName = (request as any).user?.name;

        // Send invitation email (don't await - send in background)
        emailService.sendInvitation({
          to: email,
          name: name,
          inviteUrl: inviteUrl,
          inviterName: inviterName,
        }).then((result) => {
          if (result.success) {
            request.log.info({ to: email, messageId: result.messageId }, 'Invitation email sent successfully');
          } else {
            request.log.error({ to: email, error: result.error }, 'Failed to send invitation email');
          }
        }).catch((err) => {
          request.log.error(err, 'Failed to send invitation email (exception)');
        });

        return reply.status(201).send({
          status: 'ok',
          data: {
            user: result.rows[0],
            message: 'User invited successfully. Invitation email sent.',
          },
        });
      } catch (error) {
        request.log.error({ error, body: request.body }, 'Failed to invite user');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to invite user',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );
}
