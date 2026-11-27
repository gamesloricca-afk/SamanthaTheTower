# GRE Audit 02 — Domain 01: Game Fundamentals

- Audit ID: `GRE-AUDIT-D01`
- Source: `GRE/1/01_game_fundamentals.json` and `GRE/1/01_game_fundamentals.md`
- Source branch: `TestAccount`
- Source binary identity: manifest SHA-256 `8266355fab717d91b51482122b66551afc62502b0f62fd8527930962cbefe81c`
- Metadata format: v39
- Status: **CONTENT REVIEWED; behavioral verification incomplete**
- Changes to source files: none

## 1. Domain structure

The JSON contains 53 type records:
- 16 named game types;
- 37 compiler-generated/helper records (names beginning with `<`, including closure/display-class and coroutine state-machine records).

The 16 named types are:

| Type | Fields | Methods | Properties |
|---|---:|---:|---:|
| StatType | 5 | 0 | 0 |
| ActiveStatsTracker | 15 | 16 | 1 |
| FTUEManager | 46 | 71 | 29 |
| GameClock | 0 | 2 | 2 |
| GameInitializer | 30 | 41 | 0 |
| GameplayUI | 3 | 6 | 2 |
| DamageData | 3 | 1 | 0 |
| HitData | 2 | 2 | 0 |
| LightspeedPathData | 3 | 1 | 0 |
| UpgradeType | 10 | 0 | 0 |
| UpgradeMultiplier | 2 | 1 | 0 |
| ClosestEnemyEntry | 2 | 1 | 0 |
| Main | 946 | 487 | 62 |
| StatDefinition | 7 | 1 | 0 |
| StatsConfiguration | 1 | 4 | 0 |
| StatsValueCalculator | 0 | 8 | 0 |

The large difference between 53 total records and 16 named types is expected from compiler-generated records. Those generated records should remain in raw metadata for traceability, but they should not automatically become player-facing GKB concepts.

## 2. Direct metadata observations

### 2.1 StatType

The enum declaration has members:
- `Cash`
- `Coins`
- `Damage`
- `CoinsWithoutFetch`

Candidate decoded numeric values in the extracted JSON:
- `Cash = 0`
- `Coins = 1`
- `Damage = 2`
- `CoinsWithoutFetch = 3`

**VERIFIED:** these names and field declarations are present in the metadata.
**DECODED_CANDIDATE:** numeric assignments above depend on inferred primitive-default decoding. Do not promote them to verified runtime values until the enum encoding is independently validated.

### 2.2 UpgradeType

The enum declares:
- `Attack`
- `Defense`
- `Utility`
- `WorkshopAttack`
- `WorkshopDefense`
- `WorkshopUtility`
- `EnhancementAttack`
- `EnhancementDefense`
- `EnhancementUtility`

The extractor reports candidate values 0 through 8 in the same order. Treat the labels as direct metadata and the numeric values as decoded candidates pending validation.

### 2.3 ActiveStatsTracker

Declared fields include:
- cash earning average and queue;
- coins earning average and queue;
- coins earning average and queue without fetch;
- damage average and queue;
- boss damage history;
- active boss damage entries;
- boss maximum health.

Declared methods include `Initialize`, `UpdateStat`, `UpdateStatQueue`, `UpdateEarningAverages`, `ResetBossStats`, `TryTrackBossStats`, history lookup methods, and boss damage-entry creation/retrieval methods.

Candidate decoded constants:
- `MAX_AVERAGING_QUEUE_SIZE = 300`
- `MAX_BOSS_DAMAGE_HISTORY = 10`
- `BOSS_DAMAGE_SOURCE_COUNT = 28`
- `TRACKER_INTERVAL = 1`

**INFERRED:** the class is a statistics-tracking component for cash, coin, damage, and boss-damage history. Its field and method names support that classification.
**NOT ESTABLISHED:** averaging formula, sampling cadence, queue eviction policy, damage-source meanings, history retention behavior, or whether all counters are active in every game mode.

