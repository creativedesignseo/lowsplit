# DNS history — lowsplit.com

Respaldo histórico de la configuración DNS del dominio `lowsplit.com` para poder reconstruirla si algo se rompe durante una migración.

> ⚠️ Este directorio es **solo histórico**. La configuración DNS *actual* se gestiona en el proveedor de DNS en uso (Cloudflare / Netlify DNS / Namecheap). No edites estos archivos esperando que afecten al DNS en vivo.

## Convención de nombres

```
lowsplit.com-YYYY-MM-DD-<contexto>.txt
```

Ejemplo: `lowsplit.com-2026-05-27-pre-netlify.txt` = snapshot tomado el 27 de mayo de 2026, justo antes de migrar el DNS a Netlify.

## Cómo restaurar (si hace falta)

1. Identifica el snapshot más reciente que sepas que funcionaba.
2. Comparte el archivo con tu proveedor de DNS (Cloudflare admite importar zonas en formato BIND).
3. Espera la propagación (15 min – 24 h).

## Snapshots actuales

| Fecha | Archivo | Contexto | Notas |
|---|---|---|---|
| 2026-05-27 | [`lowsplit.com-2026-05-27-pre-netlify.txt`](./lowsplit.com-2026-05-27-pre-netlify.txt) | Antes de migrar a Netlify | NS en Cloudflare (dahlia + kurt), A apuntando a 78.47.75.115 (Hetzner proxied), MX en Namecheap email forwarding, SPF de registrar-servers |

## Antes de tocar DNS — checklist

- [ ] Tomar snapshot nuevo (`dig lowsplit.com ANY` o exportar zona desde el proveedor).
- [ ] Guardarlo aquí con el nombre `lowsplit.com-<fecha>-<motivo>.txt`.
- [ ] Apuntar en este README qué cambia y por qué.
- [ ] Tener un plan de rollback (saber cuál es el snapshot al que volver si algo falla).

## Por qué este directorio existe

Los registros DNS controlan **dónde apunta el dominio** (web, email, subdominios, verificaciones de servicios). Un cambio mal hecho puede:

- Tirar la web durante horas.
- Hacer que los correos a `@lowsplit.com` reboten o se pierdan.
- Romper la verificación de Stripe, Google Search Console, etc.

Mantener histórico permite **revertir rápido** sin depender de pedirle al registrar que reabra una copia de seguridad.
