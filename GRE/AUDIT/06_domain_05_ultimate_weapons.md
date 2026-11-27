# GRE Audit 06 — Domain 05: Ultimate Weapons

- Audit ID: `GRE-AUDIT-D05`
- Source: `GRE/1/05_ultimate_weapons.json` and `GRE/1/05_ultimate_weapons.md`
- Source branch: `TestAccount`
- Source binary identity: manifest SHA-256 `8266355fab717d91b51482122b66551afc62502b0f62fd8527930962cbefe81c`
- Metadata format: v39
- Status: **CONTENT REVIEWED; behavioral verification incomplete**
- Changes to source files: none

## 1. Domain structure

The domain contains 70 type records:
- 33 named types;
- 37 compiler-generated/helper records.

The named records include controller/effect types for Chain Lightning, Black Hole, Chrono Field, Death Wave, Golden Tower, Smart Missiles, Spotlight, and Poison Swamp; generic `Main` and data helpers; plus UW ID, stats, preview, description, and choice UI types.

The domain is a mixed view of:
1. player-facing UW identity and selection;
2. stat/benefit getters;
3. in-battle controller/effect objects;
4. Ultimate Weapon Plus and missile variant declarations;
5. presentation and VFX toggles.

## 2. UltimateWeaponID and declared catalog

`UltimateWeaponID` declares:
- `None`
- `ChainLightning`
- `SmartMissile`
- `DeathWave`
- `ChronoField`
- `InnerLandMines`
- `GoldenTower`
- `PoisonSwamp`
- `BlackHole`
- `Spotlight`

The extractor reports candidate numeric values: `None = -1`, then the nine named UWs as 0–8 in the listed order.

`DevPanelUltimateWeapons` declares the same nine UW names, with candidate values 0–8.

**VERIFIED:** these nine identifiers are present in this binary's metadata.
**DECODED_CANDIDATE:** their numeric assignments are inferred from default-data decoding.
**NOT ESTABLISHED:** whether this is the complete catalog for the latest game release. The manifest does not map metadata v39 to a definitive game release/build. Absence of a later/newer UW identifier from this enum is not proof that it does not exist in a different build or remote configuration.

## 3. Main stat/benefit getter interface

The `Main` class declares a family of UW getter methods. The selected signatures consistently accept `bool includeInBattleModifiers` and return `System.Double` for:
- Chain Lightning damage, quantity, chance;
- Smart Missiles damage, quantity, cooldown;
- Death Wave damage, quantity, cooldown;
- Chrono Field duration, speed reduction, cooldown;
- Inner Land Mines damage, quantity, cooldown;
- Golden Tower bonus, duration, cooldown;
- Poison Swamp damage, duration, cooldown;
- Black Hole duration, cooldown;
- Spotlight bonus, angle, quantity.

Additional declarations:
- `GetBlackHoleSize(bool includeInBattleModifiers, unresolved level) -> double`
- `GetUltimateWeaponAppliedLevel(int statIndex) -> int`
- `GetUltimateWeaponFullBenefit(int index, int level) -> double`

**VERIFIED:** there are separate stat getters for multiple UW benefit dimensions and a boolean parameter explicitly named `includeInBattleModifiers`.
**INFERRED:** the API distinguishes a base/modified stat retrieval path, or at least provides a caller-controlled switch for battle modifiers.
**NOT ESTABLISHED:** which modifiers are included, whether the boolean controls only in-battle effects, the formula, upgrade-level mapping, caps, or the order of lab/card/module/perk modifiers.

## 4. Individual controller/effect declarations

### Chain Lightning

`ChainLightning` fields include `generations`, `boltDuration`, `ChaosFactor`, random generator, line renderer, segment/position state, duration, coroutine, and run ID.

Methods include `GenerateLightningBolt`, renderer lifecycle methods, `Play`, `DoUpdate`, and `Trigger`. `GenerateLightningBolt` takes start/end positions, generation, total generations, and offset amount. Multiple overloaded `Play` and `Trigger` methods accept unresolved collection-like type references.

`ChainLightningPool` declares a pool, current index, `playsThisFrame`, `MaxPlaysPerFrame`, and separate basic/plus lightning references, plus acquisition and play methods.

