# Phase 2 — SDK Compatibility Completion

Date: 2026-11-27
Branch: `GKB`
Status: IN PROGRESS — public entry-point smoke test completed; deeper compatibility review remains

## Objective

Verify the pinned external dependency `thetowersdk@0.14.1` against Samantha's Node runtime, confirm documented public entry points resolve from the installed package, inspect the required modules in project order, and record compatibility gaps without modifying or forking the SDK.

## Package and runtime inspection

Verified from the installed package in GitHub Actions:
- Package: `thetowersdk`
- Expected and actual version: `0.14.1`
- License: `MIT`
- Node engine: `>=20`
- Runtime used in CI: Node `20.20.2`
- Runtime dependency: `zod@^4.3.6`
- Public package subpaths were read from the installed `package.json`; the eight roadmap modules below all resolved successfully.

The SDK installation documentation also instructs consumers to pin `0.14.1` exactly and identifies Node 20+ as the runtime requirement. See:
- https://tmrxjd.github.io/TheTowerSDK/docs/install/
- https://tmrxjd.github.io/TheTowerSDK/docs/dependencies/

## Public entry-point smoke test

Added `GKB/adapter/sdk-public-exports-smoke.mjs` and CI script `test:sdk-public-exports`.

The test resolves the installed package's public subpaths from the isolated GKB runtime and imports the following modules in the required order. Export counts are observations from the installed `0.14.1` package, not promises about future SDK versions.

| Order | Module | Import result | Export count |
|---:|---|---|---:|
| 1 | knowledge | PASSED | 379 |
| 2 | data | PASSED | 468 |
| 3 | mechanics | PASSED | 1,469 |
| 4 | wiki | PASSED | 40 |
| 5 | contributions | PASSED | 7 |
| 6 | save | PASSED | 446 |
| 7 | node | PASSED | 4 |
| 8 | charts | PASSED | 88 |

Representative documented exports checked:
- knowledge: `knowledgeFor`, `resolve`, `trapsFor`
- data: `LAB_CATALOG`, `MODULE_TEMPLATES`, `uwStoneChartData`
- mechanics: `computeWaveBaseHealth`
- wiki: `fetchWikiPageAsMarkdown`, `searchWiki`, `WIKI_SOURCES`
- contributions: `CONTRIBUTIONS`, `ATTRIBUTION_LINES`
- save: `readLabsFromSaveRoot`, `listImportableBattleRuns`
- node: `decodePlayerInfoSaveBytesAsync`
- charts: `SHARED_CHART_REGISTRY`, `resolveCanonicalToolDataset`

This test proves the selected subpaths and representative exports resolve. It does not prove every exported function is correct or that every export is suitable for GKB ingestion.

## Knowledge module — initial findings

The pinned package successfully loads:
- `thetowersdk/knowledge-graph.json`
- `thetowersdk/knowledge.schema.json`

The installed graph inspection reports:
- schemaVersion: 1
- graphVersion: 3
- generatedFor: `2026-10-15`
- 29 compartments
- 320 nodes
- 396 edges
- 2,579 origin occurrences

The SDK documentation currently describes 320 mechanics and 398 typed relationships:
- https://tmrxjd.github.io/TheTowerSDK/docs/knowledge/

The installed package smoke test reports 396 edges, while the documentation reports 398 typed relationships. These are not assumed to be equivalent counts; retain the discrepancy for source/version review rather than selecting one value.

The SDK graph's 70 occurrences of origin `game` fail the SDK's own exported JSON Schema enum, which does not include `game`. This is already captured by the compatibility validator as `ORIGIN_GRAPH_SCHEMA_MISMATCH`, with resolution `UNRESOLVED`. The workflow reports the known conflict separately and does not rewrite the SDK data.

Knowledge graph claims, verification labels, and relationships must be inspected before any adapter maps them into Samantha's canonical schema. SDK labels are not automatically equivalent to Samantha's classification or verification statuses.

## Knowledge module — installed graph shape

The read-only shape inspector reports the following for the installed `0.14.1` knowledge graph:
- 320 nodes, 396 edges, 1,618 assertions, 558 node-level source records, and 3 contradiction records.
- Node classification vocabulary: `objective` (310 nodes) and `sentiment` (10 nodes).
- Node verification vocabulary/counts: `verified_here` (275), `unverified` (44), `contradicted` (1).
- Assertion verification counts: `verified_here` (554), `unverified` (266), `contradicted` (1); 797 assertions have no verification field.
- Assertion provenance observed keys: `origin`, `ref`, `readAgainstVersion`, `verifiedAt`.
- All 1,618 assertions have `ref` and `verifiedAt`; 1,504 have `readAgainstVersion`, all observed as `v28.3.0`.
- The SDK schema also permits provenance `sourceVersion` and `section`, but those keys were not present in the inspected assertion provenance records.
- Edge kinds match the eight relationship concepts in the GKB taxonomy, but are lower camelCase in the SDK.

