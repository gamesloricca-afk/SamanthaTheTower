# Economy Progression
Source: Assembly-CSharp.dll metadata v39. Types may appear in more than one domain. Names are not proof of runtime behavior.

137 type records. Full field, method and property records in `16_economy_progression.json`.

## CurrencyPanelUI
Type #14, offset `0x868f34`. Fields: 3; methods: 4; properties: 0.
Methods: `PopulateCurrencyItems`, `ToggleCurrenciesPanel`, `ClosePanel`

## Bots
Type #145, offset `0x86b618`. Fields: 47; methods: 58; properties: 7.
Methods: `Initialize`, `ApplyPresetWithCharge`, `CanApplyPresetForBattle`, `TryGetPresetLockedByMedalSpend`, `ResetSynchronicity`, `FormatBotStatBenefit`, `LanguageUpdate`, `GetBotName`, `GetBotStatName`, `GetBotStatLocId`, `ResetForRound`, `Resume`, `BotUpdate`, `GetCooldownTimers`, `SetCooldownTimers`, `GetBotLevelUpCost`, `GetBotBenefit`, `UpdateValues`, `BotRespec`, `BotToggle`, `IsBotUnlocked`, `IsBotPlusUnlocked`, `IsBotPlusUnlocked`, `IsBotUnlocked`, `IsBotActive`, `GetBotStatIndices`, `LevelUpBot`, `GetBotPlusUpgradeCost`, `GetBotPlusUpgradeCostAtLevel`, `BotPlusUnlock`, `SyncBotPlusUnlockAcrossPresets`, `SyncBotPlusUnlocksAcrossAllPresets`, `BotPlusLevelUp`, `UpdatePlusValues`, `GetBotPlusBenefit`, `GetBotPlusName`, `GetBotPlusDescription`, `GetBotPlusStatText`, `GetWildfireDuration`, `SynchronicityUpgrade`, `SynchronicityUnlock`, `FindSynchronicityLeadBot`, `GetSynchronicityLeadBotPosition`, `IsBotSynchronized`, `ApplyBotPlusCorrection`, `DescribeBotPlusState`, `DescribeBotPlus`, `LockBotPlusAndRefund`
Candidate decoded constants: `BOT_PLUS_UNLOCK_COST = 1250`, `WILDFIRE_DAMAGE_BOOST = 3`, `SYNCHRONICITY_UNLOCK_COST = 1500`, `BOT_BASE_PRESETS = 2`

## DropTableRandomTest
Type #153, offset `0x86b878`. Fields: 4; methods: 0; properties: 0.
Methods: none selected

## CalendarEventManager
Type #159, offset `0x86ba40`. Fields: 15; methods: 39; properties: 2.
Methods: `GetClaimRecord`, `Awake`, `OnDestroy`, `RecordDayClaim`, `RecordBonusClaim`, `ResetEventProgress_Cheat`, `_toItems`, `IsDayClaimed`, `IsBonusClaimed`, `_getEffectiveClaimRecord`, `_isClaimedInLoadedSave`, `_usesServerClaims`, `ClaimReward`, `_isAnyRewardClaimable`, `CanClaimReward`, `CanClaimBonusReward`, `OpenEventUIForFTUE`, `_updateEvents`, `_onHomePanelOpened`, `_updateEventAlert`, `_givePlayerRewards`, `ShouldUseFallbackReward`, `GetRewardDataListFromDayClaim`, `_givePlayerSingleReward`, `_pickRandomWeightedReward`, `_removeLockedEvents`, `_removeInactiveEvents`, `_removeCompletedEvents`, `_fetchAndParseActiveEvents`, `_openEventUI`, `_updateCalendarUI`, `_getActiveEventByID`

## CalendarEventDataList
Type #160, offset `0x86ba8c`. Fields: 1; methods: 3; properties: 1.
Methods: none selected

## CalendarEventData
Type #161, offset `0x86bad8`. Fields: 12; methods: 29; properties: 16.
Methods: none selected

## CalendarEventReward
Type #162, offset `0x86bb24`. Fields: 1; methods: 3; properties: 1.
Methods: none selected

## CalendarEventDropTableRewardEntry
Type #163, offset `0x86bb70`. Fields: 2; methods: 5; properties: 2.
Methods: none selected

## CalendarEventRewardDataList
Type #164, offset `0x86bbbc`. Fields: 2; methods: 5; properties: 2.
Methods: none selected

## CalendarEventRewardData
Type #165, offset `0x86bc08`. Fields: 3; methods: 7; properties: 3.
Methods: none selected

## CalendarEventClaimRecord
Type #166, offset `0x86bc54`. Fields: 3; methods: 7; properties: 3.
Methods: none selected

## CalendarEventDayClaim
Type #167, offset `0x86bca0`. Fields: 3; methods: 7; properties: 3.
Methods: none selected

## CalendarEventType
Type #169, offset `0x86bd38`. Fields: 3; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Personal = 0`, `Universal = 1`

## CoinBonusSummaryUI
Type #201, offset `0x86c6b8`. Fields: 1; methods: 3; properties: 0.
Methods: `Open`, `UpdateUI`

## CurrencyAudit
Type #221, offset `0x86cca8`. Fields: 13; methods: 23; properties: 1.
Methods: `Record`, `TryExtendRun`, `ClearRun`, `CheckLoadDivergence`, `Flush`, `CommonParent`, `IsEnabled`, `DatabaseUrl`, `CurrentPlayerId`, `ServerNow`, `DateBucket`, `BuildCategory`, `Append`, `ReplaceTailLine`, `LineBytes`, `Serialize`, `ReadPending`, `ParseFields`, `Discard`, `EnsureLastValuesLoaded`, `SaveLastValues`
Candidate decoded constants: `MAX_PENDING_ENTRIES = 2000`

## CurrencyAuditEntry
Type #222, offset `0x86ccf4`. Fields: 7; methods: 15; properties: 7.
Methods: none selected

## LifetimeCounter
Type #223, offset `0x86cd40`. Fields: 5; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Earned = 0`, `Bought = 1`, `SpentRefund = 2`, `None = 3`

## CurrencyPolicy
Type #224, offset `0x86cd8c`. Fields: 0; methods: 1; properties: 0.
Methods: `CounterFor`

