# Domain 09 — Modules: Complete Structural Metadata Audit

## Scope and source identity

- Repository ref: `TestAccount`
- JSON source: `GRE/1/09_modules.json`
- JSON blob SHA: `016cc346998a2c3fafcc945ca0d01308a74e66d5`
- Companion index: `GRE/1/09_modules.md`
- Markdown blob SHA: `c0465209d0b7144b8ce720000efa8ff31a65058b`
- Source label: `Assembly-CSharp.dll metadata v39`
- Declared type indices: 108
- JSON evidence label: `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`

The normal file fetch returned an empty JSON body. The Git database blob endpoint returned the complete 1.46 MB JSON, which was parsed successfully. This resolves the earlier connector access gap; previous notes that skipped findings 701–900 are now superseded as an access limitation, while remaining useful as historical notes.

## Complete structural inventory

The JSON contains 108 type records, 1,968 fields, 1,423 methods, and 267 properties.

| Type index | Type name | Fields | Methods | Properties |
|---:|---|---:|---:|---:|
| 97 | `AssistModuleSlot` | 9 | 19 | 9 |
| 98 | `AssistModuleSlotType` | 5 | 0 | 0 |
| 270 | `DevPanelModuleTypes` | 5 | 0 | 0 |
| 271 | `DevPanelModuleRarity` | 16 | 0 | 0 |
| 279 | `DevPanelAssistModuleEfficiencies` | 4 | 0 | 0 |
| 331 | `FeaturedModuleViewer` | 4 | 3 | 0 |
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
| 672 | `ModuleBannerData` | 10 | 21 | 10 |
| 674 | `BannerModuleData` | 2 | 5 | 2 |
| 675 | `<>c` | 4 | 5 | 0 |
| 676 | `<>c__DisplayClass19_0` | 2 | 2 | 0 |
| 677 | `<>c__DisplayClass19_1` | 2 | 2 | 0 |
| 678 | `<>c__DisplayClass19_2` | 2 | 2 | 0 |
| 679 | `<>c__DisplayClass19_3` | 2 | 2 | 0 |
| 680 | `ModuleBansUI` | 13 | 10 | 1 |
| 681 | `ModuleBulkViewer` | 9 | 11 | 2 |
| 682 | `<>c__DisplayClass118_0` | 5 | 7 | 0 |
| 683 | `<>c__DisplayClass118_1` | 1 | 2 | 0 |
| 684 | `<>c__DisplayClass98_0` | 4 | 3 | 0 |
| 685 | `<AutoReroll>d__120` | 5 | 6 | 2 |
| 686 | `<ForceUpdateLayout>d__121` | 3 | 6 | 2 |
| 687 | `<InternetCheck>d__86` | 3 | 6 | 2 |
| 688 | `ModuleDetailsUI` | 81 | 47 | 0 |
| 689 | `<ForceUpdateLayout>d__12` | 3 | 6 | 2 |
| 690 | `ModuleEffectRollbackUI` | 8 | 6 | 0 |
| 691 | `ModuleInfoUI` | 5 | 6 | 1 |
| 692 | `ModuleInventoryItem` | 10 | 8 | 0 |
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
| 704 | `ModuleItem` | 12 | 26 | 12 |
| 705 | `ModuleInfo` | 4 | 0 | 0 |
| 706 | `ModuleEffect` | 5 | 0 | 0 |
| 708 | `ModuleType` | 5 | 0 | 0 |
| 709 | `EffectRarity` | 7 | 0 | 0 |
| 710 | `ModuleRarity` | 17 | 0 | 0 |
| 711 | `ModuleBenefitType` | 14 | 0 | 0 |
| 712 | `SubstatsClusterType` | 5 | 0 | 0 |
| 713 | `SubstatsCluster` | 76 | 0 | 0 |
| 714 | `ModuleRegistry` | 3 | 7 | 3 |
| 715 | `ModuleBanner` | 13 | 1 | 0 |
| 716 | `ModuleBannerModule` | 4 | 1 | 0 |
| 717 | `ModulePresetData` | 3 | 8 | 3 |
| 718 | `ModulePresetsUI` | 6 | 5 | 1 |
| 719 | `ModuleRestoreAndMaxUI` | 24 | 12 | 0 |
| 720 | `ModuleShatterItem` | 4 | 5 | 0 |
| 721 | `Tab` | 5 | 0 | 0 |
| 722 | `<>c` | 22 | 23 | 0 |
| 723 | `<>c__DisplayClass308_0` | 2 | 2 | 0 |
| 724 | `<>c__DisplayClass309_0` | 2 | 2 | 0 |
| 725 | `<>c__DisplayClass310_0` | 2 | 2 | 0 |
| 726 | `<>c__DisplayClass311_0` | 2 | 2 | 0 |
| 727 | `<>c__DisplayClass312_0` | 2 | 2 | 0 |
| 728 | `<>c__DisplayClass313_0` | 2 | 2 | 0 |
| 729 | `<>c__DisplayClass314_0` | 2 | 2 | 0 |
| 730 | `<>c__DisplayClass315_0` | 2 | 2 | 0 |
| 731 | `<>c__DisplayClass316_0` | 2 | 2 | 0 |
| 732 | `<>c__DisplayClass317_0` | 2 | 2 | 0 |
| 733 | `<>c__DisplayClass318_0` | 2 | 2 | 0 |
| 734 | `<>c__DisplayClass319_0` | 2 | 2 | 0 |
| 735 | `<>c__DisplayClass361_0` | 2 | 2 | 0 |
| 736 | `<FeaturedBannerUIUpdate>d__357` | 3 | 6 | 2 |
| 737 | `<RetryGetBanners>d__349` | 4 | 6 | 2 |
| 738 | `ModuleUI` | 253 | 120 | 7 |
| 739 | `ModuleUniqueEffectUI` | 9 | 5 | 0 |
| 740 | `ModuleUnmergeUI` | 8 | 5 | 0 |
| 874 | `BetaModuleConfig` | 3 | 7 | 3 |
| 875 | `BetaModule` | 4 | 11 | 6 |

