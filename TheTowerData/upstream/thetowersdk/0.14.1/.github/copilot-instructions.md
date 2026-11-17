# Copilot instructions

The canonical instructions for this package are in [AGENTS.md](../AGENTS.md).

When the package lives inside the Tower Run Tracker monorepo, also obey
[docs/AGENT_GAME_MECHANICS_CONTRACT.md](../../docs/AGENT_GAME_MECHANICS_CONTRACT.md):
`begin_mechanic_task` → wiki → (oracle if EP) → `record_mechanic_note` / `record_work_status`.
Never mark work finished without human `user_approved`.

Key points when suggesting code here:

- Import from the entry points in `package.json` `exports` — `thetowersdk/data`, `/save`,
  `/mechanics`, `/calculators`, `/formatting` and the rest. There is no `thetowersdk/internal/*`.
- `read*FromSaveRoot()` returns `T | null`; always guard the result.
- Save arrays are positional and over-allocated; prefer an unlock flag over a level to decide
  whether a slot is in use.
- Named exports only, kebab-case file names, and every public module is exported from its
  `src/<area>/index.ts` barrel.
- Use MCP `wiki_search` / `wiki_page` / `define_term` before describing mechanic behaviour.
