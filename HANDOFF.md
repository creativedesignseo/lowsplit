# HANDOFF.md — LowSplit

> Estado para retomar el trabajo en una sesión nueva sin perder contexto.
> Última actualización: 2026-05-29 (Ola 1 código hecho + intento de migración SQL)

## 🔴 DÓNDE LO DEJAMOS (leer esto primero)

**Ola 1 (Activación) — código:** ✅ HECHO, commiteado y pusheado (commits `7c26f03` y posteriores en `fix/p0-production-readiness`). Repara pagos (header JWT), wallet v2, 404, limpia Bizum, success_url. Build verde.

**Migración SQL en Supabase:** ⏳ INTENTADA, FALLÓ, NADA aplicado (es transaccional, revirtió todo).
- `20260527_p0_hardening.sql` falla en el bloque C: el `CHECK (slots_occupied <= max_slots)` lo viola **1 grupo sobrevendido**:
  - `id = 288af1e2-db57-457f-a48d-e3afb680bf2c` → `slots_occupied=5`, `max_slots=4` (1 de más), status `available`, creado 30-ene-2026 (probable dato de pruebas).
- **PENDIENTE para retomar:** (1) contar miembros reales pagados de ese grupo, (2) corregir el dato (si miembros≤4 → `UPDATE slots_occupied` al número real; si =5 → subir `max_slots` a 5 o sacar a alguien), (3) re-ejecutar `20260527_p0_hardening.sql`, (4) ejecutar bloque de verificación, (5) aplicar `20260529_wallet_hardening.sql` (migración 2/2).
- Query de diagnóstico pendiente de confirmar (el usuario reportó "Success. No rows returned", ambiguo — re-verificar con `SELECT count(*) FROM subscription_groups WHERE slots_occupied > max_slots`).

**Tras aplicar ambas migraciones:** mergear PR #1 → deploy Netlify → verificar pagos en Stripe test mode. Luego SSL Cloudflare "Full strict", registrar webhook Stripe, env vars.

**Recordatorio:** email de registro no llega → config SMTP en Supabase (Auth → Email), no es código. Anotado para Ola 1/activación.

---

## Resumen del estado actual

LowSplit fue **re-auditado** con 13 agentes (`saas-audit` full) sobre la rama `fix/p0-production-readiness`. Resultado en `AUDIT_REPORT.md`. **Score: producción 8/100 (sin cambios), código en rama ~12/100, proyectado tras activación ~55/100.** Sigue 🛑 BLOQUEADO.

**Hallazgo clave de la re-auditoría:** la Fase 0 es **correcta a nivel de código** (los 7 P0 originales cerrados en backend), PERO:
1. **No está activa:** la migración SQL NO se aplicó en Supabase y el PR #1 no se mergeó → la BD viva y el sitio siguen vulnerables.
2. **REGRESIÓN crítica (PAY-101):** el backend exige JWT pero el frontend **no envía el header `Authorization`** → el pago con tarjeta y la recarga devuelven **401 al 100%**. Los pagos están ROTOS.
3. **Pago wallet manipulable (PAY-102):** `handle_join_group_wallet` se llama desde el cliente con `p_amount` controlado y sin binding `auth.uid()`.
4. **Legal (auditado por 1ª vez): 3 críticos** — credenciales en texto plano, sin páginas legales (404), sin derecho al olvido.

**El camino a producción es ahora un checklist corto** (Fase 0.5 de activación, ver TODO.md), no trabajo profundo.

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

## Problemas abiertos / bugs conocidos (actualizado tras re-auditoría — ver AUDIT_REPORT.md)

| # | Problema | Severidad | Estado |
|---|----------|-----------|--------|
| C1 | Migración SQL P0 NO aplicada en Supabase (raíz de 6 hallazgos) | 🔴 Crítico | Pendiente — acción #1 |
| C2 | **REGRESIÓN: frontend no envía header `Authorization` → pagos 401** (PAY-101) | 🔴 Crítico | Nuevo — los 4 fetch de pago/recarga |
| C3 | Pago wallet manipulable: RPC desde cliente con `p_amount` y sin `auth.uid()` (PAY-102) | 🔴 Crítico | Pendiente |
| C4 | Credenciales de cuentas en TEXTO PLANO en `subscription_groups` | 🔴 Crítico | Pendiente Fase 1 (cifrado) |
| C5 | `/forgot-password` inexistente + sin catch-all 404 → pantalla blanca (QA-014) | 🔴 Crítico | Pendiente |
| C6 | RPCs `handle_partial_wallet_payment`/`handle_join_group_card`/`increment_group_slots` no versionadas | 🔴 Crítico | Pendiente — volcar desde Supabase |
| C7 | Sin páginas legales: `/terms`,`/privacy`,`/refund` dan 404 (LEGAL-002) | 🔴 Crítico | Nuevo — requiere abogado para contenido |
| C8 | Botón "Eliminar cuenta" sin `onClick` → sin derecho al olvido RGPD (LEGAL-003) | 🔴 Crítico | Nuevo |
| C9 | Regresión Bizum: `ServiceDetailPage:111` llama a `manual-payment` (borrado) | 🟠 Alto | Nuevo — código muerto |
| H1 | Funciones admin fuera del hardening (CORS `*`, `setRole` accesible a admin normal) | 🟠 Alto | Nuevo |
| H2 | `npm run lint` roto (falta `eslint.config.js`) | 🟠 Alto | Pendiente |
| H3 | SEO: sin sitemap/robots/OG (noindex ✅ ya eliminado) | 🟠 Alto | Pendiente Fase 1 |
| M1 | `success_url` desajustado (`payment=success` vs `success=true`) | 🟡 Medio | Nuevo — notif post-pago no dispara |
| M2 | Reputación falsa hardcodeada "99.04%" + "verificado" universal (dark pattern DSA) | 🟡 Medio | Nuevo |
| M3 | Sistema de diseño roto: `primary-500` azul, rojo hardcoded 124×, sin `<Button>`, 17 `alert()` | 🟡 Medio | Pendiente Fase 2 |
| M4 | `.agent/`+`.agents/` (240+ archivos) commiteados al repo público; deps muertas (`zod`,`@hookform/resolvers`) | 🟡 Medio | Nuevo |
| M5 | Páginas monolito (Dashboard 915), sin tests, sin TS, sin AuthProvider/ProtectedRoute/ErrorBoundary | 🟡 Medio | Pendiente Fase 2 |

> **Nota:** muchos C1-C6 son "fix escrito, pendiente de activar". La distancia a producción es el checklist de Fase 0.5 en TODO.md, no trabajo profundo.

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
