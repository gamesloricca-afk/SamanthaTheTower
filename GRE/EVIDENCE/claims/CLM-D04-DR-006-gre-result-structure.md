# Claim — DamageReductionResult declaration and contribution fields

- Claim ID: `CLM-D04-DR-006`
- Domain: 04 — Combat Mechanics; 02 — Enemies
- Subject: Enemy damage-reduction result structure
- Claim type: `OBJECTIVE`
- Verification status: `VERIFIED` (GRE metadata declaration only)
- Game version/build: UNKNOWN
- Source ID(s): `SRC-GRE-METADATA-V39`
- Source version/ref: `TestAccount`; GRE metadata format v39
- Publication/update date: UNKNOWN
- Access date: 2026-11-27

## Claim content

GRE declares `DamageReductionResult` (type index 309 in the Domain 02 export) with 11 fields: `finalDamage`, `chainThunderBlocked`, `chronoFieldBlocked`, `flameBotBlocked`, `magicOrbBlocked`, `primordialCollapseBlocked`, `defensePercentBlocked`, `defenseAbsoluteBlocked`, `bastionBlocked`, `bastionPoolUsed`, and `incomingDamage`.

## Evidence

- Exact location: `GRE/1/02_enemies.json`, type `DamageReductionResult`, type index 309.
- Supporting metadata: field indices 2826–2836; tokens `0x04000b0b`–`0x04000b15`; recorded offsets 7407088–7407188.
- The same type is also present in the Domain 04 export; this is an overlapping domain export, not independent corroboration.
- Evidence form: extracted type/field declarations.

## Limitations

This does not establish field semantics beyond their declared names, whether blocked values are mutually exclusive or overlapping, the order of operations, the calculation formula, units, caps, or runtime conditions. The field listing order is not evidence of execution order.

## Samantha interpretation

The structure provides a direct map of named damage-result categories and is a useful anchor for further method-body investigation. No damage-reduction order is inferred.

## Related records

- Related claim IDs: `CLM-D04-DR-007`, `CLM-D04-DR-008`
- Conflict ID(s): `CNF-D04-DR-001`
- Relationship(s): `DERIVED_FROM` is not asserted; shared metadata package only.
- GKB staging decision: hold
