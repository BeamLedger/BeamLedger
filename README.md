# BeamLedger

Outdoor lighting compliance management platform.

BeamLedger helps municipalities, HOAs, campuses, utilities, and lighting contractors inventory outdoor fixtures, evaluate ordinance compliance, flag glare and uplight risks, and plan replacements — all from a single multi-tenant dashboard.

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+

### 1. Environment Setup

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env` and set a real `JWT_SECRET` (any random string, 32+ characters). The default database is SQLite — no Postgres needed for local dev.

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
python scripts/seed_data.py                        # demo data (admin@example.com / password)
uvicorn app.main:app --reload --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend

```bash
cd frontend
npm install
npm run dev -- --port 3001
```

App: [http://localhost:3001](http://localhost:3001)

### 4. Tests

```bash
cd backend
pytest tests/ -v
```

## What It Does

| Feature | Description |
|---------|-------------|
| **Inventory** | CRUD for organizations, sites, zones, and fixtures with membership-scoped access |
| **Compliance Engine** | Evaluates fixtures against configurable ordinance rules (CCT, lumens, shielding, tilt) |
| **CSV Import/Export** | Bulk fixture upload with row-level validation; export to CSV |
| **PDF Reports** | Per-fixture compliance reports with status and failure reasons |
| **Replacement Plans** | Track proposed replacements with cost and wattage-reduction estimates |
| **Analytics** | Org-level pass/warn/fail counts, glare risk, and uplight risk metrics |
| **Auth** | JWT + bcrypt, multi-org membership, per-endpoint authorization |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, TailwindCSS |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic v2 |
| Database | PostgreSQL (prod) / SQLite (dev) |
| Auth | JWT + bcrypt |
| Infra | Docker & docker-compose |

## Project Layout

```
backend/
  app/
    api/          Routes: auth, organizations, sites, zones, fixtures, rules, replacements, analytics
    models/       SQLAlchemy ORM models
    schemas/      Pydantic request/response schemas
    services/     Compliance engine, user service
    database/     Engine, session factory
    utils/        JWT + password helpers
  tests/          pytest suite
  scripts/        seed_data.py
frontend/
  app/            Next.js App Router pages (login, register, dashboard)
  components/     Navbar
  lib/            Axios API client
```

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `JWT_SECRET` | backend/.env | **Required.** Signing key for JWT tokens |
| `JWT_ALGORITHM` | backend/.env | Default `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | backend/.env | Default `60` |
| `DATABASE_URL` | backend/.env | Default `sqlite:///./lighting.db` |
| `ALLOWED_ORIGINS` | backend/.env | Comma-separated CORS origins (default: `http://localhost:3001`) |
| `NEXT_PUBLIC_API_URL` | frontend/.env.local | Backend URL (default: `http://localhost:8000`) |

## Docker Compose (Alternative)

```bash
cp .env.example .env
docker-compose up --build
```

Backend on `:8000`, frontend on `:3001`.

## Typography

BeamLedger uses **Ubin Sans** by [Wahyu Eka Prasetya](https://www.cufonfonts.com/font/ubin-sans). Free for personal and commercial use.

Font files (`UbinSans-Yq5Aa.woff`, `UbinSans-Yq5Aa.otf`) are self-hosted in `frontend/public/fonts/`.

## License

Proprietary. All rights reserved.
