# Mechanism evidence map
Every item below is a declaration observed in the uploaded binary, not a reconstructed implementation. Offsets are absolute decimal/hex byte positions.

## Enemy behavior
Separate movement, attacks, state tracking and reduction routines exist; precise execution order and stacking are not recoverable here.
- `Enemy.EnemyMovement` — offset `0x3012ee`
- `Enemy.EnemyUpdate` — offset `0x301348`
- `Enemy.Attack` — offset `0x301438`
- `Enemy.RangedAttack` — offset `0x301492`
- `Enemy.VampireAttack` — offset `0x3014b0`
- `Enemy.SaboteurAttack` — offset `0x3014ec`
- `Enemy.CommanderBuffArea` — offset `0x30150a`
- `Enemy.OverchargeAttack` — offset `0x301528`
- `Enemy.GetCurrentOverchargeAttackInterval` — offset `0x301384`
- `Enemy.GetCurrentCommanderBuffInterval` — offset `0x3013a2`
- `Enemy.GetCurrentSaboteurAttackInterval` — offset `0x3013c0`
- `Enemy.UpdateUltimateFastLinkedEnemies` — offset `0x30130c`
- `Enemy.inProtector` — offset `0x710334`
- `Enemy.inBlackHole` — offset `0x71028a`
- `Enemy.blackHoleTime` — offset `0x7102a8`
- `Enemy.shockStack` — offset `0x71014a`
- `Enemy.burnStack` — offset `0x71017c`
- `Enemy.poisonCount` — offset `0x71026c`
- `Enemy.stunTime` — offset `0x710280`
- `Enemy.flameBotDamageReduction` — offset `0x710316`
- `Enemy.boostedFlameBotDamageReduction` — offset `0x710320`
- `Enemy.thunderDamageReduction` — offset `0x7103b6`
- `Enemy.CalculateDamageReductionResult` — offset `0x301456`
- `Enemy.ApplyDamageReductionStats` — offset `0x301474`

## UW interactions
Enemy-level handlers expose multiple economy and combat effects; this is evidence for separate named mechanisms, not proof they multiply or trigger together.
- `Enemy.GoldenTowerBonus` — offset `0x301870`
- `Enemy.BlackHoleCoinBonus` — offset `0x3018ca`
- `Enemy.DeathWaveCoinBonus` — offset `0x301942`
- `Enemy.DeathWaveCellBonus` — offset `0x301960`
- `Enemy.SpotlightCoinBonus` — offset `0x301924`
- `Enemy.OrbCoinBonus` — offset `0x3018e8`
- `Enemy.BountyCoinBonus` — offset `0x301906`
- `Enemy.BlackHoleDamage` — offset `0x301708`
- `Enemy.BlackHolePlusDamage` — offset `0x301726`
- `Enemy.DeathwaveFinalDamage` — offset `0x3016ea`
- `Enemy.markedByDeathwave` — offset `0x710366`
- `Enemy.deathwaveEnemyAmplifier` — offset `0x710370`
- `Enemy.spawnedDuringGoldenTower` — offset `0x71038e`
- `Enemy.inBlackHolePlus` — offset `0x7102da`

## UW cooldown and sync
Dedicated MVN and cooldown functions exist. Arithmetic, package RNG, banked activations and exact pBH thresholds require method bodies.
- `Main.GetAverageUltimateCooldownMultiverseNexus` — offset `0x31140a`
- `Main.GetBlackHoleDuration` — offset `0x312472`
- `Main.GetBlackHoleCooldown` — offset `0x312490`
- `Main.GetGoldenTowerCooldown` — offset `0x3123be`
- `Main.GetDeathwaveCooldown` — offset `0x3122b0`
- `Main.GetGoldenTowerDuration` — offset `0x3123a0`
- `Main.ApplyRecoveryPackage` — offset `0x313624`
- `Main.SpawnRecoveryPackage` — offset `0x3119c8`

