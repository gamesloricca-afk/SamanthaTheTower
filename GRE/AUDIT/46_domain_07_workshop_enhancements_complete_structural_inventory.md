# Domain 07 — Workshop Enhancements: Complete Structural Inventory

## Source identity

- Repository ref: `TestAccount`
- JSON: `GRE/1/07_workshop_enhancements.json`
- JSON blob SHA: `7a87191040379798443569fd6afcd2daa12655e2`
- Companion Markdown: `GRE/1/07_workshop_enhancements.md`
- Markdown blob SHA: `5fe49524e77c2378b0056d034e9d15f751c814de`
- Source binary identity from existing domain review: manifest SHA-256 `8266355fab717d91b51482122b66551afc62502b0f62fd8527930962cbefe81c`
- Metadata format label: v39 (not a verified game release identifier)
- JSON evidence label: `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`

## Complete structural inventory

The parsed JSON contains 34 type records: 8 named/non-generated records and 26 compiler-generated/helper records by the simple name-prefix classification.

| Type index | Type name | Fields | Methods | Properties |
|---:|---|---:|---:|---:|
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
| 873 | `PlayerData` | 836 | 1674 | 835 |

Totals: **1899 fields, 2296 methods, 931 properties**.

## Decoded constant inventory

- Fields marked `DECODED_CANDIDATE`: **38**.
- Per-type candidate counts: `UpgradeType` 9; `Main` 29.
- Raw bytes, decoded values, and decoder labels remain in the JSON. The earlier domain review notes contain selected semantic details and limitations; this inventory does not independently promote decoded candidates into runtime mechanics.

## Metadata-reference completeness

- Field type references: 0/1899 resolved.
- Method return type references: 2105/2296 resolved.
- Method parameter type references: 892/1143 resolved.
- Properties: 931; property type information is represented through accessor references rather than a direct resolved property type in this export.

## Relationship to existing domain review

The detailed content review remains in [08_domain_07_workshop_enhancements.md](08_domain_07_workshop_enhancements.md). This new document adds a complete per-type structural inventory and aggregate metadata-reference counts. The original GRE files are unchanged.

## Audit result

- Structural inventory: **COMPLETE** for all 34 records in the inspected JSON.
- Existing domain content review: **RETAINED**; see linked audit note above.
- Runtime behavior: use the limitations and evidence labels in the existing content review; method/field declarations alone do not prove runtime behavior.
- Game release version: **NOT IDENTIFIED** by metadata format v39 alone.
- GKB promotion: **NOT PERFORMED**.

