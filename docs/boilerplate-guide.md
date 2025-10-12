# Express TypeScript API Boilerplate

> **Extract this production-ready infrastructure for your next project**

This guide shows you how to reuse the battle-tested infrastructure from Forex Watch for any new Express.js API project.

---

## 🎯 What You Get

- ✅ TypeScript configuration
- ✅ Environment validation with Zod
- ✅ Structured logging with Pino
- ✅ Centralized error handling
- ✅ MongoDB with Mongoose
- ✅ Security middleware (Helmet, CORS)
- ✅ Graceful shutdown
- ✅ Health check endpoints
- ✅ Production-ready patterns

---

## 📋 Quick Start

### Step 1: Create New Project

```bash
mkdir my-new-api
cd my-new-api
npm init -y
```

### Step 2: Copy Infrastructure Files

Copy these files from `apps/backend/`:

```
apps/backend/
├── src/
│   ├── config/
│   │   ├── index.ts           ✅ Copy as-is
│   │   └── database.ts        ✅ Copy as-is
│   ├── utils/
│   │   ├── logger.ts          ✅ Copy as-is
│   │   └── errors.ts          ✅ Copy as-is
│   ├── middleware/
│   │   └── errorHandler.ts   ✅ Copy as-is
│   ├── routes/
│   │   └── health.ts          ✅ Copy as-is
│   ├── app.ts                 ⚠️ Copy + modify routes
│   └── server.ts              ✅ Copy as-is
├── package.json               ⚠️ Copy + adjust name/version
├── tsconfig.json              ✅ Copy as-is
└── .env.example               ⚠️ Customize for your needs
```

---

## 🔧 What to Customize

### 1. Environment Variables (`src/config/index.ts`)

**Current (Forex Watch):**

```typescript
export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string(),
  FRONTEND_URL: z.string(),
  EMAIL_PROVIDER: z.enum(['ses', 'smtp', 'mock']),
  RATE_PROVIDER: z.enum(['fixer', 'currencyapi', 'mock']),
  // ... forex-specific variables
});
```

**Customize for your project:**

```typescript
export const EnvSchema = z.object({
  // Keep these (universal)
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  MONGODB_URI: z.string(),

  // Add your project-specific variables
  JWT_SECRET: z.string(),
  FRONTEND_URL: z.string(),
  REDIS_URL: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  // ... whatever your project needs
});
```

---

### 2. Routes (`src/app.ts`)

**Current:**

```typescript
// Mount health checks
app.use('/health', healthRouter);
app.use('/api/v1', healthRouter);

// Mount your API routes here (in M2)
// app.use('/api/v1/auth', authRouter);
// app.use('/api/v1/alerts', alertsRouter);
```

**For your project:**

```typescript
// Keep health checks
app.use('/health', healthRouter);
app.use('/api/v1', healthRouter);

// Add YOUR routes
app.use('/api/v1/posts', postsRouter);
app.use('/api/v1/comments', commentsRouter);
app.use('/api/v1/users', usersRouter);
```

---

### 3. Package.json

**Update these fields:**

```json
{
  "name": "@your-org/your-api",
  "version": "1.0.0",
  "description": "Your API description",
  "author": "Your Name",
  "repository": {
    "type": "git",
    "url": "your-repo-url"
  }
}
```

