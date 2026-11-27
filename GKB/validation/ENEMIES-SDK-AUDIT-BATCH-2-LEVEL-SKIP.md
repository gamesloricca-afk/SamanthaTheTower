# Enemy Level Skip — SDK Source Audit, Batch 2

- **Project:** Samantha GKB
- **Implementation branch:** `GKB`
- **SDK source mirror:** `TestAccount`
- **SDK:** `thetowersdk@0.14.1`
- **Audit date:** 2026-11-27
- **Status:** SOURCE REVIEW COMPLETE FOR THIS BATCH; RUNTIME NOT EXECUTED
- **Canonical claim import:** NOT PERFORMED

## 1. Scope

This batch examines Enemy Level Skip (ELS), including the two tracks (Attack and Health), Workshop utility levels, ELS+ enhancement, Labs, module cluster, Power Vault, Battle Conditions, per-wave probability, and the conversion from run wave to enemy stat level.

Important distinction: **Enemy Level Skip is not Wave Skip.** In the SDK terminology, ELS reduces the level used to look up enemy attack/health scaling; it does not advance the run's wave counter.

All findings below describe the behavior and comments of the external SDK source. They are `OBJECTIVE` statements about source code, with verification status `EXTERNAL-UNVERIFIED` as game mechanics. SDK tests are evidence that the SDK implementation is tested against its own expectations, not independent proof of live-game behavior.

## 2. Source files and provenance

| Source file | Blob SHA | Purpose |
|---|---|---|
| `src/mechanics/enemies/level-skip.ts` | `2702f1bc9d9f0a3dfc1c693848049a062e568d31` | ELS formulas, BC adjustments, wave scale, rolls and counter simulation |
| `src/mechanics/enemies/types.ts` | `f169bf8dc387cca52bfeaf53bde96e32bcfc193d` | Input/output types and documented units |
| `src/mechanics/enemies/wave-stats.ts` | `12b0131741e2205b1437be9e7b5a3d009ddabac0` | Legacy wave bands reused by ELS wave-scale model |
| `src/mechanics/modules/els-module-cluster.ts` | `3e0323e6fd73b9642a17e6c76dbba2bf6b929370` | Primary/Assist module and Vault additive contributions |
| `src/mechanics/modules/els-upgrade-path.ts` | `bda8b42594e199bf097c0bcae53ba395b04b92ea` | Workshop preview, in-run BC view and upgrade-path snapshots |
| `src/mechanics/labs/bc-counter-labs.ts` | `eaeec658a438318900d44819561f2516c28b6859` | Global and specific BC counter-lab adjustments |
| `src/mechanics/battle-conditions/conditions.ts` | `3f4410cc6804b3dc5afa982676fd04c1462cf8ac` | Shared subtract, multiply and decay helper formulas |
| `src/mechanics/enemies/wave-panel.ts` | `71673c94079e9eaed501370bbccab07bb01a5a9e` | Wave panel integration of effective skip and stat-level calculation |
| `src/mechanics/enemies/stats-simplified.ts` | `8ba340793808603eec96842059cb1c3b8d3bad83` | Simplified enemy stat lookup path |

Related SDK tests reviewed (not executed by Samantha in this audit):

| Test file | Blob SHA |
|---|---|
| `tests/mechanics/enemy-level-skip.test.ts` | `6c796d0a104910d1e909cc75653d1aebcd3afee0` |
| `tests/mechanics/enemy-level-skip-order.test.ts` | `19fe4e3c8af5b7f5b7ac3c7a25aec4149b0b07b0` |
| `tests/mechanics/enemy-level-skip-counter.test.ts` | `e4cbab96541e7b390b9c939c7b6cab8270fdb70a` |
| `tests/mechanics/els-module-cluster.test.ts` | `4629298b73a025833dc547a095bb503807fd8961` |
| `tests/mechanics/els-upgrade-path.test.ts` | `6c743c99cc92b97fcb2b2ac99039139382b3725d` |

## 3. SDK constants and source mapping

| Purpose | SDK value |
|---|---:|
| Attack Workshop utility index | 11 |
| Health Workshop utility index | 12 |
| Attack module-cluster index | 46 |
| Health module-cluster index | 47 |
| Legacy module stat indices | Attack 9; Health 12 |
| Attack ELS Lab index | 124 |
| Health ELS Lab index | 125 |
| Tech Tree benefit indices | Attack 9; Health 12 |
| Workshop base at level 0 | 0.0005 (0.05%) |
| Workshop increase per level | 0.0005 (0.05 percentage point) |
| ELS+ enhancement scale | 0.01 per level |
| ELS Lab benefit-increase rate | 0.1, then scaled by 0.01 in the additive builder |
| Campaign ELS Reduction heat divisor | 315 |
| ELS subtract scale | 0.005 |

