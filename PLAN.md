# Sahayak — Engineering Plan

**Thesis:** Sahayak never presents invented text as a government source, and never tells a
citizen they are eligible when we don't know. Every claim is traceable to a document that was
actually fetched, hashed and recorded. Where we don't know, we say so.

---

## 1. What Sahayak is

A cited, grounded RAG assistant plus a structured eligibility engine over Indian government scheme guidelines. FastAPI + Postgres/pgvector on the backend, React 19 + Tailwind v4 on the frontend.

**What already works and must survive every refactor:**

- Hybrid retrieval — pgvector cosine + Postgres FTS fused with Reciprocal Rank Fusion, deterministic tie-break (`api/services/retrieval.py`)
- Second-pass sentence-level groundedness auditing (`api/services/groundedness.py`)
- Per-request token and cost accounting into `qa_logs`
- The eval harness and golden-set structure (`eval/`)
- The CSS design-token system (`web/src/index.css`) and UI primitives (`web/src/components/ui.tsx`)

---

## 2. Competitive reality

**myScheme.gov.in** is the government's own scheme discovery portal. It already has: multi-state scheme catalogue, per-scheme yes/no eligibility questionnaires, and a voice-enabled multilingual AI chatbot. We are not entering an empty market.

**Where Sahayak can actually win:**

| Differentiator | Why it matters |
| --- | --- |
| **Cited, auditable answers** | myScheme's chatbot answers without sentence-level source citations or a groundedness audit. For a benefit decision, "here is the clause that says so" is the product. |
| **One-pass cross-scheme matching** | myScheme makes you check schemes one at a time. Sahayak takes one profile and screens the whole catalogue at once, including near-misses. |
| **The operator workflow** | myScheme is built for a citizen acting alone. Nobody serves the CSC operator, NGO field worker or bank correspondent who does this thirty times a day and needs caseload, batch screening and a printable report. |

**Target customer, in order:** assisted-service operators (CSC, panchayat, NGO, bank correspondents) → metered eligibility API → citizens direct.

---

## 3. Frontend design direction

### 3.1 Options considered

| Direction | Verdict |
| --- | --- |
| **Linear / shadcn SaaS** — dark-first, subtle gradients, bento grids, animated beams, Inter | **Rejected.** It's the current default look, so it reads as generic, and it's aimed at desktop knowledge workers. Wrong for a farmer on a ₹8,000 Android on 3G. |
| **GOV.UK institutional** — black on white, huge type, zero decoration | **Rejected as a whole, adopted in part.** The information architecture and typographic discipline are exactly right. The austere visual identity is not: Sahayak is not a government body and should not dress like one — that's a trust problem, not a trust signal. |
| **Warm civic** — GOV.UK bones, consumer-fintech confidence | **Selected.** See below. |

### 3.2 The selected direction: Warm Civic

> GOV.UK's structural discipline, wearing the warmth and confidence of a good Indian payments app.

Three pillars:

**1. Plain and large.** One question per screen. Plain language at a reading age of ~9. Minimum 16px body, 48px tap targets, generous line height. Nothing decorative that doesn't carry information.

**2. The money is the hero.** A benefit amount is rendered the way a payments app renders a balance — large, tabular numerals, unmissable. "You may be entitled to ₹6,000 a year" is the emotional centre of the product and should be the largest thing on the results screen.

**3. Color is semantics, not decoration.** One confident brand accent for actions and navigation. Green / amber / grey reserved strictly for the three eligibility states. No gradient heroes, no ambient animation.

### 3.3 Concrete design decisions

**Typography — Noto Sans across every script.**
We must ship 10–12 Indian languages. A characterful display face that covers Latin and Devanagari will not cover Bengali, Tamil, Telugu, Kannada, Malayalam, Odia, Gujarati, Punjabi and Urdu — the page would silently fall back and look broken in half our markets. So: **Noto Sans (variable) as the single family across all scripts**, with the per-script Noto subsets loaded on demand by language. Modernity comes from the type scale, weight contrast (400 / 600 / 800) and spacing, not from a novelty face. `IBM Plex Mono` on operator and admin surfaces only. Use `font-variant-numeric: tabular-nums` on every rupee figure.

