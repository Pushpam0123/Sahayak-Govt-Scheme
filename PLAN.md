# Sahayak — Production Plan

**Status:** Phase 0 in progress
**Owner (architecture, review, plan changes):** Opus — senior engineer
**Implementer:** Sonnet agent — writes and edits code, reports back for approval at each checkpoint
**Last updated:** 2026-08-26

---

## 0. How we work

| Role | Agent | Responsibilities |
| --- | --- | --- |
| Senior engineer | Opus | Owns this plan. Writes work orders, reviews every diff, approves or rejects, amends the plan when reality disagrees with it. Does not write feature code. |
| Implementer | Sonnet | Executes one work order at a time. Writes code, runs tests, commits. Reports back with a summary and the diff. Does not expand scope without approval. |

**Rules for the implementer:**

1. Do exactly one work order at a time. Stop and report when it's done.
2. Commit after each small subtask. **Never add a `Co-Authored-By: Claude` line** to a commit message.
3. Do not change files outside the work order's stated scope. If a change looks necessary outside scope, stop and ask.
4. If a test fails or a claim in the work order turns out to be wrong, say so plainly. Do not work around it silently.
5. Run `pytest` and `npm run build` before reporting a work order complete.

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
- Model IDs and price multipliers out of `services/chat.py` and into config. Move off `claude-3-5-sonnet-20241022`.
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

## 5. Phase 0 — work orders

**Goal:** Sahayak never presents invented text as a government source, and never tells a citizen they are eligible when we don't know.

### The problem, precisely

`ingest/fetcher.py::generate_mock_guidelines()` fabricates plausible HTML — invented eligibility tables, invented benefit amounts — whenever a download fails. That text is chunked, embedded and indexed identically to a real document. On retrieval, `api/services/chat.py` sets `source_url = doc.source_url or scheme.official_url`, so the UI renders a citation linking to `pmkisan.gov.in` under a sentence the fallback wrote.

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

### Work orders

| # | Title | Scope | Status |
| --- | --- | --- | --- |
| **0.1** | Remove the fabrication path | Delete `generate_mock_guidelines()`. `fetch_scheme_guidelines` returns an explicit outcome (`fetched` / `cached` / `failed`) instead of inventing content. Failures are logged and skipped, never indexed. | pending |
| **0.2** | Document verification state | Migration adding `documents.fetch_status`, `documents.verified_at`, `documents.content_sha256`. Ingest populates them. | pending |
| **0.3** | Retrieval guard | Vector and FTS search exclude any chunk whose document is not verified. A chunk that cannot be traced to a real fetched document can never be cited. | pending |
| **0.4** | Eligibility three-state | `unknown` replaces the `eligible: True` default. API returns `status: "eligible" \| "ineligible" \| "unknown"`. Frontend renders three visually distinct states. | pending |
| **0.5** | **Re-source the corpus** | **Critical path — see §5.1.** Find the real, live guidelines document for each scheme. Drop what cannot be sourced. | pending |
| **0.6** | Honest UI | Standing disclaimer ("information only — verify on the official portal before applying"). `lib/demo.ts::demoChat()` either removed or labelled unmistakably as sample data. | pending |
| **0.7** | Re-baseline | Re-run the eval against real documents. Rewrite `EVALS.md` from zero. Correct the accuracy claims in `README.md`. | pending |

**Definition of done for Phase 0:** every citation in the product traces to a document that was actually fetched from a URL that actually resolves, and `EVALS.md` contains numbers measured against those documents. The numbers will be worse than the ones currently in the README. That is the point — they will be the first ones that mean anything.

### 5.1 Work order 0.5 in detail — re-sourcing the corpus

**Plan amendment, 2026-08-26.** The original plan treated re-sourcing as cleanup. The full audit shows only 1 of 20 URLs works, so this is now the critical path and the largest task in Phase 0. Once 0.1–0.3 land, running ingestion against the current manifest produces a database with **one document**. There is no product until this is done.

**Corpus source strategy — decided.**

*Rejected: scraping myScheme.* `api.myscheme.gov.in` holds exactly the structured data we want — eligibility, benefits, documents, application process — for thousands of schemes. The public pages are only a Next.js shell; content loads from that API, which returns 401 without an `x-api-key`. Keys are visible in browser traffic. **We will not build on a scraped key.** It is unauthorised use of someone else's credential, it can be revoked without notice, and it is not a foundation you can sell to a customer.

*Action for the business (not an engineering task):* formally request API access from NeGD / Digital India. If granted, it collapses most of Phase 2 into an integration and becomes the primary corpus. Worth doing now because the lead time is long.

*Proceeding meanwhile: hand-source from ministry portals.* Verified viable — the real PM-KISAN guidelines are live at `pmkisan.gov.in/Documents/RevisedPM-KISANOperationalGuidelines(English).pdf` (824 KB PDF). The manifest URL was simply wrong about the filename. Two confirmed-real documents so far: `pm-kisan` and `pm-fby`.

**Method, per scheme:**

1. Start at the scheme's `official_url` and find the guidelines/PDF link from the live site.
2. Verify with a real request: HTTP 200, `content-type: application/pdf` or real HTML, and a plausible size. **A 200 is not enough** — `pm-svanidhi` and `stand-up-india` both return 200 with junk. Check content type and size.
3. Record the working URL in `corpus.yaml` plus a `verified_on: 2026-08-26` field.
4. If no document can be found in reasonable time, set `status: unverified` on the scheme and leave it out of the manifest's active set. **Do not guess a URL.** A guessed URL that 404s is what created this problem.

**Acceptance bar:** a scheme ships only if its document was fetched live, is the right content type, and a human has eyeballed the first page and confirmed it is the guidelines for that scheme. Ten real schemes beat twenty invented ones.

**Expected outcome:** the corpus will likely shrink from 20 schemes to somewhere around 10–15. That is a correct result, not a regression. `README.md` must be updated to state the real count.

---

## 6. Change log

| Date | Change | By |
| --- | --- | --- |
| 2026-08-26 | Plan created. Design direction selected (Warm Civic). Phase 0 work orders defined. | Opus |
| 2026-08-26 | Full 20-URL corpus audit run. Only 1 URL yields a real document, not the 13 the spot-check implied. Work order 0.5 promoted from cleanup to critical path; §5.1 added with a decided source strategy. myScheme API scraping explicitly ruled out; formal access request added as a business action. | Opus |
