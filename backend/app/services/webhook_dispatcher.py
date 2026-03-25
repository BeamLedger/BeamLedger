"""Webhook dispatcher — delivers event payloads to registered webhook URLs."""

import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone

import httpx
from sqlalchemy.orm import Session

from ..models.webhook import Webhook

logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 10


async def dispatch_webhook(
    db: Session,
    organization_id: str,
    event_type: str,
    payload: dict,
) -> list[dict]:
    """Send event payload to all active webhooks for the organization that subscribe to event_type."""
    webhooks = (
        db.query(Webhook)
        .filter(Webhook.organization_id == organization_id, Webhook.is_active == True)
        .all()
    )

    results = []
    body = json.dumps(payload, default=str)

    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        for wh in webhooks:
            # Check if webhook subscribes to this event
            subscribed_events = [e.strip() for e in (wh.events or "").split(",") if e.strip()]
            if "*" not in subscribed_events and event_type not in subscribed_events:
                continue

            # Compute HMAC signature
            signature = hmac.new(
                (wh.secret or "").encode(),
                body.encode(),
                hashlib.sha256,
            ).hexdigest()

            headers = {
                "Content-Type": "application/json",
                "X-BeamLedger-Signature": signature,
                "X-BeamLedger-Event": event_type,
            }

            try:
                resp = await client.post(wh.url, content=body, headers=headers)
                results.append({
                    "webhook_id": wh.id,
                    "url": wh.url,
                    "status": resp.status_code,
                    "success": 200 <= resp.status_code < 300,
                })
                logger.info("Webhook %s delivered to %s — %d", wh.id, wh.url, resp.status_code)
            except Exception as exc:
                results.append({
                    "webhook_id": wh.id,
                    "url": wh.url,
                    "status": 0,
                    "success": False,
                    "error": str(exc),
                })
                logger.error("Webhook %s delivery failed to %s: %s", wh.id, wh.url, exc)

    return results
