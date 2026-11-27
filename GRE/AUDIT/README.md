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
- Phase 2 — domain-by-domain content audit: in progress; Domains 01–07 and 09 have structural audit notes. Domain 08 remains pending.
- Phase 3 — cross-domain relationship and contradiction audit: pending.
- Phase 4 — GKB-ready claim extraction and validation: pending.

## Domain audit notes

See [00_repository_and_source_audit.md](00_repository_and_source_audit.md), [01_domain_inventory.md](01_domain_inventory.md), [02_domain_01_game_fundamentals.md](02_domain_01_game_fundamentals.md), [03_domain_02_enemies.md](03_domain_02_enemies.md), [04_domain_03_battle_conditions.md](04_domain_03_battle_conditions.md), [05_domain_04_combat_mechanics.md](05_domain_04_combat_mechanics.md), [06_domain_05_ultimate_weapons.md](06_domain_05_ultimate_weapons.md), [07_domain_06_workshop.md](07_domain_06_workshop.md), [08_domain_07_workshop_enhancements.md](08_domain_07_workshop_enhancements.md), [09_domain_09_modules_assist.md](09_domain_09_modules_assist.md), [10_domain_09_modules_leveling_benefits.md](10_domain_09_modules_leveling_benefits.md), [11_domain_09_modules_banner_data.md](11_domain_09_modules_banner_data.md), and [12_domain_09_modules_inventory_drops.md](12_domain_09_modules_inventory_drops.md).

- Domain 09 findings 31–60: Assist Module slots, progression interfaces, efficiency APIs, and presets.
- Domain 09 findings 61–90: Module benefit APIs, effect-slot interfaces, shard/reroll-cost lookups, empty-effect handling, and slot level-up interfaces.
- Domain 09 findings 91–120: banner configuration/runtime data models, per-module banner entries, and banner retrieval/validation/selection interfaces.
- Domain 09 findings 121–150: Module Tickets, inventory access, acquisition counters, pity/cooldown state, and drop/shard interfaces.

- Domain 09 findings 151–200: seeded-reroll method declarations, ModuleItem/ModuleInfo/ModuleEffect/ModuleRegistry structures, merge/auto-merge interfaces, and module creation overloads. See [13_domain_09_modules_seed_records_merge.md](13_domain_09_modules_seed_records_merge.md).

- Domain 09 findings 201–300: Auto Reroll UI/coroutine declarations, per-ModuleType substat-ban and Auto Reroll fields, ModuleRandomTest state fields, and SubstatsCluster enum catalog. See [14_domain_09_modules_autoreroll_bans_random_catalog.md](14_domain_09_modules_autoreroll_bans_random_catalog.md).

- Domain 09 findings 301–400: module catalog lookup/presentation APIs, ModuleInfo/ModuleEffect benefit declarations, inventory identity interfaces, preset data and operations, and BetaModule configuration models. See [15_domain_09_modules_catalog_presets_beta_config.md](15_domain_09_modules_catalog_presets_beta_config.md).

All Domain 09 findings 31–400 are structural observations from direct metadata declarations, not verified runtime mechanics. Decoded constant values remain candidates only.
