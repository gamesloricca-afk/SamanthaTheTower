# GRE Audit Workspace

This directory contains the staged, source-traceable audit of the existing `GRE/` reverse-engineering package.

## Purpose

Audit the full GRE package slowly and domain by domain before promoting any validated, normalized knowledge into Samantha's GKB. GRE is treated as a source artifact, not as an already verified universal game knowledge base.

## Audit rules

1. Preserve the original GRE files; audit notes are additive.
2. Distinguish direct metadata declarations, decoded candidates, interpretation/inference, and externally corroborated claims.
3. A symbol name, field name, enum label, string literal, or offset is not proof of runtime behavior.
4. Keep source binary identity, metadata format version, and game release version separate.
5. Preserve contradictory fanmade sources side by side; do not silently select a winner.
6. Record unsupported, unresolved, missing, and conflicting information.
7. Do not promote claims to GKB until provenance, scope, version applicability, evidence, and limitations are documented.
8. Do not merge or copy this audit to `GKB` or `main` as part of this phase.

## Current status

- Phase 0 — repository and branch safety: complete.
- Phase 1 — package structure and metadata inventory: initial structural pass complete.
- Phase 2 — domain-by-domain content audit: in progress; Domains 01–07 have structural audit notes; Domain 09 is paused/skipped because its full JSON is unreadable; Domain 10 has an initial companion-index audit and a full JSON metadata pass. Domain 08 and Domains 13–20 remain pending; Domain 11 structural inventory is complete. Domain 12 structural record enumeration is complete for all 65 records; selected signature, type-reference, accounting, respec, and Fetch declaration reviews are documented. Domain 13 (Perks) structural inventory is complete for all 39 records; the Perks class, shared Main/PlayerData declarations, and decoded candidates are documented. Runtime behavior for Domains 12–13 remains outside what the inspected metadata exports can establish without method bodies/IL.
- Phase 3 — cross-domain relationship and contradiction audit: pending.
- Phase 4 — GKB-ready claim extraction and validation: pending.

## Domain audit notes

See [00_repository_and_source_audit.md](00_repository_and_source_audit.md), [01_domain_inventory.md](01_domain_inventory.md), [02_domain_01_game_fundamentals.md](02_domain_01_game_fundamentals.md), [03_domain_02_enemies.md](03_domain_02_enemies.md), [04_domain_03_battle_conditions.md](04_domain_03_battle_conditions.md), [05_domain_04_combat_mechanics.md](05_domain_04_combat_mechanics.md), [06_domain_05_ultimate_weapons.md](06_domain_05_ultimate_weapons.md), [07_domain_06_workshop.md](07_domain_06_workshop.md), [08_domain_07_workshop_enhancements.md](08_domain_07_workshop_enhancements.md), [09_domain_09_modules_assist.md](09_domain_09_modules_assist.md), [10_domain_09_modules_leveling_benefits.md](10_domain_09_modules_leveling_benefits.md), [11_domain_09_modules_banner_data.md](11_domain_09_modules_banner_data.md), [12_domain_09_modules_inventory_drops.md](12_domain_09_modules_inventory_drops.md), and [23_domain_11_bots_initial_audit.md](23_domain_11_bots_initial_audit.md), and [24_domain_11_bots_complete_type_inventory.md](24_domain_11_bots_complete_type_inventory.md), and [25_domain_12_guardians_initial_audit.md](25_domain_12_guardians_initial_audit.md), and [26_domain_12_guardians_ui_and_generated_records.md](26_domain_12_guardians_ui_and_generated_records.md), and [27_domain_12_guardians_type_reference_completeness.md](27_domain_12_guardians_type_reference_completeness.md), and [28_domain_12_guardians_accounting_respec_fetch_declarations.md](28_domain_12_guardians_accounting_respec_fetch_declarations.md), and [29_domain_12_guardians_complete_type_record_inventory.md](29_domain_12_guardians_complete_type_record_inventory.md), and [30_domain_13_perks_complete_structural_audit.md](30_domain_13_perks_complete_structural_audit.md).

