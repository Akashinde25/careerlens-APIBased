#!/bin/bash
echo "========================================="
echo "   CareerLens — Groq API Edition         "
echo "========================================="

# Ensure we're in the right directory
cd "$(dirname "$0")"

# 1. Check virtual environment
echo ""
echo "1. Checking Python Virtual Environment..."
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "   Please run: python3 setup.py"
    exit 1
fi
echo "✅ Virtual environment found."

# 2. Health check
echo ""
echo "2. Running System Health Check..."
venv/bin/python ai_engine/health_check.py
if [ $? -ne 0 ]; then
    echo "❌ Health check failed. Please check dependencies."
    exit 1
fi
echo "✅ Health check passed."

# 3. Backend
echo ""
echo "3. Starting Backend API Server (Port 3001)..."
cd backend
node server.js &
BACKEND_PID=$!
cd ..
sleep 1

# 4. Frontend
echo ""
echo "4. Starting Frontend Dev Server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================="
echo "✅ CareerLens is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo "   Press Ctrl+C to stop all services."
echo "========================================="

# Cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down CareerLens..."
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    echo "Stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM

wait
