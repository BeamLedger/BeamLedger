"""Activity logging service."""

import json
from typing import Optional
from sqlalchemy.orm import Session
from ..models.activity_log import ActivityLog


def log_activity(
    db: Session,
    organization_id: int,
    action: str,
    summary: str,
    user_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    details: Optional[dict] = None,
) -> ActivityLog:
    """Create an activity log entry."""
    entry = ActivityLog(
        user_id=user_id,
        organization_id=organization_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        summary=summary,
        details=json.dumps(details) if details else None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
