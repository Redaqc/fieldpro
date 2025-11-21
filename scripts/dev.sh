#!/bin/bash

# Development script to run both frontend and backend concurrently

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting FieldPro Development Environment${NC}"
echo ""

# Check if services are running
if ! docker-compose ps | grep -q "fieldpro-postgres.*Up"; then
    echo "Starting Docker services..."
    docker-compose up -d postgres redis
    sleep 5
fi

# Kill any existing processes on ports 3000 and 5173
echo "Checking for processes on ports 3000 and 5173..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo -e "${GREEN}Starting backend and frontend...${NC}"
echo ""

# Use npx concurrently if available, otherwise run in background
if command -v concurrently &> /dev/null; then
    npx concurrently \
        --names "BACKEND,FRONTEND" \
        --prefix-colors "blue,green" \
        "cd $PROJECT_ROOT/backend && npm run start:dev" \
        "cd $PROJECT_ROOT && npm run dev"
else
    # Fallback: run in background
    cd "$PROJECT_ROOT/backend"
    npm run start:dev &
    BACKEND_PID=$!

    cd "$PROJECT_ROOT"
    npm run dev &
    FRONTEND_PID=$!

    echo ""
    echo -e "${GREEN}Backend PID: $BACKEND_PID${NC}"
    echo -e "${GREEN}Frontend PID: $FRONTEND_PID${NC}"
    echo ""
    echo "Press Ctrl+C to stop both services"

    # Wait for both processes
    wait $BACKEND_PID $FRONTEND_PID
fi
