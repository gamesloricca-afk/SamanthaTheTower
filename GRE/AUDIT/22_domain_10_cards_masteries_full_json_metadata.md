# GRE Audit 22 — Domain 10: Cards and Masteries (full JSON metadata pass)

## Objective

Continue the Domain 10 audit using the complete JSON blob. This addendum supersedes the initial access limitation for Domain 10 only. Domain 09 remains paused/skipped as previously recorded.

## Source and access verification

- Repository: `gamesloricca-afk/SamanthaTheTower`
- Branch: `TestAccount`
- File: `GRE/1/10_cards_masteries.json`
- Blob SHA: `705c4d4b6d3fe8ecb6e82e158bb20fb8e371ca2d`
- Reported source size: 2,095,414 bytes.
- Retrieval route: Git database blob endpoint for the exact blob SHA. The normal contents/file fetch and raw-file route did not return readable content, but the Git blob endpoint returned the complete UTF-8 JSON.
- Parsed JSON root keys: `domain`, `evidence_status`, `type_indices`, `types`.
- Domain value: `10_cards_masteries`.
- Source evidence_status: `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`.
- Parsed type count: 49, matching the domain inventory count.
- Companion Markdown SHA: `6dfdaf8698ae6270ab7c293ce4f85ed74f1c2ac2`.

This confirms the JSON is present and parseable through the Git blob endpoint. It does not establish that the metadata represents current live game behavior or identify a game release version.

## Complete 49-type inventory

The complete JSON contains these records:

| Type index | Type name | Fields | Methods | Properties |
|---:|---|---:|---:|---:|
| 174 | CardBulkViewer | 19 | 10 | 1 |
| 175 | CardRarity | 4 | 0 | 0 |
| 176 | <>c | 2 | 3 | 0 |
| 177 | <>c__DisplayClass228_0 | 2 | 2 | 0 |
| 178 | <>c__DisplayClass238_0 | 3 | 2 | 0 |
| 179 | <FocusFirstSlotDelayed>d__212 | 3 | 6 | 2 |
| 180 | <ForceUpdateEnhancementLayout>d__230 | 3 | 6 | 2 |
| 181 | Cards | 185 | 63 | 8 |
| 182 | CardRegistry | 2 | 4 | 2 |
| 183 | CardDropRateData | 4 | 0 | 0 |
| 272 | DevPanelCards | 33 | 0 | 0 |
| 513 | CardID | 35 | 0 | 0 |
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
| 873 | PlayerData | 836 | 1,674 | 835 |
| 1038 | CardDropRateEntry | 3 | 3 | 0 |
| 1039 | CardDropRatesMenu | 14 | 12 | 0 |
| 1040 | CardRarityHeaderEntry | 2 | 3 | 0 |

The 49 records include compiler-generated closure/display-class and coroutine state-machine types. Their inclusion is metadata structure, not 49 independent gameplay systems.

## Cards type — direct field declarations

