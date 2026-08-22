#!/usr/bin/env bash
set -e

echo "============================================"
echo "  TeamForge - Starting Full App"
echo "============================================"
echo ""

# Start backend
echo "Starting Backend (FastAPI) on port 8000..."
cd backend
source .venv/Scripts/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in {1..15}; do
  if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "Backend is ready!"
    break
  fi
  sleep 1
done

# Start frontend
echo "Starting Frontend (Vite) on port 5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "============================================"
echo "  Both servers are running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo "============================================"
echo ""

# Wait for both processes
wait
