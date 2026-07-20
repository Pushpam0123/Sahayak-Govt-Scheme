# Sahayak — Implementation Plan (for the building agent)

You are building Sahayak, a citation-grounded RAG assistant for government scheme discovery. Read [ARCHITECTURE.md](ARCHITECTURE.md) fully before writing any code — it fixes the stack, repo layout, data model, pipeline designs, and API contracts. [plan.md](plan.md) has the product context. This file tells you **what to build, in what order, and how to work**.

---

## Working rules (follow these throughout)

1. **Git discipline — commit after every small completed task.** Each numbered task below (e.g. 1.3) is roughly one commit; if a task naturally splits into smaller working states, commit each. Never batch a whole phase into one commit.
   - Initialize the repo at the very start (`git init`, first commit = scaffold docs).
   - Commit messages: conventional style — `feat(ingest): heading-aware chunker`, `fix(api): rrf tie-break`, `test(matcher): boundary cases`, `docs: eval methodology`.
   - Commit only working states: code compiles, existing tests pass. Run `make test` (or at minimum the affected module's tests) before committing.
2. **Do not proceed to the next phase until the current phase's acceptance criteria pass.** Verify them yourself (run the command, hit the endpoint) — don't assume.
3. **Secrets**: never commit real keys. `.env` is gitignored; keep `.env.example` current whenever you add a config variable. If an external API key (Anthropic, Voyage) is missing at runtime, build against the interface, mock in tests, and note in README what's needed to run live.
4. **Tests ride along with the code they test** — in the same commit or the immediately following one, not deferred to a "testing phase".
5. **Update docs as you go**: if reality forces a deviation from ARCHITECTURE.md, change ARCHITECTURE.md in the same commit and note why in the commit body.
6. **Keep a `PROGRESS.md`** at repo root: after each phase, one short section — what was completed, what's deferred, any deviations. This is your handoff log.
7. **Data honesty**: only ingest documents from official/open portals (myscheme.gov.in and ministry sites). Store source URL and fetch date with everything. If live fetching is blocked, download a handful manually-obtainable public PDFs and record their provenance.

---

## Phase 0 — Scaffold & infrastructure

Goal: `docker compose up` → healthy API + web shell; CI green.

- [ ] 0.1 `git init`; commit plan.md, ARCHITECTURE.md, IMPLEMENTATION.md, `.gitignore` (python, node, `.env`, raw data dirs).
- [ ] 0.2 Repo skeleton per ARCHITECTURE.md §2: `api/`, `ingest/`, `eval/`, `web/`, `infra/`, `Makefile`, `.env.example`. Python managed with `uv` (or pip-tools), one `pyproject.toml` covering api/ingest/eval.
- [ ] 0.3 `infra/docker-compose.yml`: `db` (pgvector/pgvector:pg16), `api`, `web`. Volumes for pg data; healthchecks.
- [ ] 0.4 FastAPI app with `GET /api/v1/health` (checks DB connection); async SQLAlchemy session setup; alembic initialized with an empty baseline migration.
- [ ] 0.5 Vite + React + TS + Tailwind shell in `web/` rendering a placeholder page that calls `/health`.
- [ ] 0.6 Makefile targets: `up`, `down`, `test`, `lint` (ruff + mypy for python, eslint/tsc for web), `ingest`, `eval` (stubs ok for last two).
- [ ] 0.7 GitHub Actions: lint + pytest on push (postgres service container).

**Acceptance:** `make up` → health returns ok from browser; `make test` and `make lint` pass; CI config valid.

## Phase 1 — Ingestion pipeline (20 real schemes)

Goal: `make ingest` populates chunks + embeddings idempotently.

- [ ] 1.1 Alembic migration: `schemes`, `documents`, `chunks` tables (+ pgvector extension, GIN index on `tsv`, vector index on `embedding`).
- [ ] 1.2 Corpus manifest `ingest/corpus.yaml`: 20 real central/state schemes (PM-KISAN, PMAY, Ayushman Bharat, NSP scholarships, state pensions, etc.) with name, state, category, official URL, document source URL.
- [ ] 1.3 Fetcher: download + store raw files under `data/raw/` (gitignored), checksum into `documents`; unchanged checksum → skip (log it).
- [ ] 1.4 Cleaner: PDF→text (pdfplumber) and HTML→text (trafilatura); tables → markdown; unit tests on 2–3 fixture files committed under `ingest/tests/fixtures/`.
- [ ] 1.5 Heading-aware chunker per ARCHITECTURE.md §4.1 (400–800 tokens, overlap, never split tables, `heading_path`). Unit tests: boundaries, table preservation, overlap.
- [ ] 1.6 Embedder interface + Voyage implementation + deterministic fake for tests; batch embedding with retry/backoff.
- [ ] 1.7 Pipeline CLI (`python -m ingest run [--scheme X]`) wiring fetch→clean→chunk→embed→persist; `make ingest`.
- [ ] 1.8 Chunk-browser: `GET /api/v1/search` skeleton listing chunks per document + a minimal web page to eyeball chunk quality.

**Acceptance:** 20 schemes ingested; rerunning `make ingest` inserts nothing new; chunk browser shows clean, well-bounded chunks (spot-check tables).

## Phase 2 — Hybrid retrieval + eval harness

Goal: measured retrieval; `make eval` writes EVALS.md; RRF beats vector-only.

- [ ] 2.1 Vector search service (cosine top-20, optional state/category filters).
- [ ] 2.2 FTS search (`websearch_to_tsquery` + `ts_rank_cd`, same filters).
- [ ] 2.3 RRF merge (k=60) with unit tests (disjoint lists, ties, filters); wire into `GET /api/v1/search`.
- [ ] 2.4 Golden set: 50+ cases in `eval/golden/*.yaml` per ARCHITECTURE.md §4.6 — include exact-name questions ("PM-KISAN"), paraphrases, Hindi questions, and ≥5 out-of-corpus questions.
- [ ] 2.5 Harness: Recall@5 for vector-only, FTS-only, and hybrid; results table appended to `EVALS.md` with git SHA; row into `eval_runs` (new migration for `eval_cases`, `eval_runs`).
- [ ] 2.6 CI smoke: 10-case retrieval eval with the fake embedder skipped OR live gated on secret availability — document choice.

**Acceptance:** `make eval` produces EVALS.md; hybrid Recall@5 ≥ 0.8 and > vector-only. If below, iterate on chunking/query handling **before** Phase 3 and record improvements as EVALS.md rows.

## Phase 3 — Grounded chat with citations

Goal: cited answers in the UI; out-of-corpus questions refused.

- [ ] 3.1 Claude client wrapper (`api/llm/`): model names + max tokens from env/config, retry, token usage capture.
- [ ] 3.2 Grounded answer service per ARCHITECTURE.md §4.3: strict system prompt, numbered context, refusal path, answer-language = question-language. Prompt lives in a versioned file (`api/llm/prompts/answer.md`).
- [ ] 3.3 Citation parser: answer → sentences with `[n]` citation lists mapped to chunk metadata; tolerant of malformed citations (log + drop, never crash).
- [ ] 3.4 `POST /api/v1/chat` endpoint + `qa_logs` migration; log everything per schema including latency and tokens.
- [ ] 3.5 Chat UI: message thread, streaming or spinner, citation superscripts, right-hand citation panel (source URL, heading path, quoted chunk text), refusal styling.
- [ ] 3.6 Faithfulness + citation-precision metrics added to the eval harness (LLM-as-judge, pinned Haiku-class model, temperature 0, rubric in `eval/rubrics/faithfulness.md`).

**Acceptance:** manual probe — 10 in-corpus questions answered with correct clickable citations; 5 out-of-corpus questions refused; `make eval` faithfulness ≥ 0.9.

## Phase 4 — Groundedness verification

Goal: unsupported sentences visibly flagged; metric in eval.

- [ ] 4.1 Groundedness service per ARCHITECTURE.md §4.4: per-sentence entailment check against cited chunks → supported/partial/unsupported; annotates, never rewrites.
- [ ] 4.2 Wire into `/chat` response + `qa_logs.groundedness_json`; config flag to disable (cost control in dev).
- [ ] 4.3 UI badges: warning icon + tooltip on partial/unsupported sentences.
- [ ] 4.4 Seeded regression test: a deliberately bad-citation fixture answer must come back flagged.
- [ ] 4.5 Groundedness rate added to eval + EVALS.md.

**Acceptance:** seeded bad citation flagged in UI and by tests; eval reports citation precision + groundedness.

## Phase 5 — Eligibility engine

Goal: profile form → auditable ranked matches, no LLM verdicts.

- [ ] 5.1 Migrations: `criteria`, `profiles`, `matches`.
- [ ] 5.2 Extraction pipeline (`ingest/extract_criteria.py`): JSON-schema tool call, fixed field/op vocabulary (ARCHITECTURE.md §3), verbatim `source_quote` validation (reject non-substrings), confidence; rows land `status='pending'`.
- [ ] 5.3 Admin review: `GET /admin/criteria`, `POST /admin/criteria/{id}/review` (approve/reject/edit), `ADMIN_TOKEN` header; minimal admin page listing pending rows with source quote next to editable fields.
- [ ] 5.4 Deterministic matcher as a pure function; exhaustive unit tests: boundary values (age exactly at limit), unknown fields → possibly_eligible, failed criteria recorded for "you'd qualify if…".
- [ ] 5.5 Profile endpoints (`POST /profiles`, `GET /profiles/{id}/matches`) + guided multi-step form UI (age, state, occupation, income band, gender, category, disability, land holding) → ranked results with per-scheme "you qualify because… / you'd qualify if…" rendered from matcher output (template text, not LLM).
- [ ] 5.6 Run extraction on all 20 schemes; review/approve criteria (as the agent, approve only rows whose source quote clearly supports them; leave doubtful ones pending and note in PROGRESS.md).

**Acceptance:** end-to-end: fill form → ranked matches with explanations; matcher test suite green; every approved criterion has a verifiable source quote.

## Phase 6 — Multilingual, cost logging, polish, README

Goal: Hindi end-to-end; portfolio-grade README.

- [ ] 6.1 Query translation path (Hindi→English before retrieval; answer generated in Hindi). Hindi eval cases measured in EVALS.md.
- [ ] 6.2 UI language toggle (English/Hindi) — labels via a small i18n dict; form options translated.
- [ ] 6.3 Per-request cost accounting: token counts → estimated cost in `qa_logs`; simple `/admin/usage` summary.
- [ ] 6.4 Error handling & rate limiting pass: graceful LLM-failure messages, request timeout budget, basic per-session rate limit.
- [ ] 6.5 README.md: problem, demo GIF, architecture diagram, eval methodology + latest EVALS table, key design decisions (from ARCHITECTURE.md §6), setup instructions, honest limitations.
- [ ] 6.6 Final sweep: `make lint`, `make test`, `make eval` all green; PROGRESS.md completed.

**Acceptance:** Hindi question → Hindi grounded answer with citations; README complete; all Make targets pass.

## Phase 7 (V2 — only if explicitly requested)

Voice input (browser STT), WhatsApp webhook bot, or document freshness monitor — pick one, demo end-to-end. Do not start V2 features before Phases 0–6 are fully accepted.

---

## Definition of done (whole project)

- All phase acceptance criteria verified and recorded in PROGRESS.md.
- EVALS.md shows metric history across commits (not just one final row).
- Fresh clone + `.env` + `make up && make ingest && make eval` reproduces the system.
- No secrets in git history; no PII stored anywhere.
