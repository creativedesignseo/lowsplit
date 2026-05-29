# TODO.md — LowSplit

> Tareas pendientes priorizadas. Estados: ⬜ pendiente · 🟦 en progreso · 🟥 bloqueada · ✅ hecha
> Prioridad: 🔴 alta · 🟡 media · 🟢 baja
> Última actualización: 2026-05-29 (tras re-auditoría 13 agentes — ver AUDIT_REPORT.md)

---

## ⚡ FASE 0.5 — ACTIVACIÓN (1-2 días) — convierte la Fase 0 en efectiva

> La Fase 0 está escrita pero NO activa. Estas tareas la activan y reparan las regresiones detectadas en la re-auditoría. Tras completarlas, score proyectado ~55/100.

| Estado | Prio | Tarea | Archivos | Notas |
|--------|------|-------|----------|-------|
| ⬜ | 🔴 | **C1: Aplicar `20260527_p0_hardening.sql` en Supabase** | `database/migrations/` | Backup + SQL Editor + verificación. Desbloquea 6 hallazgos. Acción #1. |
| ⬜ | 🔴 | **C2: Añadir header `Authorization: Bearer` en los 4 fetch** | `GroupDetailPage.jsx:142,179`, `ServiceDetailPage.jsx:76`, `RechargeModal.jsx:14` | REGRESIÓN — pagos dan 401. `headers:{Authorization:\`Bearer ${session.access_token}\`}` |
| ⬜ | 🔴 | **C3: Bindear `auth.uid()` + recálculo en pago wallet** | RPC `handle_join_group_wallet`, `GroupDetailPage.jsx:115` | O mover a función serverless con requireAuth |
| ⬜ | 🔴 | **C6: Versionar 3 RPCs fantasma** | `database/migrations/` | `handle_partial_wallet_payment`, `handle_join_group_card`, `increment_group_slots` (volcar de Supabase + search_path + REVOKE) |
| ⬜ | 🔴 | **C5: Catch-all 404 + página `/forgot-password`** | `src/App.jsx`, nueva página | `<Route path="*">` + `resetPasswordForEmail` |
| ⬜ | 🟠 | **C9: Eliminar regresión Bizum** | `src/pages/ServiceDetailPage.jsx:111` | Borrar `handleBizumPayment` + modal comentado |
| ⬜ | 🟡 | **M1: Unificar `success_url`** (`payment=success`→`success=true`) | `netlify/functions/create-checkout.js:97` | Notif post-pago no dispara |
| ⬜ | 🔴 | **Mergear PR #1 + verificar deploy** | — | ORDEN: SQL primero, deploy después |
| ⬜ | 🔴 | Verificar env vars secretas en Netlify | Netlify Site settings | STRIPE_SECRET/WEBHOOK, SERVICE_ROLE |
| ⬜ | 🔴 | Registrar webhook Stripe | Stripe Dashboard | `https://lowsplit.com/.netlify/functions/stripe-webhook` |
| ⬜ | 🔴 | SSL/TLS Cloudflare → "Full (strict)" | dashboard Cloudflare | Manual, 1 clic |
| ⬜ | 🟡 | Rotar token Cloudflare (quedó en chat) | `~/.claude/credentials/cloudflare.env` | — |

---

## 🚀 FASE 0 — Stop the Bleed (cerrar antes de producción)

