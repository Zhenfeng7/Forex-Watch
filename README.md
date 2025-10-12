# Forex-Watch

A simple web application that helps users make better currency purchase decisions by setting up FX rate alerts and receiving email notifications when target rates are met.

## 🎯 Core Features

- **Authentication**: Email + password sign up, login, logout, and password reset
- **Alerts**: Set desired FX rates between currencies with direction thresholds (≥ or ≤)
- **Notifications**: Email alerts when live rates meet user-defined thresholds
- **Dashboard**: Minimal interface to create, read, update, and delete alerts with status tracking

## 🏗️ Architecture

This is a TypeScript monorepo with three main packages:

- **`apps/backend`**: Node.js + Express API server
- **`apps/frontend`**: React + Vite web application
- **`packages/shared`**: Shared types, schemas, and validation logic

## 🛠️ Tech Stack

### Backend

- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express with Zod validation
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (access + refresh tokens) with bcrypt password hashing
- **Scheduling**: node-cron for periodic rate checks
- **Email**: Nodemailer + AWS SES (configurable providers)
- **Logging**: Pino structured logging
- **Security**: Helmet, CORS, rate limiting, HTTP-only cookies

### Frontend

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios

### External Services

- **Rate Provider**: Configurable interface (mock, ExchangeRate-API, CurrencyLayer)
- **Email Provider**: Configurable (mock, SMTP, AWS SES)
- **Database**: MongoDB Atlas

### Development & Testing

- **Monorepo**: npm workspaces with Turbo for build orchestration
- **Linting**: ESLint + Prettier with pre-commit hooks (Husky + lint-staged)
- **Testing**: Vitest (unit/integration), Supertest (API), Playwright (E2E)
- **Integration Testing**: mongodb-memory-server for isolated database tests

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- MongoDB (local or Atlas)

### Installation

1. **Clone and install dependencies**:

   ```bash
   git clone <repository-url>
   cd forex-watch
   npm install
   ```

2. **Set up environment variables**:

   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

3. **Build shared packages**:

   ```bash
   npm run build
   ```

