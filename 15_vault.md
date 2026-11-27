# Vault
Source: Assembly-CSharp.dll metadata v39. Types may appear in more than one domain. Names are not proof of runtime behavior.

59 type records. Full field, method and property records in `15_vault.json`.

## VaultID
Type #517, offset `0x872488`. Fields: 123; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `None = 0`, `Damage = 1`, `AttackSpeed = 10`, `CritChance = 20`, `CritFactor = 30`, `DamagePerMeter = 40`, `MultishotChance = 50`, `RapidFireChance = 60`, `BounceShotChance = 70`, `SuperCritChance = 80`, `SuperCritMultiplier = 90`, `RendArmorChance = 100`, `RendArmorMultiplier = 110`, `Health = 200`, `HealthRegen = 210`, `DefensePercent = 220`, `DefenseAbsolute = 230`, `ThornDamage = 240`, `KnockbackChance = 250`, `KnockbackForce = 260`, `OrbSpeed = 270`, `OrbsCount = 280`, `ShockwaveSize = 290`, `ShockwaveFrequency = 300`, `DeathDefyChance = 310`, `WallHealth = 320`, `WallRebuild = 330`, `Cash = 400`, `CashPerWave = 410`, `CoinsPerKill = 420`, `CoinsPerWave = 430`, `FreeAttackUpgrade = 440`, `FreeDefenseUpgrade = 450`, `FreeUtilityUpgrade = 460`, `InterestPerWave = 470`, `RecoveryAmount = 480`, `MaxRecovery = 490`, `EnemyAttackSkip = 500`, `EnemyHealthSkip = 510`, `UltimateDamage = 600`, `ChainLightningDamage = 610`, `SmartMissileDamage = 620`, `DeathWaveDamage = 630`, `InnerLandMinesDamage = 640`, `GoldenTowerBonus = 650`, `PoisonSwampDamage = 660`, `SpotlightBonus = 670`, `BlackHoleSize = 680`, `AutoRestartRun = 1000`, `AdGemsStacking = 1010`, `DamageCapSlider = 1020`, `GlobalPresets = 1030`, `AdditionalCardSlot = 1200`, `AutoChargeBerzerker = 1210`, `DemonModeAuto = 1220`, `DemonModeSmart = 1230`, `NukeAuto = 1240`, `NukeSmart = 1250`, `DeathRayToggle = 1260`, `SpawnAcceleratorToggle = 1270`, `LifeSavingOrdering = 1280`, `EnergyShieldRestriction = 1290`, `BastionAuto = 1300`, `BastionSmart = 1310`, `EliteBalanceToggle = 1320`, `MissileBarrageAuto = 1400`, `MissileBarrageSmart = 1410`, `BlackHoleSizeSlider = 1420`, `SwampRangeSlider = 1430`, `AutoShatterRare = 1600`, `SetDailyShardType = 1610`, `FreeMissionReroll = 1620`, `ModuleRerollDiscount = 1630`, `ModulePresets = 1640`, `BotRespecDiscount = 1800`, `BotPresets = 1805`, `BotRange = 1810`, `BotCooldownSliders = 1820`, `WorkshopRespecDiscount = 2000`, `WorkshopPresets = 2005`, `EnhancementsDiscount = 2010`, `WorkshopOrbAdjuster = 2020`, `GuardianRespecDiscount = 2200`, `GuardianPresets = 2205`, `BasicAttack = 3000`, `BasicHealth = 3010`, `BasicCoinBonus = 3020`, `FastAttack = 3100`, `FastHealth = 3110`, `FastSpeed = 3120`, `TankAttack = 3200`, `TankHealth = 3210`, `TankMass = 3220`, `BossAttack = 4000`, `BossHealth = 4010`, `BossCommonModuleDropChance = 4020`, `RangedAttack = 4100`, `RangedHealth = 4110`, `RangedRangeDistance = 4120`, `ProtectorAttack = 4200`, `ProtectorHealth = 4210`, `ProtectorRadius = 4220`, `VampireAttack = 5000`, `VampireHealth = 5010`, `VampireAttackSpeed = 5020`, `ScatterAttack = 5100`, `ScatterHealth = 5110`, `ScatterAttackSpeed = 5120`, `RayAttack = 5200`, `RayHealth = 5210`, `RayAttackSpeed = 5220`, `SaboteurAttackSpeed = 6000`, `SaboteurHealth = 6010`, `SaboteurMissChance = 6020`, `CommanderPulseEffect = 6100`, `CommanderHealth = 6110`, `CommanderPulseSpeed = 6120`, `OverchargeAttack = 6200`, `OverchargeHealth = 6210`, `OverchargeAttackExponent = 6220`, `PowerTreeTier2 = 6221`, `PowerTreeTier3 = 6222`

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

