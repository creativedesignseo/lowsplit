# AGENTS.md — LowSplit project harness

Portable instructions for any agent (Claude Code, Cursor, other) working
on this repository. If your tool reads `CLAUDE.md` it imports this file.
If your tool only reads `AGENTS.md`, this file alone is enough to work
safely.

---

## What is LowSplit?

**LowSplit** is a SaaS marketplace for **sharing digital subscriptions**
(Netflix, Spotify, Disney+, HBO, etc.). Users join a "group" for a
subscription and pay their share — by card (Stripe Checkout) or with an
internal wallet balance. Once payment is confirmed, they get access to
the shared account credentials. It handles **real payments**, so payment
security and credential protection are the critical concerns.

- **Production:** https://lowsplit.com (live, served by Netlify behind Cloudflare proxy)
- **Netlify subdomain:** https://lowsplit-app.netlify.app
- **Repo:** https://github.com/creativedesignseo/lowsplit (public)
- **Owner:** Jonatan @ Adspubli

Stack: Node.js (React 18 SPA + Netlify Functions). Hosting: Netlify. DB: Supabase. Payments: Stripe.

### Stack detail (REAL — verified in package.json, the README is wrong)

| Layer | Tech | Real version |
|------|------|--------------|
| Frontend | React | **18.3.1** (README says 19 — FALSE) |
| Build | Vite | **6.0.5** (README says 7 — FALSE) |
| Routing | react-router-dom | 7.1.0 |
| Server state | @tanstack/react-query | 5.62.0 |
| Styles | Tailwind CSS | 3.4.17 |
| Validation | Zod 3.24 + react-hook-form 7.54 | (Zod underused) |
| Icons | lucide-react 0.469 | inconsistent imports |
| SEO head | react-helmet-async 2.0.5 | ⚠️ abandoned since 2023 |
| DB / Auth | Supabase | @supabase/supabase-js 2.49 |
| Payments | Stripe | @stripe/stripe-js 8.6 + stripe 20.2 |
| Serverless | Netlify Functions (Node, ESM) | `netlify/functions/` |
| DNS | Cloudflare (proxy ON) | zone `lowsplit.com` |
| Email | Namecheap forwarding | MX → registrar-servers.com |

`package.json` has `"type": "module"` → everything is ESM (no `require`).

---

## Sources of truth (in this order)

When two documents disagree, **the higher-numbered source wins**. If
the higher source is silent, fall back to the next.

1. **`HANDOFF.md`** — current operational state, last commit, what works
   today in production. Read first on every fresh session.
2. **`tasks/current.md`** — what is being worked on right now, P0/P1
   queue, blockers.
3. **`TODO.md`** — full backlog by phase (0/1/2/3) with priorities.
4. **`PROJECT_CONTEXT.md`** — full project context, architecture, data flow.
5. **`progress/YYYY-MM-DD-*.md`** — what was done in past multi-step sessions.
6. **`CLAUDE.md`** — Claude Code-specific instructions (loads this file).
7. **`README.md` / PROJECT_BLUEPRINT.md / IMPLEMENTATION_PLAN.md** — ⚠️ partially
   outdated (wrong versions, stale palette, stale phase status). Trust HANDOFF.md on conflict.

---

## Read on session start

1. `HANDOFF.md`
2. `tasks/current.md` — active tasks
3. `TODO.md` — prioritized backlog
4. `git log --oneline -10` — recent context
5. Newest file under `progress/` if a multi-step task is in flight

If those are clear, ask the user what to work on. Do not invent tasks.

---

## Do not touch without explicit permission

- `.env*`, anything under `secrets/`, `credentials/`, `**/*.key`,
  `**/token*.json` — secrets must never be read, logged, or transmitted.
- `netlify.toml` — small comment edits are fine; config changes need a heads-up.
- **DNS MX / TXT (SPF) records of lowsplit.com** — they route `@lowsplit.com`
  email via Namecheap. Touching them breaks email. (DNS A/CNAME for web is OK
  with a heads-up.)
