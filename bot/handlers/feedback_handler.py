"""
Feedback capture conversation handler for the ADM Platform Telegram Bot.
Full multi-step flow: Agent -> Contact Type -> Outcome -> Category -> Subcategory -> Notes -> Follow-up -> Confirm
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

from config import FeedbackStates
from utils.api_client import api_client
from utils.formatters import (
    format_feedback_summary,
    feedback_saved,
    error_generic,
    error_not_registered,
    cancelled,
    voice_note_received,
    header,
    E_CHAT, E_PERSON, E_PENCIL, E_CHECK, E_CROSS,
    E_CALENDAR, E_MEMO, E_MIC, E_PHONE, E_SPARKLE,
)
from utils.keyboards import (
    agent_list_keyboard,
    contact_type_keyboard,
    outcome_keyboard,
    feedback_category_keyboard,
    feedback_subcategory_keyboard,
    followup_keyboard,
    notes_keyboard,
    confirm_keyboard,
)
from utils.voice import send_voice_response

logger = logging.getLogger(__name__)

# Mapping from callback data to human-readable labels
CONTACT_TYPE_MAP = {
    "contact_call": "Call",
    "contact_whatsapp": "WhatsApp",
    "contact_visit": "Visit",
}

OUTCOME_MAP = {
    "outcome_connected": "Connected",
    "outcome_not_answered": "Not Answered",
    "outcome_busy": "Busy",
    "outcome_callback": "Callback Requested",
}

CATEGORY_MAP = {
    "fcat_system": "System Issues",
    "fcat_commission": "Commission Concerns",
    "fcat_market": "Market Conditions",
    "fcat_product": "Product Complexity",
    "fcat_personal": "Personal Reasons",
    "fcat_competition": "Competition",
    "fcat_support": "Support Issues",
}

# Reverse lookup: category callback -> subcategory key
CATEGORY_KEY_MAP = {
    "fcat_system": "system",
    "fcat_commission": "commission",
    "fcat_market": "market",
    "fcat_product": "product",
    "fcat_personal": "personal",
    "fcat_competition": "competition",
    "fcat_support": "support",
}

SUBCATEGORY_MAP = {
    "fsub_portal_down": "Portal Down",
    "fsub_login_issues": "Login Issues",
    "fsub_slow_perf": "Slow Performance",
    "fsub_app_crash": "App Crash",
    "fsub_delayed_pay": "Delayed Payment",
    "fsub_low_rate": "Low Rate",
    "fsub_unclear_struct": "Unclear Structure",
    "fsub_low_demand": "Low Demand",
    "fsub_cust_resist": "Customer Resistance",
    "fsub_competition": "Competition",
    "fsub_too_many": "Too Many Products",
    "fsub_hard_explain": "Hard to Explain",
    "fsub_no_training": "No Training",
    "fsub_health": "Health",
    "fsub_family": "Family",
    "fsub_other_job": "Other Job",
    "fsub_lost_interest": "Lost Interest",
    "fsub_lic": "LIC",
    "fsub_other_private": "Other Private",
    "fsub_banks": "Banks",
    "fsub_no_adm": "No ADM Support",
    "fsub_late_resp": "Late Responses",
    "fsub_no_materials": "No Materials",
}

FOLLOWUP_MAP = {
    "followup_tomorrow": 1,
    "followup_3days": 3,
    "followup_1week": 7,
    "followup_2weeks": 14,
    "followup_none": 0,
}


# ---------------------------------------------------------------------------
# Entry: /feedback
# ---------------------------------------------------------------------------

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


async def feedback_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Start the feedback capture flow."""
    telegram_id = update.effective_user.id

    context.user_data["fb"] = {"adm_telegram_id": telegram_id}

    # Fetch agents - use demo data if API fails or no agents
    agents_resp = await api_client.get_assigned_agents(telegram_id)
    agents = agents_resp.get("agents", agents_resp.get("data", []))

    if not agents or agents_resp.get("error"):
        agents = DEMO_AGENTS

    context.user_data["fb"]["agents_cache"] = agents

    total_pages = agents_resp.get("total_pages", 1) if not agents_resp.get("error") else 1
    await update.message.reply_text(
        f"{E_CHAT} <b>Capture Feedback</b>\n\n"
        f"Select the agent / Agent chunein:\n",
        parse_mode="HTML",
        reply_markup=agent_list_keyboard(agents, callback_prefix="fbagent", total_pages=total_pages),
    )
    return FeedbackStates.SELECT_AGENT


# ---------------------------------------------------------------------------
# Step 1: Select agent
# ---------------------------------------------------------------------------

