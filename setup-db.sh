#!/bin/bash

# Script để setup Database và Redis cho Backend
# Usage: ./setup-db.sh

set -e

echo "🚀 Starting Database and Redis setup..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if PostgreSQL container exists
if docker ps -a --format '{{.Names}}' | grep -q "^tasmil-postgres$"; then
    echo -e "${YELLOW}⚠️  PostgreSQL container already exists${NC}"
    read -p "Do you want to remove and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Removing existing PostgreSQL container..."
        docker stop tasmil-postgres 2>/dev/null || true
        docker rm tasmil-postgres 2>/dev/null || true
    else
        echo "▶️  Starting existing PostgreSQL container..."
        docker start tasmil-postgres
    fi
else
    echo "🐘 Creating PostgreSQL container..."
    docker run --name tasmil-postgres \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=tasmil \
        -p 5432:5432 \
        -d postgres:16-alpine
fi

# Check if Redis container exists
if docker ps -a --format '{{.Names}}' | grep -q "^tasmil-redis$"; then
    echo -e "${YELLOW}⚠️  Redis container already exists${NC}"
    read -p "Do you want to remove and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Removing existing Redis container..."
        docker stop tasmil-redis 2>/dev/null || true
        docker rm tasmil-redis 2>/dev/null || true
    else
        echo "▶️  Starting existing Redis container..."
        docker start tasmil-redis
    fi
else
    echo "🔴 Creating Redis container..."
    docker run --name tasmil-redis \
        -p 6379:6379 \
        -d redis:7-alpine
fi

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Test PostgreSQL connection
echo "🔍 Testing PostgreSQL connection..."
if docker exec tasmil-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not ready. Please check the logs: docker logs tasmil-postgres${NC}"
    exit 1
fi

# Test Redis connection
echo "🔍 Testing Redis connection..."
if docker exec tasmil-redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is ready${NC}"
else
    echo -e "${YELLOW}⚠️  Redis is not ready, but it's optional${NC}"
fi

# Check if .env file exists in backend
BACKEND_ENV="apps/backend/.env"
if [ ! -f "$BACKEND_ENV" ]; then
    echo "📝 Creating .env file for backend..."
    cat > "$BACKEND_ENV" << EOF
# Database
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/tasmil

# Redis (Optional - chỉ cần nếu muốn dùng resumable streams)
REDIS_URL=redis://localhost:6379

# Backend
PORT=9337
FRONTEND_URL=http://localhost:7500
NODE_ENV=development

# JWT Secret (tạo một secret key ngẫu nhiên)
# Generate with: openssl rand -base64 32
AUTH_SECRET=$(openssl rand -base64 32)
EOF
    echo -e "${GREEN}✅ Created $BACKEND_ENV${NC}"
else
    echo -e "${YELLOW}⚠️  $BACKEND_ENV already exists, skipping...${NC}"
fi

# Check if .env.local exists in packages/db
DB_ENV="packages/db/.env.local"
if [ ! -f "$DB_ENV" ]; then
    echo "📝 Creating .env.local file for db package..."
    cat > "$DB_ENV" << EOF
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/tasmil
EOF
    echo -e "${GREEN}✅ Created $DB_ENV${NC}"
else
    echo -e "${YELLOW}⚠️  $DB_ENV already exists, skipping...${NC}"
fi

# Build db package
echo "🔨 Building @repo/db package..."
cd packages/db
pnpm build

# Run migrations
echo "🔄 Running database migrations..."
pnpm db:migrate

cd ../..

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📋 Summary:"
echo "  - PostgreSQL: running on localhost:5432"
echo "  - Redis: running on localhost:6379"
echo "  - Database: tasmil"
echo "  - Migrations: completed"
echo ""
echo "🚀 Next steps:"
echo "  1. Start backend: cd apps/backend && pnpm dev"
echo "  2. Start frontend: cd apps/frontend && pnpm dev"
echo ""
echo "💡 Useful commands:"
echo "  - View PostgreSQL logs: docker logs tasmil-postgres"
echo "  - View Redis logs: docker logs tasmil-redis"
echo "  - Stop services: docker stop tasmil-postgres tasmil-redis"
echo "  - Start services: docker start tasmil-postgres tasmil-redis"
echo "  - Remove services: docker rm -f tasmil-postgres tasmil-redis"

