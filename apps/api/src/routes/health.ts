import { FastifyInstance } from 'fastify';
import { HealthResponse } from '@innozverse/shared';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get<{ Reply: HealthResponse }>('/health', async (_request, reply) => {
    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || '1.0.0'
    };

    return reply.code(200).send(response);
  });
}
