# Domain 18 — Strategy Interactions: Complete Structural Metadata Audit

## Scope and source identity

- Repository ref: `TestAccount`
- JSON source: `GRE/3/18_strategy_interactions.json`
- JSON blob SHA: `2cf4d5b8867bea26919d3a228a44da8a44a0c35b`
- Companion index: `GRE/3/18_strategy_interactions.md`
- Markdown blob SHA: `a90be9f89548c40f5b8e973a0ee1ad2f67acf419`
- Source label: `Assembly-CSharp.dll metadata v39`
- Declared type indices: 58
- JSON evidence label: `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`

## Complete structural inventory

The JSON contains 58 type records, 1,565 fields, 1,247 methods, and 235 properties.

| Type index | Type name | Fields | Methods | Properties |
|---:|---|---:|---:|---:|
| 129 | `BlackHoleController` | 12 | 16 | 3 |
| 144 | `<>c` | 2 | 3 | 0 |
| 145 | `Bots` | 47 | 58 | 7 |
| 252 | `<>c__DisplayClass37_0` | 3 | 2 | 0 |
| 253 | `DeathwaveController` | 22 | 18 | 2 |
| 309 | `DamageReductionResult` | 11 | 0 | 0 |
| 310 | `<>c__DisplayClass268_0` | 2 | 3 | 0 |
| 311 | `<CoSafeDeactivate>d__321` | 3 | 6 | 2 |
| 312 | `<CommanderBuffArea>d__267` | 5 | 6 | 2 |
| 313 | `<GoldenTowerCheck>d__328` | 3 | 6 | 2 |
| 314 | `Enemy` | 215 | 117 | 16 |
| 392 | `GlobalPresetManager` | 14 | 27 | 4 |
| 394 | `<>c__DisplayClass26_0` | 2 | 5 | 0 |
| 395 | `GoldenTower` | 12 | 16 | 2 |
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

## Strategy interaction declarations

This domain is a cross-cutting collection of systems that interact during battle or affect the selected build:

- `BlackHoleController` (#129): Black Hole active state, duration/alpha properties, play/timer/stop methods, mission count update, and Black Hole Plus damage interface.
- `DeathwaveController` (#253): effect-wave count/timer, final-wave state, play/resume, effect-wave firing, Death Wave effects, and FireDeathWave interface.
- `GoldenTower` (#395): active/duration properties, play/timer, VFX handling, and Golden Tower Plus reward interface.
- `GlobalPresetManager` (#392): global preset count/state and context selection for tier, tournament, and dissonant contexts; methods to apply Workshop, Cards, Bots, Modules, and Guardians.
- `Enemy` (#314): damage, crowd control, status, enemy interactions, and reward calculation interfaces, also inventoried in Domain 17.
- `Bots` (#145): Bot/Bot+ benefits, preset application, respec, and Synchronicity interfaces.
- `ModuleManager` (#703): module equipment, bonuses, merge, drop, reroll, and assist module interfaces.

These declarations identify interaction surfaces and named systems. They do not prove a specific strategy, priority order, additive/multiplicative stacking rule, or universal build recommendation.

## Global preset candidates

`GlobalPresetManager` has 14 fields, 27 methods, and 4 properties. Decoded constant candidates include:
- `GLOBAL_BASE_PRESETS=2`
- `NONE_PRESET_INDEX=5`

Its context fields include `TIER_CONTEXT`, `TOURNAMENT_CONTEXT`, and `DISSONANT_CONTEXT`; it declares methods to save active presets, select context presets, revert to active/none, estimate medal needs after a run, and apply Workshop/Cards/Bots/Modules/Guardians. The metadata does not establish the exact preset eligibility or cost rules.

## Decoded constant inventory

The JSON contains 104 fields marked `DECODED_CANDIDATE`:
- Bots: 4
- Enemy: 43
- GlobalPresetManager: 2
- UpgradeType: 9
- Main: 29
- ModuleManager: 17

Raw bytes, decoded values, and decoder labels remain in the source JSON. Repeated types also appear in other domains; these occurrences are not independent corroboration.

## Metadata-reference completeness

Across all 58 records:
- Field type references: 0/1,565 have resolved type names.
- Method return type references: 1,227/1,247 are resolved.
- Method parameter type references: 613/754 are resolved.
- Properties: 235; property type information is represented through accessor references rather than a direct resolved property type in this export.

## Audit result

- Structural inventory: **COMPLETE** for all 58 records.
- Black Hole, Death Wave, Golden Tower, Global Preset, Enemy, Bots, and Modules interaction declarations: **DOCUMENTED**.
- Decoded candidates: **RECORDED** with source traceability.
- Exact strategy outcomes, damage/reward stacking, timing synchronization, preset context eligibility, and cross-system order of operations: **NOT ESTABLISHED** by declarations alone.
- Game release version: **NOT IDENTIFIED** by `metadata v39` alone.
- GKB promotion: **NOT PERFORMED**.

## Next audit target

Domain 19 — Version History.
