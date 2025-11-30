FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY apps/frontend-react/package*.json ./apps/frontend-react/
COPY apps/frontend-react/tsconfig*.json ./apps/frontend-react/

RUN npm ci --workspaces --if-present

COPY apps/frontend-react ./apps/frontend-react
COPY apps/frontend-react/docker-entrypoint.sh ./apps/frontend-react/

EXPOSE 5174

WORKDIR /app

RUN chmod +x apps/frontend-react/docker-entrypoint.sh

ENTRYPOINT ["/app/apps/frontend-react/docker-entrypoint.sh"]

