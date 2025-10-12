#!/bin/bash

# Script to create a new project from Forex Watch boilerplate
# Usage: ./scripts/create-boilerplate.sh <project-name>

set -e  # Exit on error

PROJECT_NAME=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if project name is provided
if [ -z "$PROJECT_NAME" ]; then
  echo -e "${RED}Error: Project name is required${NC}"
  echo "Usage: ./scripts/create-boilerplate.sh <project-name>"
  echo "Example: ./scripts/create-boilerplate.sh my-blog-api"
  exit 1
fi

# Check if directory already exists
if [ -d "$PROJECT_NAME" ]; then
  echo -e "${RED}Error: Directory '$PROJECT_NAME' already exists${NC}"
  exit 1
fi

echo -e "${GREEN}🚀 Creating new API project: $PROJECT_NAME${NC}"
echo ""

# Create project directory
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

echo -e "${YELLOW}📁 Creating directory structure...${NC}"

# Create directory structure
mkdir -p src/{config,utils,middleware,routes,models,controllers,services,types}
mkdir -p tests

echo -e "${YELLOW}📋 Copying infrastructure files...${NC}"

# Copy infrastructure files (core reusable code)
cp "$ROOT_DIR/apps/backend/src/config/index.ts" src/config/
cp "$ROOT_DIR/apps/backend/src/config/database.ts" src/config/
cp "$ROOT_DIR/apps/backend/src/utils/logger.ts" src/utils/
cp "$ROOT_DIR/apps/backend/src/utils/errors.ts" src/utils/
cp "$ROOT_DIR/apps/backend/src/middleware/errorHandler.ts" src/middleware/
cp "$ROOT_DIR/apps/backend/src/routes/health.ts" src/routes/
cp "$ROOT_DIR/apps/backend/src/app.ts" src/
cp "$ROOT_DIR/apps/backend/src/server.ts" src/

# Copy configuration files
cp "$ROOT_DIR/apps/backend/package.json" .
cp "$ROOT_DIR/apps/backend/tsconfig.json" .
cp "$ROOT_DIR/apps/backend/.eslintrc.json" . 2>/dev/null || true

# Create .env.example with generic variables
cat > .env.example << 'EOF'
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/your-db-name

# JWT (if using authentication)
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:5173

# Add your project-specific variables here
EOF

# Update package.json with new project name
if command -v node &> /dev/null && command -v npm &> /dev/null; then
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.name = '@yourorg/$PROJECT_NAME';
    pkg.version = '1.0.0';
    pkg.description = 'API built from Forex Watch boilerplate';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
  "
fi

# Create a starter README
cat > README.md << EOF
# $PROJECT_NAME

API built from Forex Watch boilerplate.

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start MongoDB
brew services start mongodb-community@7.0

# Run development server
npm run dev

# Test health endpoint
curl http://localhost:3000/health
\`\`\`

## What's Included

- ✅ TypeScript configuration
- ✅ Express.js with middleware chain
- ✅ MongoDB with Mongoose
- ✅ Structured logging (Pino)
- ✅ Error handling
- ✅ Health checks
- ✅ Graceful shutdown
- ✅ Security (Helmet, CORS)

## Next Steps

1. Edit \`src/config/index.ts\` - Customize environment variables
2. Create your routes in \`src/routes/\`
3. Create your models in \`src/models/\`
4. Create your controllers in \`src/controllers/\`
5. Update \`src/app.ts\` to mount your routes

## Available Scripts

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Run production build
npm test             # Run tests
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
\`\`\`

## Documentation

See [Forex Watch Boilerplate Guide](https://github.com/Zhenfeng7/Forex-Watch/blob/main/docs/boilerplate-guide.md) for detailed documentation.

---

Created with [Forex Watch Boilerplate](https://github.com/Zhenfeng7/Forex-Watch)
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Environment
.env
.env.local
.env.*.local

# Build output
dist/
build/

# Logs
logs/
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
coverage/

# Misc
.turbo/
EOF

echo ""
echo -e "${GREEN}✅ Boilerplate created successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo ""
echo "  1. cd $PROJECT_NAME"
echo "  2. npm install"
echo "  3. cp .env.example .env"
echo "  4. Edit src/config/index.ts (customize environment variables)"
echo "  5. Edit .env (add your values)"
echo "  6. npm run dev"
echo ""
echo -e "${YELLOW}📚 Don't forget to:${NC}"
echo "  - Create your routes in src/routes/"
echo "  - Create your models in src/models/"
echo "  - Update src/app.ts to mount your routes"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"

