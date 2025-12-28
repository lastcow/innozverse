import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth';
import { usersRoutes } from './users';
import { equipmentRoutes } from './equipment';
import { rentalRoutes } from './rentals';
import { kbRoutes } from './kb';

export async function v1Routes(fastify: FastifyInstance) {
  fastify.get('/', async (_request, reply) => {
    return reply.send({
      message: 'Welcome to innozverse API v1',
      endpoints: {
        health: '/health',
        auth: '/v1/auth',
        users: '/v1/users',
        equipment: '/v1/equipment',
        rentals: '/v1/rentals',
        kb: '/v1/kb'
      }
    });
  });

  // Register auth routes
  await fastify.register(authRoutes, { prefix: '/auth' });

  // Register user management routes
  await fastify.register(usersRoutes);

  // Register equipment routes
  await fastify.register(equipmentRoutes);

  // Register rental routes
  await fastify.register(rentalRoutes);

  // Register knowledge base routes
  await fastify.register(kbRoutes);
}
