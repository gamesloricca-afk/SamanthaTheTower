# GRE Audit 28 — Domain 12: Guardian accounting, respec, and Fetch declaration map

- Audit ID: `GRE-AUDIT-028`
- Inspection date: 2026-11-27
- Repository: `gamesloricca-afk/SamanthaTheTower`
- Branch: `TestAccount`
- Source JSON: `GRE/2/12_guardians.json`
- Source JSON blob SHA: `b90726fbdc2425c0aed6b7a7830b1d73ae3eb05c`
- Source companion: `GRE/2/12_guardians.md`
- Companion blob SHA: `0e5511aa639189abcf5f5b15a43682363313a70d`
- Scope: organize directly declared Guardian preset/chip accounting, respec, and TowerBuddy Fetch interfaces. This is a declaration map only; no method bodies or runtime traces were available in the inspected JSON.

## 1. Guardian preset data (#400)

Directly declared fields:
- `unlocked`
- `chipSlot`
- `presetName`
- `chipLevel`
- `slotsUnlocked`
- `skinIndex`

Relevant declared methods:
- `CreateDefault(index: System.Int32): GuardianPresetData`
- `Reset(): System.Void`
- Property accessors exist for all six exposed properties.

Type resolution is partial. The export resolves `Unlocked` to Boolean, `PresetName` to String, and `SlotsUnlocked` / `SkinIndex` to Int32 through accessor signatures. The `ChipSlot` and `ChipLevel` accessor types remain unresolved. The JSON does not establish how presets are persisted, selected, applied, or reset in gameplay.

## 2. Guardian chip and Bits accounting (#413)

Directly declared fields:
- `modifierName`
- `modifierDescription`
- `modifierIcon`
- `chipBenefits`
- `chipBenefitNames`
- `chipBenefitCosts`
- `chipLevelsMax`

Relevant method declarations:

| Method | Declared signature | What the declaration establishes |
|---|---|---|
| `GetCostToUpgradeBenefit` | `(benefitIndex: Int32, currentLevel: Int32): Int32` | A cost lookup API exists |
| `CalculateTotalCostSpentForBenefit` | `(benefitIndex: Int32, currentLevel: Int32): Int32` | A total-cost calculation API exists |
| `GetNewSlotCost` | `() : Int32` | A slot-cost lookup API exists |
| `GetBitsSpentOnSlotUnlocks` | `() : Int32` and `(slotsUnlocked: Int32): Int32` | Two slot-spend accounting overloads exist |
| `GetTotalBitsSpentOnGuardianPreset` | `(preset: GuardianPresetData): Int32` | A preset Bits accounting API exists |
| `CalculateTotalBitsSpentOnGuardianChipsAndSlots` | `() : Int32` | An aggregate Bits accounting API exists |
| `ResetGuardianChip` | `(chipIndex: Int32): Void` | A chip-reset operation is declared |
| `Dev_TryResetGuardianChipsIfNeeded` | `() : Void` | A development-named reset check is declared |

The class also declares `get_GuildData` and `get_GuardianSlotsAvailable`.

**Not established:** actual Bits costs, scaling curves, whether cost methods return incremental or cumulative values in every context, refund rules, reset eligibility, whether reset refunds all or part of spent Bits, and how preset-specific accounting is applied. Method names are not a substitute for method bodies.

## 3. UI and respec declarations (#422 and #853)

`GuildBuddyUI` exposes a `GuardianChips` getter and declares:
- `Button_UnlockGuardian()`
- `Button_EquipChip(chipIndex: Int32)`
- `Button_UnequipSlot(slotIndex: Int32)`
- `Button_BuyChipSlot()`
- `Button_UpgradeChip(benefitIndex: Int32)`
- `DoSlotUnlock()`

The UI class has a decoded constant candidate `GUARDIAN_UNLOCK_COST = 200`. Its source status is `DECODED_CANDIDATE`, not verified runtime price.

`RespecGuardianUI` declares fields for a window, confirmation button, Gems text, Bits text, in-round warning, limit text, and unlimited text. It declares `RespecGuardianPanelOpen()` and a `Main` getter.

`TowerBuddy` declares `GuardianRespec()`, `FreeGuardianRespec()`, and `ClearActiveGuardianChipLoadout()`.

