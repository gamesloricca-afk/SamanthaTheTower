# Domain 08 — Research: Complete Structural Metadata Audit

## Scope and source identity

- Repository ref: `TestAccount`
- JSON source: `GRE/1/08_research.json`
- JSON blob SHA: `945812fbf0e41de7239e1800cd5bef5c765c7c56`
- Companion index: `GRE/1/08_research.md`
- Markdown blob SHA: `0bae088ee9f4ae23f21139b345c37ea607ab27a2`
- Source label: `Assembly-CSharp.dll metadata v39`
- Declared type indices: 15
- JSON evidence label: `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`

The repository's normal file fetch returned an empty body for the large JSON file, but the Git database blob endpoint returned the full 1.4 MB blob, which was parsed successfully. This closes the prior access gap for Domain 08.

## Complete structural inventory

The JSON contains 15 type records, 1,084 fields, 1,825 methods, and 850 properties.

| Type index | Type name | Fields | Methods | Properties |
|---:|---|---:|---:|---:|
| 523 | `<>c` | 3 | 4 | 0 |
| 524 | `<RebuildLayoutEndOfFrame>d__246` | 5 | 6 | 2 |
| 525 | `Lab` | 181 | 75 | 3 |
| 526 | `CompletedLab` | 3 | 8 | 3 |
| 527 | `ResearchCategory` | 12 | 0 | 0 |
| 528 | `Step` | 12 | 0 | 0 |
| 529 | `LabClockLogger` | 4 | 4 | 0 |
| 530 | `LabClock` | 6 | 11 | 3 |
| 531 | `LabFloating` | 10 | 5 | 0 |
| 532 | `LabFloatingNotification` | 2 | 1 | 0 |
| 533 | `<SpeedUpPanelUpdateCoroutine>d__7` | 3 | 6 | 2 |
| 534 | `LabSpeedUp` | 2 | 17 | 0 |
| 535 | `<LabProgressUpdateFunction>d__4` | 3 | 6 | 2 |
| 536 | `LabTimeManager` | 2 | 8 | 0 |
| 873 | `PlayerData` | 836 | 1674 | 835 |

## Lab and research declarations

### Lab (#525)

`Lab` has 181 fields, 75 methods, and 3 properties. Its fields include:
- Research identity and presentation: research name, plain name, description, benefit text, category groups, search/favorites, completed/hidden state.
- Research progression: current level, max level, base/current coin cost, base/current time, percent complete, completion date, current/next/base benefit, benefit increase, tier and milestone unlock requirements.
- Lab slots and runtime state: unlocked/active labs, research indices, level, unlock costs, idle labs, progress update state, speed-up values, and research queue state.
- History: completed lab entries, history panel, and saved favorite/collapse state.
- Speed-up UI: selected lab, time/multiplier choices, speed-up cost, boost, remaining time, and queue controls.

Methods cover research initialization, localization, requirement checks, assignment/cancel/swap, level increment/decrement, completion, unlock, instant completion, speed-up cost calculation, lab upgrade, category/favorite/search/queue UI, research-specific completion handlers, and Gold Box discount calculation.

Decoded candidates:
- `RESEARCH_LIMIT=260`
- `LAB_RUSH_GOLD_BOX_DISCOUNT≈0.015`

### ResearchCategory (#527)

Eleven named enum candidates:
`Main=0`, `Attack=1`, `Defense=2`, `Utility=3`, `Ultimate=4`, `Cards=5`, `Perks=6`, `Bots=7`, `Enemies=8`, `Modules=9`, `Favorites=10`.

This is the category enum declared in this source. It does not prove the exact research list assigned to each category or the current visible catalog.

## Lab time, offline progress, and speed-up declarations

- `LabClock` (#530): fields for Lab reference, speed-up state, seconds progressed this session, offline progress seconds, and time limits. Methods include `ProgressLabs`, `ProcessLabProgress`, `GetCurrentSpeed`, `ApplyTimeStep`, `HandleEvents`, `HandleBoostExpiration`, and `TryAutoQueueSpeedUp`.
- `LabTimeManager` (#536): initialization, progress update/restart, UI update, offline progress application, and active-lab time side-effect interfaces.
- `LabSpeedUp` (#534): speed-up panel, confirm, time/multiplier button handlers, auto-queue toggle, remote-config cost update, boost duration, set/clear boost.
- `LabClockLogger` (#529): session start, step logging, and console flush methods.
- `Step` (#528): 12 fields; the export does not provide a standalone behavioral explanation.
- `CompletedLab` (#526): date completed, lab number, level, with accessors.
- `LabFloating` (#531) and `LabFloatingNotification` (#532): floating lab notification declarations.
- Compiler-generated coroutine/closure types #523, #524, #533, and #535 are included in the inventory.

Decoded `LabClock` candidates:
- `EIGHTEEN_MONTHS_IN_SECONDS=47,088,000`
- `ONE_MONTH_IN_SECONDS=2,592,000`

These are source-decoded constants; the exact use of the time bounds and edge-case handling requires method implementation.

## Shared PlayerData overlap

`PlayerData` (#873) is a shared cross-domain record with 836 fields, 1,674 methods, and 835 properties. Research-related field names include lab unlock/level/research index/active state, research level and progress, completion date, completed labs, favorite labs, previous favorite ordering, lab queue and speed-up queue toggles/selections, and total coins spent on research.

The presence of saved-data fields documents the exported data model. It does not establish every serialization detail, migration rule, or update timing.

## Decoded constant inventory

The JSON contains 15 fields marked `DECODED_CANDIDATE`:
- Lab: 2
- ResearchCategory: 11
- LabClock: 2

Raw bytes, decoded values, and decoder labels are preserved in the source JSON.

## Metadata-reference completeness

Across all 15 records:
- Field type references: 0/1,084 have resolved type names.
- Method return type references: 1,638/1,825 are resolved.
- Method parameter type references: 739/926 are resolved.
- Properties: 850; property type information is represented through accessor references rather than a direct resolved property type in this export.

## Audit result

- Structural inventory: **COMPLETE** for all 15 records.
- Lab research state, category, assignment, completion, cost, speed-up, history, and UI declarations: **DOCUMENTED**.
- LabClock, LabTimeManager, offline progress, and auto-queue interfaces: **DOCUMENTED**.
- Decoded candidates: **RECORDED** with source traceability.
- Exact research catalog/benefits, cost/time formulas, boost stacking, offline progression limits, and speed-up queue rules: **NOT ESTABLISHED** by declarations alone.
- Game release version: **NOT IDENTIFIED** by `metadata v39` alone.
- GKB promotion: **NOT PERFORMED**.

## Next audit target

Domain 09 — Modules. The full JSON was successfully retrieved through the Git database blob endpoint; proceed with the complete 108-record structural audit rather than the prior partial index-only approach.
