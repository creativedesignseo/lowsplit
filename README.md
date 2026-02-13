# 🔀 LowSplit

**Comparte suscripciones, ahorra dinero.**

Plataforma SaaS para compartir suscripciones digitales de forma segura y organizada.

## 🚀 Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| **Frontend** | React 19 + Vite 7 |
| **Routing** | React Router DOM 7 |
| **Data Fetching** | TanStack Query (React Query) |
| **Base de Datos** | Supabase (PostgreSQL) |
| **Autenticación** | Supabase Auth |
| **Estilos** | Tailwind CSS |
| **Validación** | Zod + React Hook Form |
| **Pagos** | Stripe |
| **Deploy** | Vercel / Netlify |

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/lowsplit.git
cd lowsplit

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Iniciar servidor de desarrollo
npm run dev
```

## 🔐 Variables de Entorno

Crea un archivo `.env.local` con las siguientes variables:

```env
# Supabase
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_anon_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=tu_stripe_publishable_key
STRIPE_SECRET_KEY=tu_stripe_secret_key
STRIPE_WEBHOOK_SECRET=tu_stripe_webhook_signing_secret

# App
VITE_APP_URL=http://localhost:5173
```

## 📁 Estructura del Proyecto

```
src/
├── components/         # Componentes React reutilizables
│   ├── Navbar.jsx
│   └── Footer.jsx
├── pages/              # Páginas de la aplicación
│   ├── HomePage.jsx
│   ├── ExplorePage.jsx
│   └── DashboardPage.jsx
├── lib/                # Utilidades y clientes
│   └── supabase.js
├── hooks/              # Custom React hooks
├── App.jsx             # Componente principal con rutas
├── main.jsx            # Punto de entrada
└── index.css           # Estilos globales
```

## 🗃️ Base de Datos

El esquema SQL se encuentra en `database/schema.sql`. Ejecuta este archivo en el SQL Editor de Supabase para crear las tablas necesarias.

## 📝 Documentación

- [Plan de Implementación](./IMPLEMENTATION_PLAN.md)
- [Esquema de Base de Datos](./database/schema.sql)

## 🌐 Despliegue

El proyecto está configurado para desplegarse en Vercel o Netlify como una SPA.

```bash
# Build para producción
npm run build

# Preview del build
npm run preview
```

## 📄 Licencia

MIT © 2026 LowSplit
