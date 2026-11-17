# Effective Paths

A port of the community [Effective Paths][ep] spreadsheet: given where a player is now, what should
they buy next, and in what order.

The README has the quick version. This is the shape of the thing — enough to build a config, read a
plan, or change a formula without guessing.

[ep]: https://docs.google.com/spreadsheets/d/1YwZtKP6B4WYhRba5T6APJ1YxKNdfnIGQnprgnxmO7zc/edit

## Current formula inputs (0.14)

The current ingestion is v5.11.08.10. Historical captures retain their original versions.
The damage config now requires `framesPerSecond`, `lightSpeedShots`, and `amplifyBot`;
start with `zeroEffectiveDamageConfig()` and replace them with the player's actual inputs.
Light Speed Shots is the tracked lab unlock. FPS is a player estimate (the sheet starts at 120).
Amplify Bot uses its tracked range/duration/cooldown/bonus, Bot+ progress and actual
synchronicity assignments. Missing ownership never implies a bot effect.

Primary-module research is buyable progress: Armor uses `levels.primaryModuleBonusArmor`,
Generator uses `levels.time.primaryModuleBonusGenerator`, and Cannon/Core use
`levels.lab.primaryModuleBonusCannon/Core`. Module config snapshots hold the raw bonus;
the model applies the tracked research once. Do not pre-apply it to `primaryBonus`.

`rapidFireMultiplier` now accepts one object with `chance`, `duration`, raw `attackSpeed`,
`framesPerSecond`, `displayedGameSpeed`, and `lightSpeedShots`. The old third argument was
bullets/second and cannot be reused as raw attack speed. `chainLightningDps` now requires
`framesPerSecond` and `lightSpeedShots`; the old 120-frame calculation corresponds to
`framesPerSecond: 120, lightSpeedShots: true`.

---

## The idea

Every upgrade in the game costs something and is worth something. "Worth" is the hard half: Attack
Speed pays through bullets per second, through Rapid Fire, *and* through Chain Lightning's proc rate,
so scoring it against its own stat ranks it wrong.

So each model computes one number for a whole account — effective HP, effective damage, effective
coins per kill — and a candidate is scored by what a level does to **that**, divided by what it
costs. Take the best, apply it, repeat. That is the sheet's own method, spread across a 146-row grid.

Greedy is not optimal, and the sheet is not claiming otherwise. An upgrade that unlocks a large gain
three levels later can be passed over. Treat a path as a recommendation.

## Four models, ten paths

| Model | Computes | Planner |
|---|---|---|
| eHP | `computeEffectiveHealth` | `planEffectiveHealthPath` |
| eRegen | `computeEffectiveRegen` | `planEffectiveRegenPath` |
| eDamage | `computeEffectiveDamage` | `planEffectiveDamagePath` |
| eEcon | `computeEffectiveEconomy` | `planEffectiveEconomyPath` |
| eEcon Discount | — | `planEffectiveEconomyDiscountPath` |

A **variant** is what "cost" means, and it decides which upgrades are even eligible — the sheet
publishes these as separate tabs:

| Planner | Variants |
|---|---|
| eHP | `lab-time` · `lab-coins` · `stone` · `coin` |
| eRegen | `lab-time` · `lab-coins` |
| eDamage | `lab-time` · `lab-coins` · `stone` · `coin` · `keys` |
| eEcon | `time` · `coin` · `stone` |

The lab path appears twice everywhere because the same candidates are priced two ways — research days
or coins — and which one binds depends on the player.

The exported lists are `HEALTH_PATH_VARIANTS`, `REGEN_PATH_VARIANTS`, `DAMAGE_PLAN_VARIANTS`,
`ECONOMY_PLAN_VARIANTS`. Passing something not in them **throws**, naming the ones that are. `lab` is
a damage *band* and `lab-time` is a *variant*: passing the band once matched no band's variant list,
skipped every candidate, and returned an empty path indistinguishable from a finished account.

## Config and levels

Two inputs, and they are different things:

- **`config`** — everything that is not a path candidate. Workshop values, cards, modules, relics,
  the vault, perks, and the handful of things only a player can answer (how many enemies attack at
  once, what share of damage Chain Lightning does).
- **`levels`** — the current level of every candidate the path may buy.

Start from a zero and spread your data over it:

```ts
import {
  zeroEffectiveHealthConfig,
  ZERO_EFFECTIVE_HEALTH_LEVELS,
} from 'thetowersdk/mechanics'

const config = { ...zeroEffectiveHealthConfig(), health: { workshopValue: 1_200_000 } }
const levels = { ...ZERO_EFFECTIVE_HEALTH_LEVELS, health: 59 }
```

The zeros exist so a field you have no data for is a **documented zero** rather than an `undefined`
that reaches the model and comes back `NaN`. There is one per model:
`zeroEffectiveHealthConfig`, `zeroEffectiveRegenConfigSource`, `zeroEffectiveDamageConfig`,
`zeroEffectiveEconomyConfig`, and `ZERO_EFFECTIVE_*_LEVELS` for the levels.

They are a **floor, not a player**: eHP from a zero config is the tower with no labs, no cards, no
modules and no wall.

### Levels are banded on the damage and economy models

`EffectiveDamageLevels` is four records — `lab`, `stone`, `coin`, `keys` — because the sheet gives
each tab its own grid. Fourteen keys appear in both `lab` and `coin`, and there they are **one level
at two prices**: the compute reads `lab.X + coin.X`, so `coin` is an increment and not a level.
Filling both from the same source doubles every one of those terms.