## CurrencyCategory
Type #225, offset `0x86cdd8`. Fields: 74; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Iap = 0`, `Tournament = 1`, `FreeMilestone = 2`, `PremiumMilestone = 3`, `Mail = 4`, `WebstorePurchase = 5`, `AdGemClaimFree = 6`, `AdClaimWatched = 7`, `StoreClaimFree = 8`, `StoreClaimAdWatched = 9`, `CompletedRun = 10`, `BobClaimFree = 11`, `EventShop = 12`, `GuildShop = 13`, `OfferWall = 14`, `DailyMission = 15`, `GuildChest = 16`, `WorkshopRespec = 17`, `WorkshopEnhanceRespec = 18`, `IntroBonus = 19`, `EventMission = 20`, `EventBoost = 21`, `ModuleShatter = 22`, `SupportGift = 23`, `ModuleUnmerge = 24`, `BossDrop = 25`, `EliteDrop = 26`, `FleetsDrop = 27`, `Fetch = 28`, `LabUpgrade = 29`, `Refund = 30`, `AccountLink = 31`, `WebstoreFreeGift = 32`, `FreeGift = 33`, `CalendarEventReward = 34`, `AdClaimWatchedFallback = 35`, `StoreClaimAdWatchedFallback = 36`, `WorkshopUpgrade = 37`, `WorkshopUnlock = 38`, `BuyCardx1 = 39`, `BuyCardx10 = 40`, `BuyFeaturedModulex1 = 41`, `BuyFeaturedModulex10 = 42`, `BuyStandardModulex1 = 43`, `BuyStandardModulex10 = 44`, `LabRush = 45`, `ModuleUpgrade = 46`, `BuyUltimateWeapon = 47`, `UltimateWeaponUpgrade = 48`, `WorkshopEnhanceUpgrade = 49`, `WorkshopEnhanceUnlock = 50`, `LabSlotUnlock = 51`, `CardSlotUnlock = 52`, `ModuleSlotUnlock = 53`, `GuardianSlotUnlock = 54`, `UltimateWeaponPlusUpgrade = 55`, `DailyMissionReroll = 56`, `CardMastery = 57`, `ModuleReroll = 58`, `Guardian = 59`, `ChipUpgrade = 60`, `LabBoost = 61`, `BotPreset = 62`, `TowerBuddy = 63`, `Vault = 64`, `Synchronicity = 65`, `GuardianPreset = 66`, `EventRelic = 67`, `PresetSwap = 68`, `GuildSeasonReset = 69`, `DevGrant = 70`, `SaveLoaded = 71`, `NoLog = 72`

## CurrencyChangeType
Type #226, offset `0x86ce24`. Fields: 3; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Earn = 0`, `Spend = 1`

## CurrencyItem
Type #227, offset `0x86ce70`. Fields: 3; methods: 3; properties: 0.
Methods: `AddCurrencyItem`, `DisableCurrencyItem`

## CurrencyTracker
Type #228, offset `0x86cebc`. Fields: 1; methods: 7; properties: 1.
Methods: `AddCurrency`, `ResetTracker`, `GetCurrencies`, `GetCurrencyAmount`

## CurrencyType
Type #229, offset `0x86cf08`. Fields: 13; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `None = 0`, `Coin = 1`, `Gem = 2`, `Stone = 3`, `Medal = 4`, `Ticket = 5`, `Ad = 6`, `ModuleTicket = 7`, `Cell = 8`, `Key = 9`, `Tokens = 10`, `Bits = 11`

## DailyMissionActive
Type #235, offset `0x86d0d0`. Fields: 5; methods: 20; properties: 9.
Methods: `CheckGoal`, `Claim`, `IncrementCount`, `ForceComplete`, `RestartCount`

## MissionType
Type #236, offset `0x86d11c`. Fields: 12; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Common = 0`, `UltimateWeapon = 1`, `Card = 2`, `AtkUpgrade = 3`, `DefUpgrade = 4`, `UtlUpgrade = 5`, `Bot = 6`, `UpgradeSomething = 7`, `ChangeSkin = 8`, `BuyCard = 9`, `WatchAd = 10`

## ValueType
Type #237, offset `0x86d168`. Fields: 4; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Simple = 0`, `Big = 1`, `Time = 2`

## DailyMissionBase
Type #238, offset `0x86d1b4`. Fields: 7; methods: 1; properties: 0.
Methods: `HaveRequirements`

## DailyMissionManager
Type #243, offset `0x86d330`. Fields: 41; methods: 51; properties: 8.
Methods: `GetRewardShardType`, `CurrentTournamentStart`, `IsTournamentMissionAllowedForSlot`, `Awake`, `TestBackTimer8`, `TestBackTimer16`, `TestBackWeek`, `Initialize`, `UpdateLanguage`, `AddMissions`, `UpdateAvailableMissions`, `IncrementMission`, `ForceCompleteMission`, `RestartMissionCount`, `ConfirmRerollMission`, `UpdateDailyMissionShardType`, `RerollMission`, `AddRandomMissionWithExceptions`, `AddRandomMission`, `DeleteMission`, `RaiseMissionCompleteEvent`, `CheckTimerCoroutine`, `MissionUpdate`, `ResetWeek`, `ServerTimeFail`, `ContainsCurrentMission`, `FirstDailyMissionUnlock`, `ClaimWeeklyBox`, `Open`, `Close`, `UpdateButton`, `UpdateMissionTiles`, `TryGetMission`, `UpdateMissionRewardShardType`, `Button_OpenShardTypeSelection`, `Button_CloseShardTypeSelection`, `Button_SelectShardType`, `UpdateShardTypeUI`, `UpdateWeeklyBoxes`, `OnDailyMissionIntroPanelConfirm`, `UpdateAlert`
Candidate decoded constants: `MAX_MISSIONS = 8`, `NEW_MISSIONS = 2`, `STARTING_MISSIONS = 4`, `REROLL_GEM_COST = 5`

## DailyMissionTile
Type #244, offset `0x86d37c`. Fields: 13; methods: 3; properties: 0.
Methods: `Set`, `Claim`

