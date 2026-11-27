# GRE Audit 08 — Domain 07: Workshop Enhancements

- Audit ID: `GRE-AUDIT-D07`
- Source: `GRE/1/07_workshop_enhancements.json` and `GRE/1/07_workshop_enhancements.md`
- Source branch: `TestAccount`
- Source binary identity: manifest SHA-256 `8266355fab717d91b51482122b66551afc62502b0f62fd8527930962cbefe81c`
- Metadata format: v39
- Status: **CONTENT REVIEWED; behavioral verification incomplete**
- Changes to source files: none

## 1. Domain structure and overlap

The domain contains 34 type records:
- 8 named types;
- 26 compiler-generated/helper records.

Named types:
`DamageData`, `HitData`, `LightspeedPathData`, `UpgradeType`, `UpgradeMultiplier`, `ClosestEnemyEntry`, `Main`, and `PlayerData`.

This domain's named-type set is a strict subset of the Workshop domain's named-type set: `WorkshopPanelTabs` is not included here, and no dedicated Enhancement class appears. The enhancement system is represented by members inside the shared `Main` and `PlayerData` types.

## 2. Enhancement-related Main fields

The shared `Main` type declares:
- enhancement stat/state fields such as `damageEnhancement`, `attackSpeedEnhancement`, `criticalMultEnhancement`, `impetusEnhancement`, `superCritMultEnhancement`, `renderArmorMaxEnhancement`, `towerHealthEnhancement`, `towerHealthRegenEnhancement`, `defenseAbsEnhancement`, `landmineEnhancement`, `wallHealthEnhancement`, `orbSizeEnhancement`, `cashBonusEnhancement`, `coinsBonusEnhancement`, `cellsBonusEnhancement`, `allFreeUpgradesEnhancement`, `recoveryPackageEnhancement`, and `enemyLevelSkipEnhancement`;
- enhancement level/max-level and tier-unlock fields;
- separate Defense and Utility enhancement cost/level/unlock fields;
- enhancement coin cost, base coin cost, tier unlock threshold and multi-buy level fields;
- preset-specific enhancement levels and tier unlocks;
- `enhancementBuyMultiplier`.

The class also declares `CalculateEnhancementCosts`, `UpgradeEnhancementCostCalc`, `UpgradeUltimateEnhancementCostCalc`, `EnhancementAttackButton`, `EnhancementDefenseButton`, `EnhancementUtilityButton`, `UnlockEnhancementButton`, and Defense/Utility unlock handlers.

**VERIFIED:** enhancement-specific names and method declarations exist in the shared Main class.
**INFERRED:** the code distinguishes Attack, Defense, and Utility enhancement tracks, with separate unlock, cost, level, and purchase interfaces.
**NOT ESTABLISHED:** the list of player-visible enhancement effects, actual stat effects, unlock conditions, costs, scaling, caps, or purchase order.

## 3. PlayerData enhancement persistence

The `PlayerData` schema declares:
- `enhancementLevel`, `enhancementDefenseLevel`, `enhancementUtilityLevel`;
- corresponding tier-unlocked fields;
- preset copies of these levels and tier-unlock values;
- `totalCoinsSpentEnhancements` and Attack/Defense/Utility spending breakdowns;
- enhancement buy multiplier.

**VERIFIED:** enhancement progression and spending state are represented in the serialized player-data schema.
**INFERRED:** the game tracks enhancement levels and unlocked tiers separately by category and preserves preset-specific values.
**NOT ESTABLISHED:** save migration, exact field semantics, or whether these fields map one-to-one to currently displayed enhancement rows.

## 4. Candidate constants

The shared Main metadata contains:
- `ATTACK_ENHANCEMENT_COUNT = 6`
- `DEFENSE_ENHANCEMENT_COUNT = 6`
- `UTILITY_ENHANCEMENT_COUNT = 6`

These are **DECODED_CANDIDATE** values. Their names suggest category counts, but the metadata does not establish whether they mean defined enhancements, displayed rows, maximum unlocks, or another internal count. Do not interpret them as an authoritative count of current upgrade effects without corroboration.

## 5. Key structural finding

Domain 07 does not introduce a new named class for enhancements. It is almost entirely a second topical projection of shared type declarations already present in Domain 06. This is important for GKB normalization:

- do not create duplicate Main or PlayerData entities per domain;
- retain domain membership as tags/source navigation;
- attach enhancement claims to the relevant member names and original type index;
- keep Workshop and Enhancement as related but separate categories where the declarations distinguish them;
- avoid treating the domain file boundary as a class boundary.

## 6. Audit conclusions

| Claim / conclusion | Classification | Status |
|---|---|---|
| Domain has 34 records: 8 named and 26 generated | OBJECTIVE | VERIFIED against parsed JSON |
| Domain's named types are a subset of Domain 06 | OBJECTIVE | VERIFIED by type names/indices |
| Main declares separate Attack/Defense/Utility enhancement fields and handlers | OBJECTIVE | VERIFIED as declarations |
| PlayerData declares enhancement levels, tiers, presets, and spending counters | OBJECTIVE | VERIFIED as declarations |
| Candidate count constants are 6 per category | OBJECTIVE | DECODED_CANDIDATE |
| Actual enhancement list, formulas, costs, caps, and effects | OBJECTIVE | NOT ESTABLISHED |
| Enhancement system has a dedicated class in this domain | OBJECTIVE | NOT FOUND in named type inventory |

## 7. GKB promotion decision

Do not bulk-promote Domain 07. Normalize its member-level enhancement declarations under the same shared Main/PlayerData types as Domain 06. Preserve Domain 07 membership as classification metadata, not as independent confirmation.

The next useful evidence is the actual enhancement catalogue and method implementations/config values. Without them, no numeric enhancement effect or formula should be asserted.

## 8. Next

Proceed to Domain 08 — Research. Cross-reference the enhancement unlock/research fields only where Research metadata independently supports the link.
