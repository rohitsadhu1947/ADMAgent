"""
Comprehensive seed data for the ADM Platform.
Creates realistic Indian insurance industry data for demo purposes.
"""

import random
import logging
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from models import Agent, ADM, Interaction, Feedback, TrainingProgress, DiaryEntry, DailyBriefing, User, Product

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Dormancy taxonomy
# ---------------------------------------------------------------------------
DORMANCY_TAXONOMY = {
    "system_issues": [
        "Portal Down", "Login Issues", "Slow Performance", "App Crash",
        "Document Upload Failure", "OTP Not Received",
    ],
    "commission_concerns": [
        "Delayed Payment", "Low Rate", "Unclear Structure",
        "Deductions Not Explained", "Renewal Commission Dispute",
    ],
    "market_conditions": [
        "Low Demand", "Customer Resistance", "Competition",
        "Economic Slowdown", "Post-COVID Hesitancy",
    ],
    "product_complexity": [
        "Too Many Products", "Hard to Explain", "No Training",
        "Frequent Product Changes", "Illustration Tool Issues",
    ],
    "personal_reasons": [
        "Health", "Family", "Other Job", "Lost Interest",
        "Relocation", "Higher Studies",
    ],
    "competition": [
        "LIC", "Other Private", "Banks",
        "Digital-Only Insurers", "Direct Channels",
    ],
    "support_issues": [
        "No ADM Support", "Late Responses", "No Materials",
        "Claim Settlement Delays", "Branch Not Cooperative",
    ],
}

# ---------------------------------------------------------------------------
# Indian names and locations
# ---------------------------------------------------------------------------
MALE_FIRST_NAMES = [
    "Rajesh", "Amit", "Sunil", "Vikram", "Sanjay", "Manoj", "Arun", "Karthik",
    "Deepak", "Ravi", "Prakash", "Sandeep", "Vinod", "Rahul", "Ajay",
    "Ashok", "Nitin", "Pradeep", "Mukesh", "Ramesh", "Suresh", "Vivek",
    "Anand", "Ganesh", "Harish",
]

FEMALE_FIRST_NAMES = [
    "Priya", "Anjali", "Sunita", "Kavita", "Neha", "Pooja", "Rekha",
    "Meena", "Lakshmi", "Divya", "Sneha", "Swati", "Nisha", "Rani",
    "Geeta", "Anita", "Shobha", "Padma", "Jyoti", "Sarita",
    "Asha", "Usha", "Kamala", "Radha", "Shalini",
]

LAST_NAMES = [
    "Sharma", "Verma", "Singh", "Patel", "Gupta", "Kumar", "Reddy",
    "Nair", "Iyer", "Mukherjee", "Chatterjee", "Das", "Mishra",
    "Joshi", "Rao", "Pillai", "Menon", "Deshmukh", "Patil", "Kulkarni",
    "Banerjee", "Ghosh", "Bose", "Mehta", "Shah", "Thakur", "Yadav",
    "Pandey", "Dubey", "Tiwari",
]

CITIES = {
    "Mumbai": {"state": "Maharashtra", "language": "Marathi"},
    "Delhi": {"state": "Delhi", "language": "Hindi"},
    "Bangalore": {"state": "Karnataka", "language": "Kannada"},
    "Chennai": {"state": "Tamil Nadu", "language": "Tamil"},
    "Kolkata": {"state": "West Bengal", "language": "Bengali"},
    "Hyderabad": {"state": "Telangana", "language": "Telugu"},
    "Pune": {"state": "Maharashtra", "language": "Marathi"},
    "Jaipur": {"state": "Rajasthan", "language": "Hindi"},
    "Lucknow": {"state": "Uttar Pradesh", "language": "Hindi"},
    "Ahmedabad": {"state": "Gujarat", "language": "Hindi"},
    "Noida": {"state": "Uttar Pradesh", "language": "Hindi"},
    "Gurgaon": {"state": "Haryana", "language": "Hindi"},
    "Thane": {"state": "Maharashtra", "language": "Marathi"},
    "Nagpur": {"state": "Maharashtra", "language": "Hindi"},
    "Kochi": {"state": "Kerala", "language": "English"},
}

