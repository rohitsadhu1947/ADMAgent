"""
Training conversation handler for the ADM Platform Telegram Bot.
Product category -> Product selection -> AI summary -> Quiz flow.
"""

import logging
from telegram import Update
from telegram.ext import (
    CommandHandler,
    ConversationHandler,
    CallbackQueryHandler,
    ContextTypes,
)

from config import TrainingStates
from utils.api_client import api_client
from utils.formatters import (
    format_product_summary,
    format_quiz_question,
    format_quiz_result,
    error_generic,
    error_not_registered,
    cancelled,
    header,
    section_divider,
    E_BOOK, E_BRAIN, E_CHECK, E_CROSS, E_STAR,
    E_SHIELD, E_MONEY, E_CHART, E_ELDER, E_BABY,
    E_PEOPLE, E_SPARKLE, E_FIRE, E_TROPHY, E_MEDAL,
    E_THUMBSUP, E_TARGET, E_DIAMOND, E_WARNING,
    E_PIN, E_ROCKET, E_BULB, E_MUSCLE,
)
from utils.keyboards import (
    training_category_keyboard,
    training_product_keyboard,
    quiz_start_keyboard,
    quiz_answer_keyboard,
)
from utils.voice import send_voice_response

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Category labels for display
# ---------------------------------------------------------------------------
CATEGORY_MAP = {
    "tcat_term": ("Term Insurance", "term"),
    "tcat_savings": ("Savings Plans", "savings"),
    "tcat_ulip": ("ULIPs", "ulip"),
    "tcat_pension": ("Pension Plans", "pension"),
    "tcat_child": ("Child Plans", "child"),
    "tcat_group": ("Group Insurance", "group"),
}

# ---------------------------------------------------------------------------
# Demo / fallback data when API is unreachable
# ---------------------------------------------------------------------------
DEMO_PRODUCTS = {
    "term": [
        {"id": "term_smart", "name": "Smart Term Plan", "category": "Term Insurance"},
        {"id": "term_flexi", "name": "Flexi Term Plan", "category": "Term Insurance"},
        {"id": "term_plus", "name": "Term Plus Protect", "category": "Term Insurance"},
    ],
    "savings": [
        {"id": "sav_guaranteed", "name": "Guaranteed Savings Plan", "category": "Savings Plans"},
        {"id": "sav_wealth", "name": "Wealth Builder Plus", "category": "Savings Plans"},
        {"id": "sav_endow", "name": "Endowment Advantage", "category": "Savings Plans"},
    ],
    "ulip": [
        {"id": "ulip_grow", "name": "Growth Maximiser ULIP", "category": "ULIPs"},
        {"id": "ulip_balance", "name": "Balanced Fund ULIP", "category": "ULIPs"},
        {"id": "ulip_secure", "name": "Secure Growth ULIP", "category": "ULIPs"},
    ],
    "pension": [
        {"id": "pen_assured", "name": "Assured Pension Plan", "category": "Pension Plans"},
        {"id": "pen_lifetime", "name": "Lifetime Income Plan", "category": "Pension Plans"},
    ],
    "child": [
        {"id": "child_future", "name": "Bright Future Child Plan", "category": "Child Plans"},
        {"id": "child_edu", "name": "Education Advantage Plan", "category": "Child Plans"},
    ],
    "group": [
        {"id": "grp_term", "name": "Group Term Life", "category": "Group Insurance"},
        {"id": "grp_health", "name": "Group Health Shield", "category": "Group Insurance"},
    ],
}

