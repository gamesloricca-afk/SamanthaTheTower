# Enemy Wave Info Pipeline — SDK Source Audit, Batch 3

- **Project:** Samantha GKB
- **Implementation branch:** `GKB`
- **SDK source mirror:** `TestAccount`
- **SDK:** `thetowersdk@0.14.1`
- **Audit date:** 2026-11-27
- **Status:** SOURCE REVIEW COMPLETE FOR THIS BATCH; RUNTIME NOT EXECUTED
- **Canonical GKB import:** NOT PERFORMED

## 1. Scope and classification

This batch reviews the enemy Wave Info calculation path: wave-base inputs, type-specific HP/damage rules, enemy Research Labs, Battle Condition handoff, page perk display modifiers, and the simplified enemy-stat calculator.

All statements are `OBJECTIVE` descriptions of SDK code. Their game-mechanic verification status remains `EXTERNAL-UNVERIFIED`: the SDK is a fan-made external source, and tests in its own repository only establish expected behavior within that codebase. No live-game test was performed.

## 2. Source files and provenance

| File | Blob SHA | Review focus |
|---|---|---|
| `src/mechanics/enemies/wave-info-pipeline.ts` | `c935ab7804c13af8afe412c914040b314a04bde5` | Display pipeline stage order and final flooring |
| `src/mechanics/enemies/wave-info-labs.ts` | `2e237dfafaa3ed368bf9b93c740c78429f93f4a8` | Enemy lab slug mapping and row multipliers |
| `src/mechanics/enemies/stat-display.ts` | `eaab51ab5d2f319c200a20221d813be57af4f210` | Trade-off perks and page display multipliers |
| `src/mechanics/enemies/wave-panel.ts` | `71673c94079e9eaed501370bbccab07bb01a5a9e` | Main Wave Info panel orchestration |
| `src/mechanics/enemies/stats-simplified.ts` | `8ba340793808603eec96842059cb1c3b8d3bad83` | Simplified enemy stat calculation path |
| `src/mechanics/waves/info-enemy-stats.ts` | `a492415fe78e5824a0d46ef79fe32266c914e881` | Per-enemy type rules for HP and damage |
| `src/mechanics/waves/info-enemy-constants.ts` | `af3343f5c86a14ba8114abd0e6d7f2024eddef7f` | Enemy multipliers and rule table |

SDK tests reviewed (not executed):

| Test | Blob SHA |
|---|---|
| `tests/mechanics/enemy-wave-info-pipeline.test.ts` | `b94f1838a544e2ef4d30d5d279f7be257edee2b1` |
| `tests/mechanics/enemy-wave-info-labs.test.ts` | `c0f8e428dbdf94d4d0a588cef289e7aeba36ed26` |
| `tests/mechanics/wave-info-enemy-stats.test.ts` | `9b351178452f645ac6661fae565cd02a5657c388` |
| `tests/mechanics/wave-info-enemy-stats.boss-path.test.ts` | `e0e2d43475fb1966f5f064d4b45250db5004e17b` |
| `tests/mechanics/perk-benefit.test.ts` | `5abdd9a91d5ee3c0aa3e0918317cbe1e0210fe30` |

## 3. Wave Info pipeline

The SDK declares these stage names:

1. `waveBase`
2. `workshop`
3. `typeRules`
4. `pagePerks`

The orchestrator `computeWaveInfoDisplayStats` obtains enemy-type rules through `getWaveInfoEnemyStatsUnfloored`, then calculates page perk multipliers, applies them to HP/damage, and floors the final values once.

The source comment describes the conceptual order as:
- skip-adjusted base wave health/damage;
- Battle Conditions, type rules and enemy labs;
- page perks last.

The named `workshop` stage should not be interpreted as a standalone multiplier applied uniformly to every enemy row. Workshop behavior is embedded in the per-enemy rule branches and boss-health table conversion.

The result includes stage values for base HP/damage, post-type-rule HP/damage, and page perk multipliers. These stage fields are useful provenance for explaining how a displayed number was produced.

## 4. Enemy Research Lab mapping

The Wave Info row mapping in SDK source is:

| Enemy | HP lab slug | Attack lab slug |
|---|---|---|
| Basic | `common_enemy_health` | `common_enemy_attack` |
| Fast | `fast_enemy_health` | `fast_enemy_attack` |
| Tank | `tank_enemy_health` | `tank_enemy_attack` |
| Ranged | `ranged_enemy_health` | `ranged_enemy_attack` |
| Boss | `boss_health` | `boss_attack` |
| Protector | `protector_health` | — |
| Vampire | `vampire_enemy_health` | `vampire_enemy_attack` |
| Scatter | `scatter_enemy_health` | `scatter_enemy_attack` |
| Ray | `ray_enemy_health` | `ray_enemy_attack` |
| Overcharge | `overcharge_enemy_health` | `overcharge_enemy_damage` |
| Commander | `commander_enemy_health` | — |
| Saboteur | `saboteur_enemy_health` | — |

