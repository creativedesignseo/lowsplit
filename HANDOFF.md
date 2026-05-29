# HANDOFF.md — LowSplit

> Estado para retomar el trabajo en una sesión nueva sin perder contexto.
> Última actualización: 2026-05-27 (sesión de auditoría + Fase 0 + DNS)

## Resumen del estado actual

LowSplit fue **auditado** (10 áreas, score **8/100 — 🛑 BLOCKED para producción**). Se aplicó la **Fase 0 (Stop the Bleed)** del roadmap: se corrigieron los 7 vectores de fraude P0 y los crashes principales. Los cambios están en la rama **`fix/p0-production-readiness`**, **SIN commitear todavía**. La build pasa (`npm run build` ✅). En paralelo se migró el DNS de `lowsplit.com` a Netlify (el sitio está vivo con HTTPS).

**El proyecto NO está aún en producción segura** porque falta: aplicar la migración SQL en Supabase, commitear+desplegar el código, y completar Fases 1-2 del roadmap.

## Qué estábamos haciendo antes de cambiar de chat

Acabábamos de:
1. Migrar el DNS de `lowsplit.com` (Cloudflare → Netlify), sitio en vivo respondiendo HTTP 200 + HTTPS.
2. Revisar el estado SEO en vivo (score ~5/100 por el `noindex` del deploy viejo).
3. El usuario pidió crear este paquete de transferencia de contexto.

La decisión inmediata pendiente era: **¿qué camino seguir?** (A: cerrar Fase 0 con SQL+commit+deploy; B: atacar SEO ahora; C: volver a UI/UX). Sin decidir aún.

## Últimos cambios importantes (esta sesión)

### Código (rama `fix/p0-production-readiness`, sin commitear)
- **Borrados:** `netlify/functions/test-db.js`, `netlify/functions/manual-payment.js`, `src/pages/TestPage.jsx` (vectores de fraude/inseguros).
- **Nuevo:** `netlify/functions/_lib/auth.js` (`requireAuth` + `corsHeaders`).
- **Hardening backend:** las 3 funciones de checkout (`create-checkout`, `create-group-checkout`, `create-topup-session`) ahora exigen JWT, recalculan precios en servidor, restringen CORS, pinean `apiVersion` de Stripe. El webhook tiene idempotencia, maneja base64, refunds, disputes y devuelve 5xx en errores transitorios.
- **Frontend:** fix crash `DashboardPage` (import `LogIn`), typo `LoginPage` (`hover:number-700`), FB duplicado eliminado, `navigate()` en vez de `window.location.href`, `useWallet` devuelve `balance ?? 0`, `MOCK_REVIEWS` eliminado, modal Bizum oculto, Footer responsive, dominio `lowsplit.com` aplicado.
- **netlify.toml:** redirect SPA, headers de seguridad (HSTS, X-Frame-Options, etc.), `noindex` eliminado, CORS a `lowsplit.com`.
- **.env.example:** completado con los 3 secretos faltantes + `APP_PROD_URL`.
- **database/migrations/20260527_p0_hardening.sql:** migración con RLS endurecida, triggers anti-self-elevation, idempotencia Stripe, CHECK constraints, REVOKE en RPCs financieras. **NO aplicada en Supabase aún.**
- **docs/dns/:** backups DNS de lowsplit.com.

### Infraestructura (YA aplicado en vivo)
- **Supabase:** borrada 1 fila huérfana de `payment_transactions` (amount=0) que bloqueaba la migración.
- **Netlify:** `lowsplit.com` + `www.lowsplit.com` configurados como custom domain del site `lowsplit-app`.
- **Cloudflare:** A record (Hetzner) → CNAME a `lowsplit-app.netlify.app` (proxied). Borrados 2 NS records basura. MX/SPF intactos.

### Otro repo (ya commiteado + pusheado)
- Skill `saas-audit` creada en `creativedesignseo/my-dev-toolkits/skills/saas-audit/` (commit `f882696`). No afecta a este repo.

## Problemas abiertos / bugs conocidos

