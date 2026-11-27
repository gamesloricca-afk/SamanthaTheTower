# Source — Samantha GRE metadata export (format v39)

- Source ID: `SRC-GRE-METADATA-V39`
- Title/name: Samantha GRE extracted metadata package
- Author/maintainer: Samantha project repository; original extractor/source attribution not fully established in this record
- Source type: Reverse-engineered metadata export / structural extraction
- Repository: https://github.com/gamesloricca-afk/SamanthaTheTower
- Branch/ref inspected: `TestAccount`
- Source files:
  - `GRE/3/manifest.json`
  - `GRE/3/MECHANISMS.md`
  - `GRE/3/mechanism_evidence.json`
  - `GRE/1/01_game_fundamentals.json`
  - `GRE/1/02_enemies.json`
  - `GRE/1/03_battle_conditions.json`
  - `GRE/1/04_combat_mechanics.json`
- Source binary name in manifest: `DOC-20261127-WA0002.bin`
- Original binary availability: NOT PRESENT in checked-in tree during this inspection
- SHA-256 recorded in manifest: `8266355fab717d91b51482122b66551afc62502b0f62fd8527930962cbefe81c` (recorded value; not independently recomputed in this task)
- Binary size recorded: 11,069,036 bytes
- GRE metadata format: `v39` (not a game release version)
- Game version/build: UNKNOWN
- Access date: 2026-11-27
- License/attribution: UNKNOWN for original binary; preserve project attribution and do not redistribute source binary without confirming rights.
- Authority assessment: Direct evidence of what the extracted metadata package declares; not developer-official runtime implementation evidence.
- Recency assessment: Repository branch inspected 2026-11-27; do not infer game build from export date or metadata format.

## What this source supports

- Presence of extracted type, field, method, property, parameter, token, and offset records.
- Cross-domain declaration references and the structural relationships explicitly encoded in the export.
- The exact names and metadata indices/tokens/offsets recorded in the listed JSON exports.

## What this source does not support

- Native method-body logic or exact call graph.
- Runtime execution order, reduction stacking, numeric formulas, caps, or conditions from names alone.
- A verified game release/build number.
- Treating duplicate declarations in overlapping domain exports as independent corroboration.
- Treating decoded candidate defaults as verified gameplay values.

## Related records

- Claims: `CLM-D04-DR-006`, `CLM-D04-DR-007`, `CLM-D04-DR-008`
- Report: `GRE/EVIDENCE/reports/D04-01_damage-reduction-pipeline.md`
