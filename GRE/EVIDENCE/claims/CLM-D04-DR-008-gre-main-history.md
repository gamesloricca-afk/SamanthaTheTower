# Claim — Main and BattleHistory damage-defense bookkeeping declarations

- Claim ID: `CLM-D04-DR-008`
- Domain: 01 — Game Fundamentals; 03 — Battle Conditions; 04 — Combat Mechanics
- Subject: Tower defense values and damage-blocked bookkeeping
- Claim type: `OBJECTIVE`
- Verification status: `VERIFIED` (GRE metadata declaration only)
- Game version/build: UNKNOWN
- Source ID(s): `SRC-GRE-METADATA-V39`
- Source version/ref: `TestAccount`; GRE metadata format v39
- Publication/update date: UNKNOWN
- Access date: 2026-11-27

## Claim content

GRE declares Tower/Main defense-related fields and methods, and a BattleHistoryEntry record containing per-category damage-taken and damage-blocked counters. The Main type declares `defenseAbs`, `defenseRel`, `MAX_DEFENSE_PERCENT`, `protectorDamageReduction`, `bastionPool`, and `bastionPoolMax`; it also declares `ApplyTowerDamage(damage, triggerHitThisWave)`. BattleHistoryEntry declares counters for `defensePercentBlocked`, `defenseAbsoluteBlocked`, `chronoFieldBlocked`, `chainThunderBlocked`, `flameBotBlocked`, `primordialCollapseBlocked`, and `magicOrbBlocked`.

## Evidence

- Exact locations:
  - `GRE/1/01_game_fundamentals.json`, type `Main`, type index 618.
  - `GRE/1/03_battle_conditions.json`, type `BattleHistoryEntry`, type index 619.
- Main fields include `defenseAbs` (field index 5392, token `0x04001511`, offset 7432748), `defenseRel` (index 5393, token `0x04001512`, offset 7432758), and `MAX_DEFENSE_PERCENT` (index 5179, token `0x0400143c`, offset 7430618).
- `ApplyTowerDamage`: method index 4739, token `0x06001284`, recorded offset 3224254, parameters `damage` and `triggerHitThisWave`.
- BattleHistory blocked counters: field indices 6262–6268, tokens `0x04001877`–`0x0400187d`, offsets 7441448–7441508.
- Evidence form: extracted field/method declarations.

## Limitations

The metadata does not establish that `ApplyTowerDamage` calls either Enemy damage-reduction method, nor the order or arithmetic represented by the counters. Counter names do not prove whether values overlap, how they are accumulated, or whether they correspond to a single incoming hit. The field `MAX_DEFENSE_PERCENT` is a declaration name, not a verified numeric cap value in this claim.

## Samantha interpretation

The GRE export exposes a broader bookkeeping surface than the initial Domain 04-only review: Enemy result fields, Main defense state, and BattleHistory counters. These are cross-domain investigation anchors, not proof of a unified runtime pipeline.

## Related records

- Related claim IDs: `CLM-D04-DR-006`, `CLM-D04-DR-007`
- Conflict ID(s): `CNF-D04-DR-001`
- Relationship(s): UNKNOWN
- GKB staging decision: hold