## DevPanelCurrencyTypes
Type #269, offset `0x86dae8`. Fields: 17; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Cash = 0`, `Coins = 1`, `Gems = 2`, `Stones = 3`, `Medals = 4`, `Cells = 5`, `Keys = 6`, `Tokens = 7`, `Bits = 8`, `TournamentTickets = 9`, `ModuleTickets = 10`, `Reroll = 11`, `Cannon = 12`, `Armor = 13`, `Generator = 14`, `Core = 15`

## EventMissionData
Type #327, offset `0x86ec20`. Fields: 12; methods: 25; properties: 12.
Methods: none selected

## FlyType
Type #371, offset `0x86f930`. Fields: 4; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Gem = 0`, `Medal = 1`, `Coin = 2`

## FlyCurrency
Type #372, offset `0x86f97c`. Fields: 16; methods: 11; properties: 1.
Methods: `Awake`, `FlyRoundAdGem`, `FlyBob`, `FlyHomeAdGem`, `FlyEventMedal`, `FlyDailyMissionCoin`, `FlyDailyMissionGem`, `Fly`

## DamageData
Type #586, offset `0x873904`. Fields: 3; methods: 1; properties: 0.
Methods: none selected

## HitData
Type #587, offset `0x873950`. Fields: 2; methods: 2; properties: 0.
Methods: `TotalHits`

## LightspeedPathData
Type #588, offset `0x87399c`. Fields: 3; methods: 1; properties: 0.
Methods: none selected

## UpgradeType
Type #589, offset `0x8739e8`. Fields: 10; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Attack = 0`, `Defense = 1`, `Utility = 2`, `WorkshopAttack = 3`, `WorkshopDefense = 4`, `WorkshopUtility = 5`, `EnhancementAttack = 6`, `EnhancementDefense = 7`, `EnhancementUtility = 8`

## UpgradeMultiplier
Type #590, offset `0x873a34`. Fields: 2; methods: 1; properties: 0.
Methods: none selected

## ClosestEnemyEntry
Type #591, offset `0x873a80`. Fields: 2; methods: 1; properties: 0.
Methods: none selected

