#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Starting project setup..."
echo ""

cd "$PROJECT_ROOT"

if [ ! -f "apps/backend/.env" ]; then
  echo "⚠️  Warning: apps/backend/.env not found"
  echo "   Creating from .env.example if it exists..."
  if [ -f "apps/backend/.env.example" ]; then
    cp apps/backend/.env.example apps/backend/.env
    echo "✅ Created apps/backend/.env from .env.example"
  else
    echo "❌ Error: apps/backend/.env.example not found"
    echo "   Please create apps/backend/.env manually"
    exit 1
  fi
fi

cd apps/backend

echo "📊 Loading database connection details..."

if [ ! -f ".env" ]; then
  echo "❌ Error: .env file not found in apps/backend/"
  exit 1
fi

# Safely extract DATABASE_URL from .env file
# This handles values with special characters properly
DATABASE_URL=$(grep -E '^DATABASE_URL=' .env | cut -d '=' -f2- | sed 's/^["'\'']//; s/["'\'']$//' | head -1)

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not found in .env"
  exit 1
fi

DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASSWORD=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*@[^:]*:\([^/]*\)/.*|\1|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

if [ -z "$DB_USER" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_NAME" ]; then
  echo "❌ Error: Could not parse DATABASE_URL"
  echo "   DATABASE_URL format: postgresql://user:password@host:port/database"
  exit 1
fi

echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   User: $DB_USER"
echo "   Database: $DB_NAME"
echo ""

echo "🔍 Checking PostgreSQL connection..."
if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" &>/dev/null; then
  echo "❌ Error: Cannot connect to PostgreSQL"
  echo "   Please ensure PostgreSQL is running and credentials are correct"
  exit 1
fi
echo "✅ PostgreSQL is running"
echo ""

echo "🗄️  Checking if database '$DB_NAME' exists..."
DB_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" != "1" ]; then
  echo "   Database does not exist. Creating..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" || {
    echo "❌ Error: Failed to create database"
    exit 1
  }
  echo "✅ Database '$DB_NAME' created"
else
  echo "✅ Database '$DB_NAME' already exists"
fi
echo ""

echo "🔄 Running database migrations..."
cd "$PROJECT_ROOT"
npm run db:migrate || {
  echo "❌ Error: Migration failed"
  exit 1
}
echo "✅ Migrations completed"
echo ""

echo "🌱 Checking if admin user exists..."
cd apps/backend
ADMIN_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM users WHERE username='admin';" 2>/dev/null || echo "0")

if [ -z "$ADMIN_EXISTS" ]; then
  ADMIN_EXISTS="0"
fi

if [ "$ADMIN_EXISTS" = "0" ]; then
  echo "   Admin user not found. Seeding admin user..."
  npm run db:seed || {
    echo "⚠️  Warning: Admin seed failed (might already exist)"
  }
  echo "✅ Admin user seed completed"
else
  echo "✅ Admin user already exists (skipping seed)"
fi
echo ""

echo "📝 Checking if posts exist..."
POST_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL;" 2>/dev/null || echo "0")

if [ -z "$POST_COUNT" ]; then
  POST_COUNT="0"
fi

if [ "$POST_COUNT" = "0" ]; then
  echo "   No posts found. Seeding posts and comments..."
  npm run db:seed:posts || {
    echo "⚠️  Warning: Posts/comments seed failed (might already exist)"
  }
  echo "✅ Posts/comments seed completed"
else
  echo "✅ Posts already exist ($POST_COUNT posts found, skipping seed)"
fi
echo ""

echo "📦 Installing dependencies for all workspaces..."
cd "$PROJECT_ROOT"
npm install || {
  echo "❌ Error: npm install failed"
  exit 1
}
echo "✅ Dependencies installed"
echo ""

FINAL_POST_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL;" 2>/dev/null || echo "0")
if [ -z "$FINAL_POST_COUNT" ]; then
  FINAL_POST_COUNT="0"
fi

echo "🎉 Setup completed successfully!"
echo ""
echo "📝 Summary:"
echo "   ✅ Database: $DB_NAME"
echo "   ✅ Migrations: Applied"
echo "   ✅ Admin user: Ready"
echo "   ✅ Posts: $FINAL_POST_COUNT posts"
echo "   ✅ Dependencies: Installed"
echo ""
echo "🚀 You can now start the development servers:"
echo "   npm run dev              # Start all services"
echo "   npm run dev:backend      # Start backend only"
echo "   npm run dev:frontend     # Start Vue frontend only"
echo "   npm run dev:frontend-react # Start React frontend only"