The module cluster indices 46/47 are explicitly distinguished from Workshop utility indices 11/12. The legacy module stat indices 9/12 remain in the code as alternate-path compatibility values; the SDK comments call the cluster benefit the dominant path.

## 4. Source contribution model

### 4.1 Workshop utility

The SDK reads the `Enemy Attack Level Skip` or `Enemy Health Level Skip` Workshop row. Its documented fallback is:

```text
workshopBase = 0.0005 + utilityLevel × 0.0005
```

When a `kind` is supplied, `levelSkipWorkshopBase` attempts to use the exact float from `data/workshop/table.json` and offsets it from the level-0 row. If the row is unavailable, it uses the linear fallback.

The SDK tests assert:
- Level 0: 0.05%.
- Level 13: 0.70%.
- Level 680: approximately 34.05% in the linear fallback, while the exact JSON value is approximately 34.04999971%.
- Level 699: approximately 35.00%.

The Workshop preview path uses `upgradeWorkshopUtilityLevel[11|12]`; the in-run stored value is documented as using `upgradeUtilityLevel[11|12]`. Therefore, preview and battle can differ because the underlying utility levels differ.

### 4.2 Labs 124 / 125

The SDK maps:
- Lab 124 → Enemy Attack Level Skip.
- Lab 125 → Enemy Health Level Skip.

The source distinguishes the active lab benefit-increase field from the cumulative lab value. Its helper returns the configured rate (default 0.1) when lab level is positive, and zero at level zero. The additive builder scales this by 0.01 before adding it to the Workshop term.

Do not confuse this with the BC counter labs:
- Lab 199: Battle Condition Reduction.
- Lab 209: Enemy Level Skip Reduction.

Those are separate paths and are used to mitigate Battle Condition reductions, not to provide the same direct ELS additive term.

### 4.3 Module cluster

The module helper sums primary and assist substat percentages and converts them to a fraction:

```text
attackModuleFraction = (primaryAttackPct + assistAttackPct) / 100
healthModuleFraction = (primaryHealthPct + assistHealthPct) / 100
```

The SDK states that assist values supplied to the cluster builder should already include assist-efficiency when synced. The cluster builder itself does not apply that efficiency; it simply adds the provided primary and assist percentages.

The SDK tests use 8% primary + 4% assist = 12% (0.12) and 8% + 8% = 16% (0.16).

### 4.4 Power Vault

The SDK module helper encodes:
- Node ID `enemyatk` for Attack ELS.
- Node ID `enemyhealth` for Health ELS.
- 0.5% additive skip per star.
- Maximum 3 stars.
- Maximum contribution: 1.5% (0.015).

This is added before ELS+ enhancement in the module calculator path.

### 4.5 ELS+ enhancement

The SDK models ELS+ as a multiplier, not a flat additive skip chance:

```text
enhancementMultiplier = 1 + enhancementLevel × 0.01
```

Examples covered by SDK tests:
- Level 10 → ×1.10.
- Level 60 → ×1.60.
- Level 160 → ×2.60.

The enhancement multiplier applies to the full additive source sum in the Workshop/module calculator path, including Vault and module terms.

## 5. Workshop stored chance: SDK calculator path

The builder `buildLevelSkipChanceRaw` adds the following terms:

```text
sum =
  workshopBase
  + labBenefitIncrease × 0.01
  + moduleClusterBenefit
  + techTreeBenefit
  + cachedSkipBonus
  + cardBonus

rawChance = sum × enhancementMultiplier
previewChance = clamp(rawChance, 0, 1)
```

The module calculator path (`computeElsTrackSkipChance` → `computeWorkshopSkipChances`) supplies:
- Workshop utility level.
- Primary + assist module cluster.
- Power Vault stars.
- Lab 124/125 benefit-increase input.
- ELS+ enhancement level.

This is the SDK's Workshop/dropdown preview path. It is not automatically identical to the in-run effective chance after Battle Conditions.

## 6. In-run Battle Condition handling

The SDK's ELS module path deliberately creates a different source set for in-run effective BC:
- It keeps the primary module contribution.
- It sets assist module contribution to zero.
- It removes the direct ELS lab benefit-increase fields.
- It retains the Vault source.
- It then applies the tier Battle Condition adjustments.

The SDK comments say the Workshop dropdown keeps the full module cluster and labs, while the game run UI path applies tier BC to the primary-module stored chance. This distinction is explicitly encoded in `elsSkipSourcesForInRunEffectiveBc`.

### 6.1 ELS Reduction

