# Ultimate Weapons
Source: Assembly-CSharp.dll metadata v39. Types may appear in more than one domain. Names are not proof of runtime behavior.

70 type records. Full field, method and property records in `05_ultimate_weapons.json`.

## ChainLightning
Type #11, offset `0x868e50`. Fields: 12; methods: 17; properties: 1.
Methods: `GenerateLightningBolt`, `RandomVector`, `ResetLineRenderer`, `ClearRendererSafely`, `EnsureRendererEnabled`, `UpdateLineRenderer`, `Awake`, `StopSafe`, `Play`, `Play`, `DoUpdate`, `DoUpdate`, `Trigger`, `Trigger`, `OnDisable`

## ChainLightningPool
Type #12, offset `0x868e9c`. Fields: 6; methods: 10; properties: 0.
Methods: `Awake`, `Update`, `CanPlay`, `GetNextChainLightning`, `GetNextFree`, `Acquire`, `Play`, `Play`, `PlayPlus`

## BlackHole
Type #128, offset `0x86b10c`. Fields: 6; methods: 4; properties: 0.
Methods: `Awake`, `Play`, `Stop`

## BlackHoleController
Type #129, offset `0x86b158`. Fields: 12; methods: 16; properties: 3.
Methods: `Awake`, `Start`, `SetBlackHoleBrightness`, `Play`, `DoPlay`, `CheckTimer`, `UpdateMissionCount`, `BlackHolePlusDamage`, `ForceStop`, `OnDestroy`

## ChronoField
Type #187, offset `0x86c290`. Fields: 14; methods: 17; properties: 3.
Methods: `PlusModeEnabled`, `Start`, `SetChronoFieldBrightness`, `Play`, `CheckTimer`, `CalculateParticleSize`, `ForceStop`, `RequestSafeStopParticle`, `RequestSafeStopPlus`, `SafeStopAndClearParticle`, `SafeStopAndClearPlus`, `OnDestroy`
Candidate decoded constants: `FenceFrames = 3`

## Deathwave
Type #251, offset `0x86d590`. Fields: 3; methods: 2; properties: 0.
Methods: `Play`

## DeathwaveController
Type #253, offset `0x86d628`. Fields: 22; methods: 18; properties: 2.
Methods: `Start`, `Update`, `ResetEffectWaveTimer`, `Resume`, `Play`, `SetDeathWaveBrightness`, `ResetDeathwaveFinal`, `SetDeathwaveFinalSize`, `ForceStop`, `GetDeathWaveFinalTrailColor`, `UpdateTrailColor`, `FireEffectWave`, `ApplyDeathWaveEffects`, `FireDeathWave`, `OnDestroy`

## DeathwaveFinalWave
Type #254, offset `0x86d674`. Fields: 2; methods: 4; properties: 0.
Methods: `Play`, `FixedUpdate`, `Reset`

## DevPanelUltimateWeapons
Type #274, offset `0x86dc64`. Fields: 10; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `ChainLightning = 0`, `SmartMissiles = 1`, `DeathWave = 2`, `ChronoField = 3`, `InnerLandMines = 4`, `GoldenTower = 5`, `PoisonSwamp = 6`, `BlackHole = 7`, `Spotlight = 8`

## GoldenTower
Type #395, offset `0x870050`. Fields: 12; methods: 16; properties: 2.
Methods: `Play`, `DoPlay`, `CheckTimer`, `RefreshGoldenTowerVFX`, `IsGoldenTowerVFXEnabled`, `ApplyGoldenTowerVFX`, `ForceStop`, `HandleGoldenTowerPlusReward`

## UltimateWeaponVFXToggleType
Type #507, offset `0x872190`. Fields: 7; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `BrighterSpotlight = 9`, `DeathWave = 10`, `ChronoField = 11`, `InnerLandMines = 12`, `PoisonSwamp = 13`, `BlackHole = 14`

## UltimateWeaponID
Type #516, offset `0x87243c`. Fields: 11; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `None = -1`, `ChainLightning = 0`, `SmartMissile = 1`, `DeathWave = 2`, `ChronoField = 3`, `InnerLandMines = 4`, `GoldenTower = 5`, `PoisonSwamp = 6`, `BlackHole = 7`, `Spotlight = 8`

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

