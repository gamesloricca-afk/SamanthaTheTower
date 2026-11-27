# Claim — SDK combat knowledge prose ordering statement

- Claim ID: `CLM-D04-DR-005`
- Domain: 04 — Combat Mechanics
- Subject: SDK combat knowledge statement for mitigation after Defense Absolute
- Claim type: `OBJECTIVE`
- Verification status: `VERIFIED` (source prose exists; not verified as live-game behavior)
- Game version/build: UNKNOWN
- SDK version: `thetowersdk@0.14.1`
- Source ID: `SRC-SDK-THETOWERSDK-0141`
- Source ref: commit `9a95672578fa064d71ddd54fad2ce5027a310b3a`
- Source date: 2026-11-06
- Access date: 2026-11-27

## Claim content

The SDK's `src/knowledge/compartments/combat.ts` prose says Chrono Field, Primordial Collapse, and Flame Bot bypass the 98% Defense % cap and apply after Defense Absolute.

## Evidence

- File: `src/knowledge/compartments/combat.ts`
- Opening documentation comment describing the two damage-reduction traps.
- Constant: `DAMAGE_REDUCTION_OUTSIDE_DEFENSE_PERCENT`, which lists Chrono Field Damage Reduction, Primordial Collapse, and Flame Bot.

## Limitations

This verifies that the SDK knowledge compartment contains this statement. It does not independently verify the live game's order. The same SDK package's `applyDamageReduxLayerStack` helper places these layers before Defense Absolute.

## Samantha interpretation

Treat this as an internal SDK source disagreement between knowledge prose and a mechanics helper. Preserve both statements. Do not silently choose one or assume the knowledge prose and helper were authored for the same game version/context.

## Related records

- Claims: `CLM-D04-DR-001`, `CLM-D04-DR-002`
- Conflict: `CNF-D04-DR-001`
- GKB staging decision: hold
