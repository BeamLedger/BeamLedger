# BeamLedger

BeamLedger is a SaaS platform for managing outdoor lighting compliance across municipalities, HOAs, campuses, utilities, and contractor operations.

The platform helps teams inventory lighting assets, evaluate ordinance compliance, identify glare and uplight risks, and build replacement plans aligned with responsible outdoor-lighting standards.

## Core Capabilities

- Centralized outdoor lighting inventory management
- Site, zone, and fixture-level organization
- Compliance evaluation against configurable lighting rules
- Glare, uplight, and shielding risk flagging
- Replacement planning and upgrade recommendations
- Dashboard analytics and reporting
- CSV import and export workflows
- PDF-ready compliance reporting
- Multi-organization SaaS architecture

## Target Users

- Municipalities
- Homeowners associations
- Campuses
- Utilities
- Outdoor-lighting contractors
- Compliance and planning teams

## Features

- **Authentication** – Secure registration, login and logout with JWT tokens, bcrypt password hashing and token expiry.
- **Multi-Organization Support** – Users can belong to multiple organizations and switch between them.
- **Inventory Management** – Robust CRUD APIs for sites, zones and fixtures with strict validation and authorization checks.
- **Configurable Ordinances** – Each organization defines its own compliance rules (CCT limits, lumens, shielding and tilt thresholds) via CRUD endpoints.
- **Compliance Engine** – Fixtures are automatically evaluated against the active ordinance rules returning **pass**, **warn** or **fail** along with detailed reasons and risk flags.
- **CSV Import/Export** – Bulk import fixture inventories from CSV files with row-level validation and duplicate protection; export current inventories to CSV for offline analysis.
- **PDF Report Export** – Download PDF reports for individual fixtures summarizing metadata, compliance status and reasons for failure.
- **Replacement Planning** – Track recommended replacements for non-compliant fixtures including proposed type, estimated wattage reduction, cost and planning status.
- **Dashboard & Analytics** – Summarised statistics for each organization: counts of compliant/non-compliant fixtures and glare/uplight risk metrics.
- **Seed Data & Tests** – Realistic demo data is provided via a seed script. Tests cover authentication, CRUD operations and CSV import/export.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **Backend**: FastAPI, SQLAlchemy 2.0, PostgreSQL (SQLite for local dev)
- **Auth**: JWT with bcrypt password hashing
- **Dev**: Docker & docker-compose for reproducible local environments

## Prerequisites

- Python 3.11+ and Node.js 18+ (for local development), **or**
- [Docker](https://www.docker.com/get-started/) and [docker-compose](https://docs.docker.com/compose/)

## Running Locally (without Docker)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/EricHibbsGH/BeamLedger.git
   cd BeamLedger
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```
   For local development the backend `.env` defaults to SQLite — no PostgreSQL required.

3. **Install backend dependencies and start the API:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000` (interactive docs at `/docs`).

4. **Install frontend dependencies and start the dev server** (in a second terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`.

5. **Seed the database (optional):**
   ```bash
   cd backend
   python scripts/seed_data.py
   ```
   This creates a demo user (`admin@example.com` / `password`), organization, sites, fixtures and a compliance rule.

6. **Run tests:**
   ```bash
   cd backend
   pytest tests/ -v
   ```

## Running with Docker Compose

```bash
cp .env.example .env
docker-compose up --build
```
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`

## Project Structure

```
BeamLedger/
├── backend/
│   ├── app/
│   │   ├── api/             # API routers (auth, fixtures, sites, zones, rules, etc.)
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Business logic (compliance engine, user service)
│   │   ├── database/        # DB engine, session factory
│   │   ├── utils/           # Security helpers (JWT, bcrypt)
│   │   └── main.py          # FastAPI app entry point
│   ├── tests/               # Backend test suite
│   ├── scripts/             # Seed data script
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   ├── lib/                 # API client (axios)
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## License

Proprietary. All rights reserved.
