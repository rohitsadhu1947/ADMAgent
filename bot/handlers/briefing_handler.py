"""
Morning briefing handler for the ADM Platform Telegram Bot.
Fetches and displays the morning briefing with priority agents, follow-ups,
new assignments, and performance stats.
"""

import logging
from datetime import datetime

from telegram import Update
from telegram.ext import (
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
)

from utils.api_client import api_client
from utils.formatters import (
    format_morning_briefing,
    error_not_registered,
    error_generic,
    E_SUNRISE, E_FIRE, E_SPARKLE, E_CHECK, E_WARNING,
    E_PHONE, E_PERSON, E_PIN, E_RED_CIRCLE, E_YELLOW_CIRCLE,
    E_GREEN_CIRCLE, E_BELL, E_CHART, E_MEMO, E_ROCKET,
    E_BULB, E_MUSCLE, E_CALENDAR, E_BOOK, E_BRAIN,
    E_STAR, E_SHIELD, E_CLOCK, E_PEOPLE,
    E_MONEY, E_HEART, E_CLAP, E_TARGET,
    greeting, get_daily_quote, header, section_divider,
)
from utils.keyboards import briefing_action_keyboard
from utils.voice import send_voice_response

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Demo / fallback briefing data
# ---------------------------------------------------------------------------
TRAINING_TIPS = [
    f"{E_SHIELD} Smart Term Plan starts at just Rs 595/month for Rs 1 Crore cover - sabse affordable protection!",
    f"{E_BULB} Customer ko pehle unki need samjhao, phir product pitch karo. Need-based selling works best!",
    f"{E_STAR} ULIP mein 5 saal ka lock-in hota hai - customer ko yeh clearly batayein upfront.",
    f"{E_MONEY} Commission structure samajhna zaroori hai - renewal commission long-term income deti hai!",
    f"{E_FIRE} Pension plans ka best selling point: Tax-free income after retirement under Section 10(10A).",
    f"{E_BRAIN} Objection handling tip: 'Sochna padega' ka matlab hai customer ko aur information chahiye. Push mat karo, educate karo!",
    f"{E_HEART} Child plan pitch karte waqt, bachche ki photo ya naam puchho - emotional connect banao!",
    f"{E_TARGET} Dormant agents ko re-activate karna hai? Pehle unki problem suno, phir solution do.",
    f"{E_ROCKET} Digital tools use karo! Online proposal submission se customer experience 10x better hota hai.",
    f"{E_CLAP} Har din 10 calls ka target rakho - consistency is the key to success!",
]


def _get_demo_briefing(name: str) -> dict:
    """Generate demo briefing data when API is unreachable."""
    day_of_year = datetime.now().timetuple().tm_yday
    tip = TRAINING_TIPS[day_of_year % len(TRAINING_TIPS)]

    return {
        "adm_name": name,
        "priority_agents": [
            {
                "name": "Suresh Patel",
                "agent_code": "AGT001",
                "reason": f"{E_RED_CIRCLE} Dormant 45 days - Last said: Portal login issues",
                "status": "inactive",
            },
            {
                "name": "Priya Sharma",
                "agent_code": "AGT002",
                "reason": f"{E_YELLOW_CIRCLE} At Risk - Commission query pending since 5 days",
                "status": "at_risk",
            },
            {
                "name": "Amit Kumar",
                "agent_code": "AGT003",
                "reason": f"{E_YELLOW_CIRCLE} Follow-up due today - Interested in term plan training",
                "status": "at_risk",
            },
            {
                "name": "Neeta Desai",
                "agent_code": "AGT004",
                "reason": f"{E_GREEN_CIRCLE} Active - Submitted 2 proposals, needs support",
                "status": "active",
            },
            {
                "name": "Rajesh Verma",
                "agent_code": "AGT005",
                "reason": f"{E_RED_CIRCLE} Inactive 30 days - Was top performer last quarter",
                "status": "inactive",
            },
        ],
        "overdue_followups": [
            {"agent_name": "Suresh Patel", "due_date": "12 Feb 2026"},
            {"agent_name": "Kiran Joshi", "due_date": "14 Feb 2026"},
            {"agent_name": "Mohan Das", "due_date": "15 Feb 2026"},
        ],
        "new_assignments": [
            {"name": "Ananya Singh", "agent_code": "AGT050"},
            {"name": "Vikram Reddy", "agent_code": "AGT051"},
        ],
        "training_tip": tip,
        "yesterday_stats": {
            "calls": 8,
            "feedbacks": 3,
            "activations": 1,
        },
    }


