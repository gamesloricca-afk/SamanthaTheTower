# Changelog

## 0.12.1

**Release housekeeping.** Retired obsolete workbook and artwork-index generators, corrected
versioned vault reference notes, and updated contributor documentation. Runtime values and APIs
are unchanged.

## 0.12.0

**Breaking: lab tables use lab slugs.** Workshop table caches are keyed by `LabWorkshopSlug`,
including `labs_speed` and `common_enemy_health`. Resistance inputs are
`globalResistanceReduction` and `conditionResistanceReduction`. Implementation inventories
and formula-coverage labels are no longer exported.

**Released module support.** Sentry Protocol, Gilded Sniper, Tactical Barrage, Infinity Threshold
and all four Primary Module Bonus labs remain available. Reserved research positions stay in
the save catalog so later indices remain stable.

**Documentation.** The site builds against the SDK in this checkout. Copy controls report
permission failures, mobile navigation identifies the current page, and keyboard users can
skip to the main content. Page-specific search metadata, canonical URLs, a sitemap and structured
data improve discoverability; link-preview tags use the SDK logo.

**Synchronicity slots name their bots.** `readBotSynchronicityFromSaveRoot` now returns the
active preset's `slots` â€” the bot in each, or `null` â€” and the `bots` synced there, reading the
save's bot type through the bot catalog's `index` (0 Flame Bot to 4 Bot Bot). `synchronicityBots`
is by slot, not by bot. A slot value that names no bot is reported in `unrecognizedSlotValues`,
and `inSave` says whether the save carries synchronicity at all.

## 0.11.0

**Breaking: one website's plumbing is out of the package.** `thetowersdk/internal/*` is gone,
and so is everything else that described how one site stores and moves data rather than what
the game is: per-calculator local state, persisted settings schemas, the cross-page input hub,
save-import payloads, previews and merge rules, dropdown builders, perk preferences, lab menus,
number-format options and the misplaced-save warning. The facts those modules were built from
stay. The save readers are all still here, and `readPerkChoicesFromSaveRoot` returns
`SavePerkChoices`, exactly what the save holds.

**Breaking: `thetowersdk/data` no longer computes.** `estimateBotUptimeFraction` and the Bot Bot
amplification estimates are in `thetowersdk/mechanics`, as is the utility level-skip chance.
`MODULE_INFO_CATALOG` moved the other way, from the save catalogs into `data`.

**New entry point: `thetowersdk/calculators`.** The calculator registry is its own domain, and
its generated specs no longer reach into `knowledge`.

**Renames.** `TOOL_LAB_OVERVIEW_CATEGORY_ORDER` is `LAB_CATEGORY_NAMES`,
`isToolLabOverviewCategoryLabel` is `isLabCategoryName`, `VaultV29TrackerTarget` is
`VaultV29LevelTarget`, and `GUILD_SEASON_RELIC_TOKEN_COST` â€” a lookup, not a price â€” is
`GUILD_SEASON_RELIC_TOKEN_COST_BY_RARITY`.

**Breaking: deprecated aliases removed.** `BC_COUNTER_LAB_SLUGS`,
`CHAIN_THUNDER_LAB_MAX_FRACTION_PER_LEVEL`, `chainLightningPlusDamageFraction`,
`chainLightningPlusHpDamage`, `computeChainLightningPlusTotalHpDamage`,
`waveInfoEliteDoubleSpawnChancePct` and `HEAT_BC_INDEX_ELS_REDUCTION_NATIVE` each had a
replacement under its real name. `FLEET_ENEMY_LAB_BENEFIT_PER_LEVEL` held a placeholder value, and
`getTournamentEnemyLevelSkipHeatSubtract` returned 0 for every league because the game has no such
subtract.

**Synchronicity is read from the save.** `countBotSyncUnlocksFromSaveRoot` looked for two fields
the game never writes, so it returned 0 for every save and the stones-spent total left
synchronicity out. It now reads `synchronicityUnlocked` and `synchronicityLevel`, and
`readBotsFromSaveRoot` carries a `synchronicity` block. Slots are priced the way the game prices
them: 1500 to unlock, the first two slots free, 1500 for each after.

