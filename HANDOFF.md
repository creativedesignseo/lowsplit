# HANDOFF.md — LowSplit

> Estado para retomar el trabajo en una sesión nueva sin perder contexto.
> Última actualización: 2026-06-20 (RE-VERIFICACIÓN código + prod: Ola 1 EN VIVO, ÚNICO bloqueador real = SMTP sin configurar)

## 🟢 DÓNDE LO DEJAMOS (leer esto primero)

**Ola 1 (Activación):** ✅ **EN PRODUCCIÓN (RE-VERIFICADO 2026-06-20).**
Código en `main` desplegado en producción (commit **`7640a76`**, Netlify `state=ready`, publicado 2026-06-16). Working tree limpio, `main` sincronizado con `origin/main`. Headers JWT, wallet v2, catch-all 404, Bizum limpio, success_url, SEO baseline, emails branded, webhook funcional — TODO en vivo.

**Build & Verificación EN VIVO (re-verificado 2026-06-20):** ✅ VERDE
- `bash scripts/verify.sh` → ✅ **all checks passed**
- `npm run build` → ✅ 770 KB JS (gzip 217 KB), 57 KB CSS (warn: >500KB, Fase 2)
- `npm run lint` → ✅ **0 errores**, 38 warnings (dead code, deps de useEffect) — no bloquea. (El `eslint.config.js` YA existe desde 2026-06-03; la nota de "lint roto" en docs viejos está OBSOLETA.)
- Production `https://lowsplit.com` → ✅ HTTP 200, TLS válido (cert OK, `ssl_verify_result=0`)
- `https://www.lowsplit.com` → ✅ **301 → apex** (el redirect www→apex que figuraba como pendiente YA EXISTE)
- Netlify origin `https://lowsplit-app.netlify.app` → ✅ HTTP 200
- Webhook `/.netlify/functions/stripe-webhook` → ✅ vivo, valida firma (HTTP 400 sin firma, NO 404)
- SEO en vivo → ✅ sin `noindex`, `robots.txt` 200, `sitemap.xml` 200
- Supabase advisors (security) → ✅ **0 lints nivel ERROR** (32 menores)
- SSL/TLS mode Cloudflare → cert válido verificado por curl; el **modo exacto** (Flexible/Full/Strict) NO es verificable con el token DNS actual (sin Zone Settings:Edit) — confirmar a ojo en el dashboard si hace falta.

**Webhook Stripe — VERIFICADO FUNCIONAL (2026-06-15):**
- ✅ URL: `https://lowsplit.com/.netlify/functions/stripe-webhook` (Endpoint `we_1Suq56GtkBSGwZr1NWNeJFlZ`)
- ✅ Firma: `STRIPE_WEBHOOK_SECRET` en Netlify valida eventos correctamente (último evento procesado: 16:23:13)
- ✅ Eventos capturados: `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`
- ✅ Transacciones registradas en Supabase (176 eventos de debug logged)
- ⚠️ User identification: requiere `userId` en metadatos de Stripe Checkout o lookup por email (implementado)

**Migraciones SQL en Supabase:** ✅ **AMBAS APLICADAS**
- `20260527_p0_hardening.sql` → RLS hardened, checks A-H, triggers anti-self-elevation, CHECK constraints ✅
- `20260529_wallet_hardening.sql` → `handle_join_group_wallet_v2` (SECURITY DEFINER, search_path correcta) ✅

**Email Auth (diseño):** ✅ Logo branded en `branding/logo-email.png`, plantillas aplicadas vía Management API
- 4 plantillas: confirmación, reset, magic link, cambio email (español)
- ⚠️ **SMTP NO configurado — RE-VERIFICADO 2026-06-20 vía Management API:** `smtp_host=null`, `smtp_port=null`, `smtp_user=null` → usa el SMTP por defecto de Supabase con `rate_limit_email_sent=2` (≈2 correos/hora). `mailer_autoconfirm=false` (exige confirmar email). `site_url=https://lowsplit.com` (correcto). **ÚNICO BLOQUEADOR REAL para signup.** Requiere Brevo/Resend o equivalente (≈5 min en el dashboard).

**Git state (verificado 2026-06-20):** `main` branch, **clean working tree**, sincronizado con `origin/main`.
- HEAD = producción: `7640a76` docs(handoff): final verification — Ola 1 production-ready
- Anterior: `49634f3` docs: mark Ola 1 as complete (webhook + SSL + SMTP ready)
- Anterior: `a657018` docs: update HANDOFF + tasks for Ola 1 verification
- Netlify production deploys recientes (todos `state=ready`): `7640a76` (2026-06-16), `49634f3`, `a657018`, `ec17a59`, `3337e80`.