## Main
Type #618, offset `0x874284`. Fields: 946; methods: 487; properties: 62.
Methods: `ApplyRespecDiscount`, `AddGems`, `SpendGems`, `LoadGems`, `RefreshGemsUI`, `AddMedals`, `SpendMedals`, `LoadMedals`, `AddStones`, `SpendStones`, `LoadStones`, `RefreshStonesUI`, `AddKeys`, `SpendKeys`, `LoadKeys`, `Awake`, `OnDestroy`, `TriggerGameSpeedChangeEvent`, `ShieldAvailable`, `AddUpgradeCostMultiplier`, `GetUpgradeCostMultiplier`, `Initialize`, `ShouldEnergyShieldAbsorb`, `InitializeUpgradeMaxLevels`, `GrantRetroAchievementsDeferred`, `LanguageStringsUpdate`, `CheckUpgradeTiers`, `OnApplicationFocus`, `CheckMaxedWorkshops`, `GetDropLandmineDamage`, `UpdateUltimateWeaponDescriptions`, `GetAverageUltimateCooldownMultiverseNexus`, `PlayUltimateWeaponOnStartIfNeeded`, `UpdateTimers`, `WorkshopUpgradeTier`, `GetEnemyTargetIndex`, `FtueExtraAttackSpeed`, `TowerFireFunction`, `OnDrawGizmosSelected`, `GetSentryProtocolWorkshopOrbsAttackSpeed`, `GetSentryProtocolCardOrbsAttackSpeed`, `SentryProtocolFire`, `SentryProtocolUpdate`, `TacticalBarrageUpdate`, `TryGetTacticalBarrageTarget`, `GetTargetPriorityRank`, `OrbFire`, `CalculateEnemyDistances`, `FixedUpdate`, `GetLightSpeedBounceHitData`, `Update`, `HitAllBounceTargets`, `MultishotBullet`, `RapidFireStart`, `LightspeedMultishot`, `DifficultyTierCalcs`, `TierUp`, `TierDown`, `ResetRoundStats`, `StartNewRoundTestHeat`, `ProjectFundingCoroutine`, `StartNewRound`, `UpdateExtraCornerButtons`, `MainCameraSizeCheck`, `StartNewRoundFunction`, `_applyFTUEEnemySpawnDelay`, `StartNewRoundWallFunction`, `RebuildWallFunction`, `WallInvincibleEffect`, `GetWavesToSkipForIntroSprint`, `ApplyDeathWaveHealthFromKill`, `ApplyDeathWaveHealthMultiplierGain`, `NewWave`, `IntroSprintCoins`, `IsAllUpgradesMaxedOrLocked`, `IsAllDefenseUpgradesMaxedOrLocked`, `IsAllUtilityUpgradesMaxedOrLocked`, `GetWaveBaseDamage`, `GetWaveBaseHealth`, `WaveUpdate`, `SpawnRecoveryPackage`, `SpawnEnemy`, `QueueScatterChild`, `SpawnAllQueuedScatterChildren`, `TurnOnProtectorUltimate`, `SpawnRandomBasicEnemy`, `TurnOffProtectorUltimate`, `SpawnRandomEliteEnemy`, `TurnOnTankUltimate`, `SpawnRandomFleetEnemy`, `GetRandomSpawnPosition`, `Dev_StartNewAccount`, `TurnOffTankUltimate`, `TurnOnCommanderUltimate`, `TurnOffCommanderUltimate`, `EndIntroSprint`, `Button_CancelIntroSprint`, `GetProtectorRadiusGrowthFactor`, `TryGetProjectile`, `BonusDamageFromImpetus`, `IsBossActive`, `IsFleetActive`, `GetParticleExplosionPool`, `TryGetOrbProjectile`, `TowerBossNet`, `TowerBossFire`, `GetFleetWaveDamageProgress`, `TowerFire`, `CountProjectileFired`, `BossNetHit`, `BossProjectileHit`, `LightspeedGetHitTarget`, `GetLightspeedDamageOnTarget`, `GetBounceHitData`, `ComputeBounceTargets`, `FindNextBounceTarget`, `UpdateEnergyShieldSliders`, `ChainLightning`, `GetSpecificWaveHealthDamageBossHit`, `GetSpecificWaveHealthDamageEnemyHit`, `GetRandomAliveEnemyOnScreen`, `UpdateClosestEnemies`, `ParticleExplosionTowerHit`, `FreeUpgradeFloatingText`, `UpdateWaveSkipTextsPos`, `UpdateClosestEnemiesToPoint`, `HeatingUpFloatingText`, `WaveSkipFloatingText`, `GoldenTowerPlusBonusFloatingText`, `EnemyLevelSkipFloatingText`, `LandminePlusTextAnimationMultiplier`, `MultBuyCalc`, `CalculateEnhancementCosts`, `MultBuySpecial`, `UpgradeCostCalc`, `UpgradeDefenseCostCalc`, `UpgradeUtilityCostCalc`, `UpgradeWorkshopCostCalc`, `UpgradeUltimateEnhancementCostCalc`, `UpgradeEnhancementCostCalc`, `AwardPlayTimeRelics`, `EnsureUtc`, `AwardIfEligible`, `GetUltimateWeaponCost`, `UpgradeUltimateWeaponCostCalc`, `GetUltimateWeaponPlusUpgradeCostForLevel`, `GetUltimateWeaponFullBenefit`, `FormatUltimateWeaponBenefit`, `GetChainLightningDamage`, `GetChainLightningQuantity`, `GetChainLightningChance`, `GetSmartMissilesDamage`, `GetSmartMissilesQuantity`, `GetSmartMissilesCooldown`, `GetDeathwaveDamage`, `GetDeathwaveQuantity`, `GetDeathwaveCooldown`, `GetChronoFieldDuration`, `GetChronoFieldSpeedReduction`, `GetChronoFieldCooldown`, `GetInnerLandMineDamage`, `GetInnerLandMineQuantity`, `GetInnerLandMineCooldown`, `GetGoldenTowerBonus`, `GetGoldenTowerDuration`, `GetGoldenTowerCooldown`, `GetPoisonSwampDamage`, `GetPoisonSwampDuration`, `GetPoisonSwampCooldown`, `GetUltimateWeaponAppliedLevel`, `GetBlackHoleSize`, `GetBlackHoleDuration`, `GetBlackHoleCooldown`, `GetSpotlightBonus`, `GetSpotlightAngle`, `GetSpotlightQuantity`, `UpgradeUltimateWeaponBenefit`, `UpdateUltimateWeaponPlusBenefit`, `NewUltimateWeapon`, `IsAttackUpgradeEnabled`, `IsDefenseUpgradeEnabled`, `IsUtilityUpgradeEnabled`, `IsUltimateWeaponUnlocked`, `IsUltimateWeaponActive`, `GetActiveUWs`, `UpdateUltimateWeaponChoices`, `DoUltimateWeaponUpgrade`, `UpgradeUltimateWeaponButton`, `UpgradeUltimateWeaponPlusButton`, `DoNewUltimatePlusUnlock`, `DoUltimatePlusWeaponUpgrade`, `UpgradeButton`, `UpgradeDefenseButton`, `UpgradeUtilityButton`, `UpgradeWorkshopAttackButton`, `UnlockEnhancementButton`, `UnlockEnhancementDefenseButton`, `UnlockEnhancementUtilityButton`, `EnhancementAttackButton`, `EnhancementDefenseButton`, `EnhancementUtilityButton`, `UpgradeWorkshopDefenseButton`, `UpgradeWorkshopUtilityButton`, `NeedToCalculateUpgradeBonuses`, `AdjustDamageUp`, `AdjustDamageDown`, `CalculateDamageUpgradeBonuses`, `CalculateUpgradeBonuses`, `_calculateAttackSpeedUpgradeBonuses`, `GetOutOfRoundDamage`, `AdjustDamageLog`, `GetOutOfRoundAttackSpeed`, `GetOutOfRoundCriticalChance`, `GetOutOfRoundCriticalMultiplier`, `GetOutOfRoundMaxDistance`, `GetOutOfRoundImpetus`, `GetOutOfRoundMultishotChance`, `GetOutOfRoundMultishotTargets`, `GetOutOfRoundRapidFireChance`, `GetOutOfRoundRapidFireDuration`, `GetOutOfRoundBounceChance`, `GetOutOfRoundBounceTargets`, `GetOutOfRoundBounceRange`, `GetOutOfRoundSuperCritChance`, `GetOutOfRoundSuperCritMultiplier`, `GetOutOfRoundRendArmorChance`, `GetOutOfRoundRendArmorMultiplier`, `GetOutOfRoundMaxHealth`, `GetOutOfRoundHealthRegen`, `GetOutOfRoundDefenseRel`, `GetOutOfRoundDefenseAbsolute`, `GetOutOfRoundThornDamage`, `GetOutOfRoundLifesteal`, `GetOutOfRoundKnockbackChance`, `GetOutOfRoundKnockbackForce`, `GetOutOfRoundOrbSpeed`, `GetOutOfRoundOrbCount`, `GetOutOfRoundShockwaveSize`, `GetOutOfRoundShockwaveFrequency`, `GetOutOfRoundMineChance`, `GetOutOfRoundMineDamage`, `GetOutOfRoundMineRadius`, `GetOutOfRoundDeathDefyChance`, `GetOutOfRoundWallPercentOfTowerHealth`, `GetOutOfRoundWallRebuild`, `GetOutOfRoundCashBonusUpgrade`, `GetOutOfRoundCashPerWave`, `GetOutOfRoundCoinsBonusUpgrade`, `GetOutOfRoundCoinsPerWave`, `GetOutOfRoundFreeAttackUpgradeChance`, `GetOutOfRoundFreeDefenseUpgradeChance`, `GetOutOfRoundFreeUtilityUpgradeChance`, `GetOutOfRoundInterestPerWave`, `GetOutOfRoundRecoveryAmount`, `GetOutOfRoundRecoveryMax`, `GetOutOfRoundRecoveryChance`, `GetOutOfRoundAttackLevelSkipChance`, `GetOutOfRoundHealthLevelSkipChance`, `CalculateEnemyLevelSkipChances`, `CalculateMaxRangeAndSetRadius`, `GetRestorativeBonusMultiplier`, `WorkshopEnhancementRespec`, `Button_WorkshopPresetSelect`, `WorkshopRespec`, `PlayDeathDefyEffect`, `SecondWindEffect`, `SecondWindCleanup`, `CanApplyWorkshopPresetForBattle`, `LaunchMissileBarrage`, `ActivateEnergyShield`, `ActivateRepel`, `ActivateNuke`, `ShowDemonModeButton`, `ActivateDemonMode`, `Button_ToggleDemonModeAutomation`, `RefreshBastionButton`, `ActivateBastion`, `Button_ToggleNukeAutomation`, `ArmVikingFuneral`, `DemonModeEffect`, `RefreshAbilityButtonsForIntroSprint`, `Button_CardDetailToggle`, `SecondWindBlast`, `Button_ToggleDeathRayInstantKill`, `Button_ToggleSpawnAccelerator`, `Button_ToggleEnergyShieldRestriction`, `Button_ToggleBastionAutomation`, `Button_ToggleEliteBalance`, `WallDestroyed`, `GameOver`, `AnyDeathSaveStillAvailable`, `EndIntroSprintIfNoSavesRemain`, `NukeImmortalityEffect`, `ApplyTowerDamage`, `GetAliveFleetEarliestSpawnWave`, `ResolveLethalHit`, `TryUseSecondWindSave`, `TryUseDemonModeSave`, `TryUseBastionSave`, `TryUseNukeSave`, `SetLifeSavingOrder`, `GetAliveBossEarliestSpawnWave`, `GoHomePauseBattle`, `Button_GameEndPanelGoHome`, `GameOverFunction`, `Button_ToggleAutoRestartBattle`, `AutoRetryBattle`, `OnApplicationPause`, `ReturnHomeButton`, `OffClickReturnHomePanel`, `ReturnHomeConfirm`, `SpeedChangeMax`, `SpeedChangeUp`, `SpeedChangeDown`, `SpeedChangeDownMax`, `TestDisable`, `IsRewardedAdsBypassed`, `DisableAdsUnlock`, `StarterPackUnlock`, `EpicPackUnlock`, `CalculateCoinBonuses`, `GetThemesCoinBonus`, `ApplyRecoveryPackage`, `GetWallHealthTrueMax`, `ApplyRepairChipHeal`, `ApplyAllyRecoveryPackage`, `AdLoopStart`, `AdLoopStop`, `AdStartFunction`, `AdLoadingCancel`, `SRDebuggerStart`, `TestResetBob`, `GemBlockTap`, `GemBlockFunction`, `GemBlockSpawn`, `CheckBossSpawned`, `OrbCheck`, `InnerOrbDistanceDown`, `InnerOrbsDistanceUp`, `UpdateWorkshopOrbDistance`, `UpdateInnerOrbDistance`, `WorkshopOrbsDistanceDown`, `WorkshopOrbsDistanceUp`, `DeathRayFunction`, `GameSpeedModifier`, `InnerOrbsDistanceSetStep`, `GameSpeedValidationLogFunction`, `RateGame`, `RateGameRequestCheck`, `WorkshopOrbsDistanceSetStep`, `ShockwaveFunction`, `TriggerMagneticHook`, `InterestFloatingText`, `Pause`, `CompleteReturnFromPauseToHome`, `ApplyInactiveGameSpeed`, `CheckForResumeRoundOnLoad`, `Unpause`, `CheckForResumeRound`, `UpdateBattleText`, `ResumeRoundPanelOpen`, `ResetResumeRound`, `ShowFailPanel`, `ResumeRound`, `ResumeRoundCancel`, `SavePlayerOptToSaveResume`, `GetUltimateWeaponIndex`, `UpdateMainConfig`, `Button_ToggleFreeLockout`, `FreeRespecAllPreset`, `GetRecentCoinsPerHour`, `GetRecentCellsPerHour`, `FreeWorkshopRespec`, `FreeWorkshopEnhancementRespec`, `IsTowerImmortal`, `HasDeathDefied`, `IsWaveSkip`, `IsDoubleWaveSkip`, `IsCriticalHit`, `IsSuperCriticalHit`, `IsMultishot`, `IsRapidFire`, `IsFleetWave`, `CreateBattleHistoryEntry`, `InitializeTowerWrapped`, `GetTowerWrappedStatsThisYear`, `AddCurrencyLog`, `GetSaboteurUWUpgradeIndex`, `EstimateTotalEnemySpawnsAtWave`, `GetFleetsDamageDecimal`, `DropPointerPressOnCancelledTouch`, `DropPendingPointerPress`, `PauseAdCoinBonusTimer`, `ResumeAdCoinBonusTimer`
Candidate decoded constants: `MAX_POSSIBLE_TIER = 24`, `SKIN_COIN_BONUS = 0.00400000019`, `BACKGROUND_COIN_BONUS = 0.00800000038`, `MENU_COIN_BONUS = 0.00600000005`, `PROFILE_BANNER_COIN_BONUS = 0.00600000005`, `SONG_COIN_BONUS = 0.00600000005`, `GUARDIAN_SKIN_COIN_BONUS = 0.00600000005`, `ATTACK_ENHANCEMENT_COUNT = 6`, `DEFENSE_ENHANCEMENT_COUNT = 6`, `UTILITY_ENHANCEMENT_COUNT = 6`, `MINIMUM_WAVE_TO_ALLOW_RESUME_ROUND = 4`, `MAX_BATTLE_HISTORY_ENTRIES = 30`, `AUTO_RETRY_TIMER = 100`, `DEATH_WAVE_HEALTH_MULTIPLIER_PER_KILL = 0.000500000024`, `MAX_DEFENSE_PERCENT = 98`, `DEMON_MODE_CAP_WAVES = 10`, `SECOND_WIND_CAP_WAVES = 2`, `VIKING_FUNERAL_CAP_WAVES = 10`, `ENERGY_SHIELD_MIN_CHARGE_WAVES = 2`, `WALL_MIN_CHARGE_WAVES = 2`, `TIER_1_MIN_WAVE_FOR_RANGED = 21`, `DEFAULT_MAX_TIER = 24`, `WORKSHOP_BASE_PRESETS = 2`, `BLACK_HOLE_SIZE_STAT_INDEX = 21`, `workshopRespecCost = 150`, `DAMAGE_ADJUSTMENT_LOG_MAX = 37`, `ORB_MIN_DISTANCE_WORKSHOP = 6`, `SENTRY_PROTOCOL_RADIUS = 1.5`, `SPAWN_COOLDOWN = 0.125`

