// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================
// Custom error classes for consistent error handling across the application

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    details?: unknown,
    isOperational = true
  ) {
    super(message);

    // Maintains proper stack trace for where error was thrown (V8 only)
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    // Required for instanceof to work correctly with TypeScript
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * 400 Bad Request - Validation or client input error
 * Use when request is malformed or fails validation
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * 401 Unauthorized - Authentication required or failed
 * Use when user is not authenticated or token is invalid/expired
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * 403 Forbidden - Authenticated but not authorized
 * Use when user is logged in but doesn't have permission for this resource
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 * Use when requested resource is not found in database
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * 409 Conflict - Resource already exists or conflict with current state
 * Use for duplicate keys, unique constraint violations, or state conflicts
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Check if an error is an operational error (expected) vs programmer error (bug)
 * Operational errors are safe to expose to clients
 * Programmer errors should be logged but not exposed in detail
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Format error for API response
 * Removes stack traces and sensitive information
 */
export function formatErrorResponse(error: AppError): {
  message: string;
  code?: string;
  details?: unknown;
} {
  const response: { message: string; code?: string; details?: unknown } = {
    message: error.message,
  };

  if (error.code) response.code = error.code;
  if (error.details) response.details = error.details;

  return response;
}
