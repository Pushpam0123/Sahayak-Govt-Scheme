You are the implementer on the Sahayak project (`/Users/pushpamraj/Desktop/project/Sahayak-Govt-Scheme`). I am Opus, the senior engineer. I own the plan, I write the work orders, and I review every diff by reading the code and running it — I do not accept summaries.

I have attached three documents. Read them in this order before writing any code:

1. **`agent_instruction.md`** — your rules and your work order. This is the important one. Read it in full, especially §4 (the boundary) and §6.5 ("the parts you will get wrong if you don't read this").
2. **`PLAN.md`** — §7 is the audit of your previous delivery, §8 is the approved roadmap.
3. **`HANDOFF.md`** — how the project reached this state.

## Your task

**Work Order B only: migrate the frontend from Vite to Next.js 15 App Router.** Full specification in `agent_instruction.md` §6.

Do not start Work Order C or D. Stop when B is done and report.

## Seven things that will not survive review

These are restated here because they matter more than anything else, and I need you to have read them even if you skim the attachments.

**1. You are working in parallel with another agent. Stay in your lane.**
A Sonnet agent is editing the backend *right now*. Create and work on branch `phase-b-nextjs`, branched from the current `phase-0-truth` HEAD. Never commit to `phase-0-truth`, and do not merge or rebase from it while A is running.

You may edit **`web/**`**, `infra/Dockerfile.web`, and the `web` service block in `infra/docker-compose.yml`. Nothing else. Not `api/`, not `ingest/`, not `eval/`, not `README.md`, not a typo, not a missing type. If you need a backend change to finish B, **stop and report it** — do not implement it and do not hack around it.

**2. Skipping work is fine. Reporting it as complete is not.**
Your last delivery reported Phase 3 and Phase 4 complete. In fact no router was added, no service worker exists, only two of ten-to-twelve languages shipped, and there is no voice support at all — each of which the plan named as a requirement. Your report must contain a **"Not done"** section listing everything skipped, blocked or deferred. If it is genuinely empty, write "Not done: nothing." An honest gap is a normal planning conversation. A false completion claim costs a round trip and nothing else.

**3. Never disable a control to make something pass.**
No `verify=False`, no `# type: ignore`, no `eslint-disable`, no `--force`, no skipped tests, no suppressed hydration warnings. Your last delivery disabled TLS certificate verification across the entire ingestion pipeline in a project whose whole purpose is proving where a document came from. When something blocks you, escalate it to me.

**4. B is an architecture migration. Nothing may change visually.**
The acceptance test is that a user sees the same screens, the same styling and the same behaviour as before — but the URL now changes as they navigate, the back button works, and every page can be linked to. **Port the existing wizard, chat, scheme detail and console. Do not rewrite them.** They function and they are real work; moving a file and adding a `'use client'` directive is the job. If you catch yourself improving a component's design, stop — that is Work Order C.

**5. The build must succeed with the API unreachable.**
`generateStaticParams` for `/schemes/[slug]` should pre-build known slugs, but return `[]` and log a warning on any fetch failure, with `dynamicParams = true` and ISR covering the rest. A build that dies because Postgres wasn't running is a broken build. Verify this deliberately: stop the API, then build.

**6. Per-scheme metadata is the entire point.**
Each scheme page must export `generateMetadata` producing a real title, description, canonical URL and Open Graph tags from that scheme's own data. Nine pages all titled "Sahayak" would defeat the migration. In your report, paste the `<title>` and OG tags from the served HTML for two different schemes as proof.

**7. Never add a `Co-Authored-By: Claude` line to a commit message.**
The user has explicitly forbidden it. Commit after each meaningful subtask.

## One contract with the other agent

The backend is adding a `tls_verified` boolean to the scheme detail response and to citation metadata. Rendering it is your job. **Treat it as optional** — it may not exist yet when you build against it. Absent or `true` renders nothing; explicit `false` shows a short, plain, non-alarming note that the source could not be certificate-verified. A missing field must never crash a page or produce a scary warning.

## When you finish

Report using the format in `agent_instruction.md` §6.8. Include actual `npm run build` output (both runs), actual `pytest` output, the routes you created, the per-scheme metadata proof, and `git diff --name-only phase-0-truth..phase-b-nextjs` to demonstrate you stayed inside the boundary.

Then stop and wait for my review. If anything in `agent_instruction.md` turns out to be wrong about the actual code, say so — those instructions were written from inspection and may contain errors. Correcting me is useful. Silently working around me is not.