## Black Hole lifecycle
Two group identifiers and timer state are visible. No conclusion about banked activations or simultaneous group behavior follows solely from names.
- `BlackHoleController.get_Active` — offset `0x2f6b96`
- `BlackHoleController.get_Duration` — offset `0x2f6bd2`
- `BlackHoleController.timer` — offset `0x70b924`
- `BlackHoleController.activeTimer` — offset `0x70b92e`
- `BlackHoleController.blackHoleAlreadyActive` — offset `0x70b938`
- `BlackHoleController.usingSecondGroup` — offset `0x70b942`
- `BlackHoleController.blackHoles2` — offset `0x70b906`
- `BlackHoleController.Play` — offset `0x2f6c68`
- `BlackHoleController.DoPlay` — offset `0x2f6c86`
- `BlackHoleController.CheckTimer` — offset `0x2f6ca4`
- `BlackHoleController.ForceStop` — offset `0x2f6cfe`
- `BlackHoleController.BlackHolePlusDamage` — offset `0x2f6ce0`

## Bots and synchronization
Bot benefit tables and synchronization interfaces exist; runtime values and formula order remain unknown.
- `Bots.GetCooldownTimers` — offset `0x2f792e`
- `Bots.SetCooldownTimers` — offset `0x2f794c`
- `Bots.GetBotBenefit` — offset `0x2f7988`
- `Bots.GetWildfireDuration` — offset `0x2f7c1c`
- `Bots.IsBotSynchronized` — offset `0x2f7cb2`
- `Bots.SynchronicityUpgrade` — offset `0x2f7c3a`
- `Bots.FindSynchronicityLeadBot` — offset `0x2f7c76`
- `Bots.baseBenefit` — offset `0x70bd34`
- `Bots.benefitPerLevel` — offset `0x70bd3e`

## Module migration and effects
Primary and assist slot levels, efficiency and migration are separate interfaces; the metadata alone cannot recover GComp rarity reductions or assist caps.
- `ModuleManager.GetSlotLevel` — offset `0x31c33c`
- `ModuleManager.GetPrimarySlotLevel` — offset `0x31c300`
- `ModuleManager.GetAssistSlotLevel` — offset `0x31c31e`
- `ModuleManager.MigrateModuleLevelsToSlots` — offset `0x31c4c2`
- `ModuleManager.TryCarePackageDrop` — offset `0x31d30e`
- `ModuleManager.GetAssistModuleUniqueEffectEfficiency` — offset `0x31e06a`
- `ModuleManager.GetAssistModuleMainEffectEfficiency` — offset `0x31e0e2`
- `ModuleManager.GetAssistModuleSubstatEfficiency` — offset `0x31e15a`
- `ModuleManager.IsCappedAssistSubstatEffect` — offset `0x31e358`

## Death Wave progression
Health-from-kill and multiplier gain have named routines; the constant is separately extracted, but exact conditions and cap remain unknown.
- `Main.ApplyDeathWaveHealthFromKill` — offset `0x31189c`
- `Main.ApplyDeathWaveHealthMultiplierGain` — offset `0x3118ba`
- `Main.DEATH_WAVE_HEALTH_MULTIPLIER_PER_KILL` — offset `0x7161d0`

## Economy and recovery
Separate economy, recovery and protector calculations are exposed; no package chance or boss frequency formula inferred.
- `Main.CalculateCoinBonuses` — offset `0x3135e8`
- `Main.GetThemesCoinBonus` — offset `0x313606`
- `Main.SpawnRecoveryPackage` — offset `0x3119c8`
- `Main.ApplyRecoveryPackage` — offset `0x313624`
- `Main.ApplyAllyRecoveryPackage` — offset `0x31367e`
- `Main.GetProtectorRadiusGrowthFactor` — offset `0x311bc6`

## Save version and schema
Both legacy and v2 members and version accessors are present. This supports coexistence, not equivalence or a conversion factor.
- `PlayerData.get_VersionNumber` — offset `0x32757a`
- `PlayerData.get_DataVersion` — offset `0x3275b6`
- `PlayerData.slotLevels` — offset `0x721e2c`
- `PlayerData.moduleCannonShardsLifetime` — offset `0x721e68`
- `PlayerData.moduleCannonShardsLifetime_v2` — offset `0x721e72`
- `PlayerData.moduleRerollCurrencyLifetime` — offset `0x721eb8`
- `PlayerData.moduleRerollCurrencyLifetime_v2` — offset `0x721ec2`
