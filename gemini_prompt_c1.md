# Work Order C1 — Fix the B2 regression, then build the public surfaces

You are `gemini_agent`. Work Order B2 is reviewed and largely accepted.

**What you got right:** all nine fixes landed, `tsc --noEmit` is silent,
`next build` is green, and the route table after the `(public)`/`(app)` split is
byte-identical to before it — which is the proof B2-5 was done correctly. Zero
`gov.in` strings, zero `any`, no suppressed checks. The head script in
`layout.tsx` handles storage, `prefers-color-scheme`, `documentElement.lang`,
and throws safely. That is a real improvement on your previous pass.

**What you got wrong:** one regression, described in §2. Fix it before you touch
anything else.

---

## 0. The idea behind this work order

B2 was about not lying when the backend is down. **C1 is about not lying when
the backend is up.**

You are about to build marketing surfaces. Marketing surfaces are where every
web project in history has invented "50,000 citizens helped", "300+ schemes",
"Trusted by leading NGOs", and a testimonial from a farmer who does not exist.
Sahayak's entire competitive claim is that it quotes the actual line of the
actual guideline. A homepage carrying one fabricated number destroys that claim
more thoroughly than any backend bug, because the homepage is the first thing
anyone sees.

**The corpus is nine schemes. Nine.** Not "300+", not "hundreds", not "India's
largest". If you want to put a number on the homepage, it comes from the API at
build time or it does not appear. There is no third option.

The second idea: the user's complaint was that the current UI "feels very
outdated, like a traditional government website" and asked for Gen-Z
engagement. The answer to that is **not** a purple gradient and frosted glass
cards. It is confident typography, real benefit figures shown large, generous
spacing, and motion that responds to intent. See §4 for what will be rejected.

---

## 1. Ground rules (unchanged)

1. Work **only inside `web/`**, on branch `phase-b-nextjs`, in the primary
   worktree `/Users/pushpamraj/Desktop/project/Sahayak-Govt-Scheme`.
2. **Never run `git checkout`, `git switch`, `git stash`, or `git rebase`.**
   Another agent works in `../sahayak-backend` on `phase-0-truth`.
3. **Never disable a security control, test, type check, or lint rule to make
   something pass.** No `@ts-ignore`, no `eslint-disable`, no
   `ignoreBuildErrors`. If it can only pass by suppression, stop and report.
4. **Do not edit any `.md` file at the repo root, `HANDOFF.md` included.** You
   edited it during B2. It is the shared handoff record and I maintain it. Put
   your report in your reply instead.
5. **One commit per numbered item.** Format: `feat(web): <what> (C1-<n>)` or
   `fix(web): <what> (C0)`. No co-author line.
6. Do not touch `api/`, `ingest/`, `eval/`, `infra/`.

---

## 2. C0 — Fix the B2-1 regression (BLOCKING, do first)

**File:** `web/app/(public)/schemes/[slug]/page.tsx`

You built the three-way branch in `getSchemeData` correctly: 404 returns `null`,
5xx and network errors `throw`. Then you discarded it three lines after calling
it:

```ts
try {
  initialScheme = await getSchemeData(slug);
} catch {
  initialScheme = null;      // swallows the 5xx
}
if (initialScheme === null) {
  notFound();                // 5xx is now indistinguishable from 404
}
```

Net behaviour is identical to the naive version B2 §3 item 2 explicitly
prohibited: a ten-second backend hiccup renders a 404 for a scheme that exists,
and `revalidate = 3600` caches that 404 for an hour.

Three changes:

1. **In the page component, delete the `try/catch` entirely.** Let the throw
   propagate. Only a literal `null` return — meaning a real HTTP 404 — may reach
   `notFound()`.
2. **In `generateMetadata`, keep the catch** (metadata cannot usefully throw)
   but stop claiming "Scheme not found" on a thrown error, because that is a
   false statement about a scheme that exists. Distinguish the two:
   - `null` → `title: 'Scheme not found | Sahayak'`, `robots: { index: false, follow: false }`
   - caught throw → `title: 'Sahayak'`, **no description**, same `robots` block
