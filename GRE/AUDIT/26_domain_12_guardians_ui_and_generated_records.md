# GRE Audit 26 — Domain 12: Guardians (UI signatures and generated TowerBuddy records)

- Audit ID: `GRE-AUDIT-026`
- Inspection date: 2026-11-27
- Repository: `gamesloricca-afk/SamanthaTheTower`
- Branch: `TestAccount`
- Source JSON: `GRE/2/12_guardians.json`
- Source JSON blob SHA: `b90726fbdc2425c0aed6b7a7830b1d73ae3eb05c`
- Companion index: `GRE/2/12_guardians.md`
- Scope: follow-up signature pass for UI records #401/#408/#414/#420/#421 and compiler-generated TowerBuddy records #1010–#1029. No runtime behavior inferred.

## 1. UI and interaction signatures

### #401 BuddyModifierDetails

Resolved declarations:
- `OnOpen(chipIndex: Int32)`
- `UpdateDropTable()`
- `Button_Info()`
- `ClosePanel()`
- `UpdateChipDetails()`
- `Button_UpgradeChip(buttonIndex: Int32)`

Its properties expose `TowerBuddy` and `GuildManager`. Fields include a `dropTable` and parallel-looking button names/values/costs arrays. The metadata does not establish that these arrays have matching lengths or how values/costs are calculated.

### #408 ChipTileUI

Resolved signatures:
- `SetUnlocked(isUnlocked: Boolean)`
- `SetTileInfo(chipIcon: UnityEngine.Sprite, chipName: String)`
- `SetName(chipName: String)`
- `SetIcon(chipIcon: UnityEngine.Sprite)`
- `ToggleCheckmark(isActive: Boolean)`
- `ToggleNotification(isActive: Boolean)`
- `SetTapAndHoldModifierNumber(number: Int32)`
- `AddButtonListener(actionToCall: UnityEngine.Events.UnityAction)`

This is presentation and button wiring metadata, not chip effect logic.

### #414 GuardianPresetsUI

Resolved signatures:
- `UpdateGuardianPresetsUI()`
- `Button_SelectPreset(index: Int32)`
- `Button_HoldPreset(index: Int32)`

The type exposes a `GuildData` getter. No preset application conditions or costs can be derived from these names alone.

### #420 GuildBuddySlotUI

Resolved signatures:
- `SetEquippedName(name: String)`
- `SetEquippedIcon(chipIcon: UnityEngine.Sprite)`
- `SetEquipped()`
- `SetUnequipped()`
- `SetLocked()`
- `SetUnlockable(coinCost: String, isButtonInteractable: Boolean)`

The parameter name `coinCost` appears in the UI method signature. This does not independently verify the actual currency charged or any specific cost.

### #421 generated closure

The compiler-generated display class contains `chipIndex` and a reference to its owner, with callback `<UpdateUI>b__0`. This is implementation scaffolding associated by name with the GuildBuddyUI update path; it is not a separate gameplay concept.

## 2. TowerBuddy generated records (#1010–#1029)

All 20 records were inspected individually.

### #1010 static closure

Contains generated callbacks:
- `<get_IsBuddyActive>b__68_0(chip: ChipType): Boolean`
- `<GetAttackEnemiesInRange>b__124_0(e: Enemy): Double`

These signatures show callback parameter/return types only. They do not establish the predicate or sorting formula.

### #1011–#1023 display-class records

| Record | Generated owner indicated by name | Captured fields / callback evidence |
|---|---|---|
| #1011 | `PlayStealEffect` | enemy, effect, enemyPosition; callbacks take Single / no args |
| #1012 | `PlayAttackEffect` | enemy, effect, startPosition; callbacks take Single / no args |
| #1013 | `PlayCatchEffect` | effect, enemyProjectile; callbacks take Single / no args |
| #1014 | `PlayRepairWallTint` | wallRenderer, startColor |
| #1015 | `FetchSequence` | owner, searchPosition; callback takes Single |
| #1016 | `CleanupOldRewards` | today; four DateTime-to-Boolean callbacks |
| #1017 | `GetTotalGemsInLast24Hours` | cutoffTime; DateTime-to-Boolean callback |
| #1018 | `GetTotalMedalsInLast24Hours` | cutoffTime; DateTime-to-Boolean callback |
| #1019 | `GetTotalRareModulesInLast24Hours` | cutoffTime; DateTime-to-Boolean callback |
| #1020 | `GetTotalCommonModulesInLast24Hours` | cutoffTime; DateTime-to-Boolean callback |
| #1021 | `StartLazyMovement` | owner, floatAmplitudeFinal; two callbacks |
| #1022 | `AttachAllyEffects` | enemy, effect, startPosition; callbacks take Single / no args |
| #1023 | `AttachScareEffects` | enemy, effect; callbacks take Single / no args |

The method names and captured variables identify where compiler-generated callbacks are associated. They do not reveal callback bodies or the final effect.

The `cutoffTime` captures are consistent with time-window filtering being present in these named methods, but the metadata alone does not establish exact inclusion boundaries, timezone handling, deletion rules, or reward-cap behavior.

### #1024–#1029 iterator/coroutine records

| Record | Generated owner | Notable captured fields |
|---|---|---|
| #1024 | `AbilityRoutine` | iterator state and owner |
| #1025 | `CleanupFailEffect` | `fetchDuration`, `startTime` |
| #1026 | `DOSteal` | iterator state and owner |
| #1027 | `FetchSequence` | `doubleChance` |
| #1028 | `StartAllyEffect` | effect indices, angle step, orbit duration, elapsed, rotation speed |
| #1029 | `StartAttackEffect` | effect indices, angle step, orbit duration, elapsed, rotation speed |

Each exposes standard iterator members including `MoveNext(): Boolean`, `Dispose()`, and IEnumerator current/reset accessors. These are compiler-generated state machines. Captured variable names do not reveal the numerical values, timing formula, random distribution, or actual sequence behavior.

## 3. Structural interpretation and limitations

- The Guardian UI classes expose unlock, equip, unequip, slot purchase, upgrade, preset selection, and drop-table presentation entry points.
- TowerBuddy exposes ability-related callbacks and coroutine state machines for multiple named actions.
- Reward-history method names explicitly refer to totals in the last 24 hours; generated filters capture a `cutoffTime`. The actual time-window implementation remains unverified.
- The generated record inventory is not independent evidence for the parent methods; it is compiler output associated with them.
- No candidate constants were upgraded to verified status.
- No relationship or gameplay formula was inferred solely from matching names.

## 4. Classification

| Finding | Classification | Status |
|---|---|---|
| UI method signatures and callback signatures listed above | OBJECTIVE | VERIFIED as metadata |
| #1010–#1029 are generated closure/iterator records | OBJECTIVE | VERIFIED as metadata naming/shape |
| Reward-history methods use a cutoff-time capture | OBJECTIVE | VERIFIED as captured field and callback declaration; runtime behavior unverified |
| Actual chip drop rates, reward limits, ability timing, effects, and target selection | OBJECTIVE | NOT ESTABLISHED |

**Result:** the selected UI and generated-record signature pass is complete. Domain 12 still requires full method/field review and behavioral evidence. No source files outside the audit workspace were modified and no claims were promoted to GKB.
