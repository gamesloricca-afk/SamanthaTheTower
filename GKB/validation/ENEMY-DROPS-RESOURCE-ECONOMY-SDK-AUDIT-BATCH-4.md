# Enemy Drops and Resource Economy — SDK Source Audit, Batch 4

- **Project:** Samantha GKB
- **Implementation branch:** `GKB`
- **SDK source mirror:** `TestAccount`
- **SDK:** `thetowersdk@0.14.1`
- **Audit date:** 2026-11-27
- **Status:** SOURCE REVIEW COMPLETE FOR THIS BATCH; RUNTIME NOT EXECUTED
- **Canonical GKB import:** NOT PERFORMED

## 1. Scope and classification

Reviewed the SDK's enemy-drop simulation, wave context, drop tables, Fetch EV, per-wave resource economy, coin simulation and Wave Skip EV.

All source descriptions below are `OBJECTIVE` statements about SDK implementation. Their game-mechanic verification status remains `EXTERNAL-UNVERIFIED`. SDK tests were inspected but not run. Community-derived values, chart assumptions and save-derived calibrations are identified separately; none are promoted to verified universal mechanics.

## 2. Source files and provenance

### SDK implementation files

| File | Blob SHA | Focus |
|---|---|---|
| `src/mechanics/enemies/drops-simulation.ts` | `84f8548da5dc8d73a6f7432006620b137edfcaa7` | Fetch expected procs, boss interval, ROI helper |
| `src/mechanics/enemies/drops-wave-context.ts` | `4354600a1602a7d9215a6955b93df6778ecf16d6` | Tier/wave, card/mastery and Wave Skip context |
| `src/mechanics/enemies/drops-game-data.ts` | `8425bcb6ede1b9b4c426ef0f06967eb37e8fd9fe` | Module drop, reroll, shatter, Fetch and fleet data |
| `src/mechanics/enemies/drops-shared.ts` | `bde76d5523c3a263fc936d33d6b2550264aa8c8c` | Card/tier clamps and boss interval bridge |
| `src/mechanics/enemies/types.ts` | `f169bf8dc387cca52bfeaf53bde96e32bcfc193d` | Drop simulation input/output shapes |
| `src/mechanics/resource-drops/coin-simulation.ts` | `1357a0bd32f17854637a549b065dee755d91f5b0` | Coin totals and measured spawn/coin calibrations |
| `src/mechanics/resource-drops/simulate-wave-econ.ts` | `323ef52b8648110134863918fe60b43af07cc031` | Per-wave expected kills, coins, cells and shards |
| `src/mechanics/resource-drops/wave-drop-yield.ts` | `f4e02ddff6d65f00bfe1eb1c5088c2784d111a1f` | Per-wave elite, boss and fleet yields |
| `src/mechanics/resource-drops/wave-skip-per-wave.ts` | `75fc123edeb18271af33a0f12b471ea226384015` | Wave Skip spawn fraction and skipped-income EV |
| `src/mechanics/resource-drops/coin-fetch.ts` | `80a572f58addbb03651df755bdb1424adca962e7` | Fetch coin CPM approximation |
| `src/mechanics/resource-drops/types.ts` | `f516cf8f219e5eac6a1f7aaaf329570987b2bc12` | Input/output and per-wave result types |
| `src/mechanics/resource-drops/card-rewards.ts` | `de914a5fbba2f19070bf16dcbed3b7c41cbe902f` | Critical Coin and Cells card reward expressions |

### SDK tests inspected (not executed)

| Test | Blob SHA |
|---|---|
| `tests/mechanics/enemy-drops-game-data.test.ts` | `ff7491f0d41f04ca804359f0b79979e5bba723b2` |
| `tests/mechanics/resource-drops-coin-simulation.test.ts` | `f918d61516ee9d3210a4c40089667c89835ea153` |
| `tests/mechanics/simulate-wave-coins.test.ts` | `3dec91c8e285d69bdd2e0524df53c9ddcfa63483` |
| `tests/mechanics/simulate-wave-econ.test.ts` | `af8e170c8740e4805740e6a32ed900df48643b2a` |
| `tests/mechanics/wave-skip-per-wave.test.ts` | `74a0c4a8b3a31bb0c46d147084e836fe881b1965` |
| `tests/mechanics/elite-spawn-chance.test.ts` | `753446503fe55df9e5d26ceaa4914319cc1edc4` |
| `tests/mechanics/accumulate-wave-econ.test.ts` | `9da891bd94f72e6cb0f154ceaa4914319cc1edc4` |
| `tests/mechanics/resource-drops-coin-generator-modules.test.ts` | `c049fe1696f6166f2fff30a80c2c761bfa880fe7` |
| `tests/mechanics/resource-drops-coin-module-cpk.test.ts` | `402b240873dfa2ffede702fa7abb76893cdb5933` |