## ModuleManager (#703)

`ModuleManager` declares 110 fields, 294 methods, and 89 properties. Its fields cover:
- Module currency and resources: Cannon, Armor, Generator, and Core shards; reroll currency; Module Tickets.
- Inventory/equipment: module inventory, equipped modules, module info/effects, slot levels, and slot spend accounting.
- Acquisition/drop state: current/rare pity, module drop/shard cooldowns, common/rare/epic acquisition counters, history, and total gems spent.
- Merge/shatter: merge selection, auto-merge entries, shatter state, merge counts, and module records.
- Auto Reroll: per-type substat bans, rarity allowances, per-module-type Auto Reroll substat choices, and reroll state.
- Banners: featured/rotating banner data, current banner, last purchase, loading/listener/cache state.
- Assist Modules: availability, slots, beta refund/migration state, and module presets.
- Slot-level migration and refund tracking.

The method surface includes inventory retrieval, module equip/unequip, presets, module merge/unmerge, shatter, drop/reward, module creation, level-up, effect/substat rolling, deterministic reroll support, costs, benefit accessors, banners, Assist Module unlock/equip/respec, and migration interfaces.

## Module data model

- `ModuleItem` (#704): 12 fields and 26 methods. Fields include info index, current rarity, level/max level reached, effects, effect-lock state, new/favorite flags, coin/shard spend, reroll counter, and GUID. Properties expose these values.
- `ModuleInfo` (#705): type, rarity, unique benefit, and benefit type.
- `ModuleEffect` (#706): type, rarity, benefit, benefit type, and cluster index.
- `ModuleRegistry` (#714): info index, rarity, and date obtained.
- `ModuleBanner` (#715): name, start/end date, price, pity rarity, background/title/subtitle localization, preview/highlight flags, rarities, module entries, and validity.
- `ModuleBannerModule` (#716): info index, chance, adjusted flag, and highlighted flag.
- `ModulePresetData` (#717): preset name, primary module GUIDs, and Assist Module GUIDs.

These data declarations establish the exposed schema. They do not establish the actual live module catalog, banner configuration, drop odds, or current player-specific inventory.

## Module identifiers and enum catalogs

The export contains these enum-like records:
- `ModuleType` (#708): Cannon, Armor, Generator, Core.
- `EffectRarity` (#709): Common, Rare, Epic, Legendary, Mythic, Ancestral.
- `ModuleRarity` (#710): None, Common, Rare, RarePlus, Epic, EpicPlus, Legendary, LegendaryPlus, Mythic, MythicPlus, Ancestral, Ancestral1–Ancestral5.
- `ModuleBenefitType` (#711): Normal, Add, Add10, AddMult, Multiply, Percentage, Percentage100, Subtract, Time, AddTime, SubtractTime, Meters, Angle.
- `SubstatsClusterType` (#712): Attack, Defense, Utility, Ultimate.
- `SubstatsCluster` (#713): 75 named entries including Attack Speed, Critical Chance/Factor, range/multishot/rapid-fire/bounce/super-critical/rend-armor stats, defense/health stats, utility/free-upgrade/recovery/skip stats, and Ultimate Weapon stats.

The source JSON preserves enum field names and decoded numeric candidates. Keep the full catalog as supplied in the source files; do not infer that every listed substat is available to every module type.

## Assist Module declarations

- `AssistModuleSlot` (#97): fields/properties for unlocked, slot type, equipped module, unique/main/substat efficiency levels, level, coins spent, and shards spent.
- `AssistModuleSlotType` (#98): Cannon, Armor, Generator, Core.
- `DevPanelAssistModuleEfficiencies` (#279): UniqueEffect, MainEffect, Substat.
- `ModuleManager` methods include slot-level access, effective module level, slot rarity caps, slot spend accounting, assist slot unlock methods, efficiency value/cost accessors, equip/unequip, and respec.
- `ModuleUI` (#738) contains Assist tab/panel, four module-type slots, efficiency buttons/text/costs, and related handlers.
- `ModuleDetailsUI` (#688) includes Assist equip controls, level-up controls, reroll, substat bans, Auto Reroll, and module details.
- `ModuleBansUI` (#680) declares type tabs and ban-row controls.

Decoded candidate limits in the shared ModuleManager source include:
- Assist slot unlock cost: 1,000.
- Unique-effect efficiency max level: 3.
- Main-effect efficiency max level: 99.
- Substat efficiency max level: 69.

These values remain decoded candidates with raw bytes in the source JSON. Exact cost progression and efficiency calculations require method bodies or independent calculation evidence.

## Auto Reroll and substat-ban declarations

The source includes:
- Per-module-type substat-ban collections and Auto Reroll selections in `ModuleManager`.
- `ModuleBansUI` for selecting banned substats.
- Auto Reroll coroutine `<AutoReroll>d__120` (#685).
- `ModuleDetailsUI` methods for entering/leaving reroll mode, starting/stopping Auto Reroll, and executing the reroll interface.
- ModuleManager methods for deterministic seed creation, potential effect lists, structurally valid effect indices, cluster restrictions, rarity fallback, reroll filters, and effect reroll operations.

These declarations map the available Auto Reroll/reroll interfaces. They do not establish the exact RNG algorithm, filter precedence, reroll outcome probabilities, or runtime termination conditions.

## Module UI and acquisition declarations

- `ModuleUI` (#738): 253 fields, 120 methods, 7 properties. UI declarations cover inventory, equipped modules, merge, shatter, Assist slots, module details, history, tickets, banners, and purchase controls.
- `ModuleDetailsUI` (#688): 81 fields, 47 methods.
- `ModuleBulkViewer` (#681), `ModuleInventoryItem` (#692), `ModuleInfoUI` (#691), `ModuleRestoreAndMaxUI` (#719), `ModuleEffectRollbackUI` (#690), `ModuleUniqueEffectUI` (#739), and `ModuleUnmergeUI` (#740) cover additional display and action interfaces.
- `FeaturedModuleViewer` (#331), `ModuleBannerData` (#672), and `BannerModuleData` (#674) add banner presentation/config structures.
- Compiler-generated closure/coroutine records are included in the 108-record inventory.

## Decoded constant inventory

The JSON contains 207 fields marked `DECODED_CANDIDATE`. Distribution:

| Type | Candidate count |
|---|---:|
| AssistModuleSlotType | 4 |
| DevPanelModuleTypes | 4 |
| DevPanelModuleRarity | 15 |
| DevPanelAssistModuleEfficiencies | 3 |
| UpgradeType | 9 |
| Main | 29 |
| ModuleDetailsUI | 2 |
| ModuleManager | 17 |
| ModuleType | 4 |
| EffectRarity | 6 |
| ModuleRarity | 16 |
| ModuleBenefitType | 13 |
| SubstatsClusterType | 4 |
| SubstatsCluster | 75 |
| Tab | 4 |
| ModuleUI | 2 |
| **Total** | **207** |

Raw bytes, decoded values, and decoder labels remain in the JSON. Repeated names in other domains are not independent corroboration.

## Metadata-reference completeness

Across all 108 records:
- Field type references: 0/1,968 have resolved type names.
- Method return type references: 1,397/1,423 are resolved.
- Method parameter type references: 634/752 are resolved.
- Properties: 267; property type information is represented through accessor references rather than a direct resolved property type in this export.

## Audit result

- Structural inventory: **COMPLETE** for all 108 records.
- ModuleManager, ModuleItem/Info/Effect/Registry, module enum catalogs, banner/preset data, Assist Module, Auto Reroll, substat bans, and UI declarations: **DOCUMENTED**.
- All 207 decoded candidates: **RECORDED** with source traceability.
- Previous full-JSON access gap: **RESOLVED** via Git database blob retrieval and successful parsing.
- Exact module benefit formulas, module-specific effect eligibility, merge/upgrade cost progression, drop/pity algorithm, RNG/reroll probability, banner odds/current rotation, and Assist efficiency calculations: **NOT ESTABLISHED** by metadata declarations alone.
- Game release version: **NOT IDENTIFIED** by `metadata v39` alone.
- GKB promotion: **NOT PERFORMED**.

## Audit note

Earlier Domain 09 findings 31–700 and index-only notes 901–1200 remain as historical incremental work. This document is the complete structural inventory for all 108 type records and supersedes the earlier claim that the complete JSON was inaccessible. Findings 701–900 are now included in the full structural inventory rather than left as an unresolved source-access gap.
