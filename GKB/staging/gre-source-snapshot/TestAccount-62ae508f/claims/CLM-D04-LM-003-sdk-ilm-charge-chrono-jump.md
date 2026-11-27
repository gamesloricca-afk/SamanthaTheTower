# Claim — SDK Inner Land Mine charge and Chrono Jump helper

- Claim ID: `CLM-D04-LM-003`
- Domain: 04 — Combat Mechanics
- Subject: Inner Land Mine charge growth and Chrono Jump inputs
- Claim type: `OBJECTIVE`
- Verification status: `VERIFIED` (SDK helper and test only; not native runtime verification)
- Game version/build: UNKNOWN in inspected helper source
- SDK version: `thetowersdk@0.14.1`
- Source ID: `SRC-SDK-THETOWERSDK-0141`
- Source ref: commit `9a95672578fa064d71ddd54fad2ce5027a310b3a`
- Source date: 2026-11-06
- Access date: 2026-11-27

## Claim content

The SDK helper models ILM charge as:

`charge = 1 + chargedRatePerSecond × mineAgeSeconds + chronoJumpBenefit × chargedRatePerSecond × timesHitByIlm`

The Chrono Jump contribution is gated by:
- Charged Mines / ILM+ active;
- Chrono Jump lab level above zero;
- at least one hit by the player's own ILM;
- a positive Charged Mines rate.

The SDK helper defines a 25-second ILM mine lifetime and a 37-second cooldown floor. The builder clamps entered mine age to the lifetime.

## Evidence

- File: `src/mechanics/modules/ilm-charge.ts`
- Functions: `computeIlmChargeMultiplier`, `computeChronoJumpLabBenefit`, `computeInnerLandMinesCooldownSeconds`.
- Constants: `ILM_MINE_LIFETIME_SEC = 25`, `ILM_COOLDOWN_FLOOR_SEC = 37`.
- Test: `tests/builders/builders-drops.test.ts`, case “Chrono Jump needs hits, and reports when it got none”.

## Limitations

- This is the SDK's calculator model, not an inspected native runtime method.
- The formula's game-version parity is not established in this investigation.
- The 25-second lifetime and 37-second floor should remain SDK-scoped until independently confirmed for a matching game build.

## Related claims

- `CLM-D04-LM-001`


## Review completion — 2026-11-27

- **SDK helper, builder, and test expectation verified; native runtime not verified.** Rechecked the formula and gates in src/mechanics/modules/ilm-charge.ts: ILM+ active, positive Chrono Jump lab level, at least one ILM hit, and positive Charged Mines rate.
- tests/builders/builders-drops.test.ts tests that Chrono Jump needs hits, ILM+ off contributes nothing, and mine age is capped at the model lifetime. The SDK defines a 25-second mine lifetime and 37-second cooldown floor. These remain SDK model constants without version-matched native confirmation. GKB: HOLD.