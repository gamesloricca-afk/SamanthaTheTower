# Claim — SDK dropped Land Mine damage helper

- Claim ID: `CLM-D04-LM-004`
- Domain: 04 — Combat Mechanics
- Subject: SDK `getDropLandmineDamage` formula
- Claim type: `OBJECTIVE`
- Verification status: `VERIFIED` (SDK code and test only; not native runtime verification)
- Game version/build: UNKNOWN in inspected helper source
- SDK version: `thetowersdk@0.14.1`
- Source ID: `SRC-SDK-THETOWERSDK-0141`
- Source ref: commit `9a95672578fa064d71ddd54fad2ce5027a310b3a`
- Source date: 2026-11-06
- Access date: 2026-11-27

## Claim content

The SDK helper defines:
- `scaledBase = min(mineDamage, 100) × 0.01`
- `termA = mineDamageAux × scaledBase + 1`
- `termB = (mineField × 0.01) × (mineScalar × scaledBase) + 1`
- `core = workshopMineBase × storedCoeff`
- result = `core × termA × termB`

A separate helper `dropLandMineDamage` subtracts the lesser of base damage and absorb pool, then multiplies the remainder by an ultimate-module multiplier.

## Evidence

- File: `src/mechanics/combat/land-mines.ts`
- Test file: `tests/mechanics/mechanics.test.ts`, including a test titled “caps mine damage at 100 before 0.01 scale”.

## Limitations

- The names and units of the input values are not fully defined by this helper alone.
- This is an SDK calculator model, not native game code.
- Do not map its fields to GRE fields without a verified adapter mapping.

## Related claims

- `CLM-D04-LM-001`


## Review completion — 2026-11-27

- **SDK damage helper and cap test verified; native parity not verified.** Rechecked getDropLandmineDamage and dropLandMineDamage in src/mechanics/combat/land-mines.ts. The first caps mineDamage at 100 before the 0.01 scale and multiplies its input terms; the second subtracts the lesser of base damage and absorb pool before applying the ultimate-module multiplier.
- tests/mechanics/mechanics.test.ts tests the cap behavior for getDropLandmineDamage. It does not independently test every input term or the separate dropLandMineDamage helper. Input units and native field mapping remain unknown. GKB: HOLD.