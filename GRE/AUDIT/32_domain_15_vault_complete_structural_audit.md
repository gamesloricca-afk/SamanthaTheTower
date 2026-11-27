# Domain 15 — Vault: Complete Structural Metadata Audit

## Scope and source identity

- Repository ref: `TestAccount`
- JSON source: `GRE/2/15_vault.json`
- JSON blob SHA: `7aaf028a1a0e65569940bc05be53d317b59a09ea`
- Companion index: `GRE/2/15_vault.md`
- Markdown blob SHA: `bc1baeaf54bd619abcd6a48e29f61b486584ada7`
- Source label: `Assembly-CSharp.dll metadata v39`
- Declared type indices: 59
- JSON evidence label: `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`

The source label `metadata v39` is not a verified game release identifier. The JSON provides metadata declarations, method signatures, properties, and decoded constant candidates. It does not include method bodies/IL.

## Structural inventory

The JSON contains 59 type records, 1,446 fields, 829 methods, and 147 properties.

| Type index | Type name | Fields | Methods | Properties |
|---:|---|---:|---:|---:|
| 517 | VaultID | 123 | 0 | 0 |
| 586 | DamageData | 3 | 1 | 0 |
| 587 | HitData | 2 | 2 | 0 |
| 588 | LightspeedPathData | 3 | 1 | 0 |
| 589 | UpgradeType | 10 | 0 | 0 |
| 590 | UpgradeMultiplier | 2 | 1 | 0 |
| 591 | ClosestEnemyEntry | 2 | 1 | 0 |
| 592 | <>c | 11 | 12 | 0 |
| 593 | <>c__DisplayClass1109_0 | 1 | 3 | 0 |
| 594 | <>c__DisplayClass1128_0 | 1 | 3 | 0 |
| 595 | <>c__DisplayClass1214_0 | 6 | 0 | 0 |
| 596 | <>c__DisplayClass1216_0 | 4 | 0 | 0 |
| 597 | <>c__DisplayClass1270_0 | 2 | 2 | 0 |
| 598 | <>c__DisplayClass1271_0 | 2 | 3 | 0 |
| 599 | <>c__DisplayClass1436_0 | 3 | 2 | 0 |
| 600 | <>c__DisplayClass1474_0 | 1 | 2 | 0 |
| 601 | <AdStartFunction>d__1413 | 4 | 6 | 2 |
| 602 | <AutoRetryBattle>d__1391 | 4 | 6 | 2 |
| 603 | <DeathRayFunction>d__1428 | 4 | 6 | 2 |
| 604 | <DemonModeEffect>d__1362 | 4 | 6 | 2 |
| 605 | <GameOverFunction>d__1388 | 5 | 6 | 2 |
| 606 | <GameSpeedValidationLogFunction>d__1431 | 3 | 6 | 2 |
| 607 | <GemBlockFunction>d__1418 | 3 | 6 | 2 |
| 608 | <GrantRetroAchievementsDeferred>d__1095 | 2 | 6 | 2 |
| 609 | <NukeImmortalityEffect>d__1376 | 3 | 6 | 2 |
| 610 | <ProjectFundingCoroutine>d__1140 | 5 | 6 | 2 |
| 611 | <RebuildWallFunction>d__1147 | 3 | 6 | 2 |
| 612 | <SecondWindEffect>d__1348 | 4 | 6 | 2 |
| 613 | <ShockwaveFunction>d__1435 | 3 | 6 | 2 |
| 614 | <StartNewRoundFunction>d__1144 | 4 | 6 | 2 |
| 615 | <StartNewRoundWallFunction>d__1146 | 3 | 6 | 2 |
| 616 | <WallInvincibleEffect>d__1148 | 7 | 6 | 2 |
| 617 | <_applyFTUEEnemySpawnDelay>d__1145 | 3 | 6 | 2 |
| 618 | Main | 946 | 487 | 62 |
| 963 | TechTreeManager | 21 | 16 | 1 |
| 964 | TechTreeNodePosition | 4 | 0 | 0 |
| 965 | TechTreeType | 3 | 0 | 0 |
| 966 | <>c | 2 | 3 | 0 |
| 967 | TechTreeNodeData | 17 | 3 | 1 |
| 968 | TechTreeNodeUI | 24 | 10 | 0 |
| 969 | <>c | 4 | 5 | 0 |
| 970 | <FixTopBarLayout>d__27 | 3 | 6 | 2 |
| 971 | TechTreeUI | 22 | 12 | 1 |
| 1092 | VaultEnemyTile | 5 | 3 | 0 |
| 1093 | VaultGroupTitle | 3 | 2 | 0 |
| 1094 | VaultGroupUnlock | 5 | 4 | 0 |
| 1095 | VaultHarmonyTile | 14 | 3 | 0 |
| 1096 | VaultRespecWindow | 5 | 4 | 0 |
| 1097 | VaultSimpleTile | 9 | 3 | 0 |
| 1098 | SubPanelType | 5 | 0 | 0 |
| 1099 | VaultUI | 32 | 25 | 2 |
| 1100 | VaultUpgradeWindow | 20 | 9 | 0 |
| 1101 | VaultConfig | 12 | 13 | 12 |
| 1102 | VaultGroup | 17 | 0 | 0 |
| 1103 | VaultGroupData | 5 | 6 | 5 |
| 1104 | VaultLevel | 2 | 0 | 0 |
| 1105 | VaultManager | 11 | 53 | 12 |
| 1106 | VaultPlayerProgress | 5 | 11 | 5 |
| 1107 | VaultUpgradeData | 10 | 16 | 10 |

