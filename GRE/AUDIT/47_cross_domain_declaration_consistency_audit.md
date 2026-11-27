# Cross-Domain Declaration Consistency Audit — GRE Domains 01–20

## Objective

Compare all 20 domain JSON exports at the raw metadata declaration level to identify repeated type records, declaration differences, repeated decoded candidates, and same-name types that have different type indices. This is a structural consistency check, not a gameplay-mechanics validation or GKB promotion pass.

## Source scope

All 20 domain JSON blobs from `TestAccount` were retrieved by exact Git blob SHA and parsed.

- Total domain memberships: **1,059**
- Distinct type indices: **475**
- Type indices repeated in more than one domain: **97**
- Same-index full-record divergences: **0**
- Distinct decoded candidate keys (type index + field name): **1,299**
- Candidate keys repeated across domains: **121**
- Repeated candidate keys with differing decoded value or raw bytes: **0**

## Repeated type-index inventory

The same type index is the identity key. The type name alone is not sufficient.

| Type index | Type name | Domain occurrences | Domains |
|---:|---|---:|---|
| 78 | `ActiveStatsTracker` | 2 | 01, 04 |
| 129 | `BlackHoleController` | 2 | 05, 18 |
| 144 | `<>c` | 4 | 11, 16, 17, 18 |
| 145 | `Bots` | 4 | 11, 16, 17, 18 |
| 252 | `<>c__DisplayClass37_0` | 2 | 05, 18 |
| 253 | `DeathwaveController` | 2 | 05, 18 |
| 283 | `DissonanceBonusUI` | 2 | 03, 20 |
| 284 | `DissonanceBoost` | 2 | 03, 20 |
| 285 | `DissonanceInfoUI` | 2 | 03, 20 |
| 286 | `DissonanceType` | 2 | 03, 20 |
| 287 | `DissonantBoostDisplay` | 2 | 03, 20 |
| 288 | `DissonanceRemoteData` | 2 | 03, 20 |
| 289 | `DissonanceManager` | 2 | 03, 20 |
| 290 | `DissonanceTabButton` | 2 | 03, 20 |
| 291 | `DissonanceTypeIcon` | 2 | 03, 20 |
| 309 | `DamageReductionResult` | 4 | 02, 04, 17, 18 |
| 310 | `<>c__DisplayClass268_0` | 4 | 02, 04, 17, 18 |
| 311 | `<CoSafeDeactivate>d__321` | 4 | 02, 04, 17, 18 |
| 312 | `<CommanderBuffArea>d__267` | 4 | 02, 04, 17, 18 |
| 313 | `<GoldenTowerCheck>d__328` | 4 | 02, 04, 17, 18 |
| 314 | `Enemy` | 4 | 02, 04, 17, 18 |
| 394 | `<>c__DisplayClass26_0` | 2 | 05, 18 |
| 395 | `GoldenTower` | 2 | 05, 18 |
| 523 | `<>c` | 2 | 08, 17 |
| 524 | `<RebuildLayoutEndOfFrame>d__246` | 2 | 08, 17 |
| 525 | `Lab` | 2 | 08, 17 |
| 586 | `DamageData` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 587 | `HitData` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 588 | `LightspeedPathData` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 589 | `UpgradeType` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 590 | `UpgradeMultiplier` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 591 | `ClosestEnemyEntry` | 16 | 01, 02, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 592 | `<>c` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 593 | `<>c__DisplayClass1109_0` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 594 | `<>c__DisplayClass1128_0` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 595 | `<>c__DisplayClass1214_0` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 596 | `<>c__DisplayClass1216_0` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 597 | `<>c__DisplayClass1270_0` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 598 | `<>c__DisplayClass1271_0` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 599 | `<>c__DisplayClass1436_0` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 600 | `<>c__DisplayClass1474_0` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 601 | `<AdStartFunction>d__1413` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 602 | `<AutoRetryBattle>d__1391` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 603 | `<DeathRayFunction>d__1428` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 604 | `<DemonModeEffect>d__1362` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 605 | `<GameOverFunction>d__1388` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 606 | `<GameSpeedValidationLogFunction>d__1431` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 607 | `<GemBlockFunction>d__1418` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 608 | `<GrantRetroAchievementsDeferred>d__1095` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 609 | `<NukeImmortalityEffect>d__1376` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 610 | `<ProjectFundingCoroutine>d__1140` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 611 | `<RebuildWallFunction>d__1147` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 612 | `<SecondWindEffect>d__1348` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 613 | `<ShockwaveFunction>d__1435` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 614 | `<StartNewRoundFunction>d__1144` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 615 | `<StartNewRoundWallFunction>d__1146` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 616 | `<WallInvincibleEffect>d__1148` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 617 | `<_applyFTUEEnemySpawnDelay>d__1145` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 618 | `Main` | 15 | 01, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| 693 | `ModuleRandomTest` | 5 | 09, 16, 17, 18, 19 |
| 694 | `<>c` | 5 | 09, 16, 17, 18, 19 |
| 695 | `<>c__DisplayClass315_0` | 5 | 09, 16, 17, 18, 19 |
| 696 | `<>c__DisplayClass381_0` | 5 | 09, 16, 17, 18, 19 |
| 697 | `<>c__DisplayClass393_0` | 5 | 09, 16, 17, 18, 19 |
| 698 | `<FeaturedBannerDurationCheck>d__457` | 5 | 09, 16, 17, 18, 19 |
| 699 | `<GetAllModuleItems>d__135` | 5 | 09, 16, 17, 18, 19 |
| 700 | `<GetFeaturedBanners>d__440` | 5 | 09, 16, 17, 18, 19 |
| 701 | `<GetRotatingBanners>d__441` | 5 | 09, 16, 17, 18, 19 |
| 702 | `<RotatingBannerDurationCheck>d__458` | 5 | 09, 16, 17, 18, 19 |
| 703 | `ModuleManager` | 5 | 09, 16, 17, 18, 19 |
| 873 | `PlayerData` | 7 | 06, 07, 08, 10, 13, 16, 19 |
| 874 | `BetaModuleConfig` | 3 | 09, 19, 20 |
| 875 | `BetaModule` | 3 | 09, 19, 20 |
| 927 | `StatsValueCalculator` | 3 | 01, 04, 17 |
| 1010 | `<>c` | 2 | 04, 12 |
| 1011 | `<>c__DisplayClass102_0` | 2 | 04, 12 |
| 1012 | `<>c__DisplayClass105_0` | 2 | 04, 12 |
| 1013 | `<>c__DisplayClass107_0` | 2 | 04, 12 |
| 1014 | `<>c__DisplayClass110_0` | 2 | 04, 12 |
| 1015 | `<>c__DisplayClass112_0` | 2 | 04, 12 |
| 1016 | `<>c__DisplayClass113_0` | 2 | 04, 12 |
| 1017 | `<>c__DisplayClass114_0` | 2 | 04, 12 |
| 1018 | `<>c__DisplayClass115_0` | 2 | 04, 12 |
| 1019 | `<>c__DisplayClass116_0` | 2 | 04, 12 |
| 1020 | `<>c__DisplayClass117_0` | 2 | 04, 12 |
| 1021 | `<>c__DisplayClass78_0` | 2 | 04, 12 |
| 1022 | `<>c__DisplayClass92_0` | 2 | 04, 12 |
| 1023 | `<>c__DisplayClass99_0` | 2 | 04, 12 |
| 1024 | `<AbilityRoutine>d__81` | 2 | 04, 12 |
| 1025 | `<CleanupFailEffect>d__123` | 2 | 04, 12 |
| 1026 | `<DOSteal>d__101` | 2 | 04, 12 |
| 1027 | `<FetchSequence>d__112` | 2 | 04, 12 |
| 1028 | `<StartAllyEffect>d__91` | 2 | 04, 12 |
| 1029 | `<StartAttackEffect>d__104` | 2 | 04, 12 |
| 1030 | `TowerBuddy` | 2 | 04, 12 |
| 1086 | `UltimateWeaponStats` | 2 | 05, 17 |
| 1092 | `VaultEnemyTile` | 2 | 02, 15 |

