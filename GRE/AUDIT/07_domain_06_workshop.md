# GRE Audit 07 — Domain 06: Workshop

- Audit ID: `GRE-AUDIT-D06`
- Source: `GRE/1/06_workshop.json` and `GRE/1/06_workshop.md`
- Source branch: `TestAccount`
- Source binary identity: manifest SHA-256 `8266355fab717d91b51482122b66551afc62502b0f62fd8527930962cbefe81c`
- Metadata format: v39
- Status: **CONTENT REVIEWED; behavioral verification incomplete**
- Changes to source files: none

## 1. Domain structure

The domain contains 35 type records:
- 9 named types;
- 26 compiler-generated/helper records.

The nine named types are:
`DamageData`, `HitData`, `LightspeedPathData`, `UpgradeType`, `UpgradeMultiplier`, `ClosestEnemyEntry`, `Main`, `PlayerData`, and `WorkshopPanelTabs`.

There is no dedicated `Workshop` class in this domain's named type list. The substantive workshop declarations are located mainly in the shared `Main` and `PlayerData` types.

## 2. UpgradeType and WorkshopPanelTabs

`UpgradeType` declares nine categories:
- Attack
- Defense
- Utility
- WorkshopAttack
- WorkshopDefense
- WorkshopUtility
- EnhancementAttack
- EnhancementDefense
- EnhancementUtility

The extractor reports candidate numeric values 0–8 in that order.

`WorkshopPanelTabs` declares:
- Attack
- Defense
- Utility
- UltimateWeapon

Candidate numeric values: 0–3 in that order.

**VERIFIED:** these category and panel labels are present as metadata declarations.
**DECODED_CANDIDATE:** the numeric assignments are inferred default values.
**NOT ESTABLISHED:** exact UI navigation, category-to-tab mapping, whether all categories are visible to all players, or the current set of upgrades within each category.

The two enums are not interchangeable: one is a broad upgrade-type category, the other is a panel-tab label.

## 3. Main workshop state and interfaces

`Main` has 946 fields, 487 methods, and 62 properties. It is a shared game hub and not a workshop-only class.

Workshop-related field groups include:
- purchase multipliers: `workshopBuyMultiplier`, `enhancementBuyMultiplier`;
- upgrade values: `upgradeBaseCost`, `upgradeCost`, `upgradeLevel`, `upgradeMaxLevel`;
- category-specific Attack/Defense/Utility level, cost, max-level, unlock and tier fields;
- workshop attack/defense/utility level, base cost, current cost, tier cost, max level and cost multiplier fields;
- `implementedWorkshops`, `implementedDefenseWorkshops`, `implementedUtilityWorkshops`;
- preset level, tier-unlock and spending-total fields;
- enhancement name/description, base/current coin cost, level, max level, tier threshold and buy multiplier fields;
- enhancement-specific Attack/Defense/Utility state;
- free-upgrade chances, free-upgrade locks, and counters;
- respec and orb-distance fields.

Selected methods/signatures:
- `AddUpgradeCostMultiplier(UpgradeType type, int upgradeID, unresolved multipliers) -> void`
- `GetUpgradeCostMultiplier(UpgradeType type, int upgradeID, int level) -> double`
- `MultBuyCalc(UpgradeType type, int index, float exponentModifier, float exponent, float extraMultiplier, bool max) -> double`
- `MultBuySpecial(UpgradeType type, int index, bool max, unresolved costs) -> double`
- `CalculateEnhancementCosts(UpgradeType type, int index, float exponentModifier, float exponent, float extraMultiplier, bool isMax) -> void`
- separate category cost calculation methods for Attack/Defense/Utility, Workshop, Ultimate/Enhancement;
- upgrade button handlers for Attack/Defense/Utility and Workshop Attack/Defense/Utility;
- `WorkshopUpgradeTier()`, `WorkshopRespec()`, and `WorkshopEnhancementRespec()`.

**VERIFIED:** the metadata declares generic cost multiplier and multi-buy interfaces, separate cost calculation methods, category-specific upgrade button handlers, and workshop respec methods.

**INFERRED:** Workshop purchases are represented through shared upgrade-type dispatch and category-specific state rather than a dedicated Workshop class in this domain view.

**NOT ESTABLISHED:** any cost formula, exponent behavior, multi-buy rounding, max-buy calculation, purchase transaction order, tier unlock rules, free upgrade interactions, or respec refund behavior. The methods' bodies are absent.

## 4. PlayerData persistence model

`PlayerData` has 836 fields, 1,674 methods, and 835 properties. It is a very large serialized player-state type.

Workshop-related fields include:
- unlocked tier state for Attack/Defense/Utility;
- highest-ever unlocked tier state;
- workshop and enhancement buy multipliers;
- total upgrades bought and total workshop upgrades bought;
- total coins spent in Workshop and Enhancements, with Attack/Defense/Utility breakdowns;
- free Attack/Defense/Utility upgrade totals and per-round values;
- workshop Attack/Defense/Utility levels;
- enhancement Attack/Defense/Utility levels and unlocked tiers;
- workshop preset index/name and preset-specific level/tier/spending data;
- workshop tutorial/intro flags;
- Workshop Orb distance and saved distance;
- upgrade levels and free-upgrade lock state.

**VERIFIED:** the player-state schema has persistent fields for workshop levels, tier unlocks, presets, spending counters, multipliers, and tutorial state.
**INFERRED:** these fields are intended to preserve progression and preset state across saves.
**NOT ESTABLISHED:** the exact serialization format, migration rules, save compatibility, or whether every field is actively used in this binary.

This is account/save structure evidence, not universal upgrade formula evidence. Keep it separate from player-specific account values in SJI.

## 5. Candidate constants

The Markdown and decoded JSON expose candidate values:
- `WORKSHOP_BASE_PRESETS = 2`
- `workshopRespecCost = 150`
- `ORB_MIN_DISTANCE_WORKSHOP = 6`

These are **DECODED_CANDIDATE** values. The metadata does not establish the resource unit, current remote override, or whether a constant is still used by the live UI. Do not present them as current purchase prices or exact distance rules.

## 6. Audit findings

| Claim / conclusion | Classification | Status |
|---|---|---|
| Domain has 35 records: 9 named and 26 generated | OBJECTIVE | VERIFIED against parsed JSON |
| UpgradeType declares nine upgrade categories | OBJECTIVE | VERIFIED as declarations |
| WorkshopPanelTabs declares four panel labels | OBJECTIVE | VERIFIED as declarations |
| Main declares cost/multibuy/upgrade/respec interfaces | OBJECTIVE | VERIFIED as declarations |
| PlayerData declares workshop levels, tiers, presets, spending and tutorial fields | OBJECTIVE | VERIFIED as declarations |
| Workshop cost formula and purchase rounding | OBJECTIVE | NOT ESTABLISHED |
| Exact respec refund/cost behavior | OBJECTIVE | NOT ESTABLISHED |
| Candidate preset count, respec cost, orb distance are live current values | OBJECTIVE | NOT ESTABLISHED |

## 7. GKB promotion decision

Do not bulk-promote this domain. The most reusable GKB knowledge is the structural taxonomy of upgrade categories and the existence of cost-calculation/preset interfaces. Do not import PlayerData fields as universal game mechanics or account values.

When the formula source becomes available, document each upgrade separately with its cost basis, level, tier, modifiers, multi-buy behavior, caps, and version. Until then, keep formula fields as unresolved.

## 8. Next

Audit Domain 07 — Workshop Enhancements. It shares most of this domain's types, so identify only the genuinely additional enhancement-specific evidence and avoid duplicating Main/PlayerData claims.
