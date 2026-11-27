# GRE Audit 03 — Domain 02: Enemies

- Audit ID: `GRE-AUDIT-D02`
- Source: `GRE/1/02_enemies.json` and `GRE/1/02_enemies.md`
- Source branch: `TestAccount`
- Source binary identity: manifest SHA-256 `8266355fab717d91b51482122b66551afc62502b0f62fd8527930962cbefe81c`
- Metadata format: v39
- Status: **CONTENT REVIEWED; behavioral verification incomplete**
- Changes to source files: none

## 1. Domain structure

The domain contains 31 type records:
- 21 named types;
- 10 compiler-generated/helper records.

Named types:

| Type | Fields | Methods | Properties |
|---|---:|---:|---:|
| BossNet | 6 | 3 | 0 |
| BossNetHit | 2 | 3 | 0 |
| BossProjectile | 7 | 6 | 0 |
| DevPanelBattle1EnemyCounts | 4 | 0 | 0 |
| DamageReductionResult | 11 | 0 | 0 |
| Enemy | 215 | 117 | 16 |
| DamageSource | 22 | 0 | 0 |
| PoolType | 11 | 0 | 0 |
| EnemyType | 15 | 0 | 0 |
| FleetType | 4 | 0 | 0 |
| EnemyProjectile | 7 | 6 | 0 |
| ClosestEnemyEntry | 2 | 1 | 0 |
| MiniBossController | 6 | 10 | 0 |
| MiniBossSetup | 3 | 1 | 0 |
| MiniBossSpawnEntry | 2 | 1 | 0 |
| MiniBossType | 5 | 0 | 0 |
| RayMinibossController | 4 | 6 | 0 |
| SummonPortal | 10 | 11 | 0 |
| SummonPortalManager | 4 | 9 | 2 |
| VampireController | 8 | 10 | 1 |
| VaultEnemyTile | 5 | 3 | 0 |

## 2. Enemy identity and classification enums

The metadata directly declares these enum member names:

### EnemyType
`None`, `Basic`, `Fast`, `Tank`, `Boss`, `Ranged`, `Protector`, `Vampire`, `ScatterMain`, `ScatterChild`, `Ray`, `Saboteur`, `Commander`, `Overcharge`.

Candidate decoded numeric values:
- `None = -1`
- `Basic = 0` through `Overcharge = 12` in the listed order.

### FleetType
`Saboteur`, `Commander`, `Overcharge`; candidate decoded values 0, 1, 2.

### MiniBossType
`None`, `Vampire`, `Scatter`, `Ray`; candidate decoded values 0, 1, 2, 3.

### PoolType
`Normal`, `ScatterChild`, `Ray`, `Vampire`, `Scatter`, `Saboteur`, `Commander`, `Overcharge`, `Boss`, `FleetSupport`; candidate decoded values 0–9.

### DamageSource
The declared source labels are:
`Projectile`, `Cannon`, `Orb`, `DeathRay`, `BlackHole`, `FlameBot`, `Swamp`, `LandMine`, `InnerLandMine`, `SmartMissile`, `ChainLightning`, `ChainLightningPlus`, `DeathWave`, `Thorn`, `SecondWindBlast`, `Nuke`, `EnergyNet`, `GuardianAttack`, `Impact`, `Ally`, `Electron`.

Candidate decoded values are 0–20 in the listed order.

**VERIFIED:** these names are declared in the metadata.
**DECODED_CANDIDATE:** numeric assignments above are produced by the extractor's inferred primitive decoding. They are not yet independently validated.
**NOT ESTABLISHED:** whether every enum value is used in the current live build, exact serialization compatibility, and the runtime mapping from enum values to behavior.

The coexistence of `EnemyType` and `FleetType` is evidence of two distinct classification declarations. It does not by itself prove spawn eligibility, exclusivity, or wave rules.

## 3. Enemy class — central state and behavior declarations

`Enemy` is the largest type in this domain: 215 fields, 117 methods, and 16 properties.

### 3.1 State-field groups

The field names expose several groups of state:

