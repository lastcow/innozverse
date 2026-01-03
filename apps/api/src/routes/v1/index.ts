import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth';
import { usersRoutes } from './users';
import { equipmentRoutes } from './equipment';
import { rentalRoutes } from './rentals';
import { kbRoutes } from './kb';
import { catalogRoutes } from './catalog';
import { accessoryRoutes } from './accessories';
import { inventoryRoutes } from './inventory';
import { enhancedRentalRoutes } from './enhanced-rentals';

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
        kb: '/v1/kb',
        catalog: '/v1/catalog',
        accessories: '/v1/catalog/accessories',
        inventory: '/v1/admin/inventory'
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

  // Register product catalog routes (categories, products)
  await fastify.register(catalogRoutes);

  // Register accessory routes
  await fastify.register(accessoryRoutes);

  // Register inventory routes
  await fastify.register(inventoryRoutes);

  // Register enhanced rental routes
  await fastify.register(enhancedRentalRoutes);
}
