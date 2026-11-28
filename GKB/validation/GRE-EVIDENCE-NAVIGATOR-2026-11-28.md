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


## SDK triage visibility extension — CI pending

The navigator now accepts the SDK triage report through `--sdk-triage` and joins each SDK assertion to its triage record using the exact `stagingId`. Searchable fields include:
- `triageDisposition`
- `triageIssues`
- `triageInformational`
- `manualReviewRequired`

The combined index also carries aggregate triage counts and issue counts. It reports exact-ID linkage totals (`matchedAssertionCount`, `missingTriageRecordCount`, and `unmatchedTriageRecordCount`); an assertion without a matching triage record is explicitly searchable as `MISSING_TRIAGE_RECORD`, never silently treated as triaged. This makes the 68 manual exception records discoverable without treating the other 1,550 structurally triaged assertions as mechanically verified. SDK labels remain source metadata and all SDK assertions remain `EXTERNAL-UNVERIFIED`.

The workflow now passes both SDK assertion staging and triage artifacts to the navigator. The test checks exact-ID joining, issue-code search, manual-review visibility, aggregate exception counts, missing-link reporting, and invalid triage-format rejection.

**Status:** Implementation committed; this extension is not considered verified until the updated GitHub Actions run passes.
