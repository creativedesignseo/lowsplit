# Production Readiness Audit — LowSplit (Re-auditoría post Fase 0)

> **Fecha:** 2026-05-29
> **Modo:** full (13 agentes — 11 especialistas + orquestador + reporter)
> **Rama auditada:** `fix/p0-production-readiness` (con los fixes de Fase 0)
> **Auditoría previa:** 8/100 🛑 BLOCKED (10 agentes ad-hoc)
> **Stack:** React 18.3 + Vite 6 + Supabase + Stripe + Netlify Functions + Tailwind 3

---

## Banner de score

```
╔══════════════════════════════════════════════════════════════════╗
║  PRODUCTION READINESS — LowSplit                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  PRODUCCIÓN HOY (live, sin merge ni SQL):   ██░░░░░░░░  8/100  🛑  ║
║  CÓDIGO en rama (algoritmo estricto):       ███░░░░░░░ ~12/100 🛑  ║
║  PROYECTADO tras checklist de activación:   █████░░░░░ ~55/100 🟠  ║
║                                                                    ║
║  Security      ░░░░░░░░░░  0/25   (fixes escritos, no activos)     ║
║  Payments      ░░░░░░░░░░  0/20   (backend OK, frontend roto)      ║
║  Data layer    ░░░░░░░░░░  0/15   (migración sin aplicar)          ║
║  UI/UX         ░░░░░░░░░░  0/10   (sistema de diseño sin tocar)    ║
║  QA            ░░░░░░░░░░  0/10   (2 crashes nuevos)               ║
║  Admin         ░░░░░░░░░░  0/5    (sin cambios)                    ║
║  SEO/Perf      ░░░░░░░░░░  0/5    (noindex fuera ✓, resto pdte)    ║
║  Deploy        ░░░░░░░░░░  0/5    (config OK, deuda calidad)       ║
║  Stack         ░░░░░░░░░░  0/3    (deuda intacta)                  ║
║  Legal         ░░░░░░░░░░  0/2    (NUEVO — 3 críticos)             ║
║                                                                    ║
║  Findings: 12 críticos · 18 altos · 17 medios · 11 bajos           ║
╚══════════════════════════════════════════════════════════════════╝
```

> **Por qué el score apenas se movió aunque el código mejoró mucho** — lee la sección siguiente. NO significa que el trabajo de Fase 0 no sirviera: significa que los fixes **están escritos pero no activados**, que se introdujo **1 regresión que rompe los pagos**, y que esta vez auditamos **Legal** (nueva, 3 críticos no contados antes). El score real de producción no cambió porque **nada se ha desplegado ni aplicado todavía**.

---

## 1. Resumen ejecutivo

La re-auditoría confirma que **el trabajo de Fase 0 fue correcto y sustancial a nivel de código**: los 7 vectores de fraude P0 originales están cerrados en el backend (JWT obligatorio, recálculo de precios server-side, idempotencia de webhook, `apiVersion` pineado, endpoints inseguros borrados, `noindex` eliminado). Sin embargo, el **estado de producción no ha mejorado** y la app **sigue 🛑 BLOQUEADA** por tres razones:

1. **Los fixes no están activos.** La migración SQL `20260527_p0_hardening.sql` (que cierra RLS, idempotencia y self-elevation) **no se ha aplicado en Supabase**. La rama **no se ha mergeado ni desplegado**. La BD viva y el sitio live siguen exactamente como en la 1ª auditoría.
2. **Se introdujo una regresión que rompe los pagos.** El backend ahora exige JWT, pero el frontend **nunca se actualizó para enviar el header `Authorization`** → el pago con tarjeta y la recarga devuelven **401 al 100%** (PAY-101). Es decir: el hardening rompió la integración end-to-end porque no se probó el flujo completo.
3. **Quedan agujeros que Fase 0 no tocó** + se auditó por primera vez **Legal** (3 críticos): credenciales en texto plano, pago con wallet manipulable desde el cliente, sin páginas legales, sin derecho al olvido.

**La buena noticia:** la distancia a un estado lanzable es ahora un **checklist corto y concreto** (aplicar SQL, añadir header JWT, limpiar 2 regresiones, publicar páginas legales) en vez del trabajo profundo de la 1ª auditoría. Aplicando el checklist de activación, el score proyectado salta a ~55/100.

---

## 2. Estado de los 7 P0 originales

