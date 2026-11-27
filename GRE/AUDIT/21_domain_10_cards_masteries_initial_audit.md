# GRE Audit 21 — Domain 10: Cards and Masteries (initial source audit)

## Objective

Continue the GRE domain audit on `TestAccount` after stopping Domain 09. This note records only what is directly available from the Domain 10 companion index. It does not promote any mechanic into GKB.

## Source identity and access

- Repository: `gamesloricca-afk/SamanthaTheTower`
- Branch: `TestAccount`
- Domain: 10 — Cards and Masteries
- JSON path: `GRE/1/10_cards_masteries.json`
- JSON blob SHA: `705c4d4b6d3fe8ecb6e82e158bb20fb8e371ca2d`
- JSON reported size: 2,095,414 bytes
- JSON access: NOT READABLE through the repository connector in this pass. Both the file-content fetch and raw-file fetch failed to return readable content because the file was too large/unsupported by the connector. This is an access limitation, not evidence of an empty or invalid source.
- Companion Markdown: `GRE/1/10_cards_masteries.md`
- Markdown blob SHA: `6dfdaf8698ae6270ab7c293ce4f85ed74f1c2ac2`
- Markdown length: 16,484 characters; readable.
- Source metadata stated by the companion file: `Assembly-CSharp.dll metadata v39`.
- Domain inventory records 49 type records for Domain 10. The readable Markdown exposes 18 named type sections; it is a selected summary, not a replacement for the full JSON.

## Directly observed structure

The readable companion index names these 18 type sections:

1. `CardBulkViewer` — type #174; 19 fields, 10 methods, 1 property.
2. `CardRarity` — type #175; 4 fields; candidate decoded values Common=0, Rare=1, Epic=2.
3. `Cards` — type #181; 185 fields, 63 methods, 8 properties.
4. `CardRegistry` — type #182; 2 fields, 4 methods, 2 properties.
5. `CardDropRateData` — type #183; 4 fields.
6. `DevPanelCards` — type #272; 33 fields; candidate card labels and integer values are listed in the source.
7. `CardID` — type #513; 35 fields; candidate card labels and integer values are listed in the source.
8. `DamageData` — type #586; 3 fields, 1 method.
9. `HitData` — type #587; 2 fields, 2 methods; selected method `TotalHits`.
10. `LightspeedPathData` — type #588; 3 fields, 1 method.
11. `UpgradeType` — type #589; 10 fields; candidate values for Attack/Defense/Utility and Workshop/Enhancement variants.
12. `UpgradeMultiplier` — type #590; 2 fields, 1 method.
13. `ClosestEnemyEntry` — type #591; 2 fields, 1 method.
14. `Main` — type #618; shared controller record with 946 fields, 487 methods, 62 properties.
15. `PlayerData` — type #873; 836 fields, 1,674 methods, 835 properties.
16. `CardDropRateEntry` — type #1038; 3 fields, 3 methods.
17. `CardDropRatesMenu` — type #1039; 14 fields, 12 methods.
18. `CardRarityHeaderEntry` — type #1040; 2 fields, 3 methods.

The companion file says the domain contains 49 type records. The 18 sections above are the entries actually exposed in that readable summary; the remaining records are not enumerated here and must not be guessed.

## Cards and Masteries observations

### Cards controller declarations

The `Cards` type's selected method-name list includes:

- Card UI and presentation names: `FormatCardDescription`, `CardDescriptionLoad`, `SetupCardUI`, `CardDetailPanelOpen`, `UpdateCardDetail`, and `CardDetailPanelClose`.
- Active-slot and preset names: `FocusActiveCard`, `FocusActiveSlot`, `CardPickActive`, `SelectPreset`, `UpdateCardActiveFromSlots`, `SaveCardContentsForBattle`, `RestoreCardContentsForRetry`, and `RestoreCardContentsAfterBattle`.
- Purchase/inventory names: `BuyCard`, `BuyCard10`, `AddCard`, `AddCards`, and card-count remaining-to-purchase accessors.
- Mastery-related names: `IsCardMasteryEnabled`, `Button_UnlockCardMastery`, `UnlockCardMastery`, and `ResetAllCardMasteries`.
- Drop-rate-related name: `CalculateAllCardDropRates`.

