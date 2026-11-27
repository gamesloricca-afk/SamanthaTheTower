# Domain 09 — Modules: Assist Modules and Slot Integration

## Audit scope

- **Repository:** `gamesloricca-afk/SamanthaTheTower`
- **Branch:** `TestAccount`
- **Source file:** `GRE/1/09_modules.json`
- **Source blob SHA:** `016cc346998a2c3fafcc945ca0d01308a74e66d5`
- **Source domain marker:** `09_modules`
- **Source evidence status:** `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`
- **Audit batch:** findings 31–60 (30 new findings)
- **Audit focus:** Assist Module slots, slot-level upgrade interfaces, efficiency APIs, and preset data.

This audit is additive. It does not modify the GRE source JSON or promote any item into GKB.

## Interpretation and status rules

All 30 findings below are **OBJECTIVE / EXTERNAL-UNVERIFIED** as game mechanics, with direct support only for the existence and shape of metadata declarations. They are not runtime-verified behavior. A method name or signature documents an exposed interface, not its implementation, calculation, call order, eligibility rules, or in-game result.

Decoded enum numeric values and constant defaults are marked as candidates in the source metadata. They are not treated as confirmed values. No claim is made here about the actual beta rollout, costs, efficiency curves, bonus stacking, or refund behavior.

## Findings 31–60

### Assist slot data model

31. **Assist slot has an explicit unlock state.**  
    `AssistModuleSlot` declares an `unlocked` field and `get_Unlocked` / `set_Unlocked` accessors (field token `0x0400028c`; method tokens `0x060002a9`, `0x060002aa`). The declaration does not establish what unlocks a slot.

32. **Assist slot stores its own slot type.**  
    The `type` field is exposed through `get_Type` / `set_Type` and uses `AssistModuleSlotType` (field token `0x0400028d`; methods `0x060002ab`, `0x060002ac`).

33. **Assist slot stores a ModuleItem reference.**  
    `equippedModule` is typed as `ModuleItem`, with getter and setter (field token `0x0400028e`; methods `0x060002ad`, `0x060002ae`). This is a reference to the per-instance Module model, not merely a catalog index.

34. **Assist slot tracks three distinct efficiency-level counters.**  
    Separate integer fields exist for `uniqueEffectEfficiencyLevel`, `mainEffectEfficiencyLevel`, and `substatEfficiencyLevel`, each with its own getter/setter (field tokens `0x0400028f`–`0x04000291`). The declarations support separate stored progression values; they do not establish their effect sizes.

35. **Assist slot has a separate general level field.**  
    `level` is an integer with its own getter/setter (field token `0x04000292`; methods `0x060002b5`, `0x060002b6`). It is distinct from the three efficiency-level fields in the data model.

36. **Assist slot tracks Coins and Shards spent separately.**  
    `coinsSpent` is exposed as `System.Double`; `shardsSpent` is exposed as `System.Int32` (field tokens `0x04000293`, `0x04000294`). These are slot-level accounting fields; no refund or pricing rule is inferred.

37. **Assist slot type enum has four named categories.**  
    `AssistModuleSlotType` declares `Cannon`, `Armor`, `Generator`, and `Core` (field tokens `0x04000296`–`0x04000299`). Its decoded numeric values 0–3 are explicitly `DECODED_CANDIDATE`, not verified enum values.

### Manager state and limits

38. **ModuleManager has a separate Assist availability flag.**  
    The manager declares `assistModulesAvailable` and a `get_AssistModulesUnlocked` accessor (field token `0x04001c7d`; getter is present in ModuleManager metadata). The relationship between these two members is not established from declarations alone.

39. **Beta refund calculation has dedicated state.**  
    The manager declares `hasCalculatedAssistModulesBetaStonesRefund` and `assistModulesBetaStonesRefund` (field tokens `0x04001c7e`, `0x04001c7f`). The first is a Boolean-like field and the second an integer-like field; the amount, currency meaning, and calculation are unknown.