**Keep these dependencies (they're universal):**

```json
{
  "dependencies": {
    "express": "^4.21.2",
    "mongoose": "^8.0.3",
    "pino": "^8.17.2",
    "pino-http": "^8.6.1",
    "pino-pretty": "^10.3.1",
    "helmet": "^7.2.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "zod": "^3.22.4",
    "express-async-errors": "^3.1.1"
  }
}
```

---

### 4. Shared Types (Create New)

**Don't copy** `packages/shared/` - it's project-specific!

Instead, create YOUR types:

```typescript
// packages/shared/src/types/index.ts
export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  createdAt: Date;
}
```

---

## 🚀 Step-by-Step Setup

### 1. Copy Files

```bash
# From forex-watch directory
SOURCE="apps/backend"
TARGET="../my-new-api"

# Copy infrastructure
cp -r $SOURCE/src/config $TARGET/src/
cp -r $SOURCE/src/utils $TARGET/src/
cp -r $SOURCE/src/middleware $TARGET/src/
cp -r $SOURCE/src/routes $TARGET/src/
cp $SOURCE/src/app.ts $TARGET/src/
cp $SOURCE/src/server.ts $TARGET/src/

# Copy configuration files
cp $SOURCE/package.json $TARGET/
cp $SOURCE/tsconfig.json $TARGET/
cp $SOURCE/.env.example $TARGET/
```

### 2. Install Dependencies

```bash
cd my-new-api
npm install
```

### 3. Customize Environment

```bash
# Edit .env.example
cp .env.example .env

# Update with your values
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/my-new-api
# ... add your variables
```

### 4. Update Config Schema

Edit `src/config/index.ts`:

- Remove forex-specific variables
- Add your project-specific variables
- Keep the universal ones (NODE_ENV, PORT, MONGODB_URI)

### 5. Add Your Routes

```bash
# Create your route files
touch src/routes/posts.ts
touch src/routes/comments.ts

# Create models
mkdir src/models
touch src/models/Post.ts
touch src/models/Comment.ts

# Create controllers
mkdir src/controllers
touch src/controllers/postsController.ts
```

### 6. Update app.ts

Mount your new routes:

```typescript
import { postsRouter } from './routes/posts.js';
import { commentsRouter } from './routes/comments.js';

// Keep existing middleware...

// Mount your routes
app.use('/api/v1/posts', postsRouter);
app.use('/api/v1/comments', commentsRouter);

// Keep error handlers...
```

### 7. Test

```bash
# Start MongoDB
brew services start mongodb-community@7.0

# Run the server
npm run dev

# Test health check
curl http://localhost:3000/health
```

---

## 📦 Optional: Create a Template Repository

### Option A: Manual Template

1. Create a new GitHub repo: `express-api-boilerplate`
2. Copy the reusable files
3. Remove project-specific code
4. Add comprehensive README
5. Use as template for future projects

### Option B: Automated Script

Create `scripts/create-boilerplate.sh`:

```bash
#!/bin/bash

# Extract boilerplate from Forex Watch

PROJECT_NAME=$1

if [ -z "$PROJECT_NAME" ]; then
  echo "Usage: ./create-boilerplate.sh <project-name>"
  exit 1
fi

mkdir $PROJECT_NAME
cd $PROJECT_NAME

# Copy infrastructure
mkdir -p src/{config,utils,middleware,routes}
cp ../apps/backend/src/config/* src/config/
cp ../apps/backend/src/utils/* src/utils/
cp ../apps/backend/src/middleware/* src/middleware/
cp ../apps/backend/src/routes/health.ts src/routes/
cp ../apps/backend/src/app.ts src/
cp ../apps/backend/src/server.ts src/

# Copy configs
cp ../apps/backend/package.json .
cp ../apps/backend/tsconfig.json .
cp ../apps/backend/.env.example .

echo "✅ Boilerplate created in $PROJECT_NAME/"
echo "Next steps:"
echo "1. cd $PROJECT_NAME"
echo "2. Edit src/config/index.ts (customize env variables)"
echo "3. npm install"
echo "4. cp .env.example .env"
echo "5. npm run dev"
```

Usage:

```bash
chmod +x scripts/create-boilerplate.sh
./scripts/create-boilerplate.sh my-blog-api
```

---

## 🎯 What NOT to Copy

**Project-specific code (Forex Watch):**

❌ `packages/shared/src/types/index.ts` - Forex-specific types
❌ `packages/shared/src/schemas/index.ts` - Forex-specific schemas
❌ Future routes: `src/routes/auth.ts`, `src/routes/alerts.ts`
❌ Future models: `src/models/User.ts`, `src/models/Alert.ts`
❌ Future services: `src/services/rateService.ts`, `src/services/emailService.ts`

**Create these NEW for your project!**

---

## 📝 Checklist for New Project

- [ ] Copy infrastructure files
- [ ] Update `package.json` (name, version, description)
- [ ] Customize `src/config/index.ts` (env variables)
- [ ] Create `.env` file with your values
- [ ] Remove forex references from `app.ts`
- [ ] Create your routes (e.g., `posts.ts`, `comments.ts`)
- [ ] Create your models (e.g., `Post.ts`, `Comment.ts`)
- [ ] Create your controllers
- [ ] Update health checks if needed
- [ ] Write tests
- [ ] Deploy!

---

## 💡 Tips

### Monorepo vs Single Repo

**Forex Watch uses monorepo because:**

- Shared types between frontend/backend
- Mobile app will share schemas

**Single repo if:**

- Only building a backend API
- No shared frontend

**Keep monorepo if:**

- Building frontend + backend
- Planning mobile apps
- Want to share types/schemas

### Database Options

**Using PostgreSQL instead of MongoDB?**

Replace `src/config/database.ts` with:

```typescript
import { Sequelize } from 'sequelize';
import { config } from './index.js';

export const sequelize = new Sequelize(config.databaseUrl);

export async function connectDatabase() {
  await sequelize.authenticate();
  logger.info('PostgreSQL connected');
}
```

Update dependencies:

```bash
npm uninstall mongoose
npm install sequelize pg
```

---

## 🏆 Best Practices Included

This boilerplate includes industry best practices:

✅ **Fail-fast startup** - Database connection before accepting requests
✅ **Graceful shutdown** - Clean resource cleanup
✅ **Structured logging** - JSON logs in production, pretty in dev
✅ **Type safety** - TypeScript + Zod validation
✅ **Security** - Helmet, CORS, rate limiting ready
✅ **Error handling** - Centralized, consistent error responses
✅ **Separation of concerns** - Config, routes, middleware, business logic
✅ **Development experience** - Hot reload, linting, formatting

---

## 📚 Further Reading

- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Node.js Production Checklist](https://goldbergyoni.com/checklist-best-practice-of-node-js-in-production/)
- [TypeScript Express Patterns](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-d-ts.html)

---

## 🎓 Interview Talking Points

**"I created a reusable boilerplate from my Forex Watch project"**

Key points to mention:

1. Separated infrastructure from business logic
2. Made it easy to ship new APIs faster
3. Includes production-ready patterns (error handling, logging, graceful shutdown)
4. Demonstrates understanding of reusability and DRY principles
5. Shows forward-thinking about code organization

---

_Created from Forex Watch M1 infrastructure - October 2025_
