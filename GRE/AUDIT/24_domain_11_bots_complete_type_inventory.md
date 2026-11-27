# GRE Audit 24 — Domain 11: Bots (complete type-record inventory and cross-scope review)

- Audit ID: `GRE-AUDIT-024`
- Inspection date: 2026-11-27
- Repository: `gamesloricca-afk/SamanthaTheTower`
- Branch: `TestAccount`
- Source JSON: `GRE/2/11_bots.json`
- Source JSON blob SHA: `f6b8107c565bc05a883a99649713929cc6b07a1e`
- Companion index: `GRE/2/11_bots.md`
- Companion blob SHA: `2977a0ec06bdef107fe3e601a1c550f88ad56864`
- Scope: complete inventory of the 42 listed type records, deeper declaration/signature review of selected records, and identification of cross-domain/shared metadata. This remains metadata analysis, not runtime verification.

## 1. Inventory verification

The JSON was parsed and its `types` array contains 42 records. The source `type_indices` list also contains 42 entries. The records are:

| Record range | Count | Structural grouping |
|---|---:|---|
| #139–#147 | 9 | Bot-related classes/enums plus one compiler-generated closure |
| #586–#591 | 6 | Shared data structures and upgrade category enum |
| #592–#600 | 9 | Compiler-generated closure/display-class records associated with Main methods |
| #601–#617 | 17 | Compiler-generated coroutine/iterator records associated with Main methods |
| #618 | 1 | Shared `Main` controller |
| **Total** | **42** | |

This grouping is based on record names, parent types, and generated method naming patterns. It does not claim that every record is exclusively part of the Bots gameplay system.

## 2. Bot-related records (#139–#147)

### #139 BotType and #140 AiState

Both records derive from `System.Int32` and expose enum-style fields.

- `BotType`: Flame, Thunder, Golden, Amplify, Bot.
- `AiState`: Attacking, Moving.

The integer defaults remain `DECODED_CANDIDATE`. The source metadata supports the field names and candidate values only; it does not establish stable save IDs, player-facing order, or full state-machine semantics.

### #141 Bot

The JSON confirms 16 fields, 19 methods, and 5 properties. The five getter-backed properties are:
- `Active` → Boolean
- `Cooldown` → Single
- `Duration` → Single
- `BotMoveSpeed` → Single
- `Synchronized` → Boolean

Selected method signatures:
- `BotUpdate(deltaTime: System.Single): System.Void`
- `ChangeState(state: AiState, customDuration: unresolved): System.Void`
- `SetRandomDestination(): System.Void`
- `ResetForRound(): System.Void`
- `InitializePosition(): System.Void`
- `ToggleActiveIfPossible(): System.Void`

The metadata does not resolve the type of `customDuration` in the available record. It also does not expose method bodies. The fields `durationTimer`, `cooldownTimer`, `aiState`, and `destination` indicate stored state names, not their exact update rules.

### #142 BotDescriptionPanel

11 fields, 5 methods, and 1 property. Resolved signatures include:
- `UpdateBotDescriptionPanel(botIndex: System.Int32): System.Void`
- `OnCooldownSliderLevelChanged(level: System.Int32): System.Void`
- `GetCooldownValueText(): System.String`
- `IsCooldownSliderActive`: Boolean getter

This is UI declaration evidence. It does not establish the displayed formula or slider bounds.

### #143 BotPresetsUI

5 fields, 7 methods, and 3 properties. Resolved declarations include:
- `Button_SelectPreset(index: System.Int32)`
- `Button_HoldPreset(index: System.Int32)`
- getters for `Bots`, `MissionEvent`, and `Main`

The names indicate UI entry points and referenced controllers, but not the selection/hold rules or costs.

### #144 compiler-generated closure

The record is named `<>c`, declares two compiler-generated fields, and contains `<ApplyBotPlusCorrection>b__106_0`. This is implementation scaffolding associated by name with a lambda/callback. It is not a player-facing Bots entity.

### #145 Bots controller

