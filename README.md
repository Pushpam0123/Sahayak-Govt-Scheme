# Sahayak — Government Scheme Assistant & Eligibility Matcher

Sahayak is an open-source, cited Retrieval-Augmented Generation (RAG) assistant and eligibility matchmaking platform built to help Indian citizens discover, understand, and apply for government welfare schemes.

Navigating welfare programs can be challenging due to scattered guidelines, complex criteria (income bands, age limits, caste categories, landholding sizes), and language barriers. Sahayak solves this by providing grounded answers linked directly to verified official government documents, alongside a privacy-first eligibility screener.

---

## Key Features

### 1. Hybrid Retrieval & Grounded Answer Synthesis
- **Hybrid Search**: Combines dense vector similarity (`pgvector` with HNSW cosine indexing) and sparse full-text search (PostgreSQL `tsvector` with GIN indexing) ranked using Reciprocal Rank Fusion (RRF).
- **Sentence-Level Inline Citations**: Every generated statement links directly to specific clauses in verified official scheme documents.
- **Two-Pass Verification**: A second-pass evaluation checks generated statements against retrieved context to flag unsupported or ambiguous claims before reaching the citizen.

### 2. Deterministic Eligibility Matchmaker
- **Rule Evaluation Engine**: Matches citizen demographic inputs (age, state of residence, gender, caste, annual household income, and landholding size) against structured eligibility rules.
- **Transparent Outcomes**: Provides clear explanations for eligibility status (`eligible`, `ineligible`, `unknown`), highlighting exact qualifying criteria or unmet rules.

### 3. Inclusive & Accessible Frontend
- **Multilingual Support**: Built-in translation and language support across English, Hindi (हिंदी), Bengali (বাংলা), Marathi (मराठी), Telugu (తెలుగు), and Tamil (தமிழ்).
- **Speech-to-Text & Text-to-Speech**: Voice input and audio read-aloud capabilities for low-literacy accessibility.
- **Accessibility Modes**: High-contrast theme and fluid font scaling (100% to 150%) adhering to WCAG AA accessibility standards.
- **Offline PWA with Provenance**: Progressive Web App with service worker caching. Clearly displays cache storage timestamps so citizens always know the provenance of saved information when offline.

### 4. Privacy & Data Protection (DPDP Act 2023)
- **Local-First Citizen Data**: Demographic data is retained in local storage and only transmitted statelessly for matching.
- **One-Click Erasure**: Citizens can purge stored profile data and saved applications instantly from their device.

### 5. Production Hardening & Security
- **Authentication**: JWT Bearer tokens with salted bcrypt password hashing and SHA-256 hashed B2B API keys.
- **Redis Rate Limiting**: Distributed sliding-window rate limiting keyed by User ID, API Key, or Client IP.
- **Sanitized Errors**: Strict error taxonomy returning clean generic errors to clients with unique `X-Request-ID` headers for server tracebacks.

---

## Architecture Overview

```mermaid
graph TD
    User([Citizen / Operator]) -->|Web App / Voice / PWA| Gateway[FastAPI Gateway]
    Gateway -->|Rate Limiter Check| Redis[(Redis Rate Limiter)]
    Gateway -->|Authentication / Keys| Auth[Auth Service]
    Gateway -->|Query / Chat Stream| Chat[Chat & Retrieval Pipeline]
    
    subgraph "Hybrid Retrieval Pipeline"
        Chat -->|Dense Semantic Search| PGVector[(PostgreSQL + pgvector)]
        Chat -->|Sparse Full-Text Search| PGFTS[(PostgreSQL Full-Text GIN)]
        PGVector --> RRF[Reciprocal Rank Fusion]
        PGFTS --> RRF
    end
    
    RRF -->|Top Document Context| Synthesis[LLM Answer Synthesis]
    Synthesis -->|Grounded Citations| Verifier[Groundedness Claim Verifier]
    Verifier -->|Audited Stream Response| User

    Gateway -->|Demographics Matching| Eligibility[Eligibility Rules Matcher]
    Eligibility -->|Query Rules| DB[(PostgreSQL Database)]
```

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Vanilla CSS Design System, Web Speech API, Service Workers (PWA).
- **Backend**: FastAPI, Python 3.10+, SQLAlchemy (Asyncpg), Pydantic v2, Alembic.
- **Database & Search**: PostgreSQL 16 with `pgvector` extension.
- **Caching & Rate Limiting**: Redis 7.
- **LLM & Embeddings**: Configurable endpoints (Gemini / Anthropic / Local models).