- **Base/current enemy state:** `enemyType`, `enemyHealth`, `enemyHealthMax`, `enemyDamage`, `enemySpeed`, `enemyArmor`, `enemyArmorMax`, `enemyMassOnActivate`, `enemyKillCash`, `enemyKillCoins`.
- **Wave and spawn tracking:** `waveEnemySpawned`, `numWavesAlive`, spawn/activation methods, and wave callback `OnEachWave(wavesPassed)`.
- **Enemy/fleet/boss classification and range:** flags and fields for boss, fleet, ranged, commander, overcharge, protector, melee range, wall range, and targetability.
- **Crowd control/status:** `stunTime`, `knockbackEndTime`, `knockbackBool`, `fearedTime`, `shockStack`, `burnStack`, `burnTime`, `poisoned`, `poisonTime`, `poisonCount`, `flashbangMissChance`.
- **UW and other system interactions:** Black Hole state, Death Wave marking/amplifier, Spotlight tracking, Chain Lightning hits, Smart Missile stack hits, Orb marks, and Ultimate Fast link state.
- **Bot/Guardian-related state:** Flame Bot damage-reduction fields, Thunder Bot reduction/linger fields, Golden Bot/Amplify Bot-related methods, Guardian attack damage method.
- **Hit bookkeeping:** multiple `alreadyHitBy...` flags for orbs, projectiles, thorns, Death Ray, Chain Lightning, Smart Missiles, mines, Poison Swamp, Black Hole, Chrono Field, bots, and other attacks.
- **Lifecycle/visual state:** dying/dead flags, safe-deactivation queue/coroutine, pulse animation state, and render multipliers.

These are groupings by field names only. They do not establish which flags are mutually exclusive, how they are reset, or the order in which effects are processed.

### 3.2 Method signatures that are directly recorded

Selected signatures include:

| Method | Recorded signature |
|---|---|
| `EnemyMovement` | `(float deltaTime) -> void` |
| `EnemyUpdate` | `(float deltaTime) -> void` |
| `GetEstimatedFuturePosition` | `(float timeInFuture) -> UnityEngine.Vector2` |
| `CalculateDamageReductionResult` | `(double incomingDamage) -> DamageReductionResult` |
| `ApplyDamageReductionStats` | `(DamageReductionResult result) -> void` |
| `ApplyStun` | `(float stunDuration) -> void` |
| `GetDiminishedNumberOfLevelReductions` | `(int totalProcs) -> int` |
| `GetEnemyBaseDamage` | `() -> double` |
| `GetEnemyBaseHealth` | `() -> double` |
| `GetEnemyBaseSpeed` | `() -> float` |
| `GetEnemyBaseMass` | `() -> float` |
| `OnEachWave` | `(int wavesPassed) -> void` |
| `Spawn` | `(EnemyType type, Vector3 spawnPosition, unresolved isSummon, unresolved isBossToTrackStats, unresolved isFleetSupport) -> void` |
| `Activate` | `(EnemyType type, Vector3 spawnPosition, unresolved isSummon, unresolved isBossToTrackStats) -> void` |
| `Kill` | `(DamageSource source, unresolved crit, unresolved superCrit) -> void` |

The unresolved parameter types must remain unresolved. Do not guess that they are booleans or another specific type based on the parameter names.

### 3.3 Damage-source and bonus handlers

The metadata declares separate methods for damage/effect handling, including:
- Cannon/projectile and ranged attacks;
- Vampire, Saboteur, Commander, and Overcharge attacks;
- Thorn, Orb, Death Ray, Energy Net, Smart Missile, Death Wave, Black Hole, Poison Swamp, Land Mine, Inner Land Mine, Flame Bot, Lightning, and Guardian attack damage;
- kill and enemy death handling;
- Golden Tower, Coin Bot, Black Hole, Orb, Bounty, Spotlight, Death Wave coin, and Death Wave cell bonus methods.

**INFERRED:** the Enemy class is a shared integration point for combat damage, enemy status, and enemy-linked economy effects.
**NOT ESTABLISHED:** exact damage formulas, order of handlers, whether named bonuses stack additively or multiplicatively, kill attribution rules, or conditions for each handler.

## 4. DamageReductionResult