### 2.4 GameClock

The metadata exposes getters/properties named `Time` and `UnscaledTime`.

**INFERRED:** the game distinguishes a clock value from an unscaled clock value.
**NOT ESTABLISHED:** units, update cadence, pause behavior, or how gameplay speed affects either value.

### 2.5 GameInitializer

The class has 30 fields and 41 methods. Its declared methods include:
- online/connectivity checks;
- Firebase availability checks;
- start/continue-start flow;
- GDPR and ad-consent flow;
- login and player initialization;
- remote settings loading;
- minimum game-version checking;
- purchaser initialization and timeout handling;
- Nexus initialization;
- loading progress and breadcrumb UI.

Candidate decoded constants:
- `STEP_TIMEOUT = 6`
- `BREADCRUMBS_TIMEOUT = 30`
- `PURCHASER_TIMEOUT = 10`

**INFERRED:** this class orchestrates application/game startup and service initialization.
**NOT ESTABLISHED:** the units of timeout constants, exact startup order, remote-config payload, online/offline fallback behavior, or the actual minimum/latest game version.

### 2.6 FTUEManager and GameplayUI

`FTUEManager` exposes flags and methods for tutorial completion/active state across workshop, cards, daily missions, themes, milestones, calendar events, tournaments, Ultimate Weapons, modules, and Battle Conditions. It also declares methods such as `CanCompleteUWTutorial`, `OnUltimateWeaponUnlocked`, and prompt/arrow display functions.

`GameplayUI` exposes fields for an ad coin-bonus text object and game-speed-up button, plus instance and language-update members.

**INFERRED:** these types concern onboarding/tutorial state and the in-battle UI.
**NOT ESTABLISHED:** exact tutorial gating, sequence, UI visibility conditions, or the behavior of any button.

### 2.7 StatsDefinition / Configuration / ValueCalculator

`StatDefinition` declares:
- `locId`
- `sectionLocId`
- `activeInPanels`
- `valueType`
- `customFormat`
- `showPercentage`
- `percentageTotalValueType`

`StatsConfiguration` declares `GetStatDefinitions`, `GetStatsForPanel`, `InitializeStatDefinitions`, and `AddStat`. The `AddStat` signature includes localization IDs, active panels, value type, custom format, percentage display, and percentage total value type.

`StatsValueCalculator` declares string-returning stat display methods and numeric-value methods for current-round and battle-history data, plus `GetTierValue`. Some numeric return type references are unresolved in the exported type map.

**INFERRED:** these classes separate stat definitions/panel configuration from value retrieval and display formatting.
**NOT ESTABLISHED:** the full stat catalogue, localization contents, formatting rules, stat-to-source mapping, or calculation formulas.

### 2.8 Small data/enum types

- `DamageData`: fields `damage`, `crit`, `superCrit`.
- `HitData`: fields `hitCount`, `bounceMultipliers`; method `TotalHits`.
- `LightspeedPathData`: fields `pathId`, `path`, `repeats`.
- `UpgradeMultiplier`: fields `level`, `multiplier`.
- `ClosestEnemyEntry`: fields `enemyIndex`, `distance`.

These are direct field declarations. Their complete construction, units, invariants, and runtime use are not established by field names alone.

## 3. Main is a cross-domain hub, not a narrow fundamentals class

The `Main` type has:
- 946 fields;
- 487 methods;
- 62 properties.

Examples of declared field references include `saveLoad`, `modules`, `lab`, `perks`, `tournament`, `relics`, `bots`, and `dissonanceManager`. It also declares state names for currencies (`cash`, `coins`, `gems`, `stones`, `medals`, `cells`, `keys`), current/highest wave, game speed, and enemy spawning.

Selected method signatures:
- `GetWaveBaseDamage(int wave) -> System.Double`
- `GetWaveBaseHealth(int wave) -> System.Double`
- `GetUltimateWeaponCost(int index, int level) -> System.Int32`
- `GetRecentCoinsPerHour() -> System.Double`
- `GetRecentCellsPerHour() -> System.Double`
- `GetThemesCoinBonus() -> System.Single`
- `CalculateCoinBonuses() -> System.Void`
- `NewWave() -> System.Void`

