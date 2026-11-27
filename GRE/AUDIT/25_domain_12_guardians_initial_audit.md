# GRE Audit 25 — Domain 12: Guardians (initial structural audit)

- Audit ID: `GRE-AUDIT-025`
- Inspection date: 2026-11-27
- Repository: `gamesloricca-afk/SamanthaTheTower`
- Branch: `TestAccount`
- Source JSON: `GRE/2/12_guardians.json`
- Source JSON blob SHA: `b90726fbdc2425c0aed6b7a7830b1d73ae3eb05c`
- Companion index: `GRE/2/12_guardians.md`
- Companion blob SHA: `0e5511aa639189abcf5f5b15a43682363313a70d`
- Source metadata label: `Assembly-CSharp.dll metadata v39`
- Scope: initial structural inventory and selected declaration/signature review. Runtime behavior is not verified.

## 1. Source inventory

The JSON declares `domain: 12_guardians`, `evidence_status: DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`, 65 type records, and 65 listed type indices.

The records group as follows:

| Record range | Count | Structural grouping |
|---|---:|---|
| #400–#422 (sparse indices) | 9 | Guardian preset, chip, UI, and Buddy declarations plus one generated closure |
| #586–#618 | 33 | Shared data/enum records, compiler-generated Main records, and shared Main controller |
| #853 | 1 | Guardian respec UI |
| #1010–#1031 | 22 | TowerBuddy generated closures/coroutines and core TowerBuddy/ability records |
| **Total** | **65** | |

The companion Markdown is a selected summary. The JSON contains full field, method, property, token, offset, and raw metadata records. Metadata format label v39 is not a confirmed game release version.

## 2. Directly observed Guardian declarations

### #400 GuardianPresetData

6 fields, 15 methods, and 6 properties:
- `unlocked`
- `chipSlot`
- `presetName`
- `chipLevel`
- `slotsUnlocked`
- `skinIndex`

Getter/setter declarations exist for all six properties. Resolved types include Boolean for `Unlocked`, String for `PresetName`, and Int32 for `SlotsUnlocked` and `SkinIndex`. Types for `ChipSlot` and `ChipLevel` are unresolved in this extract.

Methods include `CreateDefault(index: Int32): GuardianPresetData` and `Reset()`. This establishes a preset data shape, not the exact save schema, slot rules, or reset behavior.

### #401 BuddyModifierDetails

A MonoBehaviour-derived UI/controller record with 14 fields, 12 methods, and 3 properties. Fields include chip name/description/icon/warning, chip button names/values/costs, a `dropTable`, row labels/values, info button, and selected chip index.

Selected method declarations: `Awake`, `OnOpen`, `UpdateDropTable`, `Button_Info`, `ClosePanel`, `UpdateChipDetails`, and `Button_UpgradeChip`.

The names establish UI and drop-table-related declarations only. They do not establish drop probabilities, reward tables, or upgrade values.

### #408 ChipTileUI

A MonoBehaviour-derived UI record with 8 fields and 10 methods. It exposes methods for unlock state, tile info, name/icon, checkmark/notification state, tap-and-hold modifier number, and button listener setup. These are presentation/interaction declarations, not the underlying chip rules.

### #412 ChipType

An enum-style record deriving from `System.Int32`, with these field names:
- None
- Steal
- Catch
- Attack
- Scare
- Rush
- Ally
- Fetch
- Summon
- Scout
- Repair

Decoded candidates in the JSON are None=-1 and the remaining labels 0 through 9 in the order listed. All values are marked `DECODED_CANDIDATE`; they are not verified persistent identifiers or guaranteed UI order.

### #413 GuardianChips

7 fields, 16 methods, and 2 properties. Fields include modifier names/descriptions/icons, chip benefits, benefit names/costs, and maximum chip levels.

Resolved method declarations include:
- `GetCostToUpgradeBenefit(benefitIndex: Int32, currentLevel: Int32): Int32`
- `CalculateTotalCostSpentForBenefit(benefitIndex: Int32, currentLevel: Int32): Int32`
- `ResetGuardianChip(chipIndex: Int32): Void`
- `CalculateTotalBitsSpentOnGuardianChipsAndSlots(): Int32`
- `CalculateChipValues(): Void`
- `GetChipBenefitString(benefitIndex: Int32): String`
- `GetNewSlotCost(): Int32`
- `GetBitsSpentOnSlotUnlocks(): Int32`
- `GetBitsSpentOnSlotUnlocks(slotsUnlocked: Int32): Int32`
- `GetTotalBitsSpentOnGuardianPreset(preset: GuardianPresetData): Int32`

Properties expose `GuildData` and `GuardianSlotsAvailable`.

These names and signatures show that the class declares chip benefit/cost, slot-cost, reset, and accounting interfaces. They do not disclose formulas, resource units, exact costs, caps, or when these methods are invoked.

### #414 GuardianPresetsUI

