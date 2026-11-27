# GRE Audit 05 — Domain 04: Combat Mechanics

- Audit ID: `GRE-AUDIT-D04`
- Source: `GRE/1/04_combat_mechanics.json` and `GRE/1/04_combat_mechanics.md`
- Source branch: `TestAccount`
- Source binary identity: manifest SHA-256 `8266355fab717d91b51482122b66551afc62502b0f62fd8527930962cbefe81c`
- Metadata format: v39
- Status: **CONTENT REVIEWED; behavioral verification incomplete**
- Changes to source files: none

## 1. Domain structure

The domain contains 79 type records:
- 25 named types;
- 54 compiler-generated/helper records.

Named types:
`ActiveStatsTracker`, `DeathRay`, `DeathRayController`, `DamageReductionResult`, `Enemy`, `TargetPriorityIndexPositions`, `LandMine`, `MineType`, `LandMineController`, `LifeSaverType`, `LifeSavingOrderingPanel`, `DamageData`, `HitData`, `LightspeedPathData`, `UpgradeType`, `UpgradeMultiplier`, `ClosestEnemyEntry`, `Main`, `Projectile`, `ProjectileType`, `Shock`, `ShockManager`, `Shockwave`, `StatsValueCalculator`, and `TowerBuddy`.

The domain overlaps heavily with Game Fundamentals and Enemies. Its inclusion of the large `Main` and `Enemy` types means the domain is a navigation view, not a cleanly isolated list of combat-only classes.

## 2. Target priority and projectile declarations

### TargetPriorityIndexPositions

Declared labels:
`Closest`, `Basic`, `Fast`, `Tank`, `Ranged`, `Boss`, `Spotlight`, `Protector`, `Elites`, `Fleets`.

Candidate decoded numeric values are 0–9 in the listed order.

The enum establishes named target-priority categories. It does not establish the actual sort algorithm, tie-breaking, whether all modes use the same ordering, or the user-configured order.

### Projectile / ProjectileType

`ProjectileType` declares `Tower` and `Orb`, with candidate values 0 and 1.

`Projectile` declares fields:
- `target`
- `damage`
- `critBool`
- `superCritBool`
- `maxActiveTime`
- `projectileType`
- deactivation state and Unity collision/rigidbody references.

Methods include `ProjectileMovement(float deltaTime)`, `ProjectileHit(Enemy enemy)`, `OrbProjectileHit(Enemy enemy)`, `Activate(Vector3 sourcePosition, Enemy enemyTarget)`, and safe-deactivation methods.

**VERIFIED:** the projectile component records a target, damage, critical flags, a maximum active-time field, and projectile type.
**NOT ESTABLISHED:** projectile velocity formula, target retargeting, collision filtering, damage application order, or whether `maxActiveTime` is measured in seconds or another unit.

## 3. Land Mine subsystem

### MineType

Declared labels:
- `Ultimate`
- `EnemyDrop`
- `ExtraSet`
- `MagneticMine`

Candidate decoded values: 0–3 in that order.

### LandMine

Fields include:
- visual/collider/effect references;
- `areaOfEffect`;
- `timer`;
- `isModuleLandmine`;
- `isWorkshopDroppedMine`;
- `plusDamageMultiplier`;
- `plusDamageStack`;
- module-specific particle/sequence state;
- `isMoving`;
- color/render settings.

Selected method signatures:
- `SetExplosionRadius(float radius) -> void`
- `ActivateModuleLandmine(Vector3 position) -> void`
- `SetTarget(Enemy target) -> void`
- `DoMoveToTarget(Enemy target) -> IEnumerator`
- `ChronoJump(int times) -> void`
- `Explode() -> void`
- `DoExplode() -> IEnumerator`

The parameter type for the general `Activate(position)` and the `UpdateTimer(time)` argument is unresolved in the extracted type map; do not guess it.

### LandMineController

Fields include mine type, mine collection, module mine rotator/target radius/rotation speed, docking/spacing speeds, and candidate constant `MAX_MODULE_LANDMINES = 20`.

Methods include `CheckTimers`, `SpawnMagneticMine(Vector3 origin, Enemy target)`, `HasActiveLandMine`, and lifecycle methods.

**VERIFIED:** the declarations distinguish module landmines and workshop-dropped mines, expose mine movement/targeting/explosion methods, and include a MagneticMine spawn method.
**INFERRED:** there are multiple mine sources/types and at least one mine movement/targeting path.
**NOT ESTABLISHED:** explosion damage, radius scaling, timer units, mine capacity in live gameplay, target selection, Chrono Jump behavior, stun behavior, or interaction with Space Displacer. Those require method bodies or independent evidence.

## 4. Damage reduction and tower life-saving interfaces

### DamageReductionResult

The same 11-field structure is present as in Domain 02. It contains incoming/final damage and named blocked contributions. This is repeated metadata, not independent corroboration.

### LifeSaverType

Declared labels:
- `DeathDefy`
- `EnergyShield`
- `SecondWind`
- `DemonMode`
- `Nuke`
- `Bastion`

Candidate decoded values: 0–5 in that order.

### LifeSavingOrderingPanel

Fields include an instance reference, window, tile list, and ordered tile collection. Methods include:
- `ApplySavedOrder()`
- `HandleTileDropped(GrabbableTile droppedTile)`
- `UpdateOrderNumbers()`
- `FindTile`

### Main method signatures

Selected declarations:
- `ApplyTowerDamage(double damage, unresolved triggerHitThisWave) -> void`
- `ResolveLethalHit(double damage, Enemy enemy, unresolved allowEnergyShield, unresolved triggerHitThisWave) -> double`
- `TryUseSecondWindSave() -> bool`
- `TryUseDemonModeSave() -> bool`
- `TryUseBastionSave(double damage) -> bool`
- `TryUseNukeSave() -> bool`
- `SetLifeSavingOrder(unresolved order) -> void`

