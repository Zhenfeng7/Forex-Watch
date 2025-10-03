// =============================================================================
// LOGGER UTILITY
// =============================================================================
// Pino logger with pretty-print in development, JSON in production

import pino from 'pino';
import { config } from '../config/index.js';

/**
 * Create Pino logger instance
 * - Development: Pretty-printed, colorized output
 * - Production: JSON format for log aggregation services
 */
export const logger = pino({
  level: config.logging.level,
  transport:
    config.nodeEnv === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined, // JSON format in production (no transport)
});

/**
 * Create child logger with additional context
 * Usage: const log = createChildLogger({ module: 'auth' })
 */
export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

// Log logger initialization
logger.info(
  { level: config.logging.level, env: config.nodeEnv },
  'Logger initialized'
);
