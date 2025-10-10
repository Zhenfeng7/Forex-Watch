// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================
// Centralized error handling for Express application

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import {
  AppError,
  NotFoundError,
  isOperationalError,
  formatErrorResponse,
} from '../utils/errors.js';
import { config } from '../config/index.js';

/**
 * Global error handler middleware
 * Catches all errors thrown in routes and formats them consistently
 *
 * Must be registered AFTER all routes
 * Must have 4 parameters for Express to recognize it as error middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Check if it's an operational error (expected) vs programmer error (bug)
  if (isOperationalError(err)) {
    const appError = err as AppError;

    // Operational error - safe to expose to client
    logger.warn(
      {
        code: appError.code,
        statusCode: appError.statusCode,
        path: req.path,
        method: req.method,
        // Don't log request body in case it contains passwords
      },
      `Operational error: ${appError.message}`
    );

    // Send formatted error response
    res.status(appError.statusCode).json(formatErrorResponse(appError));
    return;
  }

  // Programmer error (bug) - hide details from client
  logger.error(
    {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body, // Log body for debugging (but not passwords)
    },
    'Unhandled programmer error'
  );

  // In production: hide error details
  // In development: show error message for debugging
  const message =
    config.nodeEnv === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(500).json({
    message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
}

/**
 * 404 Not Found handler
 * Catches requests to undefined routes
 *
 * Must be registered AFTER all routes but BEFORE error handler
 */
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  next(error); // Pass to error handler
}
