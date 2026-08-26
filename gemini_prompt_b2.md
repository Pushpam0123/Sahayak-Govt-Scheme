# Work Order B2 — Correctness pass on the Next.js migration

You are `gemini_agent`. You migrated Sahayak from Vite to Next.js 15 App Router
(commits `bc1e6c9`, `d3535dc`). That migration was reviewed. It passed the parts
most agents fail: `tsc --noEmit` is silent, `next build` succeeds, 14 routes
generate, and you did not disable a single check to get there. That is
acknowledged and it counts.

This work order fixes what the review found. Read all of it before you write
anything.

---

## 0. The one idea behind every fix below

**When the backend is unavailable, your instinct was to keep the page looking
complete. That instinct is wrong for this product.**

Three separate defects in your migration are the same reflex:

- API down → serve `DEMO_SCHEMES` in the page metadata
- Scheme not found → emit "Official government scheme information for {slug}"
- No stored theme → assume light

In each case you chose a confident-looking output over an honest one. Sahayak's
entire reason to exist is that it never states something it cannot source. A
page that says "I don't know" is a working page. A page that invents ₹6,000/year
and puts it in a Google result is a broken one, even though it renders fine.

For the rest of this work order, when you hit a branch where you don't have real
data, the answer is never a plausible substitute. It is 404, or an empty result,
or an explicit "unavailable" state.

---

## 1. Ground rules (unchanged from last time)

1. You work **only inside `web/`**, on branch `phase-b-nextjs`, in the primary
   worktree `/Users/pushpamraj/Desktop/project/Sahayak-Govt-Scheme`.
2. **Never run `git checkout`, `git switch`, `git stash`, or `git rebase`.** A
   second agent is working in `../sahayak-backend` on `phase-0-truth`. Switching
   branches moved that agent's files out from under it once already.
3. **Never disable a security control, test, type check, or lint rule to make
   something pass.** No `@ts-ignore`, no `eslint-disable`, no
   `ignoreBuildErrors`, no `--force`. If something can only be made to pass by
   suppressing it, stop and report instead.
4. `suppressHydrationWarning` is the one exception, and only on `<html>`, and
   only once fix 4 gives it a legitimate reason to exist.
5. **One commit per numbered fix.** Message format:
   `fix(web): <what changed> (B2-<n>)`. Do not add a co-author line.
6. Do not touch `api/`, `ingest/`, `eval/`, `infra/`, or any `.md` file at the
   repo root. Those belong to another agent.

---

## 2. Fixes, in order

### B2-1 — Stop serving fabricated scheme data (BLOCKING)

**File:** `web/app/schemes/[slug]/page.tsx`

Delete the `DEMO_SCHEMES` import and both fallbacks on lines 16 and 20.

The page body was already safe — your `'required_documents' in schemeData` check
filtered demo entries out. But `generateMetadata` uses the returned object
directly, so the `<title>`, `<meta description>` and OpenGraph card publish demo
benefit amounts as fact, and `revalidate = 3600` caches them for an hour.

Rewrite `getSchemeData` so it distinguishes three outcomes, because they need
three different behaviours:

- **HTTP 404** → return `null`. The scheme genuinely does not exist.
- **HTTP 5xx, or a thrown network error** → `throw`. Do not return `null`.
  Next.js will then serve the last good ISR-cached page if it has one, instead
  of baking a 404 for a real scheme because the API blipped for ten seconds.
  This distinction matters — get it right.
- **HTTP 200** → return the parsed `SchemeDetail`.

Return type narrows to `Promise<SchemeDetail | null>`. The
`SchemeDetail | SchemeInfo` union goes away with the demo path.

### B2-2 — 404 on unknown schemes (BLOCKING)

**File:** `web/app/schemes/[slug]/page.tsx`

There is currently no `notFound()` call anywhere in `app/`. With
`dynamicParams = true`, `/schemes/total-nonsense` returns HTTP 200.

In the page component: if `getSchemeData` returns `null`, call `notFound()`
from `next/navigation`.

In `generateMetadata`: if it returns `null`, return metadata with **no factual
claims about the slug** — no "Official government scheme information", no
invented description. Title `'Scheme not found | Sahayak'`, and set
`robots: { index: false, follow: false }`.

Also in `generateMetadata`, delete the
`benefit_amount || 'Financial Assistance'` fallback. If there is no benefit
amount, the description omits it. Do not fill the gap with a phrase.

### B2-3 — Remove the `gov.in` domain claim (BLOCKING)

`sahayak.gov.in` is hardcoded in three places:

