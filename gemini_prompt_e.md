# Work Order E — Frontend Close-Out

This is the last work order on `phase-b-nextjs`. When it lands, D closes, I merge into
`phase-0-truth`, and the remaining work moves to the backend track. Four items.

## 0. Diagnosis

D-FIX-1 is accepted. I checked the emitted CSS rather than the source: `--font-sans` now
resolves to `var(--font-noto-sans), "Inter", ...` with the fallback chain intact and no
cycle.

D-FIX-2 put provenance on the right layer. Deleting the unreachable rule 3 instead of
leaving it as decorative safety code was right, the 503 offline page in place of
`caches.match('/')` is right, and reading the stamp in a `useEffect` rather than during
render avoided the hydration mismatch the obvious implementation would have caused.

Then the banner asserted something it had not observed, and separately, this work order
found that a commit claiming DPDP Act 2023 compliance shipped an app with no way for a user
to delete their caste, income and gender. Both are the same failure at different scales: a
state that is *probably* fine gets asserted as *definitely* fine, because checking is
harder than claiming.

## 1. Rules

1. Never disable a security control, test, type check, or lint rule to make something pass.
2. `npx tsc --noEmit` silent before every commit.
3. One commit per item, four commits, each independently revertible.
4. Report what you **observed**, not what the code does. Every D and D-FIX report so far has
   described code changes; none described a test. For this order, §2 and §4 both specify
   exact states to put the app into. Tell me what you saw in each.

## 2. E-1 — The provenance banner asserts staleness it cannot observe

```js
setIsOffline(!navigator.onLine || Boolean(stamp));
```

`stamp` is evidence the document came from cache. `navigator.onLine` is not. They are
different facts and this line ORs them into one.

A user sitting on a live, freshly-served scheme page who loses connection gets **"Showing
cached scheme content (storage date unknown — offline mode)."** The content on screen is not
cached; it came off the network seconds ago. The banner invented staleness, then reported
the date of that invented staleness as unknown.

The "date unknown" branch exists because I asked for it — for a response genuinely cached
but carrying no readable stamp. It was a last-resort honesty path. Wiring `navigator.onLine`
into the condition made it the common case, and turned a caveat into a fabrication.

**Key the provenance banner on the stamp alone.**

- Stamp present and parseable → render the date. This is the cached case.
- Stamp present but unparseable → "storage date unknown". Rare, last resort.
- No stamp → no provenance claim, online or offline. The content came from the network.

An offline indicator is fine as a **separate element with separate wording** that makes no
claim about the age of what is on screen — "You are offline. Some features are unavailable."
Both may show at once. What it may not do is borrow the provenance banner's sentence.

**Second half of the same defect.** `window.__SW_CACHED_AT__` and the injected `<meta>` are
properties of the document the browser loaded. This is an App Router app: navigating from a
cached page to another route does not load a new document, so the stamp persists in the JS
context and in `<head>` while the content on screen is replaced. Come back online, navigate
away from a cached page, and the banner reports the old document's storage date against new
content — the two-disagreeing-clocks problem from D-4 in a new shape.

Scope the stamp to the route it describes: record the pathname at mount, compare against
`usePathname()`, drop the claim when they diverge. Any mechanism is fine. The requirement is
only this: **the banner may never display a date that does not describe the content
currently rendered.**

**Observe four states and report each:**

1. Online, network-served page → no provenance banner.
2. Offline, page never visited → the 503 offline page, not the homepage.
3. Offline, page cached from an earlier visit → content plus a banner naming the stored date.
4. **The regression:** load a scheme page online, then go offline in devtools *without
   reloading* → no provenance banner. An offline notice is fine; a storage-date claim is not.

## 3. E-2 — There is no way to delete a profile

`EligibilityWizard` persists state, caste, income, age and gender to `localStorage`. I
grepped the entire tree for `removeItem`, `localStorage.clear`, and every spelling of delete,
clear and erase I could think of. There is no deletion path. Not in the UI, not in a helper,
not anywhere.

