# Enemy Mechanics SDK Source Audit — Batch 1

- **Project:** Samantha GKB
- **Target branch:** `GKB`
- **Source branch inspected:** `TestAccount` (SDK source mirror)
- **SDK package:** `thetowersdk@0.14.1`
- **Audit date:** 2026-11-27
- **Audit status:** PARTIAL — SOURCE REVIEW ONLY
- **Canonical GKB import:** NOT PERFORMED

## 1. Objective and scope

Review a first, bounded set of enemy-related mechanics exports from the pinned TheTowerSDK source. Record what the code implements, input/output shape, units, clamps, dependencies, and limitations. This is not a claim that the SDK is an official developer source or that every formula reproduces the live game.

The mechanics source files were inspected from:

`TheTowerData/upstream/thetowersdk/0.14.1/src/mechanics/enemies/`

The source mirror is present on `TestAccount`; the implementation/audit record is being maintained on `GKB`. No SDK source files were changed.

## 2. Claim handling

For this audit, the statements below describe **what the SDK 0.14.1 code does**. They are classified as:

- Claim type: `OBJECTIVE` (code behavior / source structure).
- Verification status: `EXTERNAL-UNVERIFIED` (SDK is an external fan-made source; not independently confirmed as live-game behavior).
- Applicable SDK version: `0.14.1`.
- Game version: only specified where the source itself explicitly names one; otherwise UNKNOWN.
- A source-code formula is not automatically promoted to a canonical game mechanic.

No conflict is resolved by choosing the SDK's preferred value. If another source disagrees, preserve both source claims and their context.

## 3. Files reviewed

| SDK source file | Source blob SHA | Review focus |
|---|---|---|
| `enemies/MAP.md` | `8086cac967835e1c184738e31aaa8cf038a7f146` | Module map and declared scope |
| `enemies/index.ts` | `ed0638dc647792cac820a4eb1ff095f7f5178a09` | Public re-exports |
| `enemies/constants.ts` | `314548fa8428709d2dce4f636b913b6b613832b3` | Enemy lab slugs; v29 boss reroll proc constant |
| `enemies/type-mults.ts` | `75971662030a2f769ba94d89424e08f5287c3a17` | Enemy type HP/damage coefficient table |
| `enemies/type-mix.ts` | `089b547b6c5e18f839ce0ef80b9bca7398dac66a` | Ordinary enemy coin weights and save-derived mix |
| `enemies/wave-stats.ts` | `12b0131741e2205b1437be9e7b5a3d009ddabac0` | Tier/wave base stats and type multipliers |
| `enemies/elite-spawn-chance.ts` | `317a4ccca9c7c0badd3244e42f4b244e6a27cc62` | Elite chance chart, expected counts, boss/fleet cadence |
| `enemies/fleet-lab-effects.ts` | `4c945f076c01dbda11379c40e6954cdede7aaf81` | v29 fleet lab benefit curves |
| `enemies/overcharge-hit-scaling.ts` | `e383e761e3f3969df9423a577076f973fc3754ae` | Local Overcharge volley expression |
| `enemies/ray-attack.ts` | `e63d332a015c94cf1cab0d2a252eb41dd560b7b5` | Ray charged payload calculation |
| `enemies/vampire-beam.ts` | `c3a7cd69a13b68379b12ac06f1a067364a062b4f` | Vampire Garlic Thorns rate helper |
| `enemies/get-resistance-level.ts` | `3cddbac20c155008dbbaad7c36be10dc80d721fc` | Battle-condition resistance level |

## 4. Audited code behavior

### 4.1 Base enemy wave statistics

| Export | Inputs | Output | Units / normalization | SDK behavior and limits |
|---|---|---|---|---|
| `getBasicEnemyWaveStats` | `tier:number`, `wave:number`, optional boolean or `EnemyWaveScalingContext` | `{hp, damage}` | HP and damage values; wave is floored and clamped to at least 1; tier passes through `clampCampaignTier` | Calls `computeWaveBaseHealth` and `computeWaveBaseDamage`; tournament/testing context is forwarded |
| `getWaveBaseStats` | `wave:number` | `{hp, damage}` | Same as above | Convenience wrapper for tier 1, non-tournament context; it is not a generic tier lookup |
| `getEnemyWaveStats` | tier, wave, enemy type, optional context | stats object or `null` | Multiplies base HP/damage by type coefficients, then floors both | Unknown type returns null; `tournament` is reflected in output; the type coefficients are SDK table values |
| `waveBands` | `wave:number` | Object of integer band counters | Wave floored and clamped to at least 1; fields are floor(wave/N) | Legacy level-skip band helper; source explicitly says it is not the base-wave-health band table |