**PRÓXIMO PASO — ÚLTIMO BLOQUEADOR (5 MIN):**
1. **SMTP en Supabase dashboard (ÚNICO pendiente, CONFIRMADO sin configurar 2026-06-20)** — Settings → Auth → Email → SMTP Configuration
   - Host: smtp-relay.brevo.com | Port: 587
   - User: creativedesignseo@gmail.com
   - Pass: **[ver en `~/.claude/credentials/brevo.env`]**
   - Una vez salvado: emails de registro/reset funcionales automáticamente
2. **Probar pago end-to-end** — tarjeta Stripe test → webhook procesa → acceso otorgado (para validar)
3. **Rotar tokens** Cloudflare + Supabase (quedan en historial de chats — hacer en Ola 2)
4. **Ola 2 (Legal + Seguridad + UI):** cifrar credenciales, páginas legales, RGPD, admin hardening, design system.

---

## 🔑 ACCESOS E INFRAESTRUCTURA (para no adivinar)

> Dónde está cada credencial y cómo se usa. **Nunca** pegar tokens en el chat;
> viven en archivos `chmod 600` fuera del repo. Esta tabla dice qué archivo usar.

### Credenciales (archivos locales, NO en el repo)

| Servicio | Archivo | Qué contiene / cómo usar |
|----------|---------|--------------------------|
| **Supabase** (Management API) | `~/.claude/credentials/supabase.env` | Token de cuenta de LowSplit. Cargar con `set -a; source ~/.claude/credentials/supabase.env; set +a` y usar `$SUPABASE_ACCESS_TOKEN`. ⚠️ El token de `~/.supabase/tokens/menucast` es de OTRA cuenta y da **403** para LowSplit. |
| **Cloudflare** (DNS:Edit) | `~/.claude/credentials/cloudflare.env` | Token con permiso Zone:DNS:Edit (NO Zone Settings:Edit → por eso SSL mode se cambia a mano en el dashboard). |
| **Stripe** | Stripe CLI (`stripe`) | Ya configurado con la cuenta `acct_1Eg4WWGtkBSGwZr1` (la misma de Adspubli — LowSplit comparte cuenta Stripe). Usar `stripe ... --live`. Restricted key `rk_live` caduca 2026-08-16. |
| **Netlify** | Netlify CLI (`netlify`) | Autenticado como `creativedesignseo@gmail.com` (equipo AdsPubli). Free tier: no permite `scopes` en env vars. |

### IDs y referencias rápidas

| Recurso | Valor |
|---------|-------|
| **Supabase cuenta (login)** | **`creativedesignseo@gmail.com`** · org `creativedesignseo` (`ueoywlabbflzbsmuwweg`) · rol Owner · MFA off — *verificado vía Management API 2026-06-20* |
| Supabase project ref (LowSplit PROD) | `fvycpwfzolzchlwwqafr` (name `lowsplit`, `ACTIVE_HEALTHY`, us-east-1) — **🔴 BD viva, NO borrar** |
| Otros proyectos en esa misma cuenta | `exxfnkgojjhjodlahxlp` (`nexopos-dev`, activo) · `sytajhzsxhhudiggdlcf` (`shopify-import`, INACTIVE) — NO son LowSplit |
| Netlify site | `lowsplit-app` · ID `9c303714-eabd-4ce2-98df-de930ba7bca1` · https://app.netlify.com/projects/lowsplit-app |
| Cloudflare zona | `lowsplit.com` · ID `6788d2a72bb81784332928acae11e5f2` |
| Stripe cuenta | `acct_1Eg4WWGtkBSGwZr1` (compartida con Adspubli) |
| Stripe webhook endpoint | `we_1Suq56GtkBSGwZr1NWNeJFlZ` → `https://lowsplit.com/.netlify/functions/stripe-webhook` |
| Repo | https://github.com/creativedesignseo/lowsplit (público) |

### Cómo correr SQL contra Supabase (sin Docker)

Docker/colima suele estar parado, así que `supabase db pull/dump` falla. Usar la
**Management API** vía curl (query arbitraria):

```bash
set -a; source ~/.claude/credentials/supabase.env; set +a
curl -s -X POST "https://api.supabase.com/v1/projects/fvycpwfzolzchlwwqafr/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT 1;"}'
```

