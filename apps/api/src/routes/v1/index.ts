import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth';

export async function v1Routes(fastify: FastifyInstance) {
  fastify.get('/', async (_request, reply) => {
    return reply.send({
      message: 'Welcome to innozverse API v1',
      endpoints: {
        health: '/health',
        auth: '/v1/auth'
      }
    });
  });

  // Register auth routes
  await fastify.register(authRoutes, { prefix: '/auth' });

  // Add more v1 routes here as the API grows
}