- `web/app/schemes/[slug]/page.tsx:63` — the canonical URL
- `web/app/sitemap.ts:16` — the fallback base URL
- `web/app/robots.ts:4` — the fallback base URL

`gov.in` is a restricted Government of India namespace. Publishing canonical and
OpenGraph tags on that domain, under the site title *"Sahayak — Official
Government Scheme Assistance"*, asserts that this is an official government
product. It is not. This is not a placeholder problem, it is an impersonation
problem, and it has to be gone before anything is deployed anywhere.

Do all of the following:

- Create `web/lib/site.ts` exporting
  `export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';`
  (strip any trailing slash). Use it in all three files and in `layout.tsx`'s
  `metadataBase`. One source, one default, no `gov.in` anywhere.
- In `web/app/layout.tsx`, change the title. It must not contain the word
  "Official". Use `'Sahayak — Find Government Schemes You Qualify For'`.
- Change the description so the word "official" describes the *sources*, not
  Sahayak: *"Search Indian central and state welfare schemes, check your
  eligibility, and read the exact line of the official guideline behind every
  answer."*
- `web/components/admin/AdminConsoleView.tsx:57` has a hardcoded
  `operator@sahayak.gov.in`. Change to `operator@sahayak.example`.

### B2-4 — Kill the theme and language flash (BLOCKING)

**Files:** `web/app/layout.tsx`, `web/lib/theme.tsx`

`ThemeProvider` applies the stored theme inside a `useEffect`, which runs after
first paint. Every dark-mode user sees a white flash on every single page load
and navigation. `prefers-color-scheme` is never consulted at all, so a user
whose system is dark and who has never clicked the toggle gets light forever.
Language has the identical bug: it initialises to `'en'` and corrects in an
effect, so Hindi users watch English flash first.

Fix:

1. In `layout.tsx`, add a blocking inline script as the **first child of
   `<head>`**, via `dangerouslySetInnerHTML`. It must, synchronously before
   paint:
   - read `localStorage['sahayak-theme']`; if absent, fall back to
     `window.matchMedia('(prefers-color-scheme: dark)').matches`
   - `document.documentElement.classList.toggle('dark', isDark)`
   - read `localStorage['sahayak-lang']` and set
     `document.documentElement.lang` to it
   - wrap the whole thing in `try {} catch {}` — localStorage throws in some
     privacy modes and must not blank the page
2. In `theme.tsx`, change both providers' `useState` to lazy initialisers that
   read the DOM the script already set, guarded with
   `typeof document === 'undefined'` for the server pass:
   - theme: `document.documentElement.classList.contains('dark') ? 'dark' : 'light'`
   - lang: `document.documentElement.lang` if it is a known `Lang`, else `'en'`
   The `useEffect` sync-from-localStorage can then be deleted entirely.
3. `setLang` must also set `document.documentElement.lang`. Right now
   `<html lang="en">` is hardcoded and never changes, so a screen reader
   pronounces Devanagari text with an English voice. That is a real
   accessibility defect for the exact users this product is for.
4. Keep `suppressHydrationWarning` on `<html>`. It is now correct — the script
   legitimately mutates the element before React hydrates.

Verify by hand: set the toggle to dark, hard-reload, and watch for a white
frame. There must not be one.

### B2-5 — Split public and app layouts

**Files:** `web/app/providers.tsx` plus new route groups

`Providers` wraps `{children}` in the full app shell — Header with API-health
indicators, TabBar, DisclaimerStrip, PrivacyBanner, OfflineBanner, footer — and
it applies to *every* route, including `/` and `/services`. The marketing pages
therefore wear the internal console's chrome. That is structurally the
"traditional government website" feel this rebuild exists to escape, and Work
Order C cannot fix it from the outside.

Restructure into two route groups:

```
web/app/
  layout.tsx              <- html/body/head script + <Providers> (contexts only)
  (public)/
    layout.tsx            <- minimal public chrome
    page.tsx              <- was app/page.tsx
    services/page.tsx
    privacy/page.tsx
    schemes/page.tsx
    schemes/[slug]/…
  (app)/
    layout.tsx            <- the current AppShell chrome, moved here verbatim
    ask/page.tsx
    check/page.tsx
    results/page.tsx
    saved/page.tsx
    console/page.tsx
    admin/rules/page.tsx
```

`/schemes` and `/schemes/[slug]` go in `(public)` — they are the SEO surfaces
and must not carry console chrome.

`Providers` keeps only `QueryClientProvider`, `ThemeProvider`, `LangProvider`.
`AppShell` moves into `(app)/layout.tsx` unchanged.

