# Domain 17 — Formulas and Calculations: Complete Structural Metadata Audit

## Scope and source identity

- Repository ref: `TestAccount`
- JSON source: `GRE/2/17_formulas_calculations.json`
- JSON blob SHA: `b6cc574abe109730d7140ca8525a8d14e071144a`
- Companion index: `GRE/2/17_formulas_calculations.md`
- Markdown blob SHA: `c1f59ee05f28e1f0289f9283526d3414a5caf72a`
- Source label: `Assembly-CSharp.dll metadata v39`
- Declared type indices: 57
- JSON evidence label: `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`

The metadata label does not identify a verified game release. The export provides class declarations, method signatures, and decoded constant candidates, but no method bodies/IL. This audit inventories the available structures and calculation-related interfaces; it does not derive formulas from method names.

## Complete structural inventory

The JSON contains 57 type records, 1,701 fields, 1,257 methods, and 229 properties.

| Type index | Type name | Fields | Methods | Properties |
|---:|---|---:|---:|---:|
| 144 | `<>c` | 2 | 3 | 0 |
| 145 | `Bots` | 47 | 58 | 7 |
| 309 | `DamageReductionResult` | 11 | 0 | 0 |
| 310 | `<>c__DisplayClass268_0` | 2 | 3 | 0 |
| 311 | `<CoSafeDeactivate>d__321` | 3 | 6 | 2 |
| 312 | `<CommanderBuffArea>d__267` | 5 | 6 | 2 |
| 313 | `<GoldenTowerCheck>d__328` | 3 | 6 | 2 |
| 314 | `Enemy` | 215 | 117 | 16 |
| 523 | `<>c` | 3 | 4 | 0 |
| 524 | `<RebuildLayoutEndOfFrame>d__246` | 5 | 6 | 2 |
| 525 | `Lab` | 181 | 75 | 3 |
| 586 | `DamageData` | 3 | 1 | 0 |
| 587 | `HitData` | 2 | 2 | 0 |
| 588 | `LightspeedPathData` | 3 | 1 | 0 |
| 589 | `UpgradeType` | 10 | 0 | 0 |
| 590 | `UpgradeMultiplier` | 2 | 1 | 0 |
| 591 | `ClosestEnemyEntry` | 2 | 1 | 0 |
| 592 | `<>c` | 11 | 12 | 0 |
| 593 | `<>c__DisplayClass1109_0` | 1 | 3 | 0 |
| 594 | `<>c__DisplayClass1128_0` | 1 | 3 | 0 |
| 595 | `<>c__DisplayClass1214_0` | 6 | 0 | 0 |
| 596 | `<>c__DisplayClass1216_0` | 4 | 0 | 0 |
| 597 | `<>c__DisplayClass1270_0` | 2 | 2 | 0 |
| 598 | `<>c__DisplayClass1271_0` | 2 | 3 | 0 |
| 599 | `<>c__DisplayClass1436_0` | 3 | 2 | 0 |
| 600 | `<>c__DisplayClass1474_0` | 1 | 2 | 0 |
| 601 | `<AdStartFunction>d__1413` | 4 | 6 | 2 |
| 602 | `<AutoRetryBattle>d__1391` | 4 | 6 | 2 |
| 603 | `<DeathRayFunction>d__1428` | 4 | 6 | 2 |
| 604 | `<DemonModeEffect>d__1362` | 4 | 6 | 2 |
| 605 | `<GameOverFunction>d__1388` | 5 | 6 | 2 |
| 606 | `<GameSpeedValidationLogFunction>d__1431` | 3 | 6 | 2 |
| 607 | `<GemBlockFunction>d__1418` | 3 | 6 | 2 |
| 608 | `<GrantRetroAchievementsDeferred>d__1095` | 2 | 6 | 2 |
| 609 | `<NukeImmortalityEffect>d__1376` | 3 | 6 | 2 |
| 610 | `<ProjectFundingCoroutine>d__1140` | 5 | 6 | 2 |
| 611 | `<RebuildWallFunction>d__1147` | 3 | 6 | 2 |
| 612 | `<SecondWindEffect>d__1348` | 4 | 6 | 2 |
| 613 | `<ShockwaveFunction>d__1435` | 3 | 6 | 2 |
| 614 | `<StartNewRoundFunction>d__1144` | 4 | 6 | 2 |
| 615 | `<StartNewRoundWallFunction>d__1146` | 3 | 6 | 2 |
| 616 | `<WallInvincibleEffect>d__1148` | 7 | 6 | 2 |
| 617 | `<_applyFTUEEnemySpawnDelay>d__1145` | 3 | 6 | 2 |
| 618 | `Main` | 946 | 487 | 62 |
| 693 | `ModuleRandomTest` | 4 | 0 | 0 |
| 694 | `<>c` | 6 | 7 | 0 |
| 695 | `<>c__DisplayClass315_0` | 4 | 4 | 0 |
| 696 | `<>c__DisplayClass381_0` | 5 | 3 | 0 |
| 697 | `<>c__DisplayClass393_0` | 1 | 2 | 0 |
| 698 | `<FeaturedBannerDurationCheck>d__457` | 3 | 6 | 2 |
| 699 | `<GetAllModuleItems>d__135` | 5 | 8 | 2 |
| 700 | `<GetFeaturedBanners>d__440` | 4 | 6 | 2 |
| 701 | `<GetRotatingBanners>d__441` | 4 | 6 | 2 |
| 702 | `<RotatingBannerDurationCheck>d__458` | 3 | 6 | 2 |
| 703 | `ModuleManager` | 110 | 294 | 89 |
| 927 | `StatsValueCalculator` | 0 | 8 | 0 |
| 1086 | `UltimateWeaponStats` | 12 | 1 | 0 |

