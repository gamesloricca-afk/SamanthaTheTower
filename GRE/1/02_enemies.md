# Enemies
Source: Assembly-CSharp.dll metadata v39. Types may appear in more than one domain. Names are not proof of runtime behavior.

31 type records. Full field, method and property records in `02_enemies.json`.

## BossNet
Type #132, offset `0x86b23c`. Fields: 6; methods: 3; properties: 0.
Methods: `FixedUpdate`, `OnTriggerEnter2D`
Candidate decoded constants: `BASE_PROJECTILE_SPEED = 0.400000006`, `MAX_TICKS = 1500`

## BossNetHit
Type #133, offset `0x86b288`. Fields: 2; methods: 3; properties: 0.
Methods: `Play`

## BossProjectile
Type #135, offset `0x86b320`. Fields: 7; methods: 6; properties: 0.
Methods: `OnEnable`, `FixedUpdate`, `OnTriggerEnter2D`, `RequestSafeDeactivate`, `CoSafeDeactivate`

## DevPanelBattle1EnemyCounts
Type #278, offset `0x86dd94`. Fields: 4; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `One = 0`, `Five = 1`, `Ten = 2`

## DamageReductionResult
Type #309, offset `0x86e6c8`. Fields: 11; methods: 0; properties: 0.
Methods: none selected

