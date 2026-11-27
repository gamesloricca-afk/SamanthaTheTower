# Domain 09 — Modules: Leveling, Benefit, Effect-Slot, and Shatter Interfaces

## Audit scope

- **Repository:** `gamesloricca-afk/SamanthaTheTower`
- **Branch:** `TestAccount`
- **Source file:** `GRE/1/09_modules.json`
- **Source blob SHA:** `016cc346998a2c3fafcc945ca0d01308a74e66d5`
- **Audit batch:** findings 61–90 (30 new findings)
- **Focus:** Module base/main benefit APIs, effect-slot APIs, shard and reroll-cost interfaces, empty-effect handling, and slot-level progression.

This note is additive. It does not modify the GRE source file or promote any claim into GKB.

## Claim status and interpretation

All findings are **OBJECTIVE / EXTERNAL-UNVERIFIED** as game mechanics. They are directly supported as metadata declarations only. Method signatures establish that an API is declared; they do not reveal method bodies, formulas, execution order, resource rules, or live game behavior.

The source metadata contains unresolved type references for some return structures. Those are preserved as unresolved rather than guessed. No decoded candidate values are upgraded to verified values.

## Findings 61–90

### Base and main benefit interfaces

61. **Cannon has a dedicated base-benefit API.**  
    `GetCannonBaseBenefit(rarity)` accepts `ModuleRarity` and returns `System.Single` (method token `0x06001828`-adjacent index 6168). This establishes a rarity-parameterized Cannon base-benefit interface, not its numeric values.

62. **Armor has a dedicated base-benefit API.**  
    `GetArmorBaseBenefit(rarity)` accepts `ModuleRarity` and returns `System.Single` (method index 6169). No Armor scaling values are present in this declaration.

63. **Generator has a dedicated base-benefit API.**  
    `GetGeneratorBaseBenefit(rarity)` accepts `ModuleRarity` and returns `System.Single` (method index 6170). No formula is inferred.

64. **Core has a dedicated base-benefit API.**  
    `GetCoreBaseBenefit(rarity)` accepts `ModuleRarity` and returns `System.Single` (method index 6171). No formula is inferred.

65. **Cannon has a separate rarity-and-level main-benefit API.**  
    `GetCannonMainBenefit(rarity, level)` accepts `ModuleRarity` and an integer level, returning `System.Single` (method index 6172). The signature distinguishes this from the base-benefit method.

66. **Armor has a separate rarity-and-level main-benefit API.**  
    `GetArmorMainBenefit(rarity, level)` returns `System.Single` (method index 6173). The metadata does not expose its curve.

67. **Generator has a separate rarity-and-level main-benefit API.**  
    `GetGeneratorMainBenefit(rarity, level)` returns `System.Single` (method index 6174). The metadata does not expose its curve.

68. **Core has a separate rarity-and-level main-benefit API.**  
    `GetCoreMainBenefit(rarity, level)` returns `System.Single` (method index 6175). The metadata does not expose its curve.

69. **Primary Module bonus has a type-based accessor.**  
    `GetPrimaryModuleBonus(type)` accepts `ModuleType` and returns `System.Single` (method index 6224). The signature identifies a primary-module bonus lookup but not its calculation or relationship to Assist bonuses.

70. **Post-merge benefit has a ModuleItem-based accessor.**  
    `GetModuleAfterMergeBenefit(module)` accepts a `ModuleItem` and returns `System.Single` (method index 6165). The name indicates a post-merge benefit query; it does not establish when or how the value changes.

### Effect-slot and rarity-dependent interfaces

71. **Maximum effect-slot count is queried from initial Module rarity.**  
    `GetEffectMaxSlots(initialRarity)` accepts `ModuleRarity` and returns an integer (method index 6182). This is distinct from the already-audited slot-index and slot-level methods; no slot-count table is provided here.

72. **Natural Epic status is queried using catalog infoIndex.**  
    `IsNaturalEpicModule(infoIndex)` accepts an integer and returns Boolean (method index 6184). The signature uses the catalog index rather than a ModuleItem parameter; its classification rule is unknown.

### Shard and reroll-cost interfaces

73. **Module shatter shard yield accepts both catalog identity and rarity.**  
    `GetShatterShards(infoIndex, rarity)` returns an integer (method index 6185). The two inputs show that the declared lookup is not expressed as rarity-only; no yield values are available.

74. **Unmerge shard amount is queried from original rarity.**  
    `GetUnmergeShards(originalRarity)` accepts `ModuleRarity` and returns an integer (method index 6186). This is a separate API from the shatter-yield lookup.

75. **A tier-based shard reward lookup exists.**  
    `GetShardsReward(tier)` accepts an integer tier and returns an integer (method index 6112). The resource's exact meaning and tier mapping are not established by the signature.

76. **Reroll cost is queried from a ModuleItem.**  
    `GetRerollCost(module)` accepts a `ModuleItem` and returns an integer (method index 6161). The metadata does not specify whether the cost depends on rarity, reroll count, or another field.

### Effect availability and empty-effect handling