The JSON confirms 47 fields, 58 methods, and 7 properties. Its declaration surface is broader than basic bot activation and includes:
- bot unlock/active state and level-up APIs;
- Bot Plus unlock, cost, level, and benefit APIs;
- preset application and preset lock checks;
- Synchronicity accessors, unlock/upgrade, lead-bot lookup, and synchronization checks;
- Bot Plus correction/description/refund-named methods;
- cooldown timer accessors and round lifecycle methods.

Resolved method signatures include:
- `ApplyPresetWithCharge(index: System.Int32, showMessages: System.Boolean): System.Void`
- `CanApplyPresetForBattle(index: System.Int32, shortAmount: unresolved): System.Boolean`
- `GetBotLevelUpCost(level: System.Int32): System.Int32`
- `GetBotBenefit(index: System.Int32, level: System.Int32): System.Single`
- `GetBotPlusUpgradeCost(type: BotType): System.Int32`
- `GetBotPlusUpgradeCostAtLevel(type: BotType, level: System.Int32): System.Int32`
- `GetBotPlusBenefit(type: BotType, level: System.Int32): System.Single`
- `GetWildfireDuration(): System.Single`
- `SynchronicityUpgrade(): System.Void`
- `SynchronicityUnlock(): System.Void`
- `FindSynchronicityLeadBot(): System.Void`
- `GetSynchronicityLeadBotPosition(): UnityEngine.Vector3`
- `IsBotSynchronized(type: BotType): System.Boolean`
- `ApplyBotPlusCorrection(): System.Boolean`
- `LockBotPlusAndRefund(): System.Void`

Several parameter/return types remain unresolved in the metadata extract, including parts of the preset and Synchronicity data APIs. Preserve those as unresolved rather than inferring their types.

Field names include `currentBotPreset`, `botPresetName`, per-bot preset collections, `synchronicityUnlocked`, `synchronicityLevel`, `synchronicityPresets`, `medalsSpentOnBetaBotPreset`, `stonesSpentOnBetaSynchronicity`, and `cooldownTimersCache`. These names support the existence of corresponding data members in this build, not the current live rules or costs.

Candidate defaults from this record remain:
- `BOT_PLUS_UNLOCK_COST = 1250`
- `WILDFIRE_DAMAGE_BOOST = 3.0`
- `SYNCHRONICITY_UNLOCK_COST = 1500`
- `BOT_BASE_PRESETS = 2`

The `BOT_PLUS_CORRECTION_FIELD` value is raw-only text bytes; it is not decoded into a verified semantic claim. No candidate value is promoted to a verified live cost/effect.

### #146 UserBotData and #147 UserSynchronicityData

`UserBotData` has six fields and six getter/setter-backed properties:
- `Unlocked`, `Active`, `Levels`, `SelectedLevels`, `PlusUnlocked`, `PlusLevel`
- `Reset(isRespec: System.Boolean)`

The level collection property types are unresolved in the extract.

`UserSynchronicityData` has one field/property named `synchronicityBots` / `SynchronicityBots`, with getter/setter signatures whose collection type is unresolved. It also declares `Reset()`.

These records establish data-model members, not persistence format, migration rules, or gameplay behavior.

## 3. Shared records (#586–#591)

| Type | Fields | Methods | Declaration-level observation |
|---|---:|---:|---|
| `DamageData` #586 | 3 | 1 | `damage`, `crit`, `superCrit` |
| `HitData` #587 | 2 | 2 | `hitCount`, `bounceMultipliers`; `TotalHits(): Single` |
| `LightspeedPathData` #588 | 3 | 1 | `pathId`, `path`, `repeats` |
| `UpgradeType` #589 | 10 | 0 | enum-style Attack/Defense/Utility and Workshop/Enhancement variants |
| `UpgradeMultiplier` #590 | 2 | 1 | `level`, `multiplier`; constructor takes Int32 and Double |
| `ClosestEnemyEntry` #591 | 2 | 1 | `enemyIndex`, `distance`; constructor takes Int32 and Single |

These are shared implementation records, not evidence that damage, hit calculation, Lightspeed, or all upgrade categories belong exclusively to Bots. The `UpgradeType` candidate enum values are retained as decoded candidates.

## 4. Compiler-generated records (#592–#617)