Important interpretation limits:
- SDK node-level `claimType` and verification labels are source vocabulary, not automatically Samantha's final classification/status.
- `verifiedAt` is the SDK record's date field; it is not automatically a publication date or Samantha review date.
- `readAgainstVersion` is preserved as the SDK field. It is not silently renamed to Samantha's `applicableGameVersion`.
- The 797 assertions without a verification field must remain explicitly missing; no default status is inferred from their parent node.
- The staging adapter currently emits one review envelope per node and retains the complete node in `sourceRecord`; it is not a one-record-per-assertion canonical importer.

The SDK knowledge documentation describes source ranking and a `likelyValue` chosen using `authorityRank` when contradictions exist:
- https://tmrxjd.github.io/TheTowerSDK/docs/knowledge/

That ranking is an SDK analysis feature, not Samantha's conflict-resolution policy. Samantha must retain source-specific competing claims and show their differences without adopting `likelyValue` as the factual winner. The SDK graph's three contradiction records are therefore preserved for review, not automatically resolved.

## Module notes and constraints

### data
The SDK documentation describes local typed catalogs for labs, workshop, modules, cards, relics, bots, guardians, ultimate weapons, vault, perks, battle conditions, tiers, milestones, and glossary:
- https://tmrxjd.github.io/TheTowerSDK/docs/data/

Catalogs may be useful external inputs, but imported claims remain `EXTERNAL-UNVERIFIED` until assessed. Keep SDK package version separate from the game version represented by a catalog.

### mechanics
The SDK exposes calculation functions for enemy scaling, damage, ultimate weapons, economy, workshop, bots, guardians, and battle conditions:
- https://tmrxjd.github.io/TheTowerSDK/docs/mechanics/

Export availability is not proof that a formula exactly reproduces the game. The SDK's own accuracy notes and each function's documentation must be inspected before Samantha treats a result as an objective mechanic.

### wiki
The SDK retrieves and reformats community wiki pages. Page results include source identity, resolved title, and source URL; the docs also expose page-edit metadata and attribution helpers:
- https://tmrxjd.github.io/TheTowerSDK/docs/wiki/

Wiki text remains community-authored material. Preserve source attribution, page URL, revision/publication metadata when available, and licensing constraints. Do not silently promote wiki prose to verified mechanics.

### contributions
The SDK exposes contribution and attribution data:
- https://tmrxjd.github.io/TheTowerSDK/contributions/

This is important for preserving credit for community spreadsheets, guides, charts, save mappings, and wiki contributions. Attribution requirements must be checked before redistribution.

### save and node
The SDK documentation limits save reading to the official `tool_export.json` produced by the game's External Tools Export feature. Private save files, encrypted files, and legacy binary saves are unsupported; the SDK does not decrypt them:
- https://tmrxjd.github.io/TheTowerSDK/docs/save/

SJI owns account JSON processing. GKB must not import account-specific records into universal game knowledge. No player save was read by this Phase 2 smoke test.

### charts
The SDK exposes chart registries and dataset resolvers:
- https://tmrxjd.github.io/TheTowerSDK/docs/charts/

Chart datasets may be derived views of SDK catalogs. They should not automatically be treated as independent source confirmation of the underlying catalog values.

## Testing

Latest public-entry-point smoke test:
- GitHub Actions run: https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45936656905
- Result: SUCCESS.
- All eight roadmap modules imported.
- Required representative named exports were present.
- Installed package version and Node runtime matched expectations.

The complete GKB workflow also passed its existing schema, adapter, SDK JSON export, and knowledge graph inspection steps. The known 70-origin schema mismatch remains separately reported.

## Remaining Phase 2 work

1. Inspect the knowledge module's public types, claim shape, provenance fields, verification vocabulary, relationships, and graph query behavior against the installed package files.
2. Inspect data catalogs and representative structures, including module, UW, research, and enemy data; document unknown or version-sensitive fields.
3. Inspect mechanics exports and selected formulas with their declared inputs, units, limits, and accuracy notes. Do not port formulas without evidence.
4. Inspect wiki fetch/cache/source behavior and licensing/attribution.
5. Inspect contributions data structure and required credit text.
6. Inspect save and node entry-point types without reading a personal save; maintain the GKB/SJI boundary.
7. Inspect charts registry and resolver argument/result shapes.
8. Record SDK/package-version compatibility, unsupported exports, and conflicts in a final report before implementing a broader adapter.

## Safety

- TheTowerSDK remains an external dependency pinned to exact version `0.14.1`.
- No SDK fork or source modification was made.
- No bulk import or claim promotion was performed.
- No private save file or decryption was used.
- Work targets branch `GKB` only; `main` and `TestAccount` remain untouched.
