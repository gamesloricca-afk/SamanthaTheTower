# Combat Mechanics
Source: Assembly-CSharp.dll metadata v39. Types may appear in more than one domain. Names are not proof of runtime behavior.

79 type records. Full field, method and property records in `04_combat_mechanics.json`.

## ActiveStatsTracker
Type #78, offset `0x86a234`. Fields: 15; methods: 16; properties: 1.
Methods: `Initialize`, `UpdateStat`, `UpdateStatQueue`, `UpdateEarningAverages`, `PeekBackElement`, `ResetBossStats`, `TryTrackBossStats`, `GetBossHistoryCount`, `GetBossDamageDataByHistoryIndex`, `GetBossEntryByHistoryIndex`, `AddNewBossDamageEntry`, `GetCurrentBossDamageEntry`, `GetOrCreateEntryForBoss`, `CreateEmptyBossDamageList`
Candidate decoded constants: `MAX_AVERAGING_QUEUE_SIZE = 300`, `MAX_BOSS_DAMAGE_HISTORY = 10`, `BOSS_DAMAGE_SOURCE_COUNT = 28`, `TRACKER_INTERVAL = 1`

## DeathRay
Type #249, offset `0x86d4f8`. Fields: 5; methods: 11; properties: 0.
Methods: `Awake`, `Play`, `Stop`, `ForceStop`

## DeathRayController
Type #250, offset `0x86d544`. Fields: 3; methods: 5; properties: 0.
Methods: `Update`, `Play`, `Stop`, `ForceStop`

## DamageReductionResult
Type #309, offset `0x86e6c8`. Fields: 11; methods: 0; properties: 0.
Methods: none selected