The SDK has separate Workshop/Wave Info and in-run adjustment paths.

**Workshop/Wave Info path:** uses the full tooltip-style subtract:

```text
subtract = ELS_Reduction_Level × 0.5% × combinedLabModifier
```

**Campaign in-run path:** the source divides the tier heat level by 315 before applying the 0.5% scale:

```text
heatField = ELS_Reduction_Level / 315
subtract = heatField × combinedLabModifier × 0.005
```

**Tournament in-run path:** does not use the campaign divisor in the adjustment helper; tournament heat level can be wave-dependent through the heat profile path.

The SDK computes the combined modifier as:

```text
max(0, 1 − globalLab199Benefit − specificLab209Benefit)
```

The BC counter-lab module documents:
- Lab 199 global benefit: 2% per level, max 20% at level 10.
- Lab 209 in-run specific benefit: 0.01% per level (0.001 fraction at level 10).
- The Workshop tooltip path resolves the specific Lab 209 value using the lab table, while the in-run path uses the smaller explicit per-level fraction helper.

The source therefore models a deliberate distinction between Workshop tooltip and in-run UI. Do not merge those two outputs into one field without preserving which path generated the value.

### 6.2 Skip Reduction - Multiply

The SDK factor is:

```text
factor = 1 − (BC level × 0.01)
```

For levels below 1, the helper returns 1 (no reduction). The ELS application path clamps the remaining chance to zero after multiplication.

### 6.3 Skip Decay

The helper applies:

```text
chanceAfterDecay = max(0, chance × (1 − decayPercent))
```

A separate helper computes a decay interval as:

```text
floor(tierConditionLevel × (1 − decayMitigation))
```

The expected-stat simulation applies decay on interval boundaries. The precise live-game timing and whether all UI/run paths use the same interval must remain attached to the specific source path.

### 6.4 Order of operations

The SDK's `applyTierBattleConditionsToSkipChance` path performs:

1. Clamp stored chance to [0, 1].
2. Apply ELS Reduction subtract; clamp to zero.
3. Apply Skip Reduction - Multiply; clamp to zero.
4. Apply Skip Decay; clamp to zero.

The SDK order test explicitly checks that subtract-before-multiply differs from the reverse order and that the initial cap occurs before reductions.

A separate `computeLevelSkipChance` helper also accepts `tournamentSubtract` and applies it after its other optional reductions. This input is not part of `applyTierBattleConditionsToSkipChance`; do not assume both helpers have identical pipelines.

## 7. Per-wave probability model

The SDK's per-wave roll path is separate from the stored Workshop chance.

### 7.1 Wave scale

The function `waveBands(wave)` floors wave to an integer of at least 1 and returns band counters such as:

- `floor(wave/5)`
- `floor(wave/10)`
- `floor(wave/15)`
- `floor(wave/25)`
- `floor(wave/37)`
- `floor(wave/38)`
- `floor(wave/50)`
- `floor(wave/75)`
- `floor(wave/100)`
- `floor(wave/200)`
- `floor(wave/300)`
- `floor(wave/500)`
- `floor(wave/1000)`
- `floor(wave/1024)`
- an adjusted band `floor(floor(wave/10)/64)`

The SDK comments explicitly call these legacy ELS bands and warn that they are not the same as the base enemy HP wave bands.

The wave scale is composed from:
1. A polynomial seed: 1 + weighted sum of the band counters.
2. Fifteen exponential band terms.
3. A final `LEVEL_SKIP_WAVE_POW_BASE ^ wave` term (source tests identify the tail as `1.004 ^ wave`).

The coefficients are preserved in the source file; this report does not reproduce them as a universal game formula because the SDK labels this as its modeled wave-scale path and no independent live-game evidence was checked.

### 7.2 Roll modifier

The SDK uses a base modifier of 1.5 plus a tier add, then multiplies by optional intro and Main field 614 multipliers.

Tier add table:
- Below tier field 10: 0.
- Tier 10: 0.01.
- Tier 11: 0.02.
- Tier 12: 0.10.
- Tier 13: 0.22.
- Tier 14: 0.36.
- Above tier 14: 0.51.

### 7.3 Per-wave roll threshold

```text
threshold = waveScale × storedSkipChance × rollModifier
skip = randomRoll < threshold
probability = clamp(threshold, 0, 1)
```

Attack and Health are rolled separately using separate chance and roll inputs in `rollEnemyLevelSkipsForWave`.

The SDK tests verify the arithmetic and probability cap. They do not prove that the modeled random stream or all tier/intro field values match every live-game version.

## 8. Counter model and enemy stat level

The SDK also implements a deterministic counter model used by its run-header/stat lookup helpers:

