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

### October 15, 2025 - M3.1 Rate Provider & Scheduler

**Time spent**: ~4 hours

**What happened:**

- Swapped rate provider integration to Freecurrencyapi with env validation, timeout/retry knobs, and batching.
- Added in-memory latest-rate store with stale flag, background fetcher (30m interval, JST 07-19 window), and read-only `/api/v1/rates/latest` endpoint.
- Added mock provider support for local runs without hitting external APIs.
- Wrote unit tests for provider clients, store, and selector using fetch mocks (no real network).

**Key decisions:**

1. Fetch cadence: 30 minutes, only during JST 07:00–19:00 to stay under free tier limits.
2. Batch by base currency to minimize API calls and respect quota.
3. If a fetch fails, reuse last known rate but mark it `stale` so UI can warn users.
4. No on-demand provider hits: latest endpoint always serves cached data.

**Technical insights:**

- Treating bad JSON on error responses as provider errors avoids masking upstream issues.
- Using global fetch mocks keeps tests fast and independent from provider availability/API keys.
- Cache TTL should be >= fetch interval; we defaulted to 45 minutes.

**What's next:**

- M3.2: add cache abstraction (TTL + stale-while-revalidate) if needed beyond current store.
- Wire alert runner to consume cached rates and enqueue notifications (no live calls per request).

**Testing:**

- `npm test` (apps/backend) — all rate client/store tests passing.

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

### October 15, 2025 - M2 Step 1: User Model

**Time spent**: ~1 hour

**What happened:**

- Created the foundational User model for authentication
- Implemented password hashing with bcrypt
- Added security best practices (select: false, toJSON sanitization)
- Set up instance methods for password comparison

**What was built:**

**User Model (`src/models/User.ts`)**

**Core features:**

1. **TypeScript Interface (IUser)**:
   - Extends Mongoose `Document` for type safety
   - Defines all user fields: email, password, name, plan
   - Includes instance method signatures

2. **Mongoose Schema**:
   - Email: unique, lowercase, trimmed, validated with regex
   - Password: min 8 chars, `select: false` (security)
   - Name: 2-50 chars, trimmed
   - Plan: enum ['free', 'basic', 'premium'], default 'free'
   - Timestamps: automatic createdAt/updatedAt

3. **Email Index**:
   - Unique index on email field
   - Enables fast login queries (O(log n))
   - Enforces one email per user at database level

4. **Pre-save Hook (Password Hashing)**:
   - Automatically hashes password before saving
   - Only runs if password is new or modified (`isModified` check)
   - Uses bcrypt with cost factor 10 (balances security/performance)
   - Prevents re-hashing already-hashed passwords

5. **Instance Methods**:
   - `comparePassword()`: Verifies password during login
   - `toJSON()`: Removes sensitive fields (password, \_\_v) from JSON responses

**Technical insights:**

1. **Why `select: false` on password?**
   - Default queries won't return password field
   - Must explicitly request: `.select('+password')`
   - Defense-in-depth: even if query is compromised, no password leaked
   - Used during login: `User.findOne({ email }).select('+password')`

2. **Why check `isModified('password')`?**
   - Prevents re-hashing an already-hashed password
   - Scenario: User updates name but not password
   - Without check: `$2b$10$...` would get hashed again → broken password
   - With check: Only hash when password actually changed

3. **bcrypt cost factor of 10:**
   - Higher = more secure but slower
   - 10 is industry standard (balance)
   - Takes ~100ms to hash (acceptable for login/register)
   - Attacker needs ~100ms per guess (brute force impractical)

4. **Why `toJSON()` method?**
   - `res.json(user)` automatically calls `toJSON()`
   - Removes sensitive fields without manual filtering
   - Centralized: change once, affects all responses
   - Can't accidentally leak password in API response

5. **Email lowercase normalization:**
   - `User@Example.com` === `user@example.com`
   - Prevents duplicate accounts with case variations
   - Unique index works correctly (case-insensitive matching)

**Design decisions:**

