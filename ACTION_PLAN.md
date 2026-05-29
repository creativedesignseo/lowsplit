# Plan de acción — LowSplit

> Recomendación estratégica basada en la re-auditoría (13 agentes, ver `AUDIT_REPORT.md`).
> Fecha: 2026-05-29 · Estado: producción 8/100 🛑 BLOQUEADO

---

## Principio rector

Ordenar el trabajo por **riesgo y dependencia**, no por lo que apetece. La secuencia correcta es:
**¿es legal el negocio? → que los pagos funcionen y sean seguros → cumplimiento legal → diseño/UX → calidad/escala.**

El diseño (que es lo que más te interesa) viene en el Sprint 3 — no porque no importe, sino porque pulir la UI de un checkout que hoy devuelve 401 y de una BD vulnerable sería construir sobre arena.

---

## 🚦 GATE 0 — Decisión existencial (antes de invertir más): ¿el modelo es viable?

**El hallazgo LEGAL-004 puede invalidar todo el proyecto.** Compartir cuentas de Netflix/Spotify/Disney+ entre desconocidos viola los Términos de Uso de esos servicios. Esto no es un bug de código — es un riesgo del modelo de negocio.

**Acción (tú + abogado, ~1 semana, ~150-300€ consulta):**
- Consultar con un abogado especializado en digital/consumo si el modelo es defendible en España/UE.
- Posibles pivotes si no lo es: restringir a planes "familiares" del mismo hogar (que sí permiten compartir), o a servicios cuyos ToS lo permitan.

**Por qué primero:** invertir 2-3 sprints más de desarrollo en un modelo legalmente inviable sería tirar tiempo y dinero. Es la pregunta de 300€ que ahorra meses.

> Si decides asumir el riesgo y seguir igualmente (es tu decisión de negocio), continúa con el Sprint 1. Pero hazlo con los ojos abiertos.

---

## 🏃 SPRINT 1 — Activación: que los pagos funcionen y sean seguros (2-3 días)

> Convierte la Fase 0 (escrita pero inactiva) en efectiva + repara la regresión que rompió los pagos. Tras esto: score ~40-45/100 y checkout funcional.

| # | Acción | Quién | Esfuerzo |
|---|--------|-------|----------|
| 1 | **Aplicar `20260527_p0_hardening.sql` en Supabase** (backup primero) | Tú (1 clic) + Claude guía | 15 min |
| 2 | **Fix PAY-101: header `Authorization` en los 4 fetch** | Claude | 30 min |
| 3 | **Fix PAY-102: bindear `auth.uid()` + recálculo en pago wallet** | Claude | 1-2 h |
| 4 | **Versionar las 3 RPCs fantasma** (volcar de Supabase) | Tú (las exportas) + Claude (versiona) | 1 h |
| 5 | **Catch-all 404 + `/forgot-password`** | Claude | 1 h |
| 6 | **Eliminar regresión Bizum** | Claude | 15 min |
| 7 | **Verificar env vars en Netlify + registrar webhook Stripe** | Tú | 30 min |
| 8 | **Mergear PR #1 → deploy** (SQL ANTES que deploy) | Tú + Claude | 30 min |
| 9 | **Probar pago end-to-end en Stripe test mode** | Tú + Claude (verify) | 30 min |

**Definición de hecho:** un usuario puede unirse a un grupo pagando con tarjeta y con wallet, sin 401, y el acceso se otorga solo tras el webhook. SSL en "Full strict". Rotar token Cloudflare.

---

## 🔐 SPRINT 2 — Cumplimiento legal y cierre de seguridad (1-2 semanas)

> Lo que falta para no exponerte a sanciones ni a la última capa de fraude. Score objetivo ~60/100.

| # | Acción | Quién | Esfuerzo |
|---|--------|-------|----------|
| 1 | **Cifrar credenciales** (tabla aparte + pgsodium, acceso vía RPC) | Claude | 1 día |
| 2 | **Publicar páginas legales** (privacidad, términos, aviso legal, cookies, reembolsos) | Abogado redacta + Claude maqueta/enruta | 2-3 días |
| 3 | **Implementar borrado de cuenta + export de datos** (derecho al olvido) | Claude | 1 día |
| 4 | **Banner de cookies opt-in** (antes de meter analytics) | Claude | 0.5 día |
| 5 | **Desistimiento 14 días + desglose fee/IVA en checkout** | Claude (UI) + abogado (texto) | 0.5 día |
| 6 | **Quitar reputación falsa "99.04%"** + funciones admin al hardening (`setRole` solo super_admin) | Claude | 0.5 día |
| 7 | **`eslint.config.js` + Error Boundary global** | Claude | 0.5 día |