- Domain 09 findings 31–60: Assist Module slots, progression interfaces, efficiency APIs, and presets.
- Domain 09 findings 61–90: Module benefit APIs, effect-slot interfaces, shard/reroll-cost lookups, empty-effect handling, and slot level-up interfaces.
- Domain 09 findings 91–120: banner configuration/runtime data models, per-module banner entries, and banner retrieval/validation/selection interfaces.
- Domain 09 findings 121–150: Module Tickets, inventory access, acquisition counters, pity/cooldown state, and drop/shard interfaces.

- Domain 09 findings 151–200: seeded-reroll method declarations, ModuleItem/ModuleInfo/ModuleEffect/ModuleRegistry structures, merge/auto-merge interfaces, and module creation overloads. See [13_domain_09_modules_seed_records_merge.md](13_domain_09_modules_seed_records_merge.md).

- Domain 09 findings 201–300: Auto Reroll UI/coroutine declarations, per-ModuleType substat-ban and Auto Reroll fields, ModuleRandomTest state fields, and SubstatsCluster enum catalog. See [14_domain_09_modules_autoreroll_bans_random_catalog.md](14_domain_09_modules_autoreroll_bans_random_catalog.md).

- Domain 09 findings 301–400: module catalog lookup/presentation APIs, ModuleInfo/ModuleEffect benefit declarations, inventory identity interfaces, preset data and operations, and BetaModule configuration models. See [15_domain_09_modules_catalog_presets_beta_config.md](15_domain_09_modules_catalog_presets_beta_config.md).

- Domain 09 findings 401–500: primary/assist and Ultimate Weapon benefit accessor declarations, module drop/reward and creation overloads, banner data structures, banner loading/validation APIs, and banner UI interfaces. See [16_domain_09_modules_benefit_accessors_drops_banners.md](16_domain_09_modules_benefit_accessors_drops_banners.md).

- Domain 09 findings 601–700: AssistModuleSlot data model, declared efficiency limits and conversion/cost APIs, unlock/equip/respec interfaces, Assist UI fields and handlers, and primary/assist slot-level spend and migration interfaces. See [17_domain_09_modules_assist_progression_ui_slot_accounting.md](17_domain_09_modules_assist_progression_ui_slot_accounting.md).

All Domain 09 findings 31–700 are structural observations from direct metadata declarations, not verified runtime mechanics. Decoded constant values remain candidates only.

- Domain 09 findings 701–900: deliberately skipped because the complete `GRE/1/09_modules.json` content could not be read through the repository connector. This is an access limitation, not evidence that the source is empty or that no declarations exist. No findings or GKB claims were fabricated for this range. See [18_domain_09_modules_findings_701-900_source_gap.md](18_domain_09_modules_findings_701-900_source_gap.md).

- Domain 09 findings 901–1000: limited index-level audit of 100 previously unlisted UI method-name entries from the readable `GRE/1/09_modules.md` companion summary (`ModuleDetailsUI` and `ModuleUI`). This does not establish signatures or runtime behavior; the full JSON remains unreadable through the connector. Findings 701–900 remain a separate documented gap. See [19_domain_09_modules_ui_method_index_901-1000.md](19_domain_09_modules_ui_method_index_901-1000.md).

- Domain 09 findings 1001–1200: 200 method-name entries listed under the shared `Main` type in the readable `GRE/1/09_modules.md` index. `Main` is a cross-domain controller, not a Modules-only class; these are index observations, not 200 verified Module mechanics or runtime behaviors. The full JSON remains unreadable through the connector. See [20_domain_09_modules_shared_main_method_index_1001-1200.md](20_domain_09_modules_shared_main_method_index_1001-1200.md).