- `database/migrations/` — append-only. Do not rewrite history. New change = new migration file.
- Any file flagged "do not touch" in `tasks/current.md` or `HANDOFF.md`.

---

## Do not run without explicit permission

Repeat the exact command back and wait for a clear yes ("deploy", "envía",
"ship", "go") in the same chat message before running:

- `netlify deploy --prod`
- Applying SQL against the production Supabase database
- `git push` (and especially `git push --force` / `--force-with-lease`)
- Any command that prints or transmits `.env*` contents
- Anything behind `--no-verify`, `--no-gpg-sign`, or similar bypass flags

Note: pushing to `main` triggers an automatic Netlify production deploy.
The site is LIVE — treat any push to main as a production deploy.

---

## Payment security rules (CRITICAL — this is a real-money app)

1. **Never trust the client for money.** `amount`, `userId`, `groupId`,
   `walletDeducted` are ALWAYS validated/recalculated in the backend.
2. `userId` comes from the verified JWT (`requireAuth` in
   `netlify/functions/_lib/auth.js`), NEVER from the request body.
3. Access to a group is granted ONLY from the Stripe webhook after
   confirmation, never by reaching `success_url`.
4. Secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `SUPABASE_SERVICE_ROLE_KEY`) are backend-only. `VITE_*` are public.
5. The real security boundary is Supabase RLS + `SECURITY DEFINER` RPCs.
   The frontend should only have SELECT and UPDATE of non-sensitive
   columns of the user's own profile.
6. Do NOT reactivate the deleted `manual-payment.js` / `test-db.js`
   (removed in Fase 0 — they were unauthenticated fraud vectors).

---

## How to verify a change

Run `bash scripts/verify.sh` from the repo root. It runs lint, typecheck,
test, build (whichever exist) for the Node.js stack. It does not deploy.

⚠️ Known pre-existing failure: `npm run lint` fails because
`eslint.config.js` doesn't exist yet (tracked in `TODO.md` Fase 1). Until
that's fixed, verify will report lint red — `build` is the green signal
that matters. Do not commit if `build` fails.

---

## When to use subagents

Use a single-purpose subagent when the task is a multi-file search, an
independent audit you'll consolidate, or a second opinion on a non-trivial
change. Don't spawn one for a 1-2 tool-call task. Agents inherit no context
— brief them with file paths and goals.

Predefined agents under `.claude/agents/`:
- `orchestrator` — plans a multi-step change before code is touched
- `implementer` — writes the code per the plan
- `reviewer` — reviews a diff before commit
- `deployment-guardian` — gates any deploy-shaped action
- `docs-curator` — keeps README / HANDOFF / ADRs aligned

---

## When to write in `progress/`

For any task that touches 3+ files, spans more than one session, or
involves a non-obvious decision. Create `progress/YYYY-MM-DD-short-slug.md`
(template in `progress/README.md`). Trivial single-file fixes don't need one.

---

## Commit conventions

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`.
- One logical change per commit. Imperative mood, English.
- Co-author trailer for AI-assisted commits when applicable.
- Never `--no-verify`, never `--amend` on a pushed commit unless asked.

---

## Key files map

```
src/App.jsx                  routes (public/private/admin) — no <ProtectedRoute> yet
src/lib/{supabase,stripe,utils,data}.js
src/hooks/useWallet.js       only custom hook
src/components/ui/{Modal,Toast}.jsx   exist but barely used
src/pages/                   12 pages + pages/admin/
netlify/functions/_lib/auth.js   requireAuth + corsHeaders (Fase 0)
netlify/functions/create-*.js    checkout (JWT, server-side pricing)
netlify/functions/stripe-webhook.js  webhook (signature + idempotency)
database/migrations/20260527_p0_hardening.sql  P0 migration (NOT applied yet)
docs/dns/                    DNS backups (historical)
```

---

## Working language

- Chat with the owner in **Spanish (es-ES)** — see `CLAUDE.md`.
- Code, comments, committed docs in English (team portability).
- No emojis in code/committed files unless asked. Chat is fine.
