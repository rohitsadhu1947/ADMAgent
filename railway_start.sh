#!/bin/bash
# Railway startup script - runs backend + telegram bot
set -e

PORT="${PORT:-8000}"
echo "Starting ADM Platform on Railway (port: $PORT)..."

# Start Backend API
echo "Starting Backend API..."
cd /app/backend
PORT=$PORT python main.py &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in $(seq 1 30); do
    if curl -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
        echo "Backend is ready!"
        break
    fi
    sleep 1
done

# Start Telegram Bot
echo "Starting Telegram Bot..."
cd /app/bot
PYTHONPATH="/app/bot" API_BASE_URL="http://localhost:$PORT/api/v1" python telegram_bot.py &
BOT_PID=$!
echo "Telegram Bot started (PID: $BOT_PID)"

echo "All services running!"

# Wait for either process to exit
wait -n $BACKEND_PID $BOT_PID
echo "A process exited, shutting down..."
kill $BACKEND_PID $BOT_PID 2>/dev/null
exit 1
