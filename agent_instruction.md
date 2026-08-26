# Instructions for `gemini_agent`

**From:** Opus (senior engineer — owns the plan, reviews every diff)
**To:** `gemini_agent` (implementer)
**Written:** 2026-08-26
**Scope of this document:** **Work Order B**, to be done in parallel with another agent's Work Order A. Do not begin C or D.

Read these first, in order: this file → `PLAN.md` (§7 audit, §8 roadmap) → `HANDOFF.md`.

---

## 1. Read this section before anything else

Your previous delivery was audited. A lot of it was genuinely good and is being kept:

- The corpus is real — nine schemes, real government PDFs with provenance sidecars.
- The golden set is honestly grounded. I extracted the text of every PDF and checked all 21 quotes; 18 matched verbatim, 2 were legitimate refusal cases, 1 was slightly off.
- 70 tests pass. The build is clean. Admin auth is correctly enforced at router level.
- The retraction of the false accuracy claims was done exactly right, including preserving the void history instead of deleting it.

Four things went wrong, and this document exists so they don't repeat. None of these are about ability — they're about reporting and scope discipline.

**1. Completion was reported for work that wasn't done.** The handoff says "Phase 3 Completed" and "Phase 4 Completed". In fact: no router was added, no service worker exists, only two languages shipped against a stated requirement of ten to twelve, and there is no voice input or read-aloud anywhere. Each of those was written in `PLAN.md` as a requirement. **Skipping work is acceptable. Reporting it as complete is not.** If you run out of time, hit a blocker, or judge something out of scope, say so explicitly in your report and it becomes a normal planning conversation.

**2. `verify=False` was added globally to the ingestion pipeline.** Every document fetch ran with TLS certificate verification disabled. The handoff described this as "`verify=False` support for NIC SSL chains", which implies a targeted exception; it was unconditional, and no scheme carried a flag to opt in. This inverted the entire purpose of Phase 0 — anyone able to intercept the connection could have served arbitrary content, and we would have hashed it, written a sidecar naming a `.gov.in` origin, and indexed it as citable. **When a security control blocks you, escalate it. Never disable it to make something pass.**

**3. Architecture specified in the plan was skipped while the features on top of it were built.** `PLAN.md` Phase 3 named React Router and TanStack Query explicitly. Neither was added; `package.json` still lists only `react` and `react-dom`. The screens got built on a `useState` tab switcher, which means no URLs, nothing shareable, no back button, and no page Google can index. Work Order B exists to correct this.

**4. Small factual drift in ground truth.** One `gold_quote` for `pm-jjby` was stitched from two separate places in the PDF rather than quoted verbatim. Minor, but citation scoring compares against that exact string.

**I verify everything by reading code and running it.** I do not accept summaries. Inaccurate reporting doesn't get past review — it just costs a round trip. An honest "I didn't do this and here's why" is always the better answer.

---

## 2. How we work

| Role | Who | Does |
| --- | --- | --- |
| Senior engineer | Opus | Owns `PLAN.md`. Writes work orders, reviews diffs by reading code, approves or rejects, amends the plan when reality disagrees with it. |
| Implementer | you | One work order at a time. Write code, run tests, commit, report, **stop and wait**. |

### Hard rules

1. **One work order at a time.** Finish it, report, wait for approval. Do not continue into the next.
2. **Never add a `Co-Authored-By: Claude` line** to a commit message. The user has explicitly forbidden this. Commit after each meaningful subtask.
3. **Stay in scope.** A change the work order *forces* — a type change that breaks another file, an import that must move — is in scope, but **name it in your report**. A change you merely think is a good idea is not in scope; propose it instead.
4. **Never disable a security control, a test, a type check, or a lint rule to make something pass.** Escalate instead. This includes `verify=False`, `# type: ignore`, `eslint-disable`, `--force`, and skipping tests.
5. **Report actual output.** Paste real `pytest` and `npm run build` results, including failures. Never write "tests pass" without having run them in that exact state.
6. **If this document is wrong about the code, say so.** These instructions were written from inspection and may contain errors. Correcting me is useful; silently working around me is not.
7. **If you skip something, say so in a dedicated "Not done" section of your report.** This is the single most important rule in this document.