## TechTreeManager
Type #963, offset `0x87a8f0`. Fields: 21; methods: 16; properties: 1.
Methods: `Awake`, `OnDestroy`, `Initialize`, `GetTechTreeBenefit`, `InitializeHarmonyTreeNodeData`, `InitializePowerTreeNodeData`, `IncreasePowerTreeTier`, `ResetTechTree`, `ResetAllWorkshopPresets`, `UnequipAllTechTreeCardSlots`, `GetExtraCardSlots`, `v26UnequipExtraTechTreeCardSlots`, `UpdateLocalizations`
Candidate decoded constants: `POWER_TREE_NODE_COUNT = 46`, `HARMONY_TREE_NODE_COUNT = 48`, `WORKSHOP_PRESETS_NODE_INDEX = 18`, `BOT_PRESETS_NODE_INDEX = 47`, `DEMON_MODE_AUTO_NODE_INDEX = 3`, `NUKE_AUTO_NODE_INDEX = 7`, `MISSILE_BARRAGE_AUTO_NODE_INDEX = 24`, `AUTO_RESTART_RUN_NODE_INDEX = 33`

## TechTreeNodePosition
Type #964, offset `0x87a93c`. Fields: 4; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Left = 0`, `Middle = 1`, `Right = 2`

## TechTreeType
Type #965, offset `0x87a988`. Fields: 3; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Tower = 0`, `Utility = 1`

## TechTreeNodeData
Type #967, offset `0x87aa20`. Fields: 17; methods: 3; properties: 1.
Methods: `UpdateLocalization`

## TechTreeNodeUI
Type #968, offset `0x87aa6c`. Fields: 24; methods: 10; properties: 0.
Methods: `SetupNodeUI`, `SetBottomCenterAnchor`, `SetupNodeLines`, `UpdateNodeUI`, `UpdateLinesActiveUI`, `ActivateNodeLine`, `ResetAllActiveLineAnimations`, `AnimateLineActive`, `Button_OnTap`
Candidate decoded constants: `BaseXPositionLeft = -320`, `BaseXPositionRight = 320`, `BaseXPositionMiddle = 0`, `HeightIncrement = 400`, `BaseYPosition = 200`, `horizontalLength = 225`, `horizontalLengthNeighbor = 127.5`, `childOutsideVerticalLength = 302.5`, `childInsideVerticalLength = 207.5`

## TechTreeUI
Type #971, offset `0x87ab50`. Fields: 22; methods: 12; properties: 1.
Methods: `InitializePowerTechTree`, `InitializeHarmonyTechTree`, `UpdateTechTreeUI`, `FixTopBarLayout`, `Initialize`, `Button_PowerTreeTab`, `Button_HarmonyTreeTab`, `Button_BuyLevel`, `Button_BuySelectedNode`, `UpdateChildrenOfSelectedNode`

## VaultEnemyTile
Type #1092, offset `0x87cf3c`. Fields: 5; methods: 3; properties: 0.
Methods: `Set`, `GetEnemyIcon`

## VaultGroupTitle
Type #1093, offset `0x87cf88`. Fields: 3; methods: 2; properties: 0.
Methods: `Set`

## VaultGroupUnlock
Type #1094, offset `0x87cfd4`. Fields: 5; methods: 4; properties: 0.
Methods: `Set`, `OnClick`

## VaultHarmonyTile
Type #1095, offset `0x87d020`. Fields: 14; methods: 3; properties: 0.
Methods: `Set`, `OnClick`
Candidate decoded constants: `DEPENDENCY_FRAME_LEFT = 80`

## VaultRespecWindow
Type #1096, offset `0x87d06c`. Fields: 5; methods: 4; properties: 0.
Methods: `Open`, `UpdateUI`, `Button_Confirm`