The 26 records are generated closure/display-class and coroutine/iterator structures. Their source names connect them to methods on the shared `Main` controller, for example:
- closure/display-class records for `TowerFireFunction`, `GetLightSpeedBounceHitData`, `MultBuyCalc`, `MultBuySpecial`, and `TriggerMagneticHook`;
- iterator records for `AdStartFunction`, `AutoRetryBattle`, `DeathRayFunction`, `DemonModeEffect`, `GameOverFunction`, `NukeImmortalityEffect`, `SecondWindEffect`, `ShockwaveFunction`, `StartNewRoundFunction`, and `WallInvincibleEffect`.

The generated records expose compiler state fields such as `<>1__state`, `<>2__current`, and captured locals. They should be preserved in the source inventory, but not expanded into player-facing GKB concepts. Their presence is not evidence of Bots-specific behavior.

## 5. Shared Main controller (#618) and cross-domain overlap

The `Main` record has 946 fields, 487 methods, and 62 properties. It is a very large shared controller and is not a Bots-only type.

Bot/Guardian-related field names found in this record include:
- `bots`
- `totalDamageByBot`, `totalDamageByGuardian`
- `totalStunsByBot`, `totalCoinsByBot`
- `enemiesHitByThunderBotThisRound`, `enemiesHitByFlameBotThisRound`
- `enemiesDestroyedByFlameBotThisRound`
- `totalDamageByBotThisRound`, `totalDamageByGuardianThisRound`
- `totalSummonedByGuardianThisRound`, `totalCoinsStolenByGuardianThisRound`
- Guardian resource/currency tracking names for catches, fetched coins, gems, medals, reroll shards, cannon shards, armor shards, generator shards, core shards, and module rarities
- `botRespecCost`, `guardianRespecCost`, and `freeBotRespecs`

Related properties include `IsBotRespecFree`, `BotRespecCost`, and `GuardianRespecCost`, with resolved getter return types Boolean, Int32, and Int32 respectively.

These declarations indicate that the shared controller contains Bot/Guardian tracking and respec-related members. They do not prove the stat aggregation rules, respec eligibility, current respec prices, or how these values are updated.

The `Main` type also contains many unrelated combat, enemy, Workshop, Ultimate Weapon, economy, and battle lifecycle members. Its inclusion in the Bots source package is a scope-overlap warning: domain membership in this extracted package must not be treated as proof of semantic ownership.

## 6. Source-scope and classification conclusions

| Finding | Classification | Status |
|---|---|---|
| JSON contains 42 type records and 42 listed type indices | OBJECTIVE | VERIFIED against source JSON |
| #139–#147 contain the Bot-related declarations summarized above | OBJECTIVE | VERIFIED as metadata |
| #586–#591 are shared structures/enums | OBJECTIVE | VERIFIED as metadata; domain ownership not established |
| #592–#617 are compiler-generated structures tied by names to Main methods | OBJECTIVE | VERIFIED as declarations; runtime effects not assessed |
| #618 is a large shared Main controller with Bot/Guardian-named members | OBJECTIVE | VERIFIED as metadata |
| Candidate numeric defaults | OBJECTIVE | DECODED_CANDIDATE / EXTERNAL-UNVERIFIED |
| Bot behavior, live costs, formulas, respec conditions, synchronization rules | OBJECTIVE | NOT ESTABLISHED |

## 7. Audit result and remaining gaps

**Result:** the full 42-record inventory is now accounted for. The previous initial audit is extended with complete record grouping, deeper Bot/Bots signatures, UserBotData/Synchronicity data members, shared records, compiler-generated record classification, and Main cross-domain overlap.

This completes the **structural inventory pass** for Domain 11. It does not complete behavioral reverse engineering.

Remaining gaps:
1. Method bodies/IL or equivalent executable evidence are not available in this metadata JSON.
2. Several generic/collection and parameter types remain unresolved.
3. Candidate defaults have not been independently validated against another fanmade source or a game-version-specific data extract.
4. No current game release version is established by the metadata format label v39.
5. Cross-domain references to Guardians, Workshop, Economy, and combat require their own domain audits before relationship claims are made.

No original GRE files were changed. No claims were promoted to GKB. Contradictory fanmade sources, if found later, should be recorded side by side with their provenance rather than adjudicated as official truth.
