#!/bin/bash

set -e

echo "🚀 FieldPro Complete Setup"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_ROOT"

# Step 1: Check prerequisites
echo -e "${BLUE}📋 Step 1: Checking Prerequisites${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Step 2: Setup backend
echo -e "${BLUE}📦 Step 2: Setting up Backend${NC}"
cd "$PROJECT_ROOT/backend"

if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please update .env with your configuration${NC}"
fi

echo "Installing backend dependencies..."
npm install

echo "Generating Prisma Client..."
npx prisma generate

echo -e "${GREEN}✅ Backend setup complete${NC}"
echo ""

# Step 3: Setup frontend
echo -e "${BLUE}📦 Step 3: Setting up Frontend${NC}"
cd "$PROJECT_ROOT"

if [ ! -f ".env" ]; then
    echo "Creating frontend .env..."
    cat > .env << 'EOF'
VITE_API_URL=http://localhost:3000/api
EOF
fi

echo "Installing frontend dependencies..."
npm install

echo -e "${GREEN}✅ Frontend setup complete${NC}"
echo ""

# Step 4: Start Docker services
echo -e "${BLUE}🐳 Step 4: Starting Docker Services${NC}"
cd "$PROJECT_ROOT"

docker-compose up -d postgres redis

echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Check if PostgreSQL is ready
until docker-compose exec -T postgres pg_isready -U postgres; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo -e "${GREEN}✅ Docker services started${NC}"
echo ""

# Step 5: Run database migrations
echo -e "${BLUE}🗄️  Step 5: Running Database Migrations${NC}"
cd "$PROJECT_ROOT/backend"

npx prisma migrate dev --name init

echo -e "${GREEN}✅ Database migrations complete${NC}"
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
echo "  Adminer:   http://localhost:8080"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
