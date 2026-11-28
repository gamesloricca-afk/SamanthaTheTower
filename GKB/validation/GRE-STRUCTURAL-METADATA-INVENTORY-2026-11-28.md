# GRE Structural Metadata Inventory — 2026-11-28

**Status: VERIFIED — automated structural inventory passed.**

- Workflow: [Run 46087466040](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/46087466040)
- Artifact: [samantha-gre-structural-inventory-46087466040](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/46087466040/artifacts/15239328535)
- Source repository/branch: `gamesloricca-afk/SamanthaTheTower` / `TestAccount`
- Pinned source commit: `62ae508f3473231b81d27903bdf63e899bb739be`
- Source input: `DOC-20261127-WA0002.bin`
- Metadata format version: `39` (not a game release version)

## Preserved inventory

| Record class | Count |
|---|---:|
| Game type declarations | 1,617 |
| Method declarations | 14,641 |
| Field declarations | 15,513 |
| Property declarations | 2,678 |
| Parameter declarations | 8,374 |
| GRE domains | 20 |
| Domain memberships | 1,059 |
| Distinct type indices across domains | 475 |

All 14,641 method declarations were written to `gre-methods.jsonl`. Type declarations and domain memberships are stored separately. Raw method record hex and all other source method fields are retained; the adapter does not use a field allowlist.

## Automated validation

- Exact pinned source commit checked by workflow.
- Manifest counts checked against parsed source JSON.
- Type, method, field, property and parameter counts reconciled.
- Duplicate type indices and method indices rejected.
- Method token tags and required method record fields checked.
- All 20 domain inventories checked against global type indices and manifest domain counts.
- Repeated domain memberships retained as memberships, not treated as independent evidence.

## Evidence boundary

This import is a structural metadata inventory, not a mechanic-claim import.

- Evidence class: `DIRECT_METADATA_DECLARATION`.
- Verification status: `EXTERNAL-UNVERIFIED`.
- Game release version: unknown.
- Metadata version 39 is not a public game version.
- Method declarations do not prove method bodies, call order, runtime execution, formulas, or game behavior.
- Domain classification is heuristic and overlapping.
- No canonical GKB claims, automatic approvals, or canonical writes were created.
- Original binary is absent from the checked-in source tree; the recorded binary SHA-256 was not independently recomputed by this workflow.

## Artifact contents

- `gre-types.jsonl`
- `gre-methods.jsonl`
- `gre-domain-memberships.jsonl`
- `gre-structural-inventory-report.json`

The workflow artifact is the generated staging output. No generated bulk inventory was committed into canonical GKB domains.