A MonoBehaviour-derived UI record with 5 fields, 5 methods, and one `GuildData` property. Methods include `UpdateGuardianPresetsUI`, `Button_SelectPreset`, and `Button_HoldPreset`. This is UI declaration evidence only.

### #420 GuildBuddySlotUI and #422 GuildBuddyUI

`GuildBuddySlotUI` has 9 fields and 8 methods for equipped/unequipped/locked/unlockable slot presentation.

`GuildBuddyUI` has 10 fields, 14 methods, and 4 properties. Its fields include chip display order, guardian unlock/content UI, buddy skin display, modifier inventory/slots, guardian respec button, and preset UI.

Resolved methods include:
- `Button_UnlockGuardian()`
- `OpenBuddyModifierPanel()`
- `OpenBuddyChangeSkinPanel()`
- `UpdateUI()`
- `Button_EquipChip(chipIndex: Int32)`
- `Button_UnequipSlot(slotIndex: Int32)`
- `Button_BuyChipSlot()`
- `Button_UpgradeChip(benefitIndex: Int32)`
- `DoSlotUnlock()`

The field `GUARDIAN_UNLOCK_COST` has a decoded candidate value of 200. It remains a candidate and is not confirmed as the live unlock price or even as the currently applicable currency amount.

### #853 RespecGuardianUI

A MonoBehaviour-derived UI record with 7 fields and 3 methods. Fields name a respec confirmation button, gem/bits text, in-round warning, limit text, and unlimited text. It exposes `RespecGuardianPanelOpen()` and a `Main` getter. The declarations do not establish eligibility, frequency limits, or respec costs.

## 3. TowerBuddy core records

### #1030 TowerBuddy

The record derives from `UnityEngine.MonoBehaviour` and declares 61 fields, 68 methods, and 6 properties.

Fields include:
- ability references: `rushAbility`, `scareAbility`, `stealAbility`, `catchAbility`, `attackAbility`, `allyAbility`, `fetchAbility`, `summonAbility`, `scoutAbility`, and `repairAbility`;
- movement/presentation state such as min/max distance, movement duration, float cycles/amplitude/duration, sprite renderer, and current rest position;
- effect/coroutine references for several named ability effects;
- fetch reward state for gems, medals, rare modules, and common modules.

Selected resolved method signatures:
- `Initialize(isResumingRound: unresolved): Void`
- `UpdateAbilityTimers(deltaTime: Single): Void`
- `AbilityRoutine(): IEnumerator`
- `TryActivateOnRoundStart(isResumingRound: unresolved): Void`
- `OnRoundStart(isResumingRound: unresolved): Void`
- `OnRoundEnd(): Void`
- `TriggerSummon(customDuration: unresolved): Void`
- `CreateSummonPortal(spawnPosition: Vector3, customDuration: unresolved): Void`
- `TriggerSteal()`, `DOSteal(): IEnumerator`, `PlayStealEffect(enemies: unresolved)`
- `TriggerAttack()`, `StartAttackEffect(attackEffectIndices: unresolved): IEnumerator`, `PlayAttackEffect(enemies: unresolved, attackEffectIndices: unresolved)`
- `TryCatch(enemyProjectile: GameObject)`
- `TriggerRepair()`, `PlayRepairHealEffect()`, `PlayRepairWallTint()`
- `TriggerFetch()`, `FetchSequence(): IEnumerator`
- `GetTotalGemsInLast24Hours(): Int32`
- `GetTotalMedalsInLast24Hours(): Int32`
- `GetTotalRareModulesInLast24Hours(): Int32`
- `GetTotalCommonModulesInLast24Hours(): Int32`
- `GiveFetchCoinsReward(rewardPosition: Vector2)`
- `GiveCommonModuleReward(rewardPosition: Vector2)`
- `GiveRareModuleReward(rewardPosition: Vector2)`
- `GetAttackEnemiesInRange(range: Single, maxEnemies: Int32)`
- `GetEnemiesInRange(range: Single, maxEnemies: Int32, includeBosses: Boolean)`
- `GetStealEnemiesInRange(range: Single, maxEnemies: Int32)`
- `GetAllyEnemiesInRange(range: Single, maxEnemies: Int32)`
- `GuardianRespec()`, `FreeGuardianRespec()`, and `ClearActiveGuardianChipLoadout()`

Several collection/parameter types remain unresolved. Method names indicate declared pathways for movement, ability timing, round start/end, ally/attack/steal/catch/repair/fetch/scout/rush/scare/summon, and guardian respec. They do not prove actual targeting, activation order, effects, cooldown values, reward odds, or in-game outcomes.

Candidate defaults on this record:
- `MAX_MEDAL_FETCHES_PER_DAY = 10`
- `MAX_GEM_FETCHES_PER_DAY = 20`
- `MAX_COMMON_MODULE_FETCHES_PER_DAY = 5`
- `MAX_RARE_MODULE_FETCHES_PER_DAY = 2`
- `GUARDIANS_COUNT = 10`

All are `DECODED_CANDIDATE`. Do not use them as verified daily caps or current game limits.