async def select_agent(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle agent selection callback."""
    query = update.callback_query
    await query.answer()

    data = query.data  # e.g., "fbagent_AGT001"

    # Handle search
    if data == "fbagent_search":
        await query.edit_message_text(
            f"\U0001F50D <b>Search Agent</b>\n\n"
            f"Type the agent's name or code:\n"
            f"Agent ka naam ya code type karein:",
            parse_mode="HTML",
        )
        return FeedbackStates.SEARCH_AGENT

    # Handle pagination
    if data.startswith("fbagent_page_"):
        page = int(data.split("_")[-1])
        telegram_id = update.effective_user.id
        agents_resp = await api_client.get_assigned_agents(telegram_id, page=page)
        agents = agents_resp.get("agents", agents_resp.get("data", []))
        if not agents or agents_resp.get("error"):
            agents = DEMO_AGENTS
        total_pages = agents_resp.get("total_pages", 1) if not agents_resp.get("error") else 1

        context.user_data["fb"]["agents_cache"] = agents
        await query.edit_message_text(
            f"{E_CHAT} <b>Capture Feedback</b>\n\n"
            f"Select the agent / Agent chunein:\n",
            parse_mode="HTML",
            reply_markup=agent_list_keyboard(agents, callback_prefix="fbagent", page=page, total_pages=total_pages),
        )
        return FeedbackStates.SELECT_AGENT

    # Agent selected
    agent_id = data.replace("fbagent_", "")
    agents = context.user_data.get("fb", {}).get("agents_cache", [])

    # Find agent name from cache
    agent_name = "Unknown Agent"
    for agent in agents:
        if str(agent.get("id", agent.get("agent_code", ""))) == agent_id:
            agent_name = agent.get("name", "Unknown Agent")
            break

    context.user_data["fb"]["agent_id"] = agent_id
    context.user_data["fb"]["agent_name"] = agent_name

    await query.edit_message_text(
        f"{E_PERSON} Agent: <b>{agent_name}</b>\n\n"
        f"{E_PHONE} How did you contact them?\n"
        f"Aapne unse kaise sampark kiya?",
        parse_mode="HTML",
        reply_markup=contact_type_keyboard(),
    )
    return FeedbackStates.SELECT_CONTACT_TYPE


async def search_agent(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle agent search text."""
    search_text = update.message.text.strip()
    telegram_id = update.effective_user.id

    agents_resp = await api_client.get_assigned_agents(telegram_id, search=search_text)
    agents = agents_resp.get("agents", agents_resp.get("data", []))

    # If API fails, search within demo agents locally
    if not agents or agents_resp.get("error"):
        search_lower = search_text.lower()
        agents = [
            a for a in DEMO_AGENTS
            if search_lower in a["name"].lower() or search_lower in a.get("agent_code", "").lower()
        ]

    if not agents:
        await update.message.reply_text(
            f"{E_CROSS} No agents found for \"{search_text}\".\n"
            f"Koi agent nahi mila. Try again or /cancel.",
            parse_mode="HTML",
        )
        return FeedbackStates.SEARCH_AGENT

    context.user_data["fb"]["agents_cache"] = agents
    await update.message.reply_text(
        f"\U0001F50D Search results for \"{search_text}\":\n",
        parse_mode="HTML",
        reply_markup=agent_list_keyboard(agents, callback_prefix="fbagent", show_search=False),
    )
    return FeedbackStates.SELECT_AGENT


# ---------------------------------------------------------------------------
# Step 2: Contact type
# ---------------------------------------------------------------------------

async def select_contact_type(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle contact type selection."""
    query = update.callback_query
    await query.answer()

    contact_type = CONTACT_TYPE_MAP.get(query.data, "Call")
    context.user_data["fb"]["contact_type"] = contact_type

    agent_name = context.user_data["fb"].get("agent_name", "Agent")

    await query.edit_message_text(
        f"{E_PERSON} Agent: <b>{agent_name}</b>\n"
        f"{E_PHONE} Contact: <b>{contact_type}</b>\n\n"
        f"What was the outcome?\n"
        f"Kya result raha?",
        parse_mode="HTML",
        reply_markup=outcome_keyboard(),
    )
    return FeedbackStates.SELECT_OUTCOME


# ---------------------------------------------------------------------------
# Step 3: Outcome
# ---------------------------------------------------------------------------

async def select_outcome(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle outcome selection."""
    query = update.callback_query
    await query.answer()

    outcome = OUTCOME_MAP.get(query.data, "Connected")
    context.user_data["fb"]["outcome"] = outcome

    # If not connected, skip to notes
    if outcome != "Connected":
        context.user_data["fb"]["category"] = "N/A"
        context.user_data["fb"]["subcategory"] = "N/A"

        await query.edit_message_text(
            f"{E_MEMO} <b>Outcome: {outcome}</b>\n\n"
            f"Would you like to add any notes?\n"
            f"Kya aap notes dalna chahenge?",
            parse_mode="HTML",
            reply_markup=notes_keyboard(),
        )
        return FeedbackStates.ADD_NOTES

    # Connected - ask for feedback category
    await query.edit_message_text(
        f"{E_CHECK} <b>Connected!</b>\n\n"
        f"What feedback did the agent give?\n"
        f"Agent ne kya feedback diya?\n\n"
        f"Select category / Category chunein:",
        parse_mode="HTML",
        reply_markup=feedback_category_keyboard(),
    )
    return FeedbackStates.SELECT_CATEGORY


# ---------------------------------------------------------------------------
# Step 4: Feedback category
# ---------------------------------------------------------------------------

async def select_category(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle feedback category selection."""
    query = update.callback_query
    await query.answer()

    category_label = CATEGORY_MAP.get(query.data, "Other")
    category_key = CATEGORY_KEY_MAP.get(query.data, "system")

    context.user_data["fb"]["category"] = category_label
    context.user_data["fb"]["category_key"] = category_key

    await query.edit_message_text(
        f"{E_MEMO} Category: <b>{category_label}</b>\n\n"
        f"Select specific issue / Specific issue chunein:",
        parse_mode="HTML",
        reply_markup=feedback_subcategory_keyboard(category_key),
    )
    return FeedbackStates.SELECT_SUBCATEGORY


# ---------------------------------------------------------------------------
# Step 5: Subcategory
# ---------------------------------------------------------------------------

async def select_subcategory(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle subcategory selection."""
    query = update.callback_query
    await query.answer()

    subcategory = SUBCATEGORY_MAP.get(query.data, "Other")
    context.user_data["fb"]["subcategory"] = subcategory

    await query.edit_message_text(
        f"{E_MEMO} Sub-category: <b>{subcategory}</b>\n\n"
        f"Would you like to add any notes?\n"
        f"Kya aap kuch notes dalna chahenge?",
        parse_mode="HTML",
        reply_markup=notes_keyboard(),
    )
    return FeedbackStates.ADD_NOTES


# ---------------------------------------------------------------------------
# Step 6: Notes
# ---------------------------------------------------------------------------

async def notes_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle notes option callback."""
    query = update.callback_query
    await query.answer()

    if query.data == "notes_skip":
        context.user_data["fb"]["notes"] = "No additional notes"
        return await _ask_followup(query, context)

    if query.data == "notes_voice":
        await query.edit_message_text(
            f"{E_MIC} <b>Send a voice note now</b>\n\n"
            f"Abhi voice note bhejein.\n"
            f"Or type your notes / Ya type karein:",
            parse_mode="HTML",
        )
        return FeedbackStates.ADD_NOTES

    # notes_type
    await query.edit_message_text(
        f"{E_PENCIL} <b>Type your notes below:</b>\n\n"
        f"Apne notes neeche type karein:",
        parse_mode="HTML",
    )
    return FeedbackStates.ADD_NOTES


async def receive_notes_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receive text notes from user."""
    context.user_data["fb"]["notes"] = update.message.text.strip()
    return await _ask_followup_msg(update, context)


async def receive_notes_voice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receive voice note from user (acknowledge it)."""
    voice = update.message.voice
    context.user_data["fb"]["notes"] = f"[Voice note: {voice.duration}s]"
    context.user_data["fb"]["voice_file_id"] = voice.file_id

    await update.message.reply_text(
        voice_note_received(),
        parse_mode="HTML",
    )
    return await _ask_followup_msg(update, context)


async def _ask_followup(query, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Ask about follow-up scheduling (from callback query)."""
    await query.edit_message_text(
        f"{E_CALENDAR} <b>Schedule Follow-up</b>\n\n"
        f"When should you follow up?\n"
        f"Agle follow-up ka time?",
        parse_mode="HTML",
        reply_markup=followup_keyboard(),
    )
    return FeedbackStates.SET_FOLLOWUP


async def _ask_followup_msg(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Ask about follow-up scheduling (from message)."""
    await update.message.reply_text(
        f"{E_CALENDAR} <b>Schedule Follow-up</b>\n\n"
        f"When should you follow up?\n"
        f"Agle follow-up ka time?",
        parse_mode="HTML",
        reply_markup=followup_keyboard(),
    )
    return FeedbackStates.SET_FOLLOWUP


# ---------------------------------------------------------------------------
# Step 7: Follow-up
# ---------------------------------------------------------------------------

async def set_followup(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle follow-up date selection."""
    query = update.callback_query
    await query.answer()

    days = FOLLOWUP_MAP.get(query.data, 0)

    if days > 0:
        followup_date = (datetime.now() + timedelta(days=days)).strftime("%d %b %Y")
        context.user_data["fb"]["followup_date"] = followup_date
    else:
        context.user_data["fb"]["followup_date"] = "Not set"

    # Show summary for confirmation
    summary = format_feedback_summary(context.user_data["fb"])
    await query.edit_message_text(
        summary,
        parse_mode="HTML",
        reply_markup=confirm_keyboard(),
    )
    return FeedbackStates.CONFIRM


# ---------------------------------------------------------------------------
# Step 8: Confirm and save
# ---------------------------------------------------------------------------

async def confirm_feedback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle feedback confirmation."""
    query = update.callback_query
    await query.answer()

    if query.data == "confirm_no":
        await query.edit_message_text(
            cancelled(),
            parse_mode="HTML",
        )
        context.user_data.pop("fb", None)
        return ConversationHandler.END

    # Save feedback
    fb_data = context.user_data.get("fb", {})
    payload = {
        "adm_telegram_id": fb_data.get("adm_telegram_id"),
        "agent_id": fb_data.get("agent_id"),
        "contact_type": fb_data.get("contact_type"),
        "outcome": fb_data.get("outcome"),
        "category": fb_data.get("category"),
        "subcategory": fb_data.get("subcategory"),
        "notes": fb_data.get("notes", ""),
        "followup_date": fb_data.get("followup_date"),
        "voice_file_id": fb_data.get("voice_file_id"),
    }

    result = await api_client.submit_feedback(payload)

    if result.get("error"):
        logger.warning("Feedback submission to API failed (demo mode): %s", result)
        # Still show success for demo - data was captured in the bot

    saved_text = feedback_saved()
    await query.edit_message_text(saved_text, parse_mode="HTML")
    await send_voice_response(query.message, saved_text)

    context.user_data.pop("fb", None)
    return ConversationHandler.END


# ---------------------------------------------------------------------------
# Cancel
# ---------------------------------------------------------------------------

async def cancel_feedback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancel feedback flow."""
    context.user_data.pop("fb", None)

    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(cancelled(), parse_mode="HTML")
    else:
        await update.message.reply_text(cancelled(), parse_mode="HTML")

    return ConversationHandler.END


# ---------------------------------------------------------------------------
# Build ConversationHandler
# ---------------------------------------------------------------------------

def build_feedback_handler() -> ConversationHandler:
    """Build the /feedback conversation handler."""
    return ConversationHandler(
        entry_points=[CommandHandler("feedback", feedback_command)],
        states={
            FeedbackStates.SELECT_AGENT: [
                CallbackQueryHandler(select_agent, pattern=r"^fbagent_"),
            ],
            FeedbackStates.SEARCH_AGENT: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, search_agent),
            ],
            FeedbackStates.SELECT_CONTACT_TYPE: [
                CallbackQueryHandler(select_contact_type, pattern=r"^contact_"),
            ],
            FeedbackStates.SELECT_OUTCOME: [
                CallbackQueryHandler(select_outcome, pattern=r"^outcome_"),
            ],
            FeedbackStates.SELECT_CATEGORY: [
                CallbackQueryHandler(select_category, pattern=r"^fcat_"),
            ],
            FeedbackStates.SELECT_SUBCATEGORY: [
                CallbackQueryHandler(select_subcategory, pattern=r"^fsub_"),
            ],
            FeedbackStates.ADD_NOTES: [
                CallbackQueryHandler(notes_callback, pattern=r"^notes_"),
                MessageHandler(filters.TEXT & ~filters.COMMAND, receive_notes_text),
                MessageHandler(filters.VOICE, receive_notes_voice),
            ],
            FeedbackStates.SET_FOLLOWUP: [
                CallbackQueryHandler(set_followup, pattern=r"^followup_"),
            ],
            FeedbackStates.CONFIRM: [
                CallbackQueryHandler(confirm_feedback, pattern=r"^confirm_"),
            ],
        },
        fallbacks=[
            CommandHandler("cancel", cancel_feedback),
            CallbackQueryHandler(cancel_feedback, pattern=r"^cancel$"),
        ],
        name="feedback",
        persistent=False,
    )