Type `Cards` (#181) has 185 fields, 63 methods, and 8 properties.

### Mastery-related declarations

The JSON directly declares these fields on `Cards`:

- `CARDS_MAXED_FOR_MASTERY` — candidate decoded integer value 30; field token `0x04000477`.
- `cardMasteryName`
- `cardMasteryDescription`
- `cardMasteryEffect`
- `cardMasteryLabInts`
- `cardMasteryUnlockCost`
- `cardMasteryUnlocked`
- `cardMasteryHasSeenNotification`
- `cardDetailMasteryBg`
- `cardDetailMasteryAvailable`
- `cardDetailMasteryUnlocked`
- `cardDetailPanelHeightMasteryAvailable` — candidate decoded float 1270; token `0x04000507`.
- `cardDetailPanelHeightMasteryUnlocked` — candidate decoded float 1050; token `0x04000508`.
- `cardsMaxedForMastery`

The declarations show distinct metadata fields for mastery text/effect, associated lab integer data, unlock-cost data, unlock state, notification state, and UI elements. They do not disclose the semantic structure of the referenced arrays or the actual unlock rules.

### Selected method signatures

The JSON provides method names, return type references, parameter names/types, metadata tokens, and offsets for these selected methods:

| Method | Return type | Parameters |
|---|---|---|
| `get_CardMasterySystemUnlocked` | System.Boolean | none |
| `IsCardMasteryEnabled` | System.Boolean | none |
| `Button_UnlockCardMastery` | System.Void | none |
| `UnlockCardMastery` | System.Void | `cardIndex: System.Int32` |
| `ResetAllCardMasteries` | System.Void | none |
| `get_SlotsUnlocked` | System.Int32 | none |
| `GetCardCountRemainingToPurchase` | System.Int32 | none |
| `GetEpicCardCountRemainingToPurchase` | System.Int32 | none |
| `GetRareCardCountRemainingToPurchase` | System.Int32 | none |
| `GetCommonCardCountRemainingToPurchase` | System.Int32 | none |
| `DoCard10Unlock` | System.Void | `cardsPurchased: System.Int32`, `costOfCards: System.Int32` |
| `AddCard` | System.Void | `index: System.Int32`, `showBuyCardButton`, `showClaimViewer` (type refs present but unresolved in this JSON) |
| `AddCards` | System.Void | `newCardIndexes`, `bulkNewIndexes`, `bulkLeveledIndexes` (type refs present but unresolved) |
| `CardAvailableInPool` | System.Boolean | `index: System.Int32` |
| `CalculateAllCardDropRates` | unresolved return type ref | none |

The method signatures are direct metadata. No method bodies or IL instruction sequences are included in the extracted evidence used for this audit. Therefore, these signatures do not prove what conditions the methods check, what they modify, or what values they calculate.

## PlayerData persistence declarations

Type `PlayerData` (#873) contains these directly declared card-related fields:

- `cardLevel`
- `cardCount`
- `cardUnlocked`
- `cardMasteryUnlocked`
- `cardMasteryHasSeenNotification`
- `cardActive`
- `cardRegistries`
- `cardTutorialComplete`
- `cardFirstOpenBool`
- `slotPresetCardAssignedBool`
- `slotPresetCardInt`
- `battleStartSlotCardAssignedBool`
- `battleStartSlotCardInt`
- `battleStartCardsSaved`
- `cardPanelOpenCount`
- `cardTapAndHoldTip`
- `cardsBoughtTotal`
- `refundedBastionCard`
- `bastionMasteryBlockTimeoutWave`

The JSON also includes getter/setter method declarations for these PlayerData properties, including `get_CardMasteryUnlocked` / `set_CardMasteryUnlocked` and `get_CardMasteryHasSeenNotification` / `set_CardMasteryHasSeenNotification`.

This supports the structural observation that the PlayerData model has separate fields for card mastery unlock state and whether a mastery notification has been seen. It does not prove save-file serialization behavior, migration behavior, or when those fields are changed.

## Shared Main declarations touching cards/mastery

The shared `Main` type (#618) contains these card/mastery-named fields:

- `cards`
- `bastionMasteryBlockTimeoutWave`
- `noActiveCardsOnMaxTier`
- `sentryProtocolLastCardOrbsAttack`

Selected matching method declarations:

- `get_BastionMasteryBlockActive` — returns System.Boolean.
- `GetSentryProtocolCardOrbsAttackSpeed` — returns System.Single.
- `Button_CardDetailToggle` — returns System.Void.

These are shared-controller declarations. They should not be classified as Cards-only behavior or used to infer the precise effect of Bastion Mastery or Sentry Protocol without implementation evidence.

## Card ID catalogs — distinct declarations

The JSON contains two separate enum-like types with candidate decoded integer values:

- `DevPanelCards` (#272)
- `CardID` (#513)

They are not numerically identical. For example:

| Label | DevPanelCards candidate | CardID candidate |
|---|---:|---:|
| CriticalChance | 8 | 10 |
| EnemyBalance | 9 | 11 |
| ExtraDefenses | 10 | 12 |
| Fortress | 11 | 13 |
| FreeUpgrades | 12 | 15 |
| ExtraOrb / InnerOrb | ExtraOrb=13 | InnerOrb=16 |
| PlasmaCannon | 14 | 18 |
| CriticalCoin | 15 | 19 |
| WaveSkip | 16 | 20 |
| IntroSprint | 17 | 21 |
| LandMineStun | 18 | 22 |
| RecoveryPackageChance | 19 | 23 |
| DeathRay | 20 | 25 |
| EnergyNet | 21 | 26 |
| SuperTower | 22 | 27 |
| SecondWind | 23 | 28 |
| DemonMode | 24 | 29 |
| EnergyShield | 25 | 30 |
| WaveAccelerator | 26 | 31 |
| Berserker | 27 | 32 |
| UltimateCrit | 28 | 33 |
| Nuke | 29 | 34 |
| AreaOfEffect | 30 | 35 |
| Bastion | 31 | 36 |

All values in this table retain the source JSON's `DECODED_CANDIDATE` status. The difference is an observed difference between declarations, not proof of an error or proof of how either enum is consumed. Do not merge or normalize the catalogs without call-site/implementation evidence.

## Card rarity and drop-rate data model

- `CardRarity` (#175) declares `Common`, `Rare`, and `Epic`, with candidate decoded values 0, 1, and 2.
- `CardDropRateData` (#183) has fields `Rarity`, `DropChance`, `CardName`, and `CardIcon`.
- `CardDropRateEntry` (#1038) has `cardIconImage`, `cardName`, and `dropChance`; its `SetEntryInfo` signature accepts a Unity Sprite and two strings.
- `CardDropRatesMenu` (#1039) includes `UpdateMenu(cardDropRateDataList, overallRarityChances)`, `GetRarityColor(rarity)`, and `GetRarityName(rarity)`.
- `CardRarityHeaderEntry` (#1040) includes `SetRarityText(rarityString, textColor)` and `SetOdds(oddsString, oddsColor)`.

This establishes the presence of a typed drop-rate data structure and UI method signatures. It does not reveal actual probabilities or the algorithm used to compute them.

## Additional records and interpretation limits

- `CardRegistry` (#182) declares `CardIndex` (System.Int32) and `Date` (System.DateTime) properties, each with getter/setter declarations.
- Compiler-generated types #176–180 include a closure for `get_HasAnyCard`, a closure capturing `cardIndex` for the mastery button handler, a closure capturing purchase count/cost for `BuyCard10`, and coroutine state-machine records for `FocusFirstSlotDelayed` and `ForceUpdateEnhancementLayout`. These names and captured fields do not expose the callback or coroutine bodies.
- `Cards` also declares `MAX_ACTIVE_CARDS=28`, `MAX_ACTIVE_PAID_WITH_GEM_CARDS=22`, `MAX_REGISTRY_COUNT=300`, and other candidate constants. All remain candidate decoded values, not verified gameplay rules.
- `CARDS_MAXED_FOR_MASTERY=30` is a candidate decoded value. It is not sufficient by itself to establish the exact mastery eligibility rule, whether it applies per rarity or globally, or whether it is version-specific.

## Evidence classification

| Observation | Claim type | Status |
|---|---|---|
| JSON parses to 49 type records | OBJECTIVE | VERIFIED as source structure |
| Cards has 185 fields, 63 methods, 8 properties | OBJECTIVE | VERIFIED as source structure |
| PlayerData declares card/mastery state fields | OBJECTIVE | VERIFIED as source structure |
| Cards declares mastery-related fields and method signatures | OBJECTIVE | VERIFIED as source structure |
| CardID and DevPanelCards contain differing candidate values | OBJECTIVE | VERIFIED as source declaration difference; values remain candidates |
| Rarity and drop-rate model declarations exist | OBJECTIVE | VERIFIED as source structure |
| Candidate numeric constants represent current live-game rules | OBJECTIVE | EXTERNAL-UNVERIFIED |
| Actual mastery unlock prerequisites, cost logic, and reset effects | OBJECTIVE | NOT ESTABLISHED |
| Actual card drop probabilities and computation formula | OBJECTIVE | NOT ESTABLISHED |
| Runtime behavior of methods/coroutines | OBJECTIVE | NOT TESTED |

## GKB disposition

No claims are promoted to GKB by this audit. The current evidence is metadata declarations and candidate decoded constants, not implementation-level behavioral proof. Keep the source JSON SHA, metadata v39 note from the companion Markdown, and any future game-version information as separate provenance fields.

## Next priority

For behavior-level analysis, inspect implementation/IL or an independent source that documents the same mechanics. Prioritize mastery eligibility and unlock flow, card purchase/count behavior, card drop-rate computation, and battle preset save/restore. Until implementation evidence is available, retain the current findings as structural metadata only.
