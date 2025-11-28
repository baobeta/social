# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy frontend package files
COPY apps/frontend/package*.json ./apps/frontend/
COPY apps/frontend/tsconfig*.json ./apps/frontend/

# Install dependencies
RUN npm ci --workspaces --if-present

# Copy frontend source
COPY apps/frontend ./apps/frontend

# Build frontend
RUN npm run build -w @social/frontend

# Production stage with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx-custom && \
    adduser -S nginx-custom -u 1001

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