1. **Why instance methods instead of static methods?**
   - `user.comparePassword()` vs `User.comparePassword(user, password)`
   - Instance methods are more intuitive (OOP pattern)
   - `this` context automatically available
   - Can be mocked easily in tests

2. **Why bcrypt over Argon2?**
   - bcrypt: battle-tested, wide ecosystem support
   - Argon2: newer, slightly more secure, less mature tooling
   - Decision: Go with proven solution (bcrypt)
   - Can migrate to Argon2 later if needed

3. **Why Mongoose over raw MongoDB?**
   - Schema validation prevents bad data
   - Middleware (pre-save hooks) for automatic tasks
   - TypeScript integration (type-safe models)
   - Helper methods built-in

**Security considerations:**

- ✅ Passwords always hashed (bcrypt with salt)
- ✅ Password never returned in API responses (`select: false` + `toJSON`)
- ✅ Email normalized (prevents duplicate accounts)
- ✅ Validation at schema level (fail early)
- ✅ Type safety (TypeScript catches errors at compile time)

**Integration points:**

This User model will be used by:

- Registration controller: `new User({ email, password, name })`
- Login controller: `User.findOne({ email }).select('+password')`
- Authentication middleware: `User.findById(userId)`
- Profile endpoints: `User.findById(userId).select('-password')`

**What's next:**

- Step 2: Authentication Service (JWT generation/verification, token utilities)
- Step 3: Authentication Controller (register, login, refresh, logout)
- Step 4: Authentication Routes (mount controller to Express)
- Step 5: Authentication Middleware (protect routes)

**Interview talking points:**

- "I used bcrypt for password hashing because it's specifically designed for passwords - it's intentionally slow to prevent brute force attacks, and it handles salting automatically."
- "The pre-save hook ensures passwords are always hashed before saving to the database. There's no way to accidentally save a plain-text password."
- "I use `select: false` on the password field so it's not included in queries by default. This is defense-in-depth - even if there's a security flaw elsewhere, passwords won't leak."
- "The email field has a unique index which serves two purposes: it prevents duplicate accounts and makes login queries extremely fast."

**Time breakdown:**

- Planning and explanation: 0.5 hours
- Implementation: 0.3 hours
- Documentation: 0.2 hours

---

### October 15, 2025 - M2 Step 2: Authentication Service

**Time spent**: ~0.5 hours

**What happened:**

- Created centralized authentication service for JWT operations
- Implemented token generation (access + refresh)
- Added token verification with proper error handling
- Set up TypeScript interfaces for type safety

**What was built:**

**Authentication Service (`src/services/authService.ts`)**

**Core features:**

1. **TokenPayload Interface**:
   - Defines JWT payload structure (userId, type, iat, exp)
   - Type safety for token operations
   - Used across controllers and middleware

2. **TokenPair Interface**:
   - Represents access + refresh token pair
   - Returned after login/registration

3. **AuthService Class**:
   - Private constants: `ACCESS_TOKEN_EXPIRY = '15m'`, `REFRESH_TOKEN_EXPIRY = '7d'`
   - Three public methods: `generateTokens()`, `verifyAccessToken()`, `verifyRefreshToken()`
   - Singleton instance exported as `authService`

4. **generateTokens(userId)**:
   - Creates both access and refresh tokens
   - Includes `type` field in payload ('access' or 'refresh')
   - Uses `jsonwebtoken` library with config.jwtSecret
   - Returns TokenPair object

5. **verifyAccessToken(token)**:
   - Validates JWT signature
   - Checks expiration
   - Ensures token type is 'access' (prevents refresh token misuse)
   - Throws UnauthorizedError with specific messages
   - Handles: TokenExpiredError, JsonWebTokenError

6. **verifyRefreshToken(token)**:
   - Same validation as access token
   - Ensures token type is 'refresh' (prevents access token misuse)
   - Different error message for expiry: "Please login again"
   - Used by refresh endpoint

**Technical insights:**

