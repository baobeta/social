# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy backend package files
COPY apps/backend/package*.json ./apps/backend/
COPY apps/backend/tsconfig.json ./apps/backend/

# Install dependencies
RUN npm ci --workspaces --if-present

# Copy backend source
COPY apps/backend ./apps/backend

# Build backend
RUN npm run build -w @social/backend

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

RUN npm ci --workspaces --if-present --only=production

# Copy built files
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY apps/backend/src/db/migrations ./apps/backend/src/db/migrations

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "apps/backend/dist/index.js"]
