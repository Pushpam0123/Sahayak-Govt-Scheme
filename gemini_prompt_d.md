# Work Order D — Voice, four more languages, a real service worker, accessibility controls

You are `gemini_agent`. Work Order C is complete and accepted.

**What you did well across C1 and C2:** you took `/` from 124 kB down to 115 kB
by moving it server-side, added zero dependencies across the whole of C, built
the audience pages as a predicate over live data instead of a hardcoded list,
and made the OG card fall back to the generic site card rather than typesetting
a slug as a scheme name. When I gave you a contradictory instruction about
`/for/students`, you first resolved it the right way on your own. The dark
palette has a genuine elevation ladder and all three status colours clear AA.

**The one habit to fix:** you committed four times over a red build, because
`components/icons.tsx` sat unstaged while `tsc` failed. From now on
`npx tsc --noEmit` is a gate **before each commit**, not a check at the end of
the work order. A green tree at the end does not make the history bisectable,
and on a shared branch it hands the next agent a repo that does not build.

---

## 0. The idea behind this work order

Work Order D is where this product either becomes usable by the people it is
for, or becomes a demo with an impressive language dropdown.

**Translation is a truth problem, not a formatting problem.** You are about to
add Bengali, Marathi, Telugu and Tamil. The failure mode is not that the
translation is clumsy. It is that a machine-translated string quietly changes
what a benefit *is* — "annual income below ₹2 lakh" becomes "annual income above
₹2 lakh", or a caste category is rendered with a word that means something else
in that state. A citizen then makes a decision about money based on it.

So the governing rule for all of D is:

**Anything that states a rule, an amount, a legal right, or a quoted line of a
government document does not get machine-translated. Interface chrome does.**

The same rule applies to the other three items. A mic button that does nothing
on the user's browser is a lie about a capability. A service worker that serves
month-old scheme data without saying so is the cached-document trap from Phase 0
wearing a new hat. Every one of these features has an honest version and a
demo-shaped version, and the demo-shaped version is always easier.

---

## 1. Ground rules

1. Work **only inside `web/`**, on branch `phase-b-nextjs`, primary worktree.
2. **`npx tsc --noEmit` must be silent before every commit.** This is now a hard
   gate. See above.
3. Never run `git checkout`, `git switch`, `git stash`, `git rebase`.
4. Never disable a check to make something pass: no `@ts-ignore`,
   `eslint-disable`, `ignoreBuildErrors`, no skipped tests.
5. One commit per numbered item: `feat(web): <what> (D-<n>)`. No co-author line.
6. Do not edit any root `.md` file, `HANDOFF.md` included. Report in your reply.
7. **New dependencies:** none for D-2, D-3, D-5. For D-4 you may hand-write the
   service worker; do not add Workbox or `next-pwa`.

---

## 2. D-1 — Fonts first, or everything else renders as boxes

Do this before D-2. `layout.tsx` currently loads `Noto_Sans` with subsets
`['latin', 'devanagari']`. That covers English, Hindi and Marathi. It covers
**none** of Bengali, Telugu or Tamil — those three scripts will render as tofu
boxes (□□□) and you will not notice if you only test in English.

- Add `Noto_Sans_Bengali`, `Noto_Sans_Telugu` and `Noto_Sans_Tamil` from
  `next/font/google`, each with `display: 'swap'` and its own CSS variable.
- Do **not** load all four families on every page — that is roughly 400 kB of
  font data on a connection this product cannot assume. Attach the script
  families as CSS variables and let a `[lang]` selector in `globals.css` pick
  the right stack, so the browser downloads only the faces actually used.
- Verify each script renders real glyphs. Screenshot or describe what you saw
  for at least Bengali and Tamil in your report. "It compiled" is not
  verification of a font.

---

## 3. D-2 — Bengali, Marathi, Telugu, Tamil

`lib/i18n.ts` has a `Dict` interface with ~115 keys and two implementations.