## Milestone
Type #631, offset `0x874660`. Fields: 35; methods: 10; properties: 1.
Methods: `InitializeMilestone`, `UpdateMilestone`, `KillAnimations`, `ClaimFreeReward`, `ClaimPremiumReward`, `ShowBetaBlockedIfNeeded`

## RewardType
Type #632, offset `0x8746ac`. Fields: 15; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Coins = 0`, `Gems = 1`, `Stones = 2`, `Research = 3`, `ResearchGroup = 4`, `Card = 5`, `CardUnlock = 6`, `TowerSkin = 7`, `Background = 8`, `Tier = 9`, `System = 10`, `Relic = 11`, `MenuSkin = 12`, `ProfileBannerSkin = 13`

## MilestoneManager
Type #633, offset `0x8746f8`. Fields: 71; methods: 29; properties: 2.
Methods: `Initialize`, `OldSaveSetup`, `Open`, `Close`, `UpdateAvailableCount`, `PremiumPanelOpen`, `PremiumUnlock`, `PremiumUnlockAll`, `PremiumPurchaseClick`, `ClaimReward`, `TierDown`, `TierUp`, `UpdateMilestones`, `UpdateScrollPosition`, `TestResetTierUnlock`, `UpdateBottomPanel`, `GetNecessaryWave`, `GetResearchGroup`, `IsPremiumUnlockedThisTier`, `GetPremiumRewardTotal`, `GetPremiumIndexFromTier`, `ClaimAllRewards`, `UnclaimAllRewards`, `HasUnclaimedRewards`

