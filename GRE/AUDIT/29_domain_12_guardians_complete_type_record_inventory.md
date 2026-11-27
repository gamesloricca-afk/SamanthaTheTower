# GRE Audit 29 — Domain 12: complete type-record declaration inventory

- Audit ID: `GRE-AUDIT-029`
- Inspection date: 2026-11-27
- Repository: `gamesloricca-afk/SamanthaTheTower`
- Branch: `TestAccount`
- Source JSON: `GRE/2/12_guardians.json`
- Source JSON blob SHA: `b90726fbdc2425c0aed6b7a7830b1d73ae3eb05c`
- Scope: enumerate every type record and its field/method/property counts, directly from the complete JSON. This is a structural inventory, not a gameplay interpretation.

## 1. Complete record inventory

| Type index | Type name | Fields | Methods | Properties |
|---:|---|---:|---:|---:|
| 400 | `GuardianPresetData` | 6 | 15 | 6 |
| 401 | `BuddyModifierDetails` | 14 | 12 | 3 |
| 408 | `ChipTileUI` | 8 | 10 | 0 |
| 412 | `ChipType` | 12 | 0 | 0 |
| 413 | `GuardianChips` | 7 | 16 | 2 |
| 414 | `GuardianPresetsUI` | 5 | 5 | 1 |
| 420 | `GuildBuddySlotUI` | 9 | 8 | 0 |
| 421 | `<>c__DisplayClass21_0` | 2 | 2 | 0 |
| 422 | `GuildBuddyUI` | 10 | 14 | 4 |
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
| 853 | `RespecGuardianUI` | 7 | 3 | 1 |
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
| 1031 | `TowerBuddyAbility` | 7 | 8 | 3 |
| **Total** | **65 type records** | **1,274** | **858** | **134** |

## 2. Interpretation boundaries

- This table records the counts of declarations included in the JSON export. It does not prove that every declared method is reachable or executed in a live game.
- Compiler-generated closures and coroutine state-machine records are included because they are present in the source type list. They are not independent gameplay systems.
- Type #618 `Main` is a shared controller included in this domain extract; its 946 fields, 487 methods, and 62 properties must not be treated as Guardian-only declarations.
- Shared records #586–#618 overlap with other domains. They should be deduplicated by source identity when building a cross-domain inventory, not copied as separate game mechanics.
- The export has unresolved field type references and partial method signature resolution, as quantified in Audit 27.
- No method bodies/IL were available in this JSON. Runtime behavior remains outside the scope of this inventory.

## 3. Completion assessment

**Structural record enumeration: COMPLETE** for the 65 records present in this file.

**Behavioral audit: INCOMPLETE / SOURCE-LIMITED.** Exact costs, refund rules, cooldowns, reward generation, daily-limit enforcement, and ability effects cannot be concluded from declaration counts or names.

**GKB disposition:** no claims promoted. Preserve decoded constants as candidates and all unknowns as explicit gaps.
