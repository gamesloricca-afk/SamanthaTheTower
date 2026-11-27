# Cross-Domain Relationship and Dependency Review — Declaration-Level Map

## Purpose and scope

This report follows the complete structural inventories for Domains 01–20 and the cross-domain declaration consistency pass. It records relationships visible in the GRE metadata declarations and distinguishes them from inferred gameplay mechanics.

The review does not promote GKB claims. It does not choose between external fanmade sources; external contradictions must later be presented side by side with their own provenance.

## Relationship classification

- **DIRECT DECLARATION:** a field, method signature, property, enum, or data model explicitly connects two systems.
- **INFERRED / HYPOTHESIS:** names suggest a dependency or operation, but method bodies or independent evidence are needed to establish actual behavior.
- **NOT ESTABLISHED:** the available metadata does not establish the rule, formula, order, cap, or runtime effect.

The relationship vocabulary remains: `GATES`, `SCALES`, `CAPS`, `INDEPENDENT_OF`, `SEPARATE_PURCHASE_FROM`, `DERIVED_FROM`, `MEMBER_OF`, and `APPLIED_BEFORE`. Do not assign one merely because two names appear in the same class.

## Cross-domain relationship map

| Areas | Direct declaration evidence | Relationship assessment |
|---|---|---|
| Main ↔ Lab, Perks, Bots, Modules, Relics, Milestones, Tech Tree, Dissonance | Shared `Main` (#618) declares fields/references named `lab`, `perks`, `bots`, `modules`, `relics`, `milestoneManager`, `techTreeManager`, and `dissonanceManager` in the inspected domain views | **DIRECT DECLARATION:** Main exposes references to these subsystems. No mechanical dependency is implied solely by these fields. |
| PlayerData ↔ progression domains | Shared `PlayerData` (#873) includes saved-data names for research, perks, modules, Bots, Guardians, Vault, Global Presets, Dissonance, Calendar Events, and currency/progression counters | **DIRECT DECLARATION:** account-save schema contains fields for these systems. This is account-data structure, not universal GKB mechanics. |
| Global Presets ↔ Workshop/Cards/Bots/Modules/Guardians | `GlobalPresetManager` (#392) declares context state for Tier, Tournament, and Dissonant contexts and methods `ApplyWorkshop`, `ApplyCards`, `ApplyBots`, `ApplyModules`, and `ApplyGuardians` | **DIRECT DECLARATION:** preset application interfaces span these systems. Exact compatibility/locking rules are **NOT ESTABLISHED** without method bodies. |
| Vault ↔ upgrade stats and groups | `VaultUpgradeData` (#1107) declares `id`, `benefitType`, `dependencyStat`, `requirements`, and `levels`; `VaultGroupData` (#1103) declares `unlockCost`, `requirements`, and `upgrades`; `VaultManager` exposes group/upgrade lock and purchase methods | **DIRECT DECLARATION:** Vault data model includes dependencies and requirements. Exact `GATES` relations, evaluation order, and benefit formulas remain **HYPOTHESIS / NOT ESTABLISHED** without implementations. |
| Vault ↔ respec discounts | Shared `Main` declares `ApplyRespecDiscount(cost, discountId:VaultID)`; VaultID includes respec-discount identifiers for Bot, Workshop, and Guardian | **DIRECT DECLARATION:** respec discount application accepts a VaultID. Exact discount formula and which upgrade affects which respec path require implementation review. A `SCALES` edge is not yet asserted. |
| Modules ↔ combat/stat domains | `ModuleManager` exposes benefit accessors for Attack, Defense, Utility, and Ultimate Weapon stats; `SubstatsCluster` lists corresponding stat identifiers; `ModuleBenefitType` lists arithmetic/display operation categories | **DIRECT DECLARATION:** module effects are organized around these stat categories. Actual `SCALES` relations, stacking order, units, and formulas remain **NOT ESTABLISHED** by declarations alone. |
| Enemy ↔ damage sources and UWs/Bots/Guardians | `Enemy` (#314) declares methods for Projectile, Thorn, Orb, Death Ray, Smart Missiles, Land Mine, Inner Land Mine, Death Wave, Black Hole, Flame Bot, Swamp, Lightning, Guardian Attack, and other damage/reward interfaces | **DIRECT DECLARATION:** Enemy exposes named interaction entry points for these systems. The method names do not prove exact damage sequence, immunity, or applicability to every enemy class. |
| Damage reduction ↔ combat effects | `DamageReductionResult` (#309) contains incoming/final damage and per-source blocked fields; `Enemy` declares `CalculateDamageReductionResult` and `ApplyDamageReductionStats` | **DIRECT DECLARATION:** a damage-reduction result model and related methods exist. Whether calculation is `APPLIED_BEFORE` or after any particular damage source is **HYPOTHESIS** until method bodies are inspected. |
| Dissonance ↔ research and combat categories | `DissonanceManager` (#289) exposes Attack/Defense/Utility/Ultimate Weapon disable flags and boost properties; `DissonanceBoost` (#284) declares research index, wave record, bonus, `GetResearchBonus`, and `CalculateGlobalBonus` | **DIRECT DECLARATION:** Dissonance has category flags and research-linked bonus interfaces. Exact `SCALES` relations and whether boosts stack additively/multiplicatively are **NOT ESTABLISHED**. |
| Event system ↔ Relics/Bots/Synchronicity/shops | `MissionEvent` (#668) declares event relic purchase/claim methods, Bot unlock/upgrade methods, Synchronicity operations, and shop purchase interfaces | **DIRECT DECLARATION:** event subsystem includes these interfaces. Actual purchase prerequisites, price, rotation, and transaction effects require configuration/runtime evidence. |
| Economy ↔ all progression systems | `CurrencyCategory` (#225) includes categories named Vault, Guardian, Module, BotPreset, Synchronicity, EventRelic, DailyMission, Fetch, and other progression actions; `CurrencyAuditEntry` stores currency/category and previous/current values | **DIRECT DECLARATION:** currency audit categories can classify changes by named activity. This does not prove every transaction is logged or that category names encode a purchase dependency. |
| Research ↔ Lab clock/speed-up | `Lab`, `LabClock`, `LabTimeManager`, and `LabSpeedUp` declare research progress, session/offline progress, boost state, and speed-up operations | **DIRECT DECLARATION:** these components expose connected research timing interfaces. Exact offline progression formula, speed-up stacking, and time cap semantics require implementation/configuration. |

## Same-name types and identity handling

The structural pass found several names used by different type indices. Examples include `MissionType` (#236 and #639), `ValueType` (#237 and #640), and `Tab` (#643 and #721). These must remain separate. Do not merge by name alone.

The repeated type-index audit found 97 shared indices with identical full records across domains. This supports treating those domain occurrences as repeated views of the same metadata type, not separate corroborating sources.

## Relationship candidates not yet asserted

The following may become typed graph edges only after method bodies, data tables, or independent source evidence establish the exact relation:

1. Vault requirements/dependencyStat → group or upgrade unlock: candidate `GATES`.
2. Vault discount IDs → respec costs: candidate `SCALES`.
3. Module effects → corresponding combat stats: candidate `SCALES`.
4. Damage reduction calculation → damage application sequence: candidate `APPLIED_BEFORE` or another order, unresolved.
5. Dissonance research bonus → category boost values: candidate `SCALES`.
6. Preset context → system availability/locking: candidate `GATES`, unresolved.

These are **HYPOTHESIS**, not established edges. No relationship is added to GKB by this report.

## Fanmade-source conflict handling

This pass compares the single GRE metadata package. It does not settle disagreements between separate fanmade wikis, spreadsheets, calculators, player tests, or repository versions. When multiple fanmade sources disagree, preserve each claim, source, date, game-version scope, and evidence. Do not automatically rank or select a winner.

## Audit result

- Declaration-level cross-domain map: **COMPLETE** for the selected high-connectivity systems listed above.
- Mechanic-level relationship validation: **INCOMPLETE** where method bodies, data tables, runtime configuration, or independent source comparison are absent.
- Candidate graph edges: **RECORDED AS HYPOTHESES ONLY**; none promoted as established GKB relationships.
- GKB changes: **NONE**.
- Next step: review source-specific decoded constants and targeted method implementations/evidence gaps, then perform the requested GKB re-check only after that review is complete.