ADM_PROFILES = [
    {
        "name": "Rajiv Malhotra",
        "phone": "98XXX-XX101",
        "email": "rajiv.malhotra@axismaxlife.com",
        "region": "West - Mumbai",
        "language": "Hindi,English,Marathi",
        "max_capacity": 50,
        "performance_score": 82.5,
    },
    {
        "name": "Priyanka Kapoor",
        "phone": "98XXX-XX102",
        "email": "priyanka.kapoor@axismaxlife.com",
        "region": "North - Delhi",
        "language": "Hindi,English",
        "max_capacity": 45,
        "performance_score": 78.0,
    },
    {
        "name": "Suresh Venkataraman",
        "phone": "98XXX-XX103",
        "email": "suresh.v@axismaxlife.com",
        "region": "South - Bangalore",
        "language": "Kannada,English,Hindi,Tamil",
        "max_capacity": 40,
        "performance_score": 91.0,
    },
    {
        "name": "Meenakshi Sundaram",
        "phone": "98XXX-XX104",
        "email": "meenakshi.s@axismaxlife.com",
        "region": "South - Chennai",
        "language": "Tamil,English,Telugu",
        "max_capacity": 35,
        "performance_score": 74.5,
    },
    {
        "name": "Amitava Roy",
        "phone": "98XXX-XX105",
        "email": "amitava.roy@axismaxlife.com",
        "region": "East - Kolkata",
        "language": "Bengali,Hindi,English",
        "max_capacity": 40,
        "performance_score": 86.0,
    },
]

SPECIALIZATIONS = [
    "term,savings", "ulip,pension", "term,child", "savings,pension",
    "term,ulip", "child,savings", "group,term", "health,term",
    "pension,savings", "ulip,child", "term", "savings", "ulip",
]

INTERACTION_NOTES_TEMPLATES = {
    "connected": [
        "Agent was receptive to the call. Discussed current market conditions and new product launches.",
        "Had a productive conversation. Agent mentioned interest in attending next training session.",
        "Agent expressed willingness to restart but needs help with portal access.",
        "Good conversation. Agent interested in Smart Secure Plus for upcoming renewals.",
        "Agent was positive. Agreed to attend the upcoming product workshop.",
        "Discussed commission structure in detail. Agent seems motivated to restart.",
        "Agent shared that they have 3-4 prospects ready. Need support with proposal generation.",
        "Agent appreciated the call. Wants to focus on term insurance to start.",
    ],
    "not_answered": [
        "Called twice, no response. Will try again tomorrow.",
        "Phone was switched off. Sent WhatsApp message as follow-up.",
        "No answer after 3 rings. Need to try at a different time.",
        "Unreachable. Will try evening slot.",
    ],
    "busy": [
        "Agent said they are busy with another commitment. Requested callback after 3 PM.",
        "Agent was at another job. Brief chat, agreed to a detailed call on weekend.",
        "Agent in meeting. Will call back tomorrow morning.",
    ],
    "callback_requested": [
        "Agent requested callback in the evening after 6 PM.",
        "Agent busy with family commitment. Wants to discuss next week.",
        "Agent asked to call back after the festival season.",
        "Agent requested detailed product comparison before next call.",
    ],
    "follow_up_scheduled": [
        "Agent interested but wants time to think. Follow-up scheduled for next week.",
        "Need to send product brochures first. Follow-up after agent reviews them.",
        "Agent moving cities. Follow-up after settlement in new location.",
    ],
    "declined": [
        "Agent not interested in continuing with insurance. Has taken up full-time employment.",
        "Agent has moved to a competitor company. No scope for re-engagement.",
        "Agent firmly declined. Personal reasons cited - family health issues.",
    ],
}

