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

That ranking is an SDK analysis feature, not Samantha's conflict-resolution policy. CI confirms `findContradictions()` returns three records with `likelyValue` and `authorityRank`. Samantha must retain source-specific competing claims and show their differences without adopting `likelyValue` as the factual winner. The SDK graph's three contradiction records are therefore preserved for review, not automatically resolved.

## Module notes and constraints

### data
The SDK documentation describes local typed catalogs for labs, workshop, modules, cards, relics, bots, guardians, ultimate weapons, vault, perks, battle conditions, tiers, milestones, and glossary:
- https://tmrxjd.github.io/TheTowerSDK/docs/data/

Catalogs may be useful external inputs, but imported claims remain `EXTERNAL-UNVERIFIED` until assessed. Keep SDK package version separate from the game version represented by a catalog.

### data — installed catalog observations

A read-only CI inspection of the pinned package returned these catalog sizes:
- Labs: 234.
- Module templates: 52 (28 marked unique, 24 non-unique).
- Cards: 32.
- Perks: 34.
- Relics: 321.
- Bot upgrade definitions: 5.
- Ultimate Weapon stone chart entries: 9.
- Tiers: 24.
- Milestone reward rows: 1,148.
- Glossary rows: 475.
- Workshop stat definitions: 47.

The package exports `CURRENT_GAME_VERSION` as `v28.3.0`. The knowledge graph's `generatedFor` date is `2026-10-15`, and 1,504 assertion provenance records carry `readAgainstVersion: v28.3.0`.

The current SDK data documentation labels its catalog as Game 29.1:
- https://tmrxjd.github.io/TheTowerSDK/docs/data/

This conflicts with the installed package's `CURRENT_GAME_VERSION: v28.3.0` marker. Do not assume the documentation's Game 29.1 data describes the exact installed `0.14.1` tarball. Preserve both signals until a version-specific comparison establishes the reason.

The GKB unique-module catalog has 28 IDs, and all 28 IDs exist in `MODULE_TEMPLATES` from the pinned package. Comparison results: 27/28 records match name, initials, category, rarity bounds, and rarity bonuses; the sole metadata difference is Gilded Sniper's rarityBonus scale (GKB: 10/20/30/40; SDK: 0.1/0.2/0.3/0.4). The SDK description is a function that renders the fractional values as percentages: 0.1 → 10%, 0.2 → 20%, 0.3 → 30%, and 0.4 → 40%. GKB's effect template appends `%` to its 10/20/30/40 values, so this is an observed representation/unit convention difference (fractional ratio in SDK vs percentage points in GKB), not evidence that either displayed effect is different. Preserve both encodings and make the unit conversion explicit in any future adapter. The SDK description functions also differ in text formatting from the GKB `{value}` templates for 24/28 entries when a sentinel value is inserted; 4 entries match exactly. No catalog values or effect templates have been overwritten.

### Wiki, contributions, save/node, and charts — first-pass inspection

The pinned SDK exposes two wiki sources:
- `fandom` (default).
- `gamevault`.

The source metadata includes API URL, page URL base, search mode, transport, and notes. The wiki API returns source ID, resolved title, source URL, and Markdown; separate APIs expose last-edited metadata and raw wikitext:
- https://tmrxjd.github.io/TheTowerSDK/docs/wiki/

No live wiki request was made in CI. Any later ingestion must preserve page URL, source ID, resolved title, and revision/edit metadata where available. Wiki text remains community-authored and unverified until Samantha assesses it.

The contributions export contains 6 areas, 32 people, and 4 attribution lines in the installed package. The areas cover Effective Paths, save-file mapping, TowerToolkit, community guides, community wikis, and charts. The SDK's contribution documentation explains which community spreadsheets, save mappings, guides, wiki content, and chart datasets it uses:
- https://tmrxjd.github.io/TheTowerSDK/contributions/

The installed package's four attribution lines were inspected and retained verbatim:
1. Effective Paths formulas by Mattew, QuietFanta, Bisse and the Effective Paths maintainers; ported from community spreadsheet v5.11.08.10.
2. Wiki content maintained by contributors to Fandom — The Tower: Idle Tower Defense Wiki and Game Vault — The Tower Wiki and Guides; page URLs link to authors and edit history.
3. Save enum indexes mapped by Bisse; some early game data originates in Skye's TowerToolkit.
4. Contextual knowledge draws on community guides by minionek, McBlue, Evan, DrAudacious, ColbyJack, Kitchen Salt, 1410c, and NanaSeiYuri.

