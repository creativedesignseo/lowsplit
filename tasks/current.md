# tasks/current.md — LowSplit active task queue

> Single page of what's being worked on **right now**. Keep it short.
> Older completed tasks live in `progress/`. Full backlog in `TODO.md`.
> Operational truth in `HANDOFF.md`.

**Last updated:** 2026-05-27

---

## Current state

Project is **LIVE** at https://lowsplit.com (Netlify behind Cloudflare).
Audited at score **8/100 — 🛑 BLOCKED for safe production**. The Fase 0
security fixes are done **on branch `fix/p0-production-readiness`, NOT yet
committed**. The build passes. The SQL hardening migration is generated but
**not yet applied to Supabase**.

Stack: Node.js · Hosting: Netlify · Live in production: true

---

## P0 — blocking ship

- [ ] **Apply `database/migrations/20260527_p0_hardening.sql` in Supabase** — SQL Editor → paste → Run. The orphan row that blocked it (amount=0) was already deleted.
- [ ] **Commit + push branch `fix/p0-production-readiness`** — Fase 0 fixes + 4 context docs + harness. Not committed yet.
- [ ] **Merge to `main` + verify Netlify deploy** — push to main triggers auto-deploy; removes the `noindex` blocker.
- [ ] **Set Cloudflare SSL/TLS mode to "Full (strict)"** — manual, dashboard (token lacks Zone Settings:Edit).
- [ ] **Register Stripe webhook** at `https://lowsplit.com/.netlify/functions/stripe-webhook` (events: checkout.session.completed, payment_intent.payment_failed, charge.refunded, charge.dispute.created) → copy signing secret to Netlify env.
- [ ] **Verify secret env vars in Netlify** (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY).

---

## P1 — important, not blocking

- [ ] Encrypt account credentials (plain text today in `subscription_groups`) — GDPR critical.
- [ ] Create `eslint.config.js` (lint is broken → verify.sh red on lint).
- [ ] Version missing RPCs in repo (`handle_partial_wallet_payment`, `handle_join_group_card`, `increment_group_slots`).
- [ ] SEO: robots.txt + sitemap.xml + Open Graph + canonical (see TODO.md).
- [ ] `/forgot-password` page + catch-all 404 route.
- [ ] Rotate the Cloudflare token (it was pasted in a previous chat).

---

## Blocked

*(none right now)*

---

## Next recommended action

**Apply the SQL migration in Supabase** (P0 #1), then **commit + push** the
branch (P0 #2). That closes the code+DB side of Fase 0.

---

## Known pre-existing failures (not blockers, but on the floor)

- `npm run lint` fails: no `eslint.config.js`. Tracked in TODO.md Fase 1. `npm run build` passes.

---

## Out of scope right now

- UI/UX redesign (Fase 1/2 — after Fase 0 closes).
- TypeScript migration, tests, CI/CD (Fase 2/3).
- Bizum reactivation (deferred until a real PSP integration exists).
