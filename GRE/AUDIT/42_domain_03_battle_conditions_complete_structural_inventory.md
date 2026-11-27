# Domain 03 — Battle Conditions: Complete Structural Inventory

## Source identity

- Repository ref: `TestAccount`
- JSON: `GRE/1/03_battle_conditions.json`
- JSON blob SHA: `b65ff036f8e243814977aa2cff82c60a24a066ec`
- Companion Markdown: `GRE/1/03_battle_conditions.md`
- Markdown blob SHA: `88ad3e01bd8ebed427b330ce02a87563bcee834b`
- Source binary identity from existing domain review: manifest SHA-256 `8266355fab717d91b51482122b66551afc62502b0f62fd8527930962cbefe81c`
- Metadata format label: v39 (not a verified game release identifier)
- JSON evidence label: `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`

## Complete structural inventory

The parsed JSON contains 48 type records: 34 named/non-generated records and 14 compiler-generated/helper records by the simple name-prefix classification.

| Type index | Type name | Fields | Methods | Properties |
|---:|---|---:|---:|---:|
| 112 | `BattleConditionTile` | 4 | 3 | 0 |
| 113 | `<>c` | 3 | 4 | 0 |
| 114 | `BattleConditionsPanelUI` | 15 | 6 | 0 |
| 115 | `BattleHistoryEntryUI` | 20 | 8 | 0 |
| 116 | `BattleHistoryEntryUIMode` | 3 | 0 | 0 |
| 117 | `BattleHistoryStatData` | 3 | 1 | 0 |
| 118 | `BattleHistoryRoundStatsPanel` | 6 | 9 | 0 |
| 122 | `BattlePresetsUI` | 7 | 10 | 2 |
| 230 | `HeatDefinition` | 4 | 1 | 0 |
| 231 | `Entry` | 3 | 1 | 0 |
| 232 | `BattleConditionsSnapshot` | 2 | 1 | 0 |
| 281 | `<>c__DisplayClass34_0` | 2 | 2 | 0 |
| 282 | `DevPanelBattleConditions` | 19 | 21 | 1 |
| 283 | `DissonanceBonusUI` | 8 | 8 | 0 |
| 284 | `DissonanceBoost` | 7 | 15 | 2 |
| 285 | `DissonanceInfoUI` | 2 | 3 | 0 |
| 286 | `DissonanceType` | 6 | 0 | 0 |
| 287 | `DissonantBoostDisplay` | 4 | 0 | 0 |
| 288 | `DissonanceRemoteData` | 5 | 0 | 0 |
| 289 | `DissonanceManager` | 12 | 30 | 13 |
| 290 | `DissonanceTabButton` | 2 | 5 | 0 |
| 291 | `DissonanceTypeIcon` | 5 | 2 | 0 |
| 515 | `TournamentLeagueID` | 8 | 0 | 0 |
| 619 | `BattleHistoryEntry` | 148 | 297 | 148 |
| 988 | `TournamentData` | 8 | 2 | 1 |
| 989 | `<>c__DisplayClass21_0` | 3 | 3 | 0 |
| 990 | `TournamentInfo` | 12 | 12 | 1 |
| 991 | `TournamentInfoUI` | 4 | 4 | 0 |
| 992 | `PanelState` | 6 | 0 | 0 |
| 993 | `<>c` | 4 | 5 | 0 |
| 994 | `<>c__DisplayClass249_0` | 3 | 2 | 0 |
| 995 | `<>c__DisplayClass254_0` | 2 | 2 | 0 |
| 996 | `<>c__DisplayClass258_0` | 3 | 2 | 0 |
| 997 | `<>c__DisplayClass283_0` | 2 | 2 | 0 |
| 998 | `<OneSecondCheckers>d__220` | 4 | 6 | 2 |
| 999 | `<TournamentPanelUpdateTimeLeftCoroutine>d__271` | 4 | 6 | 2 |
| 1000 | `<TournamentUpdateDataCoroutine>d__270` | 4 | 6 | 2 |
| 1001 | `<TryRegisterAttemptCoroutine>d__253` | 4 | 6 | 2 |
| 1002 | `TournamentManager` | 173 | 129 | 20 |
| 1003 | `TournamentPrizeEntry` | 5 | 1 | 0 |
| 1004 | `TournamentLeaderboardEntry` | 4 | 2 | 0 |
| 1005 | `TournamentAttempt` | 4 | 9 | 4 |
| 1006 | `TournamentRegistry` | 5 | 11 | 5 |
| 1007 | `<>c__DisplayClass20_0` | 3 | 3 | 0 |
| 1008 | `TournamentPlayerData` | 9 | 15 | 2 |
| 1009 | `TournamentRegistryEntry` | 5 | 2 | 0 |
| 1109 | `<WaveInfoPanelUpdateFunction>d__26` | 3 | 6 | 2 |
| 1110 | `WaveInfoPanel` | 20 | 10 | 1 |

Totals: **592 fields, 673 methods, 210 properties**.

## Decoded constant inventory

- Fields marked `DECODED_CANDIDATE`: **29**.
- Per-type candidate counts: `BattleHistoryEntryUI` 1; `BattleHistoryEntryUIMode` 2; `DevPanelBattleConditions` 3; `DissonanceType` 5; `DissonantBoostDisplay` 3; `TournamentLeagueID` 7; `PanelState` 5; `TournamentManager` 3.
- Raw bytes, decoded values, and decoder labels remain in the JSON. The earlier domain review notes contain selected semantic details and limitations; this inventory does not independently promote decoded candidates into runtime mechanics.

## Metadata-reference completeness

- Field type references: 0/592 resolved.
- Method return type references: 667/673 resolved.
- Method parameter type references: 324/354 resolved.
- Properties: 210; property type information is represented through accessor references rather than a direct resolved property type in this export.

## Relationship to existing domain review

The detailed content review remains in [04_domain_03_battle_conditions.md](04_domain_03_battle_conditions.md). This new document adds a complete per-type structural inventory and aggregate metadata-reference counts. The original GRE files are unchanged.

## Audit result

- Structural inventory: **COMPLETE** for all 48 records in the inspected JSON.
- Existing domain content review: **RETAINED**; see linked audit note above.
- Runtime behavior: use the limitations and evidence labels in the existing content review; method/field declarations alone do not prove runtime behavior.
- Game release version: **NOT IDENTIFIED** by metadata format v39 alone.
- GKB promotion: **NOT PERFORMED**.

