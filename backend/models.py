"""
SQLAlchemy ORM models for the ADM Platform.
"""

import json
from datetime import datetime, date, time
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, Date, Time,
    DateTime, ForeignKey, Enum as SAEnum, JSON,
)
from sqlalchemy.orm import relationship
from database import Base


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------
class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    phone = Column(String(20), nullable=False, unique=True, index=True)
    email = Column(String(200), nullable=True)
    location = Column(String(200), nullable=False)  # City / District
    state = Column(String(100), nullable=True)       # Indian state
    language = Column(String(50), default="Hindi")    # Preferred language

    lifecycle_state = Column(
        String(30),
        default="dormant",
        index=True,
    )  # dormant | at_risk | contacted | engaged | trained | active

    dormancy_reason = Column(String(300), nullable=True)
    dormancy_duration_days = Column(Integer, default=0)
    last_contact_date = Column(Date, nullable=True)
    last_policy_sold_date = Column(Date, nullable=True)

    assigned_adm_id = Column(Integer, ForeignKey("adms.id"), nullable=True, index=True)
    engagement_score = Column(Float, default=0.0)  # 0-100

    license_number = Column(String(50), nullable=True)
    date_of_joining = Column(Date, nullable=True)
    specialization = Column(String(200), nullable=True)  # e.g., "term,ulip"

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    onboarding_status = Column(String(30), default="active")  # pending | documents_submitted | verified | active | rejected
    onboarding_started_at = Column(DateTime, nullable=True)
    onboarding_completed_at = Column(DateTime, nullable=True)

    # Relationships
    assigned_adm = relationship("ADM", back_populates="agents")
    interactions = relationship("Interaction", back_populates="agent", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="agent", cascade="all, delete-orphan")
    diary_entries = relationship("DiaryEntry", back_populates="agent")


# ---------------------------------------------------------------------------
# ADM (Agency Development Manager)
# ---------------------------------------------------------------------------
class ADM(Base):
    __tablename__ = "adms"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    phone = Column(String(20), nullable=False, unique=True)
    email = Column(String(200), nullable=True)
    region = Column(String(200), nullable=False)   # e.g., "West - Mumbai"
    language = Column(String(100), default="Hindi,English")  # Comma-separated

    active_agent_count = Column(Integer, default=0)
    max_capacity = Column(Integer, default=50)
    performance_score = Column(Float, default=0.0)  # 0-100

    telegram_chat_id = Column(String(50), nullable=True)
    whatsapp_number = Column(String(20), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    agents = relationship("Agent", back_populates="assigned_adm")
    interactions = relationship("Interaction", back_populates="adm")
    feedbacks = relationship("Feedback", back_populates="adm")
    training_progress = relationship("TrainingProgress", back_populates="adm", cascade="all, delete-orphan")
    diary_entries = relationship("DiaryEntry", back_populates="adm", cascade="all, delete-orphan")
    daily_briefings = relationship("DailyBriefing", back_populates="adm", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Interaction
# ---------------------------------------------------------------------------
class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False, index=True)
    adm_id = Column(Integer, ForeignKey("adms.id"), nullable=False, index=True)

    type = Column(String(30), nullable=False)  # call | whatsapp | visit | telegram
    outcome = Column(String(50), nullable=False)
    # connected | not_answered | busy | callback_requested | follow_up_scheduled | declined

    notes = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)  # for calls

    feedback_category = Column(String(100), nullable=True)
    feedback_subcategory = Column(String(100), nullable=True)
    sentiment_score = Column(Float, nullable=True)  # -1.0 to 1.0

    follow_up_date = Column(Date, nullable=True)
    follow_up_status = Column(String(30), default="pending")
    # pending | completed | overdue

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    agent = relationship("Agent", back_populates="interactions")
    adm = relationship("ADM", back_populates="interactions")
    feedbacks = relationship("Feedback", back_populates="interaction")


# ---------------------------------------------------------------------------
# Feedback
# ---------------------------------------------------------------------------
class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False, index=True)
    adm_id = Column(Integer, ForeignKey("adms.id"), nullable=False, index=True)
    interaction_id = Column(Integer, ForeignKey("interactions.id"), nullable=True)

    category = Column(String(100), nullable=False)
    # system_issues | commission_concerns | market_conditions |
    # product_complexity | personal_reasons | competition | support_issues

    subcategory = Column(String(200), nullable=True)
    raw_text = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    sentiment = Column(String(30), nullable=True)  # positive | neutral | negative
    priority = Column(String(20), default="medium")  # low | medium | high | critical
    status = Column(String(30), default="new")  # new | in_review | actioned | resolved

    action_taken = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    agent = relationship("Agent", back_populates="feedbacks")
    adm = relationship("ADM", back_populates="feedbacks")
    interaction = relationship("Interaction", back_populates="feedbacks")


# ---------------------------------------------------------------------------
# Training Progress
# ---------------------------------------------------------------------------
class TrainingProgress(Base):
    __tablename__ = "training_progress"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    adm_id = Column(Integer, ForeignKey("adms.id"), nullable=False, index=True)

    module_name = Column(String(200), nullable=False)
    module_category = Column(String(100), nullable=False)
    # product_knowledge | sales_techniques | compliance |
    # digital_tools | soft_skills | objection_handling

    score = Column(Float, default=0.0)  # 0-100
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    adm = relationship("ADM", back_populates="training_progress")


# ---------------------------------------------------------------------------
# Diary Entry
# ---------------------------------------------------------------------------
class DiaryEntry(Base):
    __tablename__ = "diary_entries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    adm_id = Column(Integer, ForeignKey("adms.id"), nullable=False, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True, index=True)

    scheduled_date = Column(Date, nullable=False, index=True)
    scheduled_time = Column(String(10), nullable=True)  # HH:MM format

    entry_type = Column(String(30), nullable=False)
    # follow_up | first_contact | training | escalation | review

    notes = Column(Text, nullable=True)
    status = Column(String(30), default="scheduled")
    # scheduled | completed | missed | rescheduled

    reminder_sent = Column(Boolean, default=False)
    completion_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    adm = relationship("ADM", back_populates="diary_entries")
    agent = relationship("Agent", back_populates="diary_entries")


# ---------------------------------------------------------------------------
# Daily Briefing
# ---------------------------------------------------------------------------
class DailyBriefing(Base):
    __tablename__ = "daily_briefings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    adm_id = Column(Integer, ForeignKey("adms.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)

    priority_agents = Column(Text, nullable=True)     # JSON string of agent IDs + reasons
    pending_followups = Column(Integer, default=0)
    new_assignments = Column(Integer, default=0)
    overdue_followups = Column(Integer, default=0)

    summary_text = Column(Text, nullable=True)
    action_items = Column(Text, nullable=True)         # JSON string
    sent_via = Column(String(50), nullable=True)       # telegram | whatsapp | email | in_app

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    adm = relationship("ADM", back_populates="daily_briefings")


# ---------------------------------------------------------------------------
# User (Authentication)
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="adm")  # admin | adm
    adm_id = Column(Integer, ForeignKey("adms.id"), nullable=True)
    name = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    adm = relationship("ADM")


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)  # term | savings | ulip | pension | child | group | health
    description = Column(Text, nullable=True)
    key_features = Column(Text, nullable=True)  # JSON string
    premium_range = Column(String(100), nullable=True)
    commission_rate = Column(String(50), nullable=True)
    target_audience = Column(String(200), nullable=True)
    selling_tips = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
