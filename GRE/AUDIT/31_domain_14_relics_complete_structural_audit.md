# Domain 14 — Relics: Complete Structural Metadata Audit

## Scope and source identity

- Repository ref: `TestAccount`
- JSON source: `GRE/2/14_relics.json`
- JSON blob SHA: `7f802e1525793c7fd4b418c5505d4dce9ffa132c`
- Companion index: `GRE/2/14_relics.md`
- Markdown blob SHA: `45ad8022a58c1d585fbaf6207083982cab903847`
- Source label: `Assembly-CSharp.dll metadata v39`
- Declared type indices: 45
- JSON evidence label: `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`

The source's `metadata v39` label does not identify a verified game release. This audit describes declarations and decoded candidates found in the two source files. The inspected JSON does not include method bodies/IL.

## Structural inventory

The JSON contains 45 type records, 1,534 fields, 673 methods, and 104 properties.

| Type index | Type name | Fields | Methods | Properties |
|---:|---|---:|---:|---:|
| 475 | GuildStoreRelicEntry | 7 | 2 | 0 |
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
| 835 | <CheckHold>d__8 | 3 | 6 | 2 |
| 836 | RelicSlotButton | 5 | 5 | 0 |
| 837 | Relic | 352 | 0 | 0 |
| 838 | RelicStat | 28 | 0 | 0 |
| 839 | UnlockType | 8 | 0 | 0 |
| 840 | RarityType | 4 | 0 | 0 |
| 841 | RelicState | 4 | 0 | 0 |
| 842 | Relics | 39 | 15 | 1 |
| 843 | <>c__DisplayClass25_0 | 2 | 2 | 0 |
| 844 | RelicsManager | 16 | 14 | 2 |
| 974 | EventShopGemRelicWindow | 3 | 7 | 3 |

## Relic identity catalog

