# Development Journal

> **Purpose**: Day-to-day progress, technical insights, "aha!" moments, and time tracking.
> This document shows your development process, not just results.

---

## Week 1: October 1-7, 2025

### October 1, 2025 - Project Planning & M0 Review

**Time spent**: ~3 hours

**What happened:**

- Returned to project after a break, needed to refresh understanding
- Reviewed existing M0 work (completed earlier)
- Discussed mobile app requirements and strategy

**Key decisions made:**

1. **Mobile platform**: Chose React Native with Expo (see ADR-003)
   - Rationale: Code reuse (~40%) and single-language stack
   - Alternative considered: Flutter (rejected due to learning curve)

2. **Backend architecture adjustments for mobile:**
   - Changed from HTTP-only cookies to header-based JWT tokens
   - Reason: Cookies don't work naturally in React Native
   - Added to planning: Push notification infrastructure (future)
   - Added to planning: API versioning from M1 onwards

3. **Documentation system:**
   - Created ADRs (Architecture Decision Records) for interview prep
   - Set up development journal (this file)
   - Created issues tracker and interview prep doc

**Technical insights:**

- JWT in localStorage has XSS risk, but necessary for mobile compatibility
- Short access token expiry (15 min) mitigates stolen token risk
- Refresh token rotation adds security layer
- API versioning critical because mobile apps can't force-update instantly

**Aha! moments:**

- Realized HTTP-only cookie strategy (web best practice) would block mobile development
- Understanding that mobile-first thinking changes backend architecture
- Recognition that monorepo structure already supports mobile (types + schemas reusable)

**What's next:**

- Start M1: Backend skeleton
- Implement Express server with JWT authentication
- Add API versioning structure (`/api/v1/...`)

**Personal notes:**

- Need to be careful about security trade-offs (XSS vs mobile compatibility)
- Interview talking points: Always explain _why_ a decision was made and what alternatives were considered

**Time breakdown:**

- Project review and context rebuilding: 1 hour
- Architecture discussion and decision-making: 1.5 hours
- Documentation creation (ADRs, this journal): 0.5 hours

---

### October 3, 2025 - M1 Backend Skeleton (In Progress)

**Time spent so far**: ~3.5 hours

**What's being built:**

- Backend skeleton: Express server with proper error handling, logging, and database connection
- Following step-by-step approach to understand each component deeply

**Components completed:**

1. **Configuration System** (`src/config/index.ts`)
   - Uses Zod schema from shared package to validate environment variables
   - Fail-fast approach: app won't start if config is invalid
   - Structured config object typed as `AppConfig`
   - Hides sensitive values in console output

2. **Logger Setup** (`src/utils/logger.ts`)
   - Pino structured logging with pretty-print in development
   - JSON format for production (machine-readable)
   - Child logger support for adding context (module name, request ID)
   - Configured log level from environment variable

3. **Database Connection** (`src/config/database.ts`)
   - Mongoose connection with proper error handling
   - Connection pooling (maxPoolSize: 10)
   - Event listeners for disconnection and errors
   - Graceful shutdown handler (closes connections on SIGINT)
   - Helper functions: `connectDatabase()`, `disconnectDatabase()`, `isDatabaseConnected()`

4. **Error Handling Utilities** (`src/utils/errors.ts`)
   - Custom error class hierarchy extending Error
   - Five error types: ValidationError(400), UnauthorizedError(401), ForbiddenError(403), NotFoundError(404), ConflictError(409)
   - `isOperationalError()` helper to distinguish expected errors from bugs
   - `formatErrorResponse()` to strip sensitive data from error responses
   - All errors include statusCode, code, and optional details

5. **Error Handling Middleware** (`src/middleware/errorHandler.ts`)
   - Centralized error handler catches all thrown errors
   - Two middleware functions: `errorHandler()` and `notFoundHandler()`
   - Distinguishes operational errors (show to client) from programmer errors (hide details)
   - Different logging levels: warn for operational, error for programmer bugs
   - Production mode hides stack traces and sensitive information
   - 404 handler for undefined routes
   - Installed `express-async-errors` for automatic async error handling

6. **Health Check Routes** (`src/routes/health.ts`)
   - Simple health endpoint: `GET /health` returns { "status": "ok" }
   - Detailed health endpoint: `GET /api/v1/health` with database status, uptime, timestamp
   - No authentication required (must be accessible by load balancers)
   - Fast response times (< 10ms for simple, < 50ms for detailed)
   - Uses `isDatabaseConnected()` helper from database config