Attribution is a required integration concern, not optional decoration. The package's MIT license does not remove the need to retain source-specific credit or assess any source-specific redistribution constraints.

The save and node public entry points import successfully. The SDK documentation explicitly supports only the game's official `tool_export.json` from External Tools Export; private saves, encrypted files, and legacy binary saves are unsupported, and the SDK does not decrypt them:
- https://tmrxjd.github.io/TheTowerSDK/docs/save/

No personal save was opened. GKB will not own account-specific save processing; this remains SJI's responsibility. The presence of `decodePlayerInfoSaveBytesAsync` in the Node entry point must not be interpreted as support for private or encrypted save formats.

The chart registry contains 48 entries in the installed package. A sample call to `resolveCanonicalToolDataset('bot-upgrades', ['Golden Bot'])` returned a 9-column, 31-row dataset. The chart documentation states 46 datasets in its opening count but later refers to 48 charts:
- https://tmrxjd.github.io/TheTowerSDK/docs/charts/

The installed registry count is 48; the documentation's two counts are retained as a documentation inconsistency, not silently reconciled. A chart dataset is a formatted view of SDK data, not independent confirmation of the underlying game values.

### mechanics
The pinned mechanics entry point imports successfully and exposes 939 function exports. CI executed four documented examples:
- `computeWaveBaseHealth({ tier: 10, wave: 4500 })` → `1.3427574853866112e+24`.
- `computeWaveBaseDamage({ tier: 10, wave: 4500 })` → `110444952250835`.
- `applyWorkshopOvercapMultiplier(100, 7000)` → `195.52428084888697`.
- `sentryProtocolWorkshopOrbFireInterval(2)` → `0.1`.

The SDK documentation describes these formulas and their example inputs:
- https://tmrxjd.github.io/TheTowerSDK/docs/mechanics/

These results verify that selected exports are callable and their documented examples run in the pinned package. They do not establish that every formula exactly reproduces game code. Each formula still needs per-function review of inputs, units, caps, version conditions, and accuracy notes before Samantha stores it as an objective mechanic.

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

Latest full SDK inspection workflow:
- GitHub Actions run: https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45937909936
- Result: SUCCESS.
- All eight roadmap modules imported in order; representative exports and selected behavior checks passed.
- Knowledge graph shape and query behavior, data catalog shapes, selected mechanics examples, unique module comparison, wiki/contributions/save/node/chart structures all inspected.
- Existing GKB schema, adapter, SDK JSON export, and knowledge graph checks passed. The known 70-origin schema mismatch remains separately reported.

## Remaining Phase 2 work

The first-pass public API and structure inspection is complete. The following deeper compatibility work remains before Phase 2 can be closed:

1. **knowledge:** review the full assertion/provenance schema, node-vs-assertion semantics, missing verification fields, contradiction representation, and source-ranking behavior. Define an explicit adapter mapping without adopting SDK `likelyValue`.
2. **data:** inspect source/version metadata for each major catalog; resolve documented-vs-installed game-version differences by retaining both references; formalize unit conventions such as Gilded Sniper's fraction-to-percent representation. Keep catalog fields that are not understood.
3. **mechanics:** review formulas individually where GKB needs them, including input types, units, caps, edge cases, and version conditions. The four smoke-test examples are not a formula validation suite.
4. **wiki:** inspect cache, source fallback, revision lookup, and error behavior. No live fetch or page revision was requested in the current CI inspection.
5. **contributions:** retain the four attribution lines and review any source-specific credit/licensing conditions before redistribution.
6. **save/node:** inspect type declarations and supported official-export root shape only. Do not open player data in GKB or infer private/binary save support.
7. **charts:** inspect registry-wide renderer argument schemas and lookup-table behavior. Keep chart outputs as derived datasets, not independent sources.
8. **compatibility report:** record the unresolved origin mismatch (70 graph occurrences of `game`), documentation/package version discrepancies, and unsupported/unknown fields. Do not patch the external SDK or bulk-import claims.

No broader adapter implementation or bulk catalog import should begin until these compatibility findings are sufficiently documented.
## Safety

- TheTowerSDK remains an external dependency pinned to exact version `0.14.1`.
- No SDK fork or source modification was made.
- No bulk import or claim promotion was performed.
- No private save file or decryption was used.
- Work targets branch `GKB` only; `main` and `TestAccount` remain untouched.