**`ordinaryCoinWeightAtWave(tier, wave)` is `ordinaryCoinWeightAtTier(tier)`.** The coin mix
depends on the tier alone, and the wave argument was never read.

**Project Funding** is named correctly, no longer counts twice, and is charted under Utility
Dissonance.

**Source layout.** Each folder's exported types live in its `types.ts`; tables transcribed from
the game are named `*.data.ts`; every module opens with a docblock saying what it is for;
unused modules have been removed.

## 0.10.1

**Bot tables pinned to the game's numbers**, including which four stats belong to which bot.
They are not the regular layout the save's twenty slots suggest.

**Bot stats are formulas with typed units** (`{ base, perLevel, maxLevel, unit }`) instead of
thirty-odd display strings each, so no consumer has to strip a suffix to get a number.

**Two card corrections reverted.** Death Ray and Energy Shield are back to the values the card
screen shows. The knowledge compartments now record why the stored benefit table misled.

## 0.10.0

**Breaking: one website's vocabulary is out of the public API.** Names built on "tracker", which
meant the pages of the site this package came from, now describe what they do.
`sharedToolsCatalog`, a route table for that site, is gone from `thetowersdk/data`.

**`data` and `save` are grouped into folders** by the rule `mechanics` already followed.

**Calculators and the MCP server work from an installed copy.** Both previously loaded only in the
monorepo. The generated specs imported tooling that does not ship, and the server required a file
the package excludes.

**Fixes.**

- `D`, `AB`, `AI` and every exact power like them can be printed again; `1e33` had printed as
  `1000N`.
- `contributions` and `save-decoder` resolve as entry points.
- A truncated save is explained rather than surfacing a `TypeError`.
- `DATA_TABLE_SCHEMAS` no longer claims to cover every table when it covered eleven of 138.

**Reproducible builds.** Generated artifacts no longer stamp the wall clock, so two releases of the
same source are byte-identical. Every tree in the package is mapped, and tests take a real save
from `TOWER_TEST_SAVE`.

## 0.9.0

**Community guides are credited by name.** `thetowersdk/contributions` now carries the guides the
knowledge graph draws its contextual claims from â€” minionek, McBlue, Evan, DrAudacious, ColbyJack,
Kitchen Salt, 1410c and NanaSeiYuri â€” each with the exact `ref` the graph cites it by, and a test
that checks the graph still cites it. A guide credited but unused would put someone's name on work
this package never took.

NanaSeiYuri's dissonance sheet is the one that states arithmetic rather than strategy, so the
package is checked against it: the +400% and +200% caps, the 5000-wave maximum, x13.40 and x7.20
with every tier maxed, and the rule that a tier is excluded from its own echo. All six agree.

**Counts corrected.** The site claimed 1,642 graph claims against 1,641, and 315 nodes beside 316.
Both are guarded.

**Docs.** A page on running the package from any language over WebAssembly, the client-side save
decoder written up properly, the Google service-account walkthrough moved to the spreadsheet docs
where it belongs, and a section on what `normalize` does with input nobody checked.

## 0.8.0

**Two new entry points.**

- **`thetowersdk/save-decoder`** â€” the save reader with no Node imports, for decoding
  `playerInfo.dat` in a browser tab. Gunzip comes from `DecompressionStream`; the NRBF reader is
  the same one `thetowersdk/node` uses. A save never has to leave the machine it is on.
- **`thetowersdk/contributions`** â€” the roster of whose work this package carries, as data, so a
  tool can render the credit it is actually using.

**Calculator labels are the game's.** Every builder field is now named the way the Run Tracker and
the community name it: `Enable Chrono Field (CF)`, `CF Reduction (%)`, `Defense Absolute Value`,
`Current Level`. The workshop picker offered `WSP_SUPER_CRIT_MULTI` and now offers `Super Crit
Mult`, read from the enhancement definitions the package already carries.

**Thorns is the calculator players use.** It asked for an enemy factor, a thorn multiplier and a
module benefit â€” parameters of a formula, none of which a player can read anywhere â€” and returned
damage per hit. It now takes base thorns, tier, plasma cannon and its mastery, the BC reduction
labs and Sharp Fortitude, and answers in hits to kill. `thornDamageOnHit` is unchanged in
`thetowersdk/mechanics` for a caller who has the formula's own inputs.

**The MCP scratchpad works outside this repository.** `sdk_sandbox_run` shelled out to a script in
the development monorepo, so for anyone who installed the package it was advertised and failed to
spawn. It is now built from what the package ships â€” `list`, `export`, `calc`, `format`, `decode` â€”
and the tools that genuinely need the monorepo are no longer advertised where they cannot run.

## 0.6.0

**Removed: `thetowersdk/inputs`.** It held the account-state shapes the Run Tracker's own pages
persist â€” hub merge helpers, storage compaction, per-page local-state schemas. That is one
website's plumbing, not a description of The Tower, and it does not belong in a package about the
game.

Nothing is lost. Every calculator already describes the inputs it takes:

```ts
import { CALCULATOR_BUILDERS } from 'thetowersdk/builders'

const calc = CALCULATOR_BUILDERS.find((entry) => entry.id === 'assist.stones')

calc.fields     // [{ key: 'currentLevel', label: 'Current level', kind: 'number', min: 0, max: 69 }, â€¦]
calc.defaults   // { currentLevel: 0, targetLevel: 10 }
calc.normalize  // whatever you have stored -> a complete, valid input record
calc.compute    // the result
```

That is the same guarantee â€” pass what you have, get back a complete record with defaults filled
in â€” for all fifteen calculators, described per calculator rather than as one shared blob.

Twelve entry points now. Everything else is unchanged.

## 0.5.4

Nine new entry points. Nothing was removed or renamed, so this is additive for anything already
on 0.5.2.

> **Skip 0.5.3.** It reached npm before any of this landed, carrying the 0.5.2 export set, and a
> published version cannot be replaced. Everything below ships as 0.5.4.

Enough to build a tool end to end without writing any of the plumbing:

- **`thetowersdk/builders`** â€” the calculators as data. Each one declares its
  fields, their units and their caps, so a UI, a bot command or a test can be
  generated from the same declaration rather than hand-written three times.
- **`thetowersdk/bot`** â€” `createTowerBot()` and `calculatorCommands()`, which
  turn every builder into a slash command. Transport-agnostic: it produces
  commands and replies, and never touches a Discord client.
- **`thetowersdk/sheets`** â€” a Google Sheets reader that knows the two ways a
  sheet lies to you. A spilled cell carries no formula, and the API truncates
  trailing empties, so a short row means "unknown", not "zero".
- **`thetowersdk/inputs`** â€” the shared input vocabulary the builders parse,
  including a decimal separator that follows the reader's locale.
- **`thetowersdk/assets`** â€” which image file is a given module or card. A
  module's file is named after its INITIALS and rarity (`Om Chip` at Epic is
  `epic_oc.png`), which is not guessable from its name. Every function returns
  `null` for something with no art, so a caller can tell that apart from a
  wrong path. The artwork itself is NOT in this package: it belongs to
  TechTree Games and ships separately.

Conventions that now hold across every calculator, because each was a real bug
first: a level past the end of a cost table is refused rather than priced at
zero, caps come from each curve rather than a shared constant, and any lookup
keyed by a name from a save, a sheet or a URL uses own-key access â€” `??` cannot
reject an inherited function.

And the game data that used to live in the consuming application.

- **`thetowersdk/charts`** â€” the shared chart registry, its data, and the links
  from each chart to the mechanics it documents. A chart is a view over game
  data, so its definition is game data.
- **`thetowersdk/knowledge`** â€” the Tower Oracle graph: mechanics, how they
  relate, and the specific ways each has been misread.

Moved into `thetowersdk/data` from `@tmrxjd/platform`, which now re-exports them
so existing consumers keep working:

- Relic unlock methods and the published bonus-total categories.
- Theme category definitions, the passive coin-bonus coefficients, and the full
  theme catalog. The formula string and the 169 per-item bonus literals are gone
  â€” both are derived from one rate per category now.
- Vault tree summaries, derived from the node lists rather than transcribed.
- Daily mission tier and weekly reward tables, with weekly totals derived from
  the rows they sum.
- The module pull simulator: pity counters, rarity rates, pool sizes, RNG walk.

`@tmrxjd/platform` depends on this version for `thetowersdk/charts` and
`thetowersdk/knowledge`; neither existed in 0.5.2.

## 0.5.2

Keep `node:fs` modules (repo-root, planner codegen, debug-graph session/trace, coverage
citations, graph tooling, builders) off the public `thetowersdk/mechanics` barrel so
browser bundlers do not crash when importing wave/EP formulas.

## 0.5.1

Stop shipping the monorepo docs-gen/doctor/kernel chain through `builders` so the
published package no longer requires `@tmrxjd/governance-engine` at install time.

## 0.5.0

Labs catalog refresh, card gem costs, Effective Paths economy stone mastery / UW cooldown helpers,
and the public graph surfaces (`ep-graph`, `sdk-graph`, `save-graph`, `debug-graph`, coverage,
planner-engine, mcp-contract).

Doctor / kernel / governance-adapter / registry / sandbox / docs-gen / lsp stay in the monorepo
source tree for AGS tooling but are **not** part of the published `thetowersdk/mechanics` barrel â€”
they need `@tmrxjd/governance-engine`, which is not a public npm dependency of this package.

## 0.4.1

`sharedToolsCatalog` gains an Effective Paths entry, so a consumer building links or a menu from the
catalog gets the tool rather than a gap.

README: a worked example of planning for a real player â€” what a config is versus levels, how to fill
a zero record from the candidate lists, and the fact that mapping a save onto them is the caller's
job rather than something this package does. The MCP section now lists the tools and says which two
change how an agent works: `plan_effective_path` and `wiki_page`.

## 0.4.0

### New entry point: `thetowersdk/wiki`

Converts the community wiki's Fandom wikitext to Markdown, and fetches a page:

```ts
import { fetchFandomPageAsMarkdown } from 'thetowersdk/wiki'

const markdown = await fetchFandomPageAsMarkdown('Cards')
```

Wiki text is CC-BY-SA and this package is MIT, so pages are fetched rather than bundled.

The MCP server gains `wiki_search` and `wiki_page`, so an agent can confirm how a mechanic behaves
instead of inferring it from a table. Set `TOWER_WIKI_DIR` to a directory of `slug.md` pages to serve
them offline; every response reports whether it came from `local`, `cache` or `fandom`.

### Every plan family validates its levels

`planEffectiveHealthPath`, `planEffectiveEconomyPath` and `planEffectiveRegenPath` now carry
`issues` alongside `steps` and `excluded`, as `planEffectiveDamagePath` already did. Each checks its
levels before planning and returns an empty path with a populated `issues` rather than computing
against a record it cannot use.

**This is additive for callers reading a plan, and a new field for anyone constructing one.** If you
destructure a plan result, `issues` is `EffectiveLevelsIssue[]` â€” `{ path, message }`.

Levels are held to completeness and finiteness, not magnitude. Negative and fractional levels are
accepted deliberately: the source sheet carries a negative stone level of its own.

### The planner refuses a baseline it cannot compute

`planPath` checked each candidate's value for finiteness but not the value it ranked them against.
With a non-finite baseline every ROI was `NaN`, `NaN > NaN` is false, and the first candidate
examined won every step â€” a path in declaration order presented as a recommendation. Those
candidates are now skipped as `unevaluable` and reported.

### Renames

- `mechanics/coverage.ts` â†’ `mechanics/formula-coverage.ts`. Same exports, unchanged. The deploy
  build of a consuming app rejects any file named `coverage.ts` as a test artefact.
- `EffectiveRegenLevels` and `ZERO_EFFECTIVE_REGEN_LEVELS` now live in
  `mechanics/effective-paths-regen-levels.ts`, matching where the damage and economy models keep
  theirs. Both are still re-exported from the planner, so no import needs to change.

## 0.3.1

58 label builders became formatters: `buildWorkshopStatFieldLabel` is now
`formatWorkshopStatFieldLabel`, and so on for every `build*Label` that takes one
argument and returns a string. Turning one value into words for a human to read
is formatting, not assembly.

Scoped deliberately. 64 exported `build*` take one argument and return a string,
but six of them build keys -- `buildTrackerRunFingerprint`,
`buildBattleRunDeduplicationKey` -- and a key is assembled, not formatted. Those
kept `build`.

## 0.3.0

Breaking. Every lab table moved, and 562 exported functions were renamed. If you
are on 0.2.0 the compiler will point at each one; the rules below say what to
rename them to.

### The lab catalog is one thing now

`generatedLabs` and `labs` are gone. `LAB_CATALOG` replaces both.

```ts
// before
import { generatedLabs, labs } from 'thetowersdk/data'
// after
import { LAB_CATALOG } from 'thetowersdk/data'
```

They were two files split by category with no overlap â€” 150 labs in one, 75 in
the other â€” and, worse, two units. `labs` stored cost pre-scaled with a
`currency` of B/T/q/Q, so `cost: 1.1` meant 1.1 quadrillion, while
`generatedLabs` stored coins. Nothing in the shape said which you had.

**`cost` is now absolute coins everywhere, and `currency` no longer exists.** A
lab that costs 1.1 quadrillion reads `1.1e15`, so two labs can be added together
without checking where either came from. If you were multiplying by a currency
factor, delete that. If you were formatting with the suffix, `formatCompact`
already renders `1.1q` on its own.

`value` moved from the level to the lab. It was identical on every level and
only the first was ever read. `unit` moved with it.

Six labs gained cost data they never had (the three enemy Health labs and Wave
Skip Mastery among them), and `super_tower_bonus` had 25 corrupt levels
corrected against the community Effective Paths tables.

### Verbs

One verb per idea. The retired ones and what they became:

| Was | Now | Why |
|---|---|---|
| `resolve*` | `get*`, `find*`, `compute*` | meant three different things |
| `derive*`, `extract*` | `read*`, `compute*` | reading a save vs calculating |
| `calculate*` | `compute*` | same thing, two words |
| `create*` | `build*` | same thing, two words |

`find*` returns `T \| null \| undefined`; `get*` always returns a value; `read*`
pulls structure out of a save or file; `compute*` calculates. The split was made
from return types read out of the compiler, not from guessing at names â€” 124 of
the 265 `resolve*` functions turned out to be doing arithmetic.

34 names also lost a redundant `From<Source>` tail, but only where no sibling
function differed by source: `readDissonanceCalculatorStateFromSaveRoot` is now
`readDissonanceCalculatorState`, while `readLabsFromSave` keeps its tail because
`readLabsFromReport` exists beside it.

The rules are in [`docs/NAMING.md`](docs/NAMING.md).

### Glossary

The 297 hand-curated community acronyms â€” what players actually type, `dmg+`,
`zerk`, `aspd+` â€” are merged in. The glossary goes from 233 entries to 500 and
covers all 297, asserted by a test.

Entries now carry `source`. `catalog` means the expansion names something in the
shipped data and is held to it; `community` means real player shorthand the
catalogs have no row for. An expansion that resolves to nothing and is not
marked `community` fails the build, so nothing can quietly become a claim about
the game.

`GC` now returns two entries â€” Galaxy Compressor from the module table and glass
cannon from the community â€” flagged ambiguous rather than the SDK picking one.

### Also

- `computeModuleStat` (was `calculateModuleStat`) is unchanged in behaviour;
  module stats were checked against the Effective Paths tables and all 60
  level-1 values agree.
- A guardian cooldown max level and a Death Wave stone cost were corrected.

## 0.2.0

Lab catalog consolidation, first cut. Superseded by 0.3.0 â€” prefer that.

## 0.1.1

Initial public release.