## Enemy
Type #314, offset `0x86e844`. Fields: 215; methods: 117; properties: 16.
Methods: `Awake`, `EnemyMovement`, `UpdateUltimateFastLinkedEnemies`, `CheckSpotlight`, `EnemyUpdate`, `GetEstimatedFuturePosition`, `GetCurrentOverchargeAttackInterval`, `GetCurrentCommanderBuffInterval`, `GetCurrentSaboteurAttackInterval`, `ApplyTitanShock`, `GetTitanShockReduction`, `AddKnockback`, `Attack`, `CalculateDamageReductionResult`, `ApplyDamageReductionStats`, `RangedAttack`, `VampireAttack`, `ApplyRayShotHit`, `SaboteurAttack`, `CommanderBuffArea`, `OverchargeAttack`, `ProjectileDamage`, `ApplyProjectileDamage`, `TotalLightshotDamage`, `GetDiminishedNumberOfLevelReductions`, `ThornDamage`, `ElectronDamage`, `OrbDamage`, `EnergyNetDamage`, `DeathRayDamage`, `SmartMissilesDamage`, `ApplySmartMissilesDamage`, `DropLandMineDamage`, `InnerLandMineDamage`, `ApplyILMDamage`, `DeathwaveFinalDamage`, `BlackHoleDamage`, `BlackHolePlusDamage`, `FlameBotDamage`, `SwampDamage`, `LightningDamage`, `LightningPlusDamage`, `GuardianAttackDamage`, `AttackWall`, `MarkForDeath`, `HitMultiplier`, `RenderArmorMultiplier`, `Kill`, `GoldenTowerBonus`, `CoinBotBonus`, `EnemyBalanceBonus`, `BlackHoleCoinBonus`, `OrbCoinBonus`, `BountyCoinBonus`, `SpotlightCoinBonus`, `DeathWaveCoinBonus`, `DeathWaveCellBonus`, `LivedWavesCoins`, `HandleScatterBossDeath`, `KillExplosionPrefab`, `PrewarmKillExplosionPools`, `KillParticleExplosion`, `KillExplosionPoolSize`, `PlayKillExplosion`, `HitTextAnimation`, `StopAlphaPulse`, `HitTextAnimation`, `KillTextAnimation`, `TextAnimationRenderMultiplier`, `TrySpawnLandMine`, `Spawn`, `Activate`, `RequestSafeDeactivate`, `CoSafeDeactivate`, `Deactivate`, `GetEnemyBaseDamage`, `GetEnemyBaseHealth`, `GetEnemyBaseSpeed`, `GetEnemyBaseMass`, `TurnIntoAlly`, `GoldenTowerCheck`, `MatchesTargetPriority`, `OnEachWave`, `OnCollisionEnter2D`, `OnTriggerEnter2D`, `CountCrowdControl`, `ApplyStun`, `OnTriggerExit2D`, `GetFlameBotDamageReduction`, `GetThunderBotLinger`, `GetGoldenBotBonus`, `GetAmplifyBotBonus`, `GetWildfireAmplification`, `GetTitanShockAttackSpeedSlow`, `GetBonusCellsBonus`, `GetEchoingShotBonus`, `GetEchoingShotUltimateHitCount`, `RegisterSmartMissileStackHits`, `OrbHit`
Candidate decoded constants: `RAY_SHOT_COOLDOWN = 30`, `MELEE_ATTACK_RANGE = 0.300000012`, `SCATTER_SPLITS = 4`, `SCATTER_SPLITS_ULTIMATE = 5`, `NEAR_WALL_SPEED_LIMIT = 4.5`, `BASIC_SIZE = 0.222000003`, `FAST_SIZE = 0.222000003`, `TANK_SIZE = 0.400000006`, `BOSS_SIZE = 0.75999999`, `RANGED_SIZE = 0.222000003`, `PROTECTOR_SIZE = 0.222000003`, `VAMPIRE_SIZE = 0.550000012`, `SCATTER_SIZE = 0.550000012`, `RAY_SIZE = 0.550000012`, `SABOTEUR_SIZE = 0.550000012`, `COMMANDER_SIZE = 0.550000012`, `OVERCHARGE_SIZE = 0.550000012`, `SABOTEUR_BASE_ATTACK_INTERVAL = 5`, `SABOTEUR_MAX_ATTACK_INTERVAL = 1`, `SABOTEUR_MAX_ATTACK_SPEED_AT_WAVE = 4000`, `COMMANDER_HEALTH_BUFF = 1.14999998`, `COMMANDER_MASS_BUFF = 1.14999998`, `COMMANDER_SPEED_BUFF = 1.14999998`, `COMMANDER_BUFF_DURATION = 0.5`, `COMMANDER_BUFF_PULSE_SCALE = 4`, `COMMANDER_BUFF_SPEED_MASS_MAX = 8`, `COMMANDER_BUFF_BASE_INTERVAL = 10`, `COMMANDER_BUFF_MAX_INTERVAL = 2`, `COMMANDER_BUFF_MAX_INTERVAL_AT_WAVE = 4000`, `COMMANDER_BUFF_RADIUS_BASE_SCALE = 0.959999979`, `OVERCHARGE_CHARGE_DURATION = 3`, `OVERCHARGE_BASE_ATTACK_INTERVAL = 15`, `OVERCHARGE_MAX_ATTACK_INTERVAL = 1`, `OVERCHARGE_MAX_ATTACK_SPEED_AT_WAVE = 4000`, `OVERCHARGE_ATTACK_EXPONENT_BASE = 1.39999998`, `SPEED_ADJUSTER = 0.409999996`, `MISS_DECAY = 0.875`, `STUN_DECAY = 0.995000005`, `DEATH_DEFY_DECAY = 0.899999976`, `PULSAR_HARVESTER_DIMINISHED_RETURNS_MIN = 100`, `PULSAR_HARVESTER_DIMINISHED_RETURNS_MAX = 400`, `PULSAR_HARVESTER_DIMINISHED_RETURNS_CONSTANT = 1500`, `PULSAR_HARVESTER_MAX_PROCS = 399`

## DamageSource
Type #315, offset `0x86e890`. Fields: 22; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Projectile = 0`, `Cannon = 1`, `Orb = 2`, `DeathRay = 3`, `BlackHole = 4`, `FlameBot = 5`, `Swamp = 6`, `LandMine = 7`, `InnerLandMine = 8`, `SmartMissile = 9`, `ChainLightning = 10`, `ChainLightningPlus = 11`, `DeathWave = 12`, `Thorn = 13`, `SecondWindBlast = 14`, `Nuke = 15`, `EnergyNet = 16`, `GuardianAttack = 17`, `Impact = 18`, `Ally = 19`, `Electron = 20`