**VERIFIED:** the metadata declares a lethal-hit resolution method, separate save-attempt methods, an order setter, a life-saver enum, and a UI for ordering.
**INFERRED:** the game has a configurable life-saving ordering interface and multiple save mechanisms exposed to the tower damage path.
**NOT ESTABLISHED:** exact invocation order, priority semantics, conditions for each save, whether every listed type is currently selectable, or whether the order UI controls all save types. The parameter type of `SetLifeSavingOrder` is unresolved.

## 5. Enemy, Main, and stat helpers

`Enemy`, `Main`, `DamageData`, `HitData`, `ClosestEnemyEntry`, `UpgradeType`, `UpgradeMultiplier`, `ActiveStatsTracker`, and `StatsValueCalculator` repeat structures also found in other domains.

Important method declarations in `Main` include:
- `TowerFire(int selectedTarget)`
- `ChainLightning(int enemyIndex, double power, unresolved numberOfHits)`
- `GetBounceHitData(int enemyIntIndex)`
- `ComputeBounceTargets(int initialEnemy, int numberOfBounces)`
- `FindNextBounceTarget(int fromEnemy, unresolved bounceTargetEnemies, unresolved eligibleEnemies)`
- `GetWaveBaseDamage(int wave) -> double`
- `GetWaveBaseHealth(int wave) -> double`

Several collection/parameter/return types for bounce data and hit counts remain unresolved. Do not substitute a guessed array/list/enum type.

**INFERRED:** `Main` exposes tower firing, bounce-target selection, Chain Lightning, and base enemy wave-stat access points.
**NOT ESTABLISHED:** projectile hit order, bounce eligibility and range, chain lightning scaling, damage multipliers, target selection, or wave-stat formula.

## 6. Death Ray and Shock presentation components

- `DeathRay` holds particle/line/collider references and play/stop state.
- `DeathRayController` holds Main, rotation speed, and a collection of Death Rays, with update/play/stop methods.
- `Shock` holds an enemy index and update method.
- `ShockManager` tracks shock objects and exposes a play method.
- `Shockwave` exposes sprite renderers and shock color with lifecycle/update methods.

These records indicate presentation/controller components. The actual damage, stun, decay, or duration behavior is not established here. Enemy-side effect handling must be audited alongside the relevant Enemy and combat method evidence.

## 7. TowerBuddy overlap

`TowerBuddy` appears in this domain with 61 fields, 68 methods, and 6 properties. Its declarations include ability objects and methods for Rush, Scare, Steal, Catch, Attack, Ally, Fetch, Summon, Scout, and Repair, plus cooldown timer and reward fields.

It is also assigned to Guardians in the extraction taxonomy. Its appearance in Combat Mechanics is therefore an overlapping classification, not evidence that all Buddy features are combat mechanics.

## 8. Candidate values and limitations

Candidate numeric values in this domain include `MAX_MODULE_LANDMINES = 20`, enum assignments for target priority, mine type, life-saver type, and projectile type, plus constants inherited through repeated `Main` and `Enemy` records.

All such numeric values remain **DECODED_CANDIDATE**. Domain overlap means repeated constants in this file must not be counted as independent confirmation. No unit, use site, or runtime condition should be inferred from the numeric value alone.

## 9. Cross-domain leads

- LandMine ↔ Enemies: mine damage handling and enemy hit state.
- LandMine ↔ Modules: module-specific mine fields and MagneticMine.
- LandMine ↔ Ultimate Weapons: `MineType.Ultimate` and ILM-related methods.
- Life-saving path ↔ Game Fundamentals/Main and Battle History.
- Target priority ↔ Enemies and targeting configuration.
- TowerBuddy ↔ Guardians, not a separate combat-only system.
- Death Ray/Shock ↔ Enemies and Ultimate Weapons/Bots effect sources.

These are investigation links, not proven causal relationships.

## 10. Audit conclusions

| Claim / conclusion | Classification | Status |
|---|---|---|
| Domain JSON contains 79 records: 25 named and 54 generated | OBJECTIVE | VERIFIED against parsed JSON |
| Projectile component has target/damage/critical/type fields | OBJECTIVE | VERIFIED as declarations |
| LandMine declares module/workshop origin flags and target/movement/explosion methods | OBJECTIVE | VERIFIED as declarations |
| LifeSaverType declares six named save categories | OBJECTIVE | VERIFIED as declarations |
| Main declares lethal-hit and save-attempt methods | OBJECTIVE | VERIFIED as declarations |
| Life-saving UI can apply saved order and reorder tiles | OBJECTIVE | INFERRED from method names/signatures |
| Exact damage pipeline and save priority | OBJECTIVE | NOT ESTABLISHED |
| Exact landmine radius/damage/timer/stun behavior | OBJECTIVE | NOT ESTABLISHED |
| Exact projectile/bounce/Chain Lightning formulas | OBJECTIVE | NOT ESTABLISHED |

## 11. GKB promotion decision

Do not bulk-promote Domain 04. It is useful as a map of combat declarations, but behavior and formulas are not available. Future GKB entries should be member-level claims, not class-level summaries, and must retain their cross-domain overlap.

Potential later claim candidates include the declared projectile fields, LandMine origin/movement interfaces, and the existence of a configurable life-saving order UI. Actual mechanics need additional evidence.

## 12. Next

Proceed to Domain 05 — Ultimate Weapons. Keep Enemy-side damage handlers as cross-references, not as proof of the Ultimate Weapon's own formula.