## 3. Drop simulation input and output

The SDK `EnemyDropsSimulationInput` is not just a tier and wave. It accepts:
- Tier and target wave.
- Enemy Balance and Wave Skip card levels/mastery and active flags.
- Common/Rare Drop Chance, Reroll Shards, Shatter Shards and Death Wave Cells Bonus lab levels.
- Cells Per Kill Bonus level.
- Common/Rare module shatter toggles.
- Fetch cooldown, find chance and double-find upgrade levels, plus active flag.
- Waves per Boss and average wave duration.

The Fetch output is an expected-value breakdown: expected procs, gems, medals, reroll shards, module shards by type, and common/rare modules. The wave economy output separately tracks expected kills, elite kills, raw kill coins, wave coins, cells, skipped-wave cells, module shards, reroll shards and boss/fleet wave counts.

These outputs are expected values, not a promise of integer drops in one actual run.

## 4. Enemy drop tables and formulas

### Module drop chance

SDK constants and helpers:

```text
Common module chance = clamp(labBenefit × 0.01 + 0.02, 0, 1)
Rare module chance   = clamp(labBenefit × 0.01 + 0.005, 0, 1)
```

The SDK tests check the base chances at zero lab and the additive lab term. The input is a resolved lab benefit, not the raw research level.

### Boss reroll shards

- Boss proc chance constant: 15%.
- Tier base table (tiers 2–24): 2, 3, 4, 6, 8, 12, 18, 25, 32, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105.
- Tier 1 fallback: 1.
- Lab benefit is rounded to an integer and added to the tier base.
- Expected boss reroll shards per kill = (tier base + rounded lab benefit) × 0.15.

Example in SDK test: Tier 10 base 32; lab benefit 2.4 rounds to 2; result 34 shards per successful proc; expected yield is 34 × 15%.

### Shatter shards

The helper is:

```text
floor(max(0, shatterLabBenefit) / 100 × rarityScale) + rarityConstant
```

| Rarity branch | Scale | Constant |
|---|---:|---:|
| Common | 5 | 5 |
| Rare | 30 | 30 |
| Rare Plus | 10 | 10 |
| Epic | 90 | 90 |

The test examples include Common at benefit 20 → 6 shards, Rare at benefit 100 → 60 shards.

### Fleet rewards

SDK source constants:
- 80% branch for reroll shards.
- 20% branch for module shards.
- Each of the four module types independently has a 5% proc chance.
- The fleet reward row is tier-specific.

SDK test example: Tier 20 reward row is rerollShards 1950 and moduleShardsPerType 11. This is an SDK table value; it is not a live-game verification.

## 5. Wave context and Wave Skip

The context builder clamps:
- Campaign tier to SDK maximum tier.
- Target wave to 1–1,000,000.
- Card levels to 1–7.
- Mastery levels to 0–9.

When a card is explicitly inactive, the corresponding card/mastery contribution is neutralized. If the active flag is omitted, legacy behavior preserves the equipped-card calculation. This distinction matters when constructing input from account saves.

### Expected skips and resource multiplier

SDK constants:
- Wave Skip resource bonus multiplier: 1.10.
- Expected skips per proc with no mastery: 1.235.
- Expected skips per proc at mastery 9: 2.85.
- Intermediate mastery values are linearly interpolated by the helper.

The context helper computes:

```text
waveSkipResourceMult = 1 + skipChance × expectedSkipsPerProc × 1.10
```

This is a resource multiplier helper. It is not identical to the per-wave skipped-income recurrence.

### Per-wave EV path

The separate per-wave module computes:

```text
spawnFraction = 1 / (1 + skipChance × (expectedSkipsPerProc − 1))
```

when skip chance and extra skips are positive; otherwise it returns 1.

Skipped income is based on:
- Previous wave's total payout.
- Previous played wave's base payout as the multi-skip chain anchor.
- 1.10 skipped-wave income multiplier.
- A burst correction for multi-skip chains.

The SDK comments attribute sequential compounding and multi-skip correction to wiki/community descriptions. Preserve this source attribution; it is not an official developer specification.