## Reading a plan

```ts
plan.steps      // ordered purchases: name, level, cost, gain, roi, value, cumulativeCost
plan.excluded   // candidates not offered, each with a reason
plan.issues     // why nothing could be planned; empty on every plan that ran
```

**`issues` is the other half.** All four families validate their levels before planning and return
early rather than compute against a record they cannot use — `{ path, message }` per offending key.
An empty `steps` with a populated `issues` means "these levels are unusable", not "this account is
finished", and those two look identical otherwise.

The regen planner runs *both* the regen and eHP checks, because it is handed the regen levels merged
into the eHP ones and reads from both.

Levels are held to completeness and finiteness, not magnitude — negative and fractional levels pass,
because the source model contains them.

**`excluded` is half the answer.** Reasons look like `already at its cap of 99`, `the weapon is not
unlocked`, `priced at 0 for level 12, which is not a cost`. The rule the planners keep:

> A candidate is planned, or it is explained. Never neither.

A path that stops after one step almost always means everything else is at its cap, and without the
exclusions that is indistinguishable from a bug — it was misread as one here, for a whole round of
investigation.

Compare the two lists **by `id`**, not by `sheetName`. Names are not unique: `assistSubstatArmorLab`
and `assistSubstatArmor` are both `Assist Module Substats - Armor`, the lab and the stone-bought slot
upgrade, and on the stone path one is planned while the other is excluded.

### What a step guarantees

Checked for all ten paths in `effective-paths-invariants.test.ts`:

- one level at a time, in order, per upgrade — never a gap
- every step priced above zero, and finite
- `cumulativeCost` is the exact running sum
- `roi` equals `gain / cost`
- `value` never decreases
- the same call twice gives the same answer
- asking for more steps **extends** the plan rather than rewriting it

## The sheet is the authority

Every rule follows the spreadsheet and cites the cell it came from —
`eEcon!E6`, `eDamage Coins!EZ2` — and `effective-paths-cell-references.test.ts` enumerates those
citations, checks the tab exists, and pins how many there are. When it fails because you added one,
read the cell before updating the count.

Some things are the sheet's own literals and are kept even where a rounder number would look better.
Farm time is `coins / (CpH * 23)`; the 23 is not hours in a day.

Two rules apply when testing against the source:

- **Do not restate the implementation.** A test that recomputes `cost / (rate * 23)` to check
  `cost / (rate * 23)` passes whatever the constant is. Assert against a value read from the source.
- **Pin several states, not one.** A constant matches a formula at exactly one input, so a single
  fixture cannot distinguish the two.

## Trying it without writing a script

The MCP server's `plan_effective_path` runs any family and variant and returns the steps and the
exclusions. See [`../mcp/README.md`](../mcp/README.md).

## Credit

The formulas and the candidate lists are the Effective Paths team's work. This package is a port,
not original research.

- **Mattew** (`matteweon` on Discord) — IDS Master; the Effective Paths spreadsheets.
- **QuietFanta** — eEcon Squirrel; the eHP Workshop+ sheet and the Workshop+ additions.
- **Bisse** — maintainer; also contributed the save-format reference the decoder is checked against.
- **Shiriru**, **Gladiator**, **Meringue** — maintainers and helpers, plus everyone the sheet lists
  as a contributor.

`EFFECTIVE_PATHS_AUTHORS`, `EFFECTIVE_PATHS_MAINTAINERS` and `EFFECTIVE_PATHS_CONTRIBUTORS` carry the
full roster in code, so render those rather than copying names into your own UI — a copy drifts as
the sheet's Home Page changes.

### Support the team

Enter creator code **`SHEETLORD`** at checkout in the
[The Tower webstore](https://store.techtreegames.com/thetower/). It costs the buyer nothing extra and
supports the people who derived these formulas.

If you ship anything built on the `effectivePaths*` exports, please carry that ask through:

```ts
import { EFFECTIVE_PATHS_ATTRIBUTION_WITH_SUPPORT } from 'thetowersdk/mechanics'
// "Effective Paths formulas by Mattew, QuietFanta, Bisse and the Effective Paths maintainers.
//  Ported from the community spreadsheet (v5.11.08.10). Support the Effective Paths team with
//  creator code SHEETLORD in The Tower webstore."
```

`EFFECTIVE_PATHS_ATTRIBUTION` is the same line without the ask, for places with room for only one
sentence. `EFFECTIVE_PATHS_SUPPORT` gives you `{ creatorCode, storeUrl }` if you want to build the
link yourself.

### Game 29.1 account inputs

Pass the researched `primaryLabLevel` (0–30) on `config.armor`, each damage
`config.modules` entry, or `config.generator`. The models retain it when they
recompute primary bonuses at candidate module levels. Assist bonuses are unaffected.
This includes the currently researched benefit; it does not add primary-module
research candidates to the planner.

`inRunWorkshopStatValue(stat, level)` accepts actual in-run Damage, Health, or
Health Regen levels through 10000. Health and Regen use the capped base and one
overcap multiplier; Damage uses its full curve. Keep these inputs separate from
purchased workshop levels and coin costs. Equipping Infinity Threshold alone does
not determine free-upgrade progress.

Use `labCoinsRemainingDetailed(levelOf, { basis: 'current-catalog' })` for current
research costs and preserve its omission/coverage report. The EP baseline is a
dated regression population. Golden Tower's `vaultPct` is a fraction; the website
currently asks for it manually because a verified Vault node mapping is unavailable.