77. **The manager can check whether a Module has empty effects.**  
    `HaveEmptyEffects(module)` accepts a `ModuleItem` and returns Boolean (method index 6140). The declaration does not identify which slots qualify as empty.

78. **The manager exposes a separate operation to roll empty effects.**  
    `RollEmptyEffects(module)` accepts a `ModuleItem` and returns void (method index 6142). Its relation to initial generation, merge, or restoration is not proven.

79. **Available-effect insertion accepts catalog info, clusters, Core-ban modifications, rarity, and an output collection.**  
    `TryAddAvailableEffects(info, clusters, modifiedCoreSubstatBans, tryRarity, available)` is declared (method index 6143). The signature shows that candidate availability can be supplied with a ModuleInfo, cluster collection, modified Core-ban data, and an EffectRarity input. The precise filtering algorithm is unavailable.

80. **The manager can check whether a Module has effects to reroll.**  
    `HasEffectsToReroll(module)` accepts a `ModuleItem` and returns Boolean (method index 6144). This is a distinct pre-check interface from the reroll operation itself; its criteria are unknown.

### Slot progression calculation interfaces

81. **Level-up calculation has a buy-multiplier variant.**  
    `CalculateLevelUpUsingBuyMultiplier(isAssist, slotIndex)` accepts a slot-category Boolean and slot index. Its return type is an unresolved metadata reference (type index 11710), preserved as unresolved.

82. **A one-step level-up calculation is separately exposed.**  
    `CalculateLevelUpOnce(isAssist, slotIndex)` uses the same slot selectors and the same unresolved return type (method index 6129). The name distinguishes a one-step calculation interface from bulk calculation interfaces, but not its exact increment.

83. **Level-up calculation can target the next effect index.**  
    `CalculateLevelUpToNextEffect(isAssist, slotIndex, nextEffectIndex)` accepts an explicit target effect index (method index 6130). Its return type remains unresolved (type index 11710).

84. **A fixed number of levels can be supplied to a level-up calculation.**  
    `CalculateLevelUp(isAssist, slotIndex, numberOfLevels)` accepts an explicit number of levels (method index 6131). The return type is unresolved (type index 11710); affordability and clamping behavior are unknown.

85. **Maximum level-up calculation has its own API.**  
    `CalculateLevelUpMax(isAssist, slotIndex)` returns an unresolved metadata type reference (type index 11673; method index 6132). The metadata does not disclose the resulting level or resource totals.

### Slot progression execution interfaces

86. **Execution can level a slot up to a selected next effect.**  
    `LevelUpToNextEffect(isAssist, slotIndex, nextEffectIndex, useResources)` returns void (method index 6133). The explicit `useResources` argument is present; its Boolean-like type is not fully resolved in this metadata record.

87. **Execution has a separate maximum-level operation.**  
    `LevelUpMax(isAssist, slotIndex, useResources)` returns void (method index 6134). This is distinct from the calculation method `CalculateLevelUpMax`; no guarantee is made that the two execute in a particular order.

88. **An internal target-level execution method is declared.**  
    `_levelUpToNewLevel(isAssist, slotIndex, newLevel, useResources)` accepts an explicit target level (method index 6135). Its underscore-prefixed name is preserved as metadata, not interpreted as proof of visibility or call order.

89. **A general slot level-up execution method is declared.**  
    `LevelUp(isAssist, slotIndex, useResources)` returns void (method index 6136). It shares the Assist selector and slot-index shape with the calculation APIs.

90. **Slot restoration is a separate operation with a display flag.**  
    `RestoreSlot(isAssist, slotIndex, showClaimViewer)` returns void (method index 6137). The signature indicates a presentation-related Boolean-like parameter named `showClaimViewer`; it does not establish what is restored, whether resources are refunded, or whether a claim is granted.

## Evidence and limitations

Primary evidence: direct metadata records in `GRE/1/09_modules.json`, blob SHA `016cc346998a2c3fafcc945ca0d01308a74e66d5`, type `ModuleManager` (type index 703), plus the related declarations for `ModuleType`, `ModuleRarity`, `ModuleInfo`, and `ModuleItem`.

Relevant method indices: 6112, 6128–6139, 6140, 6142–6144, 6161–6165, 6168–6175, 6182, 6184–6186, and 6224. The JSON metadata supplies declarations and tokens but not executable method bodies for this audit.

The following remain unknown:

- All numeric base and main benefit values and their scaling formulas.
- Whether benefit APIs return raw values, final values, or intermediate values.
- The precise definition of a natural Epic Module.
- Shatter and unmerge shard tables and any exceptions.
- Reroll cost progression and resource unit.
- Empty-effect generation conditions and candidate-selection algorithm.
- The concrete return schema for level-up calculation methods.
- Level-up affordability, rounding, caps, and resource deduction.
- What `RestoreSlot` restores and whether it refunds or grants anything.
- Any execution order among calculation and execution methods.

## GKB disposition

**Do not import these items as verified game mechanics.** Retain them as structural observations and as a roadmap for future body-level/runtime research. If independent fanmade sources later disagree about formulas, costs, or outcomes, preserve the sources side by side and record the disagreement without selecting a winner.
