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
import { startRateFetcher } from './jobs/rateFetcher.js';

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
 * Start the server
 */
async function startServer(): Promise<void> {
  let stopRateFetcher: (() => void) | null = null;
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

    // Start background jobs
    stopRateFetcher = startRateFetcher();

    // Setup graceful shutdown handlers (stop jobs inside handler)
    const shutdown = async (sig: string) => {
      logger.info(`${sig} received, shutting down gracefully...`);
      try {
        if (stopRateFetcher) {
          stopRateFetcher();
        }
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

    // Ensure background jobs stop on exit
    process.on('SIGTERM', stopRateFetcher);
    process.on('SIGINT', stopRateFetcher);
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server
startServer();

export { startServer };
