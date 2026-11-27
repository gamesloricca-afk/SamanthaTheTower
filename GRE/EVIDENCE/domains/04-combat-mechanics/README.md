# Domain 04 — Combat Mechanics Evidence Investigation

- Workspace: `GRE/EVIDENCE/domains/04-combat-mechanics/`
- Domain source: `GRE/1/04_combat_mechanics.json` and `GRE/1/04_combat_mechanics.md`
- Existing content review: `GRE/AUDIT/05_domain_04_combat_mechanics.md`
- Structural inventory: `GRE/AUDIT/43_domain_04_combat_mechanics_complete_structural_inventory.md`
- Source binary SHA-256 recorded in manifest: `8266355fab717d91b51482122b66551afc62502b0f62fd8527930962cbefe81c`
- GRE metadata format: v39 (not a verified game release version)
- Current status: **D04-01 PARTIAL — SOURCE COMPARISON COMPLETE; LIVE-GAME ORDER UNRESOLVED**

## 1. Objective

Investigate selected Combat Mechanics declarations and determine what is supported by additional implementation or community evidence. Preserve the distinction between direct GRE metadata, external source statements, player observations, and Samantha's interpretation.

## 2. GRE declaration-level starting points

The existing GRE content review records these investigation areas:

| Area | GRE declarations / symbols | What GRE establishes | What remains unknown |
|---|---|---|---|
| Projectile | `Projectile`, `ProjectileType`, `ProjectileMovement`, `ProjectileHit`, `OrbProjectileHit` | Target, damage, critical flags, active-time field, projectile type, and named methods are declared | Velocity, retargeting, collision filtering, hit order, damage application, active-time unit |
| Land Mine | `LandMine`, `MineType`, `LandMineController`, `SetExplosionRadius`, `SetTarget`, `DoMoveToTarget`, `Explode`, `DoExplode` | Mine origin flags, AoE/timer fields, movement/target/explosion declarations, MagneticMine spawn method | Damage, radius scaling, timer units, capacity semantics, target selection, Chrono Jump, stun, Space Displacer interaction |
| Damage reduction | `DamageReductionResult`, `Enemy.CalculateDamageReductionResult`, `Enemy.ApplyDamageReductionStats` | Named incoming/final damage and blocked-contribution fields plus calculation/application method declarations | Formula, order, overlap, caps, units, conditions |
| Life-saving | `LifeSaverType`, `Main.ResolveLethalHit`, `TryUseSecondWindSave`, `TryUseDemonModeSave`, `TryUseBastionSave`, `TryUseNukeSave`, `SetLifeSavingOrder` | Save-related declarations, enum labels, lethal-hit resolver and ordering UI declarations | Invocation priority, conditions, selectable entries, actual order semantics |
| Target priority | `TargetPriorityIndexPositions`, `Main.GetTargetPriorityRank`, `Main.ComputeBounceTargets`, `Main.FindNextBounceTarget` | Named priority labels and targeting/bounce method declarations | Sorting algorithm, tie-break, range, eligibility, mode differences |
| Chain Lightning | `Main.ChainLightning`, `GetChainLightningDamage`, `GetChainLightningQuantity`, `GetChainLightningChance` | Relevant methods are declared in metadata | Damage scaling, proc logic, hit count, target eligibility, order |
| Stats and wave scaling | `StatsValueCalculator`, `GetWaveBaseDamage`, `GetWaveBaseHealth` | Named stat and base-wave accessors are declared | Equations, scaling, rounding, caps, units |

These are starting points, not confirmed mechanics. The declaration list and unresolved signatures are detailed in the linked audit reports.

## 3. Investigation order

### D04-01 — Damage reduction pipeline
- Locate implementation-capable sources for the Enemy damage-reduction methods.
- Seek community explanations and test reports for individual contributors.
- Record each contributor's claim separately.
- Do not infer operation order from the field order in `DamageReductionResult`.

### D04-02 — Land Mine behavior
- Separate mine origins/types: Ultimate, EnemyDrop, ExtraSet, MagneticMine.
- Investigate AoE, timer, target movement, explosion, stun, and module-specific behavior as separate claims.
- Search specifically for Space Displacer interactions only after the underlying mine behavior has independent evidence.
- Keep decoded candidate `MAX_MODULE_LANDMINES = 20` unverified until its type, use site, and context are known.

### D04-03 — Life-saving order
- Investigate the lethal-hit path and each save attempt independently.
- Look for source evidence describing order/priority and conditions.
- Do not infer that enum order equals activation order.

### D04-04 — Projectile, targeting, and Chain Lightning
- Separate projectile lifecycle from target selection and damage.
- Preserve unresolved parameter/collection types.
- Do not infer the bounce or chain formula from method names.

### D04-05 — Wave and stat formulas
- Seek version-scoped formulas and test evidence.
- Record units, rounding, caps, and preconditions explicitly.
- Keep GRE numeric defaults as decoded candidates until validated.

## 4. Cross-domain references

