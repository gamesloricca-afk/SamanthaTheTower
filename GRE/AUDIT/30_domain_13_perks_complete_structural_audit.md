# Domain 13 — Perks: Complete Structural Metadata Audit

## Scope and source identity

- Repository ref: `TestAccount`
- JSON source: `GRE/2/13_perks.json`
- JSON blob SHA: `0dfbc592dec429c7ef46371d9c9a5e451a4fe5bc`
- Companion index: `GRE/2/13_perks.md`
- Markdown blob SHA: `45e6e7731c436015bfe7236637732654e89da8f9`
- Source label: `Assembly-CSharp.dll metadata v39`
- Declared type indices: 39
- Domain evidence label in JSON: `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`

The source label `metadata v39` is not, by itself, a verified game release version. The source export contains metadata records and decoded constant candidates, not method bodies or IL. This report records what the inspected files contain; it does not infer runtime behavior from names alone.

## Structural inventory

The JSON contains 39 type records, 1,984 fields, 2,349 methods, and 937 properties.

| Type index | Type name | Fields | Methods | Properties |
|---:|---|---:|---:|---:|
| 586 | DamageData | 3 | 1 | 0 |
| 587 | HitData | 2 | 2 | 0 |
| 588 | LightspeedPathData | 3 | 1 | 0 |
| 589 | UpgradeType | 10 | 0 | 0 |
| 590 | UpgradeMultiplier | 2 | 1 | 0 |
| 591 | ClosestEnemyEntry | 2 | 1 | 0 |
| 592 | <>c | 11 | 12 | 0 |
| 593 | <>c__DisplayClass1109_0 | 1 | 3 | 0 |
| 594 | <>c__DisplayClass1128_0 | 1 | 3 | 0 |
| 595 | <>c__DisplayClass1214_0 | 6 | 0 | 0 |
| 596 | <>c__DisplayClass1216_0 | 4 | 0 | 0 |
| 597 | <>c__DisplayClass1270_0 | 2 | 2 | 0 |
| 598 | <>c__DisplayClass1271_0 | 2 | 3 | 0 |
| 599 | <>c__DisplayClass1436_0 | 3 | 2 | 0 |
| 600 | <>c__DisplayClass1474_0 | 1 | 2 | 0 |
| 601 | <AdStartFunction>d__1413 | 4 | 6 | 2 |
| 602 | <AutoRetryBattle>d__1391 | 4 | 6 | 2 |
| 603 | <DeathRayFunction>d__1428 | 4 | 6 | 2 |
| 604 | <DemonModeEffect>d__1362 | 4 | 6 | 2 |
| 605 | <GameOverFunction>d__1388 | 5 | 6 | 2 |
| 606 | <GameSpeedValidationLogFunction>d__1431 | 3 | 6 | 2 |
| 607 | <GemBlockFunction>d__1418 | 3 | 6 | 2 |
| 608 | <GrantRetroAchievementsDeferred>d__1095 | 2 | 6 | 2 |
| 609 | <NukeImmortalityEffect>d__1376 | 3 | 6 | 2 |
| 610 | <ProjectFundingCoroutine>d__1140 | 5 | 6 | 2 |
| 611 | <RebuildWallFunction>d__1147 | 3 | 6 | 2 |
| 612 | <SecondWindEffect>d__1348 | 4 | 6 | 2 |
| 613 | <ShockwaveFunction>d__1435 | 3 | 6 | 2 |
| 614 | <StartNewRoundFunction>d__1144 | 4 | 6 | 2 |
| 615 | <StartNewRoundWallFunction>d__1146 | 3 | 6 | 2 |
| 616 | <WallInvincibleEffect>d__1148 | 7 | 6 | 2 |
| 617 | <_applyFTUEEnemySpawnDelay>d__1145 | 3 | 6 | 2 |
| 618 | Main | 946 | 487 | 62 |
| 775 | ChoicesType | 5 | 0 | 0 |
| 776 | <>c | 4 | 5 | 0 |
| 777 | <>c__DisplayClass97_0 | 2 | 3 | 0 |
| 778 | Perks | 72 | 39 | 4 |
| 779 | PerkPick | 2 | 6 | 2 |
| 873 | PlayerData | 836 | 1,674 | 835 |

## Perks class declaration