**Type multiplier table in SDK source** (relative to Basic):

| Type | HP multiplier | Damage multiplier |
|---|---:|---:|
| Basic | 1 | 1 |
| Boss | 20 | 1 |
| Commander | 20 | 0 |
| Fast | 1 | 1 |
| Overcharge | 20 | 1 |
| Protector | 0.6000000238418579 | 1 |
| Ranged | 1 | 1 |
| Ray | 1 | 2 |
| Saboteur | 20 | 0 |
| Scatter | 2 | 1 |
| Tank | 5 | 0.5 |
| Vampire | 2 | 1 |

**Limitations:** these are the multipliers encoded in this SDK table, not independently verified enemy stats. In particular, Commander/Saboteur damage coefficient `0` must not be interpreted as proof that these enemies cannot damage the Tower; inspect the consumers and relevant enemy-specific mechanics before drawing that conclusion. Protector's decimal is a floating-point representation and should not be rounded silently when preserving raw source data.

### 4.2 Elite spawn chance and expected elite counts

| Export | Inputs | Output | Units / normalization | SDK behavior and limits |
|---|---|---|---|---|
| `eliteSpawnChanceAtWave` | tier, wave | `singleSpawnPct`, `doubleSpawnPct`, threshold, row index | Percent values; wave floor/clamp to >=1 | Selects highest chart row whose tier-column wave threshold is <= requested wave |
| `waveInfoEliteSpawnChancePct` | tier, wave, options | number | Percent | Returns chart Single% only; options are accepted but unused in this implementation |
| `waveInfoEliteChartDoubleSpawnPct` | tier, wave | number | Percent | Returns chart Double%; excludes Enemy Balance mastery |
| `waveInfoEliteEffectiveDoubleSpawnPct` | tier, wave, optional Enemy Balance mastery | number | Percent, rounded to 0.1 and capped at 100 | Combines mastery probability with chart Double% using `EB + (1 − EB) × chartDouble` |
| `expectedEliteKillsPerWave` | tier, wave, optional mastery | number | Expected elite count per wave | Uses a slot model: below 100% Single, `pSingle × (1 + pEB)`; at 100% Single, `(1 + pEB) × (1 + pChartDouble)` |
| `waveInfoEliteTwoOrMoreSpawnChancePct` | tier, wave, optional mastery | number | Percent, rounded to 0.1 and capped at 100 | Uses different branches before/after Single% reaches 100; this is a model of 2+ chance, not a direct spawn simulation |

The source identifies the lookup table as the same table used by the SDK's Elite Spawn Chance chart. The source code does not, by itself, establish that the table is current for every live-game version.

### 4.3 Boss and Fleet wave cadence

| Export | Inputs | Output | Units / normalization | SDK behavior and limits |
|---|---|---|---|---|
| `computeWaveInfoBossWaveInterval` | tier, tournament flag, optional league | interval | Waves per boss spawn | Uses tournament heat profile when tournament + league are supplied and a profile exists; otherwise uses tier-based interval |
| `isBossSpawnWave` | wave, interval | boolean | Wave counts | Floors both values and clamps each to >=1; tests modulo |
| `wavesUntilNextBossSpawn` | wave, interval | `{waves,onSpawnWave}` | Number of waves | Returns zero when current wave is a spawn wave |
| `isFleetSpawnWave` | tier, wave | boolean | Wave counts | Uses explicit Fleet rows when available; below T14 fallback is first wave `15000 − 250×(tier−1)`, then every 100 waves; T14+ without a row returns false |
| `fleetSpawnSchedule` | tier | schedule or null | First wave, repeat interval, fleet count | Uses explicit table row; same below-T14 fallback; returns null for T14+ without row |
| `wavesUntilNextFleetSpawn` | tier, wave | `{waves,onSpawnWave}` | Number of waves | Derives from schedule; if schedule is null returns `{waves:0,onSpawnWave:false}` |
| `wavesUntilNextEliteSpawnTier` | tier, wave | result or null | Waves until chart threshold | Returns null once Single% or Double% is 100%, or when no later threshold is found |
| `isEliteEnemyType` | enemy type string | boolean | — | True only for Vampire, Scatter, Ray |
| `isFleetEnemyType` | enemy type string | boolean | — | True only for Saboteur, Commander, Overcharge |

