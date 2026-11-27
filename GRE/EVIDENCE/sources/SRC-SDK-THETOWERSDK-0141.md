# Source — TheTowerSDK 0.14.1

- Source ID: `SRC-SDK-THETOWERSDK-0141`
- Title/name: TheTowerSDK
- Author/maintainer: TmRxJD
- Source type: Third-party fanmade SDK / TypeScript reference model
- Repository: https://github.com/TmRxJD/TheTowerSDK
- Version: `thetowersdk@0.14.1`
- Inspected commit: `9a95672578fa064d71ddd54fad2ce5027a310b3a`
- Commit date: 2026-11-06
- Package license: MIT (per package.json)
- Node requirement: >=20 (per package.json)
- Game version/build represented by the inspected damage-reduction routines: UNKNOWN
- Access date: 2026-11-27
- Authority assessment: Third-party SDK; useful implementation/model evidence, not developer-official.
- Recency assessment: Commit published 2026-11-06; separate from source authority.

## Relevant locations

1. `src/mechanics/combat/damage-redux-layers.ts`
   - Describes a sequential mitigation model.
   - Its comment states multiplicative reductions (Chain Thunder, Chrono Field, Flame Bot, NMP, Primordial Collapse, and Defense %) apply before flat Defense Absolute.
   - `applyDamageReduxLayerStack` orders the modeled steps as Chain Thunder, Chrono Field, Flame Bot, NMP, Primordial Collapse, Defense %, then Defense Absolute.
   - NMP is capped at 50% in this helper.

2. `src/mechanics/combat/damage-redux-calculator.ts`
   - Implements `applyDamageReduxLayerStack`.
   - Its test file asserts the helper's sequence and checks a numeric vector.
   - It explicitly says its sequential display is not a reconstruction of native blocked-damage counters.

3. `src/mechanics/combat/damage-reduction.ts`
   - Implements a different helper, `computeDamageReductionResult`.
   - That helper applies Defense %, Chrono Field multiplier, Flame Bot multiplier, optional module defense multiplier, optional Rend Armor multiplier, then flat Defense Absolute.
   - This helper's input shape does not include Chain Thunder, NMP, or Primordial Collapse.

4. `src/knowledge/compartments/combat.ts`
   - Contains knowledge prose asserting that Chrono Field, Primordial Collapse, and Flame Bot bypass the 98% Defense % cap and apply after Defense Absolute.
   - Provenance in that file is mixed: wiki and SDK reference model. This is not treated as an official game statement.

5. `src/mechanics/bots/effective-range.ts`
   - Describes Flame Bot reduction as 20% + 3% × level and says it is stored on the enemy during overlap and feeds `CalculateDamageReductionResult`.

## What this source supports

- The SDK contains multiple separately implemented damage-reduction helpers.
- The helpers do not have identical input coverage or identical documented layer semantics.
- The SDK's layer-stack helper has a test asserting its own configured sequence.
- The SDK is a fanmade model. A passing unit test proves the SDK helper matches its test expectation, not that the live game uses that exact order.

## Limitations

- No native game method body was inspected here.
- The SDK's retained native-source hash is an attribution/assertion inside the SDK source; the original native binary and hash were not independently checked in this investigation.
- No game release/build is established for these routines.
- The knowledge compartment and mechanics helpers have different provenance and should not be collapsed into one claim.

## Related records

- Claims: `CLM-D04-DR-001`, `CLM-D04-DR-002`, `CLM-D04-DR-005`, `CLM-D04-LM-001`, `CLM-D04-LM-003`, `CLM-D04-LM-004`
- Conflict: `CNF-D04-DR-001`
