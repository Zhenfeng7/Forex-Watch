# Forex-Watch Development Plan

## Complete Milestone Breakdown & Technology Stack

**Project**: Forex-Watch - Real-time Currency Exchange Rate Monitoring  
**Architecture**: Monolithic Backend + React Frontend + React Native Mobile  
**Repository**: https://github.com/Zhenfeng7/Forex-Watch  
**Created**: October 2025

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Milestone Breakdown](#milestone-breakdown)
4. [Development Phases](#development-phases)
5. [Tools & Dependencies](#tools--dependencies)
6. [Interview Preparation](#interview-preparation)

---

## 🎯 Project Overview

### Core Features

- **Real-time Exchange Rates**: Monitor USD/EUR, GBP/JPY, etc.
- **Price Alerts**: Set notifications when rates hit target values
- **User Authentication**: Secure login/registration with JWT
- **Multi-Platform**: Web app + iOS/Android mobile apps
- **Subscription Plans**: Free, Basic, Premium tiers

### Target Users

- Forex traders
- International business owners
- Travelers
- Currency exchange enthusiasts

---

## 🛠 Technology Stack

### Backend

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Zod schemas
- **Logging**: Pino structured logging
- **Security**: Helmet, CORS, bcrypt
- **Testing**: Vitest + Supertest

### Frontend (Web)

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Language**: TypeScript

### Mobile

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State Management**: React Query
- **Storage**: AsyncStorage + Keychain
- **Push Notifications**: Expo Notifications

### DevOps & Tools

- **Monorepo**: npm workspaces + Turbo
- **Version Control**: Git + GitHub
- **Package Manager**: npm
- **Linting**: ESLint + Prettier
- **Pre-commit**: Husky + lint-staged
- **CI/CD**: GitHub Actions (planned)

---

## 📊 Milestone Breakdown

## ✅ M0 - Repository & Developer Experience (COMPLETED)

**Duration**: 8-10 hours  
**Status**: ✅ Complete

### Steps Completed

1. **Monorepo Setup**
   - npm workspaces configuration
   - Turbo build orchestration
   - Package structure (apps/, packages/)

2. **TypeScript Configuration**
   - tsconfig.json for each package
   - Path mapping and module resolution
   - Strict type checking enabled

3. **Code Quality Tools**
   - ESLint configuration
   - Prettier formatting
   - Husky pre-commit hooks
   - lint-staged for staged files

4. **Shared Package**
   - `@forex-watch/shared` package
   - TypeScript interfaces
   - Zod validation schemas
   - Reusable types across monorepo

5. **Documentation**
   - README with setup instructions
   - Environment variable template
   - Development guidelines

### Tools Used

- npm workspaces
- Turbo
- TypeScript
- ESLint + Prettier
- Husky + lint-staged
- Zod

---

## ✅ M1 - Backend Foundation (COMPLETED)

**Duration**: 6-8 hours  
**Status**: ✅ Complete

### Steps Completed

1. **Configuration Management**
   - Environment variable validation with Zod
   - Fail-fast configuration loading
   - Type-safe config object

2. **Logging System**
   - Pino structured logging
   - Pretty-print in development
   - JSON format in production
   - Request/response logging

3. **Database Connection**
   - MongoDB with Mongoose
   - Connection pooling
   - Graceful shutdown handling
   - Connection status monitoring

4. **Error Handling**
   - Custom error classes hierarchy
   - Centralized error middleware
   - Operational vs programmer errors
   - Consistent error responses

5. **Health Check Endpoints**
   - Simple health check (`/health`)
   - Detailed health check (`/api/v1/health`)
   - Database status reporting

6. **Express Application Setup**
   - Middleware chain configuration
   - Security headers (Helmet)
   - CORS configuration
   - Body parsing setup

7. **Server Entry Point**
   - Graceful shutdown handling
   - Signal handlers (SIGTERM, SIGINT)
   - Error handling for startup failures

### Tools Used

- Express.js
- Mongoose
- Pino + pino-http
- Helmet
- CORS
- dotenv
- express-async-errors

---

## ✅ M2 - Authentication & Alerts API (COMPLETED)

**Duration**: 12-15 hours  
**Status**: ✅ Complete

### Phase 1: Authentication (Steps 1-5) ✅

#### Step 1: User Model ✅

- Mongoose schema with validation
- Password hashing with bcrypt
- Email uniqueness and normalization
- Instance methods (comparePassword, toJSON)

#### Step 2: Authentication Service ✅

- JWT token generation (access + refresh)
- Token verification with type validation
- Input validation for security
- Singleton pattern for consistency

#### Step 3: Authentication Controller ✅

- Register endpoint with validation
- Login with email enumeration prevention
- Token refresh functionality
- Logout and get current user endpoints

#### Step 4: Authentication Routes ✅

- Express router configuration
- Public vs protected route separation
- Route mounting at `/api/v1/auth`

#### Step 5: Authentication Middleware ✅

- JWT token verification
- Authorization header parsing
- User ID attachment to requests
- Error handling for invalid tokens

### Phase 2: Alerts API (Steps 6-8) ✅

#### Step 6: Alert Model ✅

- Mongoose schema for forex alerts
- User relationship (foreign key)
- Currency pair validation
- Status tracking (active, triggered, paused)

#### Step 7: Alert Controller ✅

- CRUD operations for alerts
- User authorization checks
- Input validation with Zod
- Pagination support

#### Step 8: Alert Routes ✅

- RESTful API endpoints
- Authentication middleware integration
- Route mounting at `/api/v1/alerts`

### Tools Used

- jsonwebtoken
- bcrypt
- Zod validation
- Express Router
- Custom middleware

---

## 🚧 M3 - Rate Monitoring & Alert Engine (IN PROGRESS)

**Duration**: 15-20 hours  
**Status**: 🚧 In Progress

### Steps Planned (small, testable)

1. **M3.1 Rate Provider Client** ✅
   - Added Freecurrencyapi provider with env validation (API key, base URL), timeout/retry.
   - Batching support for one base → many quotes; mock provider for local.
   - Unit tests with mocked fetch (success, 4xx/5xx, timeout).

2. **M3.2 Rate Cache**
   - In-memory cache with TTL and stale-while-revalidate.
   - Tests: cache hit/miss, TTL expiry, stale fallback on fetch error.

3. **M3.3 Scheduled Rate Refresh**
   - node-cron job to refresh a fixed pair list into cache/store.
   - Structured logging, metrics counters, graceful shutdown hooks.
   - Tests: schedule wiring and fetch invocation (mocks).

4. **M3.4 Alert Evaluation Logic**
   - Pure function to decide trigger/no-trigger with reason.
   - Tests: above/below/equal thresholds, paused/triggered states.

5. **M3.5 Alert Runner Job**
   - Job pulls active alerts, gets rates (cache first), runs evaluator.
   - Enqueue notification payloads (no email yet).
   - Integration-style test with mocked DB/cache/queue.

6. **M3.6 Rate Persistence (minimal)**
   - Schema for rate snapshots (pair, rate, timestamp) with retention trim.
   - Tests: insert/read and retention cleanup.

### Tools Needed

- node-cron
- ExchangeRate-API
- Redis (for caching)
- Bull Queue (for job processing)

---

## 📋 M4 - Email Notifications (PLANNED)

**Duration**: 8-10 hours  
**Status**: 📋 Planned

### Steps (small, testable)

1. **M4.1 Provider Wiring**
   - SES creds/env validation, SMTP fallback toggle.
   - Health check endpoint or script; mocked tests for config validation.

2. **M4.2 Template Rendering**
   - Minimal alert-trigger email template (text + HTML).
   - Unit tests for template variables and rendering.

3. **M4.3 Email Queue Worker**
   - Queue job shape for alerts; worker sends via SES/SMTP with retry + backoff.
   - Tests: job success/failure paths with mocked transport.

4. **M4.4 User Email Preferences**
   - CRUD endpoints/fields for email opt-in and frequency.
   - Tests: validation + authorization.

### Tools Needed

- AWS SES
- Nodemailer
- Handlebars (templates)
- Bull Queue

---

## 📋 M5 - Frontend Web Application (PLANNED)

**Duration**: 20-25 hours  
**Status**: 📋 Planned

### Steps (small, testable)

1. **M5.1 App Shell**
   - Vite + Tailwind + routing + layout; lint/build working.

2. **M5.2 Auth Flows**
   - Login/register forms with RHF + Zod; token storage; protected route guard.
   - Component tests for validation and guard redirect.

3. **M5.3 Rates Dashboard**
   - Pair list view with live fetch via React Query; loading/error states.
   - Tests: query wiring mocked; UI state snapshots.

4. **M5.4 Alert CRUD UI**
   - List/create/edit/disable alert screens; optimistic updates.
   - Tests: form validation + mutation calls mocked.

### Tools Needed

- React 18
- Vite
- Tailwind CSS
- React Query
- React Router
- React Hook Form
- Axios

---

## 📋 M6 - Mobile Application (PLANNED)

**Duration**: 25-30 hours  
**Status**: 📋 Planned

### Steps (small, testable)

1. **M6.1 Expo Shell**
   - Expo init, navigation scaffold, theming; Android/iOS builds run locally.

2. **M6.2 Auth & Storage**
   - Login/register screens; secure token storage (Keychain/Keystore); auto-login.
   - Tests: storage adapter + auth hook logic.

3. **M6.3 Rates & Alerts**
   - Rates list + alert list/create/edit; reuse API client; pull-to-refresh.
   - Tests: hooks with mocked API.

4. **M6.4 Notifications**
   - Push permission flow; receive/display alert notifications; link to alert.
   - Tests: notification handler unit tests (mocked).

### Tools Needed

- React Native
- Expo
- React Navigation
- AsyncStorage
- Expo Notifications
- React Native Keychain

---

## 📋 M7 - Production Deployment (PLANNED)

**Duration**: 10-12 hours  
**Status**: 📋 Planned

### Steps (small, testable)

1. **M7.1 Containerization**
   - Multi-stage Dockerfile + docker-compose; healthcheck; smoke test locally.

2. **M7.2 CI/CD**
   - GitHub Actions: lint/test/build; optional docker build + push.
   - Tests: pipeline succeeds on PR with cached deps.

3. **M7.3 Cloud Deploy**
   - Deploy to chosen target (e.g., AWS ECS/EC2) with env wiring and TLS.
   - Verify health endpoint + rollback plan.

4. **M7.4 Monitoring**
   - Sentry error tracking + basic APM/metrics + log aggregation hook.
   - Tests: DSN wired and sample event sent in non-prod.

### Tools Needed

- Docker
- AWS/GCP
- GitHub Actions
- Sentry (error tracking)
- DataDog/New Relic (monitoring)

---

## 🛠 Tools & Dependencies

### Backend Dependencies

```json
{
  "dependencies": {
    "express": "^4.21.2",
    "mongoose": "^8.0.3",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "zod": "^3.22.4",
    "pino": "^8.17.2",
    "helmet": "^7.2.0",
    "cors": "^2.8.5",
    "node-cron": "^3.0.3",
    "nodemailer": "^6.9.7",
    "express-async-errors": "^3.1.1"
  }
}
```

### Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.45.0",
    "react-router-dom": "^6.15.0",
    "axios": "^1.5.0",
    "tailwindcss": "^3.3.0"
  }
}
```

### Mobile Dependencies

```json
{
  "dependencies": {
    "expo": "~49.0.0",
    "react-native": "0.72.6",
    "@react-navigation/native": "^6.1.0",
    "@react-native-async-storage/async-storage": "1.18.2",
    "expo-notifications": "~0.20.1"
  }
}
```

### Development Tools

```json
{
  "devDependencies": {
    "typescript": "^5.3.0",
    "eslint": "^8.50.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^14.0.0",
    "vitest": "^1.0.0",
    "supertest": "^6.3.0"
  }
}
```

---

## 🎯 Development Phases

### Phase 1: Backend Foundation (M0-M2) ✅

- **Focus**: Core infrastructure and authentication
- **Duration**: 26-33 hours
- **Deliverable**: Working API with user management

### Phase 2: Core Features (M3-M4) 🚧

- **Focus**: Rate monitoring and notifications
- **Duration**: 23-30 hours
- **Deliverable**: Complete backend with alert system

### Phase 3: User Interfaces (M5-M6) 📋

- **Focus**: Web and mobile applications
- **Duration**: 45-55 hours
- **Deliverable**: Full-stack application

### Phase 4: Production (M7) 📋

- **Focus**: Deployment and monitoring
- **Duration**: 10-12 hours
- **Deliverable**: Production-ready application

---

## 📈 Progress Tracking

### Completed Milestones

- ✅ M0: Repository & Developer Experience
- ✅ M1: Backend Foundation
- ✅ M2: Authentication & Alerts API

### Current Status

- 🚧 M3: Rate Monitoring & Alert Engine (In Progress)

### Upcoming Milestones

- 📋 M4: Email Notifications
- 📋 M5: Frontend Web Application
- 📋 M6: Mobile Application
- 📋 M7: Production Deployment

---

## 🎓 Interview Preparation

### Key Technical Decisions

1. **Monolithic Architecture**: Chosen for faster development and simpler deployment
2. **JWT Authentication**: Stateless tokens for mobile compatibility
3. **MongoDB**: Document database for flexible schema
4. **React Native**: Cross-platform mobile development
5. **TypeScript**: Type safety across the entire stack

### Architecture Highlights

- **Monorepo**: Shared types and validation across packages
- **Error Handling**: Centralized error management with custom error classes
- **Security**: bcrypt password hashing, JWT tokens, input validation
- **Logging**: Structured logging with Pino for production monitoring
- **Testing**: Comprehensive test coverage with Vitest

### Scalability Considerations

- **Database**: MongoDB with proper indexing
- **Caching**: Redis for rate data caching
- **Background Jobs**: Bull Queue for alert processing
- **Monitoring**: Application performance monitoring
- **CDN**: Static asset delivery optimization

---

## 📞 Contact & Resources

**Repository**: https://github.com/Zhenfeng7/Forex-Watch  
**Boilerplate**: https://github.com/Zhenfeng7/express-api-boilerplate  
**Documentation**: See `/docs` folder in repository

**Total Estimated Development Time**: 104-130 hours  
**Current Progress**: ~35% complete (M0-M2 done)

---

_This document serves as a comprehensive guide for the Forex-Watch development project. It outlines all milestones, steps, tools, and technical decisions made throughout the development process._
