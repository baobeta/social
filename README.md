# Social Application

A full-stack social web application built with modern technologies. Features user authentication, posts, comments, and replies with a clean, scalable architecture.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Development](#development)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Database Management](#database-management)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- 🔐 **User Authentication** - Registration, login, and session management
- 📝 **Posts** - Create, edit, delete, and view posts in a global timeline
- 💬 **Comments** - Comment on posts with threaded replies
- 🔍 **Search** - Full-text search for users and posts
- 👥 **User Profiles** - View and edit user profiles
- 🛡️ **Admin Features** - Role-based access control with admin capabilities
- 🗑️ **Soft Deletion** - Posts and comments support soft deletion
- ⚡ **Performance** - Optimized with Redis caching and database indexing
- 🔒 **Security** - Rate limiting, input validation, and secure authentication

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Testing**: Vitest + Testcontainers

### Frontend
- **Vue 3** (Composition API) - Primary frontend
- **React 18** - Alternative frontend implementation
- **Build Tool**: Vite
- **UI Library**: PrimeVue (Vue), Tailwind CSS
- **State Management**: Pinia (Vue), React Query (React)
- **Styling**: Tailwind CSS
- **Testing**: Vitest

## Quick Start

### Prerequisites

- **Node.js** 20.0.0 or higher
- **npm** 10.0.0 or higher
- **Docker** and **Docker Compose** (recommended)
- **PostgreSQL** 15+ (if not using Docker)
- **Redis** 7+ (if not using Docker)

### One-Command Setup with Docker

The easiest way to get started:

```bash
# Clone the repository
git clone <repository-url>
cd social

# Start all services (PostgreSQL, Redis, Backend, Frontends)
docker compose up
```

This automatically:
- ✅ Sets up PostgreSQL and Redis
- ✅ Runs database migrations
- ✅ Seeds admin user (username: `admin`, password: `admin@123`)
- ✅ Starts backend API on port 3000
- ✅ Starts Vue frontend on port 5173
- ✅ Starts React frontend on port 5174

Access the application:
- **Vue Frontend**: http://localhost:5173
- **React Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed Docker instructions.

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd social
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

#### Backend Environment

Create `apps/backend/.env`:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env` with your configuration:

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

#### Frontend Environment (Optional)

Create `apps/frontend/.env` (optional, defaults to `/api`):

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 4. Database Setup

#### Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker compose up postgres redis -d
```

#### Using Local PostgreSQL

```bash
# Create database
createdb social_media

# Or using psql
psql -U postgres -c "CREATE DATABASE social_media;"
```

### 5. Run Migrations

```bash
npm run db:migrate
```

### 6. Seed Database (Optional)

```bash
npm run db:seed
```

This creates an admin user:
- **Username**: `admin`
- **Password**: `admin@123`

## Development

### Start Development Servers

#### Option 1: Run All Services

```bash
npm run dev
```

#### Option 2: Run Services Individually

In separate terminals:

```bash
# Backend (http://localhost:3000)
npm run dev:backend

# Vue Frontend (http://localhost:5173)
npm run dev:frontend

# React Frontend (http://localhost:5174)
npm run dev:frontend-react
```

### Development Workflow

1. **Make changes** to source code
2. **Hot reload** automatically applies changes
3. **Run tests** to verify changes
4. **Check linting** with `npm run lint`

### Code Quality

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Format code (if configured)
npm run format
```

## Project Structure

```
social/
├── apps/
│   ├── backend/              # Express API server
│   │   ├── src/
│   │   │   ├── modules/      # Feature modules (auth, users, posts, comments)
│   │   │   ├── db/           # Database schemas, migrations, seeds
│   │   │   ├── lib/          # Utilities and helpers
│   │   │   ├── middleware/   # Express middleware
│   │   │   └── index.ts      # Application entry point
│   │   ├── Dockerfile.dev    # Development Dockerfile
│   │   └── package.json
│   │
│   ├── frontend/             # Vue 3 application
│   │   ├── src/
│   │   │   ├── components/   # Reusable Vue components
│   │   │   ├── views/        # Route pages
│   │   │   ├── stores/       # Pinia stores
│   │   │   ├── composables/  # Vue composables
│   │   │   ├── services/     # API services
│   │   │   └── router/       # Vue Router config
│   │   └── package.json
│   │
│   └── frontend-react/       # React application
│       ├── src/
│       │   ├── components/   # React components
│       │   ├── views/       # Page components
│       │   ├── contexts/    # React contexts
│       │   ├── services/    # API services
│       │   └── types/       # TypeScript types
│       └── package.json
│
├── docs/                     # Documentation
├── e2e/                      # End-to-end tests
├── docker-compose.yml        # Docker orchestration
├── package.json              # Root workspace config
└── README.md
```

## API Documentation

The backend API follows REST conventions and is available at `http://localhost:3000/api`.

### Base URL

```
http://localhost:3000/api
```

### Authentication

Authentication uses HttpOnly cookies. Include credentials in requests:

```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
})
```

### Endpoints

#### Health Check
- `GET /health` - Server health status

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

#### Users
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update current user profile

#### Posts
- `GET /api/posts` - Get global timeline (paginated)
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get post by ID
- `PATCH /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post (soft delete)

#### Comments
- `GET /api/posts/:postId/comments` - Get comments for a post
- `POST /api/posts/:postId/comments` - Create comment on post
- `GET /api/comments/:id` - Get comment by ID
- `PATCH /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment (soft delete)
- `POST /api/comments/:id/replies` - Reply to comment

#### Search
- `GET /api/search?q=query` - Unified search (users and posts)
- `GET /api/search/users?q=query` - Search users only
- `GET /api/search/posts?q=query` - Search posts only

#### Audit Logs (Admin Only)
- `GET /api/audit-logs` - Get audit logs

For detailed API documentation, see:
- [Backend API Documentation](./apps/backend/docs/)
- [API Routes Reference](./apps/frontend/API_ROUTES.md)

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests by Workspace

```bash
# Backend tests
npm run test:backend

# Frontend tests
npm run test:frontend
```

### Run Tests with Coverage

```bash
npm run test -- --coverage
```

### Watch Mode

```bash
npm run test:watch
```

### End-to-End Tests

```bash
# Setup E2E database
npm run test:e2e:setup

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```


## Database Management

### Generate Migration

After changing the schema:

```bash
npm run db:generate
```

### Run Migrations

```bash
npm run db:migrate
```

### Seed Database

```bash
npm run db:seed
```

### Database Studio

Open Drizzle Studio to browse the database:

```bash
npm run db:studio
```

### Push Schema (Development Only)

For rapid development, push schema changes directly:

```bash
npm run db:push
```

**Warning**: Only use in development. Always use migrations in production.


## Deployment

### Building for Production

```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run build:backend
npm run build:frontend
```

### Production Environment Variables

Ensure all required environment variables are set:

- `NODE_ENV=production`
- `DATABASE_URL` - Production database URL
- `REDIS_URL` - Production Redis URL
- `JWT_SECRET` - Strong secret key
- `CORS_ORIGIN` - Allowed frontend origins

### Docker Production Build

```bash
docker compose -f docker-compose.prod.yml up
```


### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Update documentation as needed
- Follow the existing code style

## Architecture Principles

### Backend
- Feature-based modular structure
- Controllers contain no business logic
- Services contain all business rules
- Repositories handle 100% of database access
- Strict TypeScript with Zod validation
- Centralized error handling
- Structured logging with Pino
- Connection pooling
- Database indexes for performance

### Frontend
- Composition API with `<script setup>` syntax
- Pinia for state management (Vue)
- React Query for data fetching (React)
- Composables for reusable logic
- API service layer separation
- Type-safe routing
- Lazy-loaded route components
- Proper loading and error states

## Security

- Helmet for HTTP security headers
- CORS configuration
- Rate limiting on sensitive endpoints
- Password hashing with bcrypt
- JWT + Session authentication
- SQL injection prevention (via Drizzle ORM)
- Input validation with Zod
- No sensitive data in logs
- HttpOnly cookies for session management

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $DATABASE_URL
```

#### Migration Errors
```bash
# Check migration files exist
ls -la apps/backend/src/db/migrations/

# Verify meta folder
ls -la apps/backend/src/db/migrations/meta/
```

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for details.

## Acknowledgments

Built with modern web technologies and best practices for scalability and maintainability.
