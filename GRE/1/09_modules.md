# Modules
Source: Assembly-CSharp.dll metadata v39. Types may appear in more than one domain. Names are not proof of runtime behavior.

108 type records. Full field, method and property records in `09_modules.json`.

## AssistModuleSlot
Type #97, offset `0x86a7d8`. Fields: 9; methods: 19; properties: 9.
Methods: none selected

## AssistModuleSlotType
Type #98, offset `0x86a824`. Fields: 5; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Cannon = 0`, `Armor = 1`, `Generator = 2`, `Core = 3`

## DevPanelModuleTypes
Type #270, offset `0x86db34`. Fields: 5; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Cannon = 0`, `Armor = 1`, `Generator = 2`, `Core = 3`

## DevPanelModuleRarity
Type #271, offset `0x86db80`. Fields: 16; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Common = 0`, `Rare = 1`, `RarePlus = 2`, `Epic = 3`, `EpicPlus = 4`, `Legendary = 5`, `LegendaryPlus = 6`, `Mythic = 7`, `MythicPlus = 8`, `Ancestral = 9`, `Ancestral1 = 10`, `Ancestral2 = 11`, `Ancestral3 = 12`, `Ancestral4 = 13`, `Ancestral5 = 14`

## DevPanelAssistModuleEfficiencies
Type #279, offset `0x86dde0`. Fields: 4; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `UniqueEffect = 0`, `MainEffect = 1`, `Substat = 2`

## FeaturedModuleViewer
Type #331, offset `0x86ed50`. Fields: 4; methods: 3; properties: 0.
Methods: `Set`, `Click`

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

## ModuleBannerData
Type #672, offset `0x87528c`. Fields: 10; methods: 21; properties: 10.
Methods: none selected

## BannerModuleData
Type #674, offset `0x875324`. Fields: 2; methods: 5; properties: 2.
Methods: none selected

## ModuleBansUI
Type #680, offset `0x8754ec`. Fields: 13; methods: 10; properties: 1.
Methods: `Awake`, `Close`, `Open`, `ModuleBansPanelUpdate`, `GetBannedSubstats`, `Button_ModuleBansTab`, `Button_BanRow`

## ModuleBulkViewer
Type #681, offset `0x875538`. Fields: 9; methods: 11; properties: 2.
Methods: `Awake`, `Set`, `PlayAnimation`, `ClaimClick`, `RefreshBuyBulk`, `BuyBulkModuleClick`, `ModuleClick`

## ModuleDetailsUI
Type #688, offset `0x87574c`. Fields: 81; methods: 47; properties: 0.
Methods: `Awake`, `Start`, `OnDestroy`, `Open`, `OpenEmptySlot`, `InternetCheck`, `Close`, `SetBaseValues`, `SetNormalMode`, `SetEmptySlotMode`, `SetLevelUpControls`, `SetRerollMode`, `GetUniqueValue`, `ToggleEffectLock`, `MaxLevelWarningClick`, `FavoriteClick`, `CanStartModuleAction`, `RestoreClick`, `UnmergeClick`, `UniqueEffectClick`, `EnterRerollModeClick`, `BackFromRerollModeClick`, `RerollClick`, `TryEquipClick`, `EquipClick`, `EquipAssistClick`, `UpgradeClick`, `MaxClick`, `_onLevelToNextEffectClicked`, `Button_OpenSubstatBans`, `Button_OpenAutoReroll`, `Button_BuyMultiplierOptionsToggle`, `BM_Select`, `BM_PanelOpen`, `BM_PanelClose`, `UpdateBuyMultiplierText`, `Button_TryStartAutoRoll`, `Button_StartAutoRolling`, `Button_StopAutoRolling`, `AutoReroll`, `ForceUpdateLayout`
Candidate decoded constants: `PANEL_LAYOUT_GROUP_TOP_PADDING_EQUIPPED = 335`, `PANEL_LAYOUT_GROUP_TOP_PADDING = 198`