## VaultSimpleTile
Type #1097, offset `0x87d0b8`. Fields: 9; methods: 3; properties: 0.
Methods: `Set`, `OnClick`

## SubPanelType
Type #1098, offset `0x87d104`. Fields: 5; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `None = -1`, `Harmony = 0`, `Power = 1`, `Enemy = 2`

## VaultUI
Type #1099, offset `0x87d150`. Fields: 32; methods: 25; properties: 2.
Methods: `Awake`, `Open`, `Close`, `SelectPanel`, `SelectPanel`, `Refresh`, `UpdateHarmonyPanel`, `UpdatePowerPanel`, `UpdateEnemyPanel`, `ShowUpgradeDetails`, `ShowRespecWindow`, `SelectPowerAttackGroup`, `SelectPowerDefenseGroup`, `SelectPowerUtilityGroup`, `SelectPowerUltimateGroup`, `GetPooledInstance`, `UpdateBottomButtonVisuals`, `DeactivatePoolExtras`

## VaultUpgradeWindow
Type #1100, offset `0x87d19c`. Fields: 20; methods: 9; properties: 0.
Methods: `Open`, `Open`, `Close`, `OnLevelChanged`, `UpdateStaticUI`, `UpdateUI`, `OnUpgradeButtonClicked`, `JoinRequirements`

## VaultConfig
Type #1101, offset `0x87d1e8`. Fields: 12; methods: 13; properties: 12.
Methods: none selected

## VaultGroup
Type #1102, offset `0x87d234`. Fields: 17; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `None = 0`, `Harmony_Gameplay = 100`, `Harmony_Cards = 110`, `Harmony_Ultimate = 120`, `Harmony_Modules = 130`, `Harmony_Bots = 140`, `Harmony_Workshop = 150`, `Harmony_Guardian = 160`, `Power_Attack = 1000`, `Power_Defense = 1010`, `Power_Utility = 1020`, `Power_Ultimate = 1030`, `Enemy_Simple = 2000`, `Enemy_Advanced = 2010`, `Enemy_Elite = 2020`, `Enemy_Fleets = 2030`

## VaultGroupData
Type #1103, offset `0x87d280`. Fields: 5; methods: 6; properties: 5.
Methods: none selected

## VaultLevel
Type #1104, offset `0x87d2cc`. Fields: 2; methods: 0; properties: 0.
Methods: none selected

## VaultManager
Type #1105, offset `0x87d318`. Fields: 11; methods: 53; properties: 12.
Methods: `LoadConfig`, `UnlockFreeGroups`, `IsGroupUnlocked`, `IsGroupLocked`, `GetGroupRequirements`, `HasAnyUpgradeBoughtInGroup`, `HasAnyEnemyUpgradeBought`, `CanUnlockGroup`, `TryUnlockGroup`, `GetGroupData`, `GetGroupForId`, `GetUpgradeLevel`, `IsUpgradeMaxLevel`, `CanBuyUpgradeLevel`, `CanBulkBuyUpgradeLevels`, `IsUpgradeLocked`, `IsUpgradeLocked`, `TryBuyUpgradeLevel`, `TryBulkBuyUpgradeLevels`, `GetUpgradeData`, `GetBenefit`, `TryGetBenefit`, `ApplyBenefitType`, `TryGetNextLevelKeyCost`, `GetBulkLevelKeyCost`, `GetPlayerProgressToSave`, `LoadPlayerProgress`, `GrantFreeRespec`, `AddFreeRespecs`, `ClearRespecCooldown`, `TryRespecVault`, `RespecVault`, `GetOwnedNodes`, `GetTotalKeysWorthOfProgress`
Candidate decoded constants: `DEFAULT_RESPEC_COOLDOWN_WEEKS = 4`, `DEFAULT_RESPEC_COST = 500`

## VaultPlayerProgress
Type #1106, offset `0x87d364`. Fields: 5; methods: 11; properties: 5.
Methods: none selected

## VaultUpgradeData
Type #1107, offset `0x87d3b0`. Fields: 10; methods: 16; properties: 10.
Methods: `GetLevelData`, `GetBenefit`, `GetBenefitString`, `GetKeyCost`, `GetDescription`
