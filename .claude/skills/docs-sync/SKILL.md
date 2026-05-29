---
description: Detect and fix contradictions between this project's documentation files (HANDOFF.md, README.md, AGENTS.md, ADRs, config files). Use after a non-trivial change ships, or when the user reports docs feel stale.
---

# docs-sync

Documentation should agree with reality. When it does not, this
skill detects the drift and patches it minimally.

## Source-of-truth hierarchy

When two docs disagree:

1. `HANDOFF.md` wins for current operational state.
2. Newest ADR in `docs/decisions/` wins for architectural choice.
3. Config files (hosting manifest, schema, package manifest) win for
   "what the system actually runs on".
4. `README.md` and strategic docs get corrected, not followed, when
   they conflict with the above.

## Procedure

1. Read `HANDOFF.md` (if present) for current state.
2. Scan `README.md`, `AGENTS.md`, `CLAUDE.md`, and other strategic
   docs for any claim that contradicts HANDOFF.md, the newest ADR,
   or the actual config files.
3. List contradictions found. Do not edit yet.
4. Propose minimal patches. One contradiction at a time.
5. Apply each patch with `Edit` (not `Write`). Preserve surrounding
   prose.
6. For sections that are now historical, mark them with a banner:
   `> Historical — superseded by [link]`. Do not delete.

## After a shipped change

Update `HANDOFF.md` (if it exists):

- Bump `Last updated:` to today.
- Bump `Last commit:` to the new commit hash + one-line subject.
- Add a line under "What works" if the change introduced new
  verified behavior.
- Add a line under "Out of scope until …" if the change deferred
  something.

## Do not

- Rewrite documents wholesale. Edit minimally.
- Touch `progress/` entries. They are immutable journal.
- Re-litigate an Accepted ADR. Supersede with a new ADR if needed.
- Move documentation around in the same pass as fixing
  contradictions. Reorganization is a separate task.