## SmartMissile
Type #904, offset `0x87976c`. Fields: 24; methods: 13; properties: 1.
Methods: `OnEnable`, `SetMissileVisibility`, `EnemyDetected`, `Explode`, `Timeout`, `Deactivate`, `Spawn`, `SpawnWithTarget`, `SetTargetAfterDelay`, `MissileMovement`, `OnDisable`

## SmartMissileType
Type #905, offset `0x8797b8`. Fields: 5; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `UltimateWeapon = 0`, `UltimateWeaponPlus = 1`, `Barrage = 2`, `TacticalBarrage = 3`

## SmartMissileController
Type #907, offset `0x879850`. Fields: 13; methods: 13; properties: 0.
Methods: `Awake`, `Start`, `EnsureVisualExplosionPool`, `PlayVisualExplosion`, `MissilesMovement`, `Play`, `PlayPlus`, `PlayBarrage`, `DoPlay`, `DeactivateAll`, `TacticalBarrageFireMissileAt`, `SendAllActiveMissilesAt`

## SmartMissileExplosion
Type #909, offset `0x8798e8`. Fields: 5; methods: 7; properties: 1.
Methods: `Start`, `SetParticleAlpha`, `Explode`, `DisableCollider`, `OnDestroy`

## SpotMissile
Type #920, offset `0x879c2c`. Fields: 10; methods: 6; properties: 1.
Methods: `Update`, `Explode`, `Spawn`, `LookAt2D`

## SpotMissileController
Type #921, offset `0x879c78`. Fields: 9; methods: 9; properties: 0.
Methods: `Start`, `EnsureVisualExplosionPool`, `PlayVisualExplosion`, `Update`, `Play`, `GetTargetPosition`, `RefreshCooldown`, `GetMissileFlightTime`

## Spotlight
Type #922, offset `0x879cc4`. Fields: 16; methods: 17; properties: 6.
Methods: `Awake`, `Start`, `Update`, `Set`, `TrackBoss`, `BossDied`, `ResetBossTrack`

## Swamp
Type #945, offset `0x87a398`. Fields: 5; methods: 7; properties: 1.
Methods: `Activate`, `DespawnAnim`, `Deactivate`, `GetRadius`, `SetMaterial`

## SwampController
Type #946, offset `0x87a3e4`. Fields: 10; methods: 11; properties: 1.
Methods: `Awake`, `Start`, `OnDestroy`, `SetSwampBrightness`, `UpdateSpeed`, `DeactivateAll`, `Play`, `CheckTimers`

## UltimateWeaponDescriptionPanel
Type #1084, offset `0x87ccdc`. Fields: 30; methods: 21; properties: 2.
Methods: `Awake`, `Open`, `UpdateStats`, `UpdateStatValue`, `BeginLabEnhancements`, `EndLabEnhancements`, `AddLabEnhancement`, `AddLabEnhancement`, `AddSubstatLabEnhancement`, `SubstatLabel`, `_updateEnhancementEntry`, `GetSwampRendEnemies`, `OpenPlus`, `OnLevelSliderChanged`, `GetBlackHoleSizeValue`, `Close`

## UltimateWeaponPreviewPanel
Type #1085, offset `0x87cd28`. Fields: 14; methods: 9; properties: 2.
Methods: `Awake`, `Open`, `ShowVideoOnFirstFrame`, `Unlock`, `Close`

## UltimateWeaponStats
Type #1086, offset `0x87cd74`. Fields: 12; methods: 1; properties: 0.
Methods: none selected

## UltimateWeaponPlusStats
Type #1087, offset `0x87cdc0`. Fields: 10; methods: 1; properties: 0.
Methods: none selected

## WeaponChoice
Type #1111, offset `0x87d4e0`. Fields: 18; methods: 9; properties: 0.
Methods: `SetChoices`, `SelectChoice1`, `SelectChoice2`, `SelectChoice3`, `OpenUltimateDesc1`, `OpenUltimateDesc2`, `OpenUltimateDesc3`, `weaponChoicePanelClose`
