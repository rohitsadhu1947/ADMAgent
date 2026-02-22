"""
Async HTTP client for communicating with the ADM Platform FastAPI backend.
All data operations go through this client.
"""

import logging
from typing import Any, Optional

import httpx

from config import config

logger = logging.getLogger(__name__)


class APIClient:
    """Async HTTP client wrapper for the ADM Platform API."""

    def __init__(self, base_url: Optional[str] = None, timeout: int = 15):
        self.base_url = (base_url or config.API_BASE_URL).rstrip("/")
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout,
                headers={"Content-Type": "application/json"},
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    # ------------------------------------------------------------------
    # Generic HTTP helpers
    # ------------------------------------------------------------------

    async def _request(
        self, method: str, path: str, **kwargs
    ) -> dict[str, Any]:
        """Execute an HTTP request and return the JSON response."""
        client = await self._get_client()
        try:
            response = await client.request(method, path, **kwargs)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            logger.error(
                "API %s %s returned %s: %s",
                method, path, exc.response.status_code, exc.response.text,
            )
            return {"error": True, "status": exc.response.status_code, "detail": exc.response.text}
        except httpx.RequestError as exc:
            logger.error("API request failed for %s %s: %s", method, path, exc)
            return {"error": True, "detail": str(exc)}

    async def get(self, path: str, params: Optional[dict] = None) -> dict:
        return await self._request("GET", path, params=params)

    async def post(self, path: str, data: Optional[dict] = None) -> dict:
        return await self._request("POST", path, json=data)

    async def put(self, path: str, data: Optional[dict] = None) -> dict:
        return await self._request("PUT", path, json=data)

    async def delete(self, path: str) -> dict:
        return await self._request("DELETE", path)

    # ------------------------------------------------------------------
    # ADM endpoints
    # ------------------------------------------------------------------

    async def register_adm(
        self, telegram_id: int, name: str, employee_id: str, region: str
    ) -> dict:
        """Register a new ADM via Telegram."""
        return await self.post("/adm/register", data={
            "telegram_id": telegram_id,
            "name": name,
            "employee_id": employee_id,
            "region": region,
        })

    async def get_adm_profile(self, telegram_id: int) -> dict:
        """Get ADM profile by Telegram user ID."""
        return await self.get(f"/adm/profile/{telegram_id}")

    async def get_adm_stats(self, telegram_id: int) -> dict:
        """Get ADM performance statistics."""
        return await self.get(f"/adm/{telegram_id}/stats")

    # ------------------------------------------------------------------
    # Agent endpoints
    # ------------------------------------------------------------------

    async def get_assigned_agents(
        self, telegram_id: int, page: int = 1, search: Optional[str] = None
    ) -> dict:
        """Get list of agents assigned to this ADM."""
        params: dict[str, Any] = {"page": page}
        if search:
            params["search"] = search
        return await self.get(f"/adm/{telegram_id}/agents", params=params)

    async def get_agent_detail(self, agent_id: str) -> dict:
        """Get detailed information about a specific agent."""
        return await self.get(f"/agents/{agent_id}")

    async def get_priority_agents(self, telegram_id: int, limit: int = 5) -> dict:
        """Get priority agents that need attention today."""
        return await self.get(
            f"/adm/{telegram_id}/agents/priority", params={"limit": limit}
        )

    # ------------------------------------------------------------------
    # Feedback endpoints
    # ------------------------------------------------------------------

    async def submit_feedback(self, data: dict) -> dict:
        """Submit a feedback entry via telegram-friendly endpoint."""
        return await self.post("/feedback/telegram", data=data)

    async def get_pending_feedbacks(self, telegram_id: int) -> dict:
        """Get pending / overdue follow-ups."""
        return await self.get(f"/adm/{telegram_id}/feedback/pending")

    # ------------------------------------------------------------------
    # Interaction endpoints
    # ------------------------------------------------------------------

    async def log_interaction(self, data: dict) -> dict:
        """Log an interaction with an agent via telegram-friendly endpoint."""
        return await self.post("/interactions/telegram", data=data)

    async def get_interactions(
        self, telegram_id: int, agent_id: Optional[str] = None
    ) -> dict:
        """Get interactions for the ADM, optionally filtered by agent."""
        params = {}
        if agent_id:
            params["agent_id"] = agent_id
        return await self.get(f"/adm/{telegram_id}/interactions", params=params)

    # ------------------------------------------------------------------
    # Diary / Schedule endpoints
    # ------------------------------------------------------------------

    async def get_diary_entries(self, telegram_id: int, date: Optional[str] = None) -> dict:
        """Get diary entries for a date (default: today)."""
        params = {}
        if date:
            params["date"] = date
        return await self.get(f"/adm/{telegram_id}/diary", params=params)

    async def add_diary_entry(self, data: dict) -> dict:
        """Add a new diary entry via telegram-friendly endpoint."""
        return await self.post("/diary/telegram", data=data)

    async def update_diary_entry(self, entry_id: str, data: dict) -> dict:
        """Update (complete / reschedule) a diary entry via telegram-friendly endpoint."""
        return await self.put(f"/diary/{entry_id}/telegram", data=data)

    # ------------------------------------------------------------------
    # Briefing endpoints
    # ------------------------------------------------------------------

    async def get_morning_briefing(self, telegram_id: int) -> dict:
        """Get today's morning briefing for the ADM."""
        return await self.get(f"/adm/{telegram_id}/briefing")

    # ------------------------------------------------------------------
    # Training endpoints
    # ------------------------------------------------------------------

    async def get_training_categories(self) -> dict:
        """Get available training categories."""
        return await self.get("/training/categories")

    async def get_training_products(self, category: str) -> dict:
        """Get products within a training category."""
        return await self.get(f"/training/categories/{category}/products")

    async def get_product_summary(self, product_id: str) -> dict:
        """Get AI-generated product summary."""
        return await self.get(f"/training/products/{product_id}/summary")

    async def get_quiz(self, product_id: str) -> dict:
        """Get quiz questions for a product."""
        return await self.get(f"/training/products/{product_id}/quiz")

    async def submit_quiz_result(self, data: dict) -> dict:
        """Submit quiz results."""
        return await self.post("/training/quiz/submit", data=data)

    # ------------------------------------------------------------------
    # AI / Product Q&A
    # ------------------------------------------------------------------

    async def ask_product_question(self, telegram_id: int, question: str) -> dict:
        """Ask an AI-powered product question."""
        return await self.post("/ai/ask", data={
            "telegram_id": telegram_id,
            "question": question,
        })

    # ------------------------------------------------------------------
    # Feedback Ticket endpoints (new workflow)
    # ------------------------------------------------------------------

    async def get_reason_taxonomy(self) -> dict:
        """Get feedback reason taxonomy by bucket (for pick-and-choose UI)."""
        return await self.get("/feedback-tickets/reasons/by-bucket")

    async def submit_feedback_ticket(self, data: dict) -> dict:
        """Submit a feedback ticket through the new workflow."""
        return await self.post("/feedback-tickets/submit", data=data)

    async def get_feedback_tickets(self, adm_id: int = None) -> dict:
        """Get feedback tickets for an ADM."""
        params = {}
        if adm_id:
            params["adm_id"] = adm_id
        return await self.get("/feedback-tickets/", params=params)

    async def rate_script(self, ticket_id: str, rating: str, feedback: str = "") -> dict:
        """Rate a generated communication script."""
        return await self.post(f"/feedback-tickets/{ticket_id}/rate-script", data={
            "rating": rating,
            "feedback": feedback,
        })

    async def get_adm_tickets(self, adm_id: int) -> dict:
        """Get open feedback tickets for an ADM."""
        return await self.get("/feedback-tickets/", params={"adm_id": adm_id, "limit": 20})

    async def close_ticket(self, ticket_id: str) -> dict:
        """Close a feedback ticket."""
        return await self.post(f"/feedback-tickets/{ticket_id}/close")


# Module-level singleton
api_client = APIClient()