Config de Auth (site_url, allow list, SMTP) se lee/escribe en:
`GET|PATCH https://api.supabase.com/v1/projects/fvycpwfzolzchlwwqafr/config/auth`

### Qué significa la URL del webhook

`https://lowsplit.com/.netlify/functions/stripe-webhook` = Netlify expone cada
archivo de `netlify/functions/` bajo `/.netlify/functions/<nombre>`. Stripe hace
POST ahí cuando hay eventos de pago; la función verifica firma + idempotencia y
otorga acceso. Si la URL está mal, Stripe llama a una puerta inexistente y el
acceso nunca se concede.

---

## Resumen del estado actual (re-verificado 2026-06-20)

> ⚠️ Esta sección contenía un veredicto viejo de la auditoría inicial ("producción 8/100, BLOQUEADO, migración sin aplicar, pagos rotos"). **Esos datos YA NO son ciertos** y se han retirado para no inducir a error. Lo que sigue es el estado real verificado hoy contra código y prod.

LowSplit está **EN VIVO y operativo en producción** (`https://lowsplit.com`, commit `7640a76`). La Fase 0 + Ola 1 están **mergeadas en `main` y desplegadas**, y las dos migraciones P0 (`20260527_p0_hardening`, `20260529_wallet_hardening`) están **aplicadas** en la BD viva. Los 3 críticos de pago de la auditoría inicial están **resueltos en prod**:
1. ✅ Migración SQL P0 aplicada (ya no es vulnerable la BD viva).
2. ✅ PAY-101 (frontend sin header `Authorization` → 401): headers JWT añadidos, en prod.
3. ✅ PAY-102 (wallet manipulable): sustituido por `handle_join_group_wallet_v2` (bind a `auth.uid()` + recálculo en servidor).

**Lo que SIGUE pendiente (real, no resuelto):**
- 🔴 **SMTP sin configurar** en Supabase → el signup real no funciona (≈2 emails/h). **Único bloqueador para abrir registro.**
- 🟠 **Ola 2 (Legal + Seguridad):** credenciales de cuentas en texto plano (`subscription_groups`), páginas legales (`/terms`,`/privacy`,`/refund`) ausentes, sin borrado de cuenta/RGPD, admin hardening.
- 🟡 **Ola 3 (UI/UX):** design system, `<Button>`/`<Modal>`, 17 `alert()`→Toast, sellos de confianza en checkout.

Referencia histórica de la auditoría completa: `AUDIT_REPORT.md` (interpretarlo a la luz de este resumen — varios de sus P0 ya están cerrados).

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
| C1 | Migración SQL P0 NO aplicada en Supabase (raíz de 6 hallazgos) | 🔴 Crítico | ✅ RESUELTO — ambas migraciones aplicadas |
| C2 | **REGRESIÓN: frontend no envía header `Authorization` → pagos 401** (PAY-101) | 🔴 Crítico | ✅ RESUELTO — headers añadidos, en prod |
| C3 | Pago wallet manipulable: RPC desde cliente con `p_amount` y sin `auth.uid()` (PAY-102) | 🔴 Crítico | ✅ RESUELTO — `handle_join_group_wallet_v2` (auth.uid + recálculo) |
| C4 | Credenciales de cuentas en TEXTO PLANO en `subscription_groups` | 🔴 Crítico | Pendiente Ola 2 (cifrado) |
| C5 | `/forgot-password` inexistente + sin catch-all 404 → pantalla blanca (QA-014) | 🔴 Crítico | ✅ RESUELTO — página + catch-all en prod |
| C6 | RPCs `handle_partial_wallet_payment`/`handle_join_group_card`/`increment_group_slots` no versionadas | 🔴 Crítico | ✅ RESUELTO — capturadas en schema-snapshots |
| C7 | Sin páginas legales: `/terms`,`/privacy`,`/refund` dan 404 (LEGAL-002) | 🔴 Crítico | Pendiente Ola 2 — requiere abogado para contenido |
| C8 | Botón "Eliminar cuenta" sin `onClick` → sin derecho al olvido RGPD (LEGAL-003) | 🔴 Crítico | Pendiente Ola 2 |
| C9 | Regresión Bizum: `ServiceDetailPage:111` llama a `manual-payment` (borrado) | 🟠 Alto | ✅ RESUELTO — Bizum limpiado, en prod |
| C10 | **Webhook Stripe apuntaba a dominio muerto (404)** → pago no otorga acceso | 🔴 Crítico | ✅ RESUELTO hoy — URL→lowsplit.com + 4 eventos |
| C11 | **Auth URLs Supabase apuntaban al subdominio viejo** → emails con enlace erróneo | 🟠 Alto | ✅ RESUELTO hoy — site_url + allow list a lowsplit.com |
| H1 | Funciones admin fuera del hardening (CORS `*`, `setRole` accesible a admin normal) | 🟠 Alto | Pendiente Ola 2 |
| H2 | `npm run lint` roto (falta `eslint.config.js`) | 🟠 Alto | ✅ RESUELTO — `eslint.config.js` existe; lint pasa (0 err, 38 warn). Verificado 2026-06-20 |
| H3 | SEO: sin sitemap/robots/OG (noindex ✅ ya eliminado) | 🟠 Alto | ✅ EN VIVO — `robots.txt` 200, `sitemap.xml` 200. Pendiente solo OG image dedicada 1200×630 |
| H4 | **SMTP no configurado** → emails de registro/reset no llegan (Arreglo 2) | 🟠 Alto | 🔴 Pendiente (re-confirmado 2026-06-20: `smtp_host=null`) — Supabase Auth → SMTP |
| M1 | `success_url` desajustado (`payment=success` vs `success=true`) | 🟡 Medio | ✅ RESUELTO — en prod |
| M2 | Reputación falsa hardcodeada "99.04%" + "verificado" universal (dark pattern DSA) | 🟡 Medio | Nuevo |
| M3 | Sistema de diseño roto: `primary-500` azul, rojo hardcoded 124×, sin `<Button>`, 17 `alert()` | 🟡 Medio | Pendiente Fase 2 |
| M4 | `.agent/`+`.agents/` (240+ archivos) commiteados al repo público; deps muertas (`zod`,`@hookform/resolvers`) | 🟡 Medio | Nuevo |
| M5 | Páginas monolito (Dashboard 915), sin tests, sin TS, sin AuthProvider/ProtectedRoute/ErrorBoundary | 🟡 Medio | Pendiente Fase 2 |