7. **Express App Setup** (`src/app.ts`)
   - Creates and configures Express application with all middleware
   - Middleware stack in correct order: security → parsing → logging → routes → errors
   - Security: Helmet (headers) + CORS (frontend access)
   - Parsing: JSON, URL-encoded, cookies
   - Logging: Pino HTTP with request/response logging (ignores /health for noise reduction)
   - Mounts health router at two paths: `/health` and `/api/v1`
   - 404 handler before error handler
   - Exported as function for testability
   - Installed packages: express, helmet, cors, pino-http, cookie-parser

**Technical insights:**

- **Config validation at startup**: Using Zod to validate env vars catches misconfiguration immediately. Better than runtime errors 10 minutes after deployment.

- **Pino vs Winston**: Chose Pino for performance (benchmarks show 5x faster). JSON format in production makes it easy to send logs to CloudWatch/Datadog for querying.

- **Graceful shutdown matters**: Registered SIGINT handler to close MongoDB connection properly. Prevents "connection pool destroyed" errors and potential data corruption.

- **Error class hierarchy**: By extending Error and using `Error.captureStackTrace()`, we get clean stack traces. The `Object.setPrototypeOf()` call is necessary for TypeScript to make `instanceof` checks work correctly.

- **Operational vs Programmer errors**: This distinction is crucial. Operational errors (ValidationError, NotFoundError) are expected and safe to show users. Programmer errors (TypeError, ReferenceError) are bugs and should hide details in production.

- **Error middleware must have 4 parameters**: Express recognizes error middleware by signature: `(err, req, res, next)`. Without all 4 params, Express treats it as normal middleware and won't catch errors.

- **express-async-errors package**: Without this, async errors need manual `try/catch` or `.catch()` in every route. This package patches Express to automatically catch async errors, making code cleaner.

- **Health checks return 200 even if DB down**: Server is still functional (can serve health checks, static files). Monitoring tools can see database status in response body. Only return 503 if server truly can't function.

- **Two health endpoints for different use cases**: Load balancers need fast checks (no DB query), monitoring dashboards need detailed status. Separating them optimizes for each use case.

- **express-async-errors must be imported first**: This package patches Express to catch async errors automatically. Must be imported before creating the Express app to properly monkey-patch Promise handling.

- **Middleware order is critical in Express**: Security first (helmet, cors), then parsing (json, cookies), then logging, then routes, then 404, finally error handler. Each layer depends on previous ones. Error handler must be absolute last to catch everything.

- **Ignore health checks in logs**: `/health` endpoint gets called every 10 seconds by load balancers. Logging these creates noise and fills logs with useless data. Using `autoLogging.ignore` keeps logs clean.

**Design decisions:**

1. **Why custom error classes instead of status codes in controllers?**
   - Separation of concerns: controllers focus on business logic, middleware handles HTTP responses
   - Type safety: TypeScript knows what properties each error has
   - Consistency: all errors formatted the same way
   - Centralization: one place to change error format

2. **Why Pino over Winston?**
   - Performance: Pino is significantly faster (async logging)
   - JSON-first: Winston requires plugins for good JSON output
   - Pretty-print in dev: `pino-pretty` makes logs readable during development

