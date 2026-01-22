# 🚀 LowSplit - Plan de Implementación SaaS

> **Plataforma para compartir suscripciones** - Similar a Spliiit, Gamsgo, Together Price
> 
> **Dominio:** lowsplit.com

---

## 1. Resumen de la Estrategia

Plataforma SaaS moderna donde usuarios pueden crear o unirse a grupos para compartir suscripciones de servicios digitales (Netflix, Spotify, Disney+, etc.), dividiendo el costo mensual entre los miembros.

### Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Base de Datos** | Supabase (PostgreSQL) |
| **Autenticación** | Supabase Auth |
| **Estilos** | Tailwind CSS |
| **Validación** | Zod + React Hook Form |
| **Pagos** | Stripe |
| **Despliegue** | Vercel |

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                        Frontend                          │
│                   Next.js 15 (Vercel)                   │
├─────────────────────────────────────────────────────────┤
│  /(auth)/login  │  /explore  │  /dashboard  │  /groups  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                     Backend / API                        │
│              Next.js Server Actions + API Routes         │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Supabase   │  │   Stripe    │  │   Resend    │
│  (DB/Auth)  │  │  (Payments) │  │  (Emails)   │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## 3. Estructura de Datos (Supabase / PostgreSQL)

### Diagrama Entidad-Relación

```
┌──────────────┐       ┌───────────────────┐       ┌──────────────┐
│   profiles   │       │subscription_groups│       │   services   │
├──────────────┤       ├───────────────────┤       ├──────────────┤
│ id (PK)      │◄──────│ admin_id (FK)     │       │ id (PK)      │
│ full_name    │       │ id (PK)           │──────►│ name         │
│ username     │       │ service_id (FK)   │       │ slug         │
│ avatar_url   │       │ status            │       │ category     │
│ reputation   │       │ description       │       │ total_price  │
│ created_at   │       │ credentials       │       │ max_slots    │
└──────────────┘       │ slots_occupied    │       │ icon_url     │
       ▲               │ created_at        │       └──────────────┘
       │               └─────────┬─────────┘
       │                         │
       │               ┌─────────┴─────────┐
       │               │    memberships    │
       │               ├───────────────────┤
       └───────────────│ user_id (FK)      │
                       │ id (PK)           │
                       │ group_id (FK)     │
                       │ payment_status    │
                       │ joined_at         │
                       └───────────────────┘
```

---

## 4. Esquema SQL

Ver archivo: [`database/schema.sql`](./database/schema.sql)

---

## 5. Estructura de Carpetas (Next.js App Router)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Mis suscripciones
│   │   ├── my-groups/
│   │   │   └── page.tsx          # Grupos que administro
│   │   └── layout.tsx
│   ├── explore/
│   │   └── page.tsx              # Marketplace de servicios
│   ├── groups/
│   │   └── [id]/
│   │       └── page.tsx          # Detalle del grupo
│   ├── layout.tsx
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # Componentes base (Button, Card, etc.)
│   ├── forms/                    # Formularios
│   ├── groups/                   # Componentes de grupos
│   └── services/                 # Componentes de servicios
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Cliente del navegador
│   │   ├── server.ts             # Cliente del servidor
│   │   └── middleware.ts         # Middleware de auth
│   ├── stripe/
│   │   └── client.ts
│   └── utils.ts
├── actions/                      # Server Actions
│   ├── groups.ts
│   ├── memberships.ts
│   └── auth.ts
└── types/
    └── database.ts               # Tipos generados de Supabase
```

---

## 6. Pasos de Implementación

### Fase 1: Fundamentos (Semana 1)
- [x] Crear proyecto Next.js 15 + TypeScript + Tailwind
- [ ] Configurar Supabase (crear proyecto)
- [ ] Ejecutar esquema SQL
- [ ] Configurar autenticación con Supabase Auth
- [ ] Crear layout base (Navbar, Sidebar, Footer)

### Fase 2: Catálogo de Servicios (Semana 2)
- [ ] Página `/explore` - Listado de servicios
- [ ] Cards de servicios con diseño premium
- [ ] Filtros por categoría
- [ ] Búsqueda de servicios

### Fase 3: Gestión de Grupos (Semana 3)
- [ ] Crear grupo (Server Action)
- [ ] Unirse a grupo (Server Action)
- [ ] Página de detalle `/groups/[id]`
- [ ] Sistema de slots con indicador visual

### Fase 4: Dashboard de Usuario (Semana 4)
- [ ] `/dashboard` - Mis suscripciones activas
- [ ] `/my-groups` - Grupos que administro
- [ ] Gestión de credenciales (encriptadas)
- [ ] Historial de pagos

### Fase 5: Pagos con Stripe (Semana 5)
- [ ] Integración Stripe Checkout
- [ ] Webhooks para actualizar `payment_status`
- [ ] Página de éxito/error de pago
- [ ] Suscripciones recurrentes

### Fase 6: Automatización (Semana 6)
- [ ] Edge Functions para recordatorios de pago
- [ ] Notificaciones por email (Resend)
- [ ] Sistema de reputación de usuarios

---

## 7. Políticas de Seguridad (RLS)

### Reglas Principales

1. **Perfiles**: Usuarios solo pueden editar su propio perfil
2. **Servicios**: Lectura pública (catálogo)
3. **Grupos**: 
   - Lectura pública de grupos disponibles
   - Solo el admin puede editar/eliminar
   - Credenciales solo visibles para miembros con `payment_status = 'paid'`
4. **Membresías**: 
   - Usuarios solo ven sus propias membresías
   - Admin del grupo puede ver todas las membresías de su grupo

---

## 8. Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (Resend)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://lowsplit.com
```

---

## 9. Ventajas sobre WordPress/JetEngine

| Característica | WordPress (JetEngine) | LowSplit (Next.js/Supabase) |
|----------------|----------------------|----------------------------|
| **Velocidad** | Carga de página completa | Carga instantánea (SPA/SSR) |
| **Seguridad** | Depende de Plugins | Nivel de Base de Datos (RLS) |
| **Escalabilidad** | Limitada por el servidor WP | Escalado automático (Vercel) |
| **UX/UI** | Limitada por Elementor | Control total con Tailwind CSS |
| **Mantenimiento** | Actualizaciones constantes | Código propio, control total |
| **Costo** | Hosting + Plugins premium | Pay-as-you-go (más económico) |

---

## 10. Próximos Pasos

1. ✅ Proyecto Next.js creado
2. ⏳ Configurar Supabase y ejecutar schema SQL
3. ⏳ Implementar autenticación
4. ⏳ Crear layout y componentes base
5. ⏳ Desarrollar página de exploración

---

*Última actualización: Enero 2026*
