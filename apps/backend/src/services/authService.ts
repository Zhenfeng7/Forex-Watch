import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * Token Payload Interface
 * Defines the structure of data stored in JWT tokens
 */
export interface TokenPayload {
  userId: string;
  type: 'access' | 'refresh';
  iat?: number; // Issued at (Unix timestamp, added by jwt.sign)
  exp?: number; // Expiration (Unix timestamp, added by jwt.sign)
}

/**
 * Token Pair Interface
 * Represents the access + refresh token pair returned to client
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Authentication Service
 * Handles all JWT token operations: generation, verification, and validation
 *
 * Design decisions:
 * - Class-based for easy mocking in tests
 * - Singleton instance for consistent usage
 * - Separate methods for access/refresh tokens (different validation rules)
 */
class AuthService {
  /**
   * Token expiration constants
   * Access: Short-lived (15 min) - used for API requests
   * Refresh: Long-lived (7 days) - used to get new access tokens
   */
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  /**
   * Generate Access + Refresh Token Pair
   * Called after successful login/registration
   *
   * @param userId - MongoDB ObjectId as string
   * @returns Token pair for client storage
   *
   * @example
   * const tokens = authService.generateTokens(user._id.toString());
   * res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
   */
  generateTokens(userId: string): TokenPair {
    const accessToken = jwt.sign(
      {
        userId,
        type: 'access' as const,
      },
      config.jwt.secret,
      {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
      }
    );

    const refreshToken = jwt.sign(
      {
        userId,
        type: 'refresh' as const,
      },
      config.jwt.secret,
      {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify Access Token
   * Used by authentication middleware to validate API requests
   *
   * Security checks:
   * 1. Signature validation (prevents tampering)
   * 2. Expiration check (prevents replay attacks)
   * 3. Type validation (prevents refresh token misuse)
   *
   * @param token - JWT token from Authorization header
   * @returns Decoded token payload with userId
   * @throws UnauthorizedError if token is invalid, expired, or wrong type
   *
   * @example
   * const payload = authService.verifyAccessToken(token);
   * req.userId = payload.userId;
   */
  verifyAccessToken(token: string): TokenPayload {
    // Validate token format
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new UnauthorizedError('Invalid token format');
    }

    try {
      const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;

      // Ensure it's an access token (not refresh token)
      if (payload.type !== 'access') {
        throw new UnauthorizedError('Invalid token type');
      }

      return payload;
    } catch (error) {
      // Handle JWT-specific errors with appropriate messages
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Access token expired');
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid access token');
      }

      // Re-throw if it's already our custom error
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      // Unexpected error
      throw new UnauthorizedError('Token verification failed');
    }
  }

  /**
   * Verify Refresh Token
   * Used by refresh endpoint to issue new access tokens
   *
   * Security checks:
   * 1. Signature validation (prevents tampering)
   * 2. Expiration check (forces re-login after 7 days)
   * 3. Type validation (prevents access token misuse)
   *
   * @param token - Refresh token from client storage
   * @returns Decoded token payload with userId
   * @throws UnauthorizedError if token is invalid, expired, or wrong type
   *
   * @example
   * const payload = authService.verifyRefreshToken(refreshToken);
   * const newTokens = authService.generateTokens(payload.userId);
   */
  verifyRefreshToken(token: string): TokenPayload {
    // Validate token format
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new UnauthorizedError('Invalid token format');
    }

    try {
      const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;

      // Ensure it's a refresh token (not access token)
      if (payload.type !== 'refresh') {
        throw new UnauthorizedError('Invalid token type');
      }

      return payload;
    } catch (error) {
      // Handle JWT-specific errors with appropriate messages
      if (error instanceof jwt.TokenExpiredError) {
        // More explicit message for refresh token expiry (requires re-login)
        throw new UnauthorizedError(
          'Refresh token expired. Please login again.'
        );
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Re-throw if it's already our custom error
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      // Unexpected error
      throw new UnauthorizedError('Token verification failed');
    }
  }
}

/**
 * Singleton Instance
 * Export single instance for consistent usage across application
 *
 * Benefits:
 * - Easy to mock in tests: jest.spyOn(authService, 'verifyAccessToken')
 * - Consistent configuration (expiry times)
 * - Can add state later (e.g., token rotation cache)
 */
export const authService = new AuthService();