---

## Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js 18+](https://nodejs.org/) (for running web frontend)
- [Python 3.10+](https://www.python.org/) (optional, for local development outside Docker)

---

### Step 1: Clone and Configure Environment

Clone the repository:
```bash
git clone https://github.com/Pushpam0123/Sahayak-Govt-Scheme.git
cd Sahayak-Govt-Scheme
```

Copy the example environment file:
```bash
cp .env.example .env
```

Ensure your `.env` contains secure tokens and credentials:
```env
# Database & Cache
DATABASE_URL=postgresql+asyncpg://sahayak:sahayak_password@localhost:5433/sahayak
REDIS_URL=redis://localhost:6379/0

# Security (Required)
ADMIN_TOKEN=your-secure-admin-token-here
JWT_SECRET=your-secure-jwt-secret-key-here

# LLM API Keys (optional if using mock mode)
GEMINI_API_KEY=your-gemini-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

---

### Step 2: Start Services via Docker Compose

Start the PostgreSQL database and Redis cache:
```bash
docker compose up -d db redis
```

---

### Step 3: Database Migrations & Ingestion

Run the Alembic migrations to set up all tables and vector schemas:
```bash
# Setup Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -e .

# Run database migrations
alembic upgrade head

# Ingest guidelines and seed eligibility rules
python -m ingest.run
python -m api.seed_eligibility
```

---

### Step 4: Run the Backend API Server

Start the FastAPI application:
```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```
The API interactive documentation will be available at `http://localhost:8000/docs`.

---

### Step 5: Run the Web Frontend

In a separate terminal, start the Next.js development server:
```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verified Scheme Corpus

The system indexes verified guideline documents for key government schemes:
1. **PM-KISAN** (Pradhan Mantri Kisan Samman Nidhi)
2. **PM-SYM** (Pradhan Mantri Shram Yogi Maandhan)
3. **PM-JJBY** (Pradhan Mantri Jeevan Jyoti Bima Yojana)
4. **PM-PMSBY** (Pradhan Mantri Suraksha Bima Yojana)
5. **PMMVY** (Pradhan Mantri Matru Vandana Yojana)
6. **Ayushman Bharat** (PM-JAY)
7. **PM SVANidhi** (Street Vendor's AtmaNirbhar Nidhi)
8. **Atal Pension Yojana** (APY)
9. **Sukanya Samriddhi Yojana** (SSY)

---

## API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/healthz` | API liveness probe |
| `GET` | `/api/v1/readyz` | Database readiness check |
| `POST` | `/api/v1/auth/register` | Register citizen or organization account |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT access token |
| `GET` | `/api/v1/auth/me` | Retrieve current authenticated caller identity |
| `POST` | `/api/v1/auth/api-keys` | Generate hashed B2B API key (shown once) |
| `GET` | `/api/v1/schemes` | List all verified schemes |
| `GET` | `/api/v1/schemes/{id}` | Get scheme detail and guidelines |
| `POST` | `/api/v1/eligibility/match-all` | Match citizen demographics against scheme rules |
| `POST` | `/api/v1/chat` | Submit question and get cited answer |
| `POST` | `/api/v1/chat/stream` | Server-Sent Events (SSE) streaming answer |
| `GET` | `/api/v1/search` | Search chunks via hybrid RRF search |

---

## Running Tests

To run the automated backend test suite:
```bash
pytest
```

---

## License

This project is licensed under the MIT License.
