# MCP server

Lets an AI agent explore this SDK and try it against a real save without writing a scratch script
first. Useful when you're building a tool with an agent and want it to check a value rather than
guess at one.

## Run it

```bash
node ./node_modules/thetowersdk/mcp/server.mjs
```

It speaks MCP over stdio, so register it as a stdio server. Working on the package itself,
`npm run build` first — the server reads `dist/` — then `npm run mcp`.

By config file:

```json
{
  "mcpServers": {
    "thetowersdk": {
      "command": "node",
      "args": ["./node_modules/thetowersdk/mcp/server.mjs"]
    }
  }
}
```

Claude Code: `claude mcp add thetowersdk -- node ./node_modules/thetowersdk/mcp/server.mjs`

## Tools

| Tool | What it does |
|---|---|
| `list_exports` | What an entry point exports, filterable. Start here rather than guessing a name. |
| `get_export` | One export, previewed — length plus a sample, so a 300-row table doesn't flood the context. |
| `define_term` | What a game term, acronym or set of module initials means, and whether it is ambiguous. |
| `describe_schema` | The declared shape of a data table, rather than one inferred from a sample row. |
| `decode_save` | Read an official `tool_export.json` and summarise its game data. |
| `run_extractor` | Run one `read*FromSaveRoot` against a save, with its warnings. |
| `calc_list` · `calc_describe` · `calc_run` | Find a calculator, read its inputs, and run it. |
| `calc_chart` · `calc_graph` | A calculator's output as chart rows, and which calculators feed it. |
| `plan_effective_path` | Plan an Effective Paths route, with the candidates it left out and why. |
| `wiki_search` | Find the community wiki's real page titles for a mechanic. |
| `wiki_page` | Read a wiki page as Markdown, whole or one section. |
| `sdk_sandbox_run` | A scratchpad over what the package ships: list, read an export, run a calculator, format, decode. |
| `begin_mechanic_task` | Start a mechanics session — compliance token, map hits, wiki titles to fetch. |
| `record_mechanic_note` | Append verified relationships to `docs/mechanics-map/MAP.md`. |
| `record_work_status` | Append a ledger entry (`awaiting_user` until a person approves — never `done`). |
| `compliance_contract` | The compliance instructions in full. |
| `oracle_*` | The Tower Oracle — see the package README. |

The graph, trust and debug tools (`sdk_graph_*`, `trust_*`, `sdk_debug_*`, `mcp_contract` and a few
others) run scripts from the repository this package is developed in. An installed server leaves
them out of `tools/list` rather than advertising tools that cannot run.

`initialize` returns `instructions` with the compliance pipeline so clients inject it into context.

`decode_save` and `run_extractor` are read-only on the save file. Map/ledger tools **append** to
`docs/mechanics-map/` (override with `TOWER_MECHANICS_MAP_DIR`).

## Compliance pipeline

```
begin_mechanic_task → wiki_page (all related) → [oracle if EP] → record_mechanic_note
→ implement → record_work_status(awaiting_user) → human tests → user_approved
```

## Reading the wiki

The SDK supplies data and formulas, not documentation of game behaviour. Confirm how a mechanic
works against the wiki before describing it.

```
wiki_search { query: "wave skip" }               page titles matching a topic
wiki_page   { title: "Cards" }                   sections, plus the page
wiki_page   { title: "Cards", section: "Costs" } one section
```

Pages are cached in the OS temp directory after the first read. An unknown title returns an error
object naming `wiki_search` rather than throwing.

### Working offline

Set `TOWER_WIKI_DIR` to a directory of `slug.md` files and both tools read it **before** the
network — so an agent with no connection still has the game knowledge:

```bash
TOWER_WIKI_DIR=/path/to/wiki-pages node ./node_modules/thetowersdk/mcp/server.mjs
```

Every response reports `source: "local" | "cache" | "fandom"`, so a local page that may be stale is
distinguishable from a fresh fetch.

A title that is not on disk still reaches the network by default, which on a machine with no
connection means waiting for a socket timeout instead of getting a usable answer. Add
`TOWER_WIKI_OFFLINE=1` to forbid that entirely — anything not already in `TOWER_WIKI_DIR` or the
local cache comes back immediately as an error with a `hint`, never a hang:

```bash
TOWER_WIKI_DIR=/path/to/wiki-pages TOWER_WIKI_OFFLINE=1 node ./node_modules/thetowersdk/mcp/server.mjs
```

This is the integration point for a separate content package. Wiki text is **CC-BY-SA** and this
package is MIT, so pages are fetched rather than bundled; content distributed under its own licence
can be installed alongside and pointed at with `TOWER_WIKI_DIR`. Attribute the wiki if you reproduce
its text.

## Notes

`run_extractor` returning `null` is not a failure — it means the save has no data for that feature,
which is what happens with a save written before the feature existed. The response says so.

`define_term` says `found: false` rather than offering a near-miss. Several acronyms mean more than
one thing — `SR` is both Shrink Ray and Solar Reflector — so pass `domain` when you need one answer.

Results are previewed rather than returned whole. Some tables here have thousands of rows, and
pulling one into context wholesale is rarely what you wanted.

`plan_effective_path` plans from a **zero config**, so its numbers are shaped rather than real. It is
for reading which candidates a variant offers and why the others are out — not for advice. Two things
it is good at:

- **Why a path is short.** Every planner reports the candidates it passed over with a reason, so
  "one step and then nothing" resolves to *everything else is already at its cap* rather than to a
  guess. A candidate is planned, or it is explained; never neither.
- **Which variants exist.** Pass a wrong one and the planner refuses by name and lists what it does
  publish. `lab` is a damage *band* and `lab-time` is a *variant*, one character apart, and passing
  the band used to plan nothing at all in silence.

All four families are here — `damage`, `economy`, `health`, `regen` — since `zeroEffectiveHealthConfig`
gave the last two a complete config to start from. An unknown family is answered with the list of
real ones rather than a failure.

## Official game exports

Save tools accept only `tool_export.json` created by first tapping Player ID five times to create the initial export and reveal the controls, then using Settings → Toggles → External Tools Export → Manual Export. No decryption keys are accepted. Attempting to bypass save-file encryption violates The Tower Terms of Service.
