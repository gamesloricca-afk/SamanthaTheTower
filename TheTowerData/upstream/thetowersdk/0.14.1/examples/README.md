# Examples

Runnable scripts, numbered roughly by how much they assume. Each one is standalone — read the
header comment, run it, then copy the parts you need.

```bash
npx tsx examples/01-browse-game-data.ts
```

| # | File | Needs | What it shows |
|---|---|---|---|
| 1 | [`01-browse-game-data.ts`](01-browse-game-data.ts) | nothing | The catalogs as typed arrays: cost to max, grouping by category |
| 2 | [`02-read-a-save-file.ts`](02-read-a-save-file.ts) | an official game export | Decode `tool_export.json` once, then run extractors over the root |
| 3 | [`03-plan-upgrades-from-a-save.ts`](03-plan-upgrades-from-a-save.ts) | an official game export | The three layers together — decode → read → rank what to buy next |
| 4 | [`04-generate-a-chart.ts`](04-generate-a-chart.ts) | nothing | Turn a level progression into a plot-ready series |
| 5 | [`05-generate-a-cost-table.ts`](05-generate-a-cost-table.ts) | nothing | Build a cost table for an ultimate weapon |
| 6 | [`06-read-the-community-wiki.ts`](06-read-the-community-wiki.ts) | network | Search the wikis, fetch a page as Markdown, credit its authors |
| 7 | [`07-format-like-the-game.ts`](07-format-like-the-game.ts) | nothing | Print and parse numbers the way the game does, both directions |
| 8 | [`08-build-a-calculator.ts`](08-build-a-calculator.ts) | nothing | Render a whole calculator — form and results — from a builder it never names |
| 9 | [`09-build-a-bot.ts`](09-build-a-bot.ts) | nothing | Every calculator as a bot command, with dispatch, memoising and error replies |
| 10 | [`10-read-a-sheet.ts`](10-read-a-sheet.ts) | nothing | A Google Sheets read, and the two ways a successful read misleads |
| 11 | [`11-build-a-knowledge-base.ts`](11-build-a-knowledge-base.ts) | nothing | Knowledge chunks derived from the catalogs, so the prose cannot go stale |
| 12 | [`12-show-module-and-card-art.ts`](12-show-module-and-card-art.ts) | nothing | Pointing at artwork you supply yourself, and the naming rule that finds it |

## Getting an official game export

First tap your Player ID five times to create `tool_export.json` and reveal the export controls. For subsequent exports, use Settings → Toggles → External Tools Export → Manual Export. It comes from the player's own device. The examples that need one take its path as
an argument; nothing here downloads or uploads a save.

## Templates

The examples explain. The [templates](../templates) are meant to be copied — a CLI, a
browser-safe module, and a calculator with typed inputs.

## These are type-checked and run

`npm run type-check:examples` compiles everything here and in `templates/` against the package's
own source, so an example that imports a removed export fails the build rather than rotting
quietly. It has caught exactly that before.

Compiling is not the same as working, though — an example can type-check perfectly and still
throw on its first line, which is what a reader hits. `npm run examples:run` executes all of
them:

```bash
npm run examples:run
npm run examples:run -- --save ~/tool_export.json   # include the two that need a save
```

That is how `05-generate-a-cost-table.ts` was found reading only the first word of a weapon
name, so `Black Hole` resolved as `Black`.
