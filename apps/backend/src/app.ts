// =============================================================================
// EXPRESS APPLICATION
// =============================================================================
// Configures Express app with middleware, routes, and error handlers
// Separated from server.ts to make testing easier

import 'express-async-errors'; // Must be first! Enables automatic async error handling
import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';

import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // =============================================================================
  // MIDDLEWARE - Order matters!
  // =============================================================================

  // 1. Security headers (first line of defense)
  app.use(helmet());

  // 2. CORS - Allow frontend to call API
  app.use(
    cors({
      origin: config.frontendUrl, // Only allow our frontend
      credentials: true, // Allow cookies and authorization headers
    })
  );

  // 3. Body parsing - Parse JSON and URL-encoded bodies
  app.use(express.json()); // Parse application/json
  app.use(express.urlencoded({ extended: true })); // Parse application/x-www-form-urlencoded

  // 4. Cookie parsing - Parse cookies from Cookie header
  app.use(cookieParser());

  // 5. Request logging - Log all requests
  app.use(
    pinoHttp({
      logger,
      // Don't log health check endpoints (too noisy)
      autoLogging: {
        ignore: req => req.url === '/health',
      },
    })
  );

  // =============================================================================
  // ROUTES
  // =============================================================================

  // Health check routes
  app.use('/health', healthRouter); // GET /health (simple)
  app.use('/api/v1', healthRouter); // GET /api/v1/health (detailed)

  // Future routes will go here:
  // app.use('/api/v1/auth', authRouter);     // M2: Authentication
  // app.use('/api/v1/alerts', alertRouter);  // M3: Alerts

  // =============================================================================
  // ERROR HANDLING - Must be last!
  // =============================================================================

  // 404 handler - Catches undefined routes
  app.use(notFoundHandler);

  // Global error handler - Catches all errors
  app.use(errorHandler);

  return app;
}

// Create and export the app
export const app = createApp();