FEEDBACK_TEMPLATES = [
    {
        "category": "system_issues",
        "subcategory": "Portal Down",
        "raw_text": "The agent portal has been down for 2 days. I cannot log in to submit new proposals. This is very frustrating.",
        "sentiment": "negative",
        "priority": "critical",
        "ai_summary": "Agent unable to access portal for 2 days, blocking proposal submissions. Requires immediate IT escalation.",
    },
    {
        "category": "system_issues",
        "subcategory": "Login Issues",
        "raw_text": "My password reset is not working. OTP is not coming to my registered mobile number.",
        "sentiment": "negative",
        "priority": "high",
        "ai_summary": "Agent facing OTP delivery issues for password reset. Mobile number verification needed.",
    },
    {
        "category": "commission_concerns",
        "subcategory": "Delayed Payment",
        "raw_text": "My commissions for the last 3 months are still pending. I have sold 8 policies but received payment for only 2.",
        "sentiment": "negative",
        "priority": "high",
        "ai_summary": "Agent has outstanding commission payments for 6 out of 8 policies sold in the last 3 months.",
    },
    {
        "category": "commission_concerns",
        "subcategory": "Low Rate",
        "raw_text": "The commission rates for ULIP products are too low compared to LIC. I can earn more selling traditional plans from other companies.",
        "sentiment": "negative",
        "priority": "medium",
        "ai_summary": "Agent finds ULIP commission rates uncompetitive compared to LIC and other traditional plan offerings.",
    },
    {
        "category": "market_conditions",
        "subcategory": "Low Demand",
        "raw_text": "Customers in my area are not interested in insurance. They prefer to invest in gold and fixed deposits.",
        "sentiment": "negative",
        "priority": "medium",
        "ai_summary": "Low insurance penetration in agent's area. Customers prefer traditional investment options like gold and FDs.",
    },
    {
        "category": "market_conditions",
        "subcategory": "Customer Resistance",
        "raw_text": "Post-COVID, customers are very cautious about spending. They say they cannot afford premiums right now.",
        "sentiment": "negative",
        "priority": "medium",
        "ai_summary": "Customer affordability concerns post-COVID affecting policy sales. Need micro-insurance or flexible premium options.",
    },
    {
        "category": "product_complexity",
        "subcategory": "Too Many Products",
        "raw_text": "There are too many products and I get confused about which one to recommend. Need simpler product matrix.",
        "sentiment": "negative",
        "priority": "medium",
        "ai_summary": "Agent overwhelmed by product portfolio size. Needs simplified product recommendation framework.",
    },
    {
        "category": "product_complexity",
        "subcategory": "Hard to Explain",
        "raw_text": "ULIP products are very difficult to explain to customers. The NAV concept and fund options confuse them.",
        "sentiment": "negative",
        "priority": "medium",
        "ai_summary": "Agent struggles to explain ULIP concepts (NAV, fund options) to customers. Needs simplified sales aids.",
    },
    {
        "category": "personal_reasons",
        "subcategory": "Health",
        "raw_text": "I have been dealing with health issues for the past 3 months. Hoping to get back to work soon.",
        "sentiment": "neutral",
        "priority": "low",
        "ai_summary": "Agent on medical leave for 3 months. Plans to resume work after recovery.",
    },
    {
        "category": "personal_reasons",
        "subcategory": "Other Job",
        "raw_text": "I took up a full-time job but I still want to continue part-time insurance selling on weekends.",
        "sentiment": "neutral",
        "priority": "medium",
        "ai_summary": "Agent has taken full-time employment but willing to sell insurance part-time on weekends.",
    },
    {
        "category": "competition",
        "subcategory": "LIC",
        "raw_text": "LIC agents in my area are very aggressive. They offer better commission and customers trust LIC brand more.",
        "sentiment": "negative",
        "priority": "high",
        "ai_summary": "Strong LIC competition in agent's area with better commission offers and brand trust. Need competitive positioning support.",
    },
    {
        "category": "competition",
        "subcategory": "Other Private",
        "raw_text": "HDFC Life is offering 5% higher first-year commission than us. Two agents from our team have already switched.",
        "sentiment": "negative",
        "priority": "critical",
        "ai_summary": "HDFC Life offering higher commissions causing agent attrition. 2 agents already lost. Urgent competitive response needed.",
    },
    {
        "category": "support_issues",
        "subcategory": "No ADM Support",
        "raw_text": "I have not received any training support in the last 6 months. My ADM never visits or calls me.",
        "sentiment": "negative",
        "priority": "high",
        "ai_summary": "Agent feels neglected - no training or ADM contact in 6 months. Immediate ADM engagement required.",
    },
    {
        "category": "support_issues",
        "subcategory": "No Materials",
        "raw_text": "I don't have updated product brochures or sales materials. Everything I have is from last year.",
        "sentiment": "negative",
        "priority": "medium",
        "ai_summary": "Agent lacks updated marketing collateral. Needs latest product brochures and digital sales materials.",
    },
    {
        "category": "commission_concerns",
        "subcategory": "Unclear Structure",
        "raw_text": "I don't understand the new commission structure. Nobody explained the changes properly. My earnings have dropped.",
        "sentiment": "negative",
        "priority": "high",
        "ai_summary": "Agent confused by recent commission structure changes leading to earnings drop. Needs clear explanation session.",
    },
    {
        "category": "system_issues",
        "subcategory": "App Crash",
        "raw_text": "The mobile app keeps crashing when I try to show benefit illustrations to customers. Very embarrassing in front of clients.",
        "sentiment": "negative",
        "priority": "high",
        "ai_summary": "Mobile app crashes during customer benefit illustrations. Impacting field sales credibility.",
    },
    {
        "category": "market_conditions",
        "subcategory": "Competition",
        "raw_text": "Online insurance aggregators like PolicyBazaar are offering much cheaper term plans. Difficult to compete.",
        "sentiment": "negative",
        "priority": "medium",
        "ai_summary": "Online aggregator competition on term plan pricing. Need value-based selling training.",
    },
    {
        "category": "product_complexity",
        "subcategory": "No Training",
        "raw_text": "The new pension product launched last month but I haven't received any training on it yet.",
        "sentiment": "negative",
        "priority": "medium",
        "ai_summary": "Agent missed training on newly launched pension product. Needs catch-up session.",
    },
    {
        "category": "support_issues",
        "subcategory": "Claim Settlement Delays",
        "raw_text": "My customer's death claim has been pending for 4 months. The family is very upset and blaming me. I am losing credibility.",
        "sentiment": "negative",
        "priority": "critical",
        "ai_summary": "Death claim pending 4 months causing severe trust damage. Agent's credibility at stake. Urgent claims team escalation needed.",
    },
    {
        "category": "personal_reasons",
        "subcategory": "Lost Interest",
        "raw_text": "Honestly, I've lost motivation. The effort required is too much and the returns are too low for part-time work.",
        "sentiment": "negative",
        "priority": "medium",
        "ai_summary": "Agent demotivated due to poor effort-to-reward ratio. Needs re-engagement with realistic goal setting.",
    },
]

