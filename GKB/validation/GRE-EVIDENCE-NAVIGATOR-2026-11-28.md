# GRE Cross-Source Evidence Navigator — 2026-11-28

**Status:** VERIFIED — integrated CI passed on 2026-11-28.

## Objective

Provide one simple search interface over existing evidence without merging source claims or treating structural metadata as game mechanics.

## Supported inputs

- GRE staging envelope: `SAMANTHA_GKB_GRE_STAGING` (claim and conflict records).
- TheTowerSDK assertion staging JSON: `records[]` from the SDK assertion staging artifact. The integration workflow checks out the SDK staging adapter at pinned GKB commit `70598235b4ac2fc8783d1a051736fdd17e3aaf53`, installs its locked dependencies, stages `thetowersdk@0.14.1`, runs automatic structural triage, and supplies the resulting assertion file to this index.
- GRE structural inventory artifact directory: `gre-types.jsonl`, `gre-methods.jsonl`, and `gre-domain-memberships.jsonl`.

Each input is optional. Only supplied records are indexed. The navigator does not fabricate missing wiki, Reddit, player-test, or SDK/GRE cross-links.

## Commands

```sh
# Build a combined index from any available source artifacts
node GKB/adapter/gre-evidence-navigator.mjs build \
  --out evidence-index.json \
  --gre-staging path/to/gre-staging.json \
  --sdk-assertions path/to/sdk-assertions.json \
  --gre-dir path/to/gre-structural-inventory

# Search across supplied evidence
node GKB/adapter/gre-evidence-navigator.mjs search \
  --query "Land Mine Stun" \
  --gre-staging path/to/gre-staging.json \
  --sdk-assertions path/to/sdk-assertions.json

# Restrict search to a source family or domain
node GKB/adapter/gre-evidence-navigator.mjs search \
  --query "damage" --source GRE_METHOD_DECLARATION --domain 04_combat_mechanics \
  --gre-dir path/to/gre-structural-inventory

# Display source statements linked by a GRE conflict ID
node GKB/adapter/gre-evidence-navigator.mjs compare \
  --conflict CNF-EXAMPLE --gre-staging path/to/gre-staging.json
```

## Evidence handling

- GRE claim statements remain individual entries with source IDs, source references, snapshot commit, game-version context, publication/retrieval dates, source labels, and limitations where available. GRE source IDs are joined to the separate `sources[]` catalog by exact ID; no source is guessed.
- GRE conflict envelopes retain their linked claim IDs. `compare` displays linked claim statements independently and does not select a winner.
- SDK assertions retain the original assertion object and source record; SDK verification labels are displayed as source labels, not Samantha verification statuses.
- GRE type/method declarations remain `EXTERNAL-UNVERIFIED` structural evidence and are not promoted to mechanics claims.
- Search results are keyword matches only. A matching phrase is not proof that two sources describe the same mechanic.
- Unknown source fields remain available in each `rawRecord`.
- Missing sources simply produce no entries; future wiki, Reddit, and player-experiment adapters are not implied to exist.

## Safety boundary

The navigator creates an optional derived search index only. It does not create canonical GKB claims, approve staged records, infer semantic relationships, rank fanmade sources, resolve conflicts, or write canonical domain files.

## Validation

**VERIFIED — GitHub Actions run [46092304888](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/46092304888) passed** on integration branch commit `b1734080b5e7a9412ee8aac49103809d356ad775`.

The workflow checked out these immutable source commits:
- GRE source: `TestAccount@62ae508f3473231b81d27903bdf63e899bb739be`.
- SDK staging adapter/registry: `GKB@70598235b4ac2fc8783d1a051736fdd17e3aaf53`.
- SDK package: `thetowersdk@0.14.1`.

Evidence index generated:
| Source family | Records |
|---|---:|
| GRE claims | 12 |
| GRE conflict envelopes | 1 |
| GRE method declarations | 14,641 |
| GRE type declarations | 1,617 |
| TheTowerSDK assertions | 1,618 |
| **Total** | **17,889** |

SDK staging and triage in this run:
- 1,618 assertions staged from 320 graph nodes.
- 1,550 automatically triaged as structurally valid but still `EXTERNAL-UNVERIFIED`.
- 68 manual exception records (50 unresolved source-origin records and 19 source-marked contradiction records; one record overlaps).
- 797 assertions have no assertion-level verification; this remains missing and is not inherited from the parent node.
- 0 canonical claims, 0 automatic approvals, 0 canonical writes.

The workflow passed the pinned SDK staging adapter test, SDK triage test, GRE staging test, structural inventory test, structural lookup test, metadata explorer test, and evidence navigator test. The combined evidence index was built and uploaded.

Artifact: [samantha-gre-structural-inventory-46092304888](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/46092304888/artifacts/15241532323)  
Artifact size: 3,690,839 bytes  
SHA-256: `4daab502bba60274cf9ea9936909ae99c594f333f195ef8451f39a4ce3074788`

The dedicated evidence navigator tests cover multi-source indexing, source-family filtering, GRE conflict comparison, preservation of separate contradictory statements, exact-ID joining of GRE source catalog records, SDK provenance preservation, and rejection of an unsupported GRE staging envelope.