These signatures are direct metadata observations. They establish that these callable declarations exist with the recorded parameter/return metadata; they do not disclose formulas or call order.

The extracted Markdown lists candidate constants in `Main`, including `MAX_POSSIBLE_TIER = 24`, `DEFAULT_MAX_TIER = 24`, `MAX_DEFENSE_PERCENT = 98`, and several coin-bonus values. These remain **DECODED_CANDIDATE**, not verified gameplay rules. In particular, do not infer that a maximum tier of 24 is the live player-accessible cap without checking the relevant game version and runtime/configuration state.

**Classification issue:** the extraction script deliberately includes `Main` in several domains. Therefore, its presence in Game Fundamentals does not mean all 946 fields and 487 methods belong conceptually to fundamentals. Use the member-level subject and cross-domain context when creating GKB claims; do not import the whole class as one topic.

## 4. Quality and traceability notes

- The JSON preserves type indices, metadata offsets, tokens, raw type-record hex, field/method/property records, and parameter metadata. Keep these references attached to any extracted claim.
- Several field type references have `resolved_type: null`. This is not enough to conclude the record is corrupt: the manifest says runtime type indices can remain unresolved when there is no matching direct type definition in the exported map. Track these as unresolved references, not silently as a guessed type.
- Some method parameters, such as `context` on currency add/spend methods, also have unresolved type references.
- The domain includes 37 compiler-generated records, many corresponding to closures and coroutine/async state machines. Their generated members are not separate player-facing mechanics.
- The Markdown is a human-readable index; JSON is the detailed declaration source. For exact parameter types and offsets, consult JSON.

## 5. Audit conclusions

| Claim / conclusion | Classification | Status |
|---|---|---|
| Domain JSON contains 53 type records, 16 named and 37 compiler-generated | OBJECTIVE | VERIFIED against parsed JSON |
| StatType member names are Cash, Coins, Damage, CoinsWithoutFetch | OBJECTIVE | VERIFIED as declarations |
| StatType numeric assignments 0–3 | OBJECTIVE | DECODED_CANDIDATE |
| UpgradeType has nine named categories | OBJECTIVE | VERIFIED as declarations |
| UpgradeType numeric assignments 0–8 | OBJECTIVE | DECODED_CANDIDATE |
| ActiveStatsTracker stores earning/damage/boss-history related state | OBJECTIVE | INFERRED from declared member names |
| GameInitializer coordinates startup/service initialization | OBJECTIVE | INFERRED from declared member names |
| FTUEManager stores tutorial progress/active state | OBJECTIVE | INFERRED from declared member names |
| StatsConfiguration and StatsValueCalculator separate stat setup from value retrieval/formatting | OBJECTIVE | INFERRED from signatures/names |
| Main contains cross-system game state and methods | OBJECTIVE | VERIFIED as declarations; semantics limited |
| Any candidate constant is a confirmed live mechanic value | OBJECTIVE | NOT ESTABLISHED |

## 6. GKB promotion decision

**Do not bulk-promote Domain 01.** The domain is primarily declaration metadata. A small number of concepts may later be promoted as claims about the code structure (for example, the existence of a stat tracker or stat configuration system), but not as gameplay mechanics or formulas without additional evidence.

Recommended follow-up evidence:
1. obtain a matching executable/decompiler output or other method-body source for formulas and behavior;
2. inspect localization/config/asset data for stat definitions and user-facing labels;
3. cross-reference PlayerData and SaveLoad before documenting persistent stat fields;
4. compare with independently sourced fanmade references, preserving disagreements rather than resolving them by assumption.

## 7. Next

Proceed to Domain 02 — Enemies. Cross-reference Domain 04 — Combat Mechanics only when the relevant claim requires it; do not collapse the two domains.