**INFERRED:** the effect uses pooled visual lightning objects and a generation-based rendering routine.
**NOT ESTABLISHED:** actual hit count, target-selection rules, damage, chain probability, generation depth, or whether the visual generation count equals gameplay hit count. Damage/quantity/chance getter declarations are in Main, while Enemy/Main damage handlers are in other domains.

### Black Hole

`BlackHoleController` declares:
- `group1Transform`, `group2Transform`;
- `blackHoles`, `blackHoles2`;
- active state, `timer`, `activeTimer`;
- `blackHoleAlreadyActive`, `usingSecondGroup`.

Methods include `Play`, `DoPlay`, `CheckTimer`, `BlackHolePlusDamage`, and `ForceStop`; it exposes `Active` and `Duration`.

**VERIFIED:** two group transforms/collections and a second-group state flag are declared.
**NOT ESTABLISHED:** whether both groups can be active simultaneously, whether this is a visual transition or gameplay second group, activation banking, duration extension, cooldown, or Plus damage formula.

### Chrono Field

`ChronoField` declares radius, timer, active state, particle/border objects, and particle-stop state. Methods include `Play`, `CheckTimer`, `CalculateParticleSize(float plusPerkRatio)`, and safe-stop methods.

**NOT ESTABLISHED:** actual enemy speed reduction, duration/cooldown formula, radius calculation, or Plus behavior. Main has separate duration/speed-reduction/cooldown getters; Enemy has enemy-side Chrono-related state. Those are cross-domain leads, not formulas.

### Death Wave

`DeathwaveController` declares speed, max size, wave interval, effect-wave counters/timers, final-wave and persistent-boost-related fields, colors, and countdown state.

Methods include `ResetEffectWaveTimer`, `Resume`, `Play`, `FireEffectWave`, `ApplyDeathWaveEffects(int enemyIndex)`, and `FireDeathWave`.

**VERIFIED:** controller declarations include both a Death Wave effect path and effect-wave timing state.
**NOT ESTABLISHED:** how many effect waves occur, their spacing, kill/health effects, persistent boost rules, or whether the visual controller timer matches gameplay timing.

### Golden Tower

`GoldenTower` declares a timer, active timer, active state, visual tween state, and event hooks. Methods include `Play`, `DoPlay`, `CheckTimer`, `HandleGoldenTowerPlusReward`, and VFX methods.

**NOT ESTABLISHED:** coin multiplier, duration/cooldown values, activation conditions, or Plus reward calculation.

### Smart Missiles

`SmartMissileType` declares:
- `UltimateWeapon`
- `UltimateWeaponPlus`
- `Barrage`
- `TacticalBarrage`

Candidate values: 0–3 in that order.

`SmartMissileController` declares missile speed, rotate/search/inverter speeds, barrage quantity, missile collection/pool, and visual explosion pool state. Methods include `Play`, `PlayPlus`, `PlayBarrage`, `TacticalBarrageFireMissileAt(Enemy enemy)`, and `SendAllActiveMissilesAt(Enemy enemy)`.

`SmartMissile` declares target/detection/collision/trail/sprite state, rotation and direction values, explosion/timeout state, and delayed target state. Methods include detection, explosion, spawn, delayed target, and missile movement.

**VERIFIED:** the metadata distinguishes base UW, UW Plus, Barrage, and Tactical Barrage missile types and exposes separate controller methods.
**NOT ESTABLISHED:** targeting priority, retargeting rules, missile count, explosion radius/damage, stack rules, and travel speed values.

### Spotlight

`Spotlight` declares arc, rotation/blink speeds, fade values, light collections, angle cosine values, and boss tracking fields. Methods include `Set`, `TrackBoss(int bossIndex) -> bool`, `BossDied`, and `ResetBossTrack`.

**NOT ESTABLISHED:** actual spotlight damage/coin bonuses, angle/quantity formulas, tracking selection rules, or how Spotlight Plus changes the field.

### Poison Swamp

`Swamp` declares collider, sprite, color, border, timer, and radius getter. `SwampController` declares Main, swamp objects, materials/colors, index, and `SpeedID`; methods include `Play`, `CheckTimers`, and `UpdateSpeed`.

**NOT ESTABLISHED:** damage ticks, slow strength, duration/cooldown, enemy coverage, or Plus effects.

## 5. UW stat and presentation records

### UltimateWeaponStats and UltimateWeaponPlusStats