- Domain 02 — Enemies: `Enemy`, `DamageSource`, `DamageReductionResult`, enemy status and hit bookkeeping.
- Domain 05 — Ultimate Weapons: UW damage handlers and UW-specific interactions.
- Domain 09 — Modules: module landmine fields and module-specific effects.
- Domain 11 — Bots and Domain 12 — Guardians: bot/guardian effect declarations and TowerBuddy overlap.
- Domain 03 — Battle Conditions: context-specific combat modifiers.

These links are navigation leads only. A relationship becomes a claim only when supported by evidence.

## 5. Source search plan

Prioritize:
1. TheTowerSDK `0.14.1` public exports and relevant source/docs, recording SDK version separately from game version.
2. Public repositories with implementation or data directly relevant to the selected mechanic.
3. Dated wiki/community pages and spreadsheets.
4. Player test reports with reproducible setup, version, sample, and observed result.

Do not assume an SDK helper is native game implementation. Record its own source, provenance, and parity limitations.

## 6. Claim and conflict handling

- Use the templates in `GRE/EVIDENCE/templates/`.
- Create atomic claims in `GRE/EVIDENCE/claims/`.
- Register sources in `GRE/EVIDENCE/sources/`.
- Record disagreements in `GRE/EVIDENCE/conflicts/`.
- Keep claims from different game versions separate.
- If two fanmade sources disagree, preserve both claims and references; do not pick a winner automatically.
- Mark unavailable method bodies or inaccessible sources explicitly.

## 7. D04-01 evidence results

The first investigation has been completed to the source-comparison stage.

- [D04-01 evidence report](../../reports/D04-01_damage-reduction-pipeline.md)
- [SDK source record](../../sources/SRC-SDK-THETOWERSDK-0141.md)
- [Fandom source record](../../sources/SRC-FANDOM-DEFENSE-PERCENT.md)
- [Reddit source record](../../sources/SRC-REDDIT-DAMAGE-ORDER-2025-11-06.md)
- [Open conflict: order relative to Defense Absolute](../../conflicts/CNF-D04-DR-001-defense-absolute-order.md)

Registered claims:
- `CLM-D04-DR-001`: SDK layer-stack helper (verified as SDK code only).
- `CLM-D04-DR-002`: separate SDK damage helper (verified as SDK code only).
- `CLM-D04-DR-003`: Fandom order statement (external-unverified).
- `CLM-D04-DR-004`: Reddit v28.3 order statement (external-unverified).
- `CLM-D04-DR-005`: SDK knowledge prose (verified as source text only).

**Source disagreement:** Fandom places Chrono Field / Primordial Collapse / Flame Bot after Defense Absolute. Reddit places them before Defense Absolute. The SDK's layer-stack helper agrees with Reddit on this placement, but this does not prove live-game behavior. No winner is selected.

## 8. D04-02 evidence results

Initial source comparison is recorded. The investigation remains partial because native mine behavior is not exposed by the inspected GRE text or SDK helpers.

- [D04-02 evidence report](../../reports/D04-02_land-mine-behavior.md)
- [Space Displacer SDK claim](../../claims/CLM-D04-LM-001-sdk-space-displacer.md)
- [Workshop LMS vs ILM stun claim](../../claims/CLM-D04-LM-002-workshop-lms-vs-ilm-stun.md)
- [ILM charge / Chrono Jump SDK claim](../../claims/CLM-D04-LM-003-sdk-ilm-charge-chrono-jump.md)
- [Dropped Land Mine damage SDK claim](../../claims/CLM-D04-LM-004-sdk-drop-landmine-damage.md)
- [Reddit Space Displacer discussion (2026)](../../sources/SRC-REDDIT-SD-LMS-2026-11-13.md)
- [Reddit Space Displacer discussion (2024)](../../sources/SRC-REDDIT-SD-LMS-2024-03-21.md)
- [TowerLoop v29.1.3 guide](../../sources/SRC-TOWERLOOP-SPACE-DISPLACER-V29-1-3.md)

**Preliminary distinction:** ordinary Workshop Land Mines, Space Displacer-converted ILMs, and the Inner Land Mines UW must remain separate subjects. Community sources say the ordinary Land Mine Stun card does not stun ILMs; this remains EXTERNAL-UNVERIFIED.

## 9. Current findings and status

**VERIFIED as GRE declarations only:**
- The domain export contains 79 type records.
- Projectile, Land Mine, damage reduction, life-saving, target-priority, and stat-helper declarations listed above are present in the reviewed metadata.

**NOT ESTABLISHED by current GRE metadata:**
- Runtime damage pipeline and order.
- Land Mine damage, stun, timing, targeting, and module interactions.
- Life-saving activation priority.
- Projectile/bounce/Chain Lightning formulas.
- Wave base damage/health formulas.

**NOT YET DONE:**
- Version-matched native method body / implementation evidence.
- Reproducible player test evidence.
- Confirmation whether differences are caused by game version, hit-path scope, or source interpretation.

## 10. Exit criteria

This domain is ready for evidence review when each selected topic has:
- registered sources with version/date/provenance;
- atomic claims with exact evidence locations;
- source-specific conflicts recorded;
- values/formulas with units and conditions or explicit unknowns;
- clear VERIFIED/USER-PROVIDED/EXTERNAL-UNVERIFIED/HYPOTHESIS/CONFLICTING/SUPERSEDED statuses;
- a report of what remains unknown.

No automatic GKB import.