The struct declares 11 fields:
- `finalDamage`
- `chainThunderBlocked`
- `chronoFieldBlocked`
- `flameBotBlocked`
- `magicOrbBlocked`
- `primordialCollapseBlocked`
- `defensePercentBlocked`
- `defenseAbsoluteBlocked`
- `bastionBlocked`
- `bastionPoolUsed`
- `incomingDamage`

**VERIFIED:** the result record contains separate named fields for incoming/final damage and several named blocked-damage contributions.
**INFERRED:** the result type is intended to carry a breakdown of damage reduction/absorption contributors.
**NOT ESTABLISHED:** whether each field is always populated, the order of operations, whether values overlap, the units, caps, or the final damage equation. The metadata does not provide the implementation of `CalculateDamageReductionResult`.

## 5. Mini-boss subsystem

`MiniBossController` declares fields:
- `ignoreRemoteConfig`
- `miniBossSetups`
- `tournamentMiniBossSetups`
- `maxWave`
- `miniBossDrops`
- `miniBossSpawns`

Selected method signatures:
- `InitializeMiniBossSpawns(int seed, bool forTournament)`
- `TryAddMiniBoss(int chance, int doubleChance, int wave)`
- `GetMiniBossChance(int tier, int wave) -> float`
- `GetRandomMiniBoss() -> MiniBossType`
- `TryParseConfigArray(string key) -> Newtonsoft.Json.Linq.JArray`
- `UpdateChancesFromRemoteConfig()`
- `UpdateDropsFromRemoteConfig()`

`MiniBossSetup` declares `scalingWaves`, `spawnChances`, and `doubleSpawnChances`.
`MiniBossSpawnEntry` declares `miniBossType` and `secondMiniBossType`.

**VERIFIED:** mini-boss setup, chance, drop, spawn, and remote-config method/field declarations exist.
**INFERRED:** mini-boss spawning can be configured separately for tournament and non-tournament contexts, based on the field and method signatures.
**NOT ESTABLISHED:** chance curves, randomization algorithm, wave/tier scaling, drop values, remote-config contents, or whether local defaults are used when remote configuration is absent.

## 6. Other enemy-related subsystems

### BossNet and projectiles
- `BossNet` fields include `BASE_PROJECTILE_SPEED`, `MAX_TICKS`, `enemyIndex`, `projectileTarget`, and `ticksCount`; methods include `FixedUpdate` and `OnTriggerEnter2D`.
- `BossProjectile` and `EnemyProjectile` expose enable/update/collision and safe-deactivation methods.
- Candidate decoded values include BossNet base projectile speed 0.4 and max ticks 1500; EnemyProjectile base speed 1.9.

These names support projectile/collision subsystems, not exact projectile behavior or timing.

### Ray mini-boss
`RayMinibossController` declares `UpdateRayCharging`, `HandleEnemyDeath`, `RayShot`, and particle cleanup methods. No charge duration, targeting rule, or damage formula is established here.

### Vampire controller
`VampireController` declares attack timer/state fields, registration/unregistration methods, `HandleVampireAttack`, and `IsVampireDebuffActive`. Candidate constants are `ATTACK_FREQUENCY = 0.1` and `DEBUFF_DURATION = 0.2`.

These are decoded candidates; units and gameplay meaning are not confirmed.

### Summon portals
`SummonPortal` exposes `duration`, `spawnInterval`, active/cleanup state, and portal spawn/self-dispose routines. `SummonPortalManager` exposes active portal tracking and create/remove/stop methods.

**INFERRED:** the code declares a timed portal lifecycle and enemy spawning routines.
**NOT ESTABLISHED:** which game feature triggers a portal, spawn distribution, actual duration, or whether this system is active in normal player gameplay.

### VaultEnemyTile
This UI-oriented type declares enemy icon/name fields, upgrade tiles, Vault IDs, and an enemy type. Its presence is a link between enemy identifiers and Vault presentation; it does not establish the Vault's effects.

## 7. Candidate decoded constants

All values below are **DECODED_CANDIDATE**. The extraction script infers primitive encodings and retains raw bytes, but the manifest explicitly says units and use sites are not inferred.