These are method-name observations only. The companion index does not expose signatures, parameter types, return types, access modifiers, method bodies, or call flow. Do not infer exact mastery prerequisites, unlock costs, card slot rules, purchase behavior, drop probabilities, or reset consequences from these names.

### Card identifiers and candidate enum values

The companion index lists candidate decoded values for both `DevPanelCards` and `CardID`. They are separate declarations and their numbering differs for several similarly named cards. Examples include:

- `CriticalChance`: DevPanelCards=8; CardID=10.
- `EnemyBalance`: DevPanelCards=9; CardID=11.
- `ExtraDefenses`: DevPanelCards=10; CardID=12.
- `Fortress`: DevPanelCards=11; CardID=13.
- `FreeUpgrades`: DevPanelCards=12; CardID=15.
- `InnerOrb` appears in CardID as 16, while the DevPanelCards list uses `ExtraOrb` at 13.

This is a source-level difference between two candidate catalogs. It is not safe to treat the numeric values as interchangeable IDs or to silently reconcile them. Preserve the declaring type and source context. Full field metadata is required to understand their actual use.

### Rarity and drop-rate declarations

- `CardRarity` lists candidate decoded values Common=0, Rare=1, Epic=2.
- The domain contains `CardDropRateData`, `CardDropRateEntry`, `CardDropRatesMenu`, and `CardRarityHeaderEntry` records.
- Selected method names include `SetEntryInfo`, `HasStringInName`, `InitMenu`, `UpdateMenu`, `GetRarityColor`, `GetRarityName`, `SetRarityText`, and `SetOdds`.

These declarations indicate that the metadata includes card drop-rate data and related UI types. They do not provide numeric drop odds or prove how the game computes or displays probabilities.

### Candidate constants requiring full-source verification

The `Cards` summary lists candidate decoded constants including:

- `MAX_ACTIVE_CARDS = 28`
- `MAX_ACTIVE_PAID_WITH_GEM_CARDS = 22`
- `CARDS_MAXED_FOR_MASTERY = 30`
- `MAX_REGISTRY_COUNT = 300`

These values remain candidate decoded constants from the companion index, not verified player-facing rules. Their names and values alone do not establish the meaning, scope, applicability, or current game-version validity of the limits.

## Shared and cross-domain records

`Main` and `PlayerData` are large shared types included in this topical view. Their inclusion is not independent confirmation that all their fields or methods belong exclusively to Cards and Masteries.

The `Main` selected method list contains a number of card-adjacent names, including `GetSentryProtocolCardOrbsAttackSpeed` and `Button_CardDetailToggle`, but these names alone do not establish card effects or mastery mechanics.

## Evidence classification

| Item | Classification | Status |
|---|---|---|
| Domain has 49 type records | OBJECTIVE structural inventory | VERIFIED against readable inventory |
| 18 named type sections above | OBJECTIVE companion-index observation | VERIFIED against readable Markdown |
| Cards controller selected method names | OBJECTIVE symbol-name observation | VERIFIED as names only |
| CardRarity / CardID / DevPanelCards numeric values | OBJECTIVE candidate decoded constants | EXTERNAL-UNVERIFIED |
| Candidate Cards limits | OBJECTIVE candidate decoded constants | EXTERNAL-UNVERIFIED |
| Actual card/mastery behavior | Not established by current readable source | NOT TESTED |
| Full 49-record metadata | JSON unavailable in this pass | BLOCKED |

## Limitations and handling

1. Do not fill in the 31 type records not enumerated by the companion Markdown.
2. Do not infer behavior from method names, field names, enum labels, or candidate constants.
3. Preserve the distinct `CardID` and `DevPanelCards` declarations rather than normalizing their values together.
4. Do not treat candidate constants as current game rules without corroborating evidence and applicable game-version provenance.
5. No GKB claims are promoted by this note.
6. No source files under `GRE/1` were modified.

## Next priority

Continue Domain 10 using the readable companion index only where it supports bounded observations. For a full structural audit of all 49 type records, the complete JSON must first become readable through an authorized repository or local-file path. If that remains unavailable, record the limitation and proceed to the next accessible domain rather than manufacturing missing records.