The full per-wave economy simulator applies the spawn fraction to expected kills, elite kills, and played-wave resources, then calculates skipped-cell income from previous-wave values. Boss/fleet reward handling has additional branches and must not be replaced by a single blanket multiplier.

## 6. Elite cells, boss and fleet per-wave yield

The per-wave helper `computeWaveDropYield` calculates:

### Cells

```text
baseCellsPerElite =
  averageEliteCellsPerKill(tier) × cellsPerKillBonusMultiplier
  + Death Wave Cells Bonus lab benefit

cells =
  expectedEliteKills × cellsPerEliteAfterCard(baseCellsPerElite) × wsMult
```

- Expected elite kills come from the elite spawn chart and Enemy Balance mastery input.
- The base Enemy Balance card multiplier is intentionally not applied to elite slots in this helper. Its legacy positional parameter is explicitly ignored.
- Cells card logic applies mastery multiplier first, then a flat per-elite amount.
- The card reward helper says no flat award is added to Fetch, ordinary kills or per-wave payout.

The average elite cells helper uses (1 + tier)/2 through tier 13, then a tier table, falling back to the final table row if the requested tier is beyond available rows.

### Boss drops

On a boss spawn wave:
- Expected boss reroll shards are added.
- Common/Rare module shatter yield may be added if the corresponding shatter toggle is enabled.
- The shatter branch uses the resolved common/rare drop chance multiplied by the applicable shatter yield.

### Fleet drops

On a fleet spawn wave:
- Fleet count comes from the fleet spawn schedule.
- Reroll shards use the 80% branch.
- Module shards use the 20% all-types EV, with a separate one-type EV at 5%.

The per-wave test asserts that one-type fleet module shards are one quarter of the all-types result.

## 7. Fetch model and known omission

Fetch expected procs:

```text
attempts = targetWave × clamp(averageWaveSeconds, 1, 600) / max(1, cooldownSeconds)
expectedProcs = attempts × findChance × (1 + doubleFindChance)
```

Each expected proc is distributed by the SDK Fetch outcome weights:

| Outcome | Weight per successful find proc |
|---|---:|
| Gems | 4% |
| Medals | 2% |
| Reroll shards | 3% |
| Cannon shards | 1% |
| Armor shards | 1% |
| Generator shards | 1% |
| Core shards | 1% |
| Common module | 0.4% |
| Rare module | 0.1% |
| Coins | 86.5% |

The weights sum to 100%. The simulator uses the non-coin weights for its Fetch resource output; the coin path is separately estimated by CPM in `coin-fetch.ts`.

Important limitation from SDK comments:
- Daily caps are listed as Gems 20, Medals 10, Common Modules 5, Rare Modules 2.
- The source explicitly says daily caps are not modeled in the EV simulator yet.
- Therefore, long-run Fetch EV can overstate capped daily rewards if the calculation is interpreted as an unrestricted daily total.
- The SDK's Fetch comments attribute the table to the in-game Drop Table UI / `GiveFetchReward`, with a comment "confirmed Jun 2026". This is SDK provenance text, not independent verification by Samantha.

Fetch coins:
- Coin procs = expected Fetch procs × 86.5%.
- CPM = pre-Fetch run coins / run duration.
- Fetch coins = coin procs × CPM × 0.002.
- The 0.2% CPM factor is explicitly labelled community/wiki in SDK source.

## 8. Coin simulation and calibration caveats

The coin simulator separates:
- Kill coins.
- Wave payout coins.
- Their Wave Skip bonus components.
- Fetch coins.
- Total coins.

It composes a large set of account inputs: workshop, labs, card, themes, relics, packs, perks/trade-offs, Vault, modules, Golden Tower, Black Hole, Death Wave, Spotlight, Golden Bot, uptime, Intro Sprint, BHD and other modifiers. It should be treated as an account-specific model, not a universal base coin formula.

Two especially important source comments are calibrations from save/run observations:

### Enemy coin weight

`RESOURCE_DROPS_AVG_ENEMY_COIN_WEIGHT` is derived from `measuredAverageEnemyCoinWeight()`, which in turn uses per-type kill counts from `test/playerInfo.dat`.

The SDK comment says the measured type mix was approximately Basic 27.9%, Fast 25.5%, Tank 24.0%, Ranged 22.6%, producing a weighted value near 2.20 versus an older hand-blended 1.15.

This is explicitly measured from a real round and save-derived. It is account/run calibration, not a universal constant. Keep it out of universal GKB unless a separately sourced general claim supports it.

