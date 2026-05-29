# LowSplit — Migraciones de base de datos

Este directorio contiene **migraciones incrementales** que se aplican
sobre el esquema base (`database/schema.sql`, `database/wallets.sql`,
`database/notifications.sql`) para corregir issues detectados en
auditorías o para evolucionar el modelo de datos sin reescribir el
archivo base.

## Convención de nombres

```
YYYYMMDD_<slug>.sql
```

Ejemplo: `20260527_p0_hardening.sql` → migración del 27 mayo 2026,
fase P0 (hardening de seguridad pre-producción).

Cada archivo:

- Está envuelto en `BEGIN; ... COMMIT;` para ser **atómico** (si una
  sentencia falla, **todo se revierte**).
- Es **idempotente cuando es posible** (usa `IF NOT EXISTS`,
  `CREATE OR REPLACE`, `DROP ... IF EXISTS`).
- Incluye al final un bloque de **VERIFICACIÓN** con `SELECT` que
  confirma que cada cambio fue aplicado.

## Cómo aplicar una migración

> ⚠️ **NUNCA ejecutes una migración en producción sin backup previo.**

1. **Backup**
   - En Supabase: *Database → Backups → Create backup* (o esperar al
     backup diario automático y comprobar fecha).
   - Confirmar que el último backup es reciente y restaurable.

2. **Abrir Supabase SQL Editor**
   - Project → SQL Editor → New query.

3. **Pegar el contenido COMPLETO de la migración**
   - Copia todo el archivo `.sql`, incluida la línea `BEGIN;` y `COMMIT;`.
   - **NO ejecutar las queries de verificación todavía** (están después
     del `COMMIT`).

4. **Ejecutar**
   - Run → esperar a "Success".
   - Si hay error: leer el mensaje, NO entrar en pánico — el `BEGIN/COMMIT`
     garantiza que **nada se aplicó parcialmente**. Resolver el problema
     reportado (ver "Riesgos" abajo) y volver a ejecutar.

5. **Verificar**
   - Pegar y ejecutar uno por uno los `SELECT` del bloque
     **VERIFICACIÓN** al final del archivo.
   - Todos deben devolver `ok = true` o un conteo > 0.

6. **Probar en frontend**
   - Login normal de usuario y de admin.
   - Crear grupo, unirse a grupo, ver credenciales como miembro pagado.
   - Recarga de billetera (si Stripe está conectado).

## Cómo revertir si algo falla

Cada migración **debería** poder revertirse, pero NO incluimos `down`
scripts por defecto porque son arriesgados en producción con datos reales.

Opciones de recuperación:

- **Antes del COMMIT**: si la transacción falló y devolvió error, no
  hay nada que revertir — la base sigue en el estado previo.
- **Después del COMMIT**: restaurar desde el backup tomado en el paso 1.
- **Reversión parcial manual**: para cada bloque de la migración
  conocer el `DROP` / `REVOKE` correspondiente. Ejemplos en
  `20260527_p0_hardening.sql`:
  - `DROP TABLE public.stripe_events_processed;`
  - `DROP INDEX public.uq_payment_stripe_pi;`
  - `ALTER TABLE public.payment_transactions DROP CONSTRAINT chk_amount_positive;`
  - `DROP TRIGGER trg_profile_safe_update ON public.profiles;`
  - `DROP FUNCTION public.prevent_privileged_self_edit();`
  - etc.

## Migraciones existentes

| Archivo | Fecha | Resumen | Riesgo |
|---|---|---|---|
| `20260527_p0_hardening.sql` | 2026-05-27 | Cierra vectores P0: idempotencia Stripe, UNIQUE en payment_intents, CHECK constraints, bloqueo self-elevation a admin, reescritura de RLS en memberships y subscription_groups, REVOKE en RPCs financieras, search_path en funciones SECURITY DEFINER. | **Medio** — cambia RLS y triggers. Si el frontend hace `select('*')` sobre `subscription_groups` o intenta `INSERT/DELETE` directos en `memberships` desde el cliente, dejará de funcionar (ahora solo vía RPC SECURITY DEFINER). Probar bien antes de aplicar a producción. |

## Riesgos comunes y cómo resolverlos

### Error: `constraint "uq_payment_stripe_pi" already exists` o similar
- Alguien ya ejecutó (o aplicó parcialmente) la migración.
- Confirmar con queries de verificación si el estado deseado ya está,
  y omitir si es correcto.

### Error: `could not create unique index` / duplicate key
- Hay datos duplicados que violan el nuevo UNIQUE.
- Descomenta el bloque de LIMPIEZA al inicio del bloque B y ejecútalo
  primero.

### Error: `check constraint is violated by some row`
- Hay datos existentes que no cumplen el nuevo CHECK.
- Inspeccionar:
  ```sql
  SELECT id, amount FROM payment_transactions WHERE amount <= 0;
  SELECT id, slots_occupied, max_slots
    FROM subscription_groups WHERE slots_occupied > max_slots;
  ```
- Corregir esas filas manualmente y reintentar.

### El frontend rompe tras aplicar
- Probablemente está usando `select('*')` sobre `subscription_groups`
  (expone credenciales) o hace `INSERT` directo en `memberships`
  (ahora requiere pasar por RPC `handle_join_group_wallet`).
- Ajustar el frontend para usar columnas explícitas y la RPC.