TRAINING_MODULES = [
    {"name": "Term Insurance Masterclass", "category": "product_knowledge"},
    {"name": "ULIP Fund Selection Guide", "category": "product_knowledge"},
    {"name": "Savings Plans Deep Dive", "category": "product_knowledge"},
    {"name": "Child Plan Selling Strategies", "category": "product_knowledge"},
    {"name": "Pension Products Workshop", "category": "product_knowledge"},
    {"name": "Consultative Selling Approach", "category": "sales_techniques"},
    {"name": "Objection Handling Mastery", "category": "objection_handling"},
    {"name": "IRDAI Compliance Essentials", "category": "compliance"},
    {"name": "Digital Sales Tools Training", "category": "digital_tools"},
    {"name": "Building Customer Relationships", "category": "soft_skills"},
    {"name": "Need-Based Selling", "category": "sales_techniques"},
    {"name": "Claims Process Navigation", "category": "compliance"},
]


def _generate_phone():
    """Generate a masked Indian phone number."""
    prefix = random.choice(["98", "97", "96", "95", "94", "93", "91", "90", "88", "87"])
    return f"{prefix}XXX-XX{random.randint(100, 999)}"


def _random_date_in_range(start_days_ago: int, end_days_ago: int) -> date:
    """Generate a random date between start_days_ago and end_days_ago from today."""
    days_ago = random.randint(end_days_ago, start_days_ago)
    return date.today() - timedelta(days=days_ago)


