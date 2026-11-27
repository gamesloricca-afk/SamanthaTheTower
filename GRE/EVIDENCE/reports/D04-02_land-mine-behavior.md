# D04-02 — Land Mine Behavior: Initial Evidence Report

- Domain: 04 — Combat Mechanics
- Investigation: D04-02
- Status: **PARTIAL — MINE TYPES AND SDK MODELS RECORDED; NATIVE BEHAVIOR UNRESOLVED**
- Branch: `TestAccount`
- Access date: 2026-11-27

## Objective

Separate Workshop Land Mine behavior from Inner Land Mine (ILM) behavior, inspect Space Displacer interactions, and record what the GRE and TheTowerSDK actually expose.

## 1. GRE baseline

The GRE Domain 04 export declares:

- `LandMine` with methods including `SetExplosionRadius`, `UpdateTimer`, `Activate`, `ActivateModuleLandmine`, `Explode`, `DoExplode`, `SetTarget`, `DoMoveToTarget`, and `ChronoJump`.
- `MineType` with candidate decoded enum values `Ultimate`, `EnemyDrop`, `ExtraSet`, and `MagneticMine`.
- `LandMineController` with methods including `CheckTimers`, `FindNextAvailableIndex`, and `SpawnMagneticMine`.

These are metadata declarations and candidate enum values only. They do not establish runtime order, timer units, collision behavior, damage, stun, or module interaction.

Source:
- `GRE/1/04_combat_mechanics.md`
- GRE Domain 04 structural inventory: `GRE/AUDIT/43_domain_04_combat_mechanics_complete_structural_inventory.md`

## 2. TheTowerSDK 0.14.1 findings

Inspected at commit `9a95672578fa064d71ddd54fad2ce5027a310b3a` (2026-11-06).

### A. Space Displacer catalog model

`src/data/modules/templates.ts` describes Space Displacer as converting a portion of landmine spawns into Inner Land Mines, capped at 20, with rarity values 15 / 20 / 25 / 30 percent. The description says converted mines move and organize around the tower.

`src/mechanics/effective-paths/edamage-compute.ts` estimates extra ILM detonations per second from enemy spawn rate, Land Mine Chance, and the Space Displacer effect. This is an aggregate estimate, not an individual-mine runtime simulation.

### B. ILM charge helper

`src/mechanics/modules/ilm-charge.ts` models ILM charge and Chrono Jump. The helper gates Chrono Jump growth on ILM+ being active, a positive lab level, a positive hit count, and a positive Charged Mines rate.

The same SDK helper declares a 25-second mine lifetime and 37-second cooldown floor. Its builder clamps the entered mine age to the 25-second lifetime. A unit test asserts that Chrono Jump increases charge when hit count is positive and reports the no-hit case.

These are SDK model facts, not verified native game behavior.

### C. Dropped Land Mine damage helper

`src/mechanics/combat/land-mines.ts` contains `getDropLandmineDamage` and `dropLandMineDamage`. The first helper caps one input at 100 before scaling it by 0.01 and combines the remaining input terms multiplicatively. A test asserts that cap behavior.

The helper alone does not define the input units or prove native parity.

### D. What was not found in the inspected SDK paths

- No native `LandMine` / `LandMineController` method body.
- No inspected implementation of the Land Mine Stun card's collision/eligibility logic.
- No Land Mine Decay timer implementation.
- No per-mine movement, collision, or explosion event simulation.

The SDK identifies the Land Mine Stun card in player-stat fields, but that is a save-field mapping, not a stun mechanic implementation.

## 3. Community source comparison

### Space Displacer and Land Mine Stun

Two Reddit discussions (2024-03-21 and 2026-11-13) state that Space Displacer-generated mines are Inner Land Mines and are not affected by the ordinary Land Mine Stun card; ILM stun instead requires the separate ILM stun lab.

A TowerLoop page checked for game v29.1.3 (2026-10-27) also describes Space Displacer as converting Workshop Land Mines into moving ILMs, with a 20-mine cap and rarity-based conversion chance.

These sources agree on the broad distinction between Workshop Land Mines and ILMs. The Reddit claims are community observations; TowerLoop is a community guide. None is developer-official.

A June 2025 Reddit post describes using both the ordinary Land Mine Stun card and ILM stun with Space Displacer. This wording is compatible with two separate mine types and does not establish that the ordinary card stuns ILMs.

## 4. Claim register

| Claim ID | Type | Status | What it records |
|---|---|---|---|
| `CLM-D04-LM-001` | OBJECTIVE | VERIFIED (SDK catalog/model only) | Space Displacer conversion model |
| `CLM-D04-LM-002` | OBJECTIVE | EXTERNAL-UNVERIFIED | Community statement separating Workshop LMS and ILM stun |
| `CLM-D04-LM-003` | OBJECTIVE | VERIFIED (SDK helper/test only) | ILM charge and Chrono Jump model |
| `CLM-D04-LM-004` | OBJECTIVE | VERIFIED (SDK helper/test only) | Dropped Land Mine damage helper |

## 5. What is and is not established

**VERIFIED**
- GRE declares the LandMine and LandMineController methods listed above.
- The SDK catalog describes Space Displacer conversion into ILMs and provides rarity values/cap.
- The SDK has separate ILM charge and dropped-landmine damage helpers.
- The inspected SDK test asserts the Chrono Jump no-hit versus hit behavior of its own helper.

**EXTERNAL-UNVERIFIED**
- Space Displacer mines do not trigger the ordinary Land Mine Stun card.
- ILM stun requires the separate ILM stun lab.

**NOT ESTABLISHED**
- Native LandMine / LandMineController runtime behavior.
- Land Mine Decay timer semantics and units.
- Exact mine target selection, movement, collision, explosion, and radius behavior.
- Whether each mine type shares any damage or stun sub-pipeline.
- Exact game version represented by the GRE metadata and SDK helpers.

## 6. Next evidence needed

1. Find version-scoped evidence for the Land Mine Decay lab and mine timer behavior.
2. Find reproducible tests distinguishing Workshop Land Mine Stun from ILM stun.
3. Inspect any public repository or SDK source that provides actual event-level behavior rather than aggregate calculators.
4. Record any disagreement as separate source claims; do not merge the two mine types by assumption.

## 7. GKB decision

**HOLD — NO GKB PROMOTION.**

Keep Workshop Land Mines, Space Displacer-converted ILMs, and native ILM UW as distinct subjects until a version-matched source supports their relationships.