**Definición de hecho:** sin infracciones RGPD evidentes, páginas legales accesibles, credenciales cifradas, admin endurecido.

---

## 🎨 SPRINT 3 — Sistema de diseño y UX (1-2 semanas) ← lo que te interesa

> Ahora sí, sobre cimientos sólidos. Score objetivo ~75/100. Aquí está la "alineación de diseño, colores, tipografía" que pediste.

| # | Acción | Esfuerzo |
|---|--------|----------|
| 1 | **Arreglar el token de color:** `primary` = rojo de marca real, mover el azul a `ink`/`navy` | 0.5 día |
| 2 | **Reemplazar los 124 `#EF534F` hardcodeados** por `primary-500` (find&replace + revisión) | 0.5 día |
| 3 | **Crear sistema de componentes:** `<Button>`, `<Modal>`, `<Input>`, `<Card>`, `<Toast>` con `focus-visible` | 2 días |
| 4 | **Migrar los 17 `alert()`** a Toast | 0.5 día |
| 5 | **Tipografía:** escala semántica (h1-h6), pesos consistentes, quitar `fontFamily` inline | 0.5 día |
| 6 | **Sellos de confianza en el modal de pago** (logos Visa/MC/Stripe, candado, resumen, términos) | 0.5 día |
| 7 | **Sticky CTA mobile en ServiceDetailPage** + estados loading/disabled consistentes | 0.5 día |
| 8 | **SEO base:** robots.txt, sitemap.xml, Open Graph, canonical, JSON-LD | 1 día |

**Definición de hecho:** marca visual coherente, un solo sistema de botones, checkout que transmite confianza, SEO indexable y compartible.

---

## 🚀 SPRINT 4 — Calidad y escala (continuo, 1-3 meses)

> No bloquea el lanzamiento, pero evita que la deuda explote. Score objetivo ~85/100.

- **Tests:** Vitest + RTL (flujos de pago) + Playwright (E2E: registro→pago→dashboard)
- **Arquitectura:** AuthProvider, ProtectedRoute, capa `services/`, code-splitting, romper monolitos (Dashboard 915 líneas)
- **Admin real:** dashboard con datos reales, AdminAudit funcional, `admin_audit_log`
- **Limpieza:** quitar `.agent/.agents` del repo, deps muertas (`zod`/`@hookform/resolvers`), `dotenv` a devDeps, sincronizar README
- **Modernización (cuando toque):** TypeScript incremental, React 18→19, Vite 6→7, reemplazar `react-helmet-async`
- **CI/CD:** GitHub Actions (lint+build+test en PR), Husky, Dependabot
- **Observabilidad:** Sentry

---

## Resumen de la secuencia

```
GATE 0  ── ¿Modelo legal? ────────────── abogado, ~1 sem ── decisión go/no-go
   │
SPRINT 1 ── Activación pagos+seguridad ── 2-3 días ──────── score ~40-45 · checkout funciona
   │
SPRINT 2 ── Legal + cierre seguridad ──── 1-2 sem ───────── score ~60 · sin sanciones evidentes
   │
SPRINT 3 ── DISEÑO + UX + SEO ─────────── 1-2 sem ───────── score ~75 · marca coherente ← lo tuyo
   │
SPRINT 4 ── Calidad + escala ──────────── continuo ──────── score ~85 · mantenible
```

## Mi recomendación honesta en una frase

**Resuelve el Gate 0 (legalidad del modelo) esta semana en paralelo al Sprint 1 (activar pagos).** Si el modelo es viable, sigue la secuencia. Si no, pivota ANTES de invertir en diseño. El diseño que te ilusiona (Sprint 3) rendirá 10× más sobre un producto legal, seguro y con pagos que funcionan.

---

*Plan basado en `AUDIT_REPORT.md`. Tareas detalladas con archivos:línea en `TODO.md`.*