**Scope discipline: do not design the public chrome.** `(public)/layout.tsx`
gets a minimal header (wordmark, nav links to Schemes / Services / Ask, language
and theme toggles) and a minimal footer. Work Order C designs these properly.
Your job here is the structural split, not the visual work. Resist the urge.

Route groups do not affect URLs — `/services` stays `/services`. Confirm with
`next build` that the route table is unchanged apart from the layout split.

### B2-6 — Remove the unearned verification claim

**File:** `web/app/providers.tsx:57` (moving to `(app)/layout.tsx`)

The footer reads `… · Official Guidelines Verified` on every page. It is static
text with nothing behind it — not tied to `verified_at`, not tied to anything.
This is the same category of claim Phase 0 spent a week removing from the
backend.

Replace with `{t.appName} · {t.tagline}`. Nothing else.

### B2-7 — Stop duplicating the corpus in the frontend

**File:** `web/app/sitemap.ts`

`KNOWN_SCHEME_SLUGS` is a hardcoded copy of `ingest/corpus.yaml`. It will drift
the first time a scheme is added, and then the sitemap advertises URLs for
schemes that do not exist — or omits ones that do.

Delete the constant. If the API call fails, return **only the static routes**.
A short sitemap is correct; a sitemap listing pages that 404 is not.

### B2-8 — Fix the API base URL handling

`process.env.NEXT_PUBLIC_API_BASE` is used for **server-side** fetches in
`page.tsx` (twice) and `sitemap.ts`. Two problems: `NEXT_PUBLIC_` values are
inlined into the browser bundle, so the internal API address ships to every
visitor; and the `http://localhost:8000` default means a production build with a
missing env var silently falls through to the demo path rather than failing
loudly.

- Add `web/lib/server-env.ts` exporting a single `getApiBase()` that reads
  `API_BASE_INTERNAL` (no `NEXT_PUBLIC_` prefix — server-only), falling back to
  `NEXT_PUBLIC_API_BASE`, falling back to `http://localhost:8000`, stripping any
  trailing slash. Log a warning once if both env vars are missing and
  `NODE_ENV === 'production'`.
- Replace all three inline copies with it.
- Add `web/.env.example` documenting `API_BASE_INTERNAL`,
  `NEXT_PUBLIC_API_BASE`, and `NEXT_PUBLIC_APP_URL`.

### B2-9 — Remove `any`

Five occurrences:

- `app/schemes/[slug]/page.tsx:38` — `catch (err: any)` → `catch (err: unknown)`,
  narrow with `err instanceof Error ? err.message : String(err)`
- `components/admin/AdminConsoleView.tsx:64` — same treatment
- `components/chat/ChatView.tsx:115` — same treatment
- `lib/api.ts:167` — same treatment
- `lib/api.ts:102` — `retrieved_chunks: any[]` → `ChunkResult[]` from
  `lib/types.ts`. If the shapes genuinely differ, define the real type. Do not
  widen it back to `any`.

---

## 3. Things that will not survive review

Stated in advance so you don't spend effort on them:

1. **Any new fallback to `DEMO_*` data on a server component or in metadata.**
   The client-side fallback in `useSahayak.ts` stays — it is gated behind
   `OfflineBanner`. Nothing new joins it.
2. **Returning `null` from `getSchemeData` on a 5xx.** That converts a backend
   hiccup into a permanent-looking 404 for a real scheme. 404 means 404; 5xx
   throws.
3. **Any string containing `gov.in`.**
4. **Calling Sahayak "official"** in a title, description, footer, or anywhere
   else. It cites official sources. It is not one.
5. **Designing the public header or homepage.** B2-5 is a structural move.
   Visual work is Work Order C's and doing it now creates a merge conflict with
   your own next task.
6. **Touching any file outside `web/`.**
7. **A green build achieved by weakening a check.** If `tsc` complains after
   B2-9, fix the type, do not cast it.

---

## 4. Definition of done

Run all of these and paste the actual output in your report:

```
cd web
npx tsc --noEmit          # must be silent
npm run build             # must succeed; paste the route table
npm run lint              # oxlint
```

Then verify by hand, with the backend **stopped**:

- `/schemes/pm-kisan` — does not show invented benefit amounts in the page
  source `<title>` or `<meta>`
- `/schemes/total-nonsense` — returns 404, not 200
- `/` — no TabBar, no DisclaimerStrip, no API-health chrome
- `/ask` — still has all of the above
- dark mode set, hard reload — no white flash
- Hindi selected, hard reload — no English flash, and
  `document.documentElement.lang` reads `hi`

Report each of the nine fixes with its commit hash, and say explicitly if you
skipped or partially completed any. A partial fix reported honestly is fine. A
partial fix reported as complete is the only thing here that is not.
