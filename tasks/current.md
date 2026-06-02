# tasks/current.md — LowSplit active task queue

> Single page of what's being worked on **right now**. Keep it short.
> Older completed tasks live in `progress/`. Full backlog in `TODO.md`.
> Operational truth in `HANDOFF.md`.

**Last updated:** 2026-05-29 (Ola 1 cerrándose: webhook Stripe + Auth URLs corregidos)

---

## Current state

Project is **LIVE** at https://lowsplit.com (Netlify behind Cloudflare).
Fase 0 + Ola 1 **están en producción** (PR #1 mergeado, deploy hecho). Las dos
migraciones SQL P0 **están aplicadas** en Supabase. Hoy se corrigieron dos
config de producción que estaban rotas: el **webhook de Stripe** (apuntaba a un
dominio muerto) y las **URLs de Auth de Supabase** (apuntaban al subdominio viejo).

Stack: Node.js · Hosting: Netlify · Live in production: true

---

## ✅ Hecho recientemente (esta tanda)

- [x] **RLS activado en `debug_logs`** (2026-06-02) — cerraba el aviso de Supabase `rls_disabled_in_public`. La tabla estaba sin RLS ni políticas → acceso público vía anon key. Solo la escribe `stripe-webhook.js` con service_role (bypassa RLS), así que `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` sin políticas la cierra sin romper nada. Migración: `database/migrations/20260602_enable_rls_debug_logs.sql` (aplicada vía Management API).
- [x] **Verificación env vars Netlify** (2026-06-02) — las 3 secretas existen. HALLAZGO: el sitio corre en **modo TEST** (sk_test_ + pk_test_), no cobra dinero real. Hay 2 webhooks: LIVE `we_1Suq56`→lowsplit.com (el "arreglado", inactivo en test) y TEST `we_1SsxNy`→subdominio viejo (el activo ahora). Decisión: seguir en TEST y dejarlo coherente (pendiente verificar match de STRIPE_WEBHOOK_SECRET con el endpoint TEST).
- [x] **Migraciones P0 aplicadas** en Supabase (`20260527_p0_hardening` + `20260529_wallet_hardening`).
- [x] **PR #1 mergeado → deploy** en producción (código con headers JWT ya en vivo).
- [x] **Webhook Stripe corregido** — URL `lowsplit.netlify.app` (404, muerto) → `https://lowsplit.com/.netlify/functions/stripe-webhook`, y de 1 evento a 4 (checkout.session.completed, payment_intent.payment_failed, charge.refunded, charge.dispute.created). Endpoint id `we_1Suq56GtkBSGwZr1NWNeJFlZ`. Mismo signing secret (no cambió).
- [x] **Auth URLs de Supabase corregidas** (Management API) — site_url → `https://lowsplit.com`; allow list → lowsplit.com/** , www.lowsplit.com/** , lowsplit-app.netlify.app/** , localhost:5173/**.

---

## P0 — para cerrar Ola 1 del todo

- [ ] **Verificar `STRIPE_WEBHOOK_SECRET` en Netlify == signing secret del endpoint** `we_1Suq56...`. Si no coincide, la función rechaza todo con 400. Cómo: Stripe Dashboard → Webhooks → endpoint lowsplit.com → Reveal signing secret → comparar con Netlify env. (Prueba dura: `stripe trigger` contra el endpoint.)
- [ ] **Verificar las 3 env vars secretas en Netlify** (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY).
- [ ] **SMTP / email (Arreglo 2)** — registrar/reset emails no llegan. Configurar proveedor (Resend recomendado) en Supabase → Auth → SMTP. Requiere cuenta del usuario + verificación de dominio (DNS en Cloudflare lo puede hacer Claude).
- [ ] **Set Cloudflare SSL/TLS mode a "Full (strict)"** — manual, dashboard (token actual no tiene Zone Settings:Edit).
- [ ] **Probar pago end-to-end** (Stripe test mode): unirse a grupo con tarjeta y con wallet, sin 401, acceso solo tras webhook.

---

## P1 — important, not blocking

- [ ] **Rotar tokens** pegados en chats anteriores: Cloudflare (`~/.claude/credentials/cloudflare.env`) y Supabase (`~/.claude/credentials/supabase.env`).
- [ ] Encrypt account credentials (plain text today in `subscription_groups`) — GDPR critical (Ola 2).
- [ ] Create `eslint.config.js` (lint is broken → verify.sh red on lint).
- [ ] SEO: robots.txt + sitemap.xml + Open Graph + canonical (see TODO.md).
- [ ] Legal pages (`/terms`, `/privacy`, `/refund`) — requieren texto de abogado (Ola 2).
- [ ] Borrado de cuenta / derecho al olvido RGPD (Ola 2).

---

## Blocked

*(none right now)*

---

## Next recommended action

**Verificar el `STRIPE_WEBHOOK_SECRET` en Netlify** (P0 #1) — es lo único que
queda entre "webhook con URL correcta" y "pagos funcionando end-to-end".
Después, configurar SMTP (Arreglo 2) para que lleguen los emails.

---

## Known pre-existing failures (not blockers, but on the floor)

- `npm run lint` fails: no `eslint.config.js`. Tracked in TODO.md Fase 1. `npm run build` passes.

---

## Out of scope right now

- UI/UX redesign (Ola 3 — design system, <Button>, alert()→Toast, tipografía).
- TypeScript migration, tests, CI/CD.
- Bizum reactivation (deferred until a real PSP integration exists).
