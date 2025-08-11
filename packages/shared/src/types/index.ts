// =============================================================================
// CORE DOMAIN TYPES
// =============================================================================

export type Currency =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'AUD'
  | 'CAD'
  | 'CHF'
  | 'CNY'
  | 'SEK'
  | 'NZD'
  | 'MXN'
  | 'SGD'
  | 'HKD'
  | 'NOK'
  | 'TRY'
  | 'ZAR'
  | 'BRL'
  | 'INR'
  | 'KRW'
  | 'PLN';

export type AlertDirection = 'gte' | 'lte';
export type UserPlan = 'free' | 'pro';
export type RateProvider = 'mock' | 'exchangerate-api' | 'currencylayer';
export type EmailProvider = 'mock' | 'smtp' | 'ses';

// =============================================================================
// DATABASE MODELS
// =============================================================================

export interface User {
  _id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  plan?: UserPlan;
  planExpiresAt?: Date;
}

export interface Alert {
  _id: string;
  userId: string;
  base: Currency;
  quote: Currency;
  targetRate: number;
  direction: AlertDirection;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  triggeredAt?: Date;
  notifiedAt?: Date;
}

// =============================================================================
// API DATA TRANSFER OBJECTS
// =============================================================================

export interface CreateUserDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface PasswordResetRequestDto {
  email: string;
}

export interface PasswordResetDto {
  token: string;
  newPassword: string;
}

export interface CreateAlertDto {
  base: Currency;
  quote: Currency;
  targetRate: number;
  direction: AlertDirection;
}

export interface UpdateAlertDto {
  targetRate?: number;
  direction?: AlertDirection;
  active?: boolean;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// =============================================================================
// RATE PROVIDER TYPES
// =============================================================================

export interface ExchangeRate {
  base: Currency;
  quote: Currency;
  rate: number;
  timestamp: Date;
  provider: RateProvider;
}

export interface RateProviderConfig {
  provider: RateProvider;
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export interface EmailConfig {
  provider: EmailProvider;
  from: {
    email: string;
    name: string;
  };
  ses?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
}

export interface NotificationPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  mongoUri: string;
  frontendUrl: string;
  jwt: {
    secret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  bcrypt: {
    rounds: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
  };
  email: EmailConfig;
  rates: RateProviderConfig;
}