Commit `c495625` says "DPDP Act 2023 compliance". Under the DPDP Act, caste, income and
gender for an identifiable person are exactly the category that carries a deletion right.
Shipping storage with no erasure and describing it as compliance is a legal claim the code
does not support.

Build the deletion path:

1. A visible control on `/saved` — and reachable from the privacy page — that erases the
   stored profile, saved applications, and every `sahayak-*` key the app has written.
   Enumerate them explicitly; do not call `localStorage.clear()`, which would take out
   theme, language and accessibility settings the user did not ask to lose. Actually
   deciding which of those to keep is your call, but state the decision in your report.
2. A confirmation step, because it is irreversible.
3. After deletion, the app returns to its first-run state without a reload artifact —
   no stale profile rendered from React state that outlives the storage it came from.
4. On the privacy page, state plainly what is stored, where it is stored (this device,
   not a server), and how to delete it. If a claim on that page is not true of the current
   build, fix the claim or fix the build.

## 4. E-3 — Consent is a caption, not a step

The only consent in the app is one line inside the wizard:

```
<span className="text-xs text-muted">By clicking proceed, you give explicit consent
to calculate matching benefits.</span>
```

Twelve-pixel grey text, passive voice, no affirmative action, no statement of what is
collected, no purpose limit, no retention statement, no mention of deletion. `PLAN.md` §4
Phase 4 says: *make consent a step in the wizard, not a footer checkbox.* This is a footer
checkbox without the checkbox.

Make it a step. Before the first sensitive question — not after, and not on the submit
button — the wizard states:

- **What** is collected: state, age, income, caste category, gender.
- **Why**: to check eligibility rules against your answers. Nothing else.
- **Where it goes**: stored on this device. Say whether anything is sent to the server, and
  if it is, say what and when. Do not write "stored locally" if the eligibility call posts
  it.
- **That it can be deleted**, with the control from E-2 reachable from here.

The user proceeds by an affirmative action. Skipping consent means not proceeding into the
sensitive questions — it does not mean proceeding with a default of yes.

If the honest version of any sentence above is uncomfortable — for instance if income does
get posted to the API — write the uncomfortable sentence. A consent notice that describes a
nicer system than the one running is worse than no notice, because it is evidence of intent.

## 5. E-4 — Honesty-bearing text below the legibility floor

C1 set a 16px floor for body text. There are 86 `text-xs` usages in `web/`. Most are
probably legitimate — badges, metadata, captions — and I am **not** asking you to sweep them.

I am asking for one category. Every piece of text whose job is to qualify, caveat, or
disclose must clear 16px:

- the consent copy from E-3
- the machine-translation notice in `DisclaimerStrip` (currently `text-xs`, inside a
  `text-sm` container)
- the provenance banner from E-1 (currently `text-sm`)
- the standing disclaimer

These are the sentences that keep the product honest, and they are currently set smaller
than the claims they qualify. A Bengali user who most needs to read "this translation is
unreviewed" is reading it in the smallest type on the page.

While you are in `DisclaimerStrip`: the unreviewed-translation notice is hardcoded English.
A user who selected Telugu because they do not read English cannot read the warning that the
Telugu is unreliable. Render it in the selected language **and** keep the English. It is
machine-translated like everything else in that dictionary, and that is acceptable here —
an unreviewed warning that reaches the reader beats a reviewed one that does not.

## 6. Report format

Four commits, four entries: hash, what changed, and what you observed. For E-1, all four
states from §2. For E-2, whether deletion actually cleared storage when you checked devtools
Application → Local Storage, and which keys you chose to preserve. For E-3, whether income
is posted to the API, because that determines what the consent text has to say.

If a check was not possible on your machine, name it and say it was not run. An unverified
claim costs more than an untested feature — the untested feature is still on the list, and
the unverified claim is not.