3. **Add `web/app/(public)/schemes/[slug]/error.tsx`** (a client component with
   `reset`) so the propagated throw renders "This scheme is temporarily
   unavailable" with a retry button, not the default error page. Add
   `web/app/(public)/schemes/[slug]/not-found.tsx` for the genuine-404 case,
   with a link back to `/schemes`.

The distinction you are preserving is: **"this does not exist" and "I cannot
reach the server right now" are different sentences and the user must be able
to tell which one they are being told.**

---

## 3. Work Order C1 — public surfaces, first tranche

Scope is the layout shell, the homepage, and the browse page. `/services`, the
`/for/*` audience pages, OG image generation and share cards are **C2 and are
not in scope** — do not start them.

### C1-1 — Make the public shell capable of full-bleed sections

**File:** `web/app/(public)/layout.tsx`

The shell wraps everything in `mx-auto max-w-7xl p-4 md:p-6`, so no section can
ever span the viewport. Every homepage section is therefore trapped in the same
column as a form, which is a large part of why it reads as a 2011 government
portal.

Restructure so `<main>` is full-width, and **individual sections** opt into a
`max-w-7xl` inner container. Add a small `Section` component
(`web/components/layout/Section.tsx`) taking `bleed?: boolean` and a background
token, so pages compose alternating full-bleed and contained bands.

The header stays contained, becomes `sticky top-0` with a backdrop that is a
**solid token colour, not a blur**, and gains a visible focus ring on every
interactive element.

### C1-2 — Typography and spacing scale

**File:** `web/app/globals.css`

The token system is sound — keep every existing colour token, keep Noto Sans
(it carries Devanagari and you will need it). What is missing is a display
scale. Add tokens for:

- a display size ramp for hero and section headings, fluid via `clamp()`, top
  end around `3.5rem` on desktop and **no smaller than `1.875rem` at 320px**
- `--tracking-tight` for display sizes only; body text keeps default tracking
- a benefit-figure treatment: tabular numerals, `font-variant-numeric:
  tabular-nums`, heavier weight — ₹6,000/year is the single most important
  string on any scheme card and must be the thing the eye lands on

**Body text never goes below 16px.** Not in captions, not in footnotes, not in
the footer. This product's users are on cheap phones in bad light.

### C1-3 — Rebuild the homepage

**File:** `web/components/home/LandingView.tsx` (rewrite) and
`web/app/(public)/page.tsx`

Make `page.tsx` a **server component** that fetches the real scheme list at
build time and passes it down, so the homepage's scheme data is real and
statically rendered. Reuse `getApiBase()`. If the fetch fails, render the page
**without** the featured-schemes section rather than with placeholder cards —
same rule as C0, an absent section is honest, a fake one is not.

Sections, in this order:

1. **Hero.** Headline states the job, not the product category — something in
   the shape of *"Find out which government schemes will actually pay you."*
   One supporting line. Then the **first question of the eligibility wizard
   inline** — a state dropdown and an age field with a "Check what I qualify
   for" button that deep-links into `/check` with those values prefilled. Do not
   ship a generic "Get Started" button; put the first step of the real task in
   the hero.
2. **The differentiator, stated plainly.** Three items, no icons-in-circles
   cliché: every answer quotes the exact line of the official guideline · you
   see the source document and when it was last verified · your profile stays on
   your device. Each links somewhere real.
3. **Featured schemes.** Real cards from the API — scheme name, state, category,
   and the benefit figure rendered in the C1-2 treatment. Link to
   `/schemes/[slug]`. Show up to 6, with a link to `/schemes` for the rest. This
   section is omitted entirely when the API is unreachable.
4. **How it works.** Three steps: answer a few questions → see what you qualify
   for and why → read the guideline line that decided it. The third step is the
   differentiator against myScheme.gov.in; give it the most visual weight.
