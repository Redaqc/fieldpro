#!/bin/bash

# FieldPro FSM - Docker Deployment Script
# Quick deployment script for Docker-based setup

set -e

echo "============================================"
echo "  FieldPro FSM - Docker Deployment"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    echo "Creating .env from .env.docker template..."
    cp .env.docker .env
    echo -e "${GREEN}.env file created${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Please edit .env file and update the following:${NC}"
    echo "  - DB_PASSWORD (change from default)"
    echo "  - JWT_SECRET (use a strong random string)"
    echo "  - Email and SMS credentials (if needed)"
    echo "  - Integration credentials (if needed)"
    echo ""
    read -p "Press Enter to continue after editing .env, or Ctrl+C to exit..."
fi

echo "Starting deployment..."
echo ""

# Stop existing containers
echo "Stopping existing containers (if any)..."
docker-compose down 2>/dev/null || true

# Build and start containers
echo ""
echo "Building Docker images..."
docker-compose build

echo ""
echo "Starting containers..."
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "Waiting for services to be healthy..."
sleep 5

# Check service status
echo ""
echo "Checking service status..."
docker-compose ps

echo ""
echo "============================================"
echo -e "${GREEN}Deployment Complete!${NC}"
echo "============================================"
echo ""
echo "Services:"
echo "  🌐 Frontend: http://localhost:$(grep FRONTEND_PORT .env | cut -d '=' -f2 || echo '80')"
echo "  🔧 Backend API: http://localhost:$(grep BACKEND_PORT .env | cut -d '=' -f2 || echo '3001')"
echo "  💾 Database: localhost:$(grep DB_PORT .env | cut -d '=' -f2 || echo '5432')"
echo ""
echo "Useful commands:"
echo "  📊 View logs:        docker-compose logs -f"
echo "  📊 Backend logs:     docker-compose logs -f backend"
echo "  📊 Frontend logs:    docker-compose logs -f frontend"
echo "  🔄 Restart:          docker-compose restart"
echo "  🛑 Stop:             docker-compose down"
echo "  🗑️  Clean volumes:    docker-compose down -v"
echo ""
echo "Health checks:"
echo "  Frontend: curl http://localhost/health"
echo "  Backend:  curl http://localhost:3001/health"
echo ""
echo -e "${YELLOW}Note: First-time startup may take a few minutes for database initialization${NC}"
echo ""