```text
for each wave:
  counter += storedSkipChance
  if counter > 1:
    counter -= 1
    totalSkips += 1

enemyStatLevel = max(1, runWave − totalSkips)
```

The comparison is strictly `>`, not `>=`. The SDK test has a discriminating case at 100 waves and 50% chance, where the implementation returns 49 skips.

The SDK exposes three related but distinct approaches:
- `simulateEnemyLevelSkips`: iterates the fractional counter.
- `deterministicSkipLevelsFromChance`: fast approximation using `round(wave × chance)`.
- `expectedEnemyStatWave`: accumulates expected per-wave progress using the wave-scale probability model and optional Skip Decay.

The SDK tests themselves demonstrate that the fast rounded approximation can differ from the counter model at high waves. The source recommends using the counter simulation for header stat lookup.

The enemy stat level is then used separately for:
- Health: current run wave minus Health Level Skips.
- Damage: current run wave minus Attack Level Skips.

It is not the run's current wave counter.

## 9. Source-path differences and unresolved implementation questions

These differences are visible inside SDK 0.14.1 and should be retained rather than silently reconciled:

1. **Full additive builder vs in-run chance helper.** `buildLevelSkipChanceRaw` supports Lab, Tech Tree, cached bonus and card bonus. `computeLevelSkipChance` instead builds its initial chance from Workshop, module and card terms, then applies reductions; it does not add the other fields through the same path. The SDK also lists card bonus paths, legacy module indices and perk terms among `LEVEL_SKIP_GAPS`. These are separate helper paths, not proof of one universal production formula.
2. **Wave roll vs counter simulation.** `rollEnemyLevelSkip` models a random per-wave threshold affected by wave scale; `simulateEnemyLevelSkips` uses a deterministic accumulator of stored chance. The SDK uses them for different purposes. Do not substitute one model for the other.
3. **Workshop preview vs in-run display.** Workshop preview includes full primary+assist module and lab source inputs; the in-run ELS effective path removes assist and direct lab contributions before applying BCs.
4. **Workshop BC vs in-run BC.** The Workshop path uses full tooltip-style ELS subtract, while campaign in-run applies a heat divisor and a different Lab 209 benefit path.
5. **Legacy and alternate indices.** The SDK exposes legacy module stat indices 9/12 alongside cluster indices 46/47. The source comments state that the cluster path is dominant, but alternate paths remain in the module and gap notes.
6. **Card, perk, intro and sprint paths.** The source explicitly lists incomplete paths and multiple candidate terms. They remain unresolved in this audit.

These are SDK-internal path differences. They are not converted into a claim that the SDK is wrong or that any particular implementation is the live-game winner.

## 10. SDK test evidence reviewed

The reviewed test files assert the following behaviors:

- Workshop base curve and exact Workshop JSON value lookup.
- ELS+ multiplier applies to the complete additive sum.
- Lab benefit-increase term is added before enhancement in the raw builder.
- Vault and module terms increase the stored chance additively before enhancement.
- Battle Condition reduction order is subtract → multiply → decay, with clamping.
- Per-wave roll threshold uses wave scale × chance × roll modifier.
- Counter simulation carries remainder across waves and uses strict `>` threshold.
- Counter simulation and rounded approximation can produce different totals.
- Module cluster sums primary and assist percentages.
- Vault provides 0.5% per star, capped at three stars.
- Workshop and in-run effective values can differ due to BC/source treatment.

**Test status:** tests were read, not run. No claim is made that this audit executed the SDK test suite.

## 11. GKB disposition

- Claim type: `OBJECTIVE` (SDK source behavior).
- Verification status: `EXTERNAL-UNVERIFIED`.
- SDK version: `0.14.1`.
- Game version: UNKNOWN unless an individual SDK comment/test explicitly states a version.
- Canonical GKB claims created: 0.
- Canonical relationships created: 0.
- Conflicts adjudicated: 0.
- SDK source files modified: 0.
- Samantha runtime tests executed: 0.

The report is a source audit record only. It does not promote SDK formulas into universal GKB mechanics.

## 12. Next batch

Continue with the Wave Info composition path:
1. `wave-info-pipeline.ts` — ordering of enemy HP/damage transforms.
2. `wave-info-labs.ts` — enemy-specific lab multipliers and boss health handling.
3. `stat-display.ts` — perk and trade-off transformations, with UI-vs-run distinctions.
4. Compare these with `wave-panel.ts` and `stats-simplified.ts` call sites.
5. Inspect corresponding SDK tests, then report any path differences without selecting a winner.

After that, audit the separate Drop Simulation modules. Keep account/run-derived data outside universal GKB.
