"""
ADM Platform Telegram Bot - Main Entry Point.
Registers all handlers and starts polling.

Usage:
    python telegram_bot.py

Environment variables:
    TELEGRAM_BOT_TOKEN  - Bot token from @BotFather
    API_BASE_URL        - Backend API URL (default: http://localhost:8000/api/v1)
"""

import logging
import sys
import os

# Ensure the bot package directory is on the path so that absolute imports work
# regardless of the working directory the script is launched from.
BOT_DIR = os.path.dirname(os.path.abspath(__file__))
if BOT_DIR not in sys.path:
    sys.path.insert(0, BOT_DIR)

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(BOT_DIR, ".env"))
    # Also try parent directory .env
    load_dotenv(os.path.join(BOT_DIR, "..", ".env"))
except ImportError:
    pass

from telegram import Update, BotCommand
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
)

from config import config
from utils.api_client import api_client
from utils.formatters import (
    error_generic,
    E_WARNING, E_CROSS, E_SPARKLE, E_PEOPLE,
    E_CHART, E_PHONE, E_CALENDAR, E_BOOK,
    E_BRAIN, E_MEMO, E_FIRE, E_CHAT, E_GEAR,
    E_CHECK, E_SHIELD, E_SUNRISE,
    format_agent_list,
)
from utils.keyboards import main_menu_keyboard, agent_list_keyboard
from utils.voice import voice_command, send_voice_response, is_voice_enabled

# Handler imports
from handlers.start_handler import build_start_handler, help_command
from handlers.feedback_handler import build_feedback_handler
from handlers.diary_handler import build_diary_handler
from handlers.interaction_handler import build_interaction_handler
from handlers.training_handler import build_training_handler
from handlers.briefing_handler import briefing_command, briefing_callback
from handlers.ask_handler import build_ask_handler
from handlers.stats_handler import stats_command, stats_callback


# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

