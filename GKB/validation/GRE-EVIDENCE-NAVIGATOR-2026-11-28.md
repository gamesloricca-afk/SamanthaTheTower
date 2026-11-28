# GRE Cross-Source Evidence Navigator — 2026-11-28

**Status:** Implemented on `gre-gkb-integration-design`; integrated CI run pending verification.

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

The dedicated test covers multi-source indexing, source-family filtering, GRE conflict comparison, preservation of separate contradictory statements, exact-ID joining of GRE source catalog records, and rejection of an unsupported GRE staging envelope. CI must pass before this report is considered verified. No canonical claims or writes are permitted.