**Important implementation limitation:** the below-T14 Fleet schedule is a fallback formula embedded in this SDK source. Do not generalize it to all tiers or assume it is a developer-confirmed rule. For T14+, the code depends on `FLEET_SPAWN_ROWS` from SDK data.

### 4.4 Overcharge local hit scaling

| Export | Inputs | Output | Units / normalization | SDK behavior and limits |
|---|---|---|---|---|
| `overchargeVolleyIndex` | 1-based hit number | 0-based volley index | Hit count | Hits 1–2 map to volley 0, 3–4 to 1, etc.; values below 1 return 0 |
| `overchargeVolleyDamageMultiplier` | 1-based hit number | multiplier | Dimensionless | Returns volley index + 1; both hits in a volley share the multiplier |
| `enemyHeatUpMultiplierThroughHit` | 1-based hit number | multiplier | Dimensionless | Returns `1.04^(hitNumber−1)` for hit >1; first/less-than-first hit returns 1 |
| `rawOverchargeHitDamageBeforeReduction` | `hitNumber`, `baseAdjustedDmg`, optional `includeHeatUp` | raw damage | Same unit as baseAdjustedDmg | Returns zero for hit <1 or base damage <=0; applies local volley multiplier and optionally 1.04 heat-up chain |

**Explicit source limitation:** this is a local volley expression, not the complete damage progression over a battle. The source comments state that the caller must resolve base enemy-damage state progression separately. The SDK also notes that official v28.3 notes describe a 1.4x successful-hit increase, which is a separate progression from the local two-contact volley expression.

### 4.5 Ray and Vampire helpers

| Export | Inputs | Output | Units / normalization | SDK behavior and limits |
|---|---|---|---|---|
| `rayAttackPayloadDamage` | nonnegative finite panel wave damage | payload damage | Same unit as panel damage | Multiplies by Ray damage coefficient (2); throws for negative/non-finite input or overflow |
| `vampireGarlicMaxHealthDamageRate` | `thornsFraction`, `garlicLabPercent` | rate coefficient | Fraction of max enemy HP per second, according to source comment | Computes `thornsFraction × garlicLabPercent / 100`; rejects negative/non-finite inputs |
| `getResistanceLevel` | heat level, condition-specific reduction, global reduction | f32 resistance level | Dimensionless | Floors/clamps heat to >=0, uses Float32 rounding at intermediate steps, then returns `1 + heat × LAB_WORKSHOP_SCALE × (1 − perBC − global)` |

**Ray limitation:** source comments state that 30-second charge timing is public-mechanic evidence, not a recovered native attack-clock implementation. The payload helper only converts panel damage to one unmitigated charged shot; it does not model the full attack cycle.

**Vampire limitation:** source comments explicitly separate the drain from regular attack and state that enemy attack labs, defense, wall and Energy Shield must not scale this rate. The function only calculates the Garlic Thorns coefficient; it does not simulate beam uptime, target selection, or Tower/Wall state.

### 4.6 Fleet lab benefit helpers

| Export | Inputs | Output | SDK behavior |
|---|---|---|---|
| `overchargeExponentReducerBenefitPct` | reducer lab level | percent points | Floors/clamps level to >=0; `40 − 0.5×level` |
| `overchargeAttackExponentAfterLab` | reducer lab level | exponent | `max(1, 1 + benefitPct/100)` |
| `commanderRadiusBenefitPct` | radius lab level | percent points | Floors/clamps level to >=0; `level` |
| `commanderBuffRadiusScaleAfterLab` | radius lab level | scale | Base radius scale × `(1 + level/100)` |
| `saboteurAttackSpeedBenefitPct` | attack-speed lab level | percent points | Floors/clamps level to >=0; `2×level` |
| `saboteurSpeedMultAfterLab` | attack-speed lab level | multiplier | Base Saboteur speed multiplier 2 × `(1 + 2×level/100)` |