| Estado | Prio | Tarea | Archivos | Notas |
|--------|------|-------|----------|-------|
| ✅ | 🔴 | Borrar endpoints inseguros | `netlify/functions/{test-db,manual-payment}.js` | Hecho (sin commitear) |
| ✅ | 🔴 | JWT + recálculo precio en checkout functions | `netlify/functions/create-*.js`, `_lib/auth.js` | Hecho (sin commitear) |
| ✅ | 🔴 | Webhook idempotente + refunds/disputes | `netlify/functions/stripe-webhook.js` | Hecho (sin commitear) |
| ✅ | 🔴 | Fix crashes frontend (LogIn, useWallet, typo) | `src/pages/*`, `src/hooks/useWallet.js` | Hecho (sin commitear) |
| ✅ | 🔴 | netlify.toml: quitar noindex + SPA redirect + headers | `netlify.toml` | Hecho (sin commitear) |
| ✅ | 🔴 | Completar `.env.example` | `.env.example` | Hecho (sin commitear) |
| ✅ | 🔴 | Generar migración SQL P0 | `database/migrations/20260527_p0_hardening.sql` | Hecho (sin commitear) |
| ⬜ | 🔴 | **Aplicar migración SQL en Supabase** | `database/migrations/20260527_p0_hardening.sql` | SQL Editor → pegar → Run. Fila huérfana ya borrada. |
| ⬜ | 🔴 | **Commit + push rama `fix/p0-production-readiness`** | (toda la rama) | 4 commits o uno. No hecho. |
| ⬜ | 🔴 | **Merge a `main` + verificar deploy Netlify** | — | Dispara build. Verificar que pasa. |
| ⬜ | 🔴 | Cambiar SSL/TLS Cloudflare a "Full (strict)" | dashboard Cloudflare | Manual (token sin permiso). 1 clic. |
| ⬜ | 🔴 | Registrar webhook Stripe en lowsplit.com | Stripe Dashboard | URL: `https://lowsplit.com/.netlify/functions/stripe-webhook` |
| ⬜ | 🔴 | Verificar env vars secretas en Netlify | Netlify Site settings | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY |
| ⬜ | 🟡 | Rotar token Cloudflare (quedó en chat) | `~/.claude/credentials/cloudflare.env` | Regenerar en Cloudflare + actualizar archivo |

---

## 🔐 FASE 1 — Estabilización y seguridad (1-2 semanas)

| Estado | Prio | Tarea | Archivos | Notas |
|--------|------|-------|----------|-------|
| ⬜ | 🔴 | Cifrar credenciales de cuentas (texto plano hoy) | `subscription_groups`, nueva tabla `group_credentials` | pgsodium/Vault + RPC `get_group_credentials`. Crítico GDPR. |
| ⬜ | 🔴 | Versionar RPCs faltantes en repo | `database/migrations/` | `handle_partial_wallet_payment`, `handle_join_group_card`, `increment_group_slots` (volcar desde Supabase) |
| ⬜ | 🟠 | Pago híbrido atómico (no descontar saldo antes de Stripe) | `src/pages/GroupDetailPage.jsx`, webhook | Mover descuento al webhook |
| ⬜ | 🟠 | Refactor `handle_join_group_wallet` para usar `auth.uid()` | `database/wallets.sql` | Hoy acepta `p_user_id` del cliente |
| ⬜ | 🟠 | Crear `eslint.config.js` (lint roto) | raíz | `npm run lint` falla sin él |
| ⬜ | 🟠 | `<ProtectedRoute>` + `<AdminRoute>` | `src/App.jsx` | Hoy cada página chequea sesión por su cuenta |
| ⬜ | 🟠 | `/forgot-password` + catch-all 404 | `src/App.jsx`, nueva página | Link existe pero ruta no |
| ⬜ | 🟡 | AuthProvider + `useAuth()` | `src/contexts/`, componentes | Sesión replicada en Navbar/Dashboard/Profile |
| ⬜ | 🟡 | Error Boundaries (global + por ruta) | `src/main.jsx`, `src/App.jsx` | Cero actualmente |
| ⬜ | 🟡 | Code-splitting con `React.lazy` | `src/App.jsx` | 19 páginas eager-loaded |
| ⬜ | 🟡 | Capa `src/services/` (auth, payments, wallet, groups) | nuevo `src/services/` | Quitar `supabase.from()` de componentes |

---

## 🔍 FASE 1 — SEO (subir de ~5/100 a ~70/100)

| Estado | Prio | Tarea | Archivos | Notas |
|--------|------|-------|----------|-------|
| ⬜ | 🔴 | `public/robots.txt` | `public/robots.txt` | Disallow /admin, /dashboard, /wallet |
| ⬜ | 🔴 | `public/sitemap.xml` (generado desde Supabase) | `scripts/generate-sitemap.js` | Ejecutar en build |
| ⬜ | 🔴 | Open Graph + Twitter cards en `index.html` | `index.html` | Previews al compartir (WhatsApp/X) |
| ⬜ | 🟠 | Imagen OG default 1200×630 | `public/og-default.png` | — |
| ⬜ | 🟠 | JSON-LD (Organization, WebSite, Product, Offer) | `index.html`, páginas | Rich results |
| ⬜ | 🟠 | Canonical URLs + redirect www→apex | Helmet + Netlify | Evitar contenido duplicado |
| ⬜ | 🟡 | Activar Netlify Prerender (SPA → crawlers) | Netlify settings | Soluciona HTML vacío para bots |
| ⬜ | 🟢 | Fix H1 typo "más barato"→"más barata" + Hero.jsx huérfano | `src/pages/HomePage.jsx`, `src/components/Hero.jsx` | — |

