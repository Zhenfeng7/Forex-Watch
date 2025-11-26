import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';

/**
 * Authentication Routes
 * Handles user registration, login, token refresh, logout, and profile
 *
 * Base path: /api/v1/auth
 *
 * Public routes (no authentication required):
 * - POST /register - Create new user account
 * - POST /login    - Authenticate user and get tokens
 * - POST /refresh  - Get new access token using refresh token
 *
 * Protected routes (authentication required):
 * - POST /logout   - Logout user (invalidate session)
 * - GET  /me       - Get current user profile
 */
const router = Router();

// =============================================================================
// PUBLIC ROUTES (No authentication required)
// =============================================================================

/**
 * POST /api/v1/auth/register
 * Register a new user
 *
 * Body: { email, password, name }
 * Response: { user, accessToken, refreshToken }
 */
router.post('/register', register);

/**
 * POST /api/v1/auth/login
 * Login existing user
 *
 * Body: { email, password }
 * Response: { user, accessToken, refreshToken }
 */
router.post('/login', login);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 *
 * Body: { refreshToken }
 * Response: { accessToken, refreshToken }
 */
router.post('/refresh', refresh);

// =============================================================================
// PROTECTED ROUTES (Authentication required via middleware)
// =============================================================================

/**
 * POST /api/v1/auth/logout
 * Logout user
 *
 * Headers: Authorization: Bearer <accessToken>
 * Response: { message: "Logout successful" }
 */
router.post('/logout', authenticate, logout);

/**
 * GET /api/v1/auth/me
 * Get current user profile
 *
 * Headers: Authorization: Bearer <accessToken>
 * Response: { user }
 */
router.get('/me', authenticate, getCurrentUser);

export default router;
