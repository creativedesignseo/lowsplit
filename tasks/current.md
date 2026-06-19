# tasks/current.md — LowSplit active task queue

> Single page of what's being worked on **right now**. Keep it short.
> Older completed tasks live in `progress/`. Full backlog in `TODO.md`.
> Operational truth in `HANDOFF.md`.

**Last updated:** 2026-06-20 (re-verificación código + prod: todo EN VIVO, SMTP re-confirmado como único bloqueador)

---

## Current state

Project is **LIVE** at https://lowsplit.com (Netlify behind Cloudflare).
Fase 0 + Ola 1 **están en producción** (mergeado en `main`, deploy `7640a76`
`state=ready`). Las dos migraciones SQL P0 **están aplicadas** en Supabase.
Re-verificado 2026-06-20 contra código y prod: build verde, apex 200 + TLS OK,
`www`→apex 301, webhook vivo (400 sin firma), robots/sitemap 200, Supabase
advisors 0 errores. **Único bloqueador real: SMTP sin configurar** (`smtp_host=null`,
≈2 emails/h) → el signup no funciona hasta activarlo.

Stack: Node.js · Hosting: Netlify · Live in production: true

---

## ✅ Hecho recientemente (esta tanda)

- [x] **Re-verificación realidad código + prod** (2026-06-20) — build verde (`verify.sh` all checks passed, lint 0 err), prod 200 + TLS válido, `www`→apex 301, webhook vivo (400 sin firma), robots/sitemap 200, Supabase advisors 0 ERROR, deploy `7640a76` `state=ready`. SMTP re-confirmado SIN configurar (`smtp_host=null`). Cuenta Supabase verificada: `creativedesignseo@gmail.com`. HANDOFF actualizado con esta realidad.
- [x] **Webhook LIVE verificado funcional** (2026-06-15 16:23) — 176 eventos procesados en debug_logs, último a las 16:23:13. Firma Stripe validada ✅. Endpoint `we_1Suq56GtkBSGwZr1NWNeJFlZ` → `https://lowsplit.com/.netlify/functions/stripe-webhook` activo y recibiendo eventos. `STRIPE_WEBHOOK_SECRET` en Netlify COINCIDE con el signing secret.
- [x] **Build green** (2026-06-15) — `npm run build` ✅, `npm run lint` ✅ (38 warnings, 0 errores), `verify.sh` ✅ all checks passed.
- [x] **Production live** — lowsplit.com responde HTTP 200, Netlify deploy funcional.
- [x] **RLS activado en `debug_logs`** (2026-06-02) — cerraba el aviso de Supabase `rls_disabled_in_public`. Solo la escribe `stripe-webhook.js` con service_role.
- [x] **Migraciones P0 aplicadas** en Supabase (`20260527_p0_hardening` + `20260529_wallet_hardening`).
- [x] **PR #1 mergeado → deploy** en producción (código con headers JWT ya en vivo).
- [x] **Webhook Stripe corregido** — URL `lowsplit.netlify.app` (404, muerto) → `https://lowsplit.com/.netlify/functions/stripe-webhook`, 4 eventos. Endpoint `we_1Suq56GtkBSGwZr1NWNeJFlZ`.
- [x] **Auth URLs de Supabase corregidas** — site_url → `https://lowsplit.com`; allow list actualizada.
- [x] **ESLint + SEO baseline** (2026-06-03) — `eslint.config.js` creado, robots.txt + sitemap.xml + OG.

---

## P0 — para cerrar Ola 1 del todo

- [x] **Verificar `STRIPE_WEBHOOK_SECRET` en Netlify == signing secret del endpoint** `we_1Suq56...` — ✅ VERIFICADO. Eventos procesados sin errores de firma. Webhook funcional.
- [x] **Verificar las 3 env vars secretas en Netlify** (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY) — ✅ presentes (valores ocultos por seguridad).
- [ ] **SMTP / email (Arreglo 2)** — registrar/reset emails no llegan. Configurar proveedor (Resend recomendado) en Supabase → Auth → SMTP. **BLOQUEADOR CRÍTICO para signup.** Requiere cuenta del usuario + verificación de dominio (DNS en Cloudflare).
- [ ] **Set Cloudflare SSL/TLS mode a "Full (strict)"** — manual, dashboard (token actual no tiene Zone Settings:Edit).
- [ ] **Probar pago end-to-end** (Stripe test mode): unirse a grupo con tarjeta y con wallet, sin 401, acceso solo tras webhook.

---

## P1 — important, not blocking

- [ ] **Rotar tokens** pegados en chats anteriores: Cloudflare (`~/.claude/credentials/cloudflare.env`) y Supabase (`~/.claude/credentials/supabase.env`).
- [ ] Encrypt account credentials (plain text today in `subscription_groups`) — GDPR critical (Ola 2).
- [x] **`eslint.config.js` creado** (2026-06-03) — flat config ESLint 9 (React 18 + Vite ESM). `npm run lint` ahora pasa: 0 errores, 38 warnings legacy (vars sin usar, deps de useEffect). verify.sh ya no está rojo en lint.
- [x] **SEO base** (2026-06-03) — `public/robots.txt` (+ disallow zonas privadas), `public/sitemap.xml` (home/explore/share), y Open Graph + Twitter Card + canonical + robots meta en `index.html`. Pendiente: OG image dedicada 1200×630 (ahora usa logo-email.png como placeholder).
- [ ] Legal pages (`/terms`, `/privacy`, `/refund`) — requieren texto de abogado (Ola 2).
- [ ] Borrado de cuenta / derecho al olvido RGPD (Ola 2).

---

## Blocked

*(none right now)*

---

## Next recommended action

**Configurar SMTP (Arreglo 2 — Resend o equivalente)** — es el bloqueador crítico
para que usuarios puedan registrarse (confirmación de email). Sin SMTP, no hay
signup. Después, probar pago end-to-end (tarjeta + wallet).

---

## Known pre-existing failures (not blockers, but on the floor)

- ~~`npm run lint` fails: no `eslint.config.js`~~ → FIXED 2026-06-03. Lint passes (0 errors, 38 warnings). `npm run build` passes.

---

## Out of scope right now

- UI/UX redesign (Ola 3 — design system, <Button>, alert()→Toast, tipografía).
- TypeScript migration, tests, CI/CD.
- Bizum reactivation (deferred until a real PSP integration exists).
