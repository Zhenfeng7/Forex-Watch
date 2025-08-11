import { z } from 'zod';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

// Currency validation
export const CurrencySchema = z.enum([
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'SEK',
  'NZD',
  'MXN',
  'SGD',
  'HKD',
  'NOK',
  'TRY',
  'ZAR',
  'BRL',
  'INR',
  'KRW',
  'PLN',
]);

export const AlertDirectionSchema = z.enum(['gte', 'lte']);
export const UserPlanSchema = z.enum(['free', 'pro']);

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
});

export const PasswordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
});

// =============================================================================
// ALERT SCHEMAS
// =============================================================================

export const CreateAlertSchema = z
  .object({
    base: CurrencySchema,
    quote: CurrencySchema,
    targetRate: z
      .number()
      .positive('Target rate must be positive')
      .finite('Target rate must be a valid number')
      .refine(val => val > 0, 'Target rate must be greater than 0'),
    direction: AlertDirectionSchema,
  })
  .refine(data => data.base !== data.quote, {
    message: 'Base and quote currencies must be different',
    path: ['quote'],
  });

export const UpdateAlertSchema = z
  .object({
    targetRate: z
      .number()
      .positive('Target rate must be positive')
      .finite('Target rate must be a valid number')
      .optional(),
    direction: AlertDirectionSchema.optional(),
    active: z.boolean().optional(),
  })
  .refine(
    data => {
      // At least one field must be provided
      return (
        data.targetRate !== undefined ||
        data.direction !== undefined ||
        data.active !== undefined
      );
    },
    {
      message: 'At least one field must be provided for update',
    }
  );

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

export const PaginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 1, 'Page must be at least 1')
    .default('1'),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
    .default('10'),
});

export const AlertQuerySchema = PaginationSchema.extend({
  active: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  base: CurrencySchema.optional(),
  quote: CurrencySchema.optional(),
});

// =============================================================================
// RATE PROVIDER SCHEMAS
// =============================================================================

export const ExchangeRateSchema = z.object({
  base: CurrencySchema,
  quote: CurrencySchema,
  rate: z.number().positive(),
  timestamp: z.date(),
  provider: z.enum(['mock', 'exchangerate-api', 'currencylayer']),
});

// =============================================================================
// NOTIFICATION SCHEMAS
// =============================================================================

export const NotificationPayloadSchema = z.object({
  to: z.string().email('Invalid recipient email'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject too long'),
  html: z.string().min(1, 'HTML content is required'),
  text: z.string().optional(),
});

// =============================================================================
// ENVIRONMENT SCHEMAS
// =============================================================================

export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3001'),
  MONGODB_URI: z.string().url('Invalid MongoDB URI'),
  FRONTEND_URL: z.string().url('Invalid frontend URL'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Security
  BCRYPT_ROUNDS: z.string().regex(/^\d+$/).transform(Number).default('12'),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default('5'),

  // Logging
  LOG_LEVEL: z.string().default('info'),

  // Email
  EMAIL_PROVIDER: z.enum(['mock', 'smtp', 'ses']).default('mock'),
  SES_FROM_EMAIL: z.string().email().optional(),
  SES_FROM_NAME: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Rate Provider
  RATE_PROVIDER: z
    .enum(['mock', 'exchangerate-api', 'currencylayer'])
    .default('mock'),
  EXCHANGERATE_API_KEY: z.string().optional(),
  CURRENCYLAYER_API_KEY: z.string().optional(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type PasswordResetRequestInput = z.infer<
  typeof PasswordResetRequestSchema
>;
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;
export type CreateAlertInput = z.infer<typeof CreateAlertSchema>;
export type UpdateAlertInput = z.infer<typeof UpdateAlertSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type AlertQueryInput = z.infer<typeof AlertQuerySchema>;
export type NotificationPayloadInput = z.infer<
  typeof NotificationPayloadSchema
>;
export type EnvInput = z.infer<typeof EnvSchema>;