## ModuleEffectRollbackUI
Type #690, offset `0x8757e4`. Fields: 8; methods: 6; properties: 0.
Methods: `CacheModule`, `Open`, `SelectNew`, `SelectPrevious`, `ForceUpdateLayout`

## ModuleInfoUI
Type #691, offset `0x875830`. Fields: 5; methods: 6; properties: 1.
Methods: `Start`, `OnDestroy`, `OnPanelSelected`, `UpdateModuleInfoUI`

## ModuleInventoryItem
Type #692, offset `0x87587c`. Fields: 10; methods: 8; properties: 0.
Methods: `Set`, `OnPointerClick`, `OnPointerDown`, `OnPointerUp`, `OnBeginDrag`, `Click`, `OpenDetails`

## ModuleRandomTest
Type #693, offset `0x8758c8`. Fields: 4; methods: 0; properties: 0.
Methods: none selected

## ModuleManager
Type #703, offset `0x875bc0`. Fields: 110; methods: 294; properties: 89.
Methods: `GetMaxSlotLevel`, `GetPrimarySlotLevel`, `GetAssistSlotLevel`, `GetSlotLevel`, `SetSlotLevel`, `GetSlotCoinsSpent`, `GetSlotShardsSpent`, `AddSlotSpend`, `ClearSlotSpend`, `TryGetEquippedSlot`, `GetEffectiveModuleLevel`, `GetEffectiveLevelForSlot`, `IsSlotRarityCapped`, `ResolveLevelUpSlot`, `ClearModuleLevelData`, `GetAllModuleItems`, `MigrateModuleLevelsToSlots`, `HasSlotLevelMigrationRefund`, `ShowSlotLevelMigrationPopupIfNeeded`, `Awake`, `Initialize`, `OnDestroy`, `GetModuleName`, `GetModuleUniqueDescription`, `GetModuleUniqueValue`, `GetEffectDescription`, `GetModuleIcon`, `GetShards`, `GetShardsIcon`, `TestInventory`, `TryBuyModuleFromBanner`, `TryBuyModuleBulkFromBanner`, `BuyModuleBulkFromBanner`, `SimulateBuyModuleFromBanner`, `ApplyModulePreset`, `SnapshotEquippedToPreset`, `ApplyPreset`, `FindInventoryModuleByGuid`, `FindModuleByGuid`, `IsEquippedInOtherPreset`, `EquipModule`, `UnequipModule`, `UnequipModule`, `HaveModuleOfRarityOrHigher`, `Unmerge`, `IsMergeValid`, `IsMergeValid`, `IsAtMaxRarity`, `CanBeMerged`, `IsSelectedToMerge`, `IsSelectedOrCanBeMerged`, `ClearMerge`, `SelectToMerge`, `RemoveFromMerge`, `Merge`, `Merge`, `CalculateAutoMerge`, `TryBossDrop`, `TryCarePackageDrop`, `GetCommonModuleDropChance`, `GetRareModuleDropChance`, `TryRerollShardsDrop`, `TryEliteRerollShardsDrop`, `GetShardsReward`, `GetNumberOfRerollShards`, `GetNumberOfFetchRerollShards`, `GetNumberOfModuleShardsForFleets`, `GetNumberOfRerollShardsForFleets`, `TryFleetsDrop`, `CreateModule`, `CreateModule`, `CreateModule`, `CreateModule`, `CreateModule`, `CreateModuleFromBanner`, `CreateModule`, `IsEquipped`, `IsEquipped`, `TryGetRarityIfEquipped`, `CalculateLevelUpUsingBuyMultiplier`, `CalculateLevelUpOnce`, `CalculateLevelUpToNextEffect`, `CalculateLevelUp`, `CalculateLevelUpMax`, `LevelUpToNextEffect`, `LevelUpMax`, `_levelUpToNewLevel`, `LevelUp`, `RestoreSlot`, `GetShatterUniqueModuleComponents`, `ShatterModule`, `HaveEmptyEffects`, `GetLockedSubstats`, `RollEmptyEffects`, `TryAddAvailableEffects`, `HasEffectsToReroll`, `RerollNotLockedEffects`, `DoRerollNotLockedEffects`, `GetSeedFromModuleIdentityAndRerollCount`, `GetAllStructurallyValidEffectIndicesForModuleType`, `RollDeterministicSubstatCandidate`, `RollEffectRarityFromRandomValue`, `GetRarityToTryForFallbackStep`, `IsCandidateAllowedAfterAllRerollFilters`, `IsClusterBannedForThisModuleType`, `CreateSeededRandomForAttempt`, `GetPotentialEffectsForModule`, `GetAllPotentialEffectsForModule`, `GetAllowedClustersForModule`, `AutoRollRunCheck`, `GetLevelUpShardsCost`, `GetLevelUpCoinsCost`, `GetRerollCost`, `GetBenefitIfEquipped`, `GetEquippedClusterBenefit`, `GetEquippedAssistClusterBenefit`, `GetModuleAfterMergeBenefit`, `GetModuleMainBenefit`, `GetModuleMainBenefit`, `GetCannonBaseBenefit`, `GetArmorBaseBenefit`, `GetGeneratorBaseBenefit`, `GetCoreBaseBenefit`, `GetCannonMainBenefit`, `GetArmorMainBenefit`, `GetGeneratorMainBenefit`, `GetCoreMainBenefit`, `GetModuleFrame`, `GetSubstatClusterType`, `GetSubstatName`, `GetMaxLevelPerRarity`, `GetEffectSlotRequiredLevel`, `GetEffectSlotMaxShownSlots`, `GetEffectMaxSlots`, `GetUniqueBenefit`, `IsNaturalEpicModule`, `GetShatterShards`, `GetUnmergeShards`, `TryGetUniqueBenefit`, `AddModuleTickets`, `SpendModuleTickets`, `LoadModuleTickets`, `RefreshTicketUI`, `GiveFreeTickets`, `GetMainEffectName`, `GetRarityName`, `GetRarityName`, `GetTypeName`, `GetMaxEffectRarity`, `GetMergeRequirement`, `CalculateAllIfRound`, `GetBannersFromConfig`, `StopActiveCoroutines`, `GetFeaturedBanners`, `GetRotatingBanners`, `GetBanners`, `ClearBannerCache`, `TryCreateBanner`, `ValidateBannerData`, `ReportBannerProblem`, `CheckBannerForAdjustedOdds`, `GetPossibleMergeCount`, `IsHighlighted`, `HasHighestAncestralCopy`, `HasHighestAncestral`, `GetHighestModuleLevelByType`, `GetCurrentBanner`, `FeaturedBannerDurationCheck`, `RotatingBannerDurationCheck`, `GetEarliestRotatingBanner`, `GetEarliestFeaturedBanner`, `GetEarliestBanner`, `GetAssistModuleUniqueEffectEfficiency`, `GetAssistModuleUniqueEffectEfficiencyString`, `GetAssistModuleUniqueEffectCost`, `GetPrimaryModuleBonus`, `GetAssistModuleMainEffectEfficiency`, `GetAssistModuleMainEffectEfficiency`, `GetAssistModuleMainEffectLevel`, `GetAssistModuleMainEffectCost`, `GetAssistModuleSubstatEfficiency`, `GetAssistModuleSubstatEfficiency`, `GetAssistModuleSubstatLevel`, `GetAssistModuleSubstatCost`, `UnlockCannonAssistModuleSlot`, `UnlockArmorAssistModuleSlot`, `UnlockGeneratorAssistModuleSlot`, `UnlockCoreAssistModuleSlot`, `IsEquippedAssist`, `IsEquippedAssist`, `EquipModuleAssist`, `UnequipModuleAssist`, `UnequipModuleAssist`, `IsEquippedOnPrimaryOrAssist`, `IsEquippedOnPrimaryOrAssist`, `RespecAssistModules`, `IsDisabledAssistSubstat`, `IsCappedAssistSubstatEffect`, `CorrectModuleSlotTypes`
Candidate decoded constants: `UNMERGE_COST = 20`, `PITY = 150`, `RARE_PITY = 10`, `INVENTORY_LIMIT = 350`, `MODULE_DROP_COOLDOWN = 5`, `MODULE_DROP_COOLDOWN_CHAMPION = 5`, `MODULE_HISTORY_LIMIT = 150`, `MAX_RARITY_DROP_ADJUSTMENT_MULTIPLIER = 0.25`, `ASSIST_MODULE_SLOT_UNLOCK_COST = 1000`, `ASSIST_MODULE_UNIQUE_EFFECT_EFFICIENCY_MAX_LEVEL = 3`, `ASSIST_MODULE_MAIN_EFFECT_EFFICIENCY_MAX_LEVEL = 99`, `ASSIST_MODULE_SUBSTAT_EFFICIENCY_MAX_LEVEL = 69`, `BEING_ANNIHILATOR_GUARANTEED_SUPER_CRITS = 5`, `TACTICAL_BARRAGE_MISSILE_LOCK_DELAY = 0.5`, `NUM_DEFINED_MODULES = 53`, `MODULE_BASE_PRESETS = 2`, `deterministicRollAttemptsPerSlot = 5000`

