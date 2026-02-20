"""
ADM Platform - FastAPI Application Entry Point

Axis Max Life Insurance Agent Activation & Re-engagement System.
Provides REST APIs for managing dormant agent activation through
ADMs (Agency Development Managers).
"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db, SessionLocal

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("adm_platform")


def run_seed_if_empty():
    """Seed reference data (products, admin user, ADM users) if not already present."""
    import os
    from models import Product, User

    # Force DB reset if RESET_DB env var is set (one-time cleanup)
    reset_db = os.environ.get("RESET_DB", "").lower() in ("true", "1", "yes")
    if reset_db:
        logger.warning("RESET_DB=true detected! Dropping ALL tables and re-creating...")
        from database import engine, Base
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        logger.warning("All tables dropped and re-created.")

    db = SessionLocal()
    try:
        count = db.query(Product).count()
        if count == 0:
            logger.info("No products found. Seeding reference data...")
            from seed_data import seed_database
            seed_database(db)
            logger.info("Reference data seeded successfully.")
        else:
            logger.info(f"Database has {count} products. Skipping full seed.")
            # Still ensure key users exist even if products were already seeded
            _ensure_key_users(db)
    except Exception as e:
        logger.error(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()


def _ensure_key_users(db):
    """Ensure admin and key ADM users exist in the database."""
    import hashlib
    from models import User, ADM

    def _hash(pw: str) -> str:
        return hashlib.sha256(pw.encode()).hexdigest()

    # Admin user
    if not db.query(User).filter(User.username == "admin").first():
        db.add(User(username="admin", password_hash=_hash("admin123"), role="admin", name="Platform Admin"))
        db.flush()
        logger.info("Created missing admin user (admin/admin123)")

    # Rohit Sadhu ADM
    if not db.query(User).filter(User.username == "rohit").first():
        rohit_adm = db.query(ADM).filter(ADM.telegram_chat_id == "8321786545").first()
        if not rohit_adm:
            rohit_adm = ADM(
                name="Rohit Sadhu", phone="7303474258", region="North",
                language="Hindi,English", max_capacity=50, performance_score=0.0,
                telegram_chat_id="8321786545",
            )
            db.add(rohit_adm)
            db.flush()
        db.add(User(username="rohit", password_hash=_hash("rohit123"), role="adm", name="Rohit Sadhu", adm_id=rohit_adm.id))
        db.commit()
        logger.info("Created missing ADM user: Rohit Sadhu (rohit/rohit123)")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # --- Startup ---
    logger.info("=" * 60)
    logger.info(f"  {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info("=" * 60)

    # Create all database tables
    logger.info("Initializing database tables...")
    init_db()
    logger.info("Database tables created.")

    # Seed data if DB is empty
    run_seed_if_empty()

    logger.info("Application startup complete.")
    logger.info(f"API docs available at: http://localhost:8000/docs")
    logger.info("=" * 60)

    yield

    # --- Shutdown ---
    logger.info("Application shutting down...")


# ---------------------------------------------------------------------------
# Create FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "REST API for the ADM Platform - Axis Max Life Insurance "
        "Agent Activation & Re-engagement System. "
        "Manages dormant agent lifecycle, ADM assignments, interactions, "
        "feedback, training, analytics, and AI-powered insights."
    ),
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS Middleware (allow all for demo)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Include all route routers under /api/v1
# ---------------------------------------------------------------------------
from routes import (
    agents_router,
    adms_router,
    interactions_router,
    feedback_router,
    diary_router,
    briefings_router,
    analytics_router,
    training_router,
    assignment_router,
    telegram_bot_router,
    auth_router,
    products_router,
    onboarding_router,
    playbooks_router,
    communication_router,
    feedback_tickets_router,
)

API_PREFIX = "/api/v1"

all_routers = [
    telegram_bot_router,
    agents_router,
    adms_router,
    interactions_router,
    feedback_router,
    diary_router,
    briefings_router,
    analytics_router,
    training_router,
    assignment_router,
    auth_router,
    products_router,
    onboarding_router,
    playbooks_router,
    communication_router,
    feedback_tickets_router,
]

# Mount all routers under /api/v1 (primary)
for r in all_routers:
    app.include_router(r, prefix=API_PREFIX)

# Also mount all routers at root (no prefix) so the API works
# regardless of whether NEXT_PUBLIC_API_URL includes /api/v1 or not
for r in all_routers:
    app.include_router(r)


# ---------------------------------------------------------------------------
# Health check endpoint (at root, not under /api/v1)
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
def root():
    """Root endpoint - basic info."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "api_prefix": API_PREFIX,
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    from database import SessionLocal
    from models import Agent

    try:
        db = SessionLocal()
        agent_count = db.query(Agent).count()
        db.close()
        db_status = "connected"
    except Exception as e:
        agent_count = 0
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "database": db_status,
        "agent_count": agent_count,
        "ai_enabled": settings.ENABLE_AI_FEATURES and bool(settings.ANTHROPIC_API_KEY),
        "telegram_enabled": settings.ENABLE_TELEGRAM_BOT and bool(settings.TELEGRAM_BOT_TOKEN),
    }


# ---------------------------------------------------------------------------
# Run with uvicorn when executed directly
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 8000))
    is_dev = os.environ.get("RAILWAY_ENVIRONMENT") is None

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=is_dev,
        log_level="info",
    )
