# Work Order D-FIX-2b — The Banner Asserts Staleness It Cannot Observe

## 0. Diagnosis

D-FIX-1 is accepted. I checked the emitted CSS, not the source: `--font-sans` now resolves
to `var(--font-noto-sans), "Inter", ...` with the fallback chain intact and no cycle.

D-FIX-2 put provenance on the right layer. Deleting the unreachable rule 3 instead of
leaving it as decorative safety code was the right call, the 503 offline page in place of
`caches.match('/')` is correct, and reading the stamp in a `useEffect` rather than during
render avoids the hydration mismatch that the obvious implementation would have caused.

But the banner now states something it has not observed.

```js
setIsOffline(!navigator.onLine || Boolean(stamp));
```

`stamp` is evidence the document was served from cache. `navigator.onLine` is not. They are
different facts, and this line ORs them into one.

The consequence: a user sitting on a live, freshly-served scheme page who loses their
connection gets a banner reading **"Showing cached scheme content (storage date unknown —
offline mode)."** The content on screen is not cached. It came off the network seconds ago.
The banner has invented staleness, and then reported the date of that invented staleness as
unknown.

That "date unknown" branch exists because I asked for it — for the case where a response is
genuinely cached but carries no readable stamp. It was a last-resort honesty path. Wiring
`navigator.onLine` into the condition turned it into the common case, and made it a
fabrication rather than a caveat.

This is worth sitting with, because it is a subtler version of the same failure each time:
the page must not look wrong, so a state that is *probably* true gets asserted as
*definitely* true. Being offline usually correlates with seeing cached content. Usually is
not a source.

## 1. Rules

1. Never disable a security control, test, type check, or lint rule to make something pass.
2. `npx tsc --noEmit` silent before every commit.
3. One commit. Independently revertible.
4. Report what you **observed**, not what the code does. Both previous D-FIX entries
   described code changes; neither described a test. This time, offline-toggle in devtools
   and tell me what you saw on screen in each of the three states in §4.

## 2. D-FIX-2b-1 — Separate the two claims

The stamp is the only evidence that the document on screen came from cache. Key the
provenance banner on the stamp alone:

- Stamp present → render the date. This is the cached case.
- Stamp present but unparseable → render the "storage date unknown" caveat. This is the
  last-resort path, and it should be rare.
- No stamp → render no provenance claim, online or offline. The document came from the
  network; its age is now.

If you want an offline indicator, that is a **separate element with separate wording** that
makes no claim about the age of what is on screen — "You are offline. Some features are
unavailable." It may sit next to the provenance banner, and both may show at once when a
user is offline *and* looking at a cached page. What it may not do is borrow the provenance
banner's sentence.

## 3. D-FIX-2b-2 — The stamp goes stale on client-side navigation

`window.__SW_CACHED_AT__` and the injected `<meta>` are properties of the **document** the
browser loaded. This is an App Router app, so a user navigating from a cached page to
another route does not get a new document — the stamp persists in the JS context and in
`<head>`, while the content on screen has been replaced.

Come back online, navigate from a cached scheme page to a freshly-fetched one, and the
banner keeps reporting the old document's storage date against new content. That is the
two-disagreeing-clocks problem from D-4, reintroduced in a new shape.

Fix: the stamp describes the route that was loaded, so scope it to that route. Record the
pathname at mount, compare against `usePathname()`, and drop the provenance claim once they
diverge. If you prefer a different mechanism, the requirement is only this: **the banner may
never display a date that does not describe the content currently rendered.**

## 4. Verification — three states, on screen

Build, serve the production build, and check all three. Report what you saw in each.

1. **Online, network-served page.** Expect: no provenance banner.
2. **Offline, page never visited before.** Expect: the 503 offline page. Not the homepage.
3. **Offline, page cached from an earlier visit.** Expect: content, plus a banner naming the
   date it was stored.

Then the regression that motivated this order: **load a scheme page online, go offline in
devtools without reloading.** Expect: no provenance banner, because nothing on screen is
cached. An offline notice is fine; a storage-date claim is not.

## 5. Smaller thing, same commit

`OfflineProvenanceBanner` is mounted in `(public)/layout.tsx`, so it renders on `/privacy`,
`/services`, `/for/*` and `/` as well — all saying "scheme content". Make the wording fit
where it appears, or say "page" instead of "scheme content".

## 6. After this

This closes Work Order D. Do not start Work Order E; I will merge `phase-b-nextjs` into
`phase-0-truth` and issue the next order from there.