| P0 original (1ª auditoría) | Estado en código | Estado en producción |
|---|---|---|
| Wallet top-up RPC accesible (`handle_wallet_topup`) | ✅ REVOKE escrito + frontend ya no la llama | ❌ Vulnerable (SQL sin aplicar) |
| Self-elevation a super_admin (RLS `profiles`) | ✅ Trigger escrito | ❌ Vulnerable (SQL sin aplicar) |
| Credenciales legibles por todos (RLS `auth_read_groups`) | 🟡 Policy reescrita, pero **siguen en texto plano** | ❌ Vulnerable |
| `amount` del cliente en checkout | ✅ Recalculado en backend | ⚠️ Backend OK, pero pago roto por PAY-101 |
| `manual-payment.js` (Bizum sin auth) | ✅ Borrado | ✅ Borrado — ⚠️ pero aún invocado (regresión) |
| `test-db.js` público | ✅ Borrado | ✅ Resuelto |
| Webhook sin idempotencia | ✅ Código + tabla escritos | ❌ Tabla no existe (SQL sin aplicar) |

**Veredicto:** 1 de 7 totalmente resuelto en producción (`test-db.js`). Los otros 6 están "resueltos en código, pendientes de activar".

---

## 3. Hallazgos críticos (P0)

Deduplicados por causa raíz:

### 🔴 C1 — Migración SQL sin aplicar (raíz de 6 hallazgos)
`database/migrations/20260527_p0_hardening.sql` está escrita y es correcta, pero **no se ha ejecutado en Supabase**. Hasta aplicarla: self-elevation a admin, wallet gratis vía RPC, credenciales legibles, sin idempotencia (doble-cobro), sin CHECK constraints → todo **vivo en producción**. Detectado por Security, Data, Admin, QA, Payments.
**Acción:** backup + ejecutar el SQL en Supabase SQL Editor + correr el bloque de verificación.

### 🔴 C2 — Frontend no envía JWT → pagos rotos (PAY-101 / SEC-002)
El backend exige `Authorization: Bearer` (`requireAuth`), pero ningún `fetch` del frontend lo envía (`GroupDetailPage.jsx:142,179`, `ServiceDetailPage.jsx:76`, `RechargeModal.jsx:14`). **El pago con tarjeta y la recarga devuelven 401 siempre.** Regresión introducida por los propios fixes.
**Acción:** añadir `headers: { Authorization: \`Bearer ${session.access_token}\` }` a las 4 llamadas.

### 🔴 C3 — Pago con wallet manipulable (PAY-102)
`handlePayWithWallet`/`handlePayHybrid` llaman `supabase.rpc('handle_join_group_wallet', { p_user_id, p_amount })` directo desde el navegador. La RPC no valida `auth.uid() = p_user_id` ni recalcula el precio → un atacante puede unirse a un grupo con `p_amount: 0.01`.
**Acción:** mover el pago con wallet a una función serverless con `requireAuth`, o añadir binding `auth.uid()` + recálculo dentro de la RPC.

### 🔴 C4 — Credenciales de terceros en texto plano (LEGAL-001 / DB-002 / SEC)
`subscription_groups.credentials_login/password` en TEXTO PLANO. Infracción art. 32 RGPD. La migración lo aplaza explícitamente a Fase 1.
**Acción (Fase 1):** tabla aparte cifrada (pgsodium), acceso solo vía RPC para miembros pagados.

### 🔴 C5 — Pantalla blanca: sin catch-all 404 + `/forgot-password` inexistente (QA-014)
`App.jsx` no tiene `<Route path="*">` ni `/forgot-password` (enlazado desde Login). Cualquier URL inexistente → pantalla en blanco. Usuario que olvida contraseña queda bloqueado.
**Acción:** añadir 404 catch-all + página de recuperación con `resetPasswordForEmail`.

### 🔴 C6 — RPCs fantasma sin versionar (PAY-103 / SEC-003 / DB-002)
`handle_partial_wallet_payment`, `handle_join_group_card`, `increment_group_slots` se invocan desde producción pero **no existen en el repo**. Son parte del flujo de pago con tarjeta. No auditables, sin REVOKE, sin `search_path`.
**Acción:** volcar definiciones desde Supabase, versionarlas, añadir `search_path` + REVOKE.

### 🔴 C7 — Sin páginas legales (LEGAL-002 / LEGAL-009)
Footer y registro enlazan a `/terms`, `/privacy`, `/refund`, etc. — **ninguna ruta existe (404)**. Sin política de privacidad ni aviso legal (obligatorio LSSI-CE + RGPD). El registro fuerza aceptar T&C que no existen → consentimiento inválido.
**Acción:** publicar y enrutar las páginas legales (contenido = abogado).

### 🔴 C8 — Derecho al olvido roto (LEGAL-003)
El botón "Eliminar cuenta" (`ProfilePage.jsx:690`) no tiene `onClick`. No hay borrado de usuario ni export de datos. Infracción art. 17/20 RGPD.
**Acción:** implementar borrado real + export de datos.

### 🟠 C9 (alto) — Regresión Bizum (ARCH-001)
`ServiceDetailPage.jsx:111` aún hace `fetch` a `manual-payment` (función borrada) → 404 si se reactiva el modal. Código muerto peligroso.
**Acción:** eliminar `handleBizumPayment` y el modal comentado.

