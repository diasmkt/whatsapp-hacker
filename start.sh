#!/bin/bash

# WWP Bot - Start Script
# Start both backend and frontend services

cd "$(dirname "$0")"

echo "🚀 Starting WWP Bot..."
echo ""

# Kill any existing processes on ports 3000 and 3001
echo "Cleaning up existing processes..."
pkill -f "node backend/src/server.js" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 2

# Start PostgreSQL container if not running
if ! docker ps | grep -q wwp-postgres; then
    echo "Starting PostgreSQL container..."
    docker compose up -d postgres
    sleep 3
fi

# Start Backend
echo "Starting Backend on port 3001..."
node backend/src/server.js > /tmp/wwp-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to be ready
sleep 3

# Start Frontend (Next.js production)
echo "Starting Frontend on port 3000..."
npm run start > /tmp/wwp-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for services to be ready
sleep 5

echo ""
echo "=========================================="
echo "✅ WWP Bot is running!"
echo "=========================================="
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo ""
echo "Logs:"
echo "  Backend: /tmp/wwp-backend.log"
echo "  Frontend: /tmp/wwp-frontend.log"
echo ""
echo "To stop: kill $BACKEND_PID $FRONTEND_PID"
echo "=========================================="

# Keep script running
wait
