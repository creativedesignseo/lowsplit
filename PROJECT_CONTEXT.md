# PROJECT_CONTEXT.md — LowSplit

> Contexto completo del proyecto para que cualquier sesión nueva entienda el "qué" y el "porqué".
> Última actualización: 2026-05-27

## Descripción

**LowSplit** es un marketplace SaaS para **compartir suscripciones digitales premium** (Netflix, Spotify, Disney+, HBO, etc.). Permite a usuarios:

- Explorar servicios y grupos de suscripción disponibles.
- Unirse a un grupo pagando su parte (1 "plaza" o slot).
- Pagar con tarjeta (Stripe Checkout) o con saldo interno (wallet).
- Acceder a las credenciales de la cuenta compartida una vez confirmado el pago.
- Crear/administrar grupos como "host" de una suscripción.

## Objetivo principal

Ofrecer una forma **segura y organizada** de dividir el coste de suscripciones, con gestión de pagos, plazas, accesos y un wallet interno. El reto central es la **seguridad de pagos** y la **protección de las credenciales compartidas**.

## Funcionalidades existentes (implementadas)

- ✅ Registro / login / logout (Supabase Auth)
- ✅ Catálogo de servicios y exploración (ExplorePage, ServiceDetailPage)
- ✅ Marketplace de grupos creados por usuarios (MarketplaceListPage, GroupDetailPage)
- ✅ Compra de plaza con tarjeta (Stripe Checkout) y con wallet
- ✅ Wallet con recarga (top-up) vía Stripe
- ✅ Webhook de Stripe que confirma pagos y otorga acceso
- ✅ Dashboard de usuario (compras, ventas, grupos)
- ✅ Panel de administración (usuarios, grupos, stock, auditoría)
- ✅ Sistema de notificaciones (realtime)
- ✅ Creación de grupos / compartir suscripción (ShareSubscriptionPage)

## Funcionalidades pendientes / incompletas

- ⏳ Pago híbrido (wallet + tarjeta): existe código pero la RPC `handle_partial_wallet_payment` no está versionada en el repo y descuenta saldo antes de confirmar Stripe (riesgo).
- ⏳ Bizum / pago manual: DESACTIVADO en Fase 0 (el endpoint era inseguro). Pendiente reimplementar con verificación real.
- ⏳ Cifrado de credenciales en reposo (hoy texto plano — riesgo crítico, ver TODO.md).
- ⏳ SEO: sin sitemap, robots.txt, Open Graph, JSON-LD (ver TODO.md).
- ⏳ Recuperación de contraseña (`/forgot-password` enlazado pero la ruta no existe).
- ⏳ Tests automatizados (cero cobertura).
- ⏳ AdminAudit funcional (la RLS bloquea ver pagos ajenos; falta función admin).

## Arquitectura general

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Browser   │────▶│  Netlify (SPA +  │────▶│   Supabase   │
│  (React 18) │     │   Functions)     │     │ (Postgres +  │
│             │◀────│                  │◀────│  Auth + RLS) │
└─────────────┘     └──────────────────┘     └──────────────┘
       │                     │
       │                     ▼
       │             ┌──────────────┐
       └────────────▶│    Stripe    │
        (loadStripe) │ (Checkout +  │
                     │   Webhook)   │
                     └──────────────┘
```

- **Frontend**: SPA React (Vite), servida por Netlify. Habla directo con Supabase (anon key) para lecturas y con las Netlify Functions para operaciones sensibles.
- **Netlify Functions**: capa serverless que usa `SUPABASE_SERVICE_ROLE_KEY` y la secret key de Stripe. Aquí vive la lógica de pagos segura.
- **Supabase**: Postgres con RLS + RPCs `SECURITY DEFINER` para operaciones atómicas (wallet, membership).
- **Stripe**: Checkout Sessions + webhook firmado para confirmar pagos.

## Flujo de datos — compra de una plaza

```
Usuario pulsa "Comprar ahora" en GroupDetailPage
  ├─ Pago con WALLET:
  │   └─ supabase.rpc('handle_join_group_wallet') → descuenta saldo + crea membership (atómico)
  └─ Pago con TARJETA:
      └─ fetch /.netlify/functions/create-group-checkout
          ├─ requireAuth(event) → user.id del JWT
          ├─ lookup grupo en DB (precio real, plazas, no-miembro)
          ├─ crea Stripe Checkout Session (metadata: userId, groupId, type)
          └─ redirect a Stripe
              └─ tras pagar → Stripe envía webhook checkout.session.completed
                  └─ stripe-webhook.js
                      ├─ verifica firma + idempotencia (stripe_events_processed)
                      ├─ handle_join_group_card → crea membership
                      └─ notifica al usuario
