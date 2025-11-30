# Frontend React

React frontend application for the social platform, built with React Query for optimized data fetching and caching.

## Features

- **HomeView**: Landing page with hero section, features, and call-to-action
- **LoginView**: User authentication with form validation
- **RegisterView**: User registration with password strength indicator
- **TimelineView**: Post feed with infinite scroll, search, create, edit, and delete functionality

## Tech Stack

- **React 18** with TypeScript
- **React Router** for routing
- **React Query (TanStack Query)** for data fetching, caching, and state management
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **Axios** for HTTP requests

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional, defaults to `/api`):
```
VITE_API_BASE_URL=http://localhost:3000/api
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5174`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run typecheck` - Type check without emitting

## Project Structure

```
src/
├── assets/          # CSS and static assets
├── components/      # Reusable React components
│   ├── auth/       # Authentication components
│   ├── landing/    # Landing page components
│   ├── posts/      # Post-related components
│   └── timeline/   # Timeline components
├── contexts/       # React contexts (AuthContext)
├── router/         # React Router configuration
├── services/       # API service functions
├── types/          # TypeScript type definitions
└── views/          # Page components
```

## React Query Usage

The application uses React Query for optimized data fetching:

- **Infinite Queries**: Used for paginated post lists with infinite scroll
- **Mutations**: Used for create, update, and delete operations
- **Query Invalidation**: Automatically refetches data after mutations
- **Debounced Search**: Search queries are debounced to reduce API calls

## Authentication

Authentication is handled via HttpOnly cookies. The `AuthContext` provides:
- `user`: Current user object
- `isAuthenticated`: Boolean authentication status
- `isAdmin`: Boolean admin status
- `login()`, `register()`, `logout()`: Authentication methods

## Performance Optimizations

- React Query caching reduces unnecessary API calls
- Infinite scroll pagination for efficient data loading
- Debounced search input (500ms delay)
- Memoized computed values where appropriate
- Lazy loading of route components