## MissionType
Type #639, offset `0x8748c0`. Fields: 6; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Common = 0`, `UltimateWeapon = 1`, `Card = 2`, `Perk = 3`, `Fixed = 4`

## ValueType
Type #640, offset `0x87490c`. Fields: 4; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Simple = 0`, `Big = 1`, `Time = 2`

## Mission
Type #641, offset `0x874958`. Fields: 16; methods: 19; properties: 11.
Methods: `CheckGoal`, `Claim`, `ClaimForMail`, `RestartCount`, `ForceComplete`, `Reset`, `Save`, `Load`

## MissionData
Type #642, offset `0x8749a4`. Fields: 7; methods: 14; properties: 7.
Methods: none selected

## Tab
Type #643, offset `0x8749f0`. Fields: 4; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Missions = 0`, `Shop = 1`, `Bots = 2`

## MissionEvent
Type #668, offset `0x87515c`. Fields: 228; methods: 128; properties: 14.
Methods: `Awake`, `OnDestroy`, `Initialize`, `UpdateLanguage`, `GetShopTradeCost`, `ActivateBattlePass`, `CheckEvent`, `UpdateEvent`, `CheckButtons`, `CheckAlert`, `LogPlaySummaryThisEventCycle`, `RestartCurrentEvent`, `StartNewEvent`, `RefreshCurrentEventRegistry`, `MigrateEventRegistries`, `GetSelectedMissions`, `ShouldUseTournamentMissionSlot`, `GetEventMissionSlotUnlockDate`, `IsTournamentMissionUnlockDate`, `Dev_StartNewEvent`, `SendMedalsMail`, `SendRelicsMail`, `IncrementMissionDelayed`, `AddIncrementToRedoCache`, `RedoCachedMissionIncrements`, `IncrementMission`, `IncrementMissionRetry`, `GetMissionGoal`, `IncrementEliteHit`, `SetMissionCount`, `RestartMissionCount`, `ActivateMissions`, `ActivateMission`, `CheckLoginMission`, `EventInfoOpen`, `EventPanelOpen`, `EventPanelUpdateFunction`, `EventPanelClose`, `SelectMissionTab`, `SelectShopTab`, `SelectBotsTab`, `ClaimRelic`, `GetDisplayedGemRelicRotationIndex`, `Dev_Button_ShowNextGemRelicRotation`, `Dev_Button_ShowPreviousGemRelicRotation`, `ChangeGemRelicRotation`, `UpdateGemRelicShopSection`, `UpdateEventUI`, `MedalUpdate`, `TimerUpdate`, `FixShopLayout`, `BlockedByPresetRestore`, `RunEventMedalPurchase`, `PurchaseGem`, `PurchaseStone`, `PurchaseCannonShard`, `PurchaseArmorShard`, `PurchaseGeneratorShard`, `PurchaseCoreShard`, `PurchaseTowerSkinConfirmation`, `PurchaseBackgroundConfirmation`, `PurchaseRelicConfirmation_Medals`, `PurchaseRelicConfirmation_Gems`, `PurchaseMenuConfirmation`, `PurchaseRelicMedals`, `PurchaseRelic_Medals`, `PurchaseRelic_Gems`, `PurchaseRelic_Gems`, `PurchaseProfileBannerConfirmation`, `PurchaseTowerSkin`, `PurchaseBackgroundSkin`, `PurchaseMenuSkin`, `PurchaseProfileBannerSkin`, `UnlockBotConfirmation`, `UnlockBot`, `UnlockBotPlus`, `UpgradeBotPlus`, `PurchaseBotUpgrade`, `GetTotalMedalsSpentOnBots`, `BotDetailsPanelOpen`, `BotPlusDetailsPanelOpen`, `RaiseMissionGoalEvent`, `RelicDetailsPanelOpen`, `RelicStoreDetailsPanelOpen`, `GetDisplayedEventShopGemRelic`, `ShowGemRelicDetails`, `OnEventOpenChanged`, `OnMissionCountChanged`, `OnEventDataChanged`, `ApplyEventData`, `CheckBotUnlockCosts`, `UnlockSongConfirmation`, `UnlockSong`, `SampleSongPressed`, `GetMinVersionForEvent`, `UpdateMissionsFromRemoteSettings`, `CreateMissionItem`, `ShowEventBoostInfoPopup`, `TryUnlockSynchronicity`, `TryUpgradeSynchronicity`, `ShowSynchronicityInfoPanel`
Candidate decoded constants: `BOT_CONTAINER_PLUS_SIZE = 465`, `BOT_CONTAINER_SIZE = 345`, `rareRelicCost_medals = 200`, `epicRelicCost_medals = 500`, `rareRelicCost_gems = 600`, `epicRelicCost_gems = 1200`, `TowerCost = 150`, `BackgroundCost = 250`, `MenuCost = 200`, `ProfileBannerCost = 200`, `SongCost = 200`, `GemsTrade = 150`, `StonesTrade = 15`, `ShardsTrade = 250`, `TournamentMissionIndex = 1`, `EventMissionsUnlockedPerDay = 2`, `ClaimAdGemsMissionIndex = 5`

