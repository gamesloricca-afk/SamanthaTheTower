# GRE Audit 04 — Domain 03: Battle Conditions

- Audit ID: `GRE-AUDIT-D03`
- Source: `GRE/1/03_battle_conditions.json` and `GRE/1/03_battle_conditions.md`
- Source branch: `TestAccount`
- Source binary identity: manifest SHA-256 `8266355fab717d91b51482122b66551afc62502b0f62fd8527930962cbefe81c`
- Metadata format: v39
- Status: **CONTENT REVIEWED; behavioral verification incomplete**
- Changes to source files: none

## 1. Domain structure

The domain contains 48 type records:
- 34 named types;
- 14 compiler-generated/helper records.

The named types cover five broad areas:
1. Battle Condition / Heat / Overheat presentation and data structures.
2. Dissonance state, boost, and remote-data structures.
3. Battle history and stat presentation.
4. Tournament data, lifecycle, league, leaderboard, and prize structures.
5. Wave information UI.

The domain is therefore broader than the title “Battle Conditions”: it includes tournament and battle-history subsystems as well.

## 2. Battle Conditions data and UI

Directly declared types and fields:

### BattleConditionTile
Fields: `nameText`, `levelText`, `descriptionText`, `_numberFormat`.
Methods include `SetCondition`.

### BattleConditionsPanelUI
Fields include heat/overheat panels, tabs, tile arrays, tournament state, and last selected tab. Methods include `Populate`, `PopulateTileArray`, `Button_HeatTab`, and `Button_OverheatTab`.

### HeatDefinition
Fields:
- `IsOverheat`
- `ConditionIndex`
- `ActivationWave`
- `Levels`

### Entry
Fields:
- `ConditionIndex`
- `DisplayLevel`
- `ActivationWave`

### BattleConditionsSnapshot
Fields:
- `HeatEntries`
- `OverheatEntries`

**VERIFIED:** the metadata declares separate Heat/Overheat views and data records containing a condition index, activation wave, level data, and snapshot collections.

**INFERRED:** Battle Conditions may be represented as indexed entries with a level and activation wave, and snapshots preserve Heat and Overheat collections separately.

**NOT ESTABLISHED:** the actual condition catalog, condition names, level values, effects, stacking, activation rules, wave timing semantics, or whether a condition is active in a given game mode. The manifest says remote configuration is not supplied, and this domain does not contain a complete condition-value catalog.

### Developer panel

`DevPanelBattleConditions` exposes fields such as `TableMin`, `TableMax`, `HardCap`, `LevelRanges`, condition index, and level, with methods to rebuild dropdowns, edit levels, add/remove overrides, push overrides to the game, and show results.

This is evidence of developer/debug tooling for condition overrides. Its table/range fields must not be treated as the production condition table without validating their origin and runtime use.

## 3. Dissonance subsystem

The domain contains:
- `DissonanceType`
- `DissonantBoostDisplay`
- `DissonanceRemoteData`
- `DissonanceBoost`
- `DissonanceManager`
- related UI and icon types.

### DissonanceType

Declared labels:
- `None`
- `Attack`
- `Defense`
- `Utility`
- `UltimateWeapon`

Candidate decoded values: 0–4 in the listed order.

### DissonantBoostDisplay

Declared labels:
- `BoostPlusEcho`
- `BoostOnly`
- `EchoOnly`

Candidate decoded values: 0–2 in the listed order.

### DissonanceRemoteData

Fields:
- `maxWave`
- `attackBonus`
- `defenseBonus`
- `utilityBonus`
- `ultimateBonus`

### DissonanceBoost

Fields include `waveReached`, `_researchIndex`, `_bonus`, `_maxWave`, and cached values. Methods include:
- `GetValue(int tier)`
- `GetValueWithoutLab(int tier)`
- `GetResearchBonus(int tier)`
- `GetWaveReached()`
- `IsMaxed()`
- `SetRecord`
- `SetBonus`
- `SetMaxWave`
- `CalculateGlobalBonus`
- `ResearchBonus(int tier)`

### DissonanceManager

Fields include:
- `damageBoost`
- `healthBoost`
- `coinBoost`
- `ultDamageBoost`
- `dissonantBoostDisplay`
- `dissonantRunActive`
- `selectedDissonance`
- `_newRecord`