1. **Why two tokens (access + refresh)?**
   - Security: Short-lived access token (15 min) limits damage if stolen
   - UX: Long-lived refresh token (7 days) keeps user logged in
   - Balance: Access token frequently renewed, refresh token rarely used
   - Pattern: Access token in memory, refresh token in secure storage

2. **Why include 'type' in token payload?**
   - Prevents misuse: Can't use refresh token as access token
   - Defense-in-depth: Even if client sends wrong token, server rejects it
   - Example: `if (payload.type !== 'access') throw new UnauthorizedError()`

3. **JWT error handling strategy:**
   - `TokenExpiredError`: Tell client to refresh (expected behavior)
   - `JsonWebTokenError`: Token is invalid/tampered (security issue)
   - Different messages for access vs refresh expiry (UX: auto-refresh vs re-login)

4. **Why class-based service?**
   - Easy to mock in tests: `jest.spyOn(authService, 'verifyAccessToken')`
   - Can add state later (token rotation cache, blacklist)
   - Singleton pattern: consistent configuration across app
   - Alternative: separate functions, but less testable

5. **JWT structure breakdown:**

   ```
   Header: { "alg": "HS256", "typ": "JWT" }
   Payload: { "userId": "...", "type": "access", "iat": ..., "exp": ... }
   Signature: HMAC-SHA256(header + payload, JWT_SECRET)
   ```

   - Signature prevents tampering (can't change userId without knowing secret)
   - Expiration (`exp`) checked by jwt.verify()
   - Issued at (`iat`) added automatically

**Design decisions:**

1. **Why separate verify functions?**
   - Could use: `verifyToken(token, expectedType)`
   - Chose: `verifyAccessToken()` and `verifyRefreshToken()`
   - Benefits: More explicit, different error messages, better type safety

2. **Token expiration times:**
   - Access: 15 min (industry standard for API tokens)
   - Refresh: 7 days (balance security with UX)
   - Could be configurable via env vars (future enhancement)

3. **Error message strategy:**
   - Access expired: "Access token expired" → Client auto-refreshes
   - Refresh expired: "Please login again" → Client redirects to login
   - Generic: "Token verification failed" → Prevents info leakage

**Security considerations:**

- ✅ JWT_SECRET validated at startup (Zod schema)
- ✅ Token type validation (prevents cross-use)
- ✅ Signature verification (prevents tampering)
- ✅ Expiration enforcement (limits replay attacks)
- ✅ Specific error messages (helps debugging without leaking security details)

**Integration points:**

This service will be used by:

- **Auth Controller**:
  - `generateTokens()` after successful login/registration
  - `verifyRefreshToken()` in refresh endpoint
- **Authenticate Middleware**:
  - `verifyAccessToken()` to protect routes
- **Future logout**:
  - Could add token blacklist (M3)

**What's next:**

- Step 3: Authentication Controller (register, login, refresh, logout handlers)
- Step 4: Authentication Routes (mount controller to Express)
- Step 5: Authentication Middleware (protect routes with JWT verification)

**Interview talking points:**

- "I implemented a dual-token system: short-lived access tokens minimize exposure if stolen, while long-lived refresh tokens maintain user sessions without constant re-authentication."
- "The service includes token type validation - you can't use a refresh token as an access token. This is defense-in-depth: even if the client sends the wrong token, the server catches it."
- "I used a class-based service with a singleton instance because it's easier to mock in tests and allows for future state management like token blacklisting."
- "Different error messages for access vs refresh token expiry improve UX: expired access tokens trigger automatic refresh, but expired refresh tokens require re-login."

**Time breakdown:**

- Implementation: 0.3 hours
- Documentation: 0.2 hours

---

### October 15, 2025 - M2 Step 3: Authentication Controller

**Time spent**: ~1 hour

**What happened:**

- Created authentication controller with 5 endpoints
- Implemented register, login, refresh, logout, and getCurrentUser functions
- Added Zod validation for request bodies
- Implemented security best practices (email enumeration prevention)

**What was built:**

**Authentication Controller (`src/controllers/authController.ts`)**

**Core features:**

1. **AuthRequest Interface**:
   - Extends Express Request
   - Adds optional `userId` field (set by auth middleware)
   - Type safety for protected routes

2. **register() - POST /api/v1/auth/register**:
   - Validates input with `CreateUserSchema` (Zod)
   - Checks for duplicate email
   - Creates user (password auto-hashed by model)
   - Generates JWT tokens (authService)
   - Returns 201 with user + tokens
   - Handles MongoDB duplicate key error (code 11000)
   - Logs registration event

3. **login() - POST /api/v1/auth/login**:
   - Validates input with `LoginSchema` (Zod)
   - Finds user with `.select('+password')`
   - Verifies password with `user.comparePassword()`
   - Returns same error for wrong email/password (prevents enumeration)
   - Generates tokens
   - Returns 200 with user + tokens
   - Logs login event

4. **refresh() - POST /api/v1/auth/refresh**:
   - Extracts refresh token from body
   - Verifies with `authService.verifyRefreshToken()`
   - Checks if user still exists
   - Generates new token pair
   - Returns 200 with new tokens
   - Logs refresh event

5. **logout() - POST /api/v1/auth/logout**:
   - Simple endpoint (JWT is stateless)
   - Logs logout event
   - Returns success message
   - Note: Client deletes tokens locally
   - Future: Add token blacklist (M3)

6. **getCurrentUser() - GET /api/v1/auth/me**:
   - Gets userId from request (set by middleware)
   - Finds user by ID
   - Returns user data (no tokens)
   - Protected route (requires auth)

**Technical insights:**

1. **Email enumeration prevention:**
   - Returns same error for wrong email and wrong password
   - Example: "Invalid credentials" (not "Email not found" or "Wrong password")
   - Prevents attackers from discovering registered emails
   - OWASP best practice

2. **Why validate before DB query?**

   ```typescript
   const result = CreateUserSchema.safeParse(req.body);
   if (!result.success) throw ValidationError;
   ```

   - Fails fast (don't hit DB with invalid data)
   - Consistent validation (same schema as frontend)
   - Better error messages (Zod provides field-level errors)

3. **Duplicate email handling:**
   - Check before create: `const existing = await User.findOne({ email })`
   - Catch MongoDB error: `if (error.code === 11000) throw ConflictError`
   - Why both? Race condition safety (two simultaneous requests)

4. **Password field selection:**

   ```typescript
   const user = await User.findOne({ email }).select('+password');
   ```

   - Password has `select: false` in schema
   - Must explicitly include with `+password`
   - Only needed during login (not in other queries)

5. **Logging strategy:**
   - Log userId for audit trail
   - Don't log sensitive data (passwords, tokens)
   - Structured logging: `logger.info({ userId }, 'message')`
   - Helps debugging and security monitoring

6. **Error throwing in controllers:**
   - Controllers throw errors, middleware catches them
   - `express-async-errors` automatically catches async errors
   - No need for try/catch in every function
   - Example: `throw new ConflictError('Email exists')`

**Design decisions:**

1. **Why safeParse instead of parse?**

   ```typescript
   // Option A: parse (throws)
   const data = CreateUserSchema.parse(req.body); // Throws ZodError

   // Option B: safeParse (returns result)
   const result = CreateUserSchema.safeParse(req.body);
   if (!result.success) throw ValidationError(result.error);
   ```

   - Chosen: safeParse for control over error format
   - Can wrap Zod error in our ValidationError class
   - Consistent error responses

2. **Why check user exists in refresh?**
   - User might be deleted while token is still valid
   - Prevents generating tokens for non-existent users
   - Edge case but important for security

3. **Logout implementation:**
   - Current: No server-side action (JWT is stateless)
   - Client deletes tokens from localStorage/Keychain
   - Future: Add token blacklist in Redis (M3)
   - Trade-off: Simplicity now vs instant revocation later

4. **Response format consistency:**

   ```typescript
   res.json({
     message: 'Operation successful',
     data: {
       /* payload */
     },
   });
   ```

   - All endpoints follow same structure
   - Frontend knows what to expect
   - Easy to document

**Security considerations:**

- ✅ Email enumeration prevention (same error for wrong email/password)
- ✅ Zod validation (prevents injection attacks)
- ✅ Password never returned (toJSON removes it)
- ✅ Duplicate email handling (prevents race conditions)
- ✅ User existence check in refresh (prevents orphaned tokens)
- ✅ Structured logging (audit trail without sensitive data)

**Integration points:**

This controller integrates:

- **User model** (Step 1): Create user, find user, compare password
- **authService** (Step 2): Generate tokens, verify refresh token
- **Shared schemas**: CreateUserSchema, LoginSchema (Zod validation)
- **Custom errors**: ValidationError, ConflictError, UnauthorizedError, NotFoundError
- **Logger**: Structured logging for audit trail

**What's next:**

- Step 4: Authentication Routes (mount controller to Express router)
- Step 5: Authentication Middleware (protect routes with JWT verification)
- Step 6: Alert Model (database schema for forex alerts)
- Step 7: Alert Controller (CRUD operations)
- Step 8: Alert Routes (complete API)

**Interview talking points:**

- "I prevent email enumeration by returning 'Invalid credentials' for both wrong email and wrong password. This is an OWASP best practice that prevents attackers from discovering which emails are registered."
- "I use Zod schemas from the shared package for validation, ensuring the backend validates exactly the same way as the frontend. This single source of truth prevents inconsistencies."
- "The duplicate email check has both a pre-check and error handling because of race conditions. If two requests try to register the same email simultaneously, the unique index will catch it and throw code 11000."
- "Controllers throw errors that are caught by the global error middleware. This keeps the controller code clean and ensures consistent error formatting across the API."

**Time breakdown:**

- Implementation: 0.5 hours
- Testing (manual review): 0.2 hours
- Documentation: 0.3 hours

---

### October 15, 2025 - M2 Steps 4 & 5: Authentication Routes + Middleware

**Time spent**: ~1 hour

**What happened:**

- Created authentication middleware to verify JWT tokens
- Built authentication router with 5 endpoints
- Mounted auth routes in Express app
- Completed full authentication API

**What was built:**

**1. Authentication Middleware (`src/middleware/authenticate.ts`)**

**Purpose:**

- Verifies JWT access tokens on protected routes
- Extracts userId from token and attaches to request
- Runs before controllers on protected endpoints

**Flow:**

1. Extract token from `Authorization: Bearer <token>` header
2. Validate header format (must be "Bearer <token>")
3. Verify token using `authService.verifyAccessToken()`
4. Attach `userId` to `req.userId` for controllers
5. Call `next()` to continue to controller

**Error handling:**

- Throws `UnauthorizedError` if:
  - No Authorization header
  - Invalid header format (not "Bearer <token>")
  - Token is invalid/expired (caught from authService)
- Errors passed to error handler via `next(error)`

**Usage:**

```typescript
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);
```

**2. Authentication Routes (`src/routes/auth.ts`)**

**Structure:**

- Public routes (3): register, login, refresh
- Protected routes (2): logout, me
- Base path: `/api/v1/auth`

**Routes defined:**

1. **POST /register** (public)
   - Handler: `register` controller
   - No middleware
   - Creates new user account

2. **POST /login** (public)
   - Handler: `login` controller
   - No middleware
   - Authenticates existing user

3. **POST /refresh** (public)
   - Handler: `refresh` controller
   - No middleware
   - Generates new access token

4. **POST /logout** (protected)
   - Middleware: `authenticate`
   - Handler: `logout` controller
   - Logs out authenticated user

5. **GET /me** (protected)
   - Middleware: `authenticate`
   - Handler: `getCurrentUser` controller
   - Returns current user profile

**3. App.ts Update**

**Changes:**

- Imported `authRouter`
- Mounted at `/api/v1/auth`
- Routes now accessible via HTTP

**Complete route list:**

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout` (requires auth)
- `GET /api/v1/auth/me` (requires auth)

**Technical insights:**

1. **Middleware order matters:**

   ```typescript
   router.post('/logout', authenticate, logout);
   //                     ↑ runs first  ↑ runs second
   ```

   - Middleware executes left to right
   - `authenticate` must run before `logout` to set `req.userId`
   - Controller receives authenticated request

2. **Why refresh is public:**
   - Access token might be expired (that's why refreshing)
   - Can't use `authenticate` middleware on expired token
   - Refresh token validated inside controller instead

3. **Authorization header format:**

   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

   - Industry standard format
   - `Bearer` indicates token type
   - Space separates scheme from token
   - Split on space to extract token

4. **Express Router benefits:**
   - Modular: Each feature has own router file
   - Maintainable: Easy to find related routes
   - Testable: Can test router independently
   - Scalable: Add more routers without cluttering app

5. **Mounting strategy:**

   ```typescript
   app.use('/api/v1/auth', authRouter);
   ```

   - Base path set once in app.ts
   - Routes defined relative to base: `router.post('/login', ...)`
   - Final URL: `/api/v1/auth/login`
   - Easy to change base path in one place

6. **Error flow in middleware:**
   ```typescript
   try {
     // Verify token
   } catch (error) {
     next(error); // Pass to error handler
   }
   ```

   - Don't send response in middleware
   - Pass error to centralized error handler
   - Consistent error formatting

**Design decisions:**

1. **Why separate authenticate middleware?**
   - Reusable across multiple routes
   - Centralized JWT verification logic
   - Easy to modify (e.g., add rate limiting)
   - Can be tested independently

2. **Why \_res prefix?**

   ```typescript
   async function authenticate(req, _res, next);
   ```

   - Express requires 3 params for middleware
   - We don't use `res` in authenticate
   - Prefix with `_` to satisfy ESLint

3. **HTTP methods chosen:**
   - POST: register, login, refresh, logout (create/action)
   - GET: me (retrieve data)
   - Follows REST conventions

4. **Route documentation:**
   - JSDoc comments on each route
   - Explains body, headers, response
   - Helps with API documentation generation

**Security considerations:**

- ✅ Authorization header validation (format check)
- ✅ Token verification before processing request
- ✅ Protected routes clearly separated from public
- ✅ No token in URL (only in header for security)
- ✅ Middleware rejects invalid tokens early
- ✅ Error messages don't leak sensitive info

**Integration points:**

Complete authentication flow:

1. **Client** → POST /api/v1/auth/login
2. **app.ts** → Middleware chain (parsing, logging)
3. **authRouter** → Matches `/login` route
4. **login controller** → Verifies credentials, generates tokens
5. **Client** → Stores tokens
6. **Client** → GET /api/v1/auth/me with `Authorization: Bearer <token>`
7. **authRouter** → Matches `/me` route
8. **authenticate middleware** → Verifies token, sets `req.userId`
9. **getCurrentUser controller** → Uses `req.userId` to fetch user
10. **Client** → Receives user data

**What's next:**

M2 Phase 1 (Authentication) is COMPLETE! ✅

Remaining M2 steps:

- Step 6: Alert Model (database schema for forex alerts)
- Step 7: Alert Controller (CRUD operations for alerts)
- Step 8: Alert Routes (mount alert endpoints)

**Interview talking points:**

- "I use Express Router to keep routes modular and organized. Each feature like auth has its own router file with routes defined relative to a base path. This makes it easy to find, test, and maintain routes."
- "The authenticate middleware runs before protected route controllers. It extracts the JWT from the Authorization header, verifies it with the authService, and attaches the userId to the request. If the token is invalid, it throws an error and the controller never runs."
- "The refresh endpoint is intentionally public because the access token might be expired - that's the whole point of refreshing. The refresh token is validated inside the controller instead of using the standard authentication middleware."
- "Middleware order is critical in Express. I place authenticate before the controller function so the token is verified first. If verification fails, the controller never executes."

**Time breakdown:**

- Implementation: 0.5 hours
- Testing (type-check): 0.1 hours
- Documentation: 0.4 hours

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
