#!/bin/bash

# Setup E2E Test Database Script
# This script creates the E2E test database and runs migrations

set -e  # Exit on error

echo "🔧 Setting up E2E test database..."

# Load environment variables from apps/backend/.env
if [ -f "apps/backend/.env" ]; then
  export $(cat apps/backend/.env | grep -v '^#' | grep E2E_DATABASE_URL | xargs)
else
  echo "❌ apps/backend/.env file not found"
  exit 1
fi

# Check if E2E_DATABASE_URL is set
if [ -z "$E2E_DATABASE_URL" ]; then
  echo "❌ E2E_DATABASE_URL is not set in apps/backend/.env"
  echo "💡 Add this line to your apps/backend/.env:"
  echo "   E2E_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media_e2e"
  exit 1
fi

# Extract database name from E2E_DATABASE_URL
DB_NAME=$(echo $E2E_DATABASE_URL | sed 's/.*\///')

echo "📦 Database: $DB_NAME"

# Check if PostgreSQL is running
if ! pg_isready > /dev/null 2>&1; then
  echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
  exit 1
fi

# Create database if it doesn't exist
echo "🗄️  Creating database if it doesn't exist..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
  psql -U postgres -c "CREATE DATABASE $DB_NAME"

echo "✅ Database created/verified"

# Run migrations with E2E environment
echo "🔄 Running migrations..."
cd apps/backend
NODE_ENV=e2e npm run db:migrate

echo "✅ E2E test database setup complete!"
echo "📝 Database: $DB_NAME"
echo "🧪 You can now run E2E tests with: npm run test:e2e"