---

## 🎨 FASE 1/2 — UI/UX (lo que el usuario pidió originalmente)

| Estado | Prio | Tarea | Archivos | Notas |
|--------|------|-------|----------|-------|
| ⬜ | 🔴 | Fix token color: `primary-500` → `#EF534F` | `tailwind.config.js` | Hoy es azul; rojo está hardcoded 140x |
| ⬜ | 🔴 | Sellos de confianza en modal de pago | `src/pages/GroupDetailPage.jsx` | Logos Visa/MC/Stripe, candado, resumen pedido |
| ⬜ | 🟠 | Componente `<Button>` reutilizable | `src/components/ui/Button.jsx` | 3 hovers distintos hoy para el mismo CTA |
| ⬜ | 🟠 | Migrar `alert()` (20 usos) a Toast | varios | `components/ui/Toast.jsx` existe pero no se usa |
| ⬜ | 🟠 | Sticky CTA mobile en ServiceDetailPage | `src/pages/ServiceDetailPage.jsx` | Solo existe en GroupDetailPage |
| ⬜ | 🟡 | Usar `<Modal>` existente en todos los modales | varios | Hoy cada página hace el suyo |
| ⬜ | 🟡 | AdminDashboard: datos reales (no hardcoded) | `src/pages/admin/AdminDashboard.jsx` | KPIs falsos hoy |
| ⬜ | 🟡 | ServiceCard: mostrar nombre del servicio | `src/components/ServiceCard.jsx` | Solo logo+precio hoy |
| ⬜ | 🟢 | Logos de pago reales en Footer | `src/components/Footer.jsx` | Hoy texto temporal |

---

## 🏗️ FASE 2/3 — Modernización (1-6 meses)

| Estado | Prio | Tarea | Notas |
|--------|------|-------|-------|
| ⬜ | 🟡 | Tests (Vitest + RTL + Playwright) | Cero cobertura. Prioridad: flujo de pago |
| ⬜ | 🟡 | Romper páginas monolito | DashboardPage 915, ProfilePage 702, GroupDetailPage 540 |
| ⬜ | 🟡 | Reemplazar `react-helmet-async` (abandonado) | Hook propio o `@unhead/react` |
| ⬜ | 🟢 | Eliminar `framer-motion` (no se usa) | Bundle -70KB |
| ⬜ | 🟢 | Mover `dotenv` a devDependencies | Solo usado en scripts |
| ⬜ | 🟢 | CI/CD (GitHub Actions: lint+build+test en PR) | — |
| ⬜ | 🟢 | Husky + lint-staged + Prettier | — |
| ⬜ | 🟢 | Renovate/Dependabot | — |
| ⬜ | 🟢 | Migración incremental a TypeScript | Empezar por services/lib |
| ⬜ | 🟢 | Upgrade React 18→19, Vite 6→7, Tailwind 3→4 | Mejora futura |
| ⬜ | 🟢 | Borrar `database/wallet.sql` (duplicado huérfano) | Confirmar primero que no se usa |
| ⬜ | 🟢 | Tabla `admin_audit_log` + auditoría de acciones admin | — |
| ⬜ | 🟢 | Reimplementar Bizum con PSP real o eliminar definitivamente | Hoy desactivado |
| ⬜ | 🟢 | Actualizar README/BLUEPRINT/IMPLEMENTATION_PLAN (info obsoleta) | Versiones, paleta, estado |

---

## Notas técnicas transversales

- **Pagos:** nunca confiar en `amount`/`userId`/`groupId`/`walletDeducted` del cliente. Recalcular/validar en backend siempre.
- **DB:** cambios siempre vía migración en `database/migrations/`, nunca parche suelto.
- **Build:** verificar `npm run build` tras cada cambio antes de commitear.
- **Deploy:** push a `main` dispara deploy automático en Netlify. El sitio está EN VIVO en lowsplit.com — cuidado con romper producción.
- **Email:** no tocar MX/SPF en DNS.