## Same-index declaration comparison

**Result: 0 divergent full records among 97 repeated type indices.**

Every repeated type record compared byte-for-byte equivalent at the parsed JSON object level across the domain exports, including fields, method signatures/parameters, properties, tokens/offsets, parent/declaring references, event count, and raw type-record hex. The topical domain files therefore provide repeated views of the same assembly metadata records, not independent extractions of those same type records.

Examples of broad reuse:
- `Main` (#618) and common helper records #586–#617 appear in 15 domain exports.
- `ClosestEnemyEntry` (#591) appears in 16 domain exports.
- `PlayerData` (#873) appears in seven domain exports.
- `ModuleManager` (#703) appears in five domain exports.
- `Bots` (#145) appears in four domain exports.

## Repeated decoded candidate comparison

There are 121 candidate keys repeated across domain exports. None has different decoded values or raw bytes in this source set.

This is internal consistency of duplicated exports only. It does not independently validate the decoder, prove runtime use, or establish game-version applicability.

## Same-name types with different type indices

These names occur at multiple type indices and must remain separate until identity is established by metadata token, namespace, and declaring type rather than name matching alone.

| Type name | Distinct type indices |
|---|---|
| `<>c` | 113, 144, 176, 219, 239, 329, 523, 541, 592, 644, 675, 694, 722, 776, 877, 966, 969, 993, 1010 |
| `<CoSafeDeactivate>d__11` | 134, 320 |
| `<>c__DisplayClass21_0` | 421, 989 |
| `<>c__DisplayClass36_0` | 158, 1083 |
| `<>c__DisplayClass19_0` | 220, 676 |
| `<>c__DisplayClass315_0` | 648, 695, 730 |
| `Tab` | 643, 721 |
| `<>c__DisplayClass312_0` | 645, 727 |
| `<>c__DisplayClass313_0` | 646, 728 |
| `<>c__DisplayClass314_0` | 647, 729 |
| `<>c__DisplayClass316_0` | 649, 731 |
| `<>c__DisplayClass317_0` | 650, 732 |
| `<>c__DisplayClass318_0` | 651, 733 |
| `MissionType` | 236, 639 |
| `ValueType` | 237, 640 |

Important examples:
- `MissionType` exists at #236 and #639.
- `ValueType` exists at #237 and #640.
- `Tab` exists at #643 and #721.
- Compiler-generated `<>c` records occur at many different indices and are distinct generated types.

## Interpretation and limits

- **VERIFIED:** the 20 source files contain 1,059 domain memberships and 475 distinct type indices.
- **VERIFIED:** 97 type indices recur across domains; all 97 repeated records are identical across the inspected exports.
- **VERIFIED:** 121 repeated decoded candidate keys have matching values and raw bytes.
- **VERIFIED:** same-name types at different indices exist and must not be merged automatically.
- **NOT ESTABLISHED:** whether a declared method executes as its name suggests, how a formula is calculated, how effects stack, or whether a constant is active in a particular game release.
- **NOT ESTABLISHED:** absence of conflicts across all fanmade sources. This comparison covers only the GRE metadata package, not all external community sources.
- No semantic relationship was inferred solely from shared type membership.
- No claims were promoted to GKB.

## Next phase

The structural cross-domain consistency pass is complete. A semantic relationship/evidence review of selected mechanics and decoded candidates remains. Different fanmade source claims will be preserved side by side where they disagree; no automatic winner selection will be performed.
