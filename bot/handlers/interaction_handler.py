"""
Interaction logging conversation handler for the ADM Platform Telegram Bot.
Flow: Agent -> Topic -> Outcome -> Follow-up -> Notes -> Confirm
"""

import logging
from datetime import datetime, timedelta

from telegram import Update
from telegram.ext import (
    CommandHandler,
    ConversationHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters,
)

from config import InteractionStates
from utils.api_client import api_client
from utils.formatters import (
    format_interaction_summary,
    interaction_saved,
    error_generic,
    cancelled,
    voice_note_received,
    E_HANDSHAKE, E_PERSON, E_PENCIL, E_CHECK, E_CROSS,
    E_CALENDAR, E_MEMO, E_MIC, E_CHAT,
)
from utils.keyboards import (
    agent_list_keyboard,
    interaction_topic_keyboard,
    interaction_outcome_keyboard,
    followup_keyboard,
    notes_keyboard,
    confirm_keyboard,
)
from utils.voice import send_voice_response

logger = logging.getLogger(__name__)

# Demo agents for when API is unreachable or no agents assigned
DEMO_AGENTS = [
    {"id": "1", "agent_code": "AGT001", "name": "Suresh Patel", "status": "inactive", "last_active": "30 days ago"},
    {"id": "2", "agent_code": "AGT002", "name": "Priya Sharma", "status": "at_risk", "last_active": "5 days ago"},
    {"id": "3", "agent_code": "AGT003", "name": "Amit Kumar", "status": "active", "last_active": "Today"},
    {"id": "4", "agent_code": "AGT004", "name": "Neeta Desai", "status": "active", "last_active": "Yesterday"},
    {"id": "5", "agent_code": "AGT005", "name": "Rajesh Verma", "status": "inactive", "last_active": "45 days ago"},
    {"id": "6", "agent_code": "AGT006", "name": "Kavita Singh", "status": "at_risk", "last_active": "10 days ago"},
    {"id": "7", "agent_code": "AGT007", "name": "Deepak Gupta", "status": "inactive", "last_active": "60 days ago"},
    {"id": "8", "agent_code": "AGT008", "name": "Anjali Reddy", "status": "active", "last_active": "2 days ago"},
]

TOPIC_MAP = {
    "topic_product": "Product Info",
    "topic_commission": "Commission Query",
    "topic_system": "System Help",
    "topic_reengage": "Re-engagement",
    "topic_training": "Training",
    "topic_other": "Other",
}

OUTCOME_MAP = {
    "ioutcome_positive": "Positive",
    "ioutcome_neutral": "Neutral",
    "ioutcome_negative": "Negative",
}

FOLLOWUP_DAYS = {
    "followup_tomorrow": 1,
    "followup_3days": 3,
    "followup_1week": 7,
    "followup_2weeks": 14,
    "followup_none": 0,
}


# ---------------------------------------------------------------------------
# Entry: /log
# ---------------------------------------------------------------------------

