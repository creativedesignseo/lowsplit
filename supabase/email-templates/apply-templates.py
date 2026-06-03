import json, os, subprocess, urllib.request

REF = "fvycpwfzolzchlwwqafr"

# read token from credential file
token = None
with open(os.path.expanduser("~/.claude/credentials/supabase.env")) as f:
    for line in f:
        line = line.strip()
        if line.startswith("export "):
            line = line[len("export "):]
        if "=" in line:
            k, v = line.split("=", 1)
            v = v.strip().strip('"').strip("'")
            if k.strip() in ("SUPABASE_ACCESS_TOKEN", "SUPABASE_MANAGEMENT_TOKEN") and v:
                token = v
assert token, "no token found"

# ---- branded email base (table-based, inline CSS, email-client safe) ----
def email(title, intro, button_label, footer_note):
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>{title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
<tr><td style="padding:40px 40px 24px 40px;text-align:center;">
<img src="https://fvycpwfzolzchlwwqafr.supabase.co/storage/v1/object/public/branding/logo-email.png" alt="LowSplit" width="200" style="width:200px;max-width:60%;height:auto;display:inline-block;border:0;">
</td></tr>
<tr><td style="padding:0 40px;text-align:center;">
<h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:#111827;font-weight:700;">{title}</h1>
<p style="margin:0 0 28px 0;font-size:15px;line-height:1.6;color:#4b5563;">{intro}</p>
</td></tr>
<tr><td style="padding:0 40px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
<tr><td style="border-radius:9999px;background-color:#0B1120;">
<a href="{{{{ .ConfirmationURL }}}}" target="_blank" style="display:inline-block;padding:15px 40px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:9999px;">{button_label}</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:28px 40px 0 40px;text-align:center;">
<p style="margin:0 0 8px 0;font-size:12px;color:#9ca3af;">O pega este enlace en tu navegador:</p>
<p style="margin:0;font-size:12px;word-break:break-all;"><a href="{{{{ .ConfirmationURL }}}}" target="_blank" style="color:#0B1120;text-decoration:none;">{{{{ .ConfirmationURL }}}}</a></p>
</td></tr>
<tr><td style="padding:32px 40px 0 40px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"></td></tr>
<tr><td style="padding:24px 40px 40px 40px;text-align:center;">
<p style="margin:0 0 16px 0;font-size:13px;line-height:1.6;color:#6b7280;">{footer_note}</p>
<img src="https://fvycpwfzolzchlwwqafr.supabase.co/storage/v1/object/public/branding/logo-email.png" alt="LowSplit" width="110" style="width:110px;max-width:40%;height:auto;display:inline-block;border:0;opacity:0.9;margin:0 0 10px 0;">
<p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 · <a href="https://lowsplit.com" target="_blank" style="color:#9ca3af;text-decoration:underline;">lowsplit.com</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>"""

confirmation = email(
    "Confirma tu correo",
    "Estás a un paso de empezar a ahorrar. Confirma tu dirección de correo para activar tu cuenta de LowSplit.",
    "Verificar correo",
    "Si no creaste una cuenta en LowSplit, puedes ignorar este correo de forma segura.",
)
recovery = email(
    "Restablece tu contraseña",
    "Recibimos una solicitud para restablecer la contraseña de tu cuenta. Pulsa el botón para crear una nueva.",
    "Cambiar contraseña",
    "Si no solicitaste este cambio, ignora este correo: tu contraseña seguirá siendo la misma.",
)
magic = email(
    "Tu enlace de acceso",
    "Pulsa el botón para iniciar sesión en LowSplit. Este enlace es de un solo uso y caduca pronto.",
    "Iniciar sesión",
    "Si no solicitaste este enlace, puedes ignorar este correo de forma segura.",
)
email_change = email(
    "Confirma tu nuevo correo",
    "Para completar el cambio de tu dirección de correo, confírmala pulsando el botón.",
    "Confirmar cambio",
    "Si no solicitaste este cambio, contacta con soporte de inmediato.",
)

payload = {
    "mailer_subjects_confirmation": "Confirma tu correo · LowSplit",
    "mailer_subjects_recovery": "Restablece tu contraseña · LowSplit",
    "mailer_subjects_magic_link": "Tu enlace de acceso · LowSplit",
    "mailer_subjects_email_change": "Confirma tu nuevo correo · LowSplit",
    "mailer_templates_confirmation_content": confirmation,
    "mailer_templates_recovery_content": recovery,
    "mailer_templates_magic_link_content": magic,
    "mailer_templates_email_change_content": email_change,
}

req = urllib.request.Request(
    f"https://api.supabase.com/v1/projects/{REF}/config/auth",
    data=json.dumps(payload).encode(),
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json", "User-Agent": "curl/8.4.0"},
    method="PATCH",
)
try:
    with urllib.request.urlopen(req) as r:
        d = json.loads(r.read())
    print("HTTP OK")
    print("subject confirmation ->", d.get("mailer_subjects_confirmation"))
    print("subject recovery     ->", d.get("mailer_subjects_recovery"))
    print("confirmation len     ->", len(d.get("mailer_templates_confirmation_content") or ""))
    print("recovery len         ->", len(d.get("mailer_templates_recovery_content") or ""))
    print("magic len            ->", len(d.get("mailer_templates_magic_link_content") or ""))
except urllib.error.HTTPError as e:
    print("HTTP ERROR", e.code)
    print(e.read().decode()[:500])