4. **Start development servers**:
   ```bash
   npm run dev
   ```
   This starts both frontend (http://localhost:5173) and backend (http://localhost:3001)

### Environment Configuration

Copy `env.example` to `.env` and configure:

- **Database**: `MONGODB_URI` (local: `mongodb://localhost:27017/forex-watch-dev`)
- **JWT Secrets**: Generate secure 32+ character strings
- **Email Provider**: Choose 'mock', 'smtp', or 'ses' and configure accordingly
- **Rate Provider**: Choose 'mock', 'exchangerate-api', or 'currencylayer'

## 📝 Available Scripts

### Root Level

```bash
npm run dev          # Start all development servers
npm run build        # Build all packages
npm run test         # Run all tests
npm run test:e2e     # Run end-to-end tests
npm run lint         # Lint all packages
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
```

### Package-Specific

```bash
# Backend
cd apps/backend
npm run dev          # Start API server with hot reload
npm run test         # Unit and integration tests
npm run test:integration  # Integration tests only

# Frontend
cd apps/frontend
npm run dev          # Start React dev server
npm run test         # Component tests
npm run test:e2e     # Playwright E2E tests

# Shared
cd packages/shared
npm run build        # Build types and schemas
npm run dev          # Build in watch mode
```

## 🗄️ Data Models

### User

```typescript
{
  _id: string;
  email: string;           // unique
  passwordHash: string;    // bcrypt hashed
  createdAt: Date;
  plan?: 'free' | 'pro';
  planExpiresAt?: Date;
}
```

### Alert

```typescript
{
  _id: string;
  userId: string;
  base: Currency;          // e.g., 'USD'
  quote: Currency;         // e.g., 'EUR'
  targetRate: number;      // desired exchange rate
  direction: 'gte' | 'lte'; // trigger when rate is >= or <=
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  triggeredAt?: Date;      // when condition was met
  notifiedAt?: Date;       // when email was sent
}
```

## 🔒 Security Features

- **Password Security**: bcrypt with 12 rounds
- **JWT Authentication**: Access tokens (15min) + refresh tokens (7 days)
- **HTTP-only Cookies**: Prevents XSS attacks
- **Rate Limiting**: Protects auth endpoints
- **Input Validation**: Zod schemas on all routes
- **CORS Protection**: Locked to frontend origin
- **Security Headers**: Helmet middleware
- **No PII Logging**: Sensitive data excluded from logs

## 🧪 Testing Strategy

- **Unit Tests**: Service layer logic and utilities
- **Integration Tests**: API endpoints with in-memory MongoDB
- **E2E Tests**: Complete user flows with Playwright
- **Validation Tests**: Zod schema edge cases
- **Coverage Target**: 80%+ on services and controllers

## 🚢 Deployment

### Current Status

Development-ready local setup with production-oriented architecture.

### Planned Deployment Targets

- **Frontend**: AWS S3 + CloudFront (or Amplify)
- **Backend**: AWS Elastic Beanstalk or ECS/Fargate
- **Database**: MongoDB Atlas with IP allowlisting/VPC peering
- **Email**: AWS SES in same region
- **Environment**: AWS SSM Parameter Store
- **CI/CD**: GitHub Actions (build, test, deploy)

## 📋 Development Roadmap

### ✅ M0 - Repository & Developer Experience

- [x] Monorepo scaffolding with npm workspaces
- [x] TypeScript configuration across packages
- [x] ESLint + Prettier + Husky setup
- [x] Shared types and Zod validation schemas
- [x] Turbo build orchestration
- [x] Documentation and environment setup

### ✅ M1 - Backend Foundation

- [x] Express application setup with middleware chain
- [x] Health check endpoints (/health, /api/v1/health)
- [x] Pino logging configuration with pretty-print
- [x] Centralized error handling middleware
- [x] Configuration management with Zod validation
- [x] MongoDB connection with graceful shutdown
- [x] Server entry point with signal handlers
- [ ] Dockerfile (planned for M7)

### 📅 Upcoming Milestones

- **M2**: Authentication (User model, JWT, bcrypt, auth routes)
- **M3**: Alerts Domain (Alert model, CRUD routes, validation)
- **M4**: Rate Checking & Notifications (Rate providers, cron jobs, email service)
- **M5**: Frontend (React app, auth flows, alerts UI)
- **M6**: Hardening (Security headers, logging, comprehensive testing)
- **M7**: Deployment (Infrastructure, CI/CD, production deployment)

## 🎁 Reusable Boilerplate

This project includes a production-ready Express.js + TypeScript boilerplate that can be extracted for other projects!

**🔗 GitHub Template:** [express-api-boilerplate](https://github.com/Zhenfeng7/express-api-boilerplate)

### Quick Start

**Option 1: Use GitHub Template** (Recommended)

```bash
# Click "Use this template" on GitHub or:
gh repo create my-new-api --template Zhenfeng7/express-api-boilerplate
```

**Option 2: Use Local Script**

```bash
./scripts/create-boilerplate.sh my-new-api
cd my-new-api
npm install
cp .env.example .env
npm run dev
```

### What's Included

- ✅ TypeScript configuration
- ✅ Environment validation with Zod
- ✅ Structured logging (Pino)
- ✅ Centralized error handling
- ✅ MongoDB with Mongoose
- ✅ Security middleware (Helmet, CORS)
- ✅ Graceful shutdown
- ✅ Health check endpoints
- ✅ Example files (model, controller, routes)

### Documentation

- [GitHub Template Repository](https://github.com/Zhenfeng7/express-api-boilerplate)
- [Boilerplate Guide](./docs/boilerplate-guide.md) - Local extraction instructions
- [Template README](https://github.com/Zhenfeng7/express-api-boilerplate#readme) - Comprehensive usage guide

---

## 🤝 Contributing

1. Follow the existing code style (enforced by ESLint/Prettier)
2. Write tests for new features
3. Ensure all checks pass: `npm run lint && npm run type-check && npm run test`
4. Keep changes focused and atomic (≤300 lines per PR)
5. Update documentation for user-facing changes

## 📄 License

This project is private and proprietary.

---

## 🔗 Quick Links

- [Environment Variables](./env.example)
- [Shared Types](./packages/shared/src/types/index.ts)
- [API Schemas](./packages/shared/src/schemas/index.ts)
- [Backend Package](./apps/backend/)
- [Frontend Package](./apps/frontend/)

For questions or issues, please refer to the project documentation or create an issue in the repository.
