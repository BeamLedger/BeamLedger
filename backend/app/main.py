import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .api import auth, organizations, sites, zones, fixtures, rules, replacements, analytics
from .api import activity, integrations, roi
from .models.import_audit import ImportAudit  # ensure table creation
from .models.activity_log import ActivityLog  # noqa
from .models.comment import Comment  # noqa
from .models.api_key import ApiKey  # noqa
from .models.webhook import Webhook  # noqa
from .models.fixture_change import FixtureChange  # noqa

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="BeamLedger API")

# CORS — restrict to known frontend origins; override via ALLOWED_ORIGINS env var (comma-separated).
_default_origins = ["http://localhost:3001", "http://localhost:3000"]
_allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else _default_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(sites.router)
app.include_router(zones.router)
app.include_router(fixtures.router)
app.include_router(rules.router)
app.include_router(replacements.router)
app.include_router(analytics.router)
app.include_router(activity.router)
app.include_router(integrations.router)
app.include_router(roi.router)


@app.get("/")
def root():
    return {"message": "BeamLedger API"}