## ModuleItem
Type #704, offset `0x875c0c`. Fields: 12; methods: 26; properties: 12.
Methods: `GetInfo`

## ModuleInfo
Type #705, offset `0x875c58`. Fields: 4; methods: 0; properties: 0.
Methods: none selected

## ModuleEffect
Type #706, offset `0x875ca4`. Fields: 5; methods: 0; properties: 0.
Methods: none selected

## ModuleType
Type #708, offset `0x875d3c`. Fields: 5; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Cannon = 0`, `Armor = 1`, `Generator = 2`, `Core = 3`

## EffectRarity
Type #709, offset `0x875d88`. Fields: 7; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Common = 1`, `Rare = 2`, `Epic = 4`, `Legendary = 6`, `Mythic = 8`, `Ancestral = 10`

## ModuleRarity
Type #710, offset `0x875dd4`. Fields: 17; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `None = 0`, `Common = 1`, `Rare = 2`, `RarePlus = 3`, `Epic = 4`, `EpicPlus = 5`, `Legendary = 6`, `LegendaryPlus = 7`, `Mythic = 8`, `MythicPlus = 9`, `Ancestral = 10`, `Ancestral1 = 11`, `Ancestral2 = 12`, `Ancestral3 = 13`, `Ancestral4 = 14`, `Ancestral5 = 15`