Methods include `UpdateFromRemoteData`, `StartDissonantRun`, `GetBoost`, `GetBoostValue`, and `GetSelectedBoostValue`.

**VERIFIED:** the declaration model distinguishes Dissonance categories, boost objects, remote data fields, research-related methods, and selected/run state.

**INFERRED:** Dissonance has per-category boost values and a wave-related record/max-wave dimension. Research contributes through separate method declarations.

**NOT ESTABLISHED:** actual bonus percentages, max-wave values, research scaling, whether the “echo” modes add or replace bonuses, category restrictions, and the runtime rules for starting a Dissonant run. The remote values and method bodies are unavailable.

## 4. Battle history data model

`BattleHistoryEntry` is a very large record:
- 148 fields;
- 297 methods;
- 148 properties.

The field names cover:
- run identity and context: selected tower, date, game time, real time, tournament flag, tier, wave, killed-by;
- economy: coins, cash, interest, gems, cells, reroll shards, wave-skip income, Golden Tower/Black Hole/Spotlight/Orb sources, and other bonus sources;
- survivability: damage taken, wall damage, Berserk-related damage, Death Defy, lifesteal, health regeneration, recovery packages, and named damage-blocking categories;
- offense: total damage, projectile/thorn/orb/mine/electron damage, Death Ray, Smart Missiles, Inner Land Mines, Chain Lightning, Death Wave, Swamp, Black Hole, and Rend Armor;
- enemy statistics: total enemies and totals for multiple enemy types;
- hit and kill attribution: enemies hit by various sources and enemies destroyed by different sources;
- wave skip, free upgrades, level skips, and selected high-water marks;
- bot and Guardian outcomes: Flame Bot damage, Thunder Bot stuns, Golden Bot coins, Guardian damage/summons/currency and shard/module fetches;
- Dissonance type.

**VERIFIED:** the model declares a broad per-round record of combat, economy, enemy, bot, Guardian, and progression statistics.

**INFERRED:** BattleHistoryEntry is intended to support historical round summaries and stat panels, consistent with the related UI methods.

**NOT ESTABLISHED:** whether each field is populated in all modes, exact units, calculation/aggregation rules, field reset behavior, or whether the current UI displays every field.

This data model is an important cross-domain reference for later audits of Combat Mechanics, Economy, Bots, Guardians, and Ultimate Weapons. It should not be confused with a formula source.

## 5. Tournament subsystem

### Tournament league identifiers

`TournamentLeagueID` declares:
- `Copper`
- `Silver`
- `Gold`
- `Platinum`
- `Champion`
- `Legend`
- `Mythic`

Candidate decoded values: 0–6 in the listed order.

### Tournament data structures

- `TournamentData`: number, league name/id, bucket ID, rank, wave, ban state, player count.
- `TournamentInfo`: enabled, tournament number, minimum version, open/close/end/claim-end times, validity and server reference state.
- `TournamentAttempt`: tournament number, league ID, wave, fleet damage decimal.
- `TournamentRegistry`: tournament number, date, league ID, wave, rank.
- `TournamentPlayerData`: tournament history/claims and ban-related state.
- `TournamentPrizeEntry`: start/end rank, gems, stones, keys.
- `TournamentLeaderboardEntry`: id, position, player name, wave.
- `TournamentRegistryEntry`: icon, league name, date, rank, wave.

The metadata declares server/snapshot loading methods on tournament info/player data and a ban-active query on player data.

### TournamentManager

This type is large:
- 173 fields;
- 129 methods;
- 20 properties.

Fields include:
- tournament endpoint/path-like identifiers;
- Mythic, fleet-wave timing, and fleet-HP tiebreaker configuration field names;
- league and bucket state;
- tournament tickets and attempt state;
- tournament records and FTUE state;
- leaderboard state;
- prize data for multiple league names;
- UI state for tournament start/progress/finished panels.

Methods include:
- initialization and overtime checks;
- league name/tier and promotion/demotion helpers;
- join/register/start/end attempt flows;
- leaderboard retrieval/update;
- prize calculation and prize claims;
- ticket acquisition/purchase;
- tournament FTUE;
- relic awards and league promotion.

Selected signatures:
- `GetPromotionRank(int league) -> int`
- `GetDemotionRank(int league) -> int`
- `CalculateNewLeague(int rank, int league) -> int`
- `GetBracketPrizeMultiplier(int numPlayers, int league) -> float`
- `GetPrize(int rank, int league) -> TournamentPrizeEntry`
- `GetClaimPrize(int rank, int league) -> TournamentPrizeEntry`
- `TryRegisterAttempt(TournamentAttempt attempt) -> void`

