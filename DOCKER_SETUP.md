# Docker Setup Guide

Complete guide for running the Social Application with Docker Compose.

## Quick Start

Run everything with a single command:

```bash
docker compose up
```

Or run in detached mode (background):

```bash
docker compose up -d
```

That's it! All services will start automatically.

## What Gets Set Up

The docker compose setup automatically:

1. ✅ **PostgreSQL** - Database server on port `5432`
2. ✅ **Redis** - Cache server on port `6379`
3. ✅ **Backend** - API server on port `3000`
   - Automatically runs database migrations
   - Automatically seeds admin user
4. ✅ **Frontend Vue** - Vue.js app on port `5173`
5. ✅ **Frontend React** - React app on port `5174`

## Services

### PostgreSQL
- **Port**: `5432`
- **Database**: `social_media`
- **User**: `postgres`
- **Password**: `postgres`
- **Volume**: `postgres_data` (persists data)

### Redis
- **Port**: `6379`
- **Volume**: `redis_data` (persists data)

### Backend
- **Port**: `3000`
- **URL**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Base**: http://localhost:3000/api

The backend automatically:
- Waits for PostgreSQL to be ready
- Runs database migrations
- Seeds the admin user (username: `admin`, password: `admin@123`)

### Frontend Vue
- **Port**: `5173`
- **URL**: http://localhost:5173
- **Hot Reload**: Enabled (changes reflect immediately)

### Frontend React
- **Port**: `5174`
- **URL**: http://localhost:5174
- **Hot Reload**: Enabled (changes reflect immediately)

## Environment Variables

You can customize the setup by creating a `.env` file in the root directory:

```env
JWT_SECRET=your-secret-key-here
```

Default values:
- `JWT_SECRET`: `dev-jwt-secret-change-in-production`
- `CORS_ORIGIN`: `http://localhost:5173,http://localhost:5174`

## Common Commands

### Start all services
```bash
docker compose up
```

### Start in background
```bash
docker compose up -d
```

### View logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f frontend-react
```

### Stop all services
```bash
docker compose down
```

### Stop and remove volumes (⚠️ deletes database data)
```bash
docker compose down -v
```

### Rebuild containers
```bash
docker compose build
```

### Restart a specific service
```bash
docker compose restart backend
```

## Accessing the Services

After starting, you can access:

- **Vue Frontend**: http://localhost:5173
- **React Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## Default Admin User

After seeding, you can log in with:
- **Username**: `admin`
- **Password**: `admin@123`

## Troubleshooting

### Database connection issues
If the backend can't connect to PostgreSQL:
1. Check if PostgreSQL container is running: `docker compose ps`
2. Check PostgreSQL logs: `docker compose logs postgres`
3. Wait a few seconds for PostgreSQL to fully start

### Port already in use
If you get port conflicts:
1. Stop the conflicting service
2. Or modify ports in `docker compose.yml`

### Re-run migrations
If you need to reset the database:
```bash
docker compose down -v
docker compose up
```

### View backend logs
```bash
docker compose logs -f backend
```

## Development

All services run in development mode with:
- Hot reload enabled
- Source code mounted as volumes
- Full logging enabled

Changes to source code will automatically reflect in the running containers.

