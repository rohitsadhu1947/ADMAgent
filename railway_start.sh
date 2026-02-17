#!/bin/bash
# Railway startup script - runs backend + telegram bot

PORT="${PORT:-8000}"
echo "Starting ADM Platform on Railway (port: $PORT)..."

# Start Backend API
echo "Starting Backend API..."
cd /app/backend
uvicorn main:app --host 0.0.0.0 --port "$PORT" --log-level info &
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

# Start Telegram Bot (only if token is set)
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    echo "Starting Telegram Bot..."
    cd /app/bot
    PYTHONPATH="/app/bot" API_BASE_URL="http://localhost:$PORT/api/v1" python telegram_bot.py &
    BOT_PID=$!
    echo "Telegram Bot started (PID: $BOT_PID)"
else
    echo "TELEGRAM_BOT_TOKEN not set, skipping bot."
fi

echo "All services running!"

# Keep container alive by waiting on backend
wait $BACKEND_PID