## PoolType
Type #316, offset `0x86e8dc`. Fields: 11; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Normal = 0`, `ScatterChild = 1`, `Ray = 2`, `Vampire = 3`, `Scatter = 4`, `Saboteur = 5`, `Commander = 6`, `Overcharge = 7`, `Boss = 8`, `FleetSupport = 9`

## EnemyType
Type #317, offset `0x86e928`. Fields: 15; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `None = -1`, `Basic = 0`, `Fast = 1`, `Tank = 2`, `Boss = 3`, `Ranged = 4`, `Protector = 5`, `Vampire = 6`, `ScatterMain = 7`, `ScatterChild = 8`, `Ray = 9`, `Saboteur = 10`, `Commander = 11`, `Overcharge = 12`

## FleetType
Type #318, offset `0x86e974`. Fields: 4; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Saboteur = 0`, `Commander = 1`, `Overcharge = 2`

## EnemyProjectile
Type #321, offset `0x86ea58`. Fields: 7; methods: 6; properties: 0.
Methods: `OnEnable`, `FixedUpdate`, `OnTriggerEnter2D`, `RequestSafeDeactivate`, `CoSafeDeactivate`
Candidate decoded constants: `BASE_SPEED = 1.89999998`

## ClosestEnemyEntry
Type #591, offset `0x873a80`. Fields: 2; methods: 1; properties: 0.
Methods: none selected

## MiniBossController
Type #634, offset `0x874744`. Fields: 6; methods: 10; properties: 0.
Methods: `Awake`, `OnDestroy`, `InitializeMiniBossSpawns`, `TryAddMiniBoss`, `GetMiniBossChance`, `GetRandomMiniBoss`, `TryParseConfigArray`, `UpdateChancesFromRemoteConfig`, `UpdateDropsFromRemoteConfig`

## MiniBossSetup
Type #635, offset `0x874790`. Fields: 3; methods: 1; properties: 0.
Methods: none selected

## MiniBossSpawnEntry
Type #636, offset `0x8747dc`. Fields: 2; methods: 1; properties: 0.
Methods: none selected

## MiniBossType
Type #637, offset `0x874828`. Fields: 5; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `None = 0`, `Vampire = 1`, `Scatter = 2`, `Ray = 3`

## RayMinibossController
Type #832, offset `0x87820c`. Fields: 4; methods: 6; properties: 0.
Methods: `UpdateRayCharging`, `HandleEnemyDeath`, `RayShot`, `RayShotDestroyCoroutine`, `ClearAllParticles`

## SummonPortal
Type #939, offset `0x87a1d0`. Fields: 10; methods: 11; properties: 0.
Methods: `Initialize`, `StartPortal`, `PortalSpawnRoutine`, `SpawnRandomEnemy`, `Cleanup`, `GetRandomEnemyType`, `StopPortal`, `StartSelfDisposeTimer`, `SelfDisposeRoutine`, `FadeOutAndDestroy`

## SummonPortalManager
Type #940, offset `0x87a21c`. Fields: 4; methods: 9; properties: 2.
Methods: `Awake`, `CreatePortal`, `RemovePortal`, `StopAllPortals`, `OnDestroy`

## VampireController
Type #1091, offset `0x87cef0`. Fields: 8; methods: 10; properties: 1.
Methods: `Awake`, `RegisterVampire`, `UnregisterVampire`, `Clear`, `HandleVampireAttack`, `IsVampireDebuffActive`, `UpdateVampireParticles`
Candidate decoded constants: `ATTACK_FREQUENCY = 0.100000001`, `DEBUFF_DURATION = 0.200000003`

## VaultEnemyTile
Type #1092, offset `0x87cf3c`. Fields: 5; methods: 3; properties: 0.
Methods: `Set`, `GetEnemyIcon`