Together these declarations identify a respec-related UI/API surface. They do **not** establish the actual respec price, free-respec conditions, respec limits, whether a respec is permitted during a round, what is refunded, or the exact order of operations. UI text field names are not proof of the rules they display.

## 4. TowerBuddy Fetch and reward declarations (#1030)

Fetch-related fields:
- `fetchSequenceCoroutine`
- `fetchGemRewards`
- `fetchMedalRewards`
- `fetchRareModuleRewards`
- `fetchCommonModuleRewards`

Fetch/reward method declarations:
- `TriggerFetch(): Void`
- `FetchSequence(): IEnumerator`
- `CleanupOldRewards(): Void`
- `GetTotalGemsInLast24Hours(): Int32`
- `GetTotalMedalsInLast24Hours(): Int32`
- `GetTotalRareModulesInLast24Hours(): Int32`
- `GetTotalCommonModulesInLast24Hours(): Int32`
- `GiveFetchCoinsReward(rewardPosition: Vector2): Void`
- `GiveFetchReward(): Void`
- `GiveCommonModuleReward(rewardPosition: Vector2): Void`
- `GiveRareModuleReward(rewardPosition: Vector2): Void`
- `PlayFetchFailEffect(): Void`
- `CleanupFailEffect(): IEnumerator`

Decoded constant candidates in the same class:
- `MAX_MEDAL_FETCHES_PER_DAY = 10`
- `MAX_GEM_FETCHES_PER_DAY = 20`
- `MAX_COMMON_MODULE_FETCHES_PER_DAY = 5`
- `MAX_RARE_MODULE_FETCHES_PER_DAY = 2`

All four values remain `DECODED_CANDIDATE`. The names and values suggest a daily-limit implementation, but this extract does not prove how the counters are incremented, what counts as a fetch, how failed fetches are treated, whether the limit is rolling or calendar-based, or which timezone is used.

The companion summary records a `cutoffTime` field in generated closure records associated by name with the four `GetTotal...InLast24Hours` methods. This is consistent with a time-window query being part of the implementation, but does not establish exact boundary handling or prove a rolling 24-hour algorithm.

## 5. Cross-domain connections visible in declarations

- `TowerBuddy` exposes a `moduleManager` getter and Fetch reward methods for Common/Rare Modules. This establishes a declared connection to a ModuleManager API, not the reward selection or module-generation rules.
- `GuardianChips` exposes `GuildData`; `GuildBuddyUI` exposes both `GuildData` and `GuardianChips`. This establishes declared access paths, not the ownership or persistence model.
- `GuardianPresetData` is accepted by `GetTotalBitsSpentOnGuardianPreset`. This establishes a method parameter relationship between the two declarations, not the accounting formula.
- `TowerBuddyAbility` stores `count`, `countMax`, `duration`, `cooldown`, `durationRemaining`, `cooldownRemaining`, and `oneTimeAbilityReady`. These are declaration-level state names; exact timer and activation semantics remain unknown.

## 6. Evidence gaps and next requirements

The inspected source JSON contains type/method/field metadata and raw declaration records, but no method bodies or IL for the methods above. Therefore the following remain unavailable from this source:
- Exact Guardian chip benefit formulas and Bits cost curves.
- Exact Guardian respec price/refund/limit behavior.
- Fetch reward tables, probabilities, reward selection, and failure semantics.
- Counter increment/reset rules and time-zone/boundary behavior.
- The actual interaction between Guardian Fetch and the Modules inventory/acquisition systems.

A method-body/IL-capable source dump with known binary identity and game release applicability is required to investigate those questions. Independent fanmade sources, if later supplied, should be recorded side by side with their own provenance rather than used to silently overwrite this extract.

## 7. Classification and disposition

- Direct declaration inventory: **OBSERVED IN SOURCE**.
- Decoded numeric constants: **DECODED_CANDIDATE**.
- Daily Fetch cap interpretation: **HYPOTHESIS** until method-body or independent evidence is available.
- Bits formulas, respec rules, and Fetch mechanics: **NOT ESTABLISHED**.
- No GKB claims promoted.
- No original GRE files changed.
