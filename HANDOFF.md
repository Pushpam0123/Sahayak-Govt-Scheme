# Sahayak — Handoff & Evaluation Report

**Written:** 2026-08-26  
**Author / Implementer:** `gemini_agent`  
**Target Evaluator:** `claude` (Senior Engineer / Opus)  
**Branch:** `phase-b-nextjs` (All work committed, zero type errors, Next.js build succeeding, all backend tests passing)  
**Full plan:** [`PLAN.md`](PLAN.md)  

> The per-work-order prompt files this report originally linked to
> (`gemini_prompt_*.md`, `agent_instruction.md`) were removed once their work
> was delivered and accepted. Their outcomes are recorded in PLAN.md §8.4; the
> files themselves remain in git history.

---

## 1. Executive Summary

`gemini_agent` has completed all tasks assigned across the Sahayak roadmap:

1. **Phase 0 ("Truth") Completed**: Sourced 9 live-verified official government guidelines, retracted synthetic claims from docs, and rewrote `eval/golden/golden_set.yaml` against authentic documents.
2. **Phase 1 ("Hardening") Completed**: Centralized configuration, RFC error taxonomy, health/ready probes, N+1 query elimination, constant-time auth & API keys, rate limiter proxy keying, session conversation memory, and SSE streaming chat.
3. **Phase 2 ("Coverage") Completed**: Extended `Scheme` model with rich citizen fields (benefit amount, required documents, helpline), added `/schemes` router, created rule verification queue & extraction pipeline, and automated freshness crawler.
4. **Phase 3 ("The Product") Completed**: Complete "Warm Civic" UI rebuild (step-by-step eligibility wizard, scheme detail spine, SSE streaming chat with citation inspector, offline saved applications tracker, admin console).
5. **Phase 4 ("Launch Readiness") Completed**: DPDP Act 2023 privacy controls, WhatsApp & Print export, PWA manifest, multi-stage Docker & docker-compose stack, and pre-flight validation scripts.
6. **Work Order B1 ("Next.js 15 Migration") Completed**: Migrated frontend from Vite to Next.js 15 App Router (`bc1e6c9`, `d3535dc`).
7. **Work Order B2 ("Next.js Correctness Pass") Completed**: Resolved all 9 items from review (`bb44047` through `49f5cd5`) ensuring zero synthetic fallback in metadata, 404 for unknown schemes, removal of `gov.in` domain claims, zero theme/language flash, split public/app layouts, and strict type safety with no `any`.

All 76 backend unit/integration tests pass cleanly, `npx tsc --noEmit` is silent, `next build` generates 15 routes with 0 errors, and `oxlint` reports 0 errors.

---

## 2. Work Order B2 Detailed Implementation Breakdown

| Fix ID | Description | Commits | Key Files Modified |
|---|---|---|---|
| **B2-1** | **Stop serving fabricated scheme data**<br>Deleted `DEMO_SCHEMES` from `app/schemes/[slug]/page.tsx`. `getSchemeData` returns `null` on 404 and throws on 5xx/network errors to preserve ISR caching. Return type narrowed to `Promise<SchemeDetail \| null>`. | `bb44047` | `web/app/(public)/schemes/[slug]/page.tsx` |
| **B2-2** | **404 on unknown schemes**<br>Calls `notFound()` when scheme is `null`. `generateMetadata` returns `title: 'Scheme not found \| Sahayak'` with `robots: { index: false, follow: false }` and no fabricated benefit claims. | `066b958` | `web/app/(public)/schemes/[slug]/page.tsx` |
| **B2-3** | **Remove `gov.in` domain claim**<br>Created `web/lib/site.ts` exporting `SITE_URL`. Removed hardcoded `sahayak.gov.in` from canonical URLs, `sitemap.ts`, and `robots.ts`. Updated layout title and meta description to clarify Sahayak cites official guidelines rather than being an official government site. | `c5ca2fa` | `web/lib/site.ts`, `web/app/layout.tsx`, `web/app/robots.ts`, `web/app/sitemap.ts`, `web/components/admin/AdminConsoleView.tsx` |
| **B2-4** | **Kill theme & language flash**<br>Added blocking head script in `web/app/layout.tsx` checking `localStorage` and `prefers-color-scheme`. `theme.tsx` uses lazy DOM initializers. `setLang` dynamically updates `document.documentElement.lang`. | `eff8c76` | `web/app/layout.tsx`, `web/lib/theme.tsx` |
| **B2-5** | **Split public and app layouts**<br>Created route groups `(public)` (for `/`, `/services`, `/privacy`, `/schemes`, `/schemes/[slug]`) and `(app)` (for `/ask`, `/check`, `/results`, `/saved`, `/console`, `/admin/rules`). Internal console chrome is isolated to `(app)`. | `b3ad1a2` | `web/app/layout.tsx`, `web/app/(public)/layout.tsx`, `web/app/(app)/layout.tsx` |
| **B2-6** | **Remove unearned verification claim**<br>Replaced static footer text with clean `{t.appName} · {t.tagline}`. | `b3ad1a2` | `web/app/(app)/layout.tsx` |
| **B2-7** | **Stop duplicating corpus in frontend**<br>Deleted hardcoded `KNOWN_SCHEME_SLUGS` from `sitemap.ts`. If API is down, returns only static routes without guessing slugs. | `c5ca2fa` | `web/app/sitemap.ts` |
| **B2-8** | **Fix API base URL handling**<br>Created `web/lib/server-env.ts` with `getApiBase()` reading `API_BASE_INTERNAL` falling back to `NEXT_PUBLIC_API_BASE` and `http://localhost:8000`. Added `web/.env.example`. | `32b8f97` | `web/lib/server-env.ts`, `web/.env.example`, `web/app/sitemap.ts`, `web/app/(public)/schemes/[slug]/page.tsx` |
| **B2-9** | **Remove `any` types**<br>Replaced all occurrences of `any` across `page.tsx`, `AdminConsoleView.tsx`, `ChatView.tsx`, and `lib/api.ts` with `unknown` narrowing or strongly typed `ChunkResult[]`. | `49f5cd5` | `web/app/(public)/schemes/[slug]/page.tsx`, `web/components/admin/AdminConsoleView.tsx`, `web/components/chat/ChatView.tsx`, `web/lib/api.ts` |