## MissionGoalFloating
Type #670, offset `0x8751f4`. Fields: 7; methods: 6; properties: 0.
Methods: `Awake`, `OnDestroy`, `OnGoalReached`, `ShowNew`

## MissionTile
Type #671, offset `0x875240`. Fields: 14; methods: 3; properties: 0.
Methods: `Set`, `Claim`

## ModuleRandomTest
Type #693, offset `0x8758c8`. Fields: 4; methods: 0; properties: 0.
Methods: none selected

## ModuleManager
Type #703, offset `0x875bc0`. Fields: 110; methods: 294; properties: 89.
Methods: `GetMaxSlotLevel`, `GetPrimarySlotLevel`, `GetAssistSlotLevel`, `GetSlotLevel`, `SetSlotLevel`, `GetSlotCoinsSpent`, `GetSlotShardsSpent`, `AddSlotSpend`, `ClearSlotSpend`, `TryGetEquippedSlot`, `GetEffectiveModuleLevel`, `GetEffectiveLevelForSlot`, `IsSlotRarityCapped`, `ResolveLevelUpSlot`, `ClearModuleLevelData`, `GetAllModuleItems`, `MigrateModuleLevelsToSlots`, `HasSlotLevelMigrationRefund`, `ShowSlotLevelMigrationPopupIfNeeded`, `Awake`, `Initialize`, `OnDestroy`, `GetModuleName`, `GetModuleUniqueDescription`, `GetModuleUniqueValue`, `GetEffectDescription`, `GetModuleIcon`, `GetShards`, `GetShardsIcon`, `TestInventory`, `TryBuyModuleFromBanner`, `TryBuyModuleBulkFromBanner`, `BuyModuleBulkFromBanner`, `SimulateBuyModuleFromBanner`, `ApplyModulePreset`, `SnapshotEquippedToPreset`, `ApplyPreset`, `FindInventoryModuleByGuid`, `FindModuleByGuid`, `IsEquippedInOtherPreset`, `EquipModule`, `UnequipModule`, `UnequipModule`, `HaveModuleOfRarityOrHigher`, `Unmerge`, `IsMergeValid`, `IsMergeValid`, `IsAtMaxRarity`, `CanBeMerged`, `IsSelectedToMerge`, `IsSelectedOrCanBeMerged`, `ClearMerge`, `SelectToMerge`, `RemoveFromMerge`, `Merge`, `Merge`, `CalculateAutoMerge`, `TryBossDrop`, `TryCarePackageDrop`, `GetCommonModuleDropChance`, `GetRareModuleDropChance`, `TryRerollShardsDrop`, `TryEliteRerollShardsDrop`, `GetShardsReward`, `GetNumberOfRerollShards`, `GetNumberOfFetchRerollShards`, `GetNumberOfModuleShardsForFleets`, `GetNumberOfRerollShardsForFleets`, `TryFleetsDrop`, `CreateModule`, `CreateModule`, `CreateModule`, `CreateModule`, `CreateModule`, `CreateModuleFromBanner`, `CreateModule`, `IsEquipped`, `IsEquipped`, `TryGetRarityIfEquipped`, `CalculateLevelUpUsingBuyMultiplier`, `CalculateLevelUpOnce`, `CalculateLevelUpToNextEffect`, `CalculateLevelUp`, `CalculateLevelUpMax`, `LevelUpToNextEffect`, `LevelUpMax`, `_levelUpToNewLevel`, `LevelUp`, `RestoreSlot`, `GetShatterUniqueModuleComponents`, `ShatterModule`, `HaveEmptyEffects`, `GetLockedSubstats`, `RollEmptyEffects`, `TryAddAvailableEffects`, `HasEffectsToReroll`, `RerollNotLockedEffects`, `DoRerollNotLockedEffects`, `GetSeedFromModuleIdentityAndRerollCount`, `GetAllStructurallyValidEffectIndicesForModuleType`, `RollDeterministicSubstatCandidate`, `RollEffectRarityFromRandomValue`, `GetRarityToTryForFallbackStep`, `IsCandidateAllowedAfterAllRerollFilters`, `IsClusterBannedForThisModuleType`, `CreateSeededRandomForAttempt`, `GetPotentialEffectsForModule`, `GetAllPotentialEffectsForModule`, `GetAllowedClustersForModule`, `AutoRollRunCheck`, `GetLevelUpShardsCost`, `GetLevelUpCoinsCost`, `GetRerollCost`, `GetBenefitIfEquipped`, `GetEquippedClusterBenefit`, `GetEquippedAssistClusterBenefit`, `GetModuleAfterMergeBenefit`, `GetModuleMainBenefit`, `GetModuleMainBenefit`, `GetCannonBaseBenefit`, `GetArmorBaseBenefit`, `GetGeneratorBaseBenefit`, `GetCoreBaseBenefit`, `GetCannonMainBenefit`, `GetArmorMainBenefit`, `GetGeneratorMainBenefit`, `GetCoreMainBenefit`, `GetModuleFrame`, `GetSubstatClusterType`, `GetSubstatName`, `GetMaxLevelPerRarity`, `GetEffectSlotRequiredLevel`, `GetEffectSlotMaxShownSlots`, `GetEffectMaxSlots`, `GetUniqueBenefit`, `IsNaturalEpicModule`, `GetShatterShards`, `GetUnmergeShards`, `TryGetUniqueBenefit`, `AddModuleTickets`, `SpendModuleTickets`, `LoadModuleTickets`, `RefreshTicketUI`, `GiveFreeTickets`, `GetMainEffectName`, `GetRarityName`, `GetRarityName`, `GetTypeName`, `GetMaxEffectRarity`, `GetMergeRequirement`, `CalculateAllIfRound`, `GetBannersFromConfig`, `StopActiveCoroutines`, `GetFeaturedBanners`, `GetRotatingBanners`, `GetBanners`, `ClearBannerCache`, `TryCreateBanner`, `ValidateBannerData`, `ReportBannerProblem`, `CheckBannerForAdjustedOdds`, `GetPossibleMergeCount`, `IsHighlighted`, `HasHighestAncestralCopy`, `HasHighestAncestral`, `GetHighestModuleLevelByType`, `GetCurrentBanner`, `FeaturedBannerDurationCheck`, `RotatingBannerDurationCheck`, `GetEarliestRotatingBanner`, `GetEarliestFeaturedBanner`, `GetEarliestBanner`, `GetAssistModuleUniqueEffectEfficiency`, `GetAssistModuleUniqueEffectEfficiencyString`, `GetAssistModuleUniqueEffectCost`, `GetPrimaryModuleBonus`, `GetAssistModuleMainEffectEfficiency`, `GetAssistModuleMainEffectEfficiency`, `GetAssistModuleMainEffectLevel`, `GetAssistModuleMainEffectCost`, `GetAssistModuleSubstatEfficiency`, `GetAssistModuleSubstatEfficiency`, `GetAssistModuleSubstatLevel`, `GetAssistModuleSubstatCost`, `UnlockCannonAssistModuleSlot`, `UnlockArmorAssistModuleSlot`, `UnlockGeneratorAssistModuleSlot`, `UnlockCoreAssistModuleSlot`, `IsEquippedAssist`, `IsEquippedAssist`, `EquipModuleAssist`, `UnequipModuleAssist`, `UnequipModuleAssist`, `IsEquippedOnPrimaryOrAssist`, `IsEquippedOnPrimaryOrAssist`, `RespecAssistModules`, `IsDisabledAssistSubstat`, `IsCappedAssistSubstatEffect`, `CorrectModuleSlotTypes`
Candidate decoded constants: `UNMERGE_COST = 20`, `PITY = 150`, `RARE_PITY = 10`, `INVENTORY_LIMIT = 350`, `MODULE_DROP_COOLDOWN = 5`, `MODULE_DROP_COOLDOWN_CHAMPION = 5`, `MODULE_HISTORY_LIMIT = 150`, `MAX_RARITY_DROP_ADJUSTMENT_MULTIPLIER = 0.25`, `ASSIST_MODULE_SLOT_UNLOCK_COST = 1000`, `ASSIST_MODULE_UNIQUE_EFFECT_EFFICIENCY_MAX_LEVEL = 3`, `ASSIST_MODULE_MAIN_EFFECT_EFFICIENCY_MAX_LEVEL = 99`, `ASSIST_MODULE_SUBSTAT_EFFICIENCY_MAX_LEVEL = 69`, `BEING_ANNIHILATOR_GUARANTEED_SUPER_CRITS = 5`, `TACTICAL_BARRAGE_MISSILE_LOCK_DELAY = 0.5`, `NUM_DEFINED_MODULES = 53`, `MODULE_BASE_PRESETS = 2`, `deterministicRollAttemptsPerSlot = 5000`