## Enemy
Type #314, offset `0x86e844`. Fields: 215; methods: 117; properties: 16.
Methods: `Awake`, `EnemyMovement`, `UpdateUltimateFastLinkedEnemies`, `CheckSpotlight`, `EnemyUpdate`, `GetEstimatedFuturePosition`, `GetCurrentOverchargeAttackInterval`, `GetCurrentCommanderBuffInterval`, `GetCurrentSaboteurAttackInterval`, `ApplyTitanShock`, `GetTitanShockReduction`, `AddKnockback`, `Attack`, `CalculateDamageReductionResult`, `ApplyDamageReductionStats`, `RangedAttack`, `VampireAttack`, `ApplyRayShotHit`, `SaboteurAttack`, `CommanderBuffArea`, `OverchargeAttack`, `ProjectileDamage`, `ApplyProjectileDamage`, `TotalLightshotDamage`, `GetDiminishedNumberOfLevelReductions`, `ThornDamage`, `ElectronDamage`, `OrbDamage`, `EnergyNetDamage`, `DeathRayDamage`, `SmartMissilesDamage`, `ApplySmartMissilesDamage`, `DropLandMineDamage`, `InnerLandMineDamage`, `ApplyILMDamage`, `DeathwaveFinalDamage`, `BlackHoleDamage`, `BlackHolePlusDamage`, `FlameBotDamage`, `SwampDamage`, `LightningDamage`, `LightningPlusDamage`, `GuardianAttackDamage`, `AttackWall`, `MarkForDeath`, `HitMultiplier`, `RenderArmorMultiplier`, `Kill`, `GoldenTowerBonus`, `CoinBotBonus`, `EnemyBalanceBonus`, `BlackHoleCoinBonus`, `OrbCoinBonus`, `BountyCoinBonus`, `SpotlightCoinBonus`, `DeathWaveCoinBonus`, `DeathWaveCellBonus`, `LivedWavesCoins`, `HandleScatterBossDeath`, `KillExplosionPrefab`, `PrewarmKillExplosionPools`, `KillParticleExplosion`, `KillExplosionPoolSize`, `PlayKillExplosion`, `HitTextAnimation`, `StopAlphaPulse`, `HitTextAnimation`, `KillTextAnimation`, `TextAnimationRenderMultiplier`, `TrySpawnLandMine`, `Spawn`, `Activate`, `RequestSafeDeactivate`, `CoSafeDeactivate`, `Deactivate`, `GetEnemyBaseDamage`, `GetEnemyBaseHealth`, `GetEnemyBaseSpeed`, `GetEnemyBaseMass`, `TurnIntoAlly`, `GoldenTowerCheck`, `MatchesTargetPriority`, `OnEachWave`, `OnCollisionEnter2D`, `OnTriggerEnter2D`, `CountCrowdControl`, `ApplyStun`, `OnTriggerExit2D`, `GetFlameBotDamageReduction`, `GetThunderBotLinger`, `GetGoldenBotBonus`, `GetAmplifyBotBonus`, `GetWildfireAmplification`, `GetTitanShockAttackSpeedSlow`, `GetBonusCellsBonus`, `GetEchoingShotBonus`, `GetEchoingShotUltimateHitCount`, `RegisterSmartMissileStackHits`, `OrbHit`
Candidate decoded constants: `RAY_SHOT_COOLDOWN = 30`, `MELEE_ATTACK_RANGE = 0.300000012`, `SCATTER_SPLITS = 4`, `SCATTER_SPLITS_ULTIMATE = 5`, `NEAR_WALL_SPEED_LIMIT = 4.5`, `BASIC_SIZE = 0.222000003`, `FAST_SIZE = 0.222000003`, `TANK_SIZE = 0.400000006`, `BOSS_SIZE = 0.75999999`, `RANGED_SIZE = 0.222000003`, `PROTECTOR_SIZE = 0.222000003`, `VAMPIRE_SIZE = 0.550000012`, `SCATTER_SIZE = 0.550000012`, `RAY_SIZE = 0.550000012`, `SABOTEUR_SIZE = 0.550000012`, `COMMANDER_SIZE = 0.550000012`, `OVERCHARGE_SIZE = 0.550000012`, `SABOTEUR_BASE_ATTACK_INTERVAL = 5`, `SABOTEUR_MAX_ATTACK_INTERVAL = 1`, `SABOTEUR_MAX_ATTACK_SPEED_AT_WAVE = 4000`, `COMMANDER_HEALTH_BUFF = 1.14999998`, `COMMANDER_MASS_BUFF = 1.14999998`, `COMMANDER_SPEED_BUFF = 1.14999998`, `COMMANDER_BUFF_DURATION = 0.5`, `COMMANDER_BUFF_PULSE_SCALE = 4`, `COMMANDER_BUFF_SPEED_MASS_MAX = 8`, `COMMANDER_BUFF_BASE_INTERVAL = 10`, `COMMANDER_BUFF_MAX_INTERVAL = 2`, `COMMANDER_BUFF_MAX_INTERVAL_AT_WAVE = 4000`, `COMMANDER_BUFF_RADIUS_BASE_SCALE = 0.959999979`, `OVERCHARGE_CHARGE_DURATION = 3`, `OVERCHARGE_BASE_ATTACK_INTERVAL = 15`, `OVERCHARGE_MAX_ATTACK_INTERVAL = 1`, `OVERCHARGE_MAX_ATTACK_SPEED_AT_WAVE = 4000`, `OVERCHARGE_ATTACK_EXPONENT_BASE = 1.39999998`, `SPEED_ADJUSTER = 0.409999996`, `MISS_DECAY = 0.875`, `STUN_DECAY = 0.995000005`, `DEATH_DEFY_DECAY = 0.899999976`, `PULSAR_HARVESTER_DIMINISHED_RETURNS_MIN = 100`, `PULSAR_HARVESTER_DIMINISHED_RETURNS_MAX = 400`, `PULSAR_HARVESTER_DIMINISHED_RETURNS_CONSTANT = 1500`, `PULSAR_HARVESTER_MAX_PROCS = 399`

## TargetPriorityIndexPositions
Type #514, offset `0x8723a4`. Fields: 11; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Closest = 0`, `Basic = 1`, `Fast = 2`, `Tank = 3`, `Ranged = 4`, `Boss = 5`, `Spotlight = 6`, `Protector = 7`, `Elites = 8`, `Fleets = 9`

## LandMine
Type #539, offset `0x872b10`. Fields: 23; methods: 17; properties: 2.
Methods: `Awake`, `SetExplosionRadius`, `SetColor`, `UpdateTimer`, `Activate`, `ActivateModuleLandmine`, `Deactivate`, `Explode`, `DoExplode`, `SetTarget`, `DoMoveToTarget`, `ChronoJump`

## MineType
Type #540, offset `0x872b5c`. Fields: 5; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Ultimate = 0`, `EnemyDrop = 1`, `ExtraSet = 2`, `MagneticMine = 3`