The file describes these as v29 Fleet research lab effects and labels benefit curves as owner-verified percentage points. That is provenance asserted by the SDK source; Samantha has not independently verified it.

### 4.7 Enemy lab mapping helpers

| Export | Inputs | Output | SDK behavior |
|---|---|---|---|
| `computeEnemyLabLevelFromMap` | slug, lab-level map, optional alternate keys | integer level | First finite matching value is floored and clamped to >=0; defaults to 0 |
| `waveInfoEnemyLabSlugForRow` | enemy type, `hp` or `attack` | slug or undefined | Looks up the SDK's enemy-type-to-lab mapping |
| `waveInfoEnemyLabMultiplierForRow` | enemy type, stat, lab map, benefit callback | multiplier | Returns 1 if no slug/level/positive finite benefit; otherwise `max(0, 1 − reductionPct/100)` |
| `waveInfoBossHpTableFloat` | lab map, benefit callback, lab value per level | Float32 table value | Uses boss health lab level, benefit, and Boss hpFixedMult (default 20) |
| `waveInfoBossHpWorkshopMult` | same as above | workshop multiplier | Converts the table float using `workshopMultFromTableFloat`; returns 1 when table float <=0 |

The source mapping contains HP and attack lab slugs for Basic, Fast, Tank, Ranged, Boss, Vampire, Scatter, Ray, and Overcharge; Protector has HP and no attack entry; Commander and Saboteur have HP entries only.

## 5. Non-function source observations

### 5.1 Enemy stat research lab slug list

The SDK list includes:
`common_enemy_health`, `common_enemy_attack`, `fast_enemy_health`, `fast_enemy_attack`, `tank_enemy_health`, `tank_enemy_attack`, `ranged_enemy_health`, `ranged_enemy_attack`, `boss_health`, `boss_attack`, `protector_health`, `protector_radius`, `ray_enemy_health`, `ray_enemy_attack`, `vampire_enemy_health`, `vampire_enemy_attack`, `scatter_enemy_health`, `scatter_enemy_attack`.

### 5.2 Boss reroll shard proc constant

`BOSS_REROLL_SHARD_PROC_CHANCE_V29 = 0.15` (15%) is a source constant explicitly labelled v29. It is not independently verified here.

### 5.3 Save-derived enemy mix is not universal GKB knowledge

`type-mix.ts` says its measured counts came from `test/playerInfo.dat`, waves 600–4875:
- Basic: 109,691
- Fast: 156,256
- Tank: 147,353
- Ranged: 138,923

The file itself states that named counters account for 560,076 of 621,640 kills, leaving 9.9% unattributed, and explicitly does not fold that residue into Basic. This is account/run-specific evidence. **Do not promote these counts or derived shares into universal GKB.** The file also contains coin weights (Basic 0, Fast 2, Tank 4, Ranged 2) described as base coins before reward multipliers; preserve as SDK source data pending separate source review.

## 6. Review status and gaps

- Reviewed in this batch: source files listed in §3 and the exports described in §4.
- Not reviewed in this batch: the remaining enemy exports, including the complete level-skip implementation, drops simulation, full wave-info pipeline, population caps, spawn-quantum model, enemy distances/speed/mass models, and all other enemy functions in the 158-function discovery group.
- No runtime test was executed in this audit.
- No live game experiment was performed.
- No claim was promoted to `VERIFIED`.
- No canonical GKB claim or relationship was created.
- SDK group assignment remains a name-based discovery hint, not a validated taxonomy.

## 7. Next audit batch

Recommended next source modules:

1. `level-skip.ts` — input composition, lab/module/card terms, Battle Condition order, per-wave roll.
2. `stats-simplified.ts` and `wave-info-pipeline.ts` — how skip-adjusted wave values and enemy-specific modifiers are composed.
3. `wave-panel.ts`, `stat-display.ts`, `wave-info-labs.ts` — displayed enemy stats and UI-only transforms.
4. `drops-simulation.ts`, `drops-wave-context.ts`, `drops-game-data.ts` — coin/cell/module drops and simulation assumptions.
5. `fleet-spawn` and spawn quantum dependencies — cadence, population constraints, and model limitations.

The audit should continue in small batches. If a separate source disagrees with an SDK claim, record the competing values and source references side by side; do not select a winner solely from SDK metadata or an authority score.