3. **Config structure decision:**
   - Load .env from root (monorepo) so all apps can share same file
   - Parse once at startup, export singleton config object
   - If parsing fails, throw error immediately (don't start server)

4. **Centralized error handling vs try/catch in routes:**
   - Centralized: Single middleware handles all errors, ensures consistency
   - Try/catch in routes: Duplicates logic, easy to have inconsistent error formats
   - With middleware, controllers stay clean and focused on business logic
   - Error handling logic can be tested independently

**Challenges encountered:**

- Understanding TypeScript's prototype chain for custom errors (needed `Object.setPrototypeOf`)
- Deciding where to load .env from in monorepo (went with root-level)

**What's next:**

- Step 7: Express app setup with all middleware
- Step 8: Server entry point with graceful shutdown
- Step 9: Manual testing to verify everything works
- Then commit and push to GitHub

**Interview talking points from today:**

- "I chose a step-by-step approach to backend development to deeply understand each layer rather than copying boilerplate"
- "The error handling design separates operational errors (user input) from programmer errors (bugs), which affects logging strategy and client responses"
- "I used Zod for runtime validation because TypeScript only checks at compile time - environment variables need runtime validation"

**Time breakdown:**

- Environment setup (.env file): 0.25 hours
- Step 1-3 (config, logger, database): 0.5 hours
- Step 4 (error utilities) with detailed planning: 1 hour
- Step 5 (error middleware) with package install: 0.5 hours
- Step 6 (health check routes): 0.25 hours
- Git commit and push: 0.25 hours
- Step 7 (Express app setup) with package installs: 0.5 hours
- Documentation updates: 0.25 hours

---

## Milestone Status

### ✅ M0 - Repository & Developer Experience (COMPLETED)

**Started**: [Earlier]  
**Completed**: [Earlier]  
**Total time**: ~8-10 hours (estimate)

**What was built:**

- [x] Monorepo scaffolding with npm workspaces
- [x] TypeScript configuration across all packages
- [x] ESLint + Prettier setup
- [x] Husky pre-commit hooks + lint-staged
- [x] Shared types package (`@forex-watch/shared`)
- [x] Zod validation schemas (auth, alerts, pagination, env)
- [x] Turbo build orchestration
- [x] README with full documentation
- [x] Environment variable template

**Key learnings:**

- Monorepo setup is front-loaded work but pays off immediately with type safety
- Zod schemas serve double duty: runtime validation + TypeScript types
- Turbo caching makes incremental builds fast
- npm workspaces are stable and sufficient (don't need Yarn/pnpm)

**Challenges:**

- Getting workspace dependencies to resolve correctly
- Ensuring TypeScript sees the shared package types
- Setting up Turbo pipeline with correct dependency order

**Results:**

- Full type safety across packages
- Single source of truth for data models
- Can share validation logic between frontend and backend
- Ready to add mobile app without duplicating types

---

### 🚧 M1 - Backend Skeleton (IN PROGRESS)

**Started**: October 3, 2025  
**Estimated time**: 6-8 hours  
**Time spent so far**: ~3.5 hours

**Completed work:**

- [x] Configuration management (env validation with Zod)
- [x] Pino logging configuration
- [x] MongoDB connection with Mongoose
- [x] Error handling utilities (custom error classes)
- [x] Error handling middleware (global error handler)
- [x] Health check endpoints (`/health`, `/api/v1/health`)
- [x] Express application setup with all middleware
- [x] API versioning structure (`/api/v1`)
- [x] CORS configuration
- [x] Security headers (Helmet)

**In progress:**

- [ ] Server entry point with graceful shutdown
- [ ] Manual testing with npm run dev

**Technical approach:**

- Use `EnvSchema` from shared package for environment validation
- Structure: `src/server.ts` (entry point) → `src/app.ts` (Express app) → routes
- Logging: Pino with pretty-print in dev, JSON in production
- Error handling: Centralized error middleware with proper status codes
- Config: Load and validate env vars at startup (fail fast if misconfigured)

**Success criteria:**

- Server starts and connects to MongoDB
- `/health` endpoint returns 200 with system status
- Logs are readable and structured
- Errors are caught and formatted consistently
- Can write integration tests with mongodb-memory-server

---

## Technical Debt & Future Considerations

### To address later:

1. **Token blacklist for logout**: Will need MongoDB TTL index
2. **Push notifications**: Add FCM/APNs when starting mobile app
3. **Rate limiting**: Add to auth endpoints in M2
4. **API documentation**: Consider adding Swagger/OpenAPI in M6
5. **Monitoring**: Add APM (Application Performance Monitoring) for production

### Questions to research:

- How to handle timezones for alert triggering? (UTC internally, display in user's timezone)
- Rate limit strategy: per-IP or per-user? (Both: per-IP for public routes, per-user for authenticated)
- Should alerts pause when rate is unavailable? (Yes, set flag `lastCheckError`)

---

## Week 2: October 8-14, 2025

### October 12, 2025 - M1 Complete: Backend Foundation

**Time spent**: ~4 hours

**What happened:**

- Completed Steps 7-8 of M1 (Express app setup + server entry point)
- Created Express application with complete middleware chain
- Built server entry point with graceful shutdown
- Installed and configured MongoDB locally
- Successfully tested all health endpoints

**What was built:**

**Step 7: Express App Configuration (`src/app.ts`)**

- Middleware chain in correct order:
  1. `express-async-errors` (must be first!)
  2. Security: `helmet`, `cors`
  3. Body parsing: `express.json()`, `express.urlencoded()`
  4. Cookie parsing: `cookie-parser()`
  5. Request logging: `pino-http` (with `/health` exclusion)
  6. Routes: health router mounted at `/health` and `/api/v1`
  7. 404 handler: `notFoundHandler`
  8. Error handler: `errorHandler` (must be last!)

**Step 8: Server Entry Point (`src/server.ts`)**

- Database connection before server start
- HTTP server startup on port 3001
- Graceful shutdown handlers (SIGTERM, SIGINT)
- Error handlers (uncaught exceptions, unhandled rejections)
- Server error handling (EADDRINUSE for port conflicts)
- 30-second timeout for forced shutdown

**Technical insights:**

1. **Middleware Order Matters**:
   - `express-async-errors` must be imported first to catch async errors
   - Error handler must be last middleware
   - Routes must come after body parsers

2. **Graceful Shutdown Pattern**:
   - Stop accepting new connections (`server.close()`)
   - Wait for in-flight requests to finish
   - Close database connections
   - Set timeout to force exit if hanging
   - Handle multiple shutdown signals (prevent double shutdown)

3. **Fail-Fast Principle**:
   - Connect to database before starting HTTP server
   - If database is down, don't accept requests
   - Clear error messages for common failures (port in use, database unreachable)

**Challenges encountered:**

1. **TypeScript Error: `import.meta.url` not supported**
   - Initial code checked `if (import.meta.url === \`file://\${process.argv[1]}\`)`
   - Error: Module option doesn't support `import.meta`
   - Solution: Removed conditional, just call `startServer()` directly
   - Learning: Keep entry points simple, no fancy checks needed

2. **MongoDB Not Installed**
   - Server tried to start but MongoDB wasn't running
   - Error: `ECONNREFUSED 127.0.0.1:27017`
   - Solution: Installed with `brew install mongodb-community@7.0`
   - Started with `brew services start mongodb-community@7.0`
   - Learning: Document prerequisites clearly in README

**Testing results:**

```bash
# ✅ Simple health check
GET http://localhost:3001/health
Response: {"status":"ok"}

# ✅ Detailed health check
GET http://localhost:3001/api/v1/health
Response: {
  "status": "ok",
  "timestamp": "2025-10-12T06:03:08.585Z",
  "uptime": 8.7099575,
  "database": "connected"
}

# ✅ 404 handling
GET http://localhost:3001/nonexistent
Response: {
  "message": "Route GET /nonexistent not found",
  "code": "NOT_FOUND"
}

# ✅ Graceful shutdown
SIGINT sent → Server stopped gracefully
```

**Aha! moments:**

1. **Express Middleware Magic**:
   - Third-party middleware (helmet, cors) implicitly call `next()`
   - Route handlers that send responses implicitly end the chain
   - Only need explicit `next()` for custom middleware or error forwarding

2. **Health Check Mounting**:
   - `router.get('/')` becomes `GET /health` when mounted at `/health`
   - Same router mounted at two places gives two endpoints
   - Paths are relative to mount point

3. **Graceful Shutdown is Critical**:
   - Production deployments send SIGTERM (Kubernetes, Docker)
   - Developer Ctrl+C sends SIGINT
   - Both need handling for clean shutdown
   - Without it: data corruption, connection leaks, failed requests

**What's next:**

- **M1 COMPLETE!** 🎉
- Push code to GitHub
- Update documentation
- Begin M2: API Development (authentication, alerts CRUD)

**Metrics:**

- **Files created**: 8 (config, utils, middleware, routes, app, server)
- **Lines of code**: ~700 lines
- **Dependencies added**: 10 (Express, Mongoose, Pino, Helmet, etc.)
- **Test coverage**: Manual integration tests passing
- **Build time**: ~2 seconds (TypeScript compilation)

---

## Interview Preparation Notes

### Story arcs developing:

1. **"How did you handle mobile compatibility?"**
   - Started with web-first approach (cookies)
   - Realized mobile requirement late (no cookies in React Native)
   - Pivoted to header-based JWT
   - Trade-off: XSS risk vs mobile compatibility
   - Mitigation: short token expiry, CSP headers

2. **"Tell me about a time you changed direction."**
   - Initial plan: HTTP-only cookies (web security best practice)
   - New requirement: mobile apps
   - Research: cookies don't work in React Native
   - Decision: header-based tokens with secure storage
   - Learning: architecture decisions must consider all target platforms

3. **"Why did you choose a monorepo?"**
   - Need type safety across frontend/backend
   - Alternative: separate repos with published npm packages
   - Monorepo wins: instant type sync, atomic commits, shared validation
   - Trade-off: more complex setup vs simpler development

### Metrics to track:

- Lines of code (measure complexity)
- Code reuse percentage (quantify mobile sharing)
- Build times (show Turbo effectiveness)
- Test coverage (demonstrate quality focus)
- Time per milestone (project management skills)

---

## Useful Commands Reference

```bash
# Development
npm run dev              # Start all dev servers (Turbo)
npm run build            # Build all packages
npm run test             # Run all tests
npm run lint:fix         # Fix linting issues

# Package-specific
cd apps/backend && npm run dev          # Backend only
cd apps/frontend && npm run dev         # Frontend only
cd packages/shared && npm run dev       # Shared in watch mode

# Database
mongosh                                 # Connect to local MongoDB

# Git
git log --oneline --graph --all        # Visual commit history
```

---

## Resources & Learning

### Currently reading/watching:

- [ ] JWT security best practices (OWASP)
- [ ] React Native performance optimization
- [ ] Expo EAS Build documentation

### Want to learn:

- MongoDB indexing strategies for alert queries
- Cron job patterns (how to avoid duplicate jobs)
- Push notification delivery rates and best practices

---

_Last updated: October 12, 2025_
