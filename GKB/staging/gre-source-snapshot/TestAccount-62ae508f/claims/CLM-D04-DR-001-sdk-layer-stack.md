# Claim — SDK layer-stack helper order

- Claim ID: `CLM-D04-DR-001`
- Domain: 04 — Combat Mechanics
- Subject: SDK `applyDamageReduxLayerStack` mitigation order
- Claim type: `OBJECTIVE`
- Verification status: `VERIFIED` (source-code statement only; not verified as live-game behavior)
- Game version/build: UNKNOWN
- SDK version: `thetowersdk@0.14.1`
- Source ID: `SRC-SDK-THETOWERSDK-0141`
- Source ref: commit `9a95672578fa064d71ddd54fad2ce5027a310b3a`
- Source date: 2026-11-06
- Access date: 2026-11-27

## Claim content

The SDK's `applyDamageReduxLayerStack` applies its configured multiplicative layers in this order: Chain Thunder, Chrono Field, Flame Bot, NMP, Primordial Collapse, Defense %, then Defense Absolute.

## Evidence

- File: `src/mechanics/combat/damage-redux-calculator.ts`
- Function: `applyDamageReduxLayerStack`
- The `moduleLayers` array lists Chain Thunder, Chrono Field, Flame Bot, NMP, and Primordial Collapse; Defense % and Defense Absolute are applied afterward.
- Test: `tests/mechanics/damage-redux-calculator.test.ts` asserts this exact step-key order and checks a numeric example.

## Limitations

This verifies the SDK implementation and its test expectation only. It does not establish that the live game uses this exact order. The SDK source also contains another helper with different inputs and a different declared order; see `CLM-D04-DR-002`.

## Samantha interpretation

Use this as one versioned third-party reference model. Do not promote it as a universal game mechanic without independent evidence.

## Related records

- Conflict: `CNF-D04-DR-001`
- Related claim: `CLM-D04-DR-002`
- GKB staging decision: hold


## Review completion — 2026-11-27

- **SDK implementation verified; live-game mechanic not verified.** Rechecked applyDamageReduxLayerStack and its test in tests/mechanics/damage-redux-calculator.test.ts; the test asserts the emitted step keys and a numeric vector.
- The SDK documents this as a sequential calculator breakdown. Its code also says multiplicative layers commute mathematically and native blocked-damage counters may overlap because they independently reference raw incoming damage.
- This claim records the SDK calculator's step sequence, not native execution order or native counter semantics. Status remains VERIFIED (SDK implementation/test only). GKB: HOLD.