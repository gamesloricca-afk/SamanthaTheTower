# TheTowerSDK

Game data, save-file reading and the game's own formulas for **The Tower**, as typed TypeScript —
so you can build calculators, planners, spreadsheets, charts and bots without transcribing a single
number by hand.

```bash
npm install thetowersdk@0.13.0 --save-exact
```

- **Game data** — labs, workshop, modules, cards, perks, relics, guardians, bots, ultimate weapons
  and the vault, with their cost curves and effect values, as typed arrays.
- **Save reading** — turn a player's `tool_export.json` into typed values: what they have researched,
  what they own, what is equipped, their run history.
- **Formulas** — enemy scaling, damage, ultimate weapons, drops and workshop stats, as functions you
  call with a tier, a wave or a level.
- **Charts** — every level progression is already a plot-ready series, so the shipped catalogs cover
  [808 chartable series](#charts) without you authoring one.

TypeScript, MIT licensed, one runtime dependency (`zod`).

### 📖 [Documentation, live demos and runnable examples → thetowersdk website](https://tmrxjd.github.io/TheTowerSDK/)

> **Pre-1.0.** The package is published so it can be installed and exercised, not because the API is
> settled. Exports may be renamed or removed between releases without deprecation. Pin an exact
> version if you depend on it.

---

## Quick Start

### Use The Game Data

```ts
import { LAB_CATALOG } from 'thetowersdk/data'

const costToMax = (lab) => lab.levels.reduce((sum, level) => sum + level.cost, 0)

const priciest = LAB_CATALOG
  .map((lab) => ({ name: lab.name, total: costToMax(lab) }))
  .sort((a, b) => b.total - a.total)[0]
```

Every `cost` is a plain number of coins. There is no scaling factor to apply and no currency field
to read first — a lab that costs 1.1 quadrillion is `1.1e15`, so you can add two labs together
without checking where either came from.

### Read a Save File

```ts
import { readFile } from 'node:fs/promises'
import { decodePlayerInfoSaveBytesAsync } from 'thetowersdk/node'
import { readLabsFromSaveRoot } from 'thetowersdk/save'
const { parsedRoot } = await decodePlayerInfoSaveBytesAsync(await readFile('tool_export.json'))

const labs = readLabsFromSaveRoot(parsedRoot)
if (!labs) throw new Error('This save has no lab research data.')
console.log(`${labs.researchedCount} researched, ${labs.maxedCount} maxed`)
```

Decode once, then extract whatever you need. Only official JSON exports are supported; private save files are rejected.
Private save files and legacy binary files are unsupported.

---

## Entry Points

| Import | Contains | Browser-safe |
|---|---|---|
| `thetowersdk/data` | Game tables — costs, levels, effects, catalogs | Yes |
| `thetowersdk/save` | `read*FromSaveRoot()` readers and save inspection | Yes |
| `thetowersdk/node` | The save decoder | Node — [see below](#getting-an-official-game-export) |
| `thetowersdk/save-decoder` | The same decoder with no Node imports, for the browser | Yes |
| `thetowersdk/formatting` | Number and duration formatting matching the game | Yes |
| `thetowersdk/mechanics` | Game formulas — see [below](#formulas) | Yes |
| `thetowersdk/wiki` | Fandom wikitext → Markdown — see [below](#reading-the-community-wiki) | Yes |
| `thetowersdk/contributions` | Whose work this package carries, as data | Yes |
| `thetowersdk/charts` | Curated chart catalog and its data — see [below](#charts) | Yes |
| `thetowersdk/builders` | Ready-made calculators — see [below](#builders) | Yes |
| `thetowersdk/calculators` | Every exported formula declared by name — what it reads, what it produces, how to call it | Node |
| `thetowersdk/bot` | Command registry, and every calculator as a command — see [below](#building-a-bot-on-this) | Yes |
| `thetowersdk/sheets` | Google Sheets reads and writes — see [below](#google-sheets) | Yes |
| `thetowersdk/knowledge` | The mechanics oracle, and five years of patch notes — see [below](#patch-notes) | Yes |
| `thetowersdk/assets` | Path helpers for artwork **you supply** — see [below](#using-your-own-artwork) | Yes |

`import { … } from 'thetowersdk'` re-exports `data`, `save` and `formatting` together. Prefer the
subpaths in real projects so your bundler can drop what you don't use.

```ts
import { computeWaveBaseHealth, abilityDamage } from 'thetowersdk/mechanics'
import { formatDuration } from 'thetowersdk/formatting'
```

---

## How It Fits Together

```
tool_export.json ──decodePlayerInfoSaveBytesAsync()──► save root (plain object)
                                                     │
                     ┌───────────────────────────────┼──────────────────────────────┐
                     ▼                               ▼                              ▼
           readLabsFromSaveRoot()   readModulesFromSaveRoot()     readVaultFromSaveRoot()
                     │                               │                              │
                     ▼                               ▼                              ▼
               typed lab data                 typed module data             typed vault data
```

The **save root** is a plain JavaScript object. Extractors read from it and never modify it, so you
can run as many as you like over the same root.

---

## Getting an Official Game Export

First tap your **Player ID five times** in The Tower to create your first export and reveal the export controls. Then open **Settings → Toggles → External Tools Export → Manual Export**. Enable **Auto Export for External Tools** to keep the export updated. Import only `tool_export.json`.

On Android and emulators the export is in `Android/data/com.TechTreeGames.TheTower/files/tool_export.json`. Copy it to a folder your browser can access, or use [adb-bridge](https://github.com/TmRxJD/adb-bridge) to pull the official export.

Private saves such as `playerInfo.dat`, encrypted containers and legacy binary save files are unsupported. The SDK accepts no decryption keys and provides no decryption service.

**Attempting to bypass save-file encryption violates The Tower Terms of Service.**

```ts
import { decodeSaveFile } from 'thetowersdk/save-decoder'
const root = await decodeSaveFile(await exportFile.arrayBuffer())
```

Export files contain personal account data. Tell users plainly if your tool uploads them anywhere.

## Reading a Save

| Function | Returns |
|---|---|
| `readLabsFromSaveRoot` | Research levels, what's maxed, the active queue |
| `readWorkshopFromSaveRoot` | Upgrade levels, enhancements, saved presets |
| `readModulesFromSaveRoot` | Owned modules, rarities, substats, equipped |
| `readCardsFromSaveRoot` | Card levels, copies, mastery, equipped slots |
| `readGuardiansFromSaveRoot` | Guardian levels and upgrades |
| `readBotsFromSaveRoot` | Bot levels, Bot+ unlocks, synchronicity slots, medals spent |
| `readUltimateWeaponsFromSaveRoot` | UW levels, unlocks, plus-levels, stones |
| `readVaultFromSaveRoot` | Vault power tree progress |
| `readRelicsFromSaveRoot` | Owned relics |
| `readCollectedThemeNamesFromSaveRoot` | Unlocked themes |
| `readLifetimeFromSaveRoot` | Lifetime totals |
| `readDissonanceCycleWavesFromSaveRoot` | Best wave per tier this dissonance cycle |
| `listImportableBattleRuns` | Run history |

Plus perks, "killed by" and per-run battle report fields — see [`src/save/index.ts`](src/save/index.ts).

### Check Before You Read

Extractors return `null` when a save has no data for that feature, rather than throwing, so older
saves degrade instead of failing:

```ts
const labs = readLabsFromSaveRoot(parsedRoot)
if (!labs) return

if (labs.warnings.length) {
  // Values the extractor could not interpret. Usually means the save shape changed.
  console.warn(labs.warnings)
}
```

### Run History And Battle Reports

Every completed run the game kept is available, with all of its stored fields:

```ts
import { listImportableBattleRuns, buildBattleReportStatFields } from 'thetowersdk/save'

const runs = listImportableBattleRuns(parsedRoot)

// The raw entry — tier, wave, duration, coins, cells, damage dealt and taken,
// per-source damage breakdowns, what killed you, and everything else the game
// recorded for that run.
console.log(Object.keys(runs[0]))

// Or the same run flattened into named stat fields.
const stats = buildBattleReportStatFields(runs[0])
```

`listImportableBattleRuns` hands back the decoded entries themselves, not a filtered view, so you
are not limited to the fields this SDK happens to name. There are also helpers for duration
formatting, date parsing and deduplication — see [`src/save/index.ts`](src/save/index.ts).

### Reading Any Field In a Save

`parsedRoot` is the decoded file as a plain object, so every field the game stores is yours to read
directly. The named extractors are a convenience layer over that same object — reach past them
whenever you want a field they do not name.

Values are loosely typed and arrays arrive in several shapes, so use the readers rather than
hand-parsing:

```ts
import { coerceSaveNumber, readSaveBoolean, readSaveIntList } from 'thetowersdk/save'

coerceSaveNumber(parsedRoot.someKey) // number | null
readSaveBoolean(parsedRoot.someFlag) // boolean
readSaveIntList(parsedRoot.someList) // number[]
```

Worked out a field that isn't covered? A PR adding an extractor is very welcome.

---

## Reading The Community Wiki

The Tower's wiki is on Fandom, which serves **wikitext** rather than anything you can render:
templates, infoboxes, `[[File:…]]` links and vertical wikitables. This converts it to Markdown.

```ts
import { fetchFandomPageAsMarkdown } from 'thetowersdk/wiki'

const markdown = await fetchFandomPageAsMarkdown('Cards')
```

Or the halves separately, if you fetch pages your own way — from a cache, a mirror, or a build step:

```ts
import { convertFandomWikitextToMarkdown, resolveFandomFileImages } from 'thetowersdk/wiki'

const markdown = convertFandomWikitextToMarkdown(wikitext, { pageTitle: 'Cards' })
```

A page that does not exist returns `200 OK` with a `missing` marker rather than a 404, so
`fetchFandomWikitext` throws on it instead of returning an empty page.

**The conversion ships here; the wiki's content does not.** Wiki text is CC-BY-SA and this package
is MIT, so fetch what you need and honor the wiki's license in whatever you ship. It is a
volunteer-run wiki — cache what you fetch, and space out requests when pulling many pages.

## Game 29.1 Data

The catalog includes the four released modules and primary-module labs for game 29.1.

| Module | Slot / save info index | Epic → Legendary → Mythic → Ancestral |
|---|---|---|
| Sentry Protocol | Armor / 50 | 1 → 2 → 3 → 4 mini orbs per shot |
| Tactical Barrage | Core / 52 | 14 → 10 → 6 → 2 seconds between Homing Missiles |
| Infinity Threshold | Generator / 53 | 1,000 → 2,000 → 3,000 → 4,000 extra free-upgrade levels |
| Gilded Sniper | Cannon / 51 | 10% → 20% → 30% → 40% chance on enemy death |

Sentry Protocol stops orb movement and replaces it with mini-orb firing. Its workshop-orb
interval is `1 / (5 * effectiveOrbSpeed)` seconds; Extra Orb card orbs use
`0.5 / (cardSpeed + extraOrbSpeedLabBonus)`. Rarity controls mini-orbs per shot.
Tactical Barrage doubles the lab bonuses to Smart Missile Radius and Amplifier, targets the
highest missile stack, and redirects active Smart Missiles to that target. Gilded Sniper applies
all active coin bonuses on a successful proc even outside their range; catalog values are
probabilities (`0.1`–`0.4`). Infinity Threshold affects free upgrades to Damage, Health and Health Regen.

Four Primary Module Bonus labs occupy save indices 253–256, in Cannon, Armor,
Generator, Core order. Each has 30 levels, unlocks at tier 23, wave 500, and starts at
`1e20` coins and `1,440,000` seconds (400 hours), before modifiers. Each level improves
the primary module's bonus by 1%; the neutral multiplier of 1 and assist bonuses are unaffected.

```ts
import { computeModuleStat, findLabResearchByIndex } from 'thetowersdk/data'
import { applyWorkshopOvercapMultiplier } from 'thetowersdk/mechanics'

findLabResearchByIndex(253)?.displayName // 'Primary Module Bonus - Cannon'
computeModuleStat({ type: 'cannon', rarityLabel: 'Epic +', level: 92, primaryLabLevel: 30 })
// 2.3, from the unresearched multiplier 2.0
applyWorkshopOvercapMultiplier(100, 7000) // approximately 195.52428085
```

For in-run Health and Health Regen above level 6,000, evaluate their base at level 6,000,
then multiply by `Damage(actualLevel) / Damage(6000)`. Damage uses its full curve
and must not receive this multiplier again. Formula inputs beyond a module's cap do
not imply that those levels are reachable.

Card Presets has its five-level ladder. Catalog inclusion does not establish that every
Effective Paths planner models every module effect. Inspect lab-cost coverage explicitly:

```ts
import { labCoinsRemainingDetailed } from 'thetowersdk/mechanics'

const report = labCoinsRemainingDetailed(() => 0, { basis: 'current-catalog' })
report.coins // Includes the four primary-module lab ladders.
report.omittedLabs // Cost exclusions with identity, cost and reason.
report.coverageGaps // Cost inclusion does not imply benefit support.
```

`ep-port-baseline` preserves the dated port population for regression comparison;
it is not an accuracy claim about the current workbook. Golden Tower's optional
`vaultPct` is a fraction (`0.05` means +5%) and scales the whole bonus. The current
sheet scales only the module substat, so base 5, no substat and 5% Vault produce 5
there and approximately 5.25 in the SDK. The disagreement remains explicit.

## Formulas

`thetowersdk/mechanics` is the calculation layer:

- **Enemy scaling** — wave/tier base health and damage, enemy type multipliers, level skip,
  elite spawn chance, wave-info panel values
- **Damage** — thorns, knockback, multishot and bounce shot, rend armor, projectile damage, crowd
  control, damage reduction, shockwave, land mines, tower fire and range
- **Ultimate weapons** — the shared hit and absorb pipeline, plus Chrono Field slow, Poison Swamp
  ticks and stun, and Inner Land Mines including Charge Mines
- **Economy** — coin and enemy drop simulation, interest, ROI scaling, workshop cost tables
- **Workshop stats** — attack, defense and utility stat tables and their build-up
- **Bots and guardians** — bot hit multipliers, effective range and coverage, Wildfire duration,
  medal planning and simulation, Bot Bot overlap, cooldowns
- **Battle conditions** — resistance levels, tournament heat, counter labs

```ts
import { computeWaveBaseHealth, abilityDamage, goldenComboBonus } from 'thetowersdk/mechanics'
```

---

## Builders

Ready-made calculators. Each one pairs the maths in `thetowersdk/mechanics` with the things a tool
needs around it and never gets for free: a complete set of defaults, a description of every input,
normalisation of whatever half-filled state a form is in, and a result that says what it could not
work out.

```ts
import { labResearchCalculator } from 'thetowersdk/builders'

const result = labResearchCalculator.compute({ labName: 'Damage', targetLevel: 10 })
console.log(result.totalCoinCost, result.totalHours)
for (const note of result.notes) console.warn(note)
```

`compute` takes a `Partial` on purpose — a form hands you half-filled state constantly, and a
calculator that throws or returns `NaN` on that pushes the problem back into the UI.

Render a form without knowing which calculator it is:

```ts
for (const field of labResearchCalculator.fields) {
  // field.kind is 'number' | 'select' | 'boolean' | 'number-list'
}
```

| Builder | Answers |
|---|---|
| `labResearchCalculator` | Coins and time to take a lab from one level to another |
| `workshopUpgradeCalculator` | Coins to move a workshop stat between two levels |
| `moduleCostCalculator` | Shards and coins to level a module, capped by its rarity |
| `ultimateWeaponCalculator` | Power Stones for an ultimate weapon stat |
| `uptimeCalculator` | What share of the time an ability is actually running |
| `guardianCalculator` | Bits for a guardian stat |
| `botUpgradeCalculator` | Medals for a bot stat |
| `enemyWaveCalculator` | Health and damage per enemy kind at a tier and wave |
| `damageReductionCalculator` | What reaches the tower after every mitigation layer |
| `assistModuleStonesCalculator` | Stones for an assist efficiency slot |
| `coinsPerKillCalculator` | What one enemy pays, all six bonus sources applied |
| `thornsCalculator` | Damage returned to an enemy on contact |
| `dissonanceCalculator` | The multiplier your tier personal bests apply to a stat |
| `enemyDropsCalculator` | Module drop chances, reroll shards, shatter shards |
| `innerLandMinesCalculator` | Mine damage, count, cooldown, and what charge time is worth |

`CALCULATOR_BUILDERS` is all of them, and `findCalculatorBuilder(id)` looks one up — enough to
build a calculator picker that needs no per-calculator code at all.

They wrap `thetowersdk/mechanics` rather than reimplementing it, so a correction to a formula
reaches every tool without anyone re-deriving it.

### Caps, clamps and level indexing

Every builder handles these the same way, so a number means the same thing whichever one produced it.

| Rule | How |
|---|---|
| **A level is capped by its own catalog** | `clampLevel(value, cap, fallback)`, where `cap` comes from the curve that stat actually uses |
| **An open-ended quantity is bounded so the result stays finite** | `clampMagnitude(value, fallback)`, bounded by `MAX_INPUT_MAGNITUDE` |
| **A level buys against the previous row** | `costIndexForLevel(level)` — buying level L reads entry L−1 |
| **Anything only a formula bounds gets a named constant** | e.g. `MAX_MODEL_WAVE`, where the wave curve stops producing a real number |
| **Clamping is reported** | the result's `notes` say what was clamped and to what |

Caps come from the data rather than a shared constant because the curves genuinely differ: workshop
Attack Speed prices 75 levels, Enemy Level Skip 60, Damage 400. Level indexing follows tower-oracle
`workshop.upgradeTable`: a cost row buys the **next** level, so entry L is what is charged at level L
and buying level L costs entry L−1.

### Lookups by a name you did not choose

Ids, slugs and level indices arrive from saves, from the community sheet, from URLs and from tool
arguments. Lookups keyed by them use own-key access (`ownLookup`) for records and a
bounds-and-integer check (`atIndex`) for arrays, so an unknown key returns `undefined` rather than
whatever sits on `Object.prototype`.

The reason it is a rule rather than a caution: `record['constructor']` is the `Object` function and
`record['toString']` is a function, and neither `??` nor `||` nor a truthiness check will reject one.
The fallback simply never fires, and a function travels on from a signature that promised a string.

Cost ladders are bounded the same way, by the table rather than by the caller: a level past the end
of a curve is excluded rather than priced at zero.

---

## Charts

Charts are built on [the formulas above](#formulas) and the catalogs — which is the whole reason
this section follows that one. You need the numbers before you can plot them.

There is no chart API here, and that is deliberate: **a level progression already is a series.** The
level is your x-axis and each measured field on it is a line, so generating a chart is a `map`, not
an integration. A helper would only wrap `Array.map` while forcing an opinion about rendering on you.

### Why This Beats Keeping Images

The usual way a project ends up with charts is somebody makes a picture. Then the game rebalances,
or a tier gets added, and now there is a PNG showing last patch's numbers with nothing anywhere to
flag it. The image cannot tell you it is stale, so it stays wrong until a player notices.

Generating from the data inverts that. **You never make a new image — you add rows to the array and
every chart drawn from it regenerates.** One new lab level, one rebalanced cost, one extra ultimate
weapon, and every view over that data is correct at once: the cost curve, the comparison chart, the
table, the tooltip. Charts stay consistent with each other because they are not separate artifacts
that happen to agree — they are the same numbers rendered more than one way.

```ts
import { LAB_CATALOG } from 'thetowersdk/data'

const lab = LAB_CATALOG.find((l) => l.name === 'Attack Speed')

const costCurve = lab.levels.map((l) => ({ x: l.level, y: l.cost }))
const timeCurve = lab.levels.map((l) => ({ x: l.level, y: l.duration }))
```

Hand those points to whatever already draws your charts — Chart.js, D3, Vega, a spreadsheet, an SVG
path you build yourself. The same operation across a whole catalog gives you a comparison chart:

```ts
import { uwStoneChartData } from 'thetowersdk/data'

// One series per ultimate weapon: stone cost to reach each cooldown level.
const datasets = Object.values(uwStoneChartData).map((weapon) => {
  const cooldown = weapon.stats.find((s) => s.name === 'Cooldown')
  return {
    label: weapon.name,
    data: cooldown.levels
      .filter((l) => typeof l.cost === 'number')
      .map((l) => ({ x: l.level, y: l.cost })),
  }
})
```

### A Table Is a Chart Too

Most of what players actually want is a table, not a curve — "what does the next level cost, and
what do I get for it". Same data, same `map`, different rendering:

```ts
import { uwStoneChartData } from 'thetowersdk/data'
import { formatNumberForDisplay } from 'thetowersdk/formatting'

const gt = Object.values(uwStoneChartData).find((w) => w.name === 'Golden Tower')
const multiplier = gt.stats.find((s) => s.name === 'Multiplier')

let running = 0
for (const level of multiplier.levels) {
  if (typeof level.cost === 'number') running += level.cost
  console.log(level.level, level.value, level.cost, formatNumberForDisplay(running))
}
```

```
Golden Tower — every stat

  Stat             Levels     To max  Final
  ---------------- ------  ---------  ------------
  Multiplier           21     8.434K  x21.0
  Duration             39    14.052K  53s
  Cooldown             21       4.7K  100s
  Golden Combo         15     20.07K  0.45%
```

That table is emitted, not written. When a stat gains levels or a cost is rebalanced, the table and
every chart over the same array update together — which is the point of
[generating rather than keeping images](#why-this-beats-keeping-images). The same loop emits
Markdown, so documentation tables regenerate instead of rotting.
See [`examples/05-generate-a-cost-table.ts`](examples/05-generate-a-cost-table.ts).

**How much is chartable.** The shipped catalogs support **808 distinct series** — one per measurable
field that varies across a level range:

| Source | Series | What varies |
|---|---|---|
| Labs | 470 | Coin cost and research time, per lab |
| Workshop | 141 | Stat value, cash cost, coin cost |
| Cards | 64 | Level values and mastery values |
| Ultimate weapons | 72 | Stat value and stone cost, per stat |
| Guardians | 36 | Chip stat value and cost |
| Bots | 25 | Per-stat progressions, including plus variants |

That is a floor, not a ceiling. It counts only fields that already vary by level, and excludes
catalogs with nothing to plot — relics carry a single flat value, module substats are cluster
metadata, and vault nodes are identifiers. Anything you derive from [the formulas](#formulas) is
additional.

### The Curated Catalog

`thetowersdk/charts` adds a registry of ready-made chart definitions, for when you want
the same views rather than your own:

```ts
import { SHARED_CHART_REGISTRY, findChartByPathId } from 'thetowersdk/charts'
```

It answers *what charts exist and what is in them* — never how they look. Rendering, styling and
localisation stay with your application. `CHART_MECHANIC_LINKS` maps each chart to the entities in
`thetowersdk/knowledge` it documents, so a mechanic can find its chart and vice versa.

See [`examples/04-generate-a-chart.ts`](examples/04-generate-a-chart.ts).

---

## Effective Paths

[Effective Paths][ep] is the community spreadsheet that works out the cheapest order to buy things
in — which lab, workshop stat or module to put your next coins into for the most effect. Its authors
take the numbers from the developers, which is why the SDK already checks its own tables against it:
see [`fixtures/data/README.md`](fixtures/data/README.md).

The solver is ported. Four models, each with the sheet's own paths:

| Model | Planner | Paths |
|---|---|---|
| eHP | `planEffectiveHealthPath` | `lab-time` · `lab-coins` · `stone` · `coin` |
| eRegen | `planEffectiveRegenPath` | `lab-time` · `lab-coins` |
| eDamage | `planEffectiveDamagePath` | `lab-time` · `lab-coins` · `stone` · `coin` · `keys` |
| eEcon | `planEffectiveEconomyPath` | `time` · `coin` · `stone` |
| eEcon Discount | `planEffectiveEconomyDiscountPath` | its own, ranking coins **saved** |

The lab path appears twice everywhere because the sheet prices the same candidates two ways — in
research days or in coins — and which one binds depends on the player.

```ts
import {
  planEffectiveDamagePath,
  ZERO_EFFECTIVE_DAMAGE_LEVELS,
  zeroEffectiveDamageConfig,
} from 'thetowersdk/mechanics'

const plan = planEffectiveDamagePath({
  config: zeroEffectiveDamageConfig(),   // the account: what is unlocked, owned, equipped
  levels: ZERO_EFFECTIVE_DAMAGE_LEVELS,  // what is bought, per candidate
  variant: 'lab-time',
  steps: 25,
})

plan.steps      // what to buy, in order, with cost, gain and ROI
plan.excluded   // what it did not offer, and why
plan.issues     // why it could not plan at all — empty on every plan that ran
```

### Planning For a Real Player

A plan takes two things, and they are different:

- a **config** — the account around the numbers: which weapons are unlocked, which cards are owned,
  what the modules are, which perks are taken;
- **levels** — how far each candidate is already bought.

**The SDK does not build either from a save.** It supplies the model and the zero records; mapping a
player onto them is yours to write, because where a player's data comes from — a save file, your own
database, a form — is your decision, not this package's.

The candidate lists are what make that mapping short. Each entry carries the `id` a plan reports
back, the `band` and `key` its level lives under, and the `sheetName` the community sheet uses:

```ts
import {
  EFFECTIVE_ECONOMY_UPGRADES,
  ZERO_EFFECTIVE_ECONOMY_LEVELS,
  planEffectiveEconomyPath,
  zeroEffectiveEconomyConfig,
} from 'thetowersdk/mechanics'

// However you got it — a save, a database, a form.
const myLabLevels = { 'Coins / Kill Bonus': 40, 'Golden Tower Bonus': 12 }

// Start from a complete zero record and fill it in. Do not build one by hand:
// a missing key reads as `undefined`, which becomes a NaN the planner refuses.
const levels = structuredClone(ZERO_EFFECTIVE_ECONOMY_LEVELS)
for (const candidate of EFFECTIVE_ECONOMY_UPGRADES) {
  const known = myLabLevels[candidate.sheetName]
  if (known !== undefined) levels[candidate.band][candidate.key] = known
}

const plan = planEffectiveEconomyPath({
  config: zeroEffectiveEconomyConfig(),
  levels,
  variant: 'time',
  steps: 5,
})

plan.steps    // → Coins / Kill Bonus L41, L42, L43 … — it continues from 40
plan.excluded // → Golden Tower Bonus — "the weapon is not unlocked"
```

That exclusion is the config talking, not the levels: a zero config owns no weapons, so the whole
Golden Tower band is out. Fill the config in the same way — start from `zeroEffectiveEconomyConfig()`
and set what you know — and those candidates appear.

Reading a save is a separate step, and the extractors are in
[`thetowersdk/save`](#reading-a-save): `readLabsFromSaveRoot`, `readWorkshopFromSaveRoot`,
`readModulesFromSaveRoot` and the rest give you the numbers to map from.

### An Empty Plan Always Says Why

The four families — damage, eHP, economy and regen — check their levels before planning and refuse
rather than compute against a record they cannot use. When that happens `steps` is empty and
`issues` names the offending key and what was wrong with it: a `NaN`, a missing entry, a level
stored as text.

```ts
if (plan.issues.length > 0) {
  // Not "this player has nothing worth buying" — "these levels are unusable".
  console.error(plan.issues) // [{ path: 'time.coinsKillBonus', message: '…' }]
}
```

A `NaN` level makes every gain `NaN`; every candidate then compares false against every other and
the greedy loop returns an empty path, which is indistinguishable from a fully-upgraded account.
Levels are validated once per plan rather than inside the evaluation loop, which runs many times
over inputs that do not change.

Levels are held to **completeness and finiteness, not magnitude**. Negative and fractional levels
are accepted, because the source model contains them.

### `excluded` is half the answer

Every planner reports the candidates it passed over, each with a reason: `already at its cap of 99`,
`the weapon is not unlocked`, `priced at 0 for level 12, which is not a cost`. **A candidate is
planned, or it is explained — never neither.**

A path that stops after one step usually means every other candidate is at its cap. Read
`excluded` before treating a short path as an error.

Passing a variant a planner does not publish throws, naming the ones it does. Note that `lab` is a
damage *band* while `lab-time` is a *variant*.

### Discount Is a Different Quantity

`planEffectiveEconomyDiscountPath` ranks coins **saved**, not coins earned, so it is not comparable
to the others and has its own entry point. `planEffectiveEconomyPath` refuses `discount` and says so
rather than returning a table of zeroes.

### Checking It Against The Sheet

The port cites the cell behind every rule it implements — `eEcon!E6`, `eDamage Coins!EZ2` — and those
citations are enumerated by a test that checks the tab exists. If you are changing a formula, read
the cell first — and know that the spreadsheet API will mislead you about what is in one: a spilled
range reads as *empty* while `COUNTA` sees a hundred rows of it.

The MCP server's `plan_effective_path` tool runs any of this without a scratch script — see
[`mcp/README.md`](mcp/README.md).

[`docs/EFFECTIVE_PATHS.md`](docs/EFFECTIVE_PATHS.md) is the longer version: how a config differs from
levels, why the damage and economy levels are banded, and what a step guarantees.

[ep]: https://docs.google.com/spreadsheets/d/1YwZtKP6B4WYhRba5T6APJ1YxKNdfnIGQnprgnxmO7zc/edit

---

### Reading a Player's IDS Master

Most Effective Paths users keep an **IDS Master** behind their workbook — one `_IDS` tab that is
nothing but inputs: their labs, workshop, cards, bots, guardians, weapons, modules and vault. It is
the same account data a save carries, in a form a player maintains by hand.

The readers turn that block into typed rows:

```ts
import { readIdsLabs, readIdsWorkshop, readIdsCards } from 'thetowersdk/save'

const labs = readIdsLabs(grid)          // grid: the `_IDS` range as rows of cells
labs.rows                               // [{ name, level, target, max, saveIndex }, …]
labs.unmatchedNames                     // names the catalog does not know
labs.warnings                           // cells that would not read as levels
```

Every reader returns the same shape — `rows`, `unmatchedNames`, `warnings`. Blocks are located by
their heading rather than by column, so a reader works across IDS versions that lay the `_IDS` tab
out differently. A row's `saveIndex` is its position in the matching save array, so rows join to
save data by index rather than by name.

**These give you rows, not a player.** As with the planners above, mapping them onto your own
stores, database or forms is yours to write.

**A level is a plain number or a plain digit string.** Anything else — `"6,000"`, `"1e3"`, `"0x10"`,
a negative, an empty cell — reads as `null`, meaning the cell says nothing about that level. Names
are matched case- and spacing-insensitively, and a name the catalog does not know is reported in
`unmatchedNames` rather than dropped.

## Examples

Runnable, in [`examples/`](examples):

```bash
npx tsx examples/01-browse-game-data.ts                        # the tables, no save needed
npx tsx examples/02-read-a-save-file.ts ~/tool_export.json       # what one player has
npx tsx examples/03-plan-upgrades-from-a-save.ts ~/tool_export.json  # a tool: what to buy next
npx tsx examples/04-generate-a-chart.ts                        # catalogs -> plot-ready series
npx tsx examples/05-generate-a-cost-table.ts "Golden Tower"    # the same data as a cost table
npx tsx examples/06-read-the-community-wiki.ts "Golden Tower"  # wiki page -> Markdown
npx tsx examples/07-format-like-the-game.ts                    # numbers in and out, both ways
npx tsx examples/08-build-a-calculator.ts uw.stones            # a whole calculator, rendered generically
npx tsx examples/09-build-a-bot.ts                             # every calculator as a bot command
npx tsx examples/10-read-a-sheet.ts                            # a sheet read, and the two ways it lies
npx tsx examples/11-build-a-knowledge-base.ts                  # chunks derived from the catalogs
npx tsx examples/12-show-module-and-card-art.ts                # which image belongs to which module
```

The third is the one to read if you are building something: it goes save → extractors → planner,
maps a player onto the model, and reports what it could not map rather than passing a silent zero
into the plan. They are type-checked against the package on every `npm run verify`.

---

## Templates

Starting points to copy into your own project, rather than scripts to read. Each is complete,
type-checked against the package source, and commented where the shape of the SDK is easy to
get wrong.

| File | For | Runtime |
|---|---|---|
| [`save-cli.ts`](templates/save-cli.ts) | A command-line tool that reads a player's save | Node |
| [`browser-widget.ts`](templates/browser-widget.ts) | A UI module with no Node built-ins anywhere | Browser |
| [`calculator.ts`](templates/calculator.ts) | A calculator: typed input, pure compute, separate formatting | Either |
| [`bot-starter.ts`](templates/bot-starter.ts) | A complete bot: every calculator, a hand-written command, a CLI | Node |
| [`sheets-client.ts`](templates/sheets-client.ts) | The googleapis adapter for `thetowersdk/sheets` | Node |

### The three things they encode

**Decode once.** `decodePlayerInfoSaveBytesAsync` is the Node entry point. The save root it
returns is a plain object that extractors read and never mutate, so run as many as you like over
one root.

**Only `thetowersdk/node` needs Node.** `data`, `save`, `formatting`, `mechanics`, `wiki`,
`charts` and `knowledge` are all browser-safe. A widget that never opens a save file
never imports the decoder — that is why `browser-widget.ts` exists as a separate file.

**Say what you could not do.** Extractors return `null` for features a save predates and carry a
`warnings` array; `calculator.ts` returns a `notes` array for the same reason. A planner that
silently returns `0` for an unknown lab is worse than one that says it does not know the lab.

### Two traps these avoid

- **Durations are text, and not all one shape.** Most catalog rows are `"HH:MM:SS"` with hours
  running past 24 (`"500:00:00"`), but some are `"0s"`. Use `parseDurationToHours`; splitting on
  `":"` yourself returns `NaN` on the `"0s"` rows and poisons the whole sum.
- **Format with the game's ladder.** If your tool prints `1.4e21` where the game prints `1.4s`,
  a player cannot check your answer against their screen — and that is the only way they can
  trust it. `formatLargeNumber` and `parseResource` round-trip.

---

## Building a Bot On This

A Tower bot answers the same few hundred questions from data that does not change between releases,
so most of it is already written:

```ts
import { calculatorCommands, createTowerBot } from 'thetowersdk/bot'

const bot = createTowerBot({ commands: calculatorCommands() })
const reply = await bot.run('lab-research', { args: { labName: 'Damage', targetLevel: 10 } })
```

`calculatorCommands()` turns every builder into a command — options, coercion, formatting and
`notes` — because each builder already describes its own inputs. A builder added to the SDK later
appears in your bot with no edit. The registry handles dispatch, argument coercion, memoising and
errors; `bot.run` never throws, so a gateway handler cannot leave someone watching a spinner until
the interaction expires.

Nothing in it knows what a gateway is, so the same commands run under discord.js, on a CLI, and at
full speed in a test.

```bash
npm run bot:demo                                            # list the commands
npm run bot:demo -- lab-research labName=Damage targetLevel=10
npm run bot:test
```

[`templates/bot-starter.ts`](templates/bot-starter.ts) is a complete bot with a hand-written command
and a CLI. [`docs/BUILDING_A_BOT.md`](docs/BUILDING_A_BOT.md) covers performance and the Discord
adapter.

### Rules that came out of running three of them

Three Discord bots are built on this package and run in production. The
rules below came out of getting that wrong first, and almost none of them are Discord-specific —
they apply to Slack, Telegram, Matrix, or anything else built around callbacks with opaque ids.

**Treat the bot as a first-class client, not a bolt-on.** Domain logic — parsing, normalization,
cost math, run shapes — belongs in a shared package that both the bot and your UI import. Only
platform glue (embeds, components, modals, collectors) lives in the bot repo. The failure this
prevents is subtle and expensive: a bot that reimplements a calculation drifts from the website, and
now the same question has two answers depending on where a player asks it. That is the whole reason
this SDK is framework-agnostic.

**One router.** Every interaction dispatches through a single entry point, with persistent handlers
registered against it. Scattered per-feature listeners are how you get two handlers responding to
one click, and the second one erroring because the first already replied.

**Component ids get exactly one owner.** Build *and* parse them in one module, and let handlers
consume parsed values only. A custom id is a wire format — it is serialized, handed to a remote
client, and handed back later, possibly after your process restarted. Once a handler does
`split(':')` inline, the format is defined in as many places as it is read, and adding a field
breaks callers nobody remembered. Registry lookup should use exact or longest-prefix matching for
the same reason, never `slice(prefix.length)` at each call site.

**Interactions are owned.** Wait on a modal by filtering on the component id **and** the initiating
user. Without both, one user's click resolves another user's pending wait — a bug that never appears
in single-user testing and appears constantly in a busy channel.

**Guard tokens before touching session state.** Anything carrying a session token must check it is
present and unexpired first. Callbacks arrive late, arrive twice, and arrive after a redeploy;
treating an expired token as a valid one corrupts state rather than erroring.

**Support every component kind from the start.** Buttons, all select-menu variants, and modals —
even when the current feature only uses one. Retrofitting a router that assumed buttons is worse
than writing it general, and it is a small amount of extra work up front.

**Stay quiet when the interaction is not yours.** An unregistered submission that belongs to a
command-local ownership flow should return silently, not log an error or reply. Otherwise normal
operation fills your logs with noise and hides the real failures.

**Keep the probe scripts.** Diagnostic tooling — "what does this record actually look like in the
database" — belongs in a checked-in `scripts/` directory, not in a throwaway file. You will need it
again, and next time it will be during an incident.

---

## Google Sheets

Community workbooks hold things no save file does. `thetowersdk/sheets` reads and writes them, and
handles the parts that mislead:

```ts
import { TowerSheets } from 'thetowersdk/sheets'

const sheets = new TowerSheets({ transport, spreadsheetId, protectSpreadsheets: [COMMUNITY] })
const grid = await sheets.readGrid('Costs!A1:C50')     // padded to the shape you asked for
const formulas = await sheets.readFormulas('Derived!A1:A200')
if (formulas.likelySpilled) { /* only the anchor carries a formula */ }
```

Two reads look like data and are not. A **spilled** cell has no formula of its own, so a formula
read of an `ARRAYFORMULA` range comes back empty and reads as "plain typed values" — the opposite of
the truth. And the API **truncates** trailing empties, so a blank cell and an absent column arrive as
the same `undefined`. Both are reported rather than smoothed over.

Writes to a spreadsheet you name as protected throw rather than skipping, because a silent refusal
has your tool report success while the sheet never changed.

There is no `googleapis` dependency: the package describes the two calls it needs and you supply
them, which keeps it browser-safe and leaves your auth library your choice.
[`templates/sheets-client.ts`](templates/sheets-client.ts) is the adapter, and
[`docs/GOOGLE_SHEETS.md`](docs/GOOGLE_SHEETS.md) walks through registering a service account and
sharing a sheet with it.

---

## Desktop and Mobile

The SDK is plain TypeScript with one runtime dependency (zod, for schema validation) and no DOM
assumptions, so it runs unchanged
in an Electron renderer, an Electron main process, and a Capacitor WebView. `thetowersdk/node` is the
**only** entry point that needs Node — which is the boundary you want, since the decoder belongs on
the side that is allowed to read files.

Pin the toolchain first, with the hash corepack verifies against:

```json
{ "packageManager": "pnpm@10.8.1+sha512.c50088ba…", "engines": { "node": ">=22 <23" } }
```

[`docs/DESKTOP_AND_MOBILE.md`](docs/DESKTOP_AND_MOBILE.md) covers the main/renderer split, the IPC
boundary, running the bridge in-process, and what does and does not work on mobile.

---

## Optional Add-ons

Two packages sit alongside this one. Neither is a dependency and neither is bundled — install one
when you want what it does, and nothing here changes if you never do.

| Package | What it adds | Install |
|---|---|---|
| [`towerai`](https://www.npmjs.com/package/towerai) | A knowledge base and an answering layer over this SDK's data | `npm install towerai` |
| [`adb-bridge`](https://www.npmjs.com/package/adb-bridge) | Pulls a save off an Android device to a local page | `npx adb-bridge` |

**TowerAI** answers questions; this package supplies the numbers it answers with. Build a knowledge
base by deriving prose from the catalogs rather than typing it, so a game update moves the corpus
instead of silently invalidating it:

```ts
import { buildTrackerAiCanonicalKbChunks, validateCanonicalKbArray } from 'towerai/kb'
import { LAB_CATALOG } from 'thetowersdk/data'

const mine = LAB_CATALOG.map(lab => ({
  chunk_id: `mine_lab_${lab.name}`,
  disambiguation: 'How many levels this lab has — not what order to research it in.',
  content: `The ${lab.name} lab has ${lab.levels?.length ?? 0} levels.`,
  // …
}))

validateCanonicalKbArray([...buildTrackerAiCanonicalKbChunks(), ...mine])
```

**adb-bridge** hands you save bytes over a WebSocket on `127.0.0.1:43781`; this package reads them.
Gate on the bridge's reported **protocol**, never its release number — the package was renamed and
restarted at `0.x`, so a version comparison reports a working bridge as too old.

[`docs/OPTIONAL_ADD_ONS.md`](docs/OPTIONAL_ADD_ONS.md) covers both in full.

---

## Using It With An AI Agent

There's an MCP server in [`mcp/`](mcp/README.md). Point your agent at it and it can read the real
API and the real game data instead of guessing at both.

```bash
claude mcp add thetowersdk -- node ./node_modules/thetowersdk/mcp/server.mjs
```

Any MCP client works — it speaks stdio.

Or by config file:

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

| Tool | Ask it for |
|---|---|
| `list_exports` · `get_export` | What exists, and one table previewed rather than dumped |
| `describe_schema` | A table's declared shape, not one guessed from a sample row |
| `decode_save` · `run_extractor` | What is in a `tool_export.json`, and one reader's output |
| `define_term` | What an acronym means, and whether it is ambiguous |
| `calc_list` · `calc_describe` · `calc_run` · `calc_chart` · `calc_graph` | Every calculator: find it, read its inputs, run it, chart it, see what feeds it |
| `plan_effective_path` | An Effective Path, with the candidates it left out and why |
| `wiki_search` · `wiki_page` | How a mechanic actually behaves, from the community wiki |
| `sdk_sandbox_run` | A scratchpad over what the package ships — list, read an export, run a calculator, format, decode |
| `begin_mechanic_task` · `record_mechanic_note` · `record_work_status` · `compliance_contract` | A mechanics compliance session, with notes and a ledger written to `docs/mechanics-map/` |

The graph, trust and debug tools (`sdk_graph_*`, `trust_*`, `sdk_debug_*` and a few others) run
scripts from the repository this package is developed in. An installed server leaves them out of
`tools/list` rather than advertising tools that cannot run.

### The Tower Oracle

A knowledge graph of game mechanics, shipped with the package as its own MCP module. Nodes are
mechanics, edges are the relationships between them, and every claim carries its source and whether
anything here has verified it. It answers how a mechanic behaves, what it interacts with, and the
specific ways it has been misread before.

| Tool | Ask it for |
|---|---|
| `oracle_traps` | **Call this first.** Every known way this mechanic has been got wrong |
| `oracle_expand` | What an acronym means, from a closed set — `GT+`, `CF`, `DW`, `BH` |
| `oracle_brief` | A short orientation on a mechanic before you model it |
| `oracle_get` · `oracle_search` | One node in full, or find the node by phrasing |
| `oracle_map` | How a mechanic connects to the rest of the game |
| `oracle_footguns` | Cross-cutting mistakes not tied to one mechanic |
| `oracle_coverage` | How well a compartment is actually covered |
| `oracle_contradictions` | Claims that disagree, ranked by source authority |

Three properties shape how you read its answers:

- **`claimType`** marks every claim `objective` or `sentiment`, keeping measured values and community
  opinion distinguishable.
- **`oracle_coverage`** reports how well a compartment is covered, so an empty `oracle_traps` result
  can be read as *unexercised* or as *clean* rather than guessed at.
- **`oracle_contradictions`** surfaces claims that disagree, ranked by source authority
  (`game` › `save` › `code` › `user` › `sheet` › `wiki` › `external-repo`), and returns both values.

`oracle_expand` resolves acronyms from a closed set, so an unknown shorthand returns as unknown.

### Two tools worth knowing

**`plan_effective_path`** runs any family and variant without a scratch script — `{ family:
"economy", variant: "time", steps: 5 }`. It plans from a zero config, so read it for *structure*:
which candidates a variant offers, and why the rest are excluded. Pass a wrong variant and it names
the ones that exist rather than returning an empty result.

**`wiki_page`** is the one to reach for before describing game behavior. This package supplies
values, not semantics — a table says a number changes, not what it means or what it interacts with.
`wiki_search { query }` finds the title, `wiki_page { title, section? }` reads it. Pages are cached
after first read; set `TOWER_WIKI_DIR` to a directory of `slug.md` files to serve them offline, and
every response says whether it came from `local`, `cache` or `fandom`.

Agent instructions live in [AGENTS.md](AGENTS.md), which ships with the package; `CLAUDE.md` and
`.github/copilot-instructions.md` point at the same file.

---

## Using Your Own Artwork

This package ships **no artwork and no index of it**. The art is TechTree Games’, and it is not
this package’s to redistribute.

What ships is the naming rule, so a tool can find a file in a directory of artwork **you supply**.

```ts
import { gameAssetPath, gameAssetPaths, towerAssetUrl, assetSlug } from 'thetowersdk/assets'

gameAssetPath('Amplifying Strike', { domain: 'modules' })
// 'modules/amplifying-strike-md.webp'

gameAssetPaths('Om Chip', { domain: 'modules' })
// { sm: 'modules/om-chip-sm.webp', md: '…-md.webp', lg: '…-lg.webp' }

towerAssetUrl(gameAssetPath('Om Chip', { domain: 'modules' }), '/art')
// '/art/modules/om-chip-md.webp'
```

### Where to put the files

```
<your art root>/
  modules/amplifying-strike-sm.webp
  modules/amplifying-strike-md.webp
  modules/amplifying-strike-lg.webp
  cards/…   relics/…   enemies/…   guardians/…   perks/…
```

One directory per domain, one file per size, named `<slug>-<size>.<ext>`. The slug is the name
lowercased with runs of non-alphanumerics collapsed to a single hyphen — `Om Chip` becomes
`om-chip`, `Damage / Meter` becomes `damage-meter`. `assetSlug()` applies exactly that rule, so
name your files with it rather than reimplementing it: two implementations of one convention is
how a name stops matching its file.

`ASSET_DOMAINS` lists the directory names, `ASSET_SIZES` the sizes. Use whichever subset you have
— nothing requires all three sizes, and `extension` overrides `webp` if your files are `png`.

### It builds paths, it does not check them

These functions never touch the disk, because the disk is yours. A path pointing at a file you do
not have renders as a gap rather than throwing, so verify your own directory once at startup
instead of trusting a returned string. `null` comes back only when a name slugifies to nothing,
which stops `modules/-md.webp` from ever looking like a real path.

---

## Names And Acronyms

The game and the community use a lot of shorthand, and plenty of it collides. `SL` is Stellar Lift
to one player and Spotlight to another; `GC` is Galaxy Compressor or a glass-cannon run. The SDK
ships a glossary of 499 terms so you do not have to guess:

```ts
import { lookupGlossary, expandAcronym, listAmbiguousGlossaryTerms } from 'thetowersdk/data'

expandAcronym('CF')      // 'Chrono Field'
expandAcronym('SL')      // null — it is ambiguous, so there is no single answer

lookupGlossary('CF')[0]  // { term, kind, domain: 'ultimate-weapon', expansion, definition }
lookupGlossary('SL')     // Stellar Lift (module) and Spotlight (ultimate weapon)
listAmbiguousGlossaryTerms()   // 27 terms that resolve to more than one thing
```

Each entry carries a `domain`, which is usually enough to pick the one you meant. Usually, not
always: `SR` returns both Shrink Ray and Solar Reflector and *both* are modules, so for the terms in
`listAmbiguousGlossaryTerms()` you need the `expansion` rather than the domain.

The glossary covers what the game calls things, plus a short list of run concepts. Community
shorthand outside both — critical factor for `CF` — is not in it, so `expandAcronym` gives you the
game's meaning and nothing else.

Names in it are generated from the same catalogs the SDK ships, and every acronym is checked against
those names, so a term cannot appear unless it is real.

## Patch Notes

Five years of the developers' own announcements, queryable. The catalogs say what a number **is**
today; this says **when it became that**, and what was said about it at the time.

```ts
import {
  whenIntroduced,
  searchPatchNotes,
  patchNotesForVersion,
  patchNotesBetween,
  recentPatchNotes,
  PATCH_NOTES_SOURCE,
} from 'thetowersdk/knowledge'

whenIntroduced('shockwave')
// { postedAt: '2021-07-15…', version: '0.1.29', title: 'v0.1.29 is out for everyone now…' }

searchPatchNotes('guardian')          // every note mentioning it, newest first
patchNotesForVersion('26.1.2')        // or 'v26.1.2' — both work
patchNotesBetween('2024-01-01', '2024-12-31')
recentPatchNotes(5)                   // what changed lately

PATCH_NOTES_SOURCE
// { notes: 232, withVersion: 177, earliest: '2021-07-15…', latest: '2026-08-25…', … }
```

Every note carries the message id it came from, so a claim is traceable to the post rather than
to this package.

### What it will not tell you

**The archive begins on 2021-07-15**, the oldest post in the channel. `whenIntroduced` returning
`null` means *not in this archive*, not *this never existed*.

**A note mentioning a mechanic is not evidence the mechanic changed.** `searchPatchNotes` is a
text search over announcements: it finds leads, and the note still has to be read.

**`version` is `null` on 55 of the 232 notes**, because those notes state no version. It is not
inferred from the notes around it — a wrong version attached to a real change reads as fact.

### Keeping it current

```bash
npm run patch-notes:ingest   # read-only, resumable; needs a bot in the server
npm run patch-notes:build    # regenerate the shipped dataset
```

Both refuse rather than write something wrong. The ingest stops if the messages come back empty —
most notes are *forwarded*, and a forward carries its text in `message_snapshots`, not in
`content`. The build stops if more than half the notes land on one day, which is what dating by
the forward instead of the original looks like, and it stops if a version falls outside the range
the game has ever used.

`thetowersdk/knowledge` also carries a `patch-notes` compartment describing those traps, so an
agent asking *when did this change* meets the dating rule before it reaches a date.

---

## Accuracy

Data tables are exact values transcribed from the game. Where a table was taken from a particular
build, its docblock names that version.

The formulas under `mechanics/` are not all exact. Some reproduce the game's own code; others are
fitted to observed in-game behavior and are close but not exact, particularly at very high waves
and tiers. Don't rely on one to match the game to the last digit unless its docblock says it does.

Wave scaling in particular builds on earlier community work — see [Credits](#credits).

## Versioning

Below 1.0 the version is a build marker, not a compatibility promise: any release may rename or
remove an export, and data values may change with the game. Pin an exact version.

From 1.0:

- **Patch** — fixes, new extractors, additive data.
- **Minor** — data updated for a new game version; existing values may change.
- **Major** — breaking API changes.

The entry points listed above are the whole public API; there is no path past them.

## Where the Docs Live

| Surface | What it is | Edit it? |
|---|---|---|
| [thetowersdk website](https://tmrxjd.github.io/TheTowerSDK/) | Browsable docs, live demos, runnable examples | Generated |
| This repo | The source of truth: this README, [`docs/`](docs), [`examples/`](examples), [`templates/`](templates) | **Yes** |
| [GitHub wiki](https://github.com/TmRxJD/TheTowerSDK/wiki) | The same content, page-per-section, for reading on GitHub | **No — generated** |

Three surfaces, one source. Everything downstream is rendered from the files in this repository by
one command, so there is nothing to remember to update:

```bash
npm run docs:seed    # regenerate the wiki pages and the shared code snippets
npm run docs:check   # fail if any of them are stale (runs in `npm run verify`)
```

The wiki is rendered by [`scripts/build-wiki.mjs`](scripts/build-wiki.mjs). A GitHub wiki is a
separate repository that no pull request reviews, so hand-editing it would create a third docs
surface that silently drifts — every page carries a banner saying so, and an edit made there is
overwritten on the next push.

Code samples shared with the website come out of
[`scripts/build-doc-snippets.mjs`](scripts/build-doc-snippets.mjs), which extracts marked regions
from files that `npm run examples:run` **executes**. A hand-copied sample is correct on the day it
is pasted and silently wrong afterwards; an extracted one fails in CI before it can reach a page.

```ts
// >>> snippet: bot-in-one-line
const bot = createTowerBot({ commands: calculatorCommands() })
// <<< snippet
```

The link checker is strict on purpose: a relative link that escapes the package root resolves in the
authoring monorepo but 404s in the published repo, and it has found live ones.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Especially useful: extractors for save fields not yet
covered, data corrections (with a save file or screenshot showing the real value), and examples of
tools you've built.

## Credits

### The Effective Paths team

Every `effectivePaths*` export in this package is a **port, not original work**. The maths is the
Effective Paths team's; this package only translates their
[spreadsheet](https://docs.google.com/spreadsheets/d/1YwZtKP6B4WYhRba5T6APJ1YxKNdfnIGQnprgnxmO7zc)
into TypeScript so other tools can reuse it. A large amount of the reference data here — the cost,
mastery and substat tables especially — was compiled with the help of that work.

- **Mattew** (`matteweon` on Discord) — IDS Master; the Effective Paths spreadsheets for The Tower.
- **QuietFanta** — eEcon Squirrel; the eHP Workshop+ sheet and the Workshop+ additions.
- **Bisse** — maintainer; also contributed the save-format reference this package's decoder is
  checked against.
- **Shiriru**, **Gladiator**, **Meringue** — maintainers and helpers.
- And everyone the sheet lists as a contributor — the full roster ships in code as
  `EFFECTIVE_PATHS_CONTRIBUTORS`, so a tool built on this can render the real list rather than a
  copy that drifts.

> **Support the Effective Paths team.** Enter creator code **`SHEETLORD`** at checkout in the
> [The Tower webstore](https://store.techtreegames.com/thetower/). It costs you nothing extra and
> supports the people who actually derived these formulas. If you ship anything built on the
> `effectivePaths*` exports, please pass this along — `EFFECTIVE_PATHS_ATTRIBUTION_WITH_SUPPORT`
> is a ready-made line for a footer or about box.

```ts
import {
  EFFECTIVE_PATHS_ATTRIBUTION_WITH_SUPPORT,
  EFFECTIVE_PATHS_AUTHORS,
  EFFECTIVE_PATHS_CONTRIBUTORS,
  EFFECTIVE_PATHS_MAINTAINERS,
  EFFECTIVE_PATHS_SUPPORT,
} from 'thetowersdk/mechanics'

console.log(EFFECTIVE_PATHS_ATTRIBUTION_WITH_SUPPORT)
console.log(EFFECTIVE_PATHS_SUPPORT.creatorCode) // 'SHEETLORD'
```

### The wiki contributors

The `thetowersdk/wiki` helpers fetch and reformat pages that other people wrote. Nothing there
produces knowledge of its own. Thank you to the volunteer editors of the
[Fandom — The Tower: Idle Tower Defense Wiki](https://the-tower-idle-tower-defense.fandom.com/wiki/)
and [Game Vault — The Tower Wiki and Guides](https://the-tower-idle-tower-defense.game-vault.net/wiki/).

Individual editors are deliberately not listed in code: wiki authorship changes continuously and is
recorded per page in each wiki's own history, so a snapshot would be wrong within a week and would
silently drop people. `fetchWikiPageFromAnySource()` returns the source `url` so you can link back to the page and
its edit history. `WIKI_ATTRIBUTION` is a ready-made credit line.

### Wave scaling

The wave scaling code builds on
[**tower-idle-toolkit**](https://github.com/tower-idle-toolkit/tower-idle-toolkit) by **skye**,
used under ISC. That project worked out the structure this scaler still uses, and several of its
constants come from there directly. It's no longer maintained, which is part of why this exists —
but the groundwork is theirs. See [NOTICE](NOTICE).

### Author, and supporting the work

Built and maintained by **TmRxJD**, a moderator on the Official Tower Discord, alongside
[the-tower-run-tracker.com](https://the-tower-run-tracker.com/) — which runs on this package and is
where most of it was first proven.

Supporting it costs nothing: enter creator code **`JDEVO`** at checkout in
[The Tower webstore](https://store.techtreegames.com/thetower/). One-off donations are welcome on
[Ko-fi](https://ko-fi.com/F1F41FUGWR) or
[PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=thetowertracker%40gmail.com).

If you only support one thing here, make it the Effective Paths team above — their maths is the
part of this package that took the most work, and none of it is mine.

## License

MIT — see [LICENSE](LICENSE). Build open or closed source, commercial or not.

The one runtime dependency, [zod](https://github.com/colinhacks/zod), is MIT licensed and is
bundled into the WebAssembly build. Its licence text and every other attribution are in
[NOTICE](NOTICE).

Not affiliated with or endorsed by Tech Tree Games. "The Tower" is their trademark; this is a
community project.