## NotificationPermissionState
Type #757, offset `0x876bc8`. Fields: 5; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `NotAsked = 0`, `Granted = 1`, `DeniedCanAsk = 2`, `Blocked = 3`

## RecoveryPackage
Type #834, offset `0x8782a4`. Fields: 5; methods: 3; properties: 0.
Methods: `FixedUpdate`, `OnCollisionEnter2D`

## PlayerData
Type #873, offset `0x878e38`. Fields: 836; methods: 1674; properties: 835.
Methods: `To2DArrayExpandable`, `To2DArray`, `To1DArray`

## CurrencyLog
Type #882, offset `0x8790e4`. Fields: 4; methods: 8; properties: 4.
Methods: none selected

## CurrencyNameToSpriteConfig
Type #888, offset `0x8792ac`. Fields: 1; methods: 2; properties: 0.
Methods: `GetSpriteFromName`

## CurrencyNameToSpriteData
Type #889, offset `0x8792f8`. Fields: 2; methods: 1; properties: 0.
Methods: none selected

## CalendarEventBonusRewardEntryUI
Type #1032, offset `0x87bd6c`. Fields: 5; methods: 7; properties: 0.
Methods: `Awake`, `OnDestroy`, `SetInfo`, `_onInfoButtonPressed`

## CalendarEventBonusRewardUI
Type #1033, offset `0x87bdb8`. Fields: 10; methods: 8; properties: 0.
Methods: `OnDestroy`, `SetInfo`, `SetClaimed`, `SetBonusAvailable`, `_onInfoButtonPressed`

## CalendarEventEntryUI
Type #1034, offset `0x87be04`. Fields: 12; methods: 8; properties: 0.
Methods: `Awake`, `SetInfo`, `SetClaimed`, `SetActiveDay`, `_onInfoButtonPressed`

## CalendarEventUI
Type #1037, offset `0x87bee8`. Fields: 37; methods: 24; properties: 0.
Methods: `Awake`, `OnDestroy`, `Update`, `Open`, `SetActiveEvents`, `_setClaimStatus`, `_removeClaimStatus`, `_setCurrentEvent`, `CloseIfNoRewardsToClaim`, `_setClaimable`, `_setRewardEntries`, `_setActiveDay`, `_setBonusReward`, `_setNextPriorityEventIndex`, `_openRewardInfoPanel`, `_openMultiRewardInfoPanel`, `_openDropChanceInfoPanel`, `_onPageLeftPressed`, `_onPageRightPressed`, `_onClaimPressed`, `_onClosePressed`
Candidate decoded constants: `DEFAULT_POS_Y = 100`, `EIGHT_DAY_CELL_SIZE = 185`, `EIGHT_DAY_COLUMN_COUNT = 4`, `FIFTEEN_DAY_CELL_SIZE = 150`, `FIFTEEN_DAY_COLUMN_COUNT = 5`, `TWENTY_FOUR_DAY_POS_Y = 25`, `TWENTY_EIGHT_DAY_CELL_SIZE = 125`, `TWENTY_EIGHT_DAY_COLUMN_COUNT = 6`
