// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('dotenv').config();
  } catch (err) {
    console.log('dotenv not available, using system environment variables');
  }
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { DEFAULT_API_PORT } from '@innozverse/shared';
import { healthRoutes } from './routes/health';
import { v1Routes } from './routes/v1';
import { testConnection } from './db';

const PORT = parseInt(process.env.PORT || String(DEFAULT_API_PORT), 10);
const HOST = process.env.HOST || '0.0.0.0';

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info'
    }
  });

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  });

  fastify.register(healthRoutes);
  fastify.register(v1Routes, { prefix: '/v1' });

  return fastify;
}

async function start() {
  const fastify = await buildServer();

  // Test database connection
  console.log('🔌 Testing database connection...');
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log('✅ Database connection successful');
  } else {
    console.warn('⚠️  Database connection failed - server will start but database features may not work');
  }

  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 API server running on http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

export { buildServer };
