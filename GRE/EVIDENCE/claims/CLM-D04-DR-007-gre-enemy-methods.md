# Claim — Enemy damage-reduction methods and source-state declarations

- Claim ID: `CLM-D04-DR-007`
- Domain: 02 — Enemies; 04 — Combat Mechanics
- Subject: Enemy damage-reduction method signatures and contributor state
- Claim type: `OBJECTIVE`
- Verification status: `VERIFIED` (GRE metadata declaration only)
- Game version/build: UNKNOWN
- Source ID(s): `SRC-GRE-METADATA-V39`
- Source version/ref: `TestAccount`; GRE metadata format v39
- Publication/update date: UNKNOWN
- Access date: 2026-11-27

## Claim content

GRE declares `Enemy.CalculateDamageReductionResult(incomingDamage: System.Double)` returning `DamageReductionResult`, and `Enemy.ApplyDamageReductionStats(result: DamageReductionResult)` returning `System.Void`. The Enemy metadata also declares source-state fields including `flameBotDamageReduction`, `boostedFlameBotDamageReduction`, `flameBotModuleDebuff`, `thunderDamageReduction`, `titanShocked`, `boostedTitanShocked`, `enemyInChronoRangeBool`, and `inProtector`.

## Evidence

- Exact location: `GRE/1/02_enemies.json`, type `Enemy`, type index 314.
- `CalculateDamageReductionResult`: method index 2295, token `0x060008f8`, recorded offset 3150934, parameter `incomingDamage`.
- `ApplyDamageReductionStats`: method index 2296, token `0x060008f9`, recorded offset 3150964, parameter `result`.
- Additional declared methods: `GetTitanShockReduction()` (index 2292, token `0x060008f5`, offset 3150844) and `GetFlameBotDamageReduction()` (index 2370, token `0x06000943`, offset 3153184).
- Evidence form: extracted method signatures and field declarations.

## Limitations

No native method bodies or call graph are present in the checked-in GRE artifacts. The declarations do not prove that every listed state field is consumed by `CalculateDamageReductionResult`, nor that Titan Shock, Flame Bot, Chain Thunder, or Protector state participates in the same calculation. They do not establish ordering, formula, or runtime conditions.

## Samantha interpretation

The paired calculate/apply method signatures and contributor-like fields identify concrete targets for deeper reverse engineering. Their actual data flow remains unknown. In particular, `thunderDamageReduction` and `chainThunderBlocked` are distinct names and must not be silently treated as the same mechanic.

## Related records

- Related claim IDs: `CLM-D04-DR-006`, `CLM-D04-DR-008`
- Conflict ID(s): `CNF-D04-DR-001`
- Relationship(s): UNKNOWN
- GKB staging decision: hold