## LandMineController
Type #542, offset `0x872bf4`. Fields: 16; methods: 16; properties: 2.
Methods: `Awake`, `Start`, `GetILMColor`, `SetILMBrightness`, `FixedUpdate`, `CheckTimers`, `DeactivateAll`, `FindNextAvailableIndex`, `SpawnMagneticMine`, `Play`, `HasActiveLandMine`, `OnDestroy`
Candidate decoded constants: `MAX_MODULE_LANDMINES = 20`

## LifeSaverType
Type #551, offset `0x872ea0`. Fields: 7; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `DeathDefy = 0`, `EnergyShield = 1`, `SecondWind = 2`, `DemonMode = 3`, `Nuke = 4`, `Bastion = 5`

## LifeSavingOrderingPanel
Type #553, offset `0x872f38`. Fields: 4; methods: 13; properties: 2.
Methods: `Awake`, `Open`, `_checkSmartToggles`, `Close`, `ApplySavedOrder`, `HandleTileDropped`, `UpdateOrderNumbers`, `CompareBySiblingIndex`, `FindTile`

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

## Projectile
Type #789, offset `0x877548`. Fields: 11; methods: 10; properties: 0.
Methods: `OnEnable`, `ProjectileMovement`, `OnTriggerEnter2D`, `ProjectileHit`, `OrbProjectileHit`, `Activate`, `Deactivate`, `RequestSafeDeactivate`, `CoSafeDeactivate`
Candidate decoded constants: `BASE_SPEED = 2.5`

## ProjectileType
Type #790, offset `0x877594`. Fields: 3; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Tower = 0`, `Orb = 1`

## Shock
Type #896, offset `0x87950c`. Fields: 1; methods: 2; properties: 0.
Methods: `Update`

## ShockManager
Type #897, offset `0x879558`. Fields: 2; methods: 3; properties: 0.
Methods: `Awake`, `Play`

## Shockwave
Type #898, offset `0x8795a4`. Fields: 3; methods: 5; properties: 0.
Methods: `Awake`, `Start`, `Update`, `FixedUpdate`

## StatsValueCalculator
Type #927, offset `0x879e40`. Fields: 0; methods: 8; properties: 0.
Methods: `GetStatValue`, `GetStatValue`, `GetCurrentRoundValue`, `GetBattleHistoryValue`, `GetNumericStatValue`, `GetCurrentRoundNumericValue`, `GetBattleHistoryNumericValue`, `GetTierValue`

## TowerBuddy
Type #1030, offset `0x87bcd4`. Fields: 61; methods: 68; properties: 6.
Methods: `Awake`, `Initialize`, `GetCooldownTimers`, `SetCooldownTimers`, `StartLazyMovement`, `StopLazyMovement`, `UpdateAbilityTimers`, `AbilityRoutine`, `TryActivateOnRoundStart`, `SpawnAllyRecoveryPackage`, `OnRoundStart`, `UpdateBuddySkin`, `OnRoundEnd`, `TriggerSummon`, `CreateSummonPortal`, `ResumeSummonIfActive`, `AllyStarted`, `StartAllyEffect`, `AttachAllyEffects`, `RushStarted`, `RushEnded`, `ScoutStarted`, `ScoutEnded`, `ScareStarted`, `ScareEnded`, `AttachScareEffects`, `TriggerSteal`, `DOSteal`, `PlayStealEffect`, `TriggerAttack`, `StartAttackEffect`, `PlayAttackEffect`, `TryCatch`, `PlayCatchEffect`, `TriggerRepair`, `PlayRepairHealEffect`, `PlayRepairWallTint`, `TriggerFetch`, `FetchSequence`, `CleanupOldRewards`, `GetTotalGemsInLast24Hours`, `GetTotalMedalsInLast24Hours`, `GetTotalRareModulesInLast24Hours`, `GetTotalCommonModulesInLast24Hours`, `GiveFetchCoinsReward`, `GiveFetchReward`, `GiveCommonModuleReward`, `GiveRareModuleReward`, `PlayFetchFailEffect`, `CleanupFailEffect`, `GetAttackEnemiesInRange`, `GetEnemiesInRange`, `GetStealEnemiesInRange`, `GetAllyEnemiesInRange`, `GuardianRespec`, `FreeGuardianRespec`, `ClearActiveGuardianChipLoadout`
Candidate decoded constants: `MAX_MEDAL_FETCHES_PER_DAY = 10`, `MAX_GEM_FETCHES_PER_DAY = 20`, `MAX_COMMON_MODULE_FETCHES_PER_DAY = 5`, `MAX_RARE_MODULE_FETCHES_PER_DAY = 2`, `GUARDIANS_COUNT = 10`