## ModuleBenefitType
Type #711, offset `0x875e20`. Fields: 14; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Normal = 0`, `Add = 1`, `Add10 = 2`, `AddMult = 3`, `Multiply = 4`, `Percentage = 5`, `Percentage100 = 6`, `Subtract = 7`, `Time = 8`, `AddTime = 9`, `SubtractTime = 10`, `Meters = 11`, `Angle = 12`

## SubstatsClusterType
Type #712, offset `0x875e6c`. Fields: 5; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Attack = 0`, `Defense = 1`, `Utility = 2`, `Ultimate = 3`

## SubstatsCluster
Type #713, offset `0x875eb8`. Fields: 76; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `None = 0`, `Attack_Speed = 1`, `Critical_Chance = 2`, `Critical_Factor = 3`, `Attack_Range = 4`, `Attack_Per_Meter = 5`, `Multishot_Chance = 6`, `Multishot_Targets = 7`, `Rapid_Fire_Chance = 8`, `Rapid_Fire_Duration = 9`, `Bounce_Shot_Chance = 10`, `Bounce_Shot_Targets = 11`, `Bounce_Shot_Range = 12`, `Super_Critical_Chance = 13`, `Super_Critical_Factor = 14`, `Rend_Armor_Chance = 15`, `Rend_Armor_Mult = 16`, `Rend_Armor_Max = 17`, `Health_Regen = 18`, `Defense_Percent = 19`, `Defense_Absolute = 20`, `Thorn_Damage = 21`, `Lifesteal = 22`, `Knockback_Chance = 23`, `Knockback_Force = 24`, `Orb_Speed = 25`, `Orbs = 26`, `Shockwave_Size = 27`, `Shockwave_Frequency = 28`, `Land_Mine_Chance = 29`, `Land_Mine_Damage = 30`, `Land_Mine_Radius = 31`, `Death_Defy = 32`, `Wall_Health = 33`, `Wall_Rebuild = 34`, `Cash_Bonus = 35`, `Cash_Per_Wave = 36`, `Coins_Per_Kill = 37`, `Coins_Per_Wave = 38`, `Free_Attack_Upgrade = 39`, `Free_Defense_Upgrade = 40`, `Free_Utility_Upgrade = 41`, `Interest_Per_Wave = 42`, `Recovery_Amount = 43`, `Max_Recovery = 44`, `Package_Chance = 45`, `Enemy_Attack_Level_Skip = 46`, `Enemy_Health_Level_Skip = 47`, `Chain_Lightning_Damage = 48`, `Chain_Lightning_Quantity = 49`, `Chain_Lightning_Chance = 50`, `Smart_Missiles_Damage = 51`, `Smart_Missiles_Quantity = 52`, `Smart_Missiles_Cooldown = 53`, `Death_Wave_Damage = 54`, `Death_Wave_Quantity = 55`, `Death_Wave_Cooldown = 56`, `Chrono_Field_Duration = 57`, `Chrono_Field_Speed_Reduction = 58`, `Chrono_Field_Cooldown = 59`, `Inner_Land_Mines_Damage = 60`, `Inner_Land_Mines_Quantity = 61`, `Inner_Land_Mines_Cooldown = 62`, `Golden_Tower_Bonus = 63`, `Golden_Tower_Duration = 64`, `Golden_Tower_Cooldown = 65`, `Poison_Swamp_Damage = 66`, `Poison_Swamp_Duration = 67`, `Poison_Swamp_Cooldown = 68`, `Black_Hole_Size = 69`, `Black_Hole_Duration = 70`, `Black_Hole_Cooldown = 71`, `Spotlight_Bonus = 72`, `Spotlight_Angle = 73`, `Spotlight_Quantity = 74`

