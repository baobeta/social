#!/bin/sh
set -e

echo "📦 Installing dependencies..."
cd /app
npm ci --workspaces --if-present || npm install --workspaces --if-present

echo "🚀 Starting React frontend dev server..."
cd /app/apps/frontend-react
exec npm run dev -- --host 0.0.0.0

