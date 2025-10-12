/**
 * Server entry point with graceful shutdown
 *
 * This file handles:
 * - Starting the HTTP server
 * - Connecting to MongoDB
 * - Graceful shutdown on SIGTERM/SIGINT
 * - Error handling for startup failures
 */

import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { app } from './app.js';

/**
 * Graceful shutdown handler
 * Stops accepting new connections and closes existing ones
 */
async function gracefulShutdown(server: any): Promise<void> {
  logger.info('Starting graceful shutdown...');

  return new Promise(resolve => {
    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
      resolve();
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  });
}

/**
 * Handle uncaught exceptions and unhandled rejections
 */
function setupErrorHandlers(): void {
  process.on('uncaughtException', error => {
    logger.error({ error }, 'Uncaught exception');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled promise rejection');
    process.exit(1);
  });
}

/**
 * Setup signal handlers for graceful shutdown
 */
function setupSignalHandlers(server: any): void {
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      logger.warn('Already shutting down, please wait...');
      return;
    }
    isShuttingDown = true;

    logger.info(`${signal} received, shutting down gracefully...`);

    try {
      await gracefulShutdown(server);
      await disconnectDatabase();
      logger.info('✅ Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Setup error handlers first
    setupErrorHandlers();

    // Connect to database
    logger.info('Connecting to MongoDB...');
    await connectDatabase();
    logger.info('✅ MongoDB connected successfully');

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server listening on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Frontend URL: ${config.frontendUrl}`);
      logger.info(`API Base URL: http://localhost:${config.port}/api/v1`);
    });

    // Setup graceful shutdown handlers
    setupSignalHandlers(server);

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} already in use`);
        logger.error('Another instance may be running');
        process.exit(1);
      } else {
        logger.error({ error }, 'Server error');
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server
startServer();

export { startServer };