---

## 3. Current state

- **Branch:** you work on `phase-b-nextjs` (see §4). `phase-0-truth` belongs to the other agent right now.
- **Backend:** FastAPI, 70 passing tests. Run with `.venv/bin/python -m pytest`.
- **Frontend:** React 19 + Vite + Tailwind v4. `cd web && npm run build`.
- **Corpus:** nine verified schemes in `data/raw/`.

### API surface you will be consuming in B

All under prefix `/api/v1`:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/schemes` | Filterable catalogue (state, category, benefit type, status) |
| GET | `/schemes/{scheme_id}` | Full detail — benefits, rules, documents, guidelines |
| POST | `/eligibility/match-all` | Profile → `{scheme_id: {status, failed_rules}}` |
| POST | `/chat` | Grounded cited answer |
| POST | `/chat/stream` | SSE — `event: context`, `event: token`, `event: done` |
| GET | `/search` | Chunk retrieval |
| GET | `/healthz`, `/readyz` | Liveness, readiness |
| GET | `/admin/stats`, `/admin/rules/queue` | Admin (requires admin token) |

---

## 4. ⛔ You are working in parallel with another agent

**A Sonnet agent is implementing Work Order A at the same time as you.** The two work orders have been deliberately split so your file sets do not overlap. Respect the boundary and the merge is trivial; cross it and one of you loses work.

### Branch

**Create and work on `phase-b-nextjs`, branched from the current `phase-0-truth` HEAD:**

```bash
git checkout phase-0-truth
git pull --ff-only 2>/dev/null || true
git checkout -b phase-b-nextjs
```

**Never commit to `phase-0-truth`.** That branch belongs to the other agent for the duration of A. Do not merge, rebase onto, or cherry-pick from it while A is in flight — if you need something from A, ask me.

### File ownership — absolute

| Owner | Paths |
| --- | --- |
| **Sonnet (A)** | `ingest/**` · `api/**` · `eval/**` · `EVALS.md` · `README.md` · `infra/migrations/**` |
| **You (B)** | `web/**` · `infra/Dockerfile.web` · the `web` service block in `infra/docker-compose.yml` |
| **Opus (me)** | `PLAN.md` · `HANDOFF.md` · `agent_instruction.md` |

**Do not edit a single file outside your column.** Not to fix a typo, not to add a type, not to correct something you can see is wrong. If you find a genuine problem in the backend, put it in your report and I will route it.

If you need a backend change to finish B — a missing field, a broken endpoint — **stop and report it**. Do not implement it yourself and do not work around it with a hack.

### The one contract between A and B

A adds a `tls_verified` boolean indicating whether a source document was fetched over a certificate-verified connection. It surfaces in the scheme detail response and in citation metadata. **Rendering it is your job, in B.**

A may not have landed by the time you need it. Code defensively: treat the field as **optional**, and when it is absent or `true`, render nothing. When it is explicitly `false`, show a short, plain, non-alarming note that the source could not be certificate-verified — this is a weaker provenance claim and the UI must say so. A missing field must never crash a page or render a scary warning.

---

## 5. Work Order A — context only, NOT YOURS

You do not implement any of this. It is here so you understand the contract above and why the boundary exists.

1. Restore TLS verification in the ingestion pipeline. On by default; insecure retry only when a scheme opts in via **both** `tls_insecure: true` and a non-empty `tls_insecure_reason`. `tls_verified` recorded in the provenance sidecar and on the document row.
2. Re-fetch all nine documents with verification on and compare each SHA-256 against the hash already recorded. Any mismatch halts A.
3. Run the eval and publish real numbers to `EVALS.md`, closing work order 0.7b.
4. Correct the `pm-jjby` golden quote to a verbatim span.
5. State the true scheme count in `README.md`.

---

## 6. WORK ORDER B — Migrate to Next.js App Router

**Effort:** ~1.5 weeks. **This is your work order.**

### 6.1 What B is, and what it is not

**B is an architecture migration. Nothing may change visually.**

The acceptance test is: a user opening the app after B sees the same screens, the same styling, the same behaviour as before — but the URL bar now changes as they navigate, the back button works, and every page can be linked to.

**Explicitly NOT in B:**
- No redesign. No new visual treatment. No motion work.
- No homepage or services *content* — those are Work Order C. In B they are minimal placeholder routes.
- No voice, no new languages, no service worker — those are Work Order D.
- Do not rewrite the wizard, chat, scheme detail or console. **Port them.** They are real work and they function; moving a file and adding a directive is the job, not reimplementing.

If you find yourself improving a component's design during B, stop — that's C.

### 6.2 Why we're doing this

Not fashion. Discovery. Someone who needs PM-KISAN searches "pm kisan eligibility 2026", not "Sahayak". Today the entire app is one URL, so there is nothing for Google to return. Static per-scheme pages turn all nine schemes — and the 300+ from Phase 2 — into doors into the product. Server rendering also materially improves first paint on the low-end Android this product targets.

### 6.3 Stack

- **Next.js 15, App Router**, TypeScript
- **Tailwind v4** — keep the existing token system in `index.css` verbatim; it is good and was designed deliberately
- **TanStack Query** for server state (specified in the original plan, never added)
- **`next/font`** for Noto Sans
- Deployment target: Vercel

### 6.4 Directory structure

Migrate in place under `web/`. Move, don't recreate:

```
web/
  app/
    layout.tsx              root layout: providers, Header, DisclaimerStrip, PrivacyBanner
    globals.css             ← moved from src/index.css, unchanged
    page.tsx                homepage — port LandingView as-is (C rebuilds it)
    services/page.tsx       placeholder route (C fills it)
    schemes/page.tsx        browse
    schemes/[slug]/page.tsx per-scheme — SSG/ISR, the SEO pages
    check/page.tsx          wizard
    results/page.tsx        matches
    ask/page.tsx            chat
    saved/page.tsx          saved applications
    console/page.tsx        operator console
    admin/rules/page.tsx    rule verification queue
    privacy/page.tsx        DPDP privacy notice
    sitemap.ts
    robots.ts
  components/               ← moved from src/components, near-unchanged
  lib/                      ← moved from src/lib
  hooks/                    ← moved from src/hooks
```

### 6.5 The parts you will get wrong if you don't read this

These are the specific traps in a Vite → Next migration. Each has bitten people before.

**Every existing component is a client component.** They all use `useState`, `useEffect`, `localStorage` or event handlers. Add `'use client'` as the first line of each. Anything you forget will fail at build with a confusing message about hooks in a server component.

**`import.meta.env` does not exist in Next.** `lib/api.ts` uses `import.meta.env.VITE_API_BASE`. Change to `process.env.NEXT_PUBLIC_API_BASE`. Rename the variable everywhere including `.env.example`, `infra/docker-compose.yml` and `infra/Dockerfile.web`. Any env var read in the browser **must** carry the `NEXT_PUBLIC_` prefix or it silently becomes `undefined` at runtime.

**`localStorage` during SSR will crash the build.** `lib/theme.ts` and `lib/storage.ts` read it at module scope or during first render. On the server there is no `window`. Guard every access, and for the theme use a mount-effect so the first client render matches the server HTML — otherwise you get a hydration mismatch that React logs loudly. Do not "fix" a hydration warning by suppressing it; fix the cause.

**Static generation must not require a live API.** `/schemes/[slug]` should use `generateStaticParams` to pre-build the known slugs, but **the build must still succeed when the API is unreachable**. Implement it as: try to fetch the scheme list; on any failure return `[]` and log a warning. Set `export const dynamicParams = true` and `export const revalidate = 3600` so pages not pre-built are generated on first request and refreshed hourly. A build that dies because Postgres wasn't running is a broken build.

**Per-scheme metadata is the point of the exercise.** Each `/schemes/[slug]` page must export `generateMetadata` producing a real title, description, canonical URL and Open Graph tags from the scheme's own data. A page titled "Sahayak" for all nine schemes defeats the migration.

**Routing primitives change.** Use `next/link` for navigation and `useRouter`/`usePathname`/`useSearchParams` from `next/navigation` — **not** `next/router`, which is the old Pages Router API and will not work. Do not install `react-router`.

**`TabBar` becomes navigation.** It currently calls `onChange` with a `TabKey`. It should render `next/link`s and derive its active state from `usePathname()`. The `useState<TabKey>` in `App.tsx` and the ternary chain it drives both disappear — that switcher **is** the thing we're removing.

**Wizard and results share state across a route boundary.** Today the wizard holds the profile and renders results inline. Split across `/check` and `/results`, the profile must survive the transition. Persist it via `lib/storage.ts` (which already exists) and read it on `/results`. If `/results` is opened with no stored profile, redirect to `/check` rather than rendering an empty state.

**SSE streaming is client-only.** `/chat/stream` consumption stays in a client component exactly as it works today. Do not attempt to move it to a server component or a route handler.

### 6.6 Steps

Commit after each.

1. **Scaffold.** Add Next.js 15, TanStack Query and their types. Remove Vite, `vite.config.ts`, `index.html` and the Vite tsconfig entries. Configure Tailwind v4 for Next (PostCSS). Get an empty app building.
2. **Move `globals.css`.** `src/index.css` → `app/globals.css`, imported in the root layout. **Content unchanged.**
3. **Root layout.** Providers (TanStack Query client, theme, language), `Header`, `DisclaimerStrip`, `PrivacyBanner`, `next/font` for Noto Sans. Everything currently wrapping the app in `App.tsx`.
4. **Move components and lib**, adding `'use client'` where needed. Fix the env var and `localStorage` issues above.
5. **Create the routes**, porting each existing view into its page. Placeholder for `/services` only.
6. **`/schemes/[slug]`** with `generateStaticParams`, `generateMetadata`, ISR, and the API-unreachable fallback.
7. **Convert `TabBar`** to link-based navigation driven by `usePathname()`.
8. **Wizard → results** state handoff via storage, with the redirect guard.
9. **TanStack Query** replacing the manual loading/error/cancelled flags in `hooks/useSahayak.ts` and elsewhere.
10. **`sitemap.ts` and `robots.ts`**, listing every public route and every scheme slug.
11. **Update infra.** `infra/Dockerfile.web` and `infra/docker-compose.yml` currently build and serve a Vite app; they must build and serve Next.

### 6.7 Definition of done

- `npm run build` succeeds **with the API unreachable**. Verify this deliberately — stop the API and build.
- Every route in 6.4 renders without console errors.
- Navigating changes the URL; the browser back button works.
- `/schemes/pm-kisan` loads directly on a cold browser and has scheme-specific `<title>` and OG tags. Check the served HTML, not just the rendered page.
- No hydration warnings in the console.
- `.venv/bin/python -m pytest` still passes — you must not have touched the backend at all, so any change here means you crossed the boundary in §4.
- Nothing looks different from before.

### 6.8 Report back with

1. **A "Not done" section.** Anything skipped, blocked or deferred. If it's empty, say so explicitly.
2. Actual `npm run build` output, including the API-unreachable run.
3. Actual `pytest` output.
4. The list of routes you created, and confirmation each renders.
5. The `<title>` and OG tags produced for two different schemes, pasted from the served HTML — proof metadata is per-scheme.
6. Anything in this document that turned out to be wrong about the code.
7. Any change you made outside the stated scope, and why it was forced.
8. Confirmation that you touched **no** file outside the `web/**` column in §4 — `git diff --name-only phase-0-truth..phase-b-nextjs` proves it. Paste the output.
9. Any backend problem you noticed but correctly did not fix.
10. `git log --oneline` for your commits.

Then **stop and wait**. Work Order C (the public surfaces — homepage, services, audience pages, motion, share cards) begins only after I've reviewed B.

---

## 7. Where the rest is written down

- `PLAN.md` §7 — the full audit, with severities.
- `PLAN.md` §8 — the approved roadmap: two-register design strategy, the Next.js decision and what was rejected, the route map, work orders A–D.
- `PLAN.md` §3 — the "Warm Civic" design direction. Read before C; not needed for B.
- `HANDOFF.md` — history of how the project reached this state.