DEMO_SUMMARIES = {
    "term_smart": {
        "name": "Smart Term Plan",
        "category": "Term Insurance",
        "key_features": [
            "Pure protection plan with affordable premiums",
            "Coverage up to Rs 1 Crore starting at Rs 595/month",
            "Option to increase cover at key life milestones",
            "Terminal illness benefit included",
        ],
        "target_audience": "Young working professionals (25-40 years) with family responsibilities, looking for high coverage at low cost.",
        "usps": [
            "Lowest premium in the term insurance category",
            "Flexible payout options - Lump sum, Monthly Income, or Both",
            "Waiver of Premium on critical illness diagnosis",
        ],
        "common_objections": [
            {
                "objection": "Term plan mein paisa wapas nahi milta (No money back in term plans)",
                "response": "Sir/Ma'am, term plan ka purpose pure protection hai. Rs 595/month mein Rs 1 Crore ka cover milta hai. Savings ke liye alag plan le sakte hain, but family ki suraksha pehle!",
            },
            {
                "objection": "I already have insurance from my company",
                "response": "Company insurance sirf job tak hai. Job change ya retirement ke baad cover khatam. Personal term plan lifetime protection deta hai at today's low rate.",
            },
            {
                "objection": "I am young and healthy, I don't need insurance now",
                "response": "Yahi sahi time hai! Young age mein premium bahut kam hota hai. 30 saal mein lene par Rs 595/month, but 40 mein yahi plan Rs 1,200+ hoga.",
            },
        ],
    },
    "term_flexi": {
        "name": "Flexi Term Plan",
        "category": "Term Insurance",
        "key_features": [
            "Flexible premium payment terms (5, 10, 15, or 20 years)",
            "Coverage continues even after premium payment period ends",
            "Accidental death benefit rider available",
            "Tax benefits under Section 80C and 10(10D)",
        ],
        "target_audience": "Self-employed professionals and business owners (30-50 years) who prefer flexible payment schedules.",
        "usps": [
            "Pay for limited years, stay covered for life",
            "Premium holiday option during financial stress",
            "Joint life cover available for couples",
        ],
        "common_objections": [
            {
                "objection": "Premium zyada hai regular term plan se (Premium is higher than regular term)",
                "response": "Haan, but aap sirf 10-15 saal pay karte hain, cover lifetime milta hai. Total cost calculate karein toh almost same hai, plus peace of mind!",
            },
        ],
    },
}

DEMO_QUIZZES = {
    "term_smart": {
        "questions": [
            {
                "question": "Smart Term Plan mein minimum coverage kitni hai?",
                "options": ["Rs 25 Lakh", "Rs 50 Lakh", "Rs 1 Crore", "Rs 10 Lakh"],
                "correct": 1,
            },
            {
                "question": "Smart Term Plan ka premium Rs 1 Crore cover ke liye kitna hai per month?",
                "options": ["Rs 995", "Rs 595", "Rs 1,295", "Rs 395"],
                "correct": 1,
            },
            {
                "question": "Term plan mein kya milta hai agar policyholder survive kare?",
                "options": ["Full premium refund", "Maturity benefit", "Nothing - it's pure protection", "Half premium refund"],
                "correct": 2,
            },
        ],
    },
}

# Default quiz for products without specific quiz data
DEFAULT_QUIZ = {
    "questions": [
        {
            "question": "Life insurance ka primary purpose kya hai?",
            "options": ["Wealth creation", "Family protection", "Tax saving", "Investment returns"],
            "correct": 1,
        },
        {
            "question": "Insurance claim ke liye kaunsa document sabse zaroori hai?",
            "options": ["PAN Card", "Policy document & Death certificate", "Aadhar Card", "Bank statement"],
            "correct": 1,
        },
        {
            "question": "Free-look period kitne din ka hota hai?",
            "options": ["7 days", "15 days", "30 days", "45 days"],
            "correct": 1,
        },
    ],
}


# ---------------------------------------------------------------------------
# Entry: /train
# ---------------------------------------------------------------------------

async def train_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Start the training flow - show product categories."""
    telegram_id = update.effective_user.id

    profile = await api_client.get_adm_profile(telegram_id)
    if not profile or profile.get("error"):
        # Allow training even without registration (demo mode)
        pass

    train_intro = (
        f"{E_BOOK} <b>Product Training / Praduct Training</b>\n\n"
        f"{E_STAR} Select a product category to learn:\n"
        f"Ek category chunein seekhne ke liye:\n\n"
        f"{E_SPARKLE} <i>Learn products, ace the quiz, and become a selling expert!</i>"
    )
    sent_msg = await update.message.reply_text(
        train_intro,
        parse_mode="HTML",
        reply_markup=training_category_keyboard(),
    )
    await send_voice_response(sent_msg, train_intro)
    return TrainingStates.SELECT_CATEGORY


# ---------------------------------------------------------------------------
# Step 1: Category selected -> show products
# ---------------------------------------------------------------------------

async def select_category(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle category selection - show products in that category."""
    query = update.callback_query
    await query.answer()

    data = query.data

    # Handle back to categories
    if data == "tcat_back":
        await query.edit_message_text(
            f"{E_BOOK} <b>Product Training / Praduct Training</b>\n\n"
            f"{E_STAR} Select a product category to learn:\n"
            f"Ek category chunein seekhne ke liye:",
            parse_mode="HTML",
            reply_markup=training_category_keyboard(),
        )
        return TrainingStates.SELECT_CATEGORY

    if data not in CATEGORY_MAP:
        await query.edit_message_text(error_generic(), parse_mode="HTML")
        return ConversationHandler.END

    cat_label, cat_key = CATEGORY_MAP[data]
    context.user_data["train"] = {"category": cat_key, "category_label": cat_label}

    # Try API first, fall back to demo data
    products_resp = await api_client.get_training_products(cat_key)
    products = products_resp.get("products", products_resp.get("data", []))

    if not products or products_resp.get("error"):
        products = DEMO_PRODUCTS.get(cat_key, [])

    if not products:
        await query.edit_message_text(
            f"{E_WARNING} No products found in <b>{cat_label}</b>.\n"
            f"Is category mein abhi koi product nahi hai.\n\n"
            f"Try another category with /train",
            parse_mode="HTML",
        )
        return ConversationHandler.END

    context.user_data["train"]["products_cache"] = products

    # Category emoji mapping
    cat_emojis = {
        "term": E_SHIELD, "savings": E_MONEY, "ulip": E_CHART,
        "pension": E_ELDER, "child": E_BABY, "group": E_PEOPLE,
    }
    cat_emoji = cat_emojis.get(cat_key, E_BOOK)

    await query.edit_message_text(
        f"{cat_emoji} <b>{cat_label}</b>\n\n"
        f"{E_STAR} Select a product to learn about:\n"
        f"Product chunein details ke liye:\n\n"
        f"<i>Products: {len(products)}</i>",
        parse_mode="HTML",
        reply_markup=training_product_keyboard(products, cat_key),
    )
    return TrainingStates.SELECT_PRODUCT


