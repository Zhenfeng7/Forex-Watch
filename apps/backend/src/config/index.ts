// =============================================================================
// CONFIGURATION MODULE
// =============================================================================
// Loads and validates environment variables at application startup.
// Uses Zod schema from shared package for runtime validation.

import dotenv from 'dotenv';
import { EnvSchema, type AppConfig } from '@forex-watch/shared';

// Load environment variables from .env file
dotenv.config({ path: '../../.env' }); // Load from root .env

/**
 * Parse and validate environment variables
 * Throws error if validation fails (fail-fast principle)
 */
function loadConfig(): AppConfig {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Configuration validation failed');
  }

  const env = result.data;

  // Build structured config object
  const config: AppConfig = {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    mongoUri: env.MONGODB_URI,
    frontendUrl: env.FRONTEND_URL,

    jwt: {
      secret: env.JWT_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },

    bcrypt: {
      rounds: env.BCRYPT_ROUNDS,
    },

    rateLimit: {
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },

    logging: {
      level: env.LOG_LEVEL,
    },

    email: {
      provider: env.EMAIL_PROVIDER,
      from: {
        email: env.SES_FROM_EMAIL || 'noreply@forexwatch.local',
        name: env.SES_FROM_NAME || 'Forex Watch',
      },
      ...(env.EMAIL_PROVIDER === 'ses' && {
        ses: {
          region: env.AWS_REGION!,
          accessKeyId: env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
        },
      }),
      ...(env.EMAIL_PROVIDER === 'smtp' && {
        smtp: {
          host: env.SMTP_HOST!,
          port: env.SMTP_PORT!,
          user: env.SMTP_USER!,
          pass: env.SMTP_PASS!,
        },
      }),
    },

    rates: {
      provider: env.RATE_PROVIDER,
      ...(env.RATE_PROVIDER === 'exchangerate-api' && {
        apiKey: env.EXCHANGERATE_API_KEY,
      }),
      ...(env.RATE_PROVIDER === 'currencylayer' && {
        apiKey: env.CURRENCYLAYER_API_KEY,
      }),
    },
  };

  return config;
}

// Load config at module import time (fail fast if invalid)
export const config = loadConfig();

// Log successful config load (but not sensitive values)
console.log('✅ Configuration loaded successfully');
console.log(`   Environment: ${config.nodeEnv}`);
console.log(`   Port: ${config.port}`);
console.log(`   Email Provider: ${config.email.provider}`);
console.log(`   Rate Provider: ${config.rates.provider}`);