---

## 3. Verification & Build Results

### 1. TypeScript Validation (`tsc --noEmit`)
```bash
$ cd web && npx tsc --noEmit
# Silent output (0 type errors)
```

### 2. Next.js Production Build (`npm run build`)
```bash
$ cd web && npm run build
   ▲ Next.js 15.5.24

   Creating an optimized production build ...
 ✓ Compiled successfully in 1203ms
   Linting and checking validity of types ...
   Collecting page data ...
 ✓ Generating static pages (15/15)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS  Revalidate  Expire
┌ ○ /                                    2.47 kB         124 kB
├ ○ /_not-found                            998 B         104 kB
├ ○ /admin/rules                         2.91 kB         112 kB
├ ○ /ask                                 3.45 kB         125 kB
├ ○ /check                                 386 B         125 kB
├ ○ /console                             2.91 kB         112 kB
├ ○ /privacy                             1.42 kB         104 kB
├ ○ /results                               698 B         125 kB
├ ○ /robots.txt                            124 B         103 kB
├ ○ /saved                               1.29 kB         123 kB
├ ○ /schemes                              4.5 kB         129 kB
├ ● /schemes/[slug]                      3.38 kB         125 kB
├ ○ /services                              162 B         106 kB
└ ○ /sitemap.xml                           124 B         103 kB          1h      1y
+ First Load JS shared by all             103 kB
  ├ chunks/255-c5a697ddbf82d774.js       46.4 kB
  ├ chunks/4bd1b696-c023c6e3521b1417.js  54.2 kB
  └ other shared chunks (total)          1.92 kB

○  (Static)  prerendered as static content
●  (SSG)     prerendered as static HTML (uses generateStaticParams)
```

### 3. Linter (`npm run lint` / oxlint)
```bash
$ cd web && npm run lint
Found 9 warnings and 0 errors.
Finished in 23ms on 55 files with 103 rules using 8 threads.
```

### 4. Backend Test Suite (`.venv/bin/pytest`)
```bash
$ .venv/bin/pytest
======================== 76 passed, 4 warnings in 1.89s ========================
```

---

## 4. Full Commit History on `phase-b-nextjs`

| Commit | Message |
|---|---|
| `49f5cd5` | `fix(web): remove any types and strengthen error handling (B2-9)` |
| `32b8f97` | `fix(web): clean up server-side API base handling and env example (B2-8)` |
| `b3ad1a2` | `fix(web): split public and app route layouts (B2-5)` |
| `eff8c76` | `fix(web): prevent theme and language flash on load (B2-4)` |
| `c5ca2fa` | `fix(web): remove gov.in claims and centralize SITE_URL (B2-3)` |
| `066b958` | `fix(web): return 404 on unknown schemes and clean metadata (B2-2)` |
| `bb44047` | `fix(web): stop serving fabricated scheme data in getSchemeData (B2-1)` |
| `d6bf0b5` | `chore: ignore tsbuildinfo` |
| `f66d004` | `feat(web): update demo schemes catalog with full 9 verified schemes` |
| `d3535dc` | `feat(web): ensure rich per-scheme metadata with offline fallback in /schemes/[slug]` |
| `bc1e6c9` | `feat(web): migrate all routes, layout, providers, sitemap, and robots to Next.js 15 App Router` |

*(All commits strictly adhered to the user directive: no `Co-Authored-By: Claude` lines).*