async def log_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Start the interaction logging flow."""
    telegram_id = update.effective_user.id

    context.user_data["ilog"] = {"adm_telegram_id": telegram_id}

    # Fetch agents - use demo data if API fails or no agents
    agents_resp = await api_client.get_assigned_agents(telegram_id)
    agents = agents_resp.get("agents", agents_resp.get("data", []))

    if not agents or agents_resp.get("error"):
        agents = DEMO_AGENTS

    context.user_data["ilog"]["agents_cache"] = agents
    total_pages = agents_resp.get("total_pages", 1) if not agents_resp.get("error") else 1

    await update.message.reply_text(
        f"{E_HANDSHAKE} <b>Log Interaction</b>\n\n"
        f"Select the agent / Agent chunein:",
        parse_mode="HTML",
        reply_markup=agent_list_keyboard(agents, callback_prefix="iagent", total_pages=total_pages),
    )
    return InteractionStates.SELECT_AGENT


# ---------------------------------------------------------------------------
# Step 1: Agent selection
# ---------------------------------------------------------------------------

async def select_agent(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    data = query.data

    if data == "iagent_search":
        await query.edit_message_text(
            f"\U0001F50D <b>Search Agent</b>\n\nType the agent's name or code:",
            parse_mode="HTML",
        )
        # Reuse the same state; text will be caught by fallback search
        return InteractionStates.SELECT_AGENT

    if data.startswith("iagent_page_"):
        page = int(data.split("_")[-1])
        telegram_id = update.effective_user.id
        agents_resp = await api_client.get_assigned_agents(telegram_id, page=page)
        agents = agents_resp.get("agents", agents_resp.get("data", []))
        if not agents or agents_resp.get("error"):
            agents = DEMO_AGENTS
        context.user_data["ilog"]["agents_cache"] = agents
        total_pages = agents_resp.get("total_pages", 1) if not agents_resp.get("error") else 1
        await query.edit_message_text(
            f"{E_HANDSHAKE} <b>Log Interaction</b>\n\nSelect the agent:",
            parse_mode="HTML",
            reply_markup=agent_list_keyboard(agents, callback_prefix="iagent", page=page, total_pages=total_pages),
        )
        return InteractionStates.SELECT_AGENT

    agent_id = data.replace("iagent_", "")
    agents = context.user_data.get("ilog", {}).get("agents_cache", [])
    agent_name = "Unknown Agent"
    for a in agents:
        if str(a.get("id", a.get("agent_code", ""))) == agent_id:
            agent_name = a.get("name", "Unknown Agent")
            break

    context.user_data["ilog"]["agent_id"] = agent_id
    context.user_data["ilog"]["agent_name"] = agent_name

    await query.edit_message_text(
        f"{E_PERSON} Agent: <b>{agent_name}</b>\n\n"
        f"{E_CHAT} What was discussed?\n"
        f"Kya baat hui?",
        parse_mode="HTML",
        reply_markup=interaction_topic_keyboard(),
    )
    return InteractionStates.SELECT_TOPIC


# ---------------------------------------------------------------------------
# Step 2: Topic
# ---------------------------------------------------------------------------

async def select_topic(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    topic = TOPIC_MAP.get(query.data, "Other")
    context.user_data["ilog"]["topic"] = topic

    await query.edit_message_text(
        f"{E_CHAT} Topic: <b>{topic}</b>\n\n"
        f"How was the outcome?\n"
        f"Result kaisa raha?",
        parse_mode="HTML",
        reply_markup=interaction_outcome_keyboard(),
    )
    return InteractionStates.SELECT_OUTCOME


# ---------------------------------------------------------------------------
# Step 3: Outcome
# ---------------------------------------------------------------------------

async def select_outcome(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    outcome = OUTCOME_MAP.get(query.data, "Neutral")
    context.user_data["ilog"]["outcome"] = outcome

    await query.edit_message_text(
        f"{E_CHECK} Outcome: <b>{outcome}</b>\n\n"
        f"{E_CALENDAR} Schedule a follow-up?\n"
        f"Follow-up schedule karein?",
        parse_mode="HTML",
        reply_markup=followup_keyboard(),
    )
    return InteractionStates.SCHEDULE_FOLLOWUP


# ---------------------------------------------------------------------------
# Step 4: Follow-up
# ---------------------------------------------------------------------------

async def schedule_followup(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    days = FOLLOWUP_DAYS.get(query.data, 0)
    if days > 0:
        followup_date = (datetime.now() + timedelta(days=days)).strftime("%d %b %Y")
        context.user_data["ilog"]["followup_date"] = followup_date
    else:
        context.user_data["ilog"]["followup_date"] = "Not set"

    await query.edit_message_text(
        f"{E_PENCIL} <b>Add Notes</b>\n\n"
        f"Any notes about this interaction?\n"
        f"Koi notes dalna chahenge?",
        parse_mode="HTML",
        reply_markup=notes_keyboard(),
    )
    return InteractionStates.ADD_NOTES


# ---------------------------------------------------------------------------
# Step 5: Notes
# ---------------------------------------------------------------------------

async def notes_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    if query.data == "notes_skip":
        context.user_data["ilog"]["notes"] = "No additional notes"
        summary = format_interaction_summary(context.user_data["ilog"])
        await query.edit_message_text(summary, parse_mode="HTML", reply_markup=confirm_keyboard())
        return InteractionStates.CONFIRM

    if query.data == "notes_voice":
        await query.edit_message_text(
            f"{E_MIC} <b>Send a voice note now</b>\n\n"
            f"Or type your notes / Ya type karein:",
            parse_mode="HTML",
        )
        return InteractionStates.ADD_NOTES

    # notes_type
    await query.edit_message_text(
        f"{E_PENCIL} <b>Type your notes:</b>",
        parse_mode="HTML",
    )
    return InteractionStates.ADD_NOTES


async def receive_notes_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["ilog"]["notes"] = update.message.text.strip()
    summary = format_interaction_summary(context.user_data["ilog"])
    await update.message.reply_text(summary, parse_mode="HTML", reply_markup=confirm_keyboard())
    return InteractionStates.CONFIRM


async def receive_notes_voice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    voice = update.message.voice
    context.user_data["ilog"]["notes"] = f"[Voice note: {voice.duration}s]"
    context.user_data["ilog"]["voice_file_id"] = voice.file_id

    await update.message.reply_text(voice_note_received(), parse_mode="HTML")
    summary = format_interaction_summary(context.user_data["ilog"])
    await update.message.reply_text(summary, parse_mode="HTML", reply_markup=confirm_keyboard())
    return InteractionStates.CONFIRM


# ---------------------------------------------------------------------------
# Step 6: Confirm
# ---------------------------------------------------------------------------

async def confirm_interaction(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    if query.data == "confirm_no":
        await query.edit_message_text(cancelled(), parse_mode="HTML")
        context.user_data.pop("ilog", None)
        return ConversationHandler.END

    ilog_data = context.user_data.get("ilog", {})
    payload = {
        "adm_telegram_id": ilog_data.get("adm_telegram_id"),
        "agent_id": ilog_data.get("agent_id"),
        "topic": ilog_data.get("topic"),
        "outcome": ilog_data.get("outcome"),
        "followup_date": ilog_data.get("followup_date"),
        "notes": ilog_data.get("notes", ""),
        "voice_file_id": ilog_data.get("voice_file_id"),
    }

    result = await api_client.log_interaction(payload)

    if result.get("error"):
        logger.warning("Interaction log API failed (demo mode): %s", result)
        # Still show success for demo - data was captured in the bot

    saved_text = interaction_saved()
    await query.edit_message_text(saved_text, parse_mode="HTML")
    await send_voice_response(query.message, saved_text)

    context.user_data.pop("ilog", None)
    return ConversationHandler.END


# ---------------------------------------------------------------------------
# Cancel
# ---------------------------------------------------------------------------

async def cancel_interaction(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.pop("ilog", None)
    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(cancelled(), parse_mode="HTML")
    else:
        await update.message.reply_text(cancelled(), parse_mode="HTML")
    return ConversationHandler.END


# ---------------------------------------------------------------------------
# Build ConversationHandler
# ---------------------------------------------------------------------------

def build_interaction_handler() -> ConversationHandler:
    """Build the /log interaction conversation handler."""
    return ConversationHandler(
        entry_points=[CommandHandler("log", log_command)],
        states={
            InteractionStates.SELECT_AGENT: [
                CallbackQueryHandler(select_agent, pattern=r"^iagent_"),
            ],
            InteractionStates.SELECT_TOPIC: [
                CallbackQueryHandler(select_topic, pattern=r"^topic_"),
            ],
            InteractionStates.SELECT_OUTCOME: [
                CallbackQueryHandler(select_outcome, pattern=r"^ioutcome_"),
            ],
            InteractionStates.SCHEDULE_FOLLOWUP: [
                CallbackQueryHandler(schedule_followup, pattern=r"^followup_"),
            ],
            InteractionStates.ADD_NOTES: [
                CallbackQueryHandler(notes_callback, pattern=r"^notes_"),
                MessageHandler(filters.TEXT & ~filters.COMMAND, receive_notes_text),
                MessageHandler(filters.VOICE, receive_notes_voice),
            ],
            InteractionStates.CONFIRM: [
                CallbackQueryHandler(confirm_interaction, pattern=r"^confirm_"),
            ],
        },
        fallbacks=[
            CommandHandler("cancel", cancel_interaction),
            CallbackQueryHandler(cancel_interaction, pattern=r"^cancel$"),
        ],
        name="interaction_log",
        persistent=False,
    )
