# SDK Assertion Automatic Triage — 2026-11-28

**Branch:** `GKB`  
**SDK:** `thetowersdk@0.14.1`  
**Workflow:** [Run 46086705620](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/46086705620)  
**Artifact:** [samantha-sdk-assertion-triage-46086705620](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/46086705620/artifacts/15239810163)

## Result

**VERIFIED — automated structural/provenance triage passed.**

| Result | Count |
|---|---:|
| SDK assertions examined | 1,618 |
| Automatically triaged; no manual exception | 1,550 |
| Manual exception queue | 68 |
| Parent nodes represented | 316 |
| Canonical claims created | 0 |
| Automatic approvals | 0 |
| Canonical writes | 0 |

The 68 exception records contain 50 unresolved source-origin occurrences and 19 source-marked contradiction occurrences. These issue counts overlap by one record; they are not 69 distinct records.

## Policy

- A record passing triage is labelled `STRUCTURE_VALIDATED_EXTERNAL_UNVERIFIED`.
- This means its basic structure and required provenance fields passed the deterministic checks. It does **not** mean its game-mechanics content is true.
- Missing assertion-level verification is preserved as missing and does not inherit the parent node's verification. Missing verification alone does not create a manual exception.
- SDK labels such as `verified_here`, `unverified`, and `contradicted` remain source metadata. They are not mapped to Samantha verification statuses.
- Source origin `game` remains unresolved where the SDK schema mismatch applies.
- All original assertions remain preserved in the staging payload.
- Only structural, provenance, classification, and source-contradiction exceptions enter the manual exception queue.
- Fanmade source disagreements remain separate; no source is selected as the winner.

## Output files

The workflow artifact contains:

- `sdk-assertions.json` — original 1,618 staged assertions and their source records.
- `sdk-assertion-triage.json` — triage result for every assertion, grouped by parent node.
- `sdk-assertion-manual-review-queue.json` — only the 68 exception records.

## Limits

This workflow processes TheTowerSDK knowledge-graph assertions. It is **not** the GRE reverse-engineering metadata inventory. GRE structural metadata has a separate source snapshot and validation path. Neither this report nor a successful triage establishes runtime behavior or verifies mechanics.