5. **Closing call to action** into `/check`.

The **scheme count may only appear if it came from the API.** If you render
"9 schemes", it is because `schemes.length === 9` at build time.

### C1-4 — Rebuild the browse page

**File:** `web/app/(public)/schemes/page.tsx` and its view component

Currently a bare grid. It needs to work as a landing page for search traffic:

- filters for state and category, driven by **URL search params** (`?state=…`),
  so filtered views are linkable and indexable — not `useState`
- a text filter over scheme name
- result count that reflects the filter
- an explicit empty state when filters match nothing ("No schemes match these
  filters" + a reset link), never a blank grid
- an explicit unavailable state when the API is unreachable, distinct from the
  empty state — again, "nothing here" and "cannot reach the server" are
  different sentences

Cards use the same component as the homepage's featured section. Write it once.

### C1-5 — Motion, within a budget

Motion is the part of "modern" that is easiest to get wrong and most expensive
on the devices this product targets.

- **No new dependencies.** No framer-motion, no GSAP, no carousel library.
  CSS transitions and `IntersectionObserver` are sufficient for everything in
  C1-3 and C1-4.
- Section entrances: a short fade-and-rise, ~300ms, triggered once on scroll
  into view. Never on repeat. Never horizontal.
- Hover and focus transitions on cards and buttons: ~150ms.
- **`@media (prefers-reduced-motion: reduce)` must disable all of it.** This is
  not optional and I will check for it.
- **Performance ceiling: First Load JS for `/` must stay under 160 kB.** It is
  currently 124 kB. If a decision pushes it over, the decision is wrong. Paste
  the route table in your report.

---

## 4. Things that will not survive review

Stated in advance so you do not spend effort on them.

**Fabrication — any of these is an automatic rejection:**

1. Any statistic not fetched from the API at build time. No "50,000 citizens
   helped", no "₹2 crore disbursed", no "300+ schemes", no "trusted by".
2. Testimonials, quotes, or named people. There are no users to quote yet.
3. Partner, ministry, or government logos of any kind.
4. Any claim that Sahayak is official, government-run, or government-endorsed.
5. Placeholder scheme cards when the API is down. Omit the section.

**Visual clichés — these read as generic AI output, not as design:**

6. Purple or indigo gradients, and gradient text. The palette is the existing
   warm-civic tokens.
7. Glassmorphism, frosted-blur cards, `backdrop-filter` on the header.
8. Emoji used as interface iconography.
9. Stock photography of smiling farmers or families.
10. A dark hero on an otherwise light page purely for contrast drama.

**Engineering:**

11. New animation, carousel, or UI-kit dependencies.
12. `/` First Load JS above 160 kB.
13. Filter state in `useState` where the URL should hold it.
14. Body text below 16px, or touch targets below 48px.
15. Starting `/services` or `/for/*`. That is C2.
16. Editing any root `.md` file.

---

## 5. Definition of done

Run these and paste the real output:

```
cd web
npx tsc --noEmit          # must be silent
npm run build             # paste the full route table
npm run lint
```

Verify by hand, **with the backend stopped**:

- `/` renders with no featured-schemes section and no placeholder cards
- `/schemes` shows the "cannot reach server" state, not "no schemes found"
- `/schemes/pm-kisan` shows the `error.tsx` retry state, **not** a 404
- `/schemes/total-nonsense` — cannot be tested with the API down; test it with
  the API running and confirm it shows `not-found.tsx`

And with the backend running:

- `/` featured cards show real names and real benefit figures
- `/schemes?state=Karnataka` filters on load from the URL alone
- at 320px width, nothing overflows horizontally and no text is under 16px
- with OS "reduce motion" on, no section animates

Report each item with its commit hash. State plainly if you skipped or partially
completed anything. **A partial result reported honestly is fine. The B2 report
described the scheme page as complete when the regression in §2 was sitting in
it — that is the only outcome here that is not acceptable.**
