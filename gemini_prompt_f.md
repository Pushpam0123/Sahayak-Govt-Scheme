# Work Order F — Backend Hardening (Auth, Errors, Limits)

New worktree, new rules. Read all of §0 before you open a file.

## 0. What changes about how you work

You have been working in `web/`. This order moves you to `api/` and
`infra/migrations/` in a different worktree: `../sahayak-backend`, branch
`phase-0-truth`. `ingest/`, `eval/`, `EVALS.md` and `README.md` belong to another
agent working the same branch. Do not touch them. If your change appears to require
touching them, stop and escalate.

More importantly, the verification regime changes, and this is the whole reason you are
getting this order instead of someone else.

Across Work Orders B, C and D your recurring failure was preferring a confident
description over a checked one — a page that looked complete when the backend was down,
copy claiming verification the corpus could not support, a service worker branch that
never executed. Every one of those got through a green `tsc` and a green build. I caught
them by rendering the page and looking.

**On this order I cannot do that.** An auth endpoint that looks correct in a diff is not
a bug, it is a breach. So nothing in this order is accepted on the basis of code that
looks right. Every item specifies a request to run against a live server and a live
Postgres, and your report must contain the actual output. Not a summary of the output.
The output.

This is also why the first item is migrations. The root cause of what you will find in
this codebase is that phases were reported complete without ever running against a real
database.

## 1. What already works — do not redo it

I audited the tree at `b934fee`. These are done and correct:

- `/admin/*` is protected: `dependencies=[Depends(verify_admin_token)]` on the router,
  with `hmac.compare_digest` in `api/auth.py`.
- CORS is fixed: `allow_credentials=not allow_all` in `api/main.py`.
- `create_async_engine` uses `echo=settings.DB_ECHO`, not a hardcoded `True`.
- The rate limiter's key hierarchy already prefers user/API key and falls back to IP.
  The *hierarchy* is right. Its storage is not — see F-4.

Do not "improve" these. If you believe one is wrong, say so in your report and leave it.

## 2. F-1 — The auth tables do not exist

`api/models/auth.py` defines `Organization` (`organizations`), `User` (`users`) and
`APIKey` (`api_keys`), each with `__tablename__` set. There are ten migrations in
`infra/migrations/versions/` and none of them creates any of those three tables.

The models are unreachable. Any query against them raises `UndefinedTable` at runtime.
This has never surfaced because nothing queries them, because there are no endpoints —
see F-2.

Write the migration. Then:

1. Bring up Postgres.
2. `alembic upgrade head`.
3. `alembic downgrade -1`, then `upgrade head` again. A migration that cannot be
   reversed is not finished.
4. Paste `\dt` output showing the three tables, and paste the column list for each.

Match the models exactly — column types, nullability, defaults, indexes, foreign keys,
unique constraints. If the model and a sensible schema disagree, fix the model and say
why in your report.

## 3. F-2 — There is no way to authenticate

There is no `/auth` router. No login endpoint, no session issuance, no API key
verification path. `api/models/auth.py` is three classes with nothing that reaches them.

Build the minimum real thing:

- **Registration and login** issuing a JWT. Passwords hashed with bcrypt or argon2 —
  never a bare hash, never `sha256`. Use a vetted library; do not hand-roll.
- **API key auth** for the B2B path: keys issued per organisation, **stored hashed**,
  verified in constant time. A key must be displayed exactly once at creation and never
  be retrievable afterwards. If you find yourself writing an endpoint that returns an
  existing key's plaintext, that is the wrong design.
- **A dependency** that resolves the caller from either a JWT or an API key, and yields
  the user and organisation.
- `JWT_SECRET` from config with **no usable default.** `ADMIN_TOKEN` currently defaults
  to `"dev-admin-secret-change-in-prod"` in `api/config.py`. Do not copy that pattern —
  a missing `JWT_SECRET` must fail startup, loudly. Ship the same treatment for
  `ADMIN_TOKEN` while you are there.

**Verify by running, and paste every response:**

1. Register a user, log in, receive a token.
2. Call an authenticated endpoint with the token. Expect 200.
3. Call it with no token. Expect 401.
4. Call it with a token whose signature you altered by one character. Expect 401.
5. Call it with an expired token. Expect 401.
6. Create an API key, use it, then try to read it back. Expect the read to be impossible.
7. Look in the database and paste the stored password row and the stored key row.
   Neither may be readable.

Item 7 is the one that matters most. Paste it even if it is boring.

## 4. F-3 — Internal errors are returned to callers

Five `str(e)` remain in `api/routers/`. That returns exception text — which in this
codebase means SQL fragments, file paths, and possibly connection strings — to whoever
made the request.

Build a small exception taxonomy: a base application error, plus the handful of cases
the API actually distinguishes (not found, validation, upstream failure, rate limited,
internal). Each maps to a status code and a **stable, non-revealing** client message.
Full detail goes to logs, never to the response.

Add a catch-all handler so an unhandled exception returns a generic 500 with a request
ID — and log the traceback against that ID.

**Verify:** trigger a real database error and paste both the HTTP response the client
sees and the log line the server wrote. The response must be useless to an attacker and
the log must be sufficient for you.

## 5. F-4 — The rate limiter does not survive a restart

`api/middleware/rate_limiter.py` stores history in an in-process
`defaultdict(list)`. That resets whenever the process restarts, and is not shared across
workers or instances — so with N workers the effective limit is N times the configured
one, and a restart clears every bucket.

Move the storage to Redis, keeping the existing key hierarchy exactly as it is. Fail
closed or fail open on a Redis outage — your call, but **state which you chose and why
in your report.** Do not leave it ambiguous.

**Verify:** exceed the limit and paste the 429. Then restart the API process, immediately
replay the same request, and paste the response showing the bucket survived.

## 6. F-5 — The model ID is hardcoded and two generations old

`api/llm/client.py:48` defaults to `"claude-3-5-sonnet-20241022"`.

Move the model ID and its price multipliers into config. Default to a current Claude
model. The available IDs are `claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5-20251001`
— pick a default and justify it in one line against cost and latency for this workload.

**Verify:** paste a real completion showing which model answered and what it cost.

## 7. Rules

1. Never disable a security control, test, type check, or lint rule to make something
   pass. On this order that includes: no `verify=False`, no disabled signature checks,
   no auth dependency commented out "for testing", no secret with a working default.
   Escalate instead.
2. Every item runs against a live Postgres and a live server before its commit.
3. One commit per item, five commits, each independently revertible.
4. Report what you **observed** — pasted request/response/log output — not what the code
   does. Every report you have filed so far has described code changes. On this order a
   described change with no pasted output will be sent back unread.
5. If you cannot run something, name it and say it was not run. That is a complete and
   acceptable answer. Claiming it works is not.

## 8. Not in scope

N+1 queries, prompt caching, semantic answer cache, conversation memory, SSE streaming,
structured logging beyond the request ID in F-3. Those are Work Order G. Do not start
them, and do not touch `ingest/`, `eval/`, `EVALS.md` or `README.md` at all.