# ---------------------------------------------------------------------------
# Step 2: Product selected -> show AI summary
# ---------------------------------------------------------------------------

async def select_product(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle product selection - show AI-generated summary."""
    query = update.callback_query
    await query.answer()

    data = query.data

    # Handle back to categories
    if data == "tcat_back":
        await query.edit_message_text(
            f"{E_BOOK} <b>Product Training</b>\n\n"
            f"{E_STAR} Select a product category:",
            parse_mode="HTML",
            reply_markup=training_category_keyboard(),
        )
        return TrainingStates.SELECT_CATEGORY

    product_id = data.replace("tprod_", "")
    products = context.user_data.get("train", {}).get("products_cache", [])

    # Find product name
    product_name = "Unknown Product"
    product_category = context.user_data.get("train", {}).get("category_label", "")
    for prod in products:
        if str(prod.get("id", "")) == product_id:
            product_name = prod.get("name", "Unknown Product")
            product_category = prod.get("category", product_category)
            break

    context.user_data["train"]["product_id"] = product_id
    context.user_data["train"]["product_name"] = product_name

    # Show loading message
    await query.edit_message_text(
        f"{E_BRAIN} <b>Loading product details...</b>\n\n"
        f"<i>{product_name} ki jaankari load ho rahi hai...</i>",
        parse_mode="HTML",
    )

    # Try API first, fall back to demo data
    summary_resp = await api_client.get_product_summary(product_id)
    summary_data = summary_resp if not summary_resp.get("error") else None

    if not summary_data or summary_resp.get("error"):
        summary_data = DEMO_SUMMARIES.get(product_id)

    if not summary_data:
        # Generate a generic summary for products without specific demo data
        summary_data = {
            "name": product_name,
            "category": product_category,
            "key_features": [
                "Comprehensive coverage for your needs",
                "Flexible premium payment options",
                "Tax benefits under Section 80C",
                "Easy claim settlement process",
            ],
            "target_audience": f"Customers looking for reliable {product_category.lower()} solutions with good returns and security.",
            "usps": [
                "Competitive premiums in the market",
                "Strong brand trust of Axis Max Life",
                "Digital-first experience with easy servicing",
            ],
            "common_objections": [
                {
                    "objection": "Premium bahut zyada hai (Premium is too high)",
                    "response": "Sir/Ma'am, agar hum daily cost dekhein toh yeh ek cup chai se bhi kam hai. Aur aapke family ki suraksha ka koi mol nahi!",
                },
                {
                    "objection": "I need to think about it / Sochna padega",
                    "response": "Bilkul sochiye, but yaad rakhiye - age badhne ke saath premium badhta hai. Aaj ka rate lock kar lein, policy baad mein bhi cancel kar sakte hain free-look period mein.",
                },
            ],
        }

    formatted = format_product_summary(summary_data)

    await query.edit_message_text(
        formatted,
        parse_mode="HTML",
        reply_markup=quiz_start_keyboard(),
    )
    # Send voice for product summary (key learning content)
    await send_voice_response(query.message, formatted)
    return TrainingStates.VIEW_SUMMARY


# ---------------------------------------------------------------------------
# Step 3: Quiz start
# ---------------------------------------------------------------------------

async def view_summary_action(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle actions from product summary view (quiz start or back)."""
    query = update.callback_query
    await query.answer()

    data = query.data

    if data == "quiz_back":
        # Go back to product list
        train_data = context.user_data.get("train", {})
        cat_key = train_data.get("category", "term")
        cat_label = train_data.get("category_label", "Term Insurance")
        products = train_data.get("products_cache", [])

        if products:
            await query.edit_message_text(
                f"{E_BOOK} <b>{cat_label}</b>\n\n"
                f"{E_STAR} Select a product to learn about:",
                parse_mode="HTML",
                reply_markup=training_product_keyboard(products, cat_key),
            )
            return TrainingStates.SELECT_PRODUCT
        else:
            await query.edit_message_text(
                f"{E_BOOK} <b>Product Training</b>\n\n"
                f"{E_STAR} Select a product category:",
                parse_mode="HTML",
                reply_markup=training_category_keyboard(),
            )
            return TrainingStates.SELECT_CATEGORY

    if data == "quiz_start":
        return await _start_quiz(query, context)

    return TrainingStates.VIEW_SUMMARY


async def _start_quiz(query, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Initialize and show the first quiz question."""
    train_data = context.user_data.get("train", {})
    product_id = train_data.get("product_id", "")
    product_name = train_data.get("product_name", "Product")

    # Try API first, fall back to demo data
    quiz_resp = await api_client.get_quiz(product_id)
    quiz_data = quiz_resp if not quiz_resp.get("error") else None

    if not quiz_data or quiz_resp.get("error"):
        quiz_data = DEMO_QUIZZES.get(product_id, DEFAULT_QUIZ)

    questions = quiz_data.get("questions", [])

    if not questions:
        await query.edit_message_text(
            f"{E_WARNING} No quiz available for <b>{product_name}</b>.\n"
            f"Is product ke liye abhi quiz nahi hai.\n\n"
            f"Use /train to try another product.",
            parse_mode="HTML",
        )
        return ConversationHandler.END

    context.user_data["train"]["quiz_questions"] = questions
    context.user_data["train"]["quiz_current"] = 0
    context.user_data["train"]["quiz_score"] = 0

    # Show first question
    q = questions[0]
    total = len(questions)

    await query.edit_message_text(
        f"{E_BRAIN} <b>Quiz Time! / Quiz ka Samay!</b>\n"
        f"<i>Product: {product_name}</i>\n\n"
        f"{section_divider()}"
        f"{format_quiz_question(q, 1, total)}",
        parse_mode="HTML",
        reply_markup=quiz_answer_keyboard(q.get("options", [])),
    )
    return TrainingStates.ANSWER_QUIZ


# ---------------------------------------------------------------------------
# Step 4: Answer quiz questions
# ---------------------------------------------------------------------------

async def answer_quiz(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle quiz answer selection."""
    query = update.callback_query
    await query.answer()

    data = query.data  # e.g., "quiz_ans_0", "quiz_ans_1", etc.

    if not data.startswith("quiz_ans_"):
        return TrainingStates.ANSWER_QUIZ

    selected_idx = int(data.replace("quiz_ans_", ""))

    train_data = context.user_data.get("train", {})
    questions = train_data.get("quiz_questions", [])
    current = train_data.get("quiz_current", 0)
    score = train_data.get("quiz_score", 0)
    product_name = train_data.get("product_name", "Product")

    if current >= len(questions):
        return await _show_quiz_result(query, context)

    q = questions[current]
    correct_idx = q.get("correct", 0)
    options = q.get("options", [])

    # Check answer
    is_correct = selected_idx == correct_idx
    if is_correct:
        score += 1
        context.user_data["train"]["quiz_score"] = score

    # Build answer feedback
    selected_text = options[selected_idx] if selected_idx < len(options) else "?"
    correct_text = options[correct_idx] if correct_idx < len(options) else "?"

    if is_correct:
        feedback = f"{E_CHECK} <b>Correct! / Sahi Jawab!</b> {E_SPARKLE}\n"
    else:
        feedback = (
            f"{E_CROSS} <b>Incorrect / Galat</b>\n"
            f"Your answer: {selected_text}\n"
            f"{E_CHECK} Correct answer: <b>{correct_text}</b>\n"
        )

    # Move to next question or show result
    next_idx = current + 1
    context.user_data["train"]["quiz_current"] = next_idx

    if next_idx >= len(questions):
        # Show final result
        total = len(questions)
        result_text = format_quiz_result(score, total)

        from utils.keyboards import training_category_keyboard as tck

        # Build result keyboard
        from telegram import InlineKeyboardButton, InlineKeyboardMarkup
        result_keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(f"{E_BRAIN} Retake Quiz / Dobara Quiz", callback_data="quiz_retake")],
            [InlineKeyboardButton(f"{E_BOOK} More Products / Aur Products", callback_data="tcat_back")],
            [InlineKeyboardButton(f"{E_CHECK} Done / Ho Gaya", callback_data="cancel")],
        ])

        full_result = f"{feedback}\n{section_divider()}{result_text}"
        await query.edit_message_text(
            full_result,
            parse_mode="HTML",
            reply_markup=result_keyboard,
        )
        await send_voice_response(query.message, full_result)
        return TrainingStates.QUIZ_RESULT
    else:
        # Show next question
        next_q = questions[next_idx]
        total = len(questions)

        await query.edit_message_text(
            f"{feedback}\n"
            f"Score so far: <b>{score}/{next_idx}</b>\n"
            f"{section_divider()}"
            f"{format_quiz_question(next_q, next_idx + 1, total)}",
            parse_mode="HTML",
            reply_markup=quiz_answer_keyboard(next_q.get("options", [])),
        )
        return TrainingStates.ANSWER_QUIZ