```

**Regla de oro:** el acceso se otorga SOLO desde el webhook, nunca por llegar a `success_url`.

## Dependencias importantes

Ver `CLAUDE.md` → sección Stack. Destacar:
- `@supabase/supabase-js` (cliente DB/auth)
- `stripe` + `@stripe/stripe-js` (pagos)
- `@tanstack/react-query` (server state)
- `react-router-dom` 7 (rutas)
- `react-helmet-async` (⚠️ abandonado, reemplazar)

## Variables de entorno necesarias

Ver `.env.example` (actualizado en Fase 0). Resumen:

| Variable | Tipo | Uso |
|----------|------|-----|
| `VITE_SUPABASE_URL` | pública | cliente Supabase frontend + functions |
| `VITE_SUPABASE_ANON_KEY` | pública | cliente Supabase frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | **secreta** | functions (bypass RLS) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | pública | loadStripe frontend |
| `STRIPE_SECRET_KEY` | **secreta** | functions de checkout |
| `STRIPE_WEBHOOK_SECRET` | **secreta** | verificación firma webhook |
| `APP_PROD_URL` | config | `https://lowsplit.com` — base de success/cancel URLs |
| `VITE_APP_URL` | config | `http://localhost:5173` dev |

⚠️ **Verificar que todas están configuradas en Netlify** (Site settings → Environment variables), no solo en `.env.local`.

## Integraciones externas

- **Supabase** — DB, Auth, Realtime, Storage (proyecto en supabase.com).
- **Stripe** — pagos (modo test/live según la key). Webhook endpoint a registrar: `https://lowsplit.com/.netlify/functions/stripe-webhook`.
- **Netlify** — hosting + serverless. Site: `lowsplit-app` (ID `9c303714-eabd-4ce2-98df-de930ba7bca1`).
- **Cloudflare** — DNS de `lowsplit.com` (proxy ON). Zona ID `6788d2a72bb81784332928acae11e5f2`. Token DNS:Edit guardado en `~/.claude/credentials/cloudflare.env`.
- **Namecheap** — email forwarding `@lowsplit.com` (MX + SPF).

## Decisiones técnicas tomadas

1. **SPA pura (sin SSR)** — afecta SEO; mitigación pendiente (Netlify Prerender o migrar landing a SSR).
2. **Pagos validados 100% en backend** (Fase 0): nunca confiar en el cliente.
3. **Webhook idempotente** vía tabla `stripe_events_processed` (creada en migración P0).
4. **DNS en Cloudflare con CNAME flattening** en apex → Netlify, manteniendo proxy para DDoS/cache.
5. **Migración de DB versionada** en `database/migrations/` (antes se hacían parches sueltos como `visibility_fix.sql`).
6. **Skill `saas-audit`** creada a partir de la auditoría de este proyecto (vive en otro repo: `creativedesignseo/my-dev-toolkits`).
7. **`UNIQUE` de `stripe_payment_intent_id` como índice parcial** (excluye el literal `wallet_balance` que usa la RPC de wallet).

## Notas de info antigua/contradictoria (pendiente de limpiar)

- `README.md` dice React 19 + Vite 7 → es React 18.3 + Vite 6.
- `README.md` dice "Vercel / Netlify" → solo Netlify configurado.
- `PROJECT_BLUEPRINT.md` describe paleta dark distinta a la real.
- `IMPLEMENTATION_PLAN.md` marca Fase 5 "en progreso" pero ya está implementada.
- `database/wallet.sql` vs `database/wallets.sql` → sistema de wallet duplicado; se usa `wallets.sql`.