For ordinary row lab handling, the helper computes:

```text
rowMultiplier = max(0, 1 − totalLabReductionPercent / 100)
```

The source example says a chart total of 0.4 at level 1 becomes a 0.996 multiplier. The helper uses the cumulative lab benefit supplied by the caller, not a hard-coded 0.4% for every level.

### Boss HP exception

Boss HP does not use the same direct row multiplier path as ordinary enemies. The SDK converts the persisted Boss Health Workshop table float using `workshopMultFromTableFloat`.

The test case uses:
- Boss Health level 30.
- Benefit function 0.3 × level = 9%.
- Boss fixed HP multiplier 20.
- Workshop table float 54.
- Resulting workshop multiplier approximately 0.46.

The SDK test explicitly contrasts this with the ordinary 1 − 9% result (0.91). Therefore, do not model Boss Health as a simple 9% reduction in this particular Wave Info path.

## 5. Enemy type rules

The SDK rule table and tests describe these starting relationships to the same skip-adjusted wave base:

| Enemy | HP rule | Damage rule |
|---|---|---|
| Basic | Wave base × Workshop row multiplier | Wave base × Workshop row multiplier |
| Fast | Wave base × Workshop row multiplier | Wave base × Workshop row multiplier |
| Tank | Wave base × 5 × HP lab multiplier | Wave base × Workshop row multiplier, with a separate `damageNoSpawnHalf` flag in rule data |
| Ranged | Wave base × Workshop row multiplier | Wave base × Workshop row multiplier |
| Boss | Wave base × 20 × Boss Health Workshop multiplier | Wave base × Workshop row multiplier |
| Protector | Wave base × 0.6000000238418579 × HP lab multiplier | Plain wave-base damage |
| Scatter | Wave base × 2 | Half wave-base damage |
| Vampire | Wave base × 2 | Plain wave-base damage |
| Ray | Plain wave-base HP | Plain wave-base damage |
| Saboteur | Wave base × 20 | 0 in this rule path |
| Commander | Wave base × 20 | 0 in this rule path |
| Overcharge | Wave base × 20 | Wave-1 base damage × 1.52588e-05 |

Notes:
- The table is a description of the SDK Wave Info implementation, not a universal claim that these are the complete combat damage rules.
- The `damageNoSpawnHalf` property appears in the Tank rule object, but the reviewed `resolveWaveInfoDamage` function does not branch on that property. It applies the Workshop damage path. This is a code-path observation, not a conclusion about a separate spawn-time mechanic.
- The rule table includes `bossOverhealWaveScaling` for Boss, and the constants file defines a boss-overheal helper and thresholds. However, the reviewed `computeWaveInfoTypeRules` path does not call `bossOverhealWaveMult`. This batch therefore does not claim that boss overheal is applied by this specific stat calculation path. The helper's other call sites need separate tracing.
- Overcharge's attack damage is pinned to the wave-1 base in this Wave Info path; it is not derived from the current wave's base damage.

## 6. Trade-off perks and Improve Trade-off Perks Lab

The SDK uses these perk indices in its run-header / Wave Info display helper:

| Perk | Index |
|---|---:|
| Enemy HP trade-off | 42 |
| Enemy Attack trade-off up (Enemies Damage −%) | 43 |
| Ranged Attack trade-off down | 44 |
| Enemy Attack trade-off down (Enemies Damage ×2.5) | 45 |
| Boss HP trade-off down | 40 |
| Boss HP trade-off up (Boss HP ×8) | 48 |
| Improve Trade-off Perks Lab | 88 |

Source constants include:
- Base benefit for Enemy HP and Enemies Damage reductions: 0.5.
- Enemies Damage ×2.5 factor: 2.5.
- Ranged Damage ×3 factor: 3.
- Boss HP down multiplier: 0.3.
- Boss HP ×8 up base: −7, represented as 1 − (−7) = 8.

The Improve Trade-off Perks lab scales selected `PerkBenefitUp` benefits through:

```text
improveMultiplier = 1 + improveTradeOffLabPercent / 100
```

The SDK test for the perk system says the two perk labs are not interchangeable: Standard Perks Bonus scales standard perks; Improve Trade-off Perks scales trade-off perks. Penalty-side `PerkBenefitDown` is kept flat in that test.

### Wave Info page behavior

