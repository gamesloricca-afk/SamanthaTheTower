# Claude instructions

See **[AGENTS.md](AGENTS.md)** — canonical for this package.

In the Run Tracker monorepo also follow
**[docs/AGENT_GAME_MECHANICS_CONTRACT.md](../../docs/AGENT_GAME_MECHANICS_CONTRACT.md)**
(tool-agnostic; same rules as Cursor and Copilot).

## Compliance pipeline (mandatory for mechanic work)

1. MCP `begin_mechanic_task` → `wiki_page` (all related titles) → oracle if sheet-backed.
2. `record_mechanic_note` + `record_work_status` (`awaiting_user` until human approval).
3. Living map: `docs/mechanics-map/MAP.md` · ledger: `docs/mechanics-map/LEDGER.md`.
4. Never guess unlocks/units; never invent exports; never say “done” without `user_approved`.

## Quick orientation

- Public API: `thetowersdk/data`, `/save`, `/node`, `/formatting`, `/mechanics`, `/wiki`.
  There is no `thetowersdk/internal/*`; the entry points are the whole surface.
- Save extractors return `null` rather than throwing, and report `warnings`.
- Run `pnpm verify` before proposing a change.