---

## 4. Comparativa: qué mejoró vs qué sigue

### ✅ Mejoró realmente (en código)
- Backend de pagos: JWT, recálculo de precio, idempotencia, apiVersion, errores genéricos
- `noindex` eliminado → **el sitio ya es indexable** (SEO ~22→~42 una vez desplegado)
- Endpoints inseguros borrados (`test-db.js`, `manual-payment.js`)
- Config de deploy: redirect SPA, headers de seguridad, CORS restringido, `.env.example` completo, dominio `lowsplit.com` consistente
- UI: reviews falsas eliminadas, Bizum oculto, Footer responsive, typos corregidos
- **Harness de ingeniería añadido** (AGENTS.md, .claude/agents, verify.sh, HANDOFF/TODO) → gran mejora de mantenibilidad
- `framer-motion` ahora sí se usa (deja de ser peso muerto)

### ❌ Sigue pendiente / nuevo
- Migración SQL sin aplicar (C1) · Frontend sin JWT (C2) · Wallet manipulable (C3)
- Credenciales en claro (C4) · 404/forgot-password (C5) · RPCs fantasma (C6)
- **Legal entero** (C7, C8 + cookies, desistimiento, fee/IVA sin desglosar, reputación falsa "99.04%")
- Sistema de diseño roto (`primary-500` azul, rojo hardcoded 124×, sin `<Button>`, 17 `alert()`)
- Admin sin avances (dashboard hardcoded, AdminAudit roto, sin audit_log)
- Sin tests, sin TypeScript, sin `eslint.config.js` (lint roto), monolitos
- Funciones admin fuera del hardening (CORS `*`, `setRole` accesible a admin normal)
- `.agent/.agents` (240+ archivos) commiteados al repo público · deps muertas (`zod`, `@hookform/resolvers`)

---

## 5. Roadmap actualizado

### 🚨 Fase 0.5 — Activación (1-2 días) — convierte el trabajo ya hecho en efectivo
1. **Aplicar `20260527_p0_hardening.sql` en Supabase** (backup primero) — desbloquea C1 (6 hallazgos)
2. **Añadir header `Authorization: Bearer` en los 4 fetch del frontend** (C2) — repara los pagos
3. **Bindear `auth.uid()` + recálculo en pago wallet** (C3)
4. **Versionar las 3 RPCs fantasma** (C6)
5. **Catch-all 404 + página `/forgot-password`** (C5)
6. **Eliminar regresión Bizum** (C9)
7. **Mergear PR #1 + verificar deploy** (orden: SQL primero, deploy después)

### 🔐 Fase 1 — Seguridad y legal (1-2 semanas)
- Cifrar credenciales (C4) · Publicar páginas legales (C7) · Borrado de cuenta (C8)
- Banner de cookies · desistimiento 14 días · desglose fee+IVA · quitar reputación falsa
- Funciones admin → `requireAuth`+`corsHeaders`, `setRole` solo super_admin
- `eslint.config.js` · Error Boundary global · sitemap/robots/OG

### 🎨 Fase 2 — Diseño, calidad, modernización (3-4 semanas)
- **Sistema de diseño:** fix token `primary`, `<Button>`/`<Modal>`/`<Toast>`, migrar 17 `alert()`, tipografía
- AuthProvider · ProtectedRoute · capa services/ · code-splitting · romper monolitos
- Tests (Vitest + Playwright) · sellos de confianza en checkout
- Dashboard admin real · AdminAudit funcional · audit_log

### 🚀 Fase 3 — Escala (1-6 meses)
- TypeScript incremental · React 18→19 · Vite 6→7 · Tailwind 3→4
- Reemplazar `react-helmet-async` · CI/CD · observabilidad (Sentry)

### ⚖️ Requiere abogado (no es código)
- **Viabilidad del modelo de negocio** (compartir cuentas vs ToS de Netflix/Spotify) — LEGAL-004
- Redacción de Privacidad, Términos, Aviso Legal, Cookies, Reembolsos
- Régimen IVA/OSS · encaje como intermediario de pagos

---

## 6. Lección de la re-auditoría

El mayor valor de esta segunda pasada fue detectar **una regresión que la primera no podía ver**: los fixes de seguridad del backend **rompieron los pagos** porque el frontend nunca se actualizó (PAY-101), y dejaron el pago con wallet sin proteger (PAY-102). Sin re-auditar, se habría desplegado un backend "seguro" con el checkout roto. Confirma que **endurecer el backend sin probar el flujo end-to-end es media solución** — y que las auditorías iterativas atrapan lo que las correcciones introducen.

---

*Generado por la skill `saas-audit` v0.1 — auditoría read-only. Para aplicar correcciones: `/saas-audit --fix` (v0.2, futuro).*
