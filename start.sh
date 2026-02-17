#!/bin/bash
# ============================================
# Axis Max Life - ADM Platform Startup Script
# ============================================

set -e

echo "🚀 Starting ADM Platform..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
BOT_DIR="$PROJECT_DIR/bot"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Kill existing processes
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
pkill -f "uvicorn main:app" 2>/dev/null || true
pkill -f "telegram_bot.py" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source "$BACKEND_DIR/venv/bin/activate"

# Start Backend API
echo -e "${GREEN}Starting Backend API on port 8000...${NC}"
cd "$BACKEND_DIR"
python main.py &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
sleep 3

# Verify backend is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

# Start Telegram Bot
echo -e "${GREEN}Starting Telegram Bot...${NC}"
cd "$BOT_DIR"
PYTHONPATH="$BOT_DIR" python telegram_bot.py &
BOT_PID=$!
echo -e "${GREEN}✅ Telegram Bot started (PID: $BOT_PID)${NC}"

# Find a free port for frontend (starting from 3000)
FRONTEND_PORT=3000
for p in 3000 3001 3002 3003 3004 3005; do
    if ! (echo >/dev/tcp/localhost/$p) 2>/dev/null; then
        FRONTEND_PORT=$p
        break
    fi
done

# Start Frontend
echo -e "${GREEN}Starting Frontend on port ${FRONTEND_PORT}...${NC}"
cd "$FRONTEND_DIR"
PORT=$FRONTEND_PORT npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 ADM Platform is RUNNING!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "  🌐 Dashboard:    ${BLUE}http://localhost:${FRONTEND_PORT}${NC}"
echo -e "  📡 Backend API:  ${BLUE}http://localhost:8000${NC}"
echo -e "  📖 API Docs:     ${BLUE}http://localhost:8000/docs${NC}"
echo -e "  🤖 Telegram Bot: ${BLUE}https://t.me/Admagent_bot${NC}"
echo -e "  📄 Swimlane:     ${BLUE}file://$PROJECT_DIR/swimlane-process.html${NC}"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Trap Ctrl+C
trap "echo 'Shutting down...'; kill $BACKEND_PID $BOT_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# Wait
wait
