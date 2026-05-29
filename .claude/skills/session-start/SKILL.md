---
description: Bootstrap a fresh session — read HANDOFF.md (if present), tasks/current.md, recent commits, and surface the recommended next action. Use at the start of any session when context is empty or after a long gap.
---

# session-start

You are starting (or resuming) a session on LowSplit. Get
oriented in under 60 seconds.

## Procedure

1. Read `HANDOFF.md` if it exists — operational source of truth.
2. Read `tasks/current.md` — what is on the active queue.
3. Run `git log --oneline -10` — recent commits give last context.
4. Run `git status --short` — uncommitted work in progress?
5. Glance at the newest file under `progress/` if any task spans
   more than one session.

## Report back

In one short message:

- Production state (one line, from HANDOFF.md if present, else
  README.md)
- Last commit (hash + subject)
- Top P0 / recommended next action (from `tasks/current.md`)
- Anything uncommitted that needs decision

Then ask the user what to work on. Do not invent tasks.

## Do not

- Start editing code before the user confirms direction.
- Run any deploy or destructive command.
- Spawn subagents for this skill — it is a quick orientation.