def _random_name(gender: str = None) -> str:
    """Generate a random Indian name."""
    if gender is None:
        gender = random.choice(["male", "female"])
    if gender == "male":
        first = random.choice(MALE_FIRST_NAMES)
    else:
        first = random.choice(FEMALE_FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    return f"{first} {last}"


def seed_database(db: Session):
    """Seed the database with comprehensive demo data."""
    logger.info("Starting database seeding...")

    # Check if data already exists
    existing_agents = db.query(Agent).count()
    if existing_agents > 0:
        logger.info(f"Database already has {existing_agents} agents. Skipping seed.")
        return

    # ======================================================================
    # 1. Create ADMs
    # ======================================================================
    adms = []
    for profile in ADM_PROFILES:
        adm = ADM(**profile)
        db.add(adm)
        adms.append(adm)
    db.flush()
    logger.info(f"Created {len(adms)} ADMs")

    # ======================================================================
    # 2. Create 50 Agents
    # ======================================================================
    agents = []
    city_list = list(CITIES.keys())

    # Distribution: 40 dormant, 5 at_risk, 3 contacted, 1 engaged, 1 active
    state_distribution = (
        ["dormant"] * 40
        + ["at_risk"] * 5
        + ["contacted"] * 3
        + ["engaged"] * 1
        + ["active"] * 1
    )
    random.shuffle(state_distribution)

    used_phones = set()

    for i in range(50):
        city = random.choice(city_list)
        city_info = CITIES[city]
        lifecycle_state = state_distribution[i]

        # Determine dormancy reason and duration based on state
        dormancy_reason = None
        dormancy_duration = 0
        last_contact = None
        last_policy_sold = None
        engagement_score = 0.0

        if lifecycle_state == "dormant":
            category = random.choice(list(DORMANCY_TAXONOMY.keys()))
            subcategory = random.choice(DORMANCY_TAXONOMY[category])
            dormancy_reason = f"{category}: {subcategory}"
            dormancy_duration = random.randint(30, 720)
            engagement_score = round(random.uniform(0, 15), 1)
        elif lifecycle_state == "at_risk":
            category = random.choice(["commission_concerns", "market_conditions", "personal_reasons", "competition"])
            subcategory = random.choice(DORMANCY_TAXONOMY[category])
            dormancy_reason = f"{category}: {subcategory}"
            dormancy_duration = random.randint(60, 180)
            last_contact = _random_date_in_range(90, 30)
            engagement_score = round(random.uniform(10, 30), 1)
        elif lifecycle_state == "contacted":
            last_contact = _random_date_in_range(14, 1)
            dormancy_duration = random.randint(30, 120)
            engagement_score = round(random.uniform(25, 50), 1)
        elif lifecycle_state == "engaged":
            last_contact = _random_date_in_range(7, 1)
            dormancy_duration = 0
            engagement_score = round(random.uniform(50, 75), 1)
        elif lifecycle_state == "active":
            last_contact = _random_date_in_range(5, 0)
            last_policy_sold = _random_date_in_range(30, 0)
            dormancy_duration = 0
            engagement_score = round(random.uniform(70, 95), 1)

        # Pick language - sometimes the city language, sometimes Hindi or English
        lang_options = [city_info["language"], "Hindi", "English"]
        language = random.choice(lang_options)

        # Generate a unique phone
        phone = _generate_phone()
        while phone in used_phones:
            phone = _generate_phone()
        used_phones.add(phone)

        # Assign to an ADM (some agents unassigned)
        assigned_adm_id = None
        if lifecycle_state in ["contacted", "engaged", "active"]:
            # Always assigned
            assigned_adm_id = random.choice(adms).id
        elif lifecycle_state == "at_risk":
            assigned_adm_id = random.choice(adms).id
        elif lifecycle_state == "dormant":
            # 70% assigned, 30% unassigned
            if random.random() < 0.7:
                assigned_adm_id = random.choice(adms).id

        name = _random_name()
        doj = _random_date_in_range(1800, 180)  # Joined 6 months to 5 years ago

        agent = Agent(
            name=name,
            phone=phone,
            email=f"{name.lower().replace(' ', '.')}@email.com",
            location=city,
            state=city_info["state"],
            language=language,
            lifecycle_state=lifecycle_state,
            dormancy_reason=dormancy_reason,
            dormancy_duration_days=dormancy_duration,
            last_contact_date=last_contact,
            last_policy_sold_date=last_policy_sold,
            assigned_adm_id=assigned_adm_id,
            engagement_score=engagement_score,
            license_number=f"IRDA/{random.randint(100000, 999999)}/{random.randint(2019, 2024)}",
            date_of_joining=doj,
            specialization=random.choice(SPECIALIZATIONS),
        )
        db.add(agent)
        agents.append(agent)

    db.flush()
    logger.info(f"Created {len(agents)} agents")

    # Update ADM active agent counts
    for adm in adms:
        count = sum(
            1 for a in agents
            if a.assigned_adm_id == adm.id and a.lifecycle_state == "active"
        )
        adm.active_agent_count = count
    db.flush()

    # ======================================================================
    # 3. Create 30 Interactions
    # ======================================================================
    assigned_agents = [a for a in agents if a.assigned_adm_id is not None]
    interactions = []

    interaction_types = ["call", "call", "call", "whatsapp", "whatsapp", "visit"]
    outcomes = [
        "connected", "connected", "connected",
        "not_answered", "not_answered",
        "busy",
        "callback_requested",
        "follow_up_scheduled",
        "declined",
    ]

    for i in range(30):
        agent = random.choice(assigned_agents)
        outcome = random.choice(outcomes)
        int_type = random.choice(interaction_types)
        notes_list = INTERACTION_NOTES_TEMPLATES.get(outcome, ["General interaction logged."])
        notes = random.choice(notes_list)

        # Follow-up dates
        follow_up_date = None
        follow_up_status = "pending"
        if outcome in ["connected", "callback_requested", "follow_up_scheduled"]:
            if random.random() < 0.7:
                # Some past, some future
                offset = random.randint(-10, 14)
                follow_up_date = date.today() + timedelta(days=offset)
                if offset < 0:
                    follow_up_status = random.choice(["pending", "completed"])

        # Sentiment and feedback for some
        sentiment_score = None
        fb_category = None
        fb_subcategory = None
        if outcome == "connected" and random.random() < 0.5:
            sentiment_score = round(random.uniform(-0.5, 0.8), 2)
            if sentiment_score < -0.2:
                cat = random.choice(list(DORMANCY_TAXONOMY.keys()))
                fb_category = cat
                fb_subcategory = random.choice(DORMANCY_TAXONOMY[cat])

        duration = None
        if int_type == "call":
            duration = random.randint(2, 25) if outcome == "connected" else random.randint(0, 3)
        elif int_type == "visit":
            duration = random.randint(15, 60) if outcome == "connected" else random.randint(5, 15)

        created_at = datetime.combine(
            _random_date_in_range(60, 0),
            datetime.min.time()
        ).replace(hour=random.randint(9, 18), minute=random.randint(0, 59))

        interaction = Interaction(
            agent_id=agent.id,
            adm_id=agent.assigned_adm_id,
            type=int_type,
            outcome=outcome,
            notes=notes,
            duration_minutes=duration,
            feedback_category=fb_category,
            feedback_subcategory=fb_subcategory,
            sentiment_score=sentiment_score,
            follow_up_date=follow_up_date,
            follow_up_status=follow_up_status,
            created_at=created_at,
        )
        db.add(interaction)
        interactions.append(interaction)

    db.flush()
    logger.info(f"Created {len(interactions)} interactions")

    # ======================================================================
    # 4. Create 20 Feedback Entries
    # ======================================================================
    feedbacks = []
    for i in range(20):
        template = FEEDBACK_TEMPLATES[i % len(FEEDBACK_TEMPLATES)]
        agent = random.choice(assigned_agents)

        # Link to a random interaction if available
        agent_interactions = [ix for ix in interactions if ix.agent_id == agent.id]
        interaction_id = None
        if agent_interactions:
            interaction_id = random.choice(agent_interactions).id

        status = random.choice(["new", "new", "new", "in_review", "in_review", "actioned", "resolved"])
        resolved_at = None
        if status == "resolved":
            resolved_at = datetime.utcnow() - timedelta(days=random.randint(0, 10))

        created_at = datetime.combine(
            _random_date_in_range(45, 0),
            datetime.min.time()
        ).replace(hour=random.randint(9, 18), minute=random.randint(0, 59))

        feedback = Feedback(
            agent_id=agent.id,
            adm_id=agent.assigned_adm_id,
            interaction_id=interaction_id,
            category=template["category"],
            subcategory=template["subcategory"],
            raw_text=template["raw_text"],
            ai_summary=template["ai_summary"],
            sentiment=template["sentiment"],
            priority=template["priority"],
            status=status,
            action_taken="Escalated to regional office" if status in ["actioned", "resolved"] else None,
            resolved_at=resolved_at,
            created_at=created_at,
        )
        db.add(feedback)
        feedbacks.append(feedback)

    db.flush()
    logger.info(f"Created {len(feedbacks)} feedback entries")

    # ======================================================================
    # 5. Create 15 Diary Entries
    # ======================================================================
    diary_entries = []
    entry_types = ["follow_up", "first_contact", "training", "escalation", "review"]
    times_of_day = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                     "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"]

    for i in range(15):
        adm = random.choice(adms)
        agent = random.choice([a for a in agents if a.assigned_adm_id == adm.id] or agents)
        entry_type = random.choice(entry_types)

        # Mix of overdue (past), today, and upcoming
        if i < 4:
            # Overdue: past dates
            sched_date = _random_date_in_range(14, 2)
            status = random.choice(["scheduled", "missed"])
        elif i < 7:
            # Today
            sched_date = date.today()
            status = "scheduled"
        else:
            # Upcoming
            sched_date = date.today() + timedelta(days=random.randint(1, 14))
            status = "scheduled"

        notes_options = {
            "follow_up": f"Follow up with {agent.name} regarding previous discussion on product portfolio",
            "first_contact": f"Initial call to {agent.name} - dormant for {agent.dormancy_duration_days} days",
            "training": f"Product training session with {agent.name} on ULIP and term insurance",
            "escalation": f"Escalation meeting for {agent.name}'s pending commission issues",
            "review": f"Monthly performance review with {agent.name}",
        }

        entry = DiaryEntry(
            adm_id=adm.id,
            agent_id=agent.id,
            scheduled_date=sched_date,
            scheduled_time=random.choice(times_of_day),
            entry_type=entry_type,
            notes=notes_options.get(entry_type, "Scheduled task"),
            status=status,
            reminder_sent=sched_date <= date.today(),
        )
        db.add(entry)
        diary_entries.append(entry)

    db.flush()
    logger.info(f"Created {len(diary_entries)} diary entries")

    # ======================================================================
    # 6. Create 10 Training Progress Entries
    # ======================================================================
    training_records = []
    for i in range(10):
        adm = adms[i % len(adms)]
        module = TRAINING_MODULES[i % len(TRAINING_MODULES)]
        completed = random.random() < 0.6
        score = round(random.uniform(60, 100), 1) if completed else round(random.uniform(20, 60), 1)

        tp = TrainingProgress(
            adm_id=adm.id,
            module_name=module["name"],
            module_category=module["category"],
            score=score,
            completed=completed,
            completed_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)) if completed else None,
        )
        db.add(tp)
        training_records.append(tp)

    db.flush()
    logger.info(f"Created {len(training_records)} training progress entries")

    # ======================================================================
    # 7. Create Demo Users
    # ======================================================================
    import hashlib

    def simple_hash(password: str) -> str:
        """Simple hash for demo — NOT production safe."""
        return hashlib.sha256(password.encode()).hexdigest()

    demo_users_data = [
        {"username": "admin", "password": "admin123", "role": "admin", "name": "Platform Admin", "adm_id": None},
        {"username": "rakesh", "password": "demo123", "role": "adm", "name": "Rajiv Malhotra", "adm_id": adms[0].id},
        {"username": "priyanka", "password": "demo123", "role": "adm", "name": "Priyanka Kapoor", "adm_id": adms[1].id},
        {"username": "suresh", "password": "demo123", "role": "adm", "name": "Suresh Venkataraman", "adm_id": adms[2].id},
    ]

    users = []
    for u in demo_users_data:
        user = User(
            username=u["username"],
            password_hash=simple_hash(u["password"]),
            role=u["role"],
            name=u["name"],
            adm_id=u["adm_id"],
        )
        db.add(user)
        users.append(user)
    db.flush()
    logger.info(f"Created {len(users)} demo users")

    # ======================================================================
    # 8. Create Products (Axis Max Life catalog)
    # ======================================================================
    products_data = [
        {
            "name": "Smart Term Plan",
            "category": "term",
            "description": "Pure term life insurance with high coverage at affordable premiums. Available in Regular, Limited, and Single pay options.",
            "key_features": '["Life cover up to ₹25 Cr", "Flexible payout options", "Critical illness rider available", "Premium waiver benefit", "Return of premium variant"]',
            "premium_range": "₹5,000 - ₹50,000/year",
            "commission_rate": "30-35% first year, 5% renewal",
            "target_audience": "Salaried individuals, 25-55 years",
            "selling_tips": "Focus on family protection angle. Compare with LIC term plans showing better claim ratio.",
        },
        {
            "name": "Smart Secure Plus",
            "category": "savings",
            "description": "Guaranteed savings plan with life cover. Non-linked, non-participating endowment plan with guaranteed maturity benefit.",
            "key_features": '["Guaranteed maturity benefit", "Life cover during policy term", "Tax benefits u/s 80C & 10(10D)", "Loan facility available", "Flexible premium payment terms"]',
            "premium_range": "₹25,000 - ₹5,00,000/year",
            "commission_rate": "25-30% first year, 5% renewal",
            "target_audience": "Conservative investors, 30-50 years",
            "selling_tips": "Position as safe alternative to FDs with insurance benefit. Show guaranteed return calculations.",
        },
        {
            "name": "Smart Wealth Plan",
            "category": "ulip",
            "description": "Unit Linked Insurance Plan with market-linked returns and life cover. Multiple fund options with free switches.",
            "key_features": '["Market-linked returns", "Multiple fund options", "Free switches between funds", "Partial withdrawal after 5 years", "Top-up facility"]',
            "premium_range": "₹50,000 - ₹10,00,000/year",
            "commission_rate": "8-12% of premium",
            "target_audience": "Aggressive investors, 25-45 years",
            "selling_tips": "Show long-term wealth creation potential. Compare with mutual funds highlighting insurance + investment combo.",
        },
        {
            "name": "Smart Kidz Plan",
            "category": "child",
            "description": "Child education and marriage plan with guaranteed benefits. Ensures child's financial future even in parent's absence.",
            "key_features": '["Guaranteed education fund", "Waiver of premium on parent death", "Milestone-based payouts", "Premium waiver rider", "Flexible payout age"]',
            "premium_range": "₹20,000 - ₹2,00,000/year",
            "commission_rate": "25-28% first year, 5% renewal",
            "target_audience": "Parents with children 0-12 years",
            "selling_tips": "Emotional sell - secure your child's future. Show how education costs are rising 10-12% annually.",
        },
        {
            "name": "Smart Pension Plan",
            "category": "pension",
            "description": "Retirement savings plan with guaranteed annuity. Build a retirement corpus with regular monthly pension.",
            "key_features": '["Guaranteed pension for life", "Joint life option", "Commutation up to 60%", "Death benefit to nominee", "Tax benefits on premium"]',
            "premium_range": "₹30,000 - ₹5,00,000/year",
            "commission_rate": "20-25% first year, 3% renewal",
            "target_audience": "Working professionals, 30-55 years",
            "selling_tips": "Show retirement gap analysis. Use NPS comparison to highlight guarantee advantage.",
        },
        {
            "name": "Group Term Life",
            "category": "group",
            "description": "Group insurance for businesses and organizations. Provides life cover to employees at competitive rates.",
            "key_features": '["Low per-member cost", "Easy administration", "Customizable coverage", "No medical for small groups", "Annual renewable"]',
            "premium_range": "₹500 - ₹5,000/member/year",
            "commission_rate": "15-20% of total premium",
            "target_audience": "SMEs, corporates, associations",
            "selling_tips": "Approach HR departments. Show employee retention benefits and tax deductibility for employer.",
        },
        {
            "name": "Smart Health Plan",
            "category": "health",
            "description": "Comprehensive health insurance with critical illness cover. Covers hospitalization, surgeries, and critical illnesses.",
            "key_features": '["Cashless hospitalization", "No claim bonus", "Critical illness cover", "Day care procedures", "Pre-post hospitalization"]',
            "premium_range": "₹8,000 - ₹35,000/year",
            "commission_rate": "20-25% first year, 10% renewal",
            "target_audience": "Individuals and families, 25-65 years",
            "selling_tips": "Show rising healthcare costs. Position as supplement to employer insurance for comprehensive coverage.",
        },
        {
            "name": "SWAG (Smart Wealth Advantage Guarantee)",
            "category": "savings",
            "description": "Short-term guaranteed returns plan. Premium paying term of 5-7 years with guaranteed survival benefits.",
            "key_features": '["Short premium paying term", "Guaranteed returns", "Life cover throughout", "Tax-free maturity", "Partial withdrawal option"]',
            "premium_range": "₹1,00,000 - ₹10,00,000/year",
            "commission_rate": "25-30% first year, 5% renewal",
            "target_audience": "High-income individuals seeking safe returns",
            "selling_tips": "Best for customers who want guaranteed returns with short commitment. Compare with PPF/FD showing tax advantage.",
        },
    ]

    products = []
    for p_data in products_data:
        product = Product(**p_data)
        db.add(product)
        products.append(product)
    db.flush()
    logger.info(f"Created {len(products)} products")

    # ======================================================================
    # 9. Create Onboarding Pipeline Agents
    # ======================================================================
    onboarding_agents_data = [
        {"name": "Rohit Agarwal", "phone": "91XXX-XX201", "location": "Pune", "state": "Maharashtra", "status": "pending"},
        {"name": "Sneha Jain", "phone": "91XXX-XX202", "location": "Mumbai", "state": "Maharashtra", "status": "pending"},
        {"name": "Karan Malhotra", "phone": "91XXX-XX203", "location": "Delhi", "state": "Delhi", "status": "documents_submitted"},
        {"name": "Ananya Reddy", "phone": "91XXX-XX204", "location": "Hyderabad", "state": "Telangana", "status": "documents_submitted"},
        {"name": "Vikash Tiwari", "phone": "91XXX-XX205", "location": "Lucknow", "state": "Uttar Pradesh", "status": "verified"},
    ]

    onboarding_agents = []
    for oa in onboarding_agents_data:
        agent = Agent(
            name=oa["name"],
            phone=oa["phone"],
            email=f"{oa['name'].lower().replace(' ', '.')}@email.com",
            location=oa["location"],
            state=oa["state"],
            language="Hindi",
            lifecycle_state="dormant",
            onboarding_status=oa["status"],
            onboarding_started_at=datetime.utcnow() - timedelta(days=random.randint(1, 14)),
            assigned_adm_id=random.choice(adms).id,
            engagement_score=0.0,
        )
        db.add(agent)
        onboarding_agents.append(agent)
    db.flush()
    logger.info(f"Created {len(onboarding_agents)} onboarding pipeline agents")

    # ======================================================================
    # Commit everything
    # ======================================================================
    db.commit()
    logger.info("Database seeding completed successfully!")
    logger.info(f"  ADMs: {len(adms)}")
    logger.info(f"  Agents: {len(agents)}")
    logger.info(f"  Interactions: {len(interactions)}")
    logger.info(f"  Feedbacks: {len(feedbacks)}")
    logger.info(f"  Diary Entries: {len(diary_entries)}")
    logger.info(f"  Training Records: {len(training_records)}")
    logger.info(f"  Users: {len(users)}")
    logger.info(f"  Products: {len(products)}")
    logger.info(f"  Onboarding Agents: {len(onboarding_agents)}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    from database import engine, Base, SessionLocal
    from models import *
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
    print("Seed completed successfully!")