## Enemy damage, reduction, and reward calculation declarations

### Enemy (#314)

The `Enemy` record contains 215 fields, 117 methods, and 16 properties. Its declared methods cover:
- Enemy movement, updates, estimated position, attack intervals, and spawn/deactivation.
- Damage reception and mitigation interfaces: `CalculateDamageReductionResult`, `ApplyDamageReductionStats`, `ProjectileDamage`, `ApplyProjectileDamage`, `HitMultiplier`, and `RenderArmorMultiplier`.
- Damage-source methods for Thorn, Electron, Orb, Energy Net, Death Ray, Smart Missiles, dropped/Inner Land Mines, Death Wave, Black Hole, Flame Bot, Poison Swamp, Lightning, Guardian attack, and wall attacks.
- Crowd-control and status interfaces: `CountCrowdControl`, `ApplyStun`, `GetTitanShockReduction`, `GetTitanShockAttackSpeedSlow`, `GetThunderBotLinger`, `GetWildfireAmplification`, and other bonus getters.
- Reward-related methods: `GoldenTowerBonus`, `CoinBotBonus`, `EnemyBalanceBonus`, `BlackHoleCoinBonus`, `OrbCoinBonus`, `BountyCoinBonus`, `SpotlightCoinBonus`, `DeathWaveCoinBonus`, `DeathWaveCellBonus`, and `LivedWavesCoins`.

### DamageReductionResult (#309)

The result structure declares `finalDamage`, `incomingDamage`, and individual block fields for Chain Thunder, Chrono Field, Flame Bot, Magic Orb, Primordial Collapse, defense percent, defense absolute, Bastion, and Bastion pool usage. This documents the output fields available to the reduction interface, not the calculation order or arithmetic.

## Decoded Enemy constant candidates

The source JSON marks 44 Enemy fields as decoded candidates. The companion Markdown records their names, values, and candidate decoding. Examples include:
- `RAY_SHOT_COOLDOWN=30`
- `MELEE_ATTACK_RANGE≈0.3`
- `SCATTER_SPLITS=4`, `SCATTER_SPLITS_ULTIMATE=5`
- `NEAR_WALL_SPEED_LIMIT=4.5`
- Enemy size candidates for Basic, Fast, Tank, Boss, Ranged, Protector, Vampire, Scatter, Ray, Saboteur, Commander, and Overcharge.
- Saboteur/Commander/Overcharge interval, buff, duration, exponent, and wave-threshold candidates.
- `MISS_DECAY=0.875`, `STUN_DECAY≈0.995`, `DEATH_DEFY_DECAY≈0.9`.
- Pulsar Harvester diminished-return candidates: minimum 100, maximum 400, constant 1500, maximum procs 399.

The values are kept as decoded candidates with their raw bytes and decoder labels in the source JSON. Names and values alone do not establish units, application timing, clamping, or the exact formulas.

## Lab research and calculation interfaces