The base stats type declares names such as:
- Chain Lightning damage;
- Smart Missiles damage;
- Death Wave damage;
- Inner Land Mines damage;
- Poison Swamp damage/duration/cooldown;
- Golden Tower bonus cost;
- Spotlight angle cost;
- several Plus cost scaling fields.

The Plus stats type declares:
- Smite damage;
- Cover Fire cooldown;
- Kill Wall damage;
- Chrono Loop bonus;
- Charged Mines damage;
- Golden Combo bonus/cost;
- Death Creep damage;
- Consume damage;
- Light Range bonus.

These are field names only; the exported fields have no decoded defaults in the domain JSON. Do not treat them as numeric values or as proof of the exact Plus mechanic implementation.

### UltimateWeaponDescriptionPanel

Fields indicate a panel that can display:
- UW title/icon/description;
- stat levels and values;
- Plus current/max level;
- level slider;
- lab enhancement entries and toggles.

Methods include stat update, lab enhancement begin/end/add, substat lab enhancement, Plus panel open, and slider change.

### UltimateWeaponPreviewPanel and WeaponChoice

The preview panel exposes video/icon/title/description/stats/unlock prompt and unlock cost fields, with `Open`, `Unlock`, and `Close` methods.

`WeaponChoice` exposes three choices, their names/descriptions/icons/indices, selection methods, and description-opening methods.

**INFERRED:** the code separates preview/selection UI from in-battle controller classes.
**NOT ESTABLISHED:** actual unlock prices, choice RNG/weights, exact descriptions, or player eligibility conditions.

## 6. VFX toggle enum

`UltimateWeaponVFXToggleType` declares:
- `BrighterSpotlight`
- `DeathWave`
- `ChronoField`
- `InnerLandMines`
- `PoisonSwamp`
- `BlackHole`

Candidate values are 9–14. The enum does not list every UW, but this is a VFX toggle type, not the UW catalog. Do not infer that UWs omitted here lack visual effects.

## 7. Cross-domain relationships

- Main UW stat getters ↔ Research, Workshop Enhancements, Modules, Cards/Masteries, and Perks.
- Chain Lightning/Smart Missile/Death Wave/Black Hole damage ↔ Enemy damage handlers and Combat Mechanics.
- UW duration/cooldown getters ↔ Multiverse Nexus and cooldown calculations.
- Death Wave persistent/health state ↔ Main and Economy/Progression.
- Golden Tower/Black Hole/Spotlight coin handlers ↔ Economy and Progression.
- UltimateWeaponDescriptionPanel lab entries ↔ Research and Workshop Enhancements.

These are investigation links only. The metadata does not establish formula composition or application order.

## 8. Audit conclusions

| Claim / conclusion | Classification | Status |
|---|---|---|
| Domain JSON contains 70 records: 33 named and 37 generated | OBJECTIVE | VERIFIED against parsed JSON |
| UltimateWeaponID declares nine named UW identifiers | OBJECTIVE | VERIFIED as declarations |
| UltimateWeaponID numeric values -1 and 0–8 | OBJECTIVE | DECODED_CANDIDATE |
| Main exposes UW stat getters with includeInBattleModifiers parameter | OBJECTIVE | VERIFIED as declarations |
| Controller types exist for the listed UW systems | OBJECTIVE | VERIFIED as declarations |
| Black Hole has two group collections and a second-group state flag | OBJECTIVE | VERIFIED as declarations; semantics unknown |
| Smart Missile distinguishes UW, UW+, Barrage, Tactical Barrage | OBJECTIVE | VERIFIED as declarations |
| Exact UW formulas, durations, cooldowns, target logic, and stacking | OBJECTIVE | NOT ESTABLISHED |
| This enum is the latest complete UW catalog | OBJECTIVE | NOT ESTABLISHED |

## 9. GKB promotion decision

Do not bulk-promote Domain 05. The best immediate use is as a navigation map from UW stat getters to controller/effect types and cross-domain damage/economy handlers.

Potential GKB claims later should be narrow and traceable, for example: “the metadata declares a GetBlackHoleCooldown getter accepting includeInBattleModifiers” or “SmartMissileType has four named variants.” Gameplay formulas should remain out of GKB until method bodies or independent evidence are available.

## 10. Next

Proceed to Domain 06 — Workshop. Treat UW stat getters as interfaces, not as verified formulas.