Type `Perks` (#778) declares 72 fields, 39 methods, and 4 properties.

### Fields directly relevant to perk behavior/UI

- Candidate constants: `ULTIMATE_CHANCE`, `TRADE_OFF_CHANCE`, `WAVES_TO_PERK`, `WAVES_TO_PERK_20`, `WAVES_TO_PERK_30`, `WAVES_TO_PERK_40`.
- Runtime/UI references and state names include `main`, `lab`, `perksPanel`, `newPerksContainer`, `autoPickPerkContainer`, `choicesPanel`, `autoPickOrder`, `perkLevel`, `perkMaxLevel`, `perkBenefitUpBase`, `perkBenefitUpIncrease`, `perkBenefitDown`, `perkDescription`, `perkActiveDescription`, `perkIcon`, `optionIndex`, `firstPerkIndex`, `firstTradeOffPerkIndex`, `bannedPerksIndex`, `perksPickedCount`, `autoPickPerk`, `ultimateWeaponUnlockedIndex`, `ultimateWeaponExtraLevels`, `currentChoicesType`, and `perksPicked`.
- Other fields are UI components, sprites, colors, containers, buttons, and display state. Their names are declarations, not proof of exact presentation or game effects.

### Declared methods

- Accessors: `get_PerkOptionQuantity`, `get_LastWaveToPick`, `get_NextWaveToPick`, `get_AllPerksMaxed`.
- Setup/UI: `Initialize`, `LanguageUpdate`, `LabUpdate`, `ResetPerks`, `UpdatePerksDescription`, `PerksPanelOpen`, `PerksPanelClose`, `PerksPanelUpdate`.
- Choice panels: `FirstPerkChoicePanelOpen`, `TradeOffChoicePanelOpen`, `BanPerksPanelOpen`, `AutoPickPerksPanelOpen`, `ChoicesPerkPanelOpen`, `ChoicesPerkPanelClose`, `ChoicesPanelUpdate`.
- Perk application/selection: `PerkBenefitUp`, `PerkBenefitDown`, `ApplyWaveBenefit`, `GetTotalWavesUntil`, `GetNewRandomPerks`, `ApplyStartTradeOff`, `SelectOption`, `SelectPerkInChoices`, `RemovePerkInSlot`.
- Auto-pick and UW selection: `SetBannedPerksInAutoPickList`, `ToggleAutoPickPerk`, `AutoPickPerk`, `AutoPickOrderUp`, `AutoPickOrderDown`, `AllUltimateWeaponsUnlocked`, `GetSeededRandomUWIndex`, `AssignRandomUWByIndex`.
- Resume: `CheckForPerksOnResumeRound`.
- Constructor: `.ctor`.

Signatures expose selected parameter and return types in the JSON. For example, `PerkBenefitUp` returns `System.Double` and accepts `index:System.Int32` plus `onlyOneLevel` (type reference unresolved in this export); `PerkBenefitDown` returns `System.Double` and accepts `index:System.Int32`; `ApplyWaveBenefit` returns `System.Int32` and accepts `wave:System.Int32`; `GetTotalWavesUntil` returns `System.Int32` and accepts `pickedCount:System.Int32`. These signatures do not reveal method implementation.

## ChoicesType and decoded enum candidates

Type `ChoicesType` (#775) declares the fields `FirstPerk`, `TradeOff`, `BanPerks`, and `AutoPick`. The export marks their decoded values as candidates: 0, 1, 2, and 3 respectively. They are enum-value candidates, not behavior descriptions.

Type `UpgradeType` (#589) declares `Attack`, `Defense`, `Utility`, `WorkshopAttack`, `WorkshopDefense`, `WorkshopUtility`, `EnhancementAttack`, `EnhancementDefense`, and `EnhancementUtility`; the export marks decoded values 0 through 8 respectively as `DECODED_CANDIDATE`.

## Perk-specific decoded constant candidates

The Perks type contains these decoded candidates:

| Field | Decoded candidate | Raw bytes | Decoder label |
|---|---:|---|---|
| ULTIMATE_CHANCE | 0.20000000298 | `cdcc4c3e` | candidate float32 little endian |
| TRADE_OFF_CHANCE | 0.15000000596 | `9a99193e` | candidate float32 little endian |
| WAVES_TO_PERK | 200 | `8190` | candidate compressed signed int32 |
| WAVES_TO_PERK_20 | 250 | `81f4` | candidate compressed signed int32 |
| WAVES_TO_PERK_30 | 300 | `8258` | candidate compressed signed int32 |
| WAVES_TO_PERK_40 | 350 | `82bc` | candidate compressed signed int32 |

The exact raw bytes and decoder labels are preserved above. These are decoded metadata candidates in the source export. The audit does not yet decide whether each constant directly controls a live game rule, nor whether the associated naming fully describes its use. That assessment belongs to the post-audit review requested by the project owner.

## Shared Main and PlayerData overlap

- `Main` (#618) is a shared cross-domain type, not a Perks-only class. This domain's source includes its 946 fields, 487 methods, and 62 properties. It declares a field named `perks`; no Main method name in the selected method index contains “Perk”.
- `PlayerData` (#873) is also shared. Perk-related saved-data field names include `firstPerkIndex`, `firstTradeOffPerkIndex`, `bannedPerksIndex`, `autoPickPerk`, `perkLevel`, `perksPickedCount`, and `perksPicked`. The JSON includes 836 fields, 1,674 methods, and 835 properties for this type.
- These declarations establish that the export contains corresponding references/state names. They do not, without implementation or save-format decoding, establish persistence semantics, exact data layout, or the timing of updates.

## Metadata-reference completeness

Across all 39 records:

- Field type references: 0/1,984 have a resolved type name.
- Method return type references: 2,158/2,349 are resolved.
- Method parameter type references: 911/1,163 are resolved.
- Properties: 937 records; property type references are represented through getter/setter method indices rather than a direct resolved property type in this export.

The missing field type names are an export limitation, not evidence that fields lack types. The resolved method signature coverage is useful structural evidence but is not a substitute for method bodies.

## Audit result

- Structural type inventory: **COMPLETE** for all 39 records in the inspected JSON.
- Perks declaration inventory: **COMPLETE** for the class fields, methods, and properties present in the export.
- Shared Main/PlayerData overlap: **DOCUMENTED** at the declaration level.
- Decoded enum/constant candidates: **RECORDED**, retaining raw bytes and decoder labels.
- Runtime behavior and exact perk formula/rule interpretation: **NOT ESTABLISHED by this metadata export**; no method bodies/IL were present in the inspected JSON.
- Game release version: **NOT IDENTIFIED** by the `metadata v39` label alone.
- GKB promotion: **NOT PERFORMED**; this is an audit note only.

## Next audit targets

Continue in repository domain order: Domain 14 — Relics, then Domain 15 — Vault, Domain 16 — Economy and Progression, and Domain 17 — Formulas and Calculations. Domains 18–20 must be located from the actual GRE tree before assuming filenames or availability.
