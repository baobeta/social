#!/bin/bash

set -e

echo "🔍 Verifying Docker connections for Social App"
echo ""

cd "$(dirname "$0")/.."

echo "1️⃣  Checking Docker services..."
if ! docker compose ps postgres redis &>/dev/null; then
  echo "❌ Docker Compose services not found"
  echo "   Run: docker compose up postgres redis -d"
  exit 1
fi

POSTGRES_STATUS=$(docker compose ps postgres --format json 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
REDIS_STATUS=$(docker compose ps redis --format json 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4 || echo "unknown")

echo "   PostgreSQL: $POSTGRES_STATUS"
echo "   Redis: $REDIS_STATUS"
echo ""

if [ "$POSTGRES_STATUS" != "running" ]; then
  echo "⚠️  PostgreSQL is not running. Start it with: docker compose up postgres -d"
fi

if [ "$REDIS_STATUS" != "running" ]; then
  echo "⚠️  Redis is not running. Start it with: docker compose up redis -d"
fi

echo ""
echo "2️⃣  Testing PostgreSQL connection..."
if command -v psql &> /dev/null; then
  if psql postgresql://postgres:postgres@localhost:5432/social_media -c "SELECT version();" &>/dev/null; then
    echo "   ✅ PostgreSQL connection successful"
  else
    echo "   ❌ PostgreSQL connection failed"
    echo "      Check: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media"
  fi
else
  echo "   ⚠️  psql not found, skipping PostgreSQL test"
fi

echo ""
echo "3️⃣  Testing Redis connection..."
if command -v redis-cli &> /dev/null; then
  if redis-cli -h localhost -p 6379 ping &>/dev/null; then
    echo "   ✅ Redis connection successful"
  else
    echo "   ❌ Redis connection failed"
    echo "      Check: REDIS_URL=redis://localhost:6379"
  fi
else
  echo "   ⚠️  redis-cli not found, skipping Redis test"
fi

echo ""
echo "4️⃣  Checking backend .env configuration..."
if [ -f "apps/backend/.env" ]; then
  if grep -q "postgresql://postgres:postgres@localhost:5432" apps/backend/.env; then
    echo "   ✅ DATABASE_URL points to Docker PostgreSQL"
  else
    echo "   ⚠️  DATABASE_URL may not point to Docker PostgreSQL"
    echo "      Expected: postgresql://postgres:postgres@localhost:5432/social_media"
  fi
  
  if grep -q "redis://localhost:6379" apps/backend/.env; then
    echo "   ✅ REDIS_URL points to Docker Redis"
  else
    echo "   ⚠️  REDIS_URL may not point to Docker Redis"
    echo "      Expected: redis://localhost:6379"
  fi
else
  echo "   ⚠️  apps/backend/.env not found"
fi

echo ""
echo "✅ Verification complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Ensure Docker services are running: docker compose up postgres redis -d"
echo "   2. Update apps/backend/.env with Docker credentials if needed"
echo "   3. Run your app: npm run dev:backend"