| # | Problema | Severidad | Estado |
|---|----------|-----------|--------|
| 1 | Migración SQL P0 NO aplicada en Supabase | 🔴 Crítico | Pendiente — el código del webhook espera la tabla `stripe_events_processed` |
| 2 | Credenciales de cuentas en TEXTO PLANO en `subscription_groups` | 🔴 Crítico | Pendiente Fase 1 (cifrado + tabla aparte) |
| 3 | `npm run lint` roto (falta `eslint.config.js`) | 🟠 Alto | Pendiente |
| 4 | Sin SEO (noindex en vivo, sin sitemap/robots/OG) | 🟠 Alto | noindex se quita al desplegar; resto pendiente Fase 1 |
| 5 | Pago híbrido descuenta saldo antes de confirmar Stripe | 🟠 Alto | Pendiente Fase 1 |
| 6 | `handle_partial_wallet_payment`, `handle_join_group_card`, `increment_group_slots` no versionadas en repo | 🟠 Alto | Pendiente — volcar desde Supabase |
| 7 | `/forgot-password` enlazado pero ruta inexistente; sin catch-all 404 | 🟡 Medio | Pendiente |
| 8 | Páginas monolito (DashboardPage 915 líneas) | 🟡 Medio | Pendiente Fase 2 |
| 9 | Sin tests | 🟡 Medio | Pendiente Fase 2 |

## Próximos pasos recomendados (en orden)

1. **Aplicar `database/migrations/20260527_p0_hardening.sql` en Supabase** (SQL Editor → pegar → Run). Tiene bloque de verificación al final. La fila huérfana que lo bloqueaba ya se borró.
2. **Commit + push de la rama `fix/p0-production-readiness`** (4 commits lógicos: config/cleanup, frontend, backend, migración — o uno solo).
3. **Merge a `main`** (PR o directo) → dispara deploy automático en Netlify → el `noindex` desaparece.
4. **Cambiar SSL/TLS mode en Cloudflare a "Full (strict)"** (dashboard, 1 clic — Claude no tiene permiso con el token actual).
5. **Registrar webhook Stripe** apuntando a `https://lowsplit.com/.netlify/functions/stripe-webhook` con eventos: `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`. Copiar el signing secret a `STRIPE_WEBHOOK_SECRET` en Netlify.
6. **Verificar env vars en Netlify** (las 3 secretas sobre todo).
7. **Rotar el token Cloudflare** (quedó en el historial del chat anterior).
8. **Fase 1**: SEO (sitemap/robots/OG/JSON-LD), cifrado de credenciales, AuthProvider, Error Boundaries, code-splitting, `/forgot-password`.
9. **Fase 1 UI/UX** (lo que el usuario quería): design system, `<Button>`/`<Modal>` reutilizables, sellos de confianza en checkout, sticky CTA mobile, etc.

## Archivos que la próxima sesión debe revisar PRIMERO

1. `HANDOFF.md` (este archivo) — estado y próximos pasos
2. `TODO.md` — tareas priorizadas
3. `CLAUDE.md` — reglas y stack
4. `PROJECT_CONTEXT.md` — contexto completo
5. `database/migrations/20260527_p0_hardening.sql` + `database/migrations/README.md` — migración pendiente
6. `git status` y `git branch --show-current` — confirmar que sigues en `fix/p0-production-readiness` con los cambios sin commitear

## Preguntas pendientes / decisiones por tomar

- ❓ ¿Commit en 4 bloques (revertibles) o uno solo?
- ❓ ¿Merge a `main` vía PR o directo?
- ❓ ¿Atacar SEO ahora (Fase 1) o UI/UX primero?
- ❓ ¿Modo Stripe: test o live para el lanzamiento? (definir qué keys van en Netlify)
- ❓ ¿Canonical: apex `lowsplit.com` o `www`? (recomendado apex, falta redirect www→apex)
- ❓ ¿Reimplementar Bizum con PSP real o dejarlo desactivado?
- ❓ Confirmar que las env vars secretas están en Netlify (pendiente de verificar).

## Datos de infraestructura (para referencia rápida)

- Netlify site: `lowsplit-app` · ID `9c303714-eabd-4ce2-98df-de930ba7bca1` · admin: https://app.netlify.com/projects/lowsplit-app
- Cloudflare zona: `lowsplit.com` · ID `6788d2a72bb81784332928acae11e5f2`
- Token Cloudflare (DNS:Edit): `~/.claude/credentials/cloudflare.env`
- Netlify CLI autenticado como `creativedesignseo@gmail.com` (equipo AdsPubli)
- Repo: https://github.com/creativedesignseo/lowsplit (público)