# ---------------------------------------------------------------------------
# Step 5: Quiz result actions
# ---------------------------------------------------------------------------

async def quiz_result_action(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle actions from quiz result screen."""
    query = update.callback_query
    await query.answer()

    data = query.data

    if data == "quiz_retake":
        # Reset quiz and restart
        context.user_data["train"]["quiz_current"] = 0
        context.user_data["train"]["quiz_score"] = 0
        return await _start_quiz(query, context)

    if data == "tcat_back":
        # Back to category selection
        await query.edit_message_text(
            f"{E_BOOK} <b>Product Training</b>\n\n"
            f"{E_STAR} Select a product category:",
            parse_mode="HTML",
            reply_markup=training_category_keyboard(),
        )
        return TrainingStates.SELECT_CATEGORY

    # Cancel / Done
    complete_text = (
        f"{E_CHECK} <b>Training session complete!</b>\n\n"
        f"Bahut achha! Training session khatam hua. {E_SPARKLE}\n"
        f"Use /train anytime to learn more!\n\n"
        f"{E_MUSCLE} Keep learning, keep growing! {E_FIRE}"
    )
    await query.edit_message_text(
        complete_text,
        parse_mode="HTML",
    )
    await send_voice_response(query.message, complete_text)

    # Submit score to backend
    train_data = context.user_data.get("train", {})
    score = train_data.get("quiz_score", 0)
    product_id = train_data.get("product_id", "")
    telegram_id = update.effective_user.id

    try:
        await api_client.submit_quiz_result({
            "adm_telegram_id": telegram_id,
            "product_id": product_id,
            "score": score,
            "total": len(train_data.get("quiz_questions", [])),
        })
    except Exception:
        pass  # Non-critical, don't break the flow

    context.user_data.pop("train", None)
    return ConversationHandler.END


# ---------------------------------------------------------------------------
# Cancel
# ---------------------------------------------------------------------------

async def cancel_training(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancel training flow."""
    context.user_data.pop("train", None)

    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(cancelled(), parse_mode="HTML")
    else:
        await update.message.reply_text(cancelled(), parse_mode="HTML")

    return ConversationHandler.END


# ---------------------------------------------------------------------------
# Build ConversationHandler
# ---------------------------------------------------------------------------

def build_training_handler() -> ConversationHandler:
    """Build the /train conversation handler."""
    return ConversationHandler(
        entry_points=[CommandHandler("train", train_command)],
        states={
            TrainingStates.SELECT_CATEGORY: [
                CallbackQueryHandler(select_category, pattern=r"^tcat_"),
            ],
            TrainingStates.SELECT_PRODUCT: [
                CallbackQueryHandler(select_product, pattern=r"^tprod_"),
                CallbackQueryHandler(select_category, pattern=r"^tcat_"),
            ],
            TrainingStates.VIEW_SUMMARY: [
                CallbackQueryHandler(view_summary_action, pattern=r"^quiz_"),
            ],
            TrainingStates.ANSWER_QUIZ: [
                CallbackQueryHandler(answer_quiz, pattern=r"^quiz_ans_"),
            ],
            TrainingStates.QUIZ_RESULT: [
                CallbackQueryHandler(quiz_result_action, pattern=r"^(quiz_retake|tcat_back|cancel)$"),
            ],
        },
        fallbacks=[
            CommandHandler("cancel", cancel_training),
            CallbackQueryHandler(cancel_training, pattern=r"^cancel$"),
        ],
        name="training",
        persistent=False,
    )