**VERIFIED:** tournament progression, attempts, leaderboard, prize, league, ticket, and server-data interfaces are present as declarations.

**INFERRED:** some tournament rules depend on remotely supplied flags or data, because fields and methods explicitly refer to remote/server data and feature flags.

**NOT ESTABLISHED:** actual promotion/demotion thresholds, bracket prize multipliers, reward values, tournament schedules, player-count rules, fleet wave timing, fleet HP tiebreaker behavior, or the current remote-config values.

### Naming discrepancy to preserve

The enum `TournamentLeagueID` declares `Champion`, `Legend`, and `Mythic`, while `TournamentManager` contains fields named `grandChampionTournamentPrizes` and `pre29GrandChampionTournamentPrizes`, along with `pre29PlatinumTournamentPrizes` and `pre29ChampionTournamentPrizes`.

This is a **metadata naming divergence**. It may reflect legacy compatibility or naming history, but the metadata alone does not establish the reason. Preserve both names; do not silently rename the enum or infer that a current Grand Champion league exists.

## 6. WaveInfoPanel

Fields include `chance`, `health`, `damage`, `speed`, `mass`, and references to Main, Perks, Lab, and MiniBossController.

Methods include:
- `CalculateEnemyValues()`
- `ApplyVaultEnemyReductions()`

**INFERRED:** the UI has a path for displaying calculated enemy values and applying Vault-related enemy reductions before display.
**NOT ESTABLISHED:** the exact calculation, the meaning of each displayed number, whether the reduction is applied before or after other modifiers, or whether the UI values match actual spawned enemy values in all modes.

## 7. Other UI and state types

- `BattleConditionTile` and `BattleConditionsPanelUI`: condition presentation and Heat/Overheat tab UI.
- `BattleHistoryEntryUI`: displays a history entry and supports selection/deletion.
- `BattleHistoryRoundStatsPanel`: creates stat rows/section headers and has a clipboard action.
- `BattlePresetsUI`: exposes Tier, Tournament, and Dissonant context methods.
- `TournamentInfoUI` and other tournament UI types: presentation and league-status handling.
- `PanelState`: Start, TryAgain, Progress, Finished, Loading labels (numeric values are decoded candidates).

These types document presentation/state interfaces, not the rules behind them.

## 8. Audit conclusions

| Claim / conclusion | Classification | Status |
|---|---|---|
| Domain JSON contains 48 records: 34 named and 14 generated | OBJECTIVE | VERIFIED against parsed JSON |
| Heat/Overheat records expose condition index, activation wave, and level data | OBJECTIVE | VERIFIED as declarations |
| Dissonance declares category boosts, remote fields, and research-related methods | OBJECTIVE | VERIFIED as declarations |
| BattleHistoryEntry declares 148 fields and 148 properties | OBJECTIVE | VERIFIED against parsed JSON |
| TournamentManager exposes league, attempt, leaderboard, prize, ticket, and server interfaces | OBJECTIVE | VERIFIED as declarations |
| TournamentLeagueID names and numeric assignments | OBJECTIVE | Names VERIFIED; numbers DECODED_CANDIDATE |
| Current condition catalogue and exact effects | OBJECTIVE | NOT ESTABLISHED |
| Dissonance bonus formula and live remote values | OBJECTIVE | NOT ESTABLISHED |
| Promotion/demotion and prize formulas | OBJECTIVE | NOT ESTABLISHED |
| Grand Champion naming discrepancy is historical/legacy | OBJECTIVE | HYPOTHESIS only |

## 9. GKB promotion decision

Do not bulk-promote Domain 03. Useful later GKB claims may describe the existence and shape of the Battle Condition, Dissonance, tournament, and battle-history data models. They must not be converted into game rules without value sources or method implementations.

Preserve the TournamentLeagueID / GrandChampion naming divergence as an explicit unresolved metadata note. If independent fanmade sources disagree about leagues, schedules, or tournament rewards, retain the separate source claims and their versions.

## 10. Next

Proceed to Domain 04 — Combat Mechanics. Reuse BattleHistoryEntry and DamageReductionResult only as cross-reference evidence; do not treat their field names as formulas.
