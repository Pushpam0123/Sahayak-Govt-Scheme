STOP — do this before writing another line of code.

Your migration work is currently uncommitted **on the wrong branch**. `git rev-parse --abbrev-ref HEAD` reports `phase-0-truth`, not `phase-b-nextjs`. You have ~48 uncommitted changes including 38 deleted files (the entire `web/src/**` tree). None of it is committed anywhere. A stray `git checkout`, `reset`, or `stash` right now loses all of it.

This is my fault, not yours — I told both agents to use separate branches, but you and the backend agent share one working directory, so a checkout by either of you silently moves the other. Branches were never sufficient; this needed `git worktree`.

## 1. Secure your work — one command

```bash
git checkout -B phase-b-nextjs
```

`-B` resets `phase-b-nextjs` to the current HEAD and switches to it, carrying your uncommitted working tree across. There are no conflicts because the branch is being re-pointed at the commit your work is already based on. This also drops a stray duplicate commit (`01451a9`) that ended up on that branch during the same mix-up.

Then commit immediately, before anything else:

```bash
git add -A
git commit -m "wip: next.js app router scaffold"
```

Verify you are in the right place before continuing:

```bash
git rev-parse --abbrev-ref HEAD    # must print phase-b-nextjs
git log --oneline -3
```

## 2. Do not change branches again

If you believe you need to switch, merge, rebase, stash, or reset anything — **stop and report instead.** The other agent may be working in this same directory. Commit early and often on `phase-b-nextjs`; small frequent commits are the only real protection here.

## 3. Good news — Work Order A landed, and your contract is live

The backend agent finished A. `phase-b-nextjs` now includes it, so you are building against the final backend:

- **`tls_verified` is live in the API**, exactly as promised. `GET /api/v1/schemes/{scheme_id}` gains `"tls_verified": boolean` on each element of the `documents` array. Chat citations (`POST /chat` and the SSE `context`/`done` events) gain the same field per citation object.
- Behaviour is unchanged from your instructions: treat it as **optional**. Absent or `true` renders nothing. Explicit `false` renders a short, plain, non-alarming note that the source could not be certificate-verified. Three of the nine schemes (`pm-jjby`, `pm-sby`, `atal-pension-yojana`) will legitimately return `false` — the host serves an incomplete certificate chain — so this path is real and will be visible, not theoretical.

## 4. Continue Work Order B

Resume from where you stopped. Everything in `agent_instruction.md` §6 still applies unchanged, and these three are the ones most likely to bite:

- **Nothing may change visually.** B is architecture only. Port the wizard, chat, scheme detail and console — do not rewrite them.
- **The build must succeed with the API unreachable.** `generateStaticParams` returns `[]` and logs a warning on any fetch failure, with `dynamicParams = true` and ISR. Verify deliberately: stop the API, then build.
- **Per-scheme metadata is the point.** `generateMetadata` per scheme page, real title/description/canonical/OG from that scheme's own data.

Stay inside `web/**`, `infra/Dockerfile.web`, and the `web` service block in `infra/docker-compose.yml`. The backend is finished and is not yours to touch.

When B is done, report using the format in `agent_instruction.md` §6.8 — including the **"Not done"** section, actual build and test output, the per-scheme metadata proof, and `git diff --name-only phase-0-truth..phase-b-nextjs` showing you stayed in bounds. Then stop and wait for review.