### The completeness gate

`TRANSLATIONS: Record<Lang, Dict>` already forces every language to implement
every key. **Keep it that way.** Do not introduce `Partial<Dict>`, do not add a
`?` to any key, do not write a `t(key) ?? en[key]` fallback helper. TypeScript
refusing to compile an incomplete dictionary is the feature that stops this
product shipping a half-translated screen.

### What may and may not be translated

**Translate:** navigation, button labels, form labels, headings, error and empty
states, help text.

**Do not translate — leave verbatim:**

- scheme names (`Pradhan Mantri Kisan Samman Nidhi` stays as it is)
- rupee amounts and units — `₹6,000 / year` is never re-typeset, and digits stay
  Western Arabic numerals, not Devanagari or Tamil numerals
- any quoted line from a guideline document, and all citation metadata
- state and category names as they come from the API

The citation is the product. A translated quote is no longer a quote.

### Strings that state a rule or a right

Some keys carry eligibility language, the disclaimer, and the DPDP Act 2023
privacy text. Those are legally consequential.

- Add `reviewed: boolean` to a small per-language metadata record alongside
  `TRANSLATIONS`, `false` for all four new languages.
- Where `reviewed` is false, the language picker shows the language name with a
  plain-text marker — "(machine translation, not yet reviewed)" or the
  equivalent — and the disclaimer strip carries one extra line saying the
  translation has not been checked by a native speaker.
- English and Hindi are `reviewed: true`; do not touch them.

This is not a hedge. It is the difference between shipping four languages and
claiming four languages.

### Also

- `Lang` becomes `'en' | 'hi' | 'bn' | 'mr' | 'te' | 'ta'`.
- The head script in `layout.tsx` already sets `documentElement.lang`; widen its
  accepted values to all six. Do not add a second script.
- The language picker is currently a two-way toggle in two layouts. Replace with
  a proper `<select>` in both, showing each language in **its own script**
  (বাংলা, मराठी, తెలుగు, தமிழ்), 48px target.

---

## 4. D-3 — Voice input and read-aloud

Web Speech API only. No dependencies, no cloud speech service.

### The rule that matters

**Feature-detect, and render nothing when unsupported.** Do not render a
disabled mic, do not render a mic that shows "not supported" on tap. A control
that cannot work must not appear.

- Input: `window.SpeechRecognition || window.webkitSpeechRecognition`. Absent in
  Firefox and in every iOS browser. Additionally check that a locale for the
  **currently selected language** is plausible — do not offer Tamil dictation
  and silently transcribe English.
- Read-aloud: `speechSynthesis.getVoices()`, filtered by a `lang` prefix
  matching the selected language. `getVoices()` is frequently empty on first
  call — listen for `voiceschanged` before deciding a language is unsupported.
  If no voice matches, hide the control for that language only.

### Where each belongs

- **Voice input:** the chat composer on `/ask`. Transcription fills the input
  and the user presses send — **never auto-submit.**
- **Voice input on the wizard:** only on free-text fields. Do **not** put
  dictation on income, age, caste or gender. A misheard income silently changes
  an eligibility verdict, and those are the DPDP-sensitive fields.
- **Read-aloud:** the assistant's answer on `/ask`, and the eligibility verdict
  plus failed-rules list on `/results`. These are the two places where a
  low-literacy user most needs to hear rather than read.
- Every voice control needs a real `aria-label`, a visible active state while
  listening or speaking, and a way to stop.

---

## 5. D-4 — A real service worker

`public/manifest.json` exists; there is no service worker at all, so the app has
no offline capability today despite being described as a PWA.

Hand-write `public/sw.js` and register it from a small client component.

**Precache:** the app shell, `globals.css` output, the font files, the icons.

**Runtime strategy:**

- `GET /api/v1/schemes` and `GET /api/v1/schemes/[slug]` — **network-first**,
  falling back to cache.
