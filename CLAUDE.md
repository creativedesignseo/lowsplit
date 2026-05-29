# CLAUDE.md — LowSplit (Claude Code-specific)

> Claude Code reads this file at session start. The portable harness
> contract lives in `AGENTS.md` and is imported below. Keep this file
> short — Claude Code-specific tips only. Everything else goes in
> AGENTS.md.

@AGENTS.md

---

## Claude Code session start

When a fresh Claude Code session opens this repo:

1. Invoke the `session-start` skill (under `.claude/skills/`). It reads
   `HANDOFF.md` + `tasks/current.md` + recent commits and reports in ~60s.
2. Ask the user what to work on — do not invent tasks.

Manual equivalent if the skill is unavailable: read `HANDOFF.md`, then
`tasks/current.md`, then `TODO.md`, then `git log --oneline -10`.

---

## Verification

After any meaningful change, run the `verify` skill or:

```bash
bash scripts/verify.sh
```

Do not commit if `build` fails. Do not deploy without the `deploy-check`
skill and the `deployment-guardian` agent. (Note: `lint` is currently red
due to a missing `eslint.config.js` — known issue in TODO.md Fase 1.)

---

## Subagents available under `.claude/agents/`

- `orchestrator` — plan a multi-step change
- `implementer` — write the code per the plan
- `reviewer` — review a diff before commit
- `deployment-guardian` — gates anything deploy-shaped
- `docs-curator` — keeps README / HANDOFF / ADRs aligned

Default to the main agent. Spawn a subagent only when the task matches
one of the above and you have a self-contained brief.

---

## Skills available under `.claude/skills/`

- `session-start` — orient at session start
- `verify` — run the local verification pipeline
- `docs-sync` — find and fix doc/reality drift
- `deploy-check` — pre-deploy safety checklist

---

## Project owner working preferences

- **Idioma:** habla con Jonatan en **español (es-ES)**. Tutea, tono directo, sin relleno.
- Hereda también las reglas globales de `~/.claude/CLAUDE.md` (cuentas de email, CLIs, seguridad).
- Move fast, don't over-engineer. Nunca comandos destructivos sin aprobación explícita en el chat.
- Siempre mostrar el diff o el plan antes de aplicar cambios no triviales.
- Pagos: nunca confiar en datos del cliente; ver reglas de seguridad de pagos en `AGENTS.md`.
- Este sitio está EN VIVO en producción (lowsplit.com) — cuidado con cualquier push a `main` (dispara deploy).