# ---------------------------------------------------------------------------
# /briefing command
# ---------------------------------------------------------------------------

async def briefing_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /briefing command - show morning briefing."""
    telegram_id = update.effective_user.id
    user = update.effective_user

    # Get profile
    profile = await api_client.get_adm_profile(telegram_id)

    if profile and not profile.get("error"):
        name = profile.get("name", user.first_name or "ADM")
    else:
        name = user.first_name or "ADM"

    # Show loading message
    loading_msg = await update.message.reply_text(
        f"{E_SUNRISE} <b>Loading your briefing...</b>\n\n"
        f"<i>Aapki briefing tayyar ho rahi hai...</i>",
        parse_mode="HTML",
    )

    # Fetch briefing data from API
    briefing_resp = await api_client.get_morning_briefing(telegram_id)

    if briefing_resp and not briefing_resp.get("error"):
        briefing_data = briefing_resp
        # Ensure adm_name is set
        if not briefing_data.get("adm_name"):
            briefing_data["adm_name"] = name
    else:
        # Use demo data
        briefing_data = _get_demo_briefing(name)

    # Format the briefing
    briefing_text = format_morning_briefing(briefing_data)

    # Delete loading message and send briefing
    try:
        await loading_msg.delete()
    except Exception:
        pass

    sent_msg = await update.message.reply_text(
        briefing_text,
        parse_mode="HTML",
        reply_markup=briefing_action_keyboard(),
    )
    await send_voice_response(sent_msg, briefing_text)


# ---------------------------------------------------------------------------
# Briefing action callbacks (handled globally in telegram_bot.py)
# ---------------------------------------------------------------------------

async def briefing_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle briefing action button presses."""
    query = update.callback_query
    await query.answer()

    data = query.data

    if data == "brief_call":
        telegram_id = update.effective_user.id

        # Get priority agents
        priority_resp = await api_client.get_priority_agents(telegram_id)
        agents = priority_resp.get("agents", priority_resp.get("data", []))

        if not agents or priority_resp.get("error"):
            # Demo data
            agents = [
                {"name": "Suresh Patel", "phone": "+91-98765-43210", "reason": "Dormant 45 days"},
                {"name": "Priya Sharma", "phone": "+91-98765-43211", "reason": "Commission query pending"},
                {"name": "Amit Kumar", "phone": "+91-98765-43212", "reason": "Follow-up due today"},
            ]

        lines = [
            f"{E_PHONE} <b>Priority Agents to Call</b>\n",
            f"<i>Sabse pehle in agents ko call karein:</i>\n",
        ]

        for i, agent in enumerate(agents[:5], 1):
            agent_name = agent.get("name", "Unknown")
            phone = agent.get("phone", "N/A")
            reason = agent.get("reason", "Follow-up due")

            lines.append(f"\n{i}. {E_PERSON} <b>{agent_name}</b>")
            lines.append(f"   {E_PHONE} {phone}")
            lines.append(f"   {E_PIN} <i>{reason}</i>")

        lines.append(f"\n\n{E_MUSCLE} <b>Start calling! Har call se aap closer hain success ke!</b>")

        call_text = "\n".join(lines)
        await query.edit_message_text(
            call_text,
            parse_mode="HTML",
        )
        await send_voice_response(query.message, call_text)
        return

    # For cmd_diary and cmd_train, we inform the user to use the command
    if data == "cmd_diary":
        await query.edit_message_text(
            f"{E_CALENDAR} Use /diary command to open your schedule.\n"
            f"Diary kholne ke liye /diary type karein.",
            parse_mode="HTML",
        )
        return

    if data == "cmd_train":
        await query.edit_message_text(
            f"{E_BOOK} Use /train command to start product training.\n"
            f"Training shuru karne ke liye /train type karein.",
            parse_mode="HTML",
        )
        return