Type `Relic` (#837) is an enum-like declaration with 352 fields: the `value__` field plus 351 named entries. The companion Markdown lists the entries and decoded values from `None = -1` through `CosmicSingularity = 349`. This yields 350 non-`None` relic identifiers (0–349), consistent with the separate `NUM_RELICS = 350` decoded candidate in `Relics` (#842).

The names are preserved in the companion index and JSON, including badge/tier/year identifiers and named relic entries. The enum declaration establishes identifier names and candidate numeric assignments; it does not by itself establish unlock requirements, release order, bonuses, or availability in a particular game version.

## RelicStat, unlock, rarity, and state declarations

The JSON contains these decoded enum candidates:

- `RelicStat` (#838): 27 named stat identifiers, values 0–26: `TowerDamage`, `AttackSpeed`, `CriticalChance`, `TowerCritFactor`, `DamagePerMeter`, `SuperCritChance`, `SuperCritMult`, `RendArmorMult`, `TowerHealth`, `HealthRegen`, `DefensePercent`, `TowerDefenseAbs`, `Thorns`, `KnockbackForce`, `OrbSpeed`, `WallRebuild`, `CashBonus`, `CoinBonus`, `FreeAttackUpgrade`, `FreeDefenseUpgrade`, `FreeUtilityUpgrade`, `RecoveryAmount`, `EnemyAttackSkip`, `EnemyHealthSkip`, `UltimateDamage`, `LabSpeed`, and `BotRange`.
- `UnlockType` (#839): `Medals=0`, `Tournament=1`, `Tier=2`, `PlayTime=3`, `Guild=4`, `Gift=5`, `Purchase=6`.
- `RarityType` (#840): `Rare=0`, `Epic=1`, `Legendary=2`.
- `RelicState` (#841): `Locked=0`, `Mailed=1`, `Unlocked=2`.

The export marks these as `DECODED_CANDIDATE`; their raw encoded values are present in the JSON. They are retained as reverse-engineering findings, with the candidate label preserved from the extraction output pending the later cross-domain review.

## Relics class declaration

Type `Relics` (#842) declares 39 fields, 15 methods, and 1 property.

### Data fields

The declaration includes `NUM_RELICS`, `relicName`, `description`, `rarity`, `benefit`, `benefitType`, `unlockCost`, `unlockType`, `unlockDescription`, `releaseDate`, `unlocked`, and `icon`.

It also declares bonus/stat fields: `damage`, `attackSpeed`, `criticalChance`, `critFactor`, `damagePerMeter`, `superCritChance`, `superCritMult`, `rendArmorMult`, `health`, `healthRegen`, `defensePercent`, `defenseAbs`, `thorns`, `knockbackForce`, `orbSpeed`, `wallRebuild`, `cashBonus`, `coin`, `freeAttackUpgrade`, `freeDefenseUpgrade`, `freeUtilityUpgrade`, `recoveryAmount`, `enemyAttackSkip`, `enemyHealthSkip`, `ultimateDamage`, `labSpeed`, and `botRange`.

### Declared methods

- Accessor/count: `get_UnlockedCount`.
- Initialization and bonus: `Initialize`, `CalculateRelicBonuses`, `IsAnyRelicsUnlocked`.
- State/admin: `UnlockAllRelics_ExpectLag`, `LockAllRelics`, `UnlockRelic`, `MailRelicIfLocked`, `MailRelic`.
- Localization/display: `LanguageUpdate`, `GetRelicName`, `GetRelicLocId`, `GetBonusText`.
- Tournament: `GetTournamentRelic`.
- Constructor: `.ctor`.

Selected signatures include `UnlockRelic(relic:System.Int32)`, `MailRelicIfLocked(relic:System.Int32)`, `MailRelic(relic:System.Int32)`, `GetRelicName(relic:Relic, forceEnglish:unresolved type ref)`, `GetBonusText(benefit:System.Single, benefitType:RelicStat)`, and `GetTournamentRelic(tournamentLeague:System.Int32)`. These signatures identify the exposed interface only; they do not establish the internal conditions or calculation sequence.

## Related UI, store, and event declarations

- `RelicSlotButton` (#836): fields `ChangeSlotAction`, `CheckRelicAction`, `_holding`, `_clickTimer`, `_checkHoldCoroutine`; methods `OnPointerDown`, `OnPointerUp`, `OnPointerClick`, and `CheckHold`. This records a pointer/hold UI interface, not exact interaction timing.
- `RelicsManager` (#844): fields include `relics`, `rareRelics`, `epicRelics`, `legendaryRelics`, UI parents, info-window controls, bonus labels/values, and hide-unowned toggle state. Methods include `UpdateUI`, `DisplayRelics`, `Button_ShowRelicMessage`, `RelicsInfoOpen`, `UpdateRelicInfoWindow`, `UpdateBonusUI`, and `_onHideUnownedToggleValueChanged`.
- `GuildStoreRelicEntry` (#475): UI fields for title, relic image, buy button, cost image/text, relic button, and purchased indicator; `SetEntry` accepts title/icon/cost/lock/interactable/action parameters.
- `EventShopGemRelicWindow` (#974): declares start/end date properties and a relic collection property. This is a structural indication of a timed event-shop UI data model; exact scheduling and purchase rules are not exposed.
- Generated type `<CheckHold>d__8` (#835) and `<>c__DisplayClass25_0` (#843) are compiler-generated records associated by naming/index context; the export does not provide their executable bodies.

## Shared Main declarations and cross-domain overlap

`Main` (#618) is a shared cross-domain type with 946 fields, 487 methods, and 62 properties. Within this source it declares a `relics` field and an `AwardPlayTimeRelics` method (return type `System.Void`, no parameters). The method name is a direct declaration observation; its award conditions and timing are not available from this metadata export.

The same Main record also contains many unrelated combat, workshop, Ultimate Weapon, and economy declarations. They are not reclassified as Relics-only mechanics merely because Main is included in this domain's source package.

## Metadata-reference completeness

Across all 45 records:

- Field type references: 0/1,534 have resolved type names.
- Method return type references: 668/673 are resolved.
- Method parameter type references: 268/337 are resolved.
- Properties: 104 records; property types are exposed through getter/setter method references rather than a direct property type field in this export.
- Decoded constant records: 430, including shared Main and enum declarations; not all 430 are Relics-specific.

Unresolved field type names are an export completeness limitation, not evidence that the fields are untyped.

## Audit result

- Structural inventory: **COMPLETE** for all 45 records in the inspected JSON.
- Relic identifier catalog: **DOCUMENTED** (351 named enum entries, including `None`; non-`None` identifiers span 0–349).
- Relic stat/unlock/rarity/state enum candidates: **DOCUMENTED** with names and decoded candidate values.
- Relics data/API, manager/UI, Guild Store, event-shop, and shared Main declarations: **DOCUMENTED**.
- Runtime bonus calculations, unlock/mail rules, event-shop schedule/eligibility, and exact tournament relic mapping: **NOT ESTABLISHED** by this metadata export alone.
- Game release version: **NOT IDENTIFIED** by `metadata v39` alone.
- GKB promotion: **NOT PERFORMED**; this is an audit note only.

## Next audit target

Domain 15 — Vault. Confirm the source files from the repository tree before inspection and preserve the same source/metadata/version distinctions.
