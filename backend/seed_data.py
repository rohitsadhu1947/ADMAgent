"""
Seed data for the ADM Platform.
Seeds only essential reference data: products, training modules, and an admin user.
All operational data (ADMs, agents, interactions, etc.) is created through the app.
"""

import hashlib
import logging
from sqlalchemy.orm import Session

from models import User, Product

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Axis Max Life Products (real catalog)
# ---------------------------------------------------------------------------
PRODUCTS = [
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

# ---------------------------------------------------------------------------
# Training modules
# ---------------------------------------------------------------------------
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


def _hash_password(password: str) -> str:
    """Hash password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()


def seed_database(db: Session):
    """Seed the database with essential reference data only."""
    logger.info("Starting database seeding (reference data only)...")

    # Check if products already exist
    existing = db.query(Product).count()
    if existing > 0:
        logger.info(f"Database already has {existing} products. Skipping seed.")
        return

    # ------------------------------------------------------------------
    # 1. Products
    # ------------------------------------------------------------------
    products = []
    for p_data in PRODUCTS:
        product = Product(**p_data)
        db.add(product)
        products.append(product)
    db.flush()
    logger.info(f"Created {len(products)} products")

    # ------------------------------------------------------------------
    # 2. Admin user (platform admin for web dashboard)
    # ------------------------------------------------------------------
    existing_admin = db.query(User).filter(User.username == "admin").first()
    if not existing_admin:
        admin_user = User(
            username="admin",
            password_hash=_hash_password("admin123"),
            role="admin",
            name="Platform Admin",
            adm_id=None,
        )
        db.add(admin_user)
        db.flush()
        logger.info("Created admin user (admin/admin123)")

    # ------------------------------------------------------------------
    # Commit
    # ------------------------------------------------------------------
    db.commit()
    logger.info("Database seeding completed!")
    logger.info(f"  Products: {len(products)}")
    logger.info("  Admin user: created")
    logger.info("  Note: ADMs, agents, and operational data should be added via the app or Telegram bot.")
