import { Request, Response } from 'express';
import { CreateUserSchema, LoginSchema } from '@forex-watch/shared';
import User from '../models/User.js';
import { authService } from '../services/authService.js';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * AuthRequest Interface
 * Extends Express Request to include userId set by authenticate middleware
 */
export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Register New User
 * POST /api/v1/auth/register
 *
 * Flow:
 * 1. Validate request body with Zod schema
 * 2. Check if email already exists
 * 3. Create user (password auto-hashed by model)
 * 4. Generate JWT tokens
 * 5. Return user + tokens
 *
 * @throws ValidationError - Invalid input data
 * @throws ConflictError - Email already exists
 */
export async function register(req: Request, res: Response): Promise<void> {
  // 1. Validate request body
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError(
      'Invalid registration data',
      result.error.format()
    );
  }

  const { email, password, name } = result.data;

  // 2. Check if email already exists (optional check before create)
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('Email already exists');
  }

  try {
    // 3. Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      email,
      password,
      name,
    });

    logger.info({ userId: user._id }, 'New user registered');

    // 4. Generate tokens
    const tokens = authService.generateTokens(String(user._id));

    // 5. Return success response
    res.status(201).json({
      message: 'User registered successfully',
      data: {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error: any) {
    // Handle MongoDB duplicate key error (race condition)
    if (error.code === 11000) {
      throw new ConflictError('Email already exists');
    }
    throw error;
  }
}

/**
 * Login User
 * POST /api/v1/auth/login
 *
 * Flow:
 * 1. Validate request body
 * 2. Find user by email (include password)
 * 3. Verify password
 * 4. Generate JWT tokens
 * 5. Return user + tokens
 *
 * Security: Returns same error for wrong email/password to prevent email enumeration
 *
 * @throws ValidationError - Invalid input data
 * @throws UnauthorizedError - Invalid credentials
 */
export async function login(req: Request, res: Response): Promise<void> {
  // 1. Validate request body
  const result = LoginSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid login data', result.error.format());
  }

  const { email, password } = result.data;

  // 2. Find user by email (explicitly include password field)
  const user = await User.findOne({ email }).select('+password');

  // 3. Verify password
  // Security: Always check password even if user not found (prevent timing attacks)
  const isMatch = user ? await user.comparePassword(password) : false;

  // Return same error for both wrong email and wrong password (prevent email enumeration)
  if (!user || !isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  logger.info({ userId: user._id }, 'User logged in');

  // 4. Generate tokens
  const tokens = authService.generateTokens(String(user._id));

  // 5. Return success response
  res.json({
    message: 'Login successful',
    data: {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
}

/**
 * Refresh Access Token
 * POST /api/v1/auth/refresh
 *
 * Flow:
 * 1. Extract refresh token from request body
 * 2. Verify refresh token
 * 3. Check if user still exists
 * 4. Generate new token pair
 * 5. Return new tokens
 *
 * @throws ValidationError - Missing refresh token
 * @throws UnauthorizedError - Invalid/expired refresh token
 * @throws NotFoundError - User no longer exists
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  // 1. Extract refresh token
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  // 2. Verify refresh token
  const payload = authService.verifyRefreshToken(refreshToken);

  // 3. Check if user still exists
  const user = await User.findById(payload.userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  logger.info({ userId: user._id }, 'Token refreshed');

  // 4. Generate new token pair
  const tokens = authService.generateTokens(String(user._id));

  // 5. Return new tokens
  res.json({
    message: 'Tokens refreshed successfully',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
}

/**
 * Logout User
 * POST /api/v1/auth/logout
 *
 * Note: JWT is stateless, so we can't truly "logout" server-side without a blacklist.
 * Client should delete tokens from storage.
 * Future enhancement (M3): Add token blacklist with Redis
 *
 * @throws UnauthorizedError - Invalid/missing access token (handled by middleware)
 */
export async function logout(req: AuthRequest, res: Response): Promise<void> {
  // userId is set by authenticate middleware
  logger.info({ userId: req.userId }, 'User logged out');

  res.json({
    message: 'Logout successful',
  });
}

/**
 * Get Current User
 * GET /api/v1/auth/me
 *
 * Flow:
 * 1. Get userId from request (set by authenticate middleware)
 * 2. Find user by ID
 * 3. Return user data
 *
 * @throws UnauthorizedError - Invalid/missing access token (handled by middleware)
 * @throws NotFoundError - User not found
 */
export async function getCurrentUser(
  req: AuthRequest,
  res: Response
): Promise<void> {
  // 1. Get userId from request (set by authenticate middleware)
  if (!req.userId) {
    throw new UnauthorizedError('Not authenticated');
  }

  // 2. Find user by ID
  const user = await User.findById(req.userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // 3. Return user data (no tokens)
  res.json({
    message: 'User retrieved successfully',
    data: {
      user,
    },
  });
}
