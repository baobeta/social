#!/bin/sh
set -e

echo "🚀 Starting backend setup..."

echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -U postgres -d postgres > /dev/null 2>&1; do
  echo "   PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready"

echo "🔄 Running database migrations..."
cd /app
npm run db:migrate || {
  echo "❌ Migration failed"
  exit 1
}
echo "✅ Migrations completed"

echo "🌱 Seeding database (admin user)..."
npm run db:seed || {
  echo "⚠️  Seed failed (might already be seeded)"
}
echo "✅ Admin seed completed"

echo "📝 Seeding posts and comments..."
npm run db:seed:posts || {
  echo "⚠️  Posts/comments seed failed (might already be seeded)"
}
echo "✅ Posts/comments seed completed"

echo "🎯 Starting backend server..."
exec npm run dev:backend