- Domain 09 (Modules): paused/skipped. The full JSON was not readable through the repository connector, so no further index-only batches will be generated. Existing notes remain as historical observations and the source-access gap is preserved.

- Domain 10 (Cards and Masteries): initial companion-index audit in [21_domain_10_cards_masteries_initial_audit.md](21_domain_10_cards_masteries_initial_audit.md). A subsequent full JSON pass retrieved and parsed the 2.1 MB blob through the Git database blob endpoint, confirming all 49 type records and documenting Cards, PlayerData, Main, card ID catalogs, mastery declarations, and drop-rate structures. This remains structural metadata; method behavior and candidate decoded constants are not treated as verified game mechanics. See [22_domain_10_cards_masteries_full_json_metadata.md](22_domain_10_cards_masteries_full_json_metadata.md).


- Domain 11 (Bots): initial structural audit recorded in [23_domain_11_bots_initial_audit.md](23_domain_11_bots_initial_audit.md). The source declares 42 type records. The review records selected Bot/BotType/AiState/Bots/UI declarations and decoded candidates, while explicitly leaving full 42-record review and runtime behavior unresolved. No GKB claims were promoted.

- Domain 11 (Bots): complete structural inventory of all 42 source type records, with selected method signatures, user data structures, shared records, compiler-generated records, and Main cross-domain overlap documented in [24_domain_11_bots_complete_type_inventory.md](24_domain_11_bots_complete_type_inventory.md). Structural inventory is complete; runtime behavior and candidate value validation remain open. No GKB claims were promoted.

- Domain 12 (Guardians): initial structural audit recorded in [25_domain_12_guardians_initial_audit.md](25_domain_12_guardians_initial_audit.md). The source contains 65 type records, including Guardian preset/chip/UI declarations, TowerBuddy and TowerBuddyAbility, shared Main records, and generated closures/coroutines. Candidate values remain unverified; runtime behavior is not established.

- Domain 12 follow-up: reviewed resolved signatures for BuddyModifierDetails, ChipTileUI, GuardianPresetsUI, GuildBuddySlotUI, and the generated TowerBuddy closure/iterator records #1010–#1029. See [26_domain_12_guardians_ui_and_generated_records.md](26_domain_12_guardians_ui_and_generated_records.md). Captured cutoff-time fields are recorded as metadata observations only; exact reward-window behavior remains unverified.

- Domain 12 type-reference coverage: across 65 type records, the JSON contains 1,274 fields, 858 methods, and 134 properties. All 1,274 field type references lack resolved type names; 847/858 method return types and 324/404 parameter types are resolved; property type references are not represented. See [27_domain_12_guardians_type_reference_completeness.md](27_domain_12_guardians_type_reference_completeness.md). These are export-completeness observations, not gameplay conclusions.

- Domain 12 declaration map: Guardian preset fields, chip/Bits accounting APIs, respec UI/API declarations, TowerBuddy Fetch/reward interfaces, and cross-domain access paths are documented. Decoded caps and unlock-cost values remain candidates; method-body behavior is not available in this export. See [28_domain_12_guardians_accounting_respec_fetch_declarations.md](28_domain_12_guardians_accounting_respec_fetch_declarations.md).

- Domain 12 structural record inventory: all 65 type records are enumerated with field/method/property counts. Structural enumeration is complete for the source file; behavioral verification remains incomplete. See [29_domain_12_guardians_complete_type_record_inventory.md](29_domain_12_guardians_complete_type_record_inventory.md).

- Domain 13 (Perks): complete structural inventory of all 39 records (1,984 fields, 2,349 methods, 937 properties), with Perks declarations, ChoicesType/UpgradeType enum candidates, perk-specific decoded constants, and shared Main/PlayerData overlap documented in [30_domain_13_perks_complete_structural_audit.md](30_domain_13_perks_complete_structural_audit.md). Values retain raw bytes and decoder labels; runtime interpretation and game release applicability are reserved for the post-audit review. No GKB promotion was performed.