40. **A separate post-beta respec flag exists.**  
    `hasForceRespecAssistModulesAfterBeta` is declared (field token `0x04001c80`). Its name suggests a forced-respec state, but no trigger or execution behavior is proven.

41. **Assist slots are stored by ModuleManager.**  
    The manager declares `assistModuleSlots` (field token `0x04001c81`). The type reference is present, but the JSON metadata does not resolve the collection's generic element type here; do not assume its exact container shape.

42. **Assist slot unlock cost has a dedicated constant.**  
    `ASSIST_MODULE_SLOT_UNLOCK_COST` is declared (field token `0x04001c32`). Its decoded default is 1000 with status `DECODED_CANDIDATE`; currency and runtime value are not verified.

43. **Unique-effect efficiency has its own maximum-level constant.**  
    `ASSIST_MODULE_UNIQUE_EFFECT_EFFICIENCY_MAX_LEVEL` is declared (field token `0x04001c33`). Decoded candidate: 3. This is not evidence that the live cap is 3.

44. **Main-effect efficiency has its own maximum-level constant.**  
    `ASSIST_MODULE_MAIN_EFFECT_EFFICIENCY_MAX_LEVEL` is declared (field token `0x04001c34`). Decoded candidate: 99. This is not a verified live cap.

45. **Substat efficiency has its own maximum-level constant.**  
    `ASSIST_MODULE_SUBSTAT_EFFICIENCY_MAX_LEVEL` is declared (field token `0x04001c35`). Decoded candidate: 69. This is not a verified live cap.

### Shared slot-level interfaces

46. **Primary and Assist slot levels have named accessors.**  
    ModuleManager declares `GetPrimarySlotLevel(slotIndex)` and `GetAssistSlotLevel(slotIndex)`, both returning integers. Their presence distinguishes the two slot categories at the API level.

47. **A shared slot-level getter/setter accepts an Assist selector.**  
    `GetSlotLevel(isAssist, slotIndex)` and `SetSlotLevel(isAssist, slotIndex, level)` expose a common interface parameterized by a Boolean `isAssist`. This does not prove internal implementation sharing.

48. **Slot spending can be queried by slot category.**  
    `GetSlotCoinsSpent(isAssist, slotIndex)` returns a double and `GetSlotShardsSpent(isAssist, slotIndex)` returns an integer. Both accept the same `isAssist` selector.

49. **Slot spending has explicit add and clear operations.**  
    `AddSlotSpend(isAssist, slotIndex, coins, shards)` and `ClearSlotSpend(isAssist, slotIndex)` are declared. Their signatures show separate coin and shard inputs; accounting semantics are not available.

50. **Equipped-slot lookup accepts an Assist selector.**  
    `TryGetEquippedSlot(module, isAssist, slotIndex)` returns Boolean and has output-style parameters for the Assist selector and slot index in metadata. The success conditions and output values are unknown.

51. **Effective Module level and effective slot level are distinct APIs.**  
    `GetEffectiveModuleLevel(module)` is separate from `GetEffectiveLevelForSlot(isAssist, slotIndex, module)`. The latter is slot-scoped and distinguishes Assist from primary slots; no formula is inferred.

52. **Rarity-cap checking is slot-scoped.**  
    `IsSlotRarityCapped(isAssist, slotIndex, module)` returns Boolean. Its parameters indicate that cap checking can depend on slot category and index, but the cap rule is unknown.

53. **Level-up slot resolution is separately exposed.**  
    `ResolveLevelUpSlot(module, isAssist, slotIndex)` returns Boolean. The declaration establishes a resolution/check interface, not the conditions under which a slot is selected or accepted.

### Efficiency and benefit interfaces

54. **Main-benefit calculation has an Assist-aware overload.**  
    One `GetModuleMainBenefit` overload accepts `module`, `level`, `rarityOverride`, and `isAssist`; another accepts only `module`. This is evidence of an Assist-aware calculation interface, not proof of a particular scaling rule.