## ModuleRegistry
Type #714, offset `0x875f04`. Fields: 3; methods: 7; properties: 3.
Methods: none selected

## ModuleBanner
Type #715, offset `0x875f50`. Fields: 13; methods: 1; properties: 0.
Methods: none selected

## ModuleBannerModule
Type #716, offset `0x875f9c`. Fields: 4; methods: 1; properties: 0.
Methods: none selected

## ModulePresetData
Type #717, offset `0x875fe8`. Fields: 3; methods: 8; properties: 3.
Methods: `CreateDefault`

## ModulePresetsUI
Type #718, offset `0x876034`. Fields: 6; methods: 5; properties: 1.
Methods: `UpdateModulePresetsUI`, `Button_SelectPreset`, `Button_HoldPreset`

## ModuleRestoreAndMaxUI
Type #719, offset `0x876080`. Fields: 24; methods: 12; properties: 0.
Methods: `Start`, `OpenRestore`, `OpenRestoreSlot`, `OpenMax`, `OpenMaxSlot`, `OpenNextEffectLevelUp`, `OpenNextEffectLevelUpSlot`, `Close`, `ConfirmRestoreOrMax`

## ModuleShatterItem
Type #720, offset `0x8760cc`. Fields: 4; methods: 5; properties: 0.
Methods: `SetOnlyIfEmpty`, `Set`, `Unselect`, `OpenModuleDetails`

## Tab
Type #721, offset `0x876118`. Fields: 5; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Inventory = 0`, `Merge = 1`, `Shatter = 2`, `Assist = 3`

