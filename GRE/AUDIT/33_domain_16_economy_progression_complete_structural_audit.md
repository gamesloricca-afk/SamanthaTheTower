# Domain 16 — Economy and Progression: Complete Structural Metadata Audit

## Scope and source identity

- Repository ref: `TestAccount`
- JSON source: `GRE/2/16_economy_progression.json`
- JSON blob SHA: `d8aec98a2202730a667668940c1e7f090c016466`
- Companion index: `GRE/2/16_economy_progression.md`
- Markdown blob SHA: `6fd94cdfa4966975440c81fdffade89461ba66ed`
- Source label: `Assembly-CSharp.dll metadata v39`
- Declared type indices: 137
- JSON evidence label: `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`

The metadata label is not a verified game release identifier. The JSON contains declarations, signatures, and decoded constant candidates, but no method bodies/IL. This audit records the complete structural inventory and selected economy/progression interfaces without inferring execution details from names.

## Complete structural inventory

The JSON contains 137 type records, 3,001 fields, 3,363 methods, and 1,160 properties.

| Type index | Type name | Fields | Methods | Properties |
|---:|---|---:|---:|---:|
| 14 | `CurrencyPanelUI` | 3 | 4 | 0 |
| 144 | `<>c` | 2 | 3 | 0 |
| 145 | `Bots` | 47 | 58 | 7 |
| 153 | `DropTableRandomTest` | 4 | 0 | 0 |
| 154 | `<>c__DisplayClass24_0` | 1 | 2 | 0 |
| 155 | `<>c__DisplayClass28_0` | 1 | 2 | 0 |
| 156 | `<>c__DisplayClass30_0` | 1 | 2 | 0 |
| 157 | `<>c__DisplayClass35_0` | 1 | 2 | 0 |
| 158 | `<>c__DisplayClass36_0` | 1 | 2 | 0 |
| 159 | `CalendarEventManager` | 15 | 39 | 2 |
| 160 | `CalendarEventDataList` | 1 | 3 | 1 |
| 161 | `CalendarEventData` | 12 | 29 | 16 |
| 162 | `CalendarEventReward` | 1 | 3 | 1 |
| 163 | `CalendarEventDropTableRewardEntry` | 2 | 5 | 2 |
| 164 | `CalendarEventRewardDataList` | 2 | 5 | 2 |
| 165 | `CalendarEventRewardData` | 3 | 7 | 3 |
| 166 | `CalendarEventClaimRecord` | 3 | 7 | 3 |
| 167 | `CalendarEventDayClaim` | 3 | 7 | 3 |
| 169 | `CalendarEventType` | 3 | 0 | 0 |
| 201 | `CoinBonusSummaryUI` | 1 | 3 | 0 |
| 219 | `<>c` | 2 | 3 | 0 |
| 220 | `<>c__DisplayClass19_0` | 2 | 2 | 0 |
| 221 | `CurrencyAudit` | 13 | 23 | 1 |
| 222 | `CurrencyAuditEntry` | 7 | 15 | 7 |
| 223 | `LifetimeCounter` | 5 | 0 | 0 |
| 224 | `CurrencyPolicy` | 0 | 1 | 0 |
| 225 | `CurrencyCategory` | 74 | 0 | 0 |
| 226 | `CurrencyChangeType` | 3 | 0 | 0 |
| 227 | `CurrencyItem` | 3 | 3 | 0 |
| 228 | `CurrencyTracker` | 1 | 7 | 1 |
| 229 | `CurrencyType` | 13 | 0 | 0 |
| 235 | `DailyMissionActive` | 5 | 20 | 9 |
| 236 | `MissionType` | 12 | 0 | 0 |
| 237 | `ValueType` | 4 | 0 | 0 |
| 238 | `DailyMissionBase` | 7 | 1 | 0 |
| 239 | `<>c` | 2 | 3 | 0 |
| 240 | `<>c__DisplayClass72_0` | 2 | 3 | 0 |
| 241 | `<>c__DisplayClass85_0` | 2 | 3 | 0 |
| 242 | `<CheckTimerCoroutine>d__79` | 5 | 6 | 2 |
| 243 | `DailyMissionManager` | 41 | 51 | 8 |
| 244 | `DailyMissionTile` | 13 | 3 | 0 |
| 269 | `DevPanelCurrencyTypes` | 17 | 0 | 0 |
| 327 | `EventMissionData` | 12 | 25 | 12 |
| 371 | `FlyType` | 4 | 0 | 0 |
| 372 | `FlyCurrency` | 16 | 11 | 1 |
| 586 | `DamageData` | 3 | 1 | 0 |
| 587 | `HitData` | 2 | 2 | 0 |
| 588 | `LightspeedPathData` | 3 | 1 | 0 |
| 589 | `UpgradeType` | 10 | 0 | 0 |
| 590 | `UpgradeMultiplier` | 2 | 1 | 0 |
| 591 | `ClosestEnemyEntry` | 2 | 1 | 0 |
| 592 | `<>c` | 11 | 12 | 0 |
| 593 | `<>c__DisplayClass1109_0` | 1 | 3 | 0 |
| 594 | `<>c__DisplayClass1128_0` | 1 | 3 | 0 |
| 595 | `<>c__DisplayClass1214_0` | 6 | 0 | 0 |
| 596 | `<>c__DisplayClass1216_0` | 4 | 0 | 0 |
| 597 | `<>c__DisplayClass1270_0` | 2 | 2 | 0 |
| 598 | `<>c__DisplayClass1271_0` | 2 | 3 | 0 |
| 599 | `<>c__DisplayClass1436_0` | 3 | 2 | 0 |
| 600 | `<>c__DisplayClass1474_0` | 1 | 2 | 0 |
| 601 | `<AdStartFunction>d__1413` | 4 | 6 | 2 |
| 602 | `<AutoRetryBattle>d__1391` | 4 | 6 | 2 |
| 603 | `<DeathRayFunction>d__1428` | 4 | 6 | 2 |
| 604 | `<DemonModeEffect>d__1362` | 4 | 6 | 2 |
| 605 | `<GameOverFunction>d__1388` | 5 | 6 | 2 |
| 606 | `<GameSpeedValidationLogFunction>d__1431` | 3 | 6 | 2 |
| 607 | `<GemBlockFunction>d__1418` | 3 | 6 | 2 |
| 608 | `<GrantRetroAchievementsDeferred>d__1095` | 2 | 6 | 2 |
| 609 | `<NukeImmortalityEffect>d__1376` | 3 | 6 | 2 |
| 610 | `<ProjectFundingCoroutine>d__1140` | 5 | 6 | 2 |
| 611 | `<RebuildWallFunction>d__1147` | 3 | 6 | 2 |
| 612 | `<SecondWindEffect>d__1348` | 4 | 6 | 2 |
| 613 | `<ShockwaveFunction>d__1435` | 3 | 6 | 2 |
| 614 | `<StartNewRoundFunction>d__1144` | 4 | 6 | 2 |
| 615 | `<StartNewRoundWallFunction>d__1146` | 3 | 6 | 2 |
| 616 | `<WallInvincibleEffect>d__1148` | 7 | 6 | 2 |
| 617 | `<_applyFTUEEnemySpawnDelay>d__1145` | 3 | 6 | 2 |
| 618 | `Main` | 946 | 487 | 62 |
| 631 | `Milestone` | 35 | 10 | 1 |
| 632 | `RewardType` | 15 | 0 | 0 |
| 633 | `MilestoneManager` | 71 | 29 | 2 |
| 639 | `MissionType` | 6 | 0 | 0 |
| 640 | `ValueType` | 4 | 0 | 0 |
| 641 | `Mission` | 16 | 19 | 11 |
| 642 | `MissionData` | 7 | 14 | 7 |
| 643 | `Tab` | 4 | 0 | 0 |
| 644 | `<>c` | 6 | 7 | 0 |
| 645 | `<>c__DisplayClass312_0` | 5 | 3 | 0 |
| 646 | `<>c__DisplayClass313_0` | 4 | 3 | 0 |
| 647 | `<>c__DisplayClass314_0` | 4 | 3 | 0 |
| 648 | `<>c__DisplayClass315_0` | 4 | 3 | 0 |
| 649 | `<>c__DisplayClass316_0` | 4 | 3 | 0 |
| 650 | `<>c__DisplayClass317_0` | 4 | 3 | 0 |
| 651 | `<>c__DisplayClass318_0` | 4 | 3 | 0 |
| 652 | `<>c__DisplayClass321_0` | 2 | 2 | 0 |
| 653 | `<>c__DisplayClass322_0` | 2 | 2 | 0 |
| 654 | `<>c__DisplayClass325_0` | 4 | 3 | 0 |
| 655 | `<>c__DisplayClass329_0` | 4 | 3 | 0 |
| 656 | `<>c__DisplayClass330_0` | 4 | 3 | 0 |
| 657 | `<>c__DisplayClass331_0` | 4 | 3 | 0 |
| 658 | `<>c__DisplayClass332_0` | 4 | 3 | 0 |
| 659 | `<>c__DisplayClass335_0` | 2 | 2 | 0 |
| 660 | `<>c__DisplayClass353_0` | 5 | 3 | 0 |
| 661 | `<>c__DisplayClass354_0` | 1 | 2 | 0 |
| 662 | `<>c__DisplayClass360_0` | 2 | 2 | 0 |
| 663 | `<EventPanelUpdateFunction>d__294` | 3 | 6 | 2 |
| 664 | `<FixShopLayout>d__310` | 6 | 6 | 2 |
| 665 | `<IncrementMissionDelayed>d__279` | 4 | 6 | 2 |
| 666 | `<IncrementMissionRetry>d__283` | 4 | 6 | 2 |
| 667 | `<TimerUpdate>d__309` | 4 | 6 | 2 |
| 668 | `MissionEvent` | 228 | 128 | 14 |
| 670 | `MissionGoalFloating` | 7 | 6 | 0 |
| 671 | `MissionTile` | 14 | 3 | 0 |
| 693 | `ModuleRandomTest` | 4 | 0 | 0 |
| 694 | `<>c` | 6 | 7 | 0 |
| 695 | `<>c__DisplayClass315_0` | 4 | 4 | 0 |
| 696 | `<>c__DisplayClass381_0` | 5 | 3 | 0 |
| 697 | `<>c__DisplayClass393_0` | 1 | 2 | 0 |
| 698 | `<FeaturedBannerDurationCheck>d__457` | 3 | 6 | 2 |
| 699 | `<GetAllModuleItems>d__135` | 5 | 8 | 2 |
| 700 | `<GetFeaturedBanners>d__440` | 4 | 6 | 2 |
| 701 | `<GetRotatingBanners>d__441` | 4 | 6 | 2 |
| 702 | `<RotatingBannerDurationCheck>d__458` | 3 | 6 | 2 |
| 703 | `ModuleManager` | 110 | 294 | 89 |
| 757 | `NotificationPermissionState` | 5 | 0 | 0 |
| 834 | `RecoveryPackage` | 5 | 3 | 0 |
| 873 | `PlayerData` | 836 | 1674 | 835 |
| 882 | `CurrencyLog` | 4 | 8 | 4 |
| 887 | `<>c__DisplayClass1_0` | 1 | 2 | 0 |
| 888 | `CurrencyNameToSpriteConfig` | 1 | 2 | 0 |
| 889 | `CurrencyNameToSpriteData` | 2 | 1 | 0 |
| 1032 | `CalendarEventBonusRewardEntryUI` | 5 | 7 | 0 |
| 1033 | `CalendarEventBonusRewardUI` | 10 | 8 | 0 |
| 1034 | `CalendarEventEntryUI` | 12 | 8 | 0 |
| 1035 | `<>c__DisplayClass49_0` | 1 | 2 | 0 |
| 1036 | `<>c__DisplayClass53_0` | 1 | 2 | 0 |
| 1037 | `CalendarEventUI` | 37 | 24 | 0 |

