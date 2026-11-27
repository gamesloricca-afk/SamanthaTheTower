# Domain 04 — Combat Mechanics: Complete Structural Inventory

## Source identity

- Repository ref: `TestAccount`
- JSON: `GRE/1/04_combat_mechanics.json`
- JSON blob SHA: `624399b1d05c122e50ea2d012463372bce475620`
- Companion Markdown: `GRE/1/04_combat_mechanics.md`
- Markdown blob SHA: `9709283bd30be02830d6d3e47755728e2a3288a4`
- Source binary identity from existing domain review: manifest SHA-256 `8266355fab717d91b51482122b66551afc62502b0f62fd8527930962cbefe81c`
- Metadata format label: v39 (not a verified game release identifier)
- JSON evidence label: `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`

## Complete structural inventory

The parsed JSON contains 79 type records: 25 named/non-generated records and 54 compiler-generated/helper records by the simple name-prefix classification.

| Type index | Type name | Fields | Methods | Properties |
|---:|---|---:|---:|---:|
| 78 | `ActiveStatsTracker` | 15 | 16 | 1 |
| 249 | `DeathRay` | 5 | 11 | 0 |
| 250 | `DeathRayController` | 3 | 5 | 0 |
| 309 | `DamageReductionResult` | 11 | 0 | 0 |
| 310 | `<>c__DisplayClass268_0` | 2 | 3 | 0 |
| 311 | `<CoSafeDeactivate>d__321` | 3 | 6 | 2 |
| 312 | `<CommanderBuffArea>d__267` | 5 | 6 | 2 |
| 313 | `<GoldenTowerCheck>d__328` | 3 | 6 | 2 |
| 314 | `Enemy` | 215 | 117 | 16 |
| 514 | `TargetPriorityIndexPositions` | 11 | 0 | 0 |
| 537 | `<DoExplode>d__35` | 3 | 6 | 2 |
| 538 | `<DoMoveToTarget>d__37` | 4 | 6 | 2 |
| 539 | `LandMine` | 23 | 17 | 2 |
| 540 | `MineType` | 5 | 0 | 0 |
| 541 | `<>c` | 2 | 3 | 0 |
| 542 | `LandMineController` | 16 | 16 | 2 |
| 551 | `LifeSaverType` | 7 | 0 | 0 |
| 553 | `LifeSavingOrderingPanel` | 4 | 13 | 2 |
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
| 788 | `<CoSafeDeactivate>d__19` | 3 | 6 | 2 |
| 789 | `Projectile` | 11 | 10 | 0 |
| 790 | `ProjectileType` | 3 | 0 | 0 |
| 896 | `Shock` | 1 | 2 | 0 |
| 897 | `ShockManager` | 2 | 3 | 0 |
| 898 | `Shockwave` | 3 | 5 | 0 |
| 927 | `StatsValueCalculator` | 0 | 8 | 0 |
| 1010 | `<>c` | 3 | 4 | 0 |
| 1011 | `<>c__DisplayClass102_0` | 4 | 3 | 0 |
| 1012 | `<>c__DisplayClass105_0` | 4 | 3 | 0 |
| 1013 | `<>c__DisplayClass107_0` | 3 | 3 | 0 |
| 1014 | `<>c__DisplayClass110_0` | 2 | 2 | 0 |
| 1015 | `<>c__DisplayClass112_0` | 2 | 2 | 0 |
| 1016 | `<>c__DisplayClass113_0` | 1 | 5 | 0 |
| 1017 | `<>c__DisplayClass114_0` | 1 | 2 | 0 |
| 1018 | `<>c__DisplayClass115_0` | 1 | 2 | 0 |
| 1019 | `<>c__DisplayClass116_0` | 1 | 2 | 0 |
| 1020 | `<>c__DisplayClass117_0` | 1 | 2 | 0 |
| 1021 | `<>c__DisplayClass78_0` | 2 | 3 | 0 |
| 1022 | `<>c__DisplayClass92_0` | 4 | 3 | 0 |
| 1023 | `<>c__DisplayClass99_0` | 3 | 3 | 0 |
| 1024 | `<AbilityRoutine>d__81` | 3 | 6 | 2 |
| 1025 | `<CleanupFailEffect>d__123` | 5 | 6 | 2 |
| 1026 | `<DOSteal>d__101` | 3 | 6 | 2 |
| 1027 | `<FetchSequence>d__112` | 4 | 6 | 2 |
| 1028 | `<StartAllyEffect>d__91` | 8 | 6 | 2 |
| 1029 | `<StartAttackEffect>d__104` | 8 | 6 | 2 |
| 1030 | `TowerBuddy` | 61 | 68 | 6 |

Totals: **1547 fields, 1030 methods, 149 properties**.

## Decoded constant inventory

- Fields marked `DECODED_CANDIDATE`: **114**.
- Per-type candidate counts: `ActiveStatsTracker` 4; `Enemy` 43; `TargetPriorityIndexPositions` 10; `MineType` 4; `LandMineController` 1; `LifeSaverType` 6; `UpgradeType` 9; `Main` 29; `Projectile` 1; `ProjectileType` 2; `TowerBuddy` 5.
- Raw bytes, decoded values, and decoder labels remain in the JSON. The earlier domain review notes contain selected semantic details and limitations; this inventory does not independently promote decoded candidates into runtime mechanics.

## Metadata-reference completeness

- Field type references: 0/1547 resolved.
- Method return type references: 1013/1030 resolved.
- Method parameter type references: 412/512 resolved.
- Properties: 149; property type information is represented through accessor references rather than a direct resolved property type in this export.

## Relationship to existing domain review

The detailed content review remains in [05_domain_04_combat_mechanics.md](05_domain_04_combat_mechanics.md). This new document adds a complete per-type structural inventory and aggregate metadata-reference counts. The original GRE files are unchanged.

## Audit result

- Structural inventory: **COMPLETE** for all 79 records in the inspected JSON.
- Existing domain content review: **RETAINED**; see linked audit note above.
- Runtime behavior: use the limitations and evidence labels in the existing content review; method/field declarations alone do not prove runtime behavior.
- Game release version: **NOT IDENTIFIED** by metadata format v39 alone.
- GKB promotion: **NOT PERFORMED**.