55. **Unique-effect efficiency maps an integer level to ModuleRarity.**  
    `GetAssistModuleUniqueEffectEfficiency(level)` returns `ModuleRarity`. This return type is noteworthy, but the mapping and resulting rarity values are unknown.

56. **Unique-effect efficiency has separate display and cost APIs.**  
    `GetAssistModuleUniqueEffectEfficiencyString(level)` returns a string, while `GetAssistModuleUniqueEffectCost(level)` returns an integer. No displayed format or cost unit is established.

57. **Main-effect efficiency supports both forward and inverse lookups.**  
    `GetAssistModuleMainEffectEfficiency(level, type)` returns a single-precision number, while `GetAssistModuleMainEffectLevel(efficiency, type)` returns an integer. Both are parameterized by `AssistModuleSlotType`; no curve or rounding behavior is available.

58. **Main-effect efficiency cost is exposed separately.**  
    `GetAssistModuleMainEffectCost(level)` returns an integer. The signature does not reveal whether the cost is cumulative, incremental, or which resource it represents.

59. **Substat efficiency has forward, inverse, and cost APIs.**  
    `GetAssistModuleSubstatEfficiency(level, type)` returns a single-precision number; `GetAssistModuleSubstatLevel(efficiency, type)` returns an integer; `GetAssistModuleSubstatCost(level)` returns an integer. No formula, cap enforcement, or cost unit is inferred.

### Slot lifecycle and preset data

60. **Assist slot lifecycle and preset storage are explicitly represented.**  
    ModuleManager declares per-type unlock methods (`UnlockCannonAssistModuleSlot`, `UnlockArmorAssistModuleSlot`, `UnlockGeneratorAssistModuleSlot`, `UnlockCoreAssistModuleSlot`), `EquipModuleAssist(module)`, and two `UnequipModuleAssist` overloads (by ModuleItem or slot index) that return a `ModuleItem`. It also declares `IsEquippedAssist` overloads, `IsEquippedOnPrimaryOrAssist` overloads, `RespecAssistModules()`, `IsDisabledAssistSubstat(cluster)`, `IsCappedAssistSubstatEffect(effect)`, and `GetEquippedAssistClusterBenefit(cluster)`. Separately, `ModulePresetData` stores `presetName`, `primaryModuleGuids`, and `assistModuleGuids`; ModuleManager exposes `SnapshotEquippedToPreset`, `ApplyModulePreset(index)`, and `ApplyPreset(preset)`. These declarations show that Assist equipment, Assist restrictions/status checks, Assist cluster benefit access, and preset representation are all present in the metadata. They do not establish the actual equip rules, respec refund, restrictions, bonus application order, or preset restoration behavior.

## Evidence and limitations

Primary evidence is the direct metadata declaration set in `GRE/1/09_modules.json`, blob SHA `016cc346998a2c3fafcc945ca0d01308a74e66d5`. Relevant type records include:

- `AssistModuleSlot` (type index 97)
- `AssistModuleSlotType` (type index 98)
- `ModuleManager` (type index 703)
- `ModulePresetData` (type index 717)
- `ModuleInfoUI` (type index 691)

The metadata includes field and method tokens for the items above. Method bodies are not available in this GRE JSON. Accordingly:

- No Assist efficiency formula has been recovered or validated.
- No cost, resource, unlock, respec, or refund value is confirmed.
- No statement is made about whether Assist bonuses stack additively, multiplicatively, or in another order.
- No statement is made about duplicate Module restrictions or whether one ModuleItem can occupy multiple slots.
- The decoded enum values and constant defaults remain candidates.
- The source's metadata/binary version is not a game release version.

## GKB disposition

**Do not import these findings as verified game mechanics.** They may be retained as source-structure observations and used to guide later method-body/runtime research. Any player-facing GKB claim about Assist Module behavior requires independent fanmade evidence or runtime-verifiable evidence, with conflicting sources preserved side by side rather than silently adjudicated.
