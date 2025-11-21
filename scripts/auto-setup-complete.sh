#!/bin/bash

set -e

echo "🚀 FieldPro Complete Auto-Setup"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="/home/user/fieldpro"

cd "$PROJECT_ROOT"

# Step 1: Initialize backend
echo -e "${BLUE}📦 Step 1: Setting up Backend${NC}"
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

echo "Installing backend dependencies..."
npm install

echo "Generating Prisma Client..."
npx prisma generate

echo -e "${GREEN}✅ Backend setup complete${NC}"
echo ""

# Step 2: Update frontend API client
echo -e "${BLUE}📦 Step 2: Updating Frontend${NC}"
cd "$PROJECT_ROOT"

# Create new API client
cat > src/api/client.ts << 'EOF'
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;
  private refreshing = false;
  private refreshQueue: Array<() => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        const tenantSlug = localStorage.getItem('tenant_slug');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (tenantSlug) {
          config.headers['X-Tenant-Slug'] = tenantSlug;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.refreshing) {
            return new Promise((resolve) => {
              this.refreshQueue.push(() => {
                originalRequest.headers.Authorization = `Bearer ${localStorage.getItem('access_token')}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.refreshing = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');

            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            const { data } = await axios.post(`${API_URL}/auth/refresh`, {
              refresh_token: refreshToken,
            });

            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);

            this.refreshQueue.forEach((callback) => callback());
            this.refreshQueue = [];

            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            localStorage.clear();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.refreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  getInstance(): AxiosInstance {
    return this.client;
  }
}

const apiClient = new ApiClient().getInstance();
export default apiClient;
EOF

echo -e "${GREEN}✅ Frontend API client created${NC}"
echo ""

# Step 3: Create Docker Compose
echo -e "${BLUE}🐳 Step 3: Creating Docker Configuration${NC}"
cd "$PROJECT_ROOT"

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    container_name: fieldpro-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: fieldpro_saas
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - fieldpro-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: fieldpro-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - fieldpro-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:

networks:
  fieldpro-network:
    driver: bridge
EOF

echo -e "${GREEN}✅ Docker Compose created${NC}"
echo ""

# Step 4: Start services
echo -e "${BLUE}🚀 Step 4: Starting Services${NC}"
docker-compose up -d postgres redis

echo "Waiting for PostgreSQL to be ready..."
sleep 10

echo -e "${GREEN}✅ Services started${NC}"
echo ""

# Step 5: Run migrations
echo -e "${BLUE}🗄️  Step 5: Running Database Migrations${NC}"
cd "$PROJECT_ROOT/backend"
npx prisma migrate dev --name init

echo -e "${GREEN}✅ Migrations complete${NC}"
echo ""

# Final Summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 FieldPro Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}To start development:${NC}"
echo ""
echo "  Backend:"
echo "    cd backend"
echo "    npm run start:dev"
echo ""
echo "  Frontend:"
echo "    npm run dev"
echo ""
echo -e "${YELLOW}Access Points:${NC}"
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:3000/api"
echo "  API Docs:  http://localhost:3000/api/docs"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
