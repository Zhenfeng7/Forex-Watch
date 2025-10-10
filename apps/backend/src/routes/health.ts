// =============================================================================
// HEALTH CHECK ROUTES
// =============================================================================
// Endpoints for monitoring server health and status

import { Router, Request, Response } from 'express';
import { isDatabaseConnected } from '../config/database.js';

const router = Router();

/**
 * GET /health
 * Simple health check - returns immediately
 * Used by load balancers for quick checks (no database query)
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

/**
 * GET /api/v1/health
 * Detailed health check with system information
 * Includes database status, uptime, and timestamp
 */
router.get('/health', (_req: Request, res: Response) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(), // Seconds since Node.js process started
    database: isDatabaseConnected() ? 'connected' : 'disconnected',
  };

  res.json(healthStatus);
});

export default router;
