# Work Order C2 — Fix the C1 copy defects, then build the remaining public surfaces

You are `gemini_agent`. C1 is reviewed.

**Accepted:** C0, C1-1, C1-2, C1-4 and C1-5 are structurally correct. The
`(public)`/`(app)` split holds, the browse page is genuinely URL-driven, "no
matches" and "unable to load" are distinct states, the `error.tsx` and
`not-found.tsx` boundaries say different things, and `prefers-reduced-motion` is
enforced. Zero new dependencies, zero gradients, zero glassmorphism, zero
fabricated counters — the whole §4 cliché list was respected. And `/` came in at
**115 kB, down from 124**, because you made the homepage a server component.
That is the right instinct and it is the opposite of what most agents do when
told to make something look modern.

**Not accepted:** the homepage *copy*. Every structural rule was followed and
then six factual claims were written into the marketing text that the codebase
itself contradicts. §1 fixes them. Do that before anything else.

---

## 0. The idea behind this work order

C1 §0 warned that marketing surfaces are where projects invent things. You
avoided every fabrication I listed — no fake counters, no testimonials, no
"300+ schemes". Then you invented four new ones I had not thought to list:
"official gazettes", "transparent TLS certificate verification", "page number
and clause", "official government rule sets".

The lesson is not "here are four more banned phrases". It is:

**Every factual sentence on a public surface must be traceable to a specific
field in the corpus or a specific behaviour in the code. If you cannot point at
the thing that proves it, cut the sentence.**

The tell in all four cases was the same — they are sentences that sound like
what a government data product *ought* to say, written without checking what
this one actually does. `SchemeDetailView` already renders `tls_verified ===
false` correctly. You wrote a homepage claiming universal TLS verification
while shipping a component that exists precisely because it is not universal.

C2 has a second, sharper version of this trap. Read §2 before you write a line
of it.

---

## 1. C1-FIX — six corrections (BLOCKING, do first)

**File:** `web/components/home/LandingView.tsx` unless stated otherwise.

### C1-FIX-a — Stop inventing the user's own profile (most serious)

Lines 19-20 initialise `selectedState = 'Madhya Pradesh'` and `age = '30'`, and
`handleHeroSubmit` falls back to those same two values. A user in Kerala who
taps "Check what I qualify for" without editing the fields gets an eligibility
verdict computed for **a 30-year-old in Madhya Pradesh, presented as their own
result.** The age input even carries `placeholder="e.g. 30"` that can never
appear, because the field is pre-filled with 30.

Fabricating scheme data is bad. Fabricating *the user's own input* is worse,
because it produces a confidently wrong answer personalised to someone who never
gave you the data.

- Both fields start **empty**. The state `<select>` gets a
  `<option value="">Select your state</option>` placeholder.
- The submit button is `disabled` until both have real values, with
  `aria-disabled` and a visible disabled style.
- `handleHeroSubmit` writes **only** values the user actually entered. Delete
  both `|| 'Madhya Pradesh'` and `isNaN(parsedAge) ? 30 : parsedAge`.

### C1-FIX-b — "official gazettes" is false (lines 43, 155)

The corpus is nine scheme guideline documents from ministry and bank websites —
`pmkisan.gov.in`, `jansuraksha.gov.in`, and similar. The Gazette of India is a
specific legal publication and not one of these documents is from it.

Replace with "official scheme guidelines" or "official government scheme
documents" in both places.

### C1-FIX-c — The universal TLS claim is contradicted by our own corpus (line 155)

"Every scheme document is indexed directly from … with transparent TLS
certificate verification."

Three of the nine are fetched under an explicit `tls_insecure: true` opt-in,
because `jansuraksha.gov.in` serves its leaf certificate without the
intermediate. That is documented in `ingest/corpus.yaml` and it is why
`tls_verified` exists as a field at all.

Either drop the TLS clause entirely, or state the truth: that certificate
verification status is recorded and **shown per document**. Your
`SchemeDetailView` and `CitationInspector` already do exactly that. The homepage
must not contradict the scheme page.

### C1-FIX-d — "page number, and clause" (line 135)

Chunks carry character offsets and document references, not page numbers or
clause numbers. Describe what the citation inspector actually displays. If you
are unsure, open `CitationInspector.tsx` and describe what it renders.

### C1-FIX-e — "official government rule sets" (line 229)

`rules_json` is authored by this project from guideline text. It is *derived
from* official guidelines; it is not an official rule set published by anyone.
"Derived from official scheme guidelines" is accurate.

### C1-FIX-f — 16px floor and one stray "verified"

- Hero form labels use `text-sm` (14px). §4 rule 14: body and label text never
  below 16px. Fix here and in `error.tsx` and `not-found.tsx`.
- In `not-found.tsx`, change the button label "Browse Verified Schemes" to
  "Browse all schemes", and drop "verified" from the body sentence. The schemes
  *are* verified, so it is not false — but "verified" as a decorative adjective
  is how the drift starts. Reserve the word for where `verified_at` backs it in
  the UI.

---

## 2. Before you build the audience pages — read this

`PLAN.md` §8.3 lists `/for/students`, `/for/farmers`, `/for/entrepreneurs` and
`/for/women`. I wrote that route list before auditing the corpus against it. I
have now audited it. Here is what nine schemes actually support:

| Audience | Schemes that genuinely apply |
| --- | --- |
| Farmers | PM-KISAN, PMFBY — plus PMJJBY / PMSBY / APY, which any adult qualifies for |
| Women | PMMVY, MP Ladli Behna, Stand-Up India (women borrowers) |
| Entrepreneurs | Stand-Up India. That is all. |
| **Students** | **None. There is not a single scholarship in the corpus.** |

