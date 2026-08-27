# Work Order D-FIX — Two Defects Before D Can Close

## 0. Diagnosis

Your report says Work Order D added "a handwritten PWA service worker showing offline
cache date provenance."

It does not show offline cache date provenance. The code that would have shown it never
executes in a browser. I verified this against the tree at `d734c14`.

That sentence is the thing this project exists to prevent, appearing in a status report
instead of in a scheme page. You built a mechanism, the mechanism looked right in the
file, and the report described the intent rather than the behaviour. Nobody checked
whether the branch it lives in is ever reached.

This is the same reflex as B2 and C1, moved up one level. In B2 it was a page that looked
complete when the backend was down. In C1 it was copy that claimed verification the corpus
could not support. Here it is a completion report claiming a capability the build does not
have. The pattern is constant: when something is hard to verify, the confident description
wins over the checked one.

D-2, D-3 and D-5 are accepted with no changes. Those three are genuinely good work —
the `Record<Lang, Dict>` typing makes a half-translated screen a compile error, keeping
`useSpeechRecognition` out of `EligibilityWizard` was the right instinct without being
told twice, and putting both accessibility settings in the existing head script instead
of a `useEffect` avoided the flash entirely.

Two things are broken. Fix them and D closes.

## 1. Rules

1. Never disable a security control, test, type check, or lint rule to make something
   pass. Escalate instead.
2. `npx tsc --noEmit` must be silent before every commit. You held this through all of D.
   Keep it.
3. One commit per fix. Both must be independently revertible.
4. For each fix, your report must state **how you observed the fix working**, not what the
   code is supposed to do. If you could not observe it, say that instead. "I could not test
   this without a device" is an acceptable sentence. A description of intent presented as
   an observation is not.

## 2. D-FIX-1 — The font cycle (site-wide, all six languages)

`layout.tsx` declares `notoSans` with `variable: '--font-sans'`. next/font emits:

```css
.__variable_d47259{--font-sans:"Noto Sans","Noto Sans Fallback"}
```

`globals.css` then declares, in the `@theme` block:

```css
--font-sans: var(--font-sans), "Inter", ui-sans-serif, ...;
```

Both declarations target `<html>`. `:root` and `.__variable_d47259` have identical
specificity (0,1,0), and `globals.css` loads second in the emitted document, so the
`:root` declaration wins the tie. `--font-sans` therefore resolves to a `var()` reference
to itself. Per the CSS custom property cycle rules that computes to the guaranteed-invalid
value, `body { font-family: var(--font-sans) }` becomes invalid at computed-value time,
and the body falls back to the browser default. The same cycle exists in `--font-bengali`,
`--font-telugu` and `--font-tamil`.

Before D-1 this line was a literal — `--font-sans: "Noto Sans", "Inter", ...` — which
worked because the family next/font loads is genuinely named `Noto Sans`. D-1 replaced a
working literal with a self-reference.

The fix is to stop the two systems claiming the same name. In `layout.tsx`:

```
'--font-noto-sans'  '--font-noto-bengali'  '--font-noto-telugu'  '--font-noto-tamil'
```

and in `globals.css`:

```css
--font-sans: var(--font-noto-sans), "Inter", ui-sans-serif, system-ui, -apple-system,
  "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif;
--font-bengali: var(--font-noto-bengali), var(--font-sans), sans-serif;
--font-telugu: var(--font-noto-telugu), var(--font-sans), sans-serif;
--font-tamil: var(--font-noto-tamil), var(--font-sans), sans-serif;
```

This also restores the fallback stack. Under the current code there is no cascade outcome
where both the loaded font and the `"Inter"` / `system-ui` / Devanagari chain survive
together — one of the two declarations always loses whole.

**How to verify.** `tsc` and `next build` cannot see a CSS cycle; only rendering can. Run
the dev server, open a page, and confirm in devtools that the computed `font-family` on
`body` is a real stack and not the browser default. Then switch the language picker to
Bengali, Telugu and Tamil in turn and confirm glyphs render rather than tofu boxes. Six
languages, six looks. This is the check that would have caught D-1 at the time.

## 3. D-FIX-2 — Provenance is on a layer that never runs

Every scheme fetch in this app is server-side:

```
web/app/(public)/page.tsx
web/app/(public)/schemes/page.tsx
web/app/(public)/schemes/[slug]/page.tsx
web/app/(public)/schemes/[slug]/opengraph-image.tsx
web/app/(public)/for/[audience]/page.tsx
web/app/sitemap.ts
```

The browser never issues a request to `/api/v1/schemes`. Rule 3 of `sw.js` — the
network-first branch that stamps `x-sahayak-cached-at` — is unreachable. The header it
writes is read by nothing; grep the tree and you will find one writer and zero readers.

What actually serves offline is rule 4, the navigation handler. It caches the
server-rendered HTML of `/schemes/[slug]` — benefit amounts, eligibility rules, citations,
the "last verified" line — and serves it back with no timestamp and no offline indicator.
A user offline reads a cached scheme page indistinguishable from a live one.

The only provenance notice that ships is in `browse-client.tsx`, driven by a separate
`localStorage['sahayak-schemes-cached-at']` clock, on one page. That leaves two independent
clocks, neither attached to the payload being displayed, and the one that is displayed can
disagree with what is on screen: localStorage is written when the client last loaded
successfully, the cache is written when the SW last stored a response, and cache entries
can be evicted while localStorage persists.

**What to build.** Move provenance to the layer that actually caches.

1. In the navigation handler, at `cache.put` time, stamp the stored HTML response with the
   store time — same technique you already wrote for rule 3, applied where it runs.
2. On the offline path, when you serve a cached navigation response, make that stamp
   reachable by the page. Any mechanism is fine as long as the value comes from the
   response being served and not from a parallel clock.
3. Any cached scheme page must render the stored date. Not a generic "you are offline"
   banner — the date the content on screen was stored. If you cannot determine that date
   for a given response, the page says the data is cached and the date is unknown. It does
   not omit the caveat and it does not guess.
4. Delete rule 3 or leave it with a comment stating it is inert until a client-side scheme
   fetch exists. Do not leave unreachable code that looks like a working safeguard —
   that is what produced the claim in your report.
5. Reconcile `browse-client.tsx` onto the same mechanism, or leave it and state plainly in
   your report that browse uses a different clock and why.

**Also in the same handler.** The final fallback is `caches.match('/')`, which serves
homepage HTML at a scheme URL. An offline user following a link to an uncached scheme gets
the homepage rendered under that address with no explanation. Return an offline response or
a real "not available offline" page instead, so the URL keeps telling the truth.

**How to verify.** Build, serve the production build, load a scheme page, then go offline
in devtools and reload it. Confirm the page renders with a visible stored date. Then go
offline and navigate to a scheme you have never opened, and confirm you do not get the
homepage.

## 4. What is NOT in scope

Do not start Work Order E. Do not refactor the fetch layer to be client-side to make the
service worker's existing rule 3 correct — the server-side fetching is deliberate and is
what gives the scheme pages their SEO. Fix the caching layer to match the app, not the app
to match the caching layer.

## 5. Report format

Two commits, two entries. For each: the hash, what changed, and what you observed when you
tested it. If a check was not possible on your machine, name the check and say it was not
run. An unverified claim costs more than an untested feature, because the untested feature
is still on the list and the unverified claim is not.
