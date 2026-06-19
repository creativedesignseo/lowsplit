# Re-verify production reality and sync HANDOFF

**Date:** 2026-06-20 (started)
**Status:** completed
**Related:** HANDOFF.md (all sections), tasks/current.md, AGENTS.md "Sources of truth"

## Objective

Ritual "CIERRA Y PUBLICA": refresh HANDOFF.md with *verified* reality
(code + live prod), not assumptions. The docs had drifted: a stale audit
verdict ("8/100, BLOCKED, migration not applied, payments broken") still
sat in HANDOFF mid-file contradicting the live state, and several items
were marked pending that are actually done.

## Files inspected

- `HANDOFF.md` — operational state; found stale audit section + outdated
  "lint broken" / "www→apex pending" notes.
- `tasks/current.md` — active queue; SMTP listed as blocker (correct).
- `progress/README.md` — entry template/format.
- `CLAUDE.md` / `AGENTS.md` — still say "lint is currently red" (now obsolete).

## Files changed

- `HANDOFF.md` — header date → 2026-06-20; "DÓNDE LO DEJAMOS" + build block
  rewritten with verified facts; SMTP status re-confirmed via API; added
  Supabase account/email + 3-project list to access table; replaced stale
  "8/100 BLOCKED" summary with verified state; H2/H3 marked resolved;
  www→apex question marked resolved.
- `tasks/current.md` — date + current-state refreshed; added 2026-06-20
  re-verification entry.
- `progress/2026-06-20-reverify-and-sync-handoff.md` — this file.

## Commands run

```bash
git branch --show-current        # main
git status --short               # clean
git log --oneline -8             # HEAD 7640a76
bash scripts/verify.sh           # ✓ all checks passed (lint 0 err/38 warn, build 770 KB)
curl -I https://lowsplit.com                 # HTTP 200, ssl_verify_result=0
curl -I https://www.lowsplit.com             # 301 → https://lowsplit.com/
curl -X POST .../stripe-webhook              # HTTP 400 (alive, validates signature)
curl -I https://lowsplit.com/robots.txt      # 200
curl -I https://lowsplit.com/sitemap.xml     # 200
# Supabase Management API (token from ~/.claude/credentials/supabase.env):
GET /v1/organizations                        # org creativedesignseo
GET /v1/projects                             # lowsplit + nexopos-dev + shopify-import
GET /v1/organizations/.../members            # owner = creativedesignseo@gmail.com
GET /v1/projects/fvycpwfzolzchlwwqafr/config/auth   # smtp_host=null, rate_limit=2
GET /v1/projects/fvycpwfzolzchlwwqafr/advisors/security  # 0 ERROR-level lints
netlify api listSiteDeploys                  # prod 7640a76 state=ready
```

## Verification

- `bash scripts/verify.sh` → ✓ all checks passed (build is the green signal;
  lint now passes too — the old "lint red" note is obsolete).
- Prod: apex 200 + valid TLS, www→apex 301, webhook alive, SEO files 200.
- Supabase: SMTP unset (`smtp_host=null`, `rate_limit_email_sent=2`), 0 ERROR
  advisors, site_url correct.
- Netlify production deploy `7640a76` = `state=ready` = local HEAD.

## Open risks

- **SMTP still unconfigured** → real signup is broken until a provider
  (Brevo/Resend) is set in Supabase → Auth → SMTP. This is the only blocker
  to opening registration.
- Cloudflare SSL *mode* (Flexible/Full/Strict) not verifiable with the
  current DNS-only token; cert validity confirmed by curl, mode assumed but
  not proven — confirm in dashboard if it matters.
- End-to-end payment (card + wallet) not yet re-tested this session.

## Next step

Configure SMTP in Supabase (Brevo creds in `~/.claude/credentials/brevo.env`),
then run one end-to-end payment test (Stripe test card → webhook grants access).
