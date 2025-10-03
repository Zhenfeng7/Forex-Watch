// =============================================================================
// DATABASE CONNECTION
// =============================================================================
// MongoDB connection using Mongoose

import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { config } from './index.js';

/**
 * Connect to MongoDB
 * Configures connection options and handles connection events
 */
export async function connectDatabase(): Promise<void> {
  try {
    logger.info({ uri: config.mongoUri }, 'Connecting to MongoDB...');

    await mongoose.connect(config.mongoUri, {
      // Connection options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('✅ MongoDB connected successfully');

    // Connection event listeners
    mongoose.connection.on('error', err => {
      logger.error({ err }, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown handler
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });
  } catch (error) {
    logger.error({ error }, '❌ Failed to connect to MongoDB');
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 * Used for graceful shutdown and testing
 */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
  logger.info('MongoDB disconnected');
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