logging.basicConfig(
    format=config.LOG_FORMAT,
    level=getattr(logging, config.LOG_LEVEL, logging.INFO),
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# /agents command (simple, non-conversation)
# ---------------------------------------------------------------------------

async def agents_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /agents command - list assigned agents."""
    telegram_id = update.effective_user.id

    demo_agents = [
        {"name": "Suresh Patel", "agent_code": "AGT001", "status": "inactive", "last_active": "30 days ago"},
        {"name": "Priya Sharma", "agent_code": "AGT002", "status": "at_risk", "last_active": "5 days ago"},
        {"name": "Amit Kumar", "agent_code": "AGT003", "status": "active", "last_active": "Today"},
        {"name": "Neeta Desai", "agent_code": "AGT004", "status": "active", "last_active": "Yesterday"},
        {"name": "Rajesh Verma", "agent_code": "AGT005", "status": "inactive", "last_active": "45 days ago"},
        {"name": "Kavita Singh", "agent_code": "AGT006", "status": "at_risk", "last_active": "10 days ago"},
        {"name": "Deepak Gupta", "agent_code": "AGT007", "status": "inactive", "last_active": "60 days ago"},
        {"name": "Anjali Reddy", "agent_code": "AGT008", "status": "active", "last_active": "2 days ago"},
    ]

    agents_resp = await api_client.get_assigned_agents(telegram_id)
    agents = agents_resp.get("agents", agents_resp.get("data", []))
    total_pages = agents_resp.get("total_pages", 1)

    is_demo = False
    if not agents or agents_resp.get("error"):
        agents = demo_agents
        total_pages = 1
        is_demo = True

    text = format_agent_list(agents, page=1, total_pages=total_pages)
    if is_demo:
        text += f"\n\n<i>{E_WARNING} Demo data shown - API not connected</i>"
    sent_msg = await update.message.reply_text(text, parse_mode="HTML")
    await send_voice_response(sent_msg, text)


# ---------------------------------------------------------------------------
# Main menu callback handler (for inline keyboard buttons on main menu)
# ---------------------------------------------------------------------------

async def main_menu_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Route main menu button presses to the correct handler."""
    query = update.callback_query
    await query.answer()

    data = query.data

    # Map menu callbacks to instructions to use commands
    cmd_map = {
        "cmd_briefing": (f"{E_SUNRISE} Use /briefing for your morning briefing.\nBriefing ke liye /briefing type karein.", "/briefing"),
        "cmd_diary": (f"{E_CALENDAR} Use /diary to open your schedule.\nDiary ke liye /diary type karein.", "/diary"),
        "cmd_agents": (f"{E_PEOPLE} Use /agents to see your agent list.\nAgents ke liye /agents type karein.", "/agents"),
        "cmd_feedback": (f"{E_CHAT} Use /feedback to capture agent feedback.\nFeedback ke liye /feedback type karein.", "/feedback"),
        "cmd_log": (f"{E_MEMO} Use /log to log an interaction.\nInteraction log ke liye /log type karein.", "/log"),
        "cmd_train": (f"{E_BOOK} Use /train for product training.\nTraining ke liye /train type karein.", "/train"),
        "cmd_ask": (f"{E_BRAIN} Use /ask to ask AI about products.\nAI se puchne ke liye /ask type karein.", "/ask"),
        "cmd_stats": (f"{E_CHART} Use /stats for your performance.\nStats ke liye /stats type karein.", "/stats"),
    }

    if data in cmd_map:
        msg, cmd = cmd_map[data]
        await query.edit_message_text(
            f"{msg}\n\n<i>Tip: You can also type {cmd} directly!</i>",
            parse_mode="HTML",
        )
        return

    # Handle briefing-specific callbacks
    if data.startswith("brief_"):
        await briefing_callback(update, context)
        return

    # Handle stats callbacks
    if data.startswith("stats_"):
        await stats_callback(update, context)
        return


# ---------------------------------------------------------------------------
# Error handler
# ---------------------------------------------------------------------------

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Log errors and send a friendly message to the user."""
    logger.error("Exception while handling an update:", exc_info=context.error)

    # Try to send a friendly message to the user
    if isinstance(update, Update) and update.effective_message:
        try:
            await update.effective_message.reply_text(
                f"{E_WARNING} <b>Oops! Kuch gadbad ho gayi.</b>\n\n"
                f"Something went wrong. Please try again.\n"
                f"Agar problem continue ho toh /help use karein.\n\n"
                f"<i>Error has been logged for our team.</i>",
                parse_mode="HTML",
            )
        except Exception:
            pass  # Can't send message - probably a network error


# ---------------------------------------------------------------------------
# Post-init: set bot commands in Telegram menu
# ---------------------------------------------------------------------------

async def post_init(application: Application) -> None:
    """Set bot commands for the Telegram menu after initialization."""
    commands = [
        BotCommand("start", "Register / Restart"),
        BotCommand("briefing", "Morning briefing / Subah ki report"),
        BotCommand("diary", "Today's schedule / Aaj ka diary"),
        BotCommand("agents", "Your agents / Aapke agents"),
        BotCommand("feedback", "Capture agent feedback"),
        BotCommand("log", "Log an interaction"),
        BotCommand("train", "Product training modules"),
        BotCommand("ask", "AI product answers"),
        BotCommand("stats", "Your performance stats"),
        BotCommand("voice", "Toggle voice notes on/off"),
        BotCommand("help", "Show all commands"),
    ]
    try:
        await application.bot.set_my_commands(commands)
        logger.info("Bot commands set successfully.")
    except Exception as exc:
        logger.warning("Could not set bot commands: %s", exc)


# ---------------------------------------------------------------------------
# Shutdown: close API client
# ---------------------------------------------------------------------------

async def post_shutdown(application: Application) -> None:
    """Cleanup on shutdown."""
    await api_client.close()
    logger.info("API client closed.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    """Build and run the Telegram bot."""
    token = config.TELEGRAM_BOT_TOKEN

    if not token:
        logger.error(
            "TELEGRAM_BOT_TOKEN is not set! "
            "Please set the TELEGRAM_BOT_TOKEN environment variable."
        )
        sys.exit(1)

    logger.info("Starting ADM Platform Telegram Bot...")
    logger.info("API Base URL: %s", config.API_BASE_URL)

    # Build application
    application = (
        Application.builder()
        .token(token)
        .post_init(post_init)
        .post_shutdown(post_shutdown)
        .build()
    )

    # ------------------------------------------------------------------
    # Register conversation handlers (order matters - first match wins)
    # ------------------------------------------------------------------

    # /start - registration flow (ConversationHandler)
    application.add_handler(build_start_handler())

    # /feedback - multi-step feedback capture (ConversationHandler)
    application.add_handler(build_feedback_handler())

    # /diary (/schedule) - diary management (ConversationHandler)
    application.add_handler(build_diary_handler())

    # /log - interaction logging (ConversationHandler)
    application.add_handler(build_interaction_handler())

    # /train - product training + quiz (ConversationHandler)
    application.add_handler(build_training_handler())

    # /ask - AI product Q&A (ConversationHandler)
    application.add_handler(build_ask_handler())

    # ------------------------------------------------------------------
    # Register simple command handlers
    # ------------------------------------------------------------------

    # /help
    application.add_handler(CommandHandler("help", help_command))

    # /briefing - morning briefing
    application.add_handler(CommandHandler("briefing", briefing_command))

    # /agents - view assigned agents
    application.add_handler(CommandHandler("agents", agents_command))

    # /stats - performance dashboard
    application.add_handler(CommandHandler("stats", stats_command))

    # /voice - toggle voice mode
    application.add_handler(CommandHandler("voice", voice_command))

    # ------------------------------------------------------------------
    # Register callback query handlers for menus and actions
    # ------------------------------------------------------------------

    # Main menu button callbacks
    application.add_handler(CallbackQueryHandler(main_menu_callback, pattern=r"^cmd_"))

    # Briefing action callbacks
    application.add_handler(CallbackQueryHandler(briefing_callback, pattern=r"^brief_"))

    # Stats action callbacks
    application.add_handler(CallbackQueryHandler(stats_callback, pattern=r"^stats_"))

    # ------------------------------------------------------------------
    # Catch-all handler for debugging (logs any unhandled message)
    # ------------------------------------------------------------------
    from telegram.ext import MessageHandler, filters as tg_filters

    async def debug_catch_all(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Log any message that reaches the catch-all (means no handler matched)."""
        logger.warning(
            "CATCH-ALL: Unhandled update from user %s: %s",
            update.effective_user.id if update.effective_user else "unknown",
            update.message.text if update.message else str(update),
        )

    application.add_handler(
        MessageHandler(tg_filters.ALL, debug_catch_all),
        group=99,  # low priority group
    )

    # ------------------------------------------------------------------
    # Error handler
    # ------------------------------------------------------------------
    application.add_error_handler(error_handler)

    # ------------------------------------------------------------------
    # Start polling
    # ------------------------------------------------------------------
    logger.info("Bot is starting polling...")
    print("Bot started", flush=True)
    application.run_polling(
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True,
    )


if __name__ == "__main__":
    main()