So: **do not build `/for/students`.** Not with "coming soon" content, not with
scholarships you know exist in the real world but that are not in our corpus,
not with the insurance schemes padded in to make the page look populated. A page
titled "Government schemes for students" listing PMSBY accident cover is exactly
the kind of thing that destroys the product's credibility.

`/for/entrepreneurs` has exactly one scheme. Build it anyway, and let it show
one. A page that honestly shows one result is a working page.

This is the C2 trap, stated plainly: **you will feel pressure to pad these pages
because they look thin. Do not. The thinness is accurate, and it is temporary —
Phase 2 brings 300+ schemes and these pages fill themselves if you build them
from data.**

---

## 3. Work Order C2

### C2-1 — Audience pages, generated from data

Build **one dynamic route**, `web/app/(public)/for/[audience]/page.tsx`, not
four hand-written pages.

- Define the audience map in `web/lib/audiences.ts`: a slug, a display name, a
  short honest intro, and a **predicate over `SchemeInfo`** (matching on
  category, state, and scheme id) that decides membership. No hardcoded arrays
  of scheme ids that will rot.
- `generateStaticParams` returns only audiences with **at least one real match**
  against the live scheme list. `students` therefore does not generate today and
  starts generating on its own the moment a scholarship enters the corpus.
- `dynamicParams = false`, so an unknown or unsupported audience 404s rather
  than rendering an empty page.
- `generateMetadata` per audience, following the C0 pattern: real data or
  `noindex`, never an invented description.
- If the API is unreachable at request time, `throw` — the same three-way rule
  as `getSchemeData`. Add an `error.tsx` for the segment.
- Each page: a heading, the honest intro, the matching scheme cards using the
  **existing** card component, and a link into `/check`. State the result count
  from `matches.length`. Never state a count you did not compute.

### C2-2 — `/services`

Currently a stub. It explains what Sahayak actually does, in four blocks that
each link to the working route: eligibility check (`/check`), grounded answers
(`/ask`), browse and compare (`/schemes`), save and share (`/saved`).

Describe only behaviour that exists today. If a feature is planned but not
built — voice input, the other four languages — it does not appear on this page.
Work Order D builds those; the page can be updated then.

### C2-3 — Dynamic OG images

Use `next/og`'s `ImageResponse`. No new dependencies; it ships with Next.

- `web/app/(public)/schemes/[slug]/opengraph-image.tsx` — scheme name, state,
  category, and the benefit figure in the C1-2 tabular treatment, on the
  warm-civic palette.
- A default site card for `/`, `/schemes`, `/services`.
- **The scheme card renders only from real API data.** If the fetch fails, fall
  back to the generic site card — never a card with the slug typeset as if it
  were a verified scheme name.
- No statistics on any card. Name, state, category, benefit figure, wordmark.
- Set `size` to 1200×630 and `contentType` to `image/png`.
- Add `alt` text.

Verify at least one card renders by hitting its URL in a running dev server, and
say in your report that you did.

### C2-4 — Dark mode, designed rather than derived

Dark is currently the light palette with tokens swapped, which is why it reads
as a console rather than a designed theme.

- Go through the dark token block in `globals.css` and set surface elevations
  deliberately: page darkest, cards a step up, never pure `#000`.
- Borders in dark need lower contrast than a naive inversion produces; check
  every `--border-*` token by eye.
- **Every status colour must clear WCAG AA (4.5:1) against its dark surface** —
  `--success`, `--warn`, `--danger` and their `-soft` variants. Naive inversion
  reliably fails this and these colours carry eligibility verdicts.
- Shadows do almost nothing on dark backgrounds; use border and surface
  elevation to separate layers instead.
- Check the homepage, `/schemes`, a scheme detail page and one audience page in
  both themes before committing.

---

## 4. Things that will not survive review

1. `/for/students` in any form.
2. Any scheme appearing on an audience page it does not genuinely serve, to make
   the page look fuller.
3. Any count, statistic, or "N schemes" not computed from live data at build
   time.
4. Hardcoded arrays of scheme ids where a predicate over the data belongs.
5. Any claim on `/services` about a feature that does not work today.
6. An OG card built from a slug when the API fetch failed.
7. New dependencies. `next/og` is built in; nothing else is needed.
8. `/` First Load JS above 160 kB. It is 115 kB — keep the headroom.
9. Body or label text below 16px; touch targets below 48px.
10. Gradients, glassmorphism, emoji-as-icons, stock photography, testimonials,
    partner logos, or any claim that Sahayak is official or government-run.
11. Editing any root `.md` file, `HANDOFF.md` included. Report in your reply.
12. `git checkout`, `git switch`, `git stash`, `git rebase` — another agent is
    working in `../sahayak-backend`.
13. Any suppressed check: `@ts-ignore`, `eslint-disable`, `ignoreBuildErrors`.

---

## 5. Definition of done

```
cd web
npx tsc --noEmit          # silent
npm run build             # paste the full route table
npm run lint
```

Confirm in the route table that **`/for/students` is absent** and
`/for/farmers`, `/for/women`, `/for/entrepreneurs` are present.

With the backend **stopped**:
- `/` renders with no featured section, and the hero submit stays disabled on
  an untouched form
- `/for/farmers` shows the segment error state, not an empty page
- `/schemes/pm-kisan` shows `error.tsx`, not a 404

With the backend **running**:
- `/for/entrepreneurs` shows exactly one scheme and says so
- the scheme OG image URL returns a real PNG
- all four surfaces read correctly in both light and dark
- at 320px nothing overflows and no text is under 16px

Report each item with its commit hash, and state plainly anything you skipped or
only partly finished. C1's report described the homepage as complete while six
false claims sat in its copy. **A partial result reported honestly is fine; a
complete-sounding report that is not is the one outcome that is not.**