- **Never serve cached scheme data silently.** When a response is served from
  cache, the UI must show when that data was stored — "Showing schemes saved on
  24 August". Store the timestamp alongside the cached response. This is the
  Phase 0 cached-document trap: content on disk with no provenance is not
  evidence of anything, and the same reasoning applies in the browser.
- **Never cache** `POST /api/v1/eligibility/match-all`, any chat or SSE
  endpoint, or `/api/v1/health`. A cached eligibility verdict is a wrong answer
  with a timestamp.
- Navigation requests: network-first with an offline fallback page.

**Updates:** the worker must not strand users on an old build. On a new worker,
show an unobtrusive "A new version is available — reload" prompt. Do not call
`skipWaiting()` unconditionally; that reloads assets under a user mid-form.

**Scope:** register only in production (`process.env.NODE_ENV === 'production'`)
so it does not fight the dev server's HMR.

---

## 6. D-5 — Font size and contrast controls

- **Font size:** three steps (default / large / larger) driving a `--font-scale`
  custom property on `:root`, consumed by the type scale you built in C1-2.
  Because that scale uses `clamp()`, multiply the whole expression — do not
  override individual sizes. Verify at "larger" that nothing overflows at 320px
  and no control drops below 48px.
- **Contrast:** a high-contrast mode raising border and body-text contrast.
  Default it from `prefers-contrast: more` when the user has expressed no
  preference, exactly as theme defaults from `prefers-color-scheme`.
- **Persistence:** both go in `localStorage` and are applied by the **existing**
  head script in `layout.tsx`, before paint, alongside theme and language. Do
  not add a second script and do not apply them in a `useEffect` — that
  reintroduces the flash you fixed in B2-4.
- **Placement:** a small accessibility control group in both layouts' headers,
  reachable by keyboard, each control labelled.

---

## 7. Things that will not survive review

1. `Partial<Dict>`, optional keys, or any English fallback that lets an
   incomplete translation render.
2. A translated scheme name, rupee amount, quoted guideline line, or citation.
3. Non-Western-Arabic numerals in benefit figures.
4. Four new languages presented as reviewed when they are machine-translated.
5. A mic or read-aloud control that appears where the browser cannot support it.
6. Dictation on income, age, caste or gender fields.
7. Auto-submitting a form from a voice transcript.
8. Cached scheme data rendered without the date it was stored.
9. Caching eligibility, chat, or health responses.
10. Unconditional `skipWaiting()`.
11. Loading all four new font families on every page.
12. Applying font-size or contrast in a `useEffect` instead of the head script.
13. New dependencies — Workbox and `next-pwa` included.
14. `/` First Load JS above 160 kB. It is 115 kB.
15. Any commit made while `npx tsc --noEmit` is failing.
16. Editing a root `.md` file, or any `git checkout` / `switch` / `stash` /
    `rebase`.

---

## 8. Definition of done

```
cd web
npx tsc --noEmit          # silent — and it was silent before every commit
npm run build             # paste the full route table
npm run lint
```

Verify by hand and report what you saw, not what you expect:

- each of বাংলা, मराठी, తెలుగు, தமிழ் renders real glyphs, no tofu boxes
- switching to Tamil leaves scheme names, ₹ amounts and citation quotes in their
  original form
- the language picker marks the four new languages as unreviewed
- in a browser without `SpeechRecognition` (Firefox or any iOS browser), no mic
  control appears anywhere
- with the network throttled to offline after one successful load, `/schemes`
  shows cached data **with the date it was stored**
- an eligibility check while offline fails honestly; it does not return a cached
  verdict
- at "larger" font size and 320px width, nothing overflows and no target is
  under 48px
- font size and contrast survive a hard reload with no flash

Report each item with its commit hash. State plainly anything skipped or partly
done. Given how much of D is browser-capability dependent, "I could not test
Telugu voice output because no Telugu voice is installed on this machine" is a
completely acceptable line in your report. Claiming it works when you did not
check is not.