| Group | Candidate names and values |
|---|---|
| General | `RAY_SHOT_COOLDOWN = 30`; `MELEE_ATTACK_RANGE ≈ 0.3`; `NEAR_WALL_SPEED_LIMIT = 4.5` |
| Scatter | `SCATTER_SPLITS = 4`; `SCATTER_SPLITS_ULTIMATE = 5` |
| Size values | Basic/Fast/Ranged/Protector ≈ 0.222; Tank ≈ 0.4; Boss ≈ 0.76; Vampire/Scatter/Ray/Saboteur/Commander/Overcharge ≈ 0.55 |
| Saboteur | `SABOTEUR_BASE_ATTACK_INTERVAL = 5`; `SABOTEUR_MAX_ATTACK_INTERVAL = 1`; `SABOTEUR_MAX_ATTACK_SPEED_AT_WAVE = 4000` |
| Commander | Health/Mass/Speed buff ≈ 1.15; duration 0.5; pulse scale 4; speed/mass max 8; base interval 10; max interval 2; max-interval wave 4000; radius base scale ≈ 0.96 |
| Overcharge | Charge duration 3; base attack interval 15; max interval 1; max attack-speed wave 4000; attack exponent base ≈ 1.4 |
| Effect decay | `SPEED_ADJUSTER ≈ 0.41`; `MISS_DECAY = 0.875`; `STUN_DECAY ≈ 0.995`; `DEATH_DEFY_DECAY ≈ 0.9` |
| Pulsar Harvester | Diminished-return min 100, max 400, constant 1500; max procs 399 |
| Projectile | BossNet base projectile speed 0.4, max ticks 1500; EnemyProjectile base speed ≈ 1.9 |
| Vampire | Attack frequency ≈ 0.1; debuff duration ≈ 0.2 |

Do not attach units (seconds, waves, meters, multipliers, percentages) unless a separate source confirms them. Names such as `ATTACK_INTERVAL` suggest an interval but do not establish the unit or the precise timer semantics.

## 8. Cross-domain relationships to investigate later

These are navigation leads, not established causal relationships:

- Enemy damage handlers ↔ Combat Mechanics damage sources and reduction pipeline.
- Enemy status fields ↔ crowd-control mechanics, Bots, Ultimate Weapons, and Guardian effects.
- MiniBossController ↔ Battle Conditions/Tournaments and remote configuration.
- Enemy coin/cell handlers ↔ Economy and Progression.
- `DamageReductionResult` ↔ Main tower damage/life-saving pipeline.
- VaultEnemyTile ↔ Vault and enemy unlock/progression UI.

## 9. Audit conclusions

| Claim / conclusion | Classification | Status |
|---|---|---|
| Domain JSON contains 31 records: 21 named and 10 generated | OBJECTIVE | VERIFIED against parsed JSON |
| EnemyType/FleetType/MiniBossType/PoolType/DamageSource labels exist | OBJECTIVE | VERIFIED as declarations |
| Numeric enum assignments | OBJECTIVE | DECODED_CANDIDATE |
| Enemy declares combat, status, spawn, damage, and economy-related members | OBJECTIVE | VERIFIED as declarations |
| DamageReductionResult records separate named damage/block fields | OBJECTIVE | VERIFIED as declarations |
| MiniBossController exposes wave/tier chance and remote-config interfaces | OBJECTIVE | VERIFIED as declarations |
| Candidate constants are live game values with known units | OBJECTIVE | NOT ESTABLISHED |
| Exact damage reduction formula and effect order | OBJECTIVE | NOT ESTABLISHED |
| Mini-boss chance/drop formulas and live config | OBJECTIVE | NOT ESTABLISHED |

## 10. GKB promotion decision

Do not bulk-promote this domain. It is a high-value map of enemy-related declarations, but almost all behavior and numeric interpretations require further evidence.

Potential GKB-ready claims later:
- declaration-level enemy type and damage-source catalog, preserving enum numeric values as candidates until verified;
- existence of the `DamageReductionResult` breakdown fields;
- existence of mini-boss chance/config interfaces;
- existence of enemy status/effect state fields, without asserting their activation rules.

All such claims must preserve the binary hash, metadata version, type index, member name, offset/token where available, and the distinction between declaration and behavioral interpretation.

## 11. Next

Proceed to Domain 03 — Battle Conditions. Cross-reference enemy/mini-boss details only where the domain's actual records support the connection.
