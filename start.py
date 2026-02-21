"""
Railway startup script — single-process launcher for backend + Telegram bot.

Replaces railway_start.sh to avoid bash/subprocess issues on Railway.
Runs uvicorn in the main thread and the Telegram bot in a background thread.
"""

import os
import sys
import logging
import threading
import time

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("launcher")


def start_telegram_bot(port: int):
    """Start the Telegram bot in a background thread after backend is ready."""
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token:
        logger.info("TELEGRAM_BOT_TOKEN not set, skipping bot.")
        return

    def _run_bot():
        # Wait for backend to be ready
        import urllib.request
        for i in range(60):
            try:
                urllib.request.urlopen(f"http://localhost:{port}/health", timeout=2)
                logger.info("Backend is ready, starting Telegram bot...")
                break
            except Exception:
                time.sleep(1)
        else:
            logger.error("Backend never became ready after 60s, starting bot anyway.")

        # Add bot directory to path
        bot_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bot")
        if bot_dir not in sys.path:
            sys.path.insert(0, bot_dir)

        # Set API base URL for the bot
        os.environ["API_BASE_URL"] = f"http://localhost:{port}/api/v1"
        os.environ["PYTHONPATH"] = bot_dir

        try:
            # Import and run the bot
            # We need to use subprocess because run_polling() calls asyncio.run()
            # which conflicts with uvicorn's event loop if in the same process
            import subprocess
            subprocess.Popen(
                [sys.executable, os.path.join(bot_dir, "telegram_bot.py")],
                env={**os.environ, "API_BASE_URL": f"http://localhost:{port}/api/v1"},
                stdout=sys.stdout,
                stderr=sys.stderr,
            )
            logger.info("Telegram bot subprocess launched.")
        except Exception as e:
            logger.error(f"Failed to start Telegram bot: {e}")

    thread = threading.Thread(target=_run_bot, daemon=True)
    thread.start()


def main():
    port = int(os.environ.get("PORT", 8000))

    logger.info("=" * 60)
    logger.info("  ADM Platform Launcher")
    logger.info(f"  Port: {port}")
    logger.info("=" * 60)

    # Change to backend directory so imports work
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    os.chdir(backend_dir)
    sys.path.insert(0, backend_dir)

    # Start Telegram bot in background (will wait for backend)
    start_telegram_bot(port)

    # Start uvicorn in the main thread (this blocks and serves requests)
    import uvicorn
    logger.info(f"Starting uvicorn on 0.0.0.0:{port}...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
        # No reload in production
    )


if __name__ == "__main__":
    main()