**Limitations:** This index does not prove runtime behavior, verify mechanics, resolve fanmade disagreements, or promote SDK/GRE material into canonical GKB. Wiki/Reddit/player-experiment sources are only represented where actual GRE source records already exist; dedicated adapters for additional external datasets remain future work.


## SDK triage visibility and linkage — 2026-11-28

**VERIFIED — updated CI passed:** [Run 46112878262, attempt 2](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/46112878262) on integration branch commit `16733a7023a77c142b2ce3b05960b4cb5babf831`.

The workflow passed all steps, including the SDK staging and triage tests, GRE staging, structural inventory, structural lookup, metadata explorer, cross-source evidence navigator, evidence-index build, and artifact upload.

### Verified evidence index

| Source family | Records |
|---|---:|
| GRE claims | 12 |
| GRE conflict envelopes | 1 |
| GRE method declarations | 14,641 |
| GRE type declarations | 1,617 |
| TheTowerSDK assertions | 1,618 |
| **Total** | **17,889** |

The generated artifact was inspected directly after download:

- Artifact: [samantha-gre-structural-inventory-46112878262](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/46112878262/artifacts/15250647718)
- Artifact ID: `15250647718`
- Size: 3,696,589 bytes
- SHA-256: `5a92f7df5c1d61a807acb12c8d012ec2c7f79543a7572728e001879b99232336`
- Evidence index JSON size: 53,011,352 bytes

### SDK triage linkage

- 1,618 SDK assertions indexed.
- 1,618 assertions matched to triage records by exact `stagingId`.
- 0 missing triage records.
- 0 unmatched triage records.
- 1,550 structurally triaged without a manual exception.
- 68 distinct manual-review records preserved in the separate review queue and visible through the evidence index.
- Issue occurrences: 50 `SOURCE_ORIGIN_UNRESOLVED` and 19 `SOURCE_MARKS_ASSERTION_OR_NODE_CONTRADICTED`; one record has both issue codes, so there are 68 distinct exception records, not 69.
- 797 assertions have no assertion-level verification. This remains explicitly missing; it is not inherited from the parent node and does not automatically create a manual exception.
- 0 mechanics verifications, 0 canonical claims, 0 automatic approvals, and 0 canonical writes.

All 1,618 SDK entries have `MATCHED_BY_EXACT_STAGING_ID` linkage in the generated evidence index. The triage summary records `matchedAssertionCount: 1618`, `missingTriageRecordCount: 0`, and `unmatchedTriageRecordCount: 0`. The 68 manual exceptions remain `EXTERNAL-UNVERIFIED`; queue membership indicates a structural/provenance review need, not a mechanics judgment.

### GRE preservation checks

- All 14,641 method declarations and 1,617 type declarations appear in the generated index.
- 12 GRE claim records and 1 GRE conflict envelope remain separate.
- The GRE staging report records 7 sources, 13 pending records, and preservation of 20 raw Markdown source records.
- The structural lookup indexes 14,641 methods and has 5 exact claim-method navigation references with 0 unresolved identifiers.
- Metadata format version 39 remains separate from game release version.
- Structural declarations remain navigation evidence only; no runtime behavior or game mechanics are inferred.

### Safety boundary and limitations

The evidence index is a derived search/navigation artifact. It does not establish game-mechanics truth, rank fanmade sources, resolve conflicts, infer semantic relationships, approve claims, or write canonical GKB domains. All SDK assertions and GRE structural declarations remain `EXTERNAL-UNVERIFIED`.

The 68 manual-review records are preserved separately and searchable through their triage issue codes and `manualReviewRequired` flag. Missing verification remains missing. Future wiki, Reddit, and player-experiment adapters are not implied to exist.

## Concise reviewer-facing output — 2026-11-28

Added `--format text` to the existing navigator CLI while preserving JSON as the default output for scripts and integrations.

- `search --format text` presents each result with its statement, source attribution, game/SDK version where available, Samantha verification status, triage status, and limitations.
- `compare --format text` displays conflict-linked statements separately with source attribution and an explicit no-ranking/no-winner policy.
- `--limit N` controls the maximum number of search results returned (bounded by the existing 500-result limit).
- Tests cover text rendering, manual-review issue visibility, source-separated conflict output, and result limits.
- Usage documented in `GKB/staging/gre-review/README.md`.

**VERIFIED — CI passed:** [Run 46118177134](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/46118177134) on commit `d871f338d24c4bc4ce74941ef397749571dd71d9`. All workflow steps passed, including the evidence navigator test, full 17,889-record index build, and artifact upload.

Artifact: [samantha-gre-structural-inventory-46118177134](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/46118177134/artifacts/15252319320) (3,696,590 bytes; SHA-256 `6129360da867bf48035849431a8eff7f16d30a0d390d73ee45d2c63464bc0ed4`).

This is a local reviewer-facing CLI improvement, not yet a player-facing application or Samantha runtime integration. It does not change evidence verification, canonical GKB claims, source ranking, conflict resolution, or canonical writes.