### #1031 TowerBuddyAbility

7 fields: `count`, `countMax`, `duration`, `cooldown`, `durationRemaining`, `cooldownRemaining`, and `oneTimeAbilityReady`.

Properties: `IsActive`, `IsCountAbilityReady`, and `IsIncrementingCounter`.

Resolved methods:
- constructor `(duration: Single, cooldown: Single, count: Int32, countMax: Int32)`
- `UpdateAbility(duration: Single, cooldown: Single, count: Int32, countMax: Int32)`
- `ResetTimer()`
- `SetCooldownRemaining(cooldownRemaining: Single)`
- `UpdateTimer(deltaTime: Single)`

This is a generic ability state/timer data structure. Its presence does not prove that every named TowerBuddy ability uses identical timing or count semantics.

## 4. Candidate values and unresolved interpretation

The JSON marks these decoded values as candidates:
- `ChipType` enum values: None=-1; Steal=0; Catch=1; Attack=2; Scare=3; Rush=4; Ally=5; Fetch=6; Summon=7; Scout=8; Repair=9.
- `GuildBuddyUI.GUARDIAN_UNLOCK_COST = 200`.
- `TowerBuddy.MAX_MEDAL_FETCHES_PER_DAY = 10`.
- `TowerBuddy.MAX_GEM_FETCHES_PER_DAY = 20`.
- `TowerBuddy.MAX_COMMON_MODULE_FETCHES_PER_DAY = 5`.
- `TowerBuddy.MAX_RARE_MODULE_FETCHES_PER_DAY = 2`.
- `TowerBuddy.GUARDIANS_COUNT = 10`.

These values have no confirmed game-release applicability in this source package. Their names and decoded values do not establish the exact currency, reset window, exceptions, or whether runtime/remote configuration overrides them.

## 5. Shared and generated records

The package also includes:
- #586–#591: the same shared `DamageData`, `HitData`, `LightspeedPathData`, `UpgradeType`, `UpgradeMultiplier`, and `ClosestEnemyEntry` records seen in the Bots package.
- #592–#618: the same Main-associated closure/coroutine records and shared `Main` controller seen in the Bots package.
- #1010–#1023: 14 compiler-generated closure/display-class records associated by names with TowerBuddy methods such as `PlayStealEffect`, `PlayAttackEffect`, `PlayCatchEffect`, `PlayRepairWallTint`, `FetchSequence`, and `StartLazyMovement`.
- #1024–#1029: six compiler-generated iterator/coroutine records associated by names with `AbilityRoutine`, `CleanupFailEffect`, `DOSteal`, `FetchSequence`, `StartAllyEffect`, and `StartAttackEffect`.

Generated records should remain in the raw inventory, but they are not separate player-facing mechanics. Repeated shared records are not independent corroboration.

The shared `Main` record (#618) includes `TowerBuddy` and Guardian-related counters/fields such as `totalDamageByGuardian`, `totalCatchesByGuardian`, `totalCoinsByGuardian`, `totalDamageByGuardianThisRound`, `totalSummonedByGuardianThisRound`, `totalCoinsStolenByGuardianThisRound`, `totalCoinsFetchedByGuardianThisRound`, resource-fetch counters, and `guardianRespecCost`. It exposes a `TowerBuddy` property and `GuardianRespecCost` property. These are shared-controller declarations, not verified formulas or independent evidence for the values tracked.

## 6. Audit classification

| Observation | Classification | Status |
|---|---|---|
| JSON contains 65 type records and 65 listed indices | OBJECTIVE | VERIFIED against source JSON |
| Guardian preset/chip/UI and TowerBuddy declarations described above | OBJECTIVE | VERIFIED as metadata |
| Candidate ChipType values and numeric defaults | OBJECTIVE | DECODED_CANDIDATE / EXTERNAL-UNVERIFIED |
| Method names imply named ability, fetch, and respec pathways | OBJECTIVE (declaration-level) | VERIFIED as declarations; behavior unverified |
| Ability effects, targeting, cooldowns, reward odds, limits, costs, and chip formulas | OBJECTIVE | NOT ESTABLISHED |

Source authority and recency remain separate. This is reverse-engineered metadata, not an official developer specification.

## 7. Remaining gaps and next work

1. Inspect all remaining Guardian-specific fields/method signatures, especially `BuddyModifierDetails`, `GuildBuddySlotUI`, and the TowerBuddy generated records.
2. Determine whether the companion Guardian/chip UI and TowerBuddy ability structures are distinct systems or share data paths; do not infer from naming alone.
3. Cross-reference Research, Economy/Progression, and other relevant domains only after their source records are audited.
4. Compare any external fanmade values by preserving source attribution and disagreements side by side.
5. Keep every decoded numeric candidate unverified until independently assessed with source/version context.

**Result:** Domain 12 initial structural audit recorded. No runtime mechanics have been inferred as facts, no original GRE source files were changed, and no claims were promoted to GKB.