### Enemies per spawn tick

The SDK uses `WAVE_SPAWN_CALIBRATED_ENEMIES_PER_TICK` and describes the value as a calibration, not a fully derived spawn-gate formula.

The source comment compares:
- Full Wave Accelerator mastery: estimates 3.29 and 3.22 (about 2% apart).
- No mastery: estimates 3.76 and 3.95 (about 5% apart).

The source itself says the magnitude is measured and should be replaced by a per-tick yield derived from actual spawn conditions. Preserve the calibration assumptions and uncertainty.

The simulator also has alternative spawn paths:
- Calibrated/account yield.
- Explicit spawn-gate model.
- Quantum or additive-probe options.

SDK tests show that the explicit spawn-gate additive/quantum paths can differ from calibrated account yield. Do not silently combine or substitute these modes.

## 9. SDK tests reviewed

Tests assert, among other things:
- Module drop base and additive lab scaling.
- Boss reroll tier table plus rounded lab bonus.
- Fleet reward row lookup and shatter shard examples.
- Cells at a sample wave, boss interval drops, Cells Per Kill Bonus scaling and Wave Skip cells.
- Wave Skip lowers expected kills per nominal wave while generating skipped-wave resource EV.
- Higher mastery depth lowers spawn fraction and raises skipped-cell EV in tested inputs.
- Per-wave totals equal the fold of retained per-wave rows.
- Disabled cards and Fetch become neutral when explicit inactive flags are supplied.
- Fetch disabled returns zero resource drops and zero Fetch coin contribution.
- Generator/Dissonance coin multipliers affect coin outputs without changing cells/shards/reroll outputs in the tested cases.
- Coin simulation rejects malformed or conflicting perk timelines.

These are test assertions about SDK implementation. Tests were read, not executed.

## 10. Boundaries, limitations and possible conflicts

1. **Expected value vs actual drops:** all fractional drop outputs are statistical EV; they do not predict exact integer drops in a single run.
2. **Fetch caps:** caps are documented in source but not applied in the EV simulator.
3. **Fetch coin factor:** 0.2% CPM is explicitly community/wiki sourced.
4. **Fetch loot table:** SDK comments cite the in-game Drop Table UI / `GiveFetchReward`, but Samantha has not independently inspected that UI.
5. **Enemy coin weight 2.20:** derived from save/run kill counters; account/run-specific calibration, not universal.
6. **Spawn yield 3.25-ish:** calibrated value with explicit mastery-dependent estimate spread; not a first-principles spawn formula.
7. **Wave Skip:** the context resource multiplier and sequential per-wave income recurrence are different functions for different purposes. Do not treat them as interchangeable.
8. **Enemy Balance:** ordinary enemy spawn multiplier and elite slot expectation are handled separately in the reviewed drop-yield path.
9. **Boss interval:** the simple `wavesPerBoss` context is distinct from the Wave Info tier-aware boss cadence helper used in the wave economy module. Do not assume every consumer uses the same input path.
10. **Card defaults:** omitted active flags preserve legacy active/equipped behavior; explicit false disables effects. Adapters must preserve whether a flag was missing or false.
11. **No independent live-game reproduction:** no in-game experiment or fresh save analysis was performed.

When sources disagree, retain each source and its provenance. Do not select a winner merely because one appears newer or more plausible.

## 11. GKB disposition

- Claim type: `OBJECTIVE` for SDK code behavior; `SENTIMENT` only for community observations if later imported as such.
- Verification status: `EXTERNAL-UNVERIFIED`.
- SDK version: `0.14.1`.
- Game version: UNKNOWN unless stated by a specific cited source (e.g. Cells card source comment says v29).
- Canonical GKB claims created: 0.
- Canonical relationships created: 0.
- Conflicts adjudicated: 0.
- Account/save-derived calibrations promoted to universal GKB: 0.
- SDK source files modified: 0.
- Samantha runtime tests executed: 0.

## 12. Next priority

Batch 5 should trace the underlying coin multiplier composition and spawn-yield inputs, especially:
1. `coin-multipliers.ts` and its source tables.
2. `wave-ordinary-coin-weight.ts` and `type-mix.ts` provenance boundary.
3. `waves/spawn-yield.ts` and spawn-rate chart.
4. `elite-spawn-chance.ts` chart provenance and tier behavior.
5. Compare SDK table/chart inputs with any available fan-made sources, preserving disagreements rather than choosing a winner.

Keep account-specific measured kill mixes and save-derived values outside universal GKB.
