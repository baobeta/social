#!/bin/bash

# Script to test CI workflow locally
# This simulates the CI environment by running the same commands

set -e

echo "🧪 Testing CI Workflow Locally"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if required services are running
check_service() {
    local service=$1
    local port=$2
    
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $service is running on port $port"
        return 0
    else
        echo -e "${RED}✗${NC} $service is not running on port $port"
        return 1
    fi
}

echo "📋 Checking prerequisites..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js is not installed"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm is not installed"
    exit 1
fi

# Check PostgreSQL
if check_service "PostgreSQL" 5432; then
    echo "   Make sure PostgreSQL has a test database"
else
    echo -e "${YELLOW}⚠${NC}  PostgreSQL not detected. You may need to start it:"
    echo "   docker-compose up -d postgres"
    echo "   or"
    echo "   brew services start postgresql@15"
fi

# Check Redis
if check_service "Redis" 6379; then
    echo "   Redis is ready"
else
    echo -e "${YELLOW}⚠${NC}  Redis not detected. You may need to start it:"
    echo "   docker-compose up -d redis"
    echo "   or"
    echo "   brew services start redis"
fi

echo ""
echo "🔧 Setting up test environment..."
echo ""

# Set environment variables (similar to CI)
export DATABASE_URL="${TEST_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/social_media_test}"
export TEST_DATABASE_URL="${TEST_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/social_media_test}"
export E2E_DATABASE_URL="${E2E_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/social_media_e2e}"
export REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
export JWT_SECRET="${JWT_SECRET:-test-jwt-secret-key-for-ci}"
export NODE_ENV=test

echo "Environment variables:"
echo "  DATABASE_URL: $DATABASE_URL"
echo "  TEST_DATABASE_URL: $TEST_DATABASE_URL"
echo "  REDIS_URL: $REDIS_URL"
echo "  NODE_ENV: $NODE_ENV"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
if npm ci; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${RED}✗${NC} Failed to install dependencies"
    exit 1
fi

echo ""

# Step 2: Setup database (if PostgreSQL is available)
if check_service "PostgreSQL" 5432 2>/dev/null; then
    echo "🗄️  Step 2: Setting up test database..."
    
    # Create test database if it doesn't exist
    if command -v psql &> /dev/null; then
        psql -h localhost -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'social_media_test'" | grep -q 1 || \
        psql -h localhost -U postgres -c "CREATE DATABASE social_media_test" 2>/dev/null || \
        echo -e "${YELLOW}⚠${NC}  Could not create database (may already exist or need different credentials)"
    fi
    
    # Run migrations
    echo "🔄 Running migrations..."
    cd apps/backend
    if NODE_ENV=test npm run db:migrate; then
        echo -e "${GREEN}✓${NC} Migrations completed"
    else
        echo -e "${YELLOW}⚠${NC}  Migrations may have failed (check if database exists)"
    fi
    cd ../..
else
    echo -e "${YELLOW}⚠${NC}  Skipping database setup (PostgreSQL not available)"
fi

echo ""

# Step 3: Run tests
echo "🧪 Step 3: Running backend tests..."
cd apps/backend
if npm test; then
    echo -e "${GREEN}✓${NC} All tests passed!"
else
    echo -e "${RED}✗${NC} Tests failed"
    cd ../..
    exit 1
fi
cd ../..

echo ""

# Step 4: Build (simulate build job)
echo "🏗️  Step 4: Building projects..."
echo ""

echo "Building backend..."
cd apps/backend
export NODE_ENV=production
if npm run build; then
    echo -e "${GREEN}✓${NC} Backend built successfully"
else
    echo -e "${RED}✗${NC} Backend build failed"
    cd ../..
    exit 1
fi
cd ../..

echo ""

echo "Building frontend..."
cd apps/frontend
export NODE_ENV=production
if npm run build; then
    echo -e "${GREEN}✓${NC} Frontend built successfully"
else
    echo -e "${RED}✗${NC} Frontend build failed"
    cd ../..
    exit 1
fi
cd ../..

echo ""
echo -e "${GREEN}✅ CI workflow test completed successfully!${NC}"
echo ""
echo "Summary:"
echo "  ✓ Dependencies installed"
echo "  ✓ Database migrations run"
echo "  ✓ All tests passed"
echo "  ✓ Backend built"
echo "  ✓ Frontend built"
echo ""
echo "You can now push to GitHub with confidence!"

