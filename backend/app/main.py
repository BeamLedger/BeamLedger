from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .api import auth, organizations, sites, zones, fixtures, rules, replacements, analytics

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Outdoor Lighting Compliance API")

# Enable CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


@app.get("/")
def root():
    return {"message": "Outdoor Lighting Compliance API"}