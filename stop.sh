#!/bin/bash
echo "🛑 Stopping ADM Platform..."
pkill -f "uvicorn main:app" 2>/dev/null || true
pkill -f "telegram_bot.py" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
echo "✅ All services stopped"