**Color — evolve the existing tokens, don't replace them.**
`web/src/index.css` already has a well-built light/dark token system. Keep the structure. Three changes:
- Warm the neutrals. `--page: #eef2f8` is a cold clinical blue-grey; shift it warm so the product feels human rather than administrative.
- Keep a blue-family primary (trust, and it's already wired through every component).
- Demote `--saffron` and `--leaf` from general accents to strictly semantic use. Flag-adjacent colors used decoratively read as institutional or nationalist; used semantically they read as status.

**Components — adopt Radix where accessibility is hard, keep what works.**
Bring in shadcn/ui (Radix primitives) for dialog, select, popover, slide-over, accordion and tabs — focus management and ARIA on these are genuinely hard to hand-roll and we have an accessibility-critical audience. Keep the existing `Button`, `Card`, `Badge`, `Field`, `TextInput`, `Segmented`. Do not rip out working code for consistency's sake.

**Motion — state transitions only.**
Wizard step changes, streaming text, slide-over entry. No ambient motion, no scroll-triggered reveals. Respect `prefers-reduced-motion`. Every animation must cost less than 16ms of main thread on a low-end device.

**Non-negotiable for this audience:** voice input and read-aloud, 10–12 languages with in-language synthesis (not post-hoc translation), mobile-first at 360px, PWA with an offline shell, persisted font-size and high-contrast controls, PDF and WhatsApp export of results.

---


---

## 4. Roadmap

The numbering is a dependency chain, not a priority list.

### Phase 0 — Truth (~1 week) ← **current**

There is no point building anything on a corpus the system invented. Detail in §5.

### Phase 1 — Hardening (~2 weeks)

- Auth: users, organisations, JWT sessions, API keys for the B2B path. Protect `/admin/*` (`ADMIN_TOKEN` exists in env and is read by nothing).
- Replace `allow_origins=["*"]` + `allow_credentials=True` — that combination is rejected by browsers anyway. Explicit per-environment origin list.
- Exception taxonomy. Stop returning `str(e)` in 500s from every route.
- Redis-backed rate limiter keyed on user/API key, not `request.client.host` (which is the load balancer's IP in production, so everyone shares one bucket).
- `create_async_engine(echo=True)` off outside development.
- Fix N+1s: one `SELECT Document` per result in `routers/search.py`, per citation in `services/chat.py`.
- Prompt caching on the retrieved context block; semantic answer cache keyed on question embedding + filters.
- SSE streaming chat endpoint.
- Conversation memory — `session_id` is logged but never used to build context.
- Structured JSON logs, request IDs, error tracking, liveness/readiness split.

### Phase 2 — Coverage (~3–4 weeks, then ongoing)

- Scale toward 300+ schemes from myscheme.gov.in, india.gov.in and state portals.
- Extend the `Scheme` model with what a citizen actually needs and it currently lacks: benefit amount, benefit type, required documents, application mode, application URL, deadlines, helpline.
- Rule extraction (`services/extractor.py` already drafts these) plus a **human verification queue** in front of `is_verified`.
- Freshness re-crawl marking stale documents; surface "last verified" in the UI.

### Phase 3 — The product (~4 weeks)

Routing, server-state layer, and the screens:

| Route | Screen | Job |
| --- | --- | --- |
| `/` | Landing | One question, one button, language picker, trust markers |
| `/check` | Eligibility wizard | One question per step, voice-answerable, every field skippable |
| `/results` | Your matches | Ranked by benefit value, with a separate near-miss section |
| `/schemes/:id` | Scheme detail | **The missing spine.** Benefit, eligibility checked against your profile, documents, how to apply, official link |
| `/ask` | Chat, rebuilt | Streaming, voice both ways, citations inline, inspector as slide-over on mobile |
| `/saved` | My applications | Saved profile, application tracker, document checklist |
| `/console` | Operator console | Caseload, batch screening, printable report, usage — the revenue surface |
| `/admin/rules` | Rule verification queue | Internal. Approve extracted rules against the source quote |

Plus: React Router, TanStack Query, persisted profile, voice, languages, PWA, sharing. Move latency/token counters and the chunk explorer behind a developer toggle.

### Phase 4 — Launch (~1–2 weeks)

Frontend on Vercel/Cloudflare, API on Fly/Railway, Postgres+pgvector on Neon/Supabase, Redis on Upstash. Staging, migrations on deploy, analytics, uptime monitoring.

**DPDP Act 2023 — not optional.** The moment profiles are persisted we are processing caste, income and gender for identifiable people: explicit consent at collection, stated and limited purpose, retention limits, deletion on request, breach notification. Design it in now. Prefer storing a derived match result over raw caste and income; make consent a step in the wizard, not a footer checkbox.

---


---

## 5. Corpus truth

### The original problem

`ingest/fetcher.py` contained a `generate_mock_guidelines()` fallback that fabricated plausible
HTML — invented eligibility tables, invented benefit amounts — whenever a download failed. That
text was chunked, embedded and indexed identically to a real document, and the UI rendered a
citation linking to the official government URL underneath a sentence the fallback had written.

**That function has been removed.** A failed fetch now fails.


### Full corpus audit — 2026-08-26

All 20 `source_url`s checked live. **Exactly one yields a usable document.**

| Result | Count | Schemes |
| --- | --- | --- |
| **Real document** | **1** | `pm-fby` (200, application/pdf, 1.23 MB) |
| 200 but junk content | 2 | `pm-svanidhi` (15 bytes of javascript), `stand-up-india` (956 bytes of HTML, not the PDF it claims) |
| 404 | 8 | `pm-kisan`, `pm-jjby`, `pm-sby`, `mid-day-meal`, `mp-ladli-behna`, `ka-gruha-jyothi`, `mh-shravan-bal`, `pmay-g` |
| DNS failure — host does not resolve | 9 | `pm-jay`, `nsp-post-matric`, `atal-pension-yojana`, `pm-matru-vandana`, `ts-rythu-bandhu`, `wb-kanyashree`, `ap-ysr-cheyutha`, `odisha-kalia`, `bihar-student-credit-card` |

`data/raw/` does not exist locally, so nothing was ever cached from a successful fetch. **19 of 20 schemes in the product today are built entirely on fabricated text.**

Consequences:

1. **The benchmark measures the wrong thing.** `golden_set.yaml` quotes the fallback text verbatim. 94% Recall@5 and 100% Faithfulness are real measurements of retrieving synthetic documents.
2. **A wrong figure is already ground truth.** The NSP mock says the income ceiling is `₹2,500,000` in prose while its own table says `250000`. The golden answer copied the prose. The real Post-Matric ceiling is ₹2.5 lakh — the eval rewards being off by 10×.
3. **Unknown silently means yes.** `routers/eligibility.py` starts every scheme at `{"eligible": True}` and only downgrades it if a rule row exists. Rules exist for 4 of 20 schemes.


### Where the corpus stands now

Nine schemes, each backed by a guideline document fetched live from its official source, hashed,
and provenance-recorded. Six were retrieved under full TLS verification; three
(`pm-jjby`, `pm-sby`, `atal-pension-yojana`, all on `jansuraksha.gov.in`) required an explicit,
per-scheme, reason-documented `tls_insecure` opt-in because the host serves its leaf certificate
without the intermediate. Those three are marked `tls_verified = false` in the database rather
than being quietly treated as verified.

Full per-scheme audit: [`docs/corpus-audit.md`](docs/corpus-audit.md).

Scaling toward 300+ schemes is Phase 2 and is gated on sourcing plus human rule verification, not
on code. Scraping the myScheme API with a credential lifted from its frontend is explicitly ruled
out; the legitimate path is a formal NeGD / Digital India access request.

---

### 8.3 Route map

**Public — energetic, statically generated, indexed:** `/` homepage · `/services` · `/schemes` browse · `/schemes/[slug]` per-scheme (the pages that rank) · `/for/students`, `/for/farmers`, `/for/entrepreneurs`, `/for/women` audience pages · `/privacy` (DPDP-required and a trust signal).

**App — calm, client-side, not indexed:** `/check` wizard · `/results` · `/ask` chat · `/saved` · `/console` operator · `/admin/rules`.


---
## 7. Current state

Runs locally against Postgres (`:5433`) and Redis (`:6379`): 9 schemes, 9 documents, 233 chunks,
9 verified eligibility rule sets.

| | |
| --- | --- |
| Tests | 110 passing (`api/` + `ingest/`) |
| Type checking | mypy clean across all source files |
| Lint | ruff clean but for one deliberate exception, below |
| Frontend | Next.js 15 App Router, all routes rendering |

**LLM and embeddings both run on Google Gemini**, selected by a single `GEMINI_API_KEY`:

- Chat: `gemini-3.6-flash`. Note that `gemini-2.5-*` returns 404 for keys issued after its
  retirement, so the default must not be pinned to that family.
- Embeddings: `gemini-embedding-001` at **1024 dimensions**, matching the `chunks.embedding`
  pgvector column exactly. The model supports arbitrary widths via Matryoshka truncation, so this
  needs no schema change. The embedder raises rather than writing a vector of the wrong width.
- Gemini 3.x reasons before answering. Thinking tokens are billed as output but reported
  separately as `thoughts_token_count`, and they draw down `max_output_tokens` — so they are added
  to the output count for costing, and the token budget defaults higher than a non-reasoning model
  would need.

Without a key the app falls back to `MockLLMClient` and `MockEmbedder`. Both log loudly, because
the mock returns golden-set answers verbatim and self-reports perfect faithfulness: any metric
produced while it is active is meaningless. See `EVALS.md`.

### The one deliberate lint exception

`N802` on `Settings.ALLOWED_ORIGINS`. It must stay a property (tests mutate `_raw_origins`), and
lowercasing it would make it the only lowercase name among `DATABASE_URL`, `JWT_SECRET` and the
rest. It is left visible rather than silenced with a `# noqa` — suppressing a check to make a
number look clean is the habit this project exists to avoid.

---

## 8. Defects found by running the system

None of these were caught by the test suite; all were found by actually starting the stack.

- **Missing migration.** Five columns (`extracted_by`, `extracted_at`, `verified_by`,
  `verified_at`, `notes`) were declared on `scheme_eligibility_rules` but no migration created
  them, so every query against that table failed with `UndefinedColumnError` on a fresh database.
- **Naive columns with timezone-aware defaults.** `scheme_eligibility_rules` and `qa_logs`
  declared naive `DateTime` while defaulting to `datetime.now(timezone.utc)`; asyncpg rejects that
  outright. Both are now `DateTime(timezone=True)`. `documents` and `schemes` deliberately stay
  naive — `ingest/run.py` converts through an explicit `_naive_utc()` helper at every call site.
- **`alembic --autogenerate` proposed dropping the search indexes.** `ix_chunks_embedding` (HNSW)
  and `ix_chunks_tsv` (GIN) are created outside the ORM metadata, so autogenerate reads them as
  removals. Applying a generated migration unedited would silently destroy vector and full-text
  search. **Always read an autogenerated migration before applying it.**
- **Case-sensitive eligibility matching.** State, gender and caste were compared exactly, so an
  API caller sending `"female"` was told, confidently, that she was ineligible for a maternity
  scheme. Matching is now case- and whitespace-insensitive, with tests pinning both directions:
  casing must not matter, and a genuine mismatch must still fail.
- **Blanket TLS bypass in the freshness checker.** `ingest/freshness.py` ran with `verify=False`
  for every scheme, ignoring the per-scheme opt-in `ingest/fetcher.py` honours. It now verifies by
  default and records `tls_verified` per result.
- **Hardcoded live secrets in `docker-compose.yml`.** `ADMIN_TOKEN` and `JWT_SECRET` were committed
  as literals, which defeated the fail-loud startup check — the container could never reach it.
  Both now come from `.env` via `${VAR:?...}`. **Those literals remain in git history and must be
  treated as compromised: rotate before any deployment.**
- **Stale duplicate compose file.** `make up` pointed at `infra/docker-compose.yml`, which carried
  different credentials, a different port and no `JWT_SECRET`, and would have built a broken stack.
  Removed; the Makefile now uses the working root file.
- **Tests made billed API calls.** With a real key exported, the suite hit the live API and stalled
  in rate-limit backoff. `api/tests/conftest.py` now clears provider keys for the whole session.

### Mixed embedding spaces

Vectors from different embedding models are not comparable. A re-ingest that fails partway leaves
some chunks embedded by one model and the rest by another, producing similarity scores that look
plausible and mean nothing — while the database looks complete and healthy.

Two defences:

1. `chunks.embedding_model` records which model produced each vector, so a partially re-embedded
   corpus is detectable. Rows predating this column are left `NULL`: their provenance genuinely is
   unknown, and back-filling a guess would be the sort of invented fact the column exists to catch.
2. `GeminiEmbedder` retries with exponential backoff on HTTP 429 rather than aborting the run.

After changing embedding model or dimension, always re-ingest the **whole** corpus
(`python -m ingest.run --force`) and confirm a single value in `chunks.embedding_model`.

---

## 9. Repository notes

The project is checked out twice via `git worktree`, so `Sahayak-Govt-Scheme/` and
`sahayak-backend/` are the same repository at different branches, each holding the full tree.

**Known trap:** the shared `.venv` carries an editable install pointing at one worktree. Running a
script directly (`python api/seed_eligibility.py`) resolves `api` to *that* worktree, not the
current directory, silently importing different code. Always use module form:
`python -m ingest.run`, `python -m api.seed_eligibility`.
