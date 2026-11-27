# Domain 02 — Enemies: Complete Structural Inventory

## Source identity

- Repository ref: `TestAccount`
- JSON: `GRE/1/02_enemies.json`
- JSON blob SHA: `4e2419bbb156bac83e343ffdc9a5a7dcff3ae4b0`
- Companion Markdown: `GRE/1/02_enemies.md`
- Markdown blob SHA: `73674dd08de172fc4da63a6524d4a2ffb3bc2610`
- Source binary identity from existing domain review: manifest SHA-256 `8266355fab717d91b51482122b66551afc62502b0f62fd8527930962cbefe81c`
- Metadata format label: v39 (not a verified game release identifier)
- JSON evidence label: `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`

## Complete structural inventory

The parsed JSON contains 31 type records: 21 named/non-generated records and 10 compiler-generated/helper records by the simple name-prefix classification.

| Type index | Type name | Fields | Methods | Properties |
|---:|---|---:|---:|---:|
| 132 | `BossNet` | 6 | 3 | 0 |
| 133 | `BossNetHit` | 2 | 3 | 0 |
| 134 | `<CoSafeDeactivate>d__11` | 3 | 6 | 2 |
| 135 | `BossProjectile` | 7 | 6 | 0 |
| 278 | `DevPanelBattle1EnemyCounts` | 4 | 0 | 0 |
| 309 | `DamageReductionResult` | 11 | 0 | 0 |
| 310 | `<>c__DisplayClass268_0` | 2 | 3 | 0 |
| 311 | `<CoSafeDeactivate>d__321` | 3 | 6 | 2 |
| 312 | `<CommanderBuffArea>d__267` | 5 | 6 | 2 |
| 313 | `<GoldenTowerCheck>d__328` | 3 | 6 | 2 |
| 314 | `Enemy` | 215 | 117 | 16 |
| 315 | `DamageSource` | 22 | 0 | 0 |
| 316 | `PoolType` | 11 | 0 | 0 |
| 317 | `EnemyType` | 15 | 0 | 0 |
| 318 | `FleetType` | 4 | 0 | 0 |
| 320 | `<CoSafeDeactivate>d__11` | 3 | 6 | 2 |
| 321 | `EnemyProjectile` | 7 | 6 | 0 |
| 591 | `ClosestEnemyEntry` | 2 | 1 | 0 |
| 634 | `MiniBossController` | 6 | 10 | 0 |
| 635 | `MiniBossSetup` | 3 | 1 | 0 |
| 636 | `MiniBossSpawnEntry` | 2 | 1 | 0 |
| 637 | `MiniBossType` | 5 | 0 | 0 |
| 831 | `<RayShotDestroyCoroutine>d__7` | 3 | 6 | 2 |
| 832 | `RayMinibossController` | 4 | 6 | 0 |
| 936 | `<FadeOutAndDestroy>d__19` | 5 | 6 | 2 |
| 937 | `<PortalSpawnRoutine>d__12` | 4 | 6 | 2 |
| 938 | `<SelfDisposeRoutine>d__18` | 3 | 6 | 2 |
| 939 | `SummonPortal` | 10 | 11 | 0 |
| 940 | `SummonPortalManager` | 4 | 9 | 2 |
| 1091 | `VampireController` | 8 | 10 | 1 |
| 1092 | `VaultEnemyTile` | 5 | 3 | 0 |

Totals: **387 fields, 244 methods, 37 properties**.

## Decoded constant inventory

- Fields marked `DECODED_CANDIDATE`: **103**.
- Per-type candidate counts: `BossNet` 2; `DevPanelBattle1EnemyCounts` 3; `Enemy` 43; `DamageSource` 21; `PoolType` 10; `EnemyType` 14; `FleetType` 3; `EnemyProjectile` 1; `MiniBossType` 4; `VampireController` 2.
- Raw bytes, decoded values, and decoder labels remain in the JSON. The earlier domain review notes contain selected semantic details and limitations; this inventory does not independently promote decoded candidates into runtime mechanics.

## Metadata-reference completeness

- Field type references: 0/387 resolved.
- Method return type references: 243/244 resolved.
- Method parameter type references: 113/131 resolved.
- Properties: 37; property type information is represented through accessor references rather than a direct resolved property type in this export.

## Relationship to existing domain review

The detailed content review remains in [03_domain_02_enemies.md](03_domain_02_enemies.md). This new document adds a complete per-type structural inventory and aggregate metadata-reference counts. The original GRE files are unchanged.

## Audit result

- Structural inventory: **COMPLETE** for all 31 records in the inspected JSON.
- Existing domain content review: **RETAINED**; see linked audit note above.
- Runtime behavior: use the limitations and evidence labels in the existing content review; method/field declarations alone do not prove runtime behavior.
- Game release version: **NOT IDENTIFIED** by metadata format v39 alone.
- GKB promotion: **NOT PERFORMED**.