## ModuleUI
Type #738, offset `0x876624`. Fields: 253; methods: 120; properties: 7.
Methods: `Awake`, `Start`, `CheckRoundButton`, `EquippedClick`, `EquippedAssistClick`, `FilterTypeToggleOptions`, `FilterRarityToggleOptions`, `FilterTypeOpen`, `FilterTypeClose`, `FilterRarityOpen`, `FilterRarityClose`, `FilterTypeClick`, `FilterRarityClick`, `InfoClick`, `ShatterInfoClick`, `HistoryClick`, `PopulateModuleHistory`, `TryGiveFreeTickets`, `OpenInventoryClick`, `OpenMergeClick`, `OpenShatterClick`, `ToggleAutoShatter`, `ToggleAutoShatterRare`, `MergeSlotClick`, `MergeSlotShowDetails`, `AutoMergeClick`, `ConfirmMergeClick`, `StartMerge`, `ConfirmShatterClick`, `DoShatter`, `UpdateTicketObject`, `Open`, `Close`, `MergeOpen`, `ShatterOpen`, `AssistOpen`, `TryUnlockCannonAssistModuleSlot`, `TryUnlockArmorAssistModuleSlot`, `TryUnlockGeneratorAssistModuleSlot`, `TryUnlockCoreAssistModuleSlot`, `UpgradeCannonUniqueEffectEfficiency`, `UpgradeCannonMainEffectEfficiency`, `UpgradeCannonSubstatEfficiency`, `UpgradeArmorUniqueEffectEfficiency`, `UpgradeArmorMainEffectEfficiency`, `UpgradeArmorSubstatEfficiency`, `UpgradeGeneratorUniqueEffectEfficiency`, `UpgradeGeneratorMainEffectEfficiency`, `UpgradeGeneratorSubstatEfficiency`, `UpgradeCoreUniqueEffectEfficiency`, `UpgradeCoreMainEffectEfficiency`, `UpgradeCoreSubstatEfficiency`, `ViewAssistModuleInfoPanel`, `ClearShatter`, `IsRarityFilterOn`, `SortInventory`, `GetShatterableMaxRarity`, `UpdateInventoryItems`, `IsModuleOnShatterList`, `ToggleModuleToShatter`, `InventoryToTop`, `UpdateFiltersAndCounter`, `UpdateEquipped`, `UpdateShatter`, `UpdateMerge`, `ModuleDetailsOpen`, `ModuleDetailsClose`, `UpdateNewCounters`, `ShowBossDrop`, `RerollShardsDrop`, `ModuleShardsDrop`, `GetEffectBox`, `GetRarityColor`, `GetRarityColor`, `GetPastelRarityColor`, `BannersPanelOpen`, `ShowBannerPanel`, `RefreshBannersPanel`, `GetBannersKey`, `RenderBanners`, `GetFeaturedBannerBackground`, `RetryGetBanners`, `OnBannersPanelClosed`, `ModuleHighlightDetailPanelOpen`, `ModuleHighlightDetailPanelClose`, `Buy1FeaturedBanner`, `Buy10FeaturedBanner`, `Buy1RotatingBanner`, `Buy10RotatingBanner`, `FeaturedBannerUIUpdate`, `UpdateBannersBuyButtons`, `FeaturedBannerInfoPanelOpen`, `RotatingBannerInfoPanelOpen`, `BannerInfoPanelOpen`, `BannerInfoPanelClose`, `OnBannerInfoRarityHeaderClicked`, `OnBannerInfoTypeHeaderClicked`, `OnBannerInfoSearch`
Candidate decoded constants: `HOLD_TIMER = 0.300000012`, `DEFAULT_BANNER_TITLE_LOC = 2511`

## ModuleUniqueEffectUI
Type #739, offset `0x876670`. Fields: 9; methods: 5; properties: 0.
Methods: `Start`, `Open`, `Close`

## ModuleUnmergeUI
Type #740, offset `0x8766bc`. Fields: 8; methods: 5; properties: 0.
Methods: `Open`, `Close`, `ConfirmClick`

## BetaModuleConfig
Type #874, offset `0x878e84`. Fields: 3; methods: 7; properties: 3.
Methods: none selected

## BetaModule
Type #875, offset `0x878ed0`. Fields: 4; methods: 11; properties: 6.
Methods: none selected
