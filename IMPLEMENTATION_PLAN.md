# 🚀 LowSplit - Plan de Implementación SaaS

> **Plataforma Híbrida de Compartición de Suscripciones**
> Combina la venta directa (estilo GamsGo) con marketplace P2P (estilo Spliiit).
>
> **Dominio:** lowsplit.com

---

## 1. Estado Actual del Proyecto (v1.3.2)

### ✅ Fase 1: Núcleo (Completado)
- Configuración de Vite/React + Tailwind CSS.
- Integración de Supabase (Auth + Base de Datos).
- Políticas de Seguridad (RLS) robustas.
- Layouts principales (Navbar, Footer, Auth).

### ✅ Fase 2: UI/UX & Catálogo (Completado)
- Diseño "Dark/Premium" con Tailwind.
- Página de Exploración con filtros.
- Página de Detalle de Servicio.
- Implementación de iconos locales.

### ✅ Fase 3: Economía & Wallet (Completado)
- Sistema de Billetera (Wallet) interna.
- Recargas mediante Stripe.
- Historial de transacciones.
- Lógica de "Unirse con Saldo".

### ✅ Fase 4: Gestión & Roles (Completado)
- **Rol Super Admin**: Gestión de grupos oficiales.
- **Grupos Oficiales**: Distinción visual, badges de verificado.
- **Notificaciones**: Sistema en tiempo real (campanita).
- **Limpieza de Catálogo**: Unificación de servicios duplicados.

---

## 2. Hoja de Ruta Actualizada (Roadmap)

### 🚧 Fase 5: El Modelo Híbrido (En Progreso)
**Objetivo**: Fusionar la eficiencia de la venta directa con la variedad del marketplace.

- [ ] **Refactor ServiceDetailPage**:
  - **Zona Hero (Oficial)**: Compra directa sin elegir admin. Selectores de duración (3/6/12 meses) y descuentos.
  - **Zona Comunidad (P2P)**: Listado tradicional de grupos de usuarios para quienes buscan alternativas.
- [ ] **Lógica de Asignación Automática**:
  - Al comprar en la zona "Oficial", el backend asigna automáticamente el primer slot disponible en un grupo oficial.
- [ ] **Stock Infinito**: Si no hay grupos oficiales con hueco, el sistema crea uno automáticamente (requiere lógica de bot/admin).

### Fase 6: Retención y Automatización
- [ ] **Emails Transaccionales** (Bienvenida, Recargas, Caducidad).
- [ ] **Chat de Grupo**: Comunicación básica entre miembros.
- [ ] **Sistema de Disputas**: Reportar admins inactivos.

---

## 3. Arquitectura Híbrida

### Flujo de Compra
1. **Usuario Oficial**: Clic en "Comprar 3 Meses" -> Paga -> Asignación Automática -> Acceso a Credenciales.
2. **Usuario P2P**: Navega lista -> Elige Admin (por reputación/precio) -> Paga/Une -> Acceso a Credenciales.

---

## 4. Estructura de Datos Clave
- `profiles`: `role` ('user', 'admin', 'super_admin').
- `subscription_groups`: `is_official` (derivado de `admin.role`).
- `wallets`: Saldo del usuario.
- `transactions`: Historial financiero.

---

*Documento actualizado: Febrero 2026*
