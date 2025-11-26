import { Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { UnauthorizedError } from '../utils/errors.js';
import { AuthRequest } from '../controllers/authController.js';

/**
 * Authentication Middleware
 * Verifies JWT access token and attaches userId to request
 *
 * Flow:
 * 1. Extract token from Authorization header
 * 2. Verify token with authService
 * 3. Attach userId to request object
 * 4. Continue to next handler
 *
 * Used on protected routes that require authentication
 *
 * @throws UnauthorizedError - Missing or invalid token
 *
 * @example
 * router.post('/logout', authenticate, logout);
 * router.get('/me', authenticate, getCurrentUser);
 */
export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Extract token from Authorization header
    // Expected format: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization header provided');
    }

    // Split "Bearer <token>" and get the token part
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedError('Invalid authorization header format');
    }

    const token = parts[1];

    if (!token) {
      throw new UnauthorizedError('Token is missing');
    }

    // 2. Verify token using authService
    const payload = authService.verifyAccessToken(token);

    // 3. Ensure userId exists in payload
    if (!payload.userId) {
      throw new UnauthorizedError('Invalid token payload');
    }

    // 4. Attach userId to request for use in controllers
    req.userId = payload.userId;

    // 5. Continue to next handler (controller)
    next();
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}
