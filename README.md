# Social Media Application

A full-stack social media web application with user authentication, posts, comments, and replies.

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Cache**: Redis
- **Testing**: Vitest + Testcontainers

### Frontend
- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **UI Library**: PrimeVue
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Utilities**: VueUse
- **Testing**: Vitest + Vue Test Utils

## Project Structure

```
social/
├── apps/
│   ├── backend/              # Express API server
│   │   ├── src/
│   │   │   ├── modules/      # Feature modules (users, posts, comments)
│   │   │   ├── db/           # Database schemas, migrations, seeds
│   │   │   ├── lib/          # Utilities and helpers
│   │   │   ├── middleware/   # Express middleware
│   │   │   └── index.ts      # Application entry point
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── frontend/             # Vue application
│       ├── src/
│       │   ├── components/   # Reusable Vue components
│       │   ├── views/        # Route pages
│       │   ├── stores/       # Pinia stores
│       │   ├── composables/  # Vue composables
│       │   ├── services/     # API services
│       │   └── router/       # Vue Router config
│       ├── Dockerfile
│       ├── nginx.conf
│       └── package.json
│
├── packages/                 # Shared packages (future)
├── docker-compose.yml        # Docker orchestration
├── package.json              # Root workspace config
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd social
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Backend:
```bash
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with your configuration
```

Frontend:
```bash
cp apps/frontend/.env.example apps/frontend/.env
# Edit apps/frontend/.env with your configuration
```

### Development

#### Option 1: Run with Docker Compose

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
npm run docker:up

# Stop all services
npm run docker:down
```

#### Option 2: Run locally

1. Start PostgreSQL and Redis:
```bash
docker-compose up postgres redis -d
```

2. Run database migrations:
```bash
npm run db:migrate
```

3. (Optional) Seed the database:
```bash
npm run db:seed
```

4. Start development servers:

In separate terminals:
```bash
# Backend (http://localhost:3000)
npm run dev:backend

# Frontend (http://localhost:5173)
npm run dev:frontend
```

Or run both together:
```bash
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Run tests with coverage
npm run test -- --coverage
```

### Building for Production

```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run build:backend
npm run build:frontend
```

### Database Management

```bash
# Generate new migration
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema changes (development only)
npm run db:push

# Open Drizzle Studio
npm run db:studio

# Seed database
npm run db:seed
```

## API Documentation

The backend API follows REST conventions and is available at `http://localhost:3000/api/v1`.

### Health Check
- `GET /health` - Server health status

## Features

- User registration and authentication
- Create, edit, and delete posts
- Comment on posts
- Reply to posts and comments
- Global timeline view
- Search functionality
- Soft deletion with admin capabilities
- Role-based access control
- Rate limiting
- Session management with Redis

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
- Pinia for state management
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

## License

MIT



<!-- NOTE -->
create database
```
createdb social_media 2>&1 || echo "Database might already exist, checking..."
```

check database info
```
psql -l | grep social_media
```

run migration
```
npm run db:migrate
```