`Lab` (#525) contains 181 fields, 75 methods, and 3 properties. Relevant declarations include research name/description, level/max level, base/current coin cost, base/current time, progress, benefit/current-next benefit, unlock tier/milestone, research category/search/favorite/queue state, and speed-up state.

Methods include:
- Research setup and state: `Initialize`, `CheckNewResearches`, `ResearchComplete`, `ResearchRequirementsMet`, `AnyResearchAvailable`, `LabAssignResearch`, `ConfirmAssignResearch`, `IncrementLabResearchLevel`, `LabCancel`.
- Cost/time and unlock interfaces: `InstantCompleteCostCalc`, `LabUpgradeCostCalc`, `LabUnlockButton`, `DoLabUnlock`, `BoostHours`, `BoostMultiplier`.
- Speed-up and discount: `CalculateLabRushGoldBoxDiscount`, `GetNumGoldBoxLabs`.
- Research-specific completion handlers for Range, Shockwave, Swamp Range, Bot upgrades, and Enemy research.

Decoded candidates in this type:
- `RESEARCH_LIMIT=260`
- `LAB_RUSH_GOLD_BOX_DISCOUNT≈0.015`

The export does not include the research catalog, level-by-level tables, or method implementations. These declarations therefore do not establish specific lab formulas, research durations, costs, or current maximums.

## StatsValueCalculator (#927)

This type has no fields or properties and declares eight methods:
- `GetStatValue(valueType, panelType, dataSource)`
- `GetStatValue(statDefinition, panelType, dataSource)`
- `GetCurrentRoundValue`
- `GetBattleHistoryValue`
- `GetNumericStatValue`
- `GetCurrentRoundNumericValue`
- `GetBattleHistoryNumericValue`
- `GetTierValue`

The signatures indicate separate formatted-string and numeric-value APIs for stat display/current-round/history contexts. They do not expose the implementation of any individual statistic or formula.

## UltimateWeaponStats (#1086)

This type declares 12 fields: ChainLightningDamage, SmartMissilesDamage, DeathWaveDamage, InnerLandMinesDamage, PoisonSwampDamage, PoisonSwampDuration, PoisonSwampCooldown, GoldenTowerBonusCost, SpotlightAngleCost, and three plus-cost exponent/scale fields (`plusCostsExpHigh`, `plusCostsExpLow`, `plusCostsMid`), plus any backing/declaration fields included in the record. It declares a static constructor. The presence of these names establishes a centralized data structure for selected UW stat/cost values, but not the values or calculation rules themselves.

## Bots, Modules, and Main overlap

This domain includes shared records also present in their own domain exports:
- `Bots` (#145): 47 fields, 58 methods, 7 properties; bot benefit/cost, Bot+, preset, respec, and Synchronicity interfaces.
- `ModuleManager` (#703): 110 fields, 294 methods, 89 properties; module benefit/cost, merge/unmerge, drops, rerolls, level-up, assist modules, and banner interfaces.
- `Main` (#618): 946 fields, 487 methods, 62 properties; shared combat and game calculation methods.
- `UpgradeType` (#589) repeats the attack/defense/utility/workshop/enhancement category enum declaration.

Do not count repeated types as separate independent corroboration. Preserve the domain-specific source occurrence and reconcile duplicate declarations during the final cross-domain audit.

## Decoded constant inventory

The JSON contains 104 fields marked `DECODED_CANDIDATE`:
- Bots: 4
- Enemy: 44
- Lab: 2
- UpgradeType: 9
- Main: 29
- ModuleManager: 16

Raw bytes, decoded values, and decoder labels are preserved in the JSON. This report does not silently upgrade the source's candidate status to a verified live mechanic.

## Metadata-reference completeness

Across all 57 records:
- Field type references: 0/1,701 have resolved type names.
- Method return type references: 1,234/1,257 are resolved.
- Method parameter type references: 635/766 are resolved.
- Properties: 229; property type information is represented through accessor references rather than a direct resolved property type in this export.

Missing field type names are an export limitation, not evidence that fields lack types.

## Audit result

- Structural inventory: **COMPLETE** for all 57 records in the inspected JSON.
- Enemy damage/reduction/reward interfaces: **DOCUMENTED** at declaration/signature level.
- Enemy constants: **RECORDED** as decoded candidates with source traceability.
- Lab research and calculation interfaces: **DOCUMENTED**.
- StatsValueCalculator and UltimateWeaponStats declarations: **DOCUMENTED**.
- Cross-domain Bots, Modules, and Main overlap: **DOCUMENTED**.
- Exact damage-reduction order, damage formulas, enemy scaling equations, reward multipliers, lab costs/times, and stat display calculation logic: **NOT ESTABLISHED** by the metadata declarations alone.
- Game release version: **NOT IDENTIFIED** by `metadata v39` alone.
- GKB promotion: **NOT PERFORMED**; this is an audit note only.

## Next audit target

Inspect the repository tree for the next available domain sources. The numbered files currently identified under `GRE/2` end at Domain 17; do not assume Domains 18–20 exist as separate exports until confirmed.