## VaultID catalog

Type `VaultID` (#517) has 123 fields: one enum backing field and 122 named identifiers. The companion source lists every name and decoded candidate value. The identifiers cover:

- Tower attack/defense/utility stats, such as Damage, AttackSpeed, CritChance, Health, HealthRegen, DefensePercent, RecoveryAmount, EnemyAttackSkip, and EnemyHealthSkip.
- Ultimate Weapon and related stats, such as UltimateDamage, ChainLightningDamage, SmartMissileDamage, DeathWaveDamage, InnerLandMinesDamage, GoldenTowerBonus, PoisonSwampDamage, SpotlightBonus, and BlackHoleSize.
- Automation and convenience settings, including AutoRestartRun, DemonModeAuto/Smart, NukeAuto/Smart, DeathRayToggle, SpawnAcceleratorToggle, BastionAuto/Smart, EliteBalanceToggle, and MissileBarrageAuto/Smart.
- Module, Bot, Workshop, Enhancement, and Guardian settings, including AutoShatterRare, SetDailyShardType, FreeMissionReroll, ModuleRerollDiscount, ModulePresets, BotRespecDiscount, BotPresets, BotRange, BotCooldownSliders, WorkshopRespecDiscount, WorkshopPresets, EnhancementsDiscount, WorkshopOrbAdjuster, GuardianRespecDiscount, and GuardianPresets.
- Enemy-related identifiers, including Basic, Fast, Tank, Boss, Ranged, Protector, Vampire, Scatter, Ray, Saboteur, Commander, and Overcharge attack/health or specific stat identifiers.
- Power-tree tier identifiers, including PowerTreeTier2 and PowerTreeTier3.

The complete enum names and numeric candidates are retained in `15_vault.md` and the JSON. The numeric assignments are marked `DECODED_CANDIDATE` in the export; do not confuse identifier values with upgrade levels, costs, or benefit values.

## Vault domain declarations

### VaultManager (#1105)

The central manager declaration has 11 fields, 53 methods, and 12 properties.

Fields include `vaultUpgrades`, `vaultGroups`, `groupById`, `playerProgress`, configuration keys for respec cost/cooldown, `DEFAULT_RESPEC_COOLDOWN_WEEKS`, `DEFAULT_RESPEC_COST`, and the `OnVaultChanged` event.

Its method interface includes:
- Configuration and groups: `LoadConfig`, `UnlockFreeGroups`, `IsGroupUnlocked`, `IsGroupLocked`, `GetGroupRequirements`, `HasAnyUpgradeBoughtInGroup`, `HasAnyEnemyUpgradeBought`, `CanUnlockGroup`, `TryUnlockGroup`, `GetGroupData`, `GetGroupForId`.
- Upgrade access/purchase: `GetUpgradeLevel`, `IsUpgradeMaxLevel`, `CanBuyUpgradeLevel`, `CanBulkBuyUpgradeLevels`, `IsUpgradeLocked`, `TryBuyUpgradeLevel`, `TryBulkBuyUpgradeLevels`, `GetUpgradeData`, `GetBenefit`, `TryGetBenefit`, `ApplyBenefitType`, `TryGetNextLevelKeyCost`, `GetBulkLevelKeyCost`.
- Player progress: `GetPlayerProgressToSave`, `LoadPlayerProgress`, `get_HasVaultProgress`.
- Respec: `get_FreeRespecsAvailable`, `get_IsRespecFree`, `get_RespecCooldownWeeks`, `get_RespecGemCost`, `get_NextRespecGemCost`, `get_NextRespecDate`, `get_RespecCooldownRemaining`, `get_CanRespecVault`, `GrantFreeRespec`, `AddFreeRespecs`, `ClearRespecCooldown`, `TryRespecVault`, `RespecVault`.
- Progress summary: `GetOwnedNodes`, `GetTotalKeysWorthOfProgress`.

### VaultUpgradeData (#1107) and VaultLevel (#1104)

`VaultUpgradeData` declares fields for `id`, `icon`, `enemyType`, localized name/description IDs, `benefitType`, `benefitSymbol`, `dependencyStat`, `requirements`, and `levels`. Methods expose `GetLevelData`, `GetBenefit`, `GetBenefitString`, `GetKeyCost`, and `GetDescription`, plus properties such as `MaxLevel`, `HasDependency`, and `Requirements`.

`VaultLevel` contains `benefit` and `keyCost`. These declarations establish the data model's fields and API; they do not reveal the actual benefit formulas, per-level values, key-cost progression, or dependency evaluation implementation.

### Groups and configuration

- `VaultGroup` (#1102) declares group identifiers: None; Harmony_Gameplay, Harmony_Cards, Harmony_Ultimate, Harmony_Modules, Harmony_Bots, Harmony_Workshop, Harmony_Guardian; Power_Attack, Power_Defense, Power_Utility, Power_Ultimate; Enemy_Simple, Enemy_Advanced, Enemy_Elite, Enemy_Fleets.
- `VaultGroupData` (#1103) contains group, localized name ID, unlock cost, requirements, and upgrades.
- `VaultConfig` (#1101) exposes Harmony, Power, and Enemy group collections, plus UI colors.
- The enum-like `SubPanelType` (#1098) contains None, Harmony, Power, and Enemy.
- The JSON records 16 `VaultGroup` decoded enum candidates and four `SubPanelType` candidates. The companion source records their numeric values and raw bytes.

These declarations establish that groups have configuration, unlock-cost, requirements, and upgrade collections. They do not by themselves prove exact unlock order or which group gates another group.

## Player progress and respec data

`VaultPlayerProgress` (#1106) stores declarations for `UnlockedGroups`, `UpgradesLevel`, `HasViewedVault`, `FreeRespecsAvailable`, and `LastRespecDate`, with getter/setter methods.

The manager exposes respec-related properties and operations, and its metadata includes decoded candidates:
- `DEFAULT_RESPEC_COOLDOWN_WEEKS = 4`
- `DEFAULT_RESPEC_COST = 500`

The export preserves these as decoded constant candidates with raw bytes. Method names and fields do not establish all respec eligibility rules, exact cooldown handling, whether defaults can be overridden by config, or the exact refund behavior. Those details require implementation evidence.

## Tech Tree declarations included in this source

The Vault source also includes the Tech Tree system:

- `TechTreeManager` (#963): 21 fields, 16 methods, 1 property. It declares power/harmony node collections, unlock/level/max-level state, `GetTechTreeBenefit`, initialization methods, `IncreasePowerTreeTier`, `ResetTechTree`, `ResetAllWorkshopPresets`, `UnequipAllTechTreeCardSlots`, and `GetExtraCardSlots`.
- `TechTreeNodeData` (#967): fields for localized names/descriptions, parent/children, depth, position, index, stat type, benefit, key cost, unlocked state, level, max level, and nodes-unlocked requirement.
- `TechTreeNodeUI` (#968) and `TechTreeUI` (#971): UI declarations for node placement, connections, selected nodes, Power/Harmony tabs, buying nodes/levels, and node UI state.
- `TechTreeType` (#965) candidates: Tower=0, Utility=1.
- `TechTreeNodePosition` (#964) candidates: Left=0, Middle=1, Right=2.
- Decoded candidates in `TechTreeManager`: `POWER_TREE_NODE_COUNT=46`, `HARMONY_TREE_NODE_COUNT=48`, `WORKSHOP_PRESETS_NODE_INDEX=18`, `BOT_PRESETS_NODE_INDEX=47`, `DEMON_MODE_AUTO_NODE_INDEX=3`, `NUKE_AUTO_NODE_INDEX=7`, `MISSILE_BARRAGE_AUTO_NODE_INDEX=24`, and `AUTO_RESTART_RUN_NODE_INDEX=33`.

The node counts and indices are extracted metadata constants, not a complete node catalog or proof that every node is currently available in a particular release. The source contains the node data class definition but not a full enumerated list of all tree nodes and their benefits.

## Vault UI declarations

The source includes:
- `VaultUI` (#1099): panel switching, Harmony/Power/Enemy panel refresh, group selection, upgrade details, respec window, and pooled tile/UI elements.
- `VaultUpgradeWindow` (#1100): selected VaultID, upgrade data, current/next levels, lock/max state, requirement text, current/next descriptions, and buy controls.
- `VaultRespecWindow` (#1096): confirmation button, refunded Keys text, Gems cost, cooldown text, and confirm/update methods.
- `VaultHarmonyTile` (#1095), `VaultSimpleTile` (#1097), `VaultEnemyTile` (#1092), `VaultGroupTitle` (#1093), and `VaultGroupUnlock` (#1094): display and interaction declarations for upgrade/group tiles.
- Compiler-generated closure/coroutine records are also present and counted in the structural inventory.

UI field and method names are declarations, not evidence of exact visual behavior, button validation, or purchase side effects.

## Decoded constant inventory

The JSON contains 205 fields marked `DECODED_CANDIDATE` across the 59 type records. Distribution:

| Type | Candidate count |
|---|---:|
| VaultID | 122 |
| UpgradeType | 9 |
| Main | 29 |
| TechTreeManager | 8 |
| TechTreeNodePosition | 3 |
| TechTreeType | 2 |
| TechTreeNodeUI | 9 |
| VaultHarmonyTile | 1 |
| SubPanelType | 4 |
| VaultGroup | 16 |
| VaultManager | 2 |
| **Total** | **205** |

The source JSON preserves each candidate's raw bytes, decoded value, and decoder label. The candidate classification is retained pending the post-audit cross-domain review.

## Metadata-reference completeness

Across all 59 records:

- Field type references: 0/1,446 have resolved type names.
- Method return type references: 816/829 are resolved.
- Method parameter type references: 310/393 are resolved.
- Properties: 147 records; property type information is represented through accessor references rather than a direct resolved property type in this export.

Missing field type names are an export limitation, not evidence that fields lack types.

## Audit result

- Structural inventory: **COMPLETE** for all 59 records in the inspected JSON.
- VaultID and group identifier catalogs: **DOCUMENTED** with decoded candidate values and source traceability.
- Vault manager, upgrade data, level, group configuration, player progress, and respec declarations: **DOCUMENTED**.
- Tech Tree manager/node/UI declarations and selected constants: **DOCUMENTED**.
- UI declarations: **DOCUMENTED**.
- Exact upgrade benefit formulas, level costs, group dependency rules, unlock conditions, respec/refund mechanics, and complete Tech Tree node catalog: **NOT ESTABLISHED** by the inspected metadata exports alone.
- Game release version: **NOT IDENTIFIED** by `metadata v39` alone.
- GKB promotion: **NOT PERFORMED**; this is an audit note only.

## Next audit target

Domain 16 — Economy and Progression. Confirm the actual source files in the repository before assuming filenames or boundaries.