## Economy and currency declarations

### CurrencyType (#229), CurrencyChangeType (#226), LifetimeCounter (#223)

- `CurrencyType` has 13 fields, including the backing field and decoded candidates for None, Coin, Gem, Stone, Medal, Ticket, Ad, ModuleTicket, Cell, Key, Tokens, and Bits.
- `CurrencyChangeType` has decoded candidates `Earn=0` and `Spend=1`.
- `LifetimeCounter` has decoded candidates `Earned=0`, `Bought=1`, `SpentRefund=2`, and `None=3`.
- `DevPanelCurrencyTypes` (#269) separately declares development-panel labels for Cash, Coins, Gems, Stones, Medals, Cells, Keys, Tokens, Bits, TournamentTickets, ModuleTickets, Reroll, and equipment shard types. Do not assume this UI enum is identical to `CurrencyType`.

### CurrencyCategory (#225)

The declaration contains 74 fields: backing field plus 73 named decoded category candidates. The names span IAP, tournament, milestone, mail, webstore, ads, store claims, completed runs, event and guild shops, daily/event missions, respecs, module shatter/unmerge, boss/elite/fleet drops, Fetch, lab/workshop/module/card/Guardian/Vault purchases and upgrades, preset swaps, event relics, and other sources. The complete category list and numeric candidates are in the source Markdown/JSON.

Examples of named categories in the export include `Iap`, `Tournament`, `FreeMilestone`, `PremiumMilestone`, `WebstorePurchase`, `EventShop`, `DailyMission`, `ModuleShatter`, `BossDrop`, `EliteDrop`, `FleetsDrop`, `Fetch`, `BuyCardx1`, `BuyCardx10`, `BuyUltimateWeapon`, `LabRush`, `Guardian`, `Vault`, `Synchronicity`, `EventRelic`, `PresetSwap`, and `NoLog`.

These are source category identifiers, not a complete proof that every named category is currently active or used by every currency path.

### Currency audit and tracking

- `CurrencyAudit` (#221): 13 fields and 23 methods. Fields include file/path/config identifiers, `MAX_PENDING_ENTRIES`, last-value state, upload state, and run aggregation state. Methods include `Record`, `TryExtendRun`, `CheckLoadDivergence`, `Flush`, `DatabaseUrl`, `CurrentPlayerId`, `ServerNow`, `DateBucket`, `BuildCategory`, `Append`, `Serialize`, `ReadPending`, `ParseFields`, and `SaveLastValues`.
- `CurrencyAuditEntry` (#222): properties Timestamp, PlayerId, DeviceId, Currency, Previous, Current, and Category.
- `CurrencyTracker` (#228): AddCurrency, ResetTracker, GetCurrencies, and GetCurrencyAmount.
- `CurrencyLog` (#882): properties CurrencyName, Source, Amount, and ClaimDateTime.
- `CurrencyItem` (#227), `CurrencyPanelUI` (#14), and `CoinBonusSummaryUI` (#201) provide related display/tracking declarations.

The presence of audit/logging types and fields is directly observed. The metadata alone does not establish the full remote-upload protocol, server validation, persistence guarantees, or all currency mutation call paths.

## Main and PlayerData economy declarations

- `Main` (#618) is a shared type with 946 fields, 487 methods, and 62 properties. Economy-related declarations include `cash`, `coins`, `gems`, `stones`, `medals`, `keys`, coin/cash bonuses and per-wave values, currency totals earned/spent/bought, and round-level earnings counters. Methods include Add/Spend/Load operations for Gems, Medals, Stones, and Keys, plus `CalculateCoinBonuses`, `GetRecentCoinsPerHour`, and `AddCurrencyLog`.
- `PlayerData` (#873) is shared and has 836 fields, 1,674 methods, and 835 properties. The inspected declaration includes balances for coins, gems, keys, tokens, stones, bits, and medals; currency logs; purchase counters; Vault progress reference; ad/gem-block claim dates; seasonal purchase totals; and lifetime earned/spent counters.
- These are shared cross-domain declarations. Their inclusion in this domain does not make every field/method exclusive to Economy and Progression.

## Milestones and rewards

- `Milestone` (#631): fields for goal/tier and free/premium reward UI; methods InitializeMilestone, UpdateMilestone, ClaimFreeReward, and ClaimPremiumReward.
- `MilestoneManager` (#633): 71 fields and 29 methods. Declarations include reward type/value/claimed arrays, premium reward data, currency/reward icons, selected tier, available counts, premium unlock and purchase methods, ClaimReward, ClaimAllRewards, UnclaimAllRewards, and HasUnclaimedRewards.
- `RewardType` (#632) has 14 named decoded candidates, including Coins, Gems, Stones, Research, ResearchGroup, Card, CardUnlock, TowerSkin, Background, Tier, System, Relic, MenuSkin, and ProfileBannerSkin.
- The export records milestone/reward interfaces, but not the complete reward schedule, wave thresholds, exact premium purchase logic, or claim-side effects.

## Missions and daily progression

- `Mission` (#641) stores mission type, value type, goals, current goal/count, max count, active/new state, tier requirements, Ultimate Weapon requirement, and availability. Its methods include CheckGoal, Claim, ClaimForMail, RestartCount, ForceComplete, Reset, Save, and Load.
- `MissionData` (#642) contains currentGoal, goalToCheck, count, maxCount, active, newMission, and targetTier.
- `DailyMissionActive` (#235) contains missionIndex, goal, count, maxCount, and shardType, with CheckGoal, Claim, IncrementCount, ForceComplete, and RestartCount.
- `DailyMissionManager` (#243) has 41 fields and 51 methods. Decoded constant candidates: `MAX_MISSIONS=8`, `NEW_MISSIONS=2`, `STARTING_MISSIONS=4`, and `REROLL_GEM_COST=5`. Its interface includes mission generation/update, increment, force-complete, restart, reroll, shard-type selection, weekly box claim, timer, and mission reward getters.
- Two distinct `MissionType` declarations exist (#236 and #639) in this source. They have different field counts and candidate value sets. Do not merge them based on the shared type name.
- `ValueType` declarations also appear more than once (#237 and #640); preserve each type index and its own metadata.
- `Tab` (#643) declares Missions, Shop, and Bots candidates.

The declarations do not establish live mission pools, exact refresh schedule, reward amounts, reroll behavior, or the full set of mission eligibility rules.

## Calendar events and event progression

- `CalendarEventManager` (#159) declares claim records, active events, drop-table selection, event listeners, and methods for day/bonus claim checks, reward claims, fallback reward selection, event filtering, remote event retrieval/parsing, and UI updates.
- `CalendarEventData` (#161) declares event ID/title/description, unlock requirements, rewards, bonus reward, event type, start/end date strings, and required days for bonus reward.
- Related records include CalendarEventDataList, CalendarEventReward, CalendarEventDropTableRewardEntry, CalendarEventRewardDataList, CalendarEventRewardData, CalendarEventClaimRecord, CalendarEventDayClaim, and their UI classes.
- `CalendarEventType` (#169) candidates: Personal=0, Universal=1.
- `CalendarEventUI` (#1037) and related entry/bonus UI records contain calendar display and claim interfaces.

This is a data/API map, not a verification of current event configuration, server timing, claim policy, or fallback reward selection.

## Event missions and shop

`MissionEvent` (#668) is a large event-system type with 228 fields, 128 methods, and 14 properties. Its declarations cover event state/timing, mission state, medals, event boosts, shop items, bot unlock/upgrade interfaces, Synchronicity, relics, gem relic rotation, skins, songs, shard purchases, and UI state.

Selected decoded candidates in this type include:
- Relic prices: rare/epic medal and gem price fields.
- Event shop skin/menu/banner/song price fields.
- Gems/Stones/Shards trade values.
- `TournamentMissionIndex=1`, `EventMissionsUnlockedPerDay=2`, and `ClaimAdGemsMissionIndex=5`.

Its method declarations include event start/check/update, mission progression, event reward and relic claims, gem/stone/shard purchases, bot unlock/upgrade, Synchronicity operations, and event UI refresh. These names establish the interface inventory, not actual live pricing or the execution conditions for each transaction.

## Modules and progression

`ModuleManager` (#703) is included as a large cross-domain progression/economy type: 110 fields, 294 methods, 89 properties. The declaration includes module/shard/ticket balances, inventory/equipment/presets, pity counters, module drops, merge/unmerge, shatter, rerolls, module level-up, banners, assist modules, and lifetime counters.

Its decoded candidate constants include:
- `UNMERGE_COST=20`
- `PITY=150`, `RARE_PITY=10`
- `INVENTORY_LIMIT=350`
- `MODULE_DROP_COOLDOWN=5`, `MODULE_DROP_COOLDOWN_CHAMPION=5`
- `MODULE_HISTORY_LIMIT=150`
- `MAX_RARITY_DROP_ADJUSTMENT_MULTIPLIER=0.25`
- `ASSIST_MODULE_SLOT_UNLOCK_COST=1000`
- Assist module efficiency level candidates: unique 3, main effect 99, substat 69
- `NUM_DEFINED_MODULES=53`, `MODULE_BASE_PRESETS=2`
- `deterministicRollAttemptsPerSlot=5000`

These are decoded candidates from the source export. They are not independently re-evaluated here as current game mechanics, and the exact context/units/conditions of each constant must be checked in the later review.

## Bots and related economy declarations

`Bots` (#145) declares bot progression, preset, respec, Bot+ and Synchronicity APIs. Candidate constants in the source include `BOT_PLUS_UNLOCK_COST=1250`, `WILDFIRE_DAMAGE_BOOST=3`, `SYNCHRONICITY_UNLOCK_COST=1500`, and `BOT_BASE_PRESETS=2`. These overlap with the dedicated Bots domain audit; preserve this source occurrence and reconcile cross-domain duplication only in the final audit review.

## Decoded constant inventory

The JSON contains 244 fields marked `DECODED_CANDIDATE`. Distribution:

| Type | Candidate count |
|---|---:|
| Bots | 4 |
| CalendarEventType | 2 |
| CurrencyAudit | 1 |
| LifetimeCounter | 4 |
| CurrencyCategory | 73 |
| CurrencyChangeType | 2 |
| CurrencyType | 12 |
| MissionType (both declarations combined) | 16 |
| ValueType (both declarations combined) | 6 |
| DailyMissionManager | 4 |
| DevPanelCurrencyTypes | 16 |
| FlyType | 3 |
| UpgradeType | 9 |
| Main | 29 |
| RewardType | 14 |
| Tab | 3 |
| MissionEvent | 17 |
| ModuleManager | 17 |
| NotificationPermissionState | 4 |
| CalendarEventUI | 8 |
| **Total** | **244** |

Raw bytes, decoded values, and decoder labels are retained in the source JSON. Duplicate type names remain separated by their type indices in the JSON.

## Metadata-reference completeness

Across all 137 records:

- Field type references: 0/3,001 have resolved type names.
- Method return type references: 3,138/3,363 are resolved.
- Method parameter type references: 1,446/1,805 are resolved.
- Properties: 1,160; property type information is represented through accessor references rather than a direct resolved property type in this export.

Missing field type names are an export limitation, not evidence that fields lack types.

## Audit result

- Structural inventory: **COMPLETE** for all 137 records in the inspected JSON.
- Currency types/categories/change tracking and audit/log declarations: **DOCUMENTED**.
- Main/PlayerData currency and lifetime counters: **DOCUMENTED** at declaration level.
- Milestone/reward, mission/daily mission, calendar event, event mission/shop, Bot and Module progression declarations: **DOCUMENTED**.
- Decoded candidates: **RECORDED** with source traceability; no runtime rule promotion performed.
- Exact currency mutation flows, current event configurations, mission schedules/reward tables, milestone schedules, live module drop/pity mechanics, and transaction/server behavior: **NOT ESTABLISHED** by metadata declarations alone.
- Game release version: **NOT IDENTIFIED** by `metadata v39` alone.
- GKB promotion: **NOT PERFORMED**; this is an audit note only.

## Next audit target

Domain 17 — Formulas and Calculations. Confirm its source files from the repository tree before inspection.
