# Claim — SDK computeDamageReductionResult helper

- Claim ID: `CLM-D04-DR-002`
- Domain: 04 — Combat Mechanics
- Subject: SDK `computeDamageReductionResult` helper sequence
- Claim type: `OBJECTIVE`
- Verification status: `VERIFIED` (source-code statement only; not verified as live-game behavior)
- Game version/build: UNKNOWN
- SDK version: `thetowersdk@0.14.1`
- Source ID: `SRC-SDK-THETOWERSDK-0141`
- Source ref: commit `9a95672578fa064d71ddd54fad2ce5027a310b3a`
- Source date: 2026-11-06
- Access date: 2026-11-27

## Claim content

A separate SDK helper, `computeDamageReductionResult`, applies Defense %, Chrono Field multiplier, Flame Bot multiplier, optional module defense multiplier, optional Rend Armor multiplier, then Defense Absolute.

Its input type does not include Chain Thunder, NMP, or Primordial Collapse.

## Evidence

- File: `src/mechanics/combat/damage-reduction.ts`
- Function: `computeDamageReductionResult`
- Input type: `DamageReductionInput` in `src/mechanics/combat/types.ts`

## Limitations

This helper is not identical to `applyDamageReduxLayerStack`. The two helpers have different input coverage and their code comments describe different model scopes. Do not combine their inputs or infer that they describe one single canonical pipeline.

## Samantha interpretation

This is an internal SDK model-scope difference that requires source-owner clarification or independent evidence before any game-mechanics conclusion.

## Related records

- Claim: `CLM-D04-DR-001`
- GKB staging decision: hold
