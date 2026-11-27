# GRE Audit 01 — Domain inventory and structural baseline

This inventory records the 20 domain files as found on TestAccount. Counts below are type records in each topical view, not unique types.

| # | Domain | Type records | JSON |
|---:|---|---:|---|
| 01 | Game Fundamentals | 53 | `GRE/1/01_game_fundamentals.json` |
| 02 | Enemies | 31 | `GRE/1/02_enemies.json` |
| 03 | Battle Conditions | 48 | `GRE/1/03_battle_conditions.json` |
| 04 | Combat Mechanics | 79 | `GRE/1/04_combat_mechanics.json` |
| 05 | Ultimate Weapons | 70 | `GRE/1/05_ultimate_weapons.json` |
| 06 | Workshop | 35 | `GRE/1/06_workshop.json` |
| 07 | Workshop Enhancements | 34 | `GRE/1/07_workshop_enhancements.json` |
| 08 | Research | 15 | `GRE/1/08_research.json` |
| 09 | Modules | 108 | `GRE/1/09_modules.json` |
| 10 | Cards and Masteries | 49 | `GRE/1/10_cards_masteries.json` |
| 11 | Bots | 42 | `GRE/2/11_bots.json` |
| 12 | Guardians | 65 | `GRE/2/12_guardians.json` |
| 13 | Perks | 39 | `GRE/2/13_perks.json` |
| 14 | Relics | 45 | `GRE/2/14_relics.json` |
| 15 | Vault | 59 | `GRE/2/15_vault.json` |
| 16 | Economy and Progression | 137 | `GRE/2/16_economy_progression.json` |
| 17 | Formulas and Calculations | 57 | `GRE/2/17_formulas_calculations.json` |
| 18 | Strategy Interactions | 58 | `GRE/3/18_strategy_interactions.json` |
| 19 | Version History | 23 | `GRE/3/19_version_history.json` |
| 20 | Experimental and Community | 12 | `GRE/3/20_experimental_community.json` |
| | **Total domain memberships** | **1,059** | |
| | **Distinct type indices across domains (manifest)** | **475** | |

## Common JSON structure

All 20 domain JSON files were fetched and parsed successfully in the structural pass. The common top-level keys are:

- `domain`
- `evidence_status`
- `type_indices`
- `types`

The `types` records expose metadata such as:
- type index, name, namespace, by-value type index;
- declaring-type and parent-type references;
- metadata token and offset;
- fields, methods, properties, event count;
- raw type record hex.

Field records can include a type reference and a default-data record. Method records include return type reference, parameters, token, offset, and raw record hex. Property records include getter/setter method indices and token/offset.

The domain-level `evidence_status` is `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`. This status must be preserved when interpreting the data.

## Structural observations

1. The 20 JSON files are parseable and use a consistent outer envelope.
2. Each file's `type_indices` array length equals its `types` array length.
3. Domain membership is intentionally overlapping. The sum of per-domain records is 1,059; the manifest's distinct assigned type count is 475.
4. Some domains include large shared classes such as `Main`, `PlayerData`, `Enemy`, `ModuleManager`, or `Bots`. Their appearance in several domains is a navigation choice, not separate independent confirmation.
5. Compiler-generated symbols (for example `<>c`, `<...>d__...`) occur in domain records. Keep them in raw metadata, but exclude them from player-facing concept extraction unless their role is independently understood.
6. Some fields/method signatures contain type references that do not resolve to one unique direct type definition. Do not treat a null `resolved_type` as proof of invalid metadata; it can reflect a type form not represented by a direct definition in the extracted map. Detailed classification is pending.
7. Candidate defaults are unevenly distributed across domains and may be duplicated through shared types. Do not sum per-domain default counts as a global count.

## Non-domain support files

The tree also contains:
- `GRE/3/manifest.json` — binary identity, table layout, counts, checks and limitations.
- `GRE/3/extract_metadata.py` — extraction implementation and domain regexes.
- `GRE/3/all_assembly_index.json` — 125 assembly ranges.
- `GRE/3/all_game_types.json` — game-assembly type records.
- `GRE/3/other_game_assembly_types.json` — type records outside the main game assembly.
- `GRE/3/field_defaults.json` — default-data extraction records.
- `GRE/3/gameplay_string_literals.json` and `gameplay_string_literals.txt` — keyword-filtered strings.
- `GRE/3/mechanism_evidence.json` and `MECHANISMS.md` — selected symbol evidence.
- `GRE/3/IMPORTANT_CONSTANTS.md` — candidate decoded constants.
- `GRE/3/readme.txt`, plus the small readme files under `GRE/1` and `GRE/2`.

## Next step

Domain 01 must be audited in detail before moving to Domain 02. Do not bulk-import any of these files into GKB.