> **Nota:** muchos C1-C6 son "fix escrito, pendiente de activar". La distancia a producción es el checklist de Fase 0.5 en TODO.md, no trabajo profundo.

## Próximos pasos recomendados (en orden)

1. **Verificar `STRIPE_WEBHOOK_SECRET` en Netlify** == signing secret del endpoint `we_1Suq56...`. Si no coincide, la función rechaza todo con 400 aunque la URL sea correcta. Es lo único entre "webhook OK" y "pagos OK end-to-end".
2. **Configurar SMTP (Arreglo 2)** en Supabase → Auth → SMTP (Resend recomendado) → para que lleguen emails de registro/reset. Requiere cuenta del usuario + verificación de dominio (DNS en Cloudflare lo puede hacer Claude).
3. **Cambiar SSL/TLS mode en Cloudflare a "Full (strict)"** (dashboard, manual — el token no tiene Zone Settings:Edit).
4. **Verificar las 3 env vars secretas en Netlify** (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY).
5. **Probar pago end-to-end** (Stripe test mode): tarjeta + wallet, sin 401, acceso solo tras webhook.
6. **Rotar tokens** Cloudflare + Supabase (quedaron en historial de chats).
7. **Ola 2 (legal + seguridad):** cifrar credenciales, páginas legales (abogado), borrado de cuenta/RGPD, admin hardening.
8. **Ola 3 (UI/UX — lo que el usuario quería):** design system, token `primary` (rojo de marca), `<Button>`/`<Modal>`, 17 `alert()`→Toast, tipografía, sellos de confianza en checkout, sticky CTA mobile, SEO base.

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
- ✅ Canonical: apex `lowsplit.com`. El redirect `www`→apex (301) **ya funciona en prod** (verificado 2026-06-20).
- ❓ ¿Reimplementar Bizum con PSP real o dejarlo desactivado?
- ❓ Confirmar que las env vars secretas están en Netlify (pendiente de verificar).

## Datos de infraestructura (para referencia rápida)

- Netlify site: `lowsplit-app` · ID `9c303714-eabd-4ce2-98df-de930ba7bca1` · admin: https://app.netlify.com/projects/lowsplit-app
- Cloudflare zona: `lowsplit.com` · ID `6788d2a72bb81784332928acae11e5f2`
- Token Cloudflare (DNS:Edit): `~/.claude/credentials/cloudflare.env`
- Netlify CLI autenticado como `creativedesignseo@gmail.com` (equipo AdsPubli)
- Repo: https://github.com/creativedesignseo/lowsplit (público)
