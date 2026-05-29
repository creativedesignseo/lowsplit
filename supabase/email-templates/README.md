# Plantillas de email (Supabase Auth)

Plantillas HTML de marca para los correos transaccionales de Auth
(confirmación, reset de contraseña, magic link, cambio de email).

## Cómo se aplican

Las plantillas NO viven en este repo como archivos que Supabase lea: se
inyectan en la config de Auth del proyecto vía Management API. El script
`apply-templates.py` genera el HTML y hace el `PATCH`.

```bash
python3 supabase/email-templates/apply-templates.py
```

Requisitos:
- Token de Management API en `~/.claude/credentials/supabase.env`
  (variable `SUPABASE_ACCESS_TOKEN`). Ver HANDOFF.md § ACCESOS.
- El script usa `User-Agent: curl/8.4.0` porque Cloudflare bloquea el
  user-agent por defecto de urllib (error 1010).

## Diseño (sistema de diseño LowSplit)

- Logo: `public/logo-email.png` (PNG, porque Gmail/Outlook no renderizan SVG).
  Generado desde `public/Logo-lowsplit-light.svg` (versión navy para fondo claro).
  Alojado público en Supabase Storage:
  `https://fvycpwfzolzchlwwqafr.supabase.co/storage/v1/object/public/branding/logo-email.png`
- Color de marca (botón): navy `#0B1120` = `primary-500` de `tailwind.config.js`.
- Acento: menta `#42FDC8`. Fuente: Inter / system-ui.
- Botón tipo píldora (`border-radius: 9999px`), igual que los CTA del sitio.

Para regenerar el logo PNG desde el SVG: renderizar `Logo-lowsplit-light.svg`
en Chromium a 440×70 sobre fondo blanco y volver a subir al bucket `branding`.

## ⚠️ Importante: esto es solo el DISEÑO, no el envío a escala

SMTP propio NO está configurado (`smtp_host: None`). Se usa el email
integrado de Supabase, con límite ~3-4 correos/hora (solo para pruebas).
Para producción real hace falta configurar un proveedor SMTP (Resend) en
Supabase → Auth → SMTP. Ver `tasks/current.md` (Arreglo 2).
