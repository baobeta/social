#!/bin/bash

# Setup Test Database Script
# This script creates the test database and runs migrations

set -e  # Exit on error

echo "🔧 Setting up test database..."

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Extract database connection details
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
TEST_DB_NAME="${TEST_DB_NAME:-social_media_test}"

echo "📊 Database configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Test Database: $TEST_DB_NAME"
echo ""

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt &>/dev/null; then
  echo "❌ Error: Cannot connect to PostgreSQL"
  echo "   Please ensure PostgreSQL is running and credentials are correct"
  exit 1
fi
echo "✅ PostgreSQL is running"

# Create test database if it doesn't exist
echo ""
echo "🗄️  Creating test database '$TEST_DB_NAME'..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$TEST_DB_NAME'" | grep -q 1 || \
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $TEST_DB_NAME"
echo "✅ Test database ready"

# Run migrations on test database
echo ""
echo "🔄 Running migrations on test database..."
TEST_DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$TEST_DB_NAME"

# Export environment variable for migration script
export DATABASE_URL=$TEST_DATABASE_URL
export NODE_ENV=test

npm run db:migrate

echo ""
echo "✅ Test database setup complete!"
echo ""
echo "📝 Add this to your .env file:"
echo "TEST_DATABASE_URL=$TEST_DATABASE_URL"
echo ""
echo "🧪 Run tests with: npm test"