The reviewed `waveInfoPagePerkMultipliers` path has display-specific handling:
- Boss HP uses a dedicated sequence for Enemy HP −%, Boss HP −70%, and Boss HP ×8, including a Boss-specific divisor adjustment.
- Non-Boss HP can apply Enemy HP −%; when other trade-off perks are enabled, the source has a fallback reciprocal reduction path.
- The source comment says Enemies Damage −% is not applied on Wave Info rows.
- For several Workshop-damage rows, Enemy HP −% pairs with the ×2.5 speed/damage trade-off even if the ×2.5 toggle is off.
- Ranged Damage ×3 is applied only to the Ranged row in this Wave Info helper.
- Vampire damage is explicitly excluded from the Workshop-damage set.

These are page/display calculations. They must not be generalized to all live combat damage without tracing the combat path separately.

## 7. Panel and simplified calculator paths

### Full Wave Info panel

`computeEnemyWavePanel`:
1. Normalizes tier and wave.
2. Resolves Battle Conditions at the requested wave.
3. Builds a row for each requested enemy type through `getAdjustedEnemyWaveStats`.
4. Adds spawn chance, speed and mass through the separate panel-extras helper.
5. Builds the Basic-based Wave Base row.
6. Builds footer data including skips and other panel options.
7. Returns effective Attack/Health skip percentages and per-enemy rows.

The full panel accepts card options for Enemy Balance Mastery, Protector Radius Lab, Protector damage reduction, Wave Accelerator Mastery and level.

### Simplified enemy stats

`getEnemyStatsAtWave` is a separate path. It:
- resolves HP and damage stat levels from skips and Battle Conditions;
- obtains base wave stats;
- obtains enemy type and enemy lab rules;
- applies perk multipliers unless `skipPagePerkMults` is set;
- floors returned HP and damage.

The simplified path calls `getWaveInfoEnemyStats` (floored type-rule result) before applying perk multipliers. The full Wave Info pipeline calls the unfloored helper and applies a single floor at the end. This is a meaningful implementation difference; do not assume both helpers produce identical rounding in every case.

The simplified path sets Improve Trade-off lab percent to 0 in its call to `waveInfoDisplayMultipliers`. The full panel path passes the resolved Improve Trade-off Perks lab percent into the pipeline. This is another source-path difference to preserve.

## 8. SDK test evidence reviewed

The tests reviewed assert:
- Fixed stage order `waveBase → workshop → typeRules → pagePerks`.
- Page perks are applied after type rules in the pipeline.
- Ordinary enemy lab totals are converted into additive percentage reductions and then multipliers.
- Boss Health uses the Workshop table float conversion, not the ordinary `1 − benefit%` formula.
- Vampire uses 2× HP and plain wave-base damage in the Wave Info helper.
- Scatter uses 2× HP and half wave-base damage.
- Ray uses plain wave-base HP and damage.
- Saboteur and Commander return zero damage in the Wave Info rule helper.
- Fleet-type rows use 20× base HP in the tested helper.
- Overcharge uses the wave-base damage multiplied by 1/65536 in the tested helper.
- Boss HP with level 30 Boss Health lab is approximately 0.46× the no-lab Boss HP in the tested path.

Tests were read, not executed by Samantha during this audit.

## 9. Internal differences and open questions

1. **Full pipeline vs simplified path:** one floors once after page perks; the other floors type rules before page perks.
2. **Improve Trade-off lab:** full panel supplies the lab value; simplified path passes zero.
3. **Boss Health:** dedicated Workshop table float conversion differs from ordinary enemy lab multiplier.
4. **Boss overheal:** constants and a helper exist, and the rule object has a flag, but the reviewed type-rule function does not call the helper. Trace other call sites before documenting its effect.
5. **Tank damageNoSpawnHalf:** flag is present in rule data but is not consumed by the reviewed damage resolver.
6. **Enemy Damage −%:** explicitly omitted from Wave Info rows in the page multiplier helper; separate run/combat paths need independent review.
7. **Overcharge damage:** this Wave Info row uses wave-1 base damage; do not confuse it with other Overcharge damage models.
8. **Panel extras:** spawn chance, speed and mass are delegated to another module and were not audited in this batch.

No conflict is resolved by choosing one helper as the correct live-game behavior.

## 10. GKB disposition

- Claim type: `OBJECTIVE` (SDK source behavior).
- Verification status: `EXTERNAL-UNVERIFIED`.
- SDK version: `0.14.1`.
- Game version: UNKNOWN unless explicitly stated by a particular source/test.
- Canonical GKB claims created: 0.
- Canonical relationships created: 0.
- Conflicts adjudicated: 0.
- SDK source files modified: 0.
- Samantha runtime tests executed: 0.

## 11. Next batch

Continue with the separate Drop Simulation modules:
1. `drops-simulation.ts`
2. `drops-wave-context.ts`
3. `drops-game-data.ts`
4. Related resource-drop constants, formulas and tests.

Keep save/run-derived measured counts separate from universal game knowledge. Preserve model assumptions and source-specific values side by side when they differ.
