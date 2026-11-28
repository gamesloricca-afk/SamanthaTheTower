# GRE review workspace

This directory is reserved for reviewer-authored GRE decisions. The generated staging envelope and review packet remain reproducible from the pinned snapshot and are uploaded as CI artifacts.

## Review flow

1. Download `gre-staging.json` and `gre-review-packet.md` from the latest successful GRE staging workflow artifact.
2. Inspect each claim's source records independently. For an open conflict, compare each linked claim/source statement separately. Do not rank fanmade sources or silently select a winner.
3. Use the CLI from `GKB/runtime`:

   ```sh
   npm run review:gre -- list ../staging/gre-import/gre-staging.json
   npm run review:gre -- show ../staging/gre-import/gre-staging.json <stagingId>
   npm run review:gre -- decide ../staging/gre-import/gre-staging.json ../staging/gre-review/decisions.jsonl <stagingId> DEFER <reviewer> YYYY-MM-DD "Reason for deferral"
   ```

4. For `APPROVE`, supply a complete canonical mapping JSON as the final CLI argument. The CLI validates the canonical preview against the existing GKB claim schema before appending the decision. An approval creates no canonical file.

   Reviewer-authored source attribution overrides belong inside that canonical JSON as `sourceTypeOverrides`, keyed by the exact source IDs.

5. Commit the append-only `decisions.jsonl` to the integration branch so the reviewer, date, note, and each decision revision remain traceable in Git history.

## Decision log rules

- Allowed decisions: `APPROVE`, `REJECT`, `DEFER`.
- Each invocation appends one JSON object; it does not rewrite prior entries.
- When a record has multiple decisions, the last appended decision is the current queue state. Earlier decisions remain in the log.
- `GRE_CONFLICT` envelopes cannot be approved as canonical claims.
- An approval for a claim linked to an open conflict must include reviewer-authored conflict metadata.
- No decision automatically writes to `GKB/domains/`.
- Keep `sourceType` as `UNKNOWN` unless the reviewer has evidence to classify it.

Do not store account-specific data here. This workspace is only for universal game evidence and its review history.

## Automatic checks vs. manual review

Automated integrity/shape checks validate the pinned source snapshot, metadata structure, references, and provenance. They do not establish game-mechanics truth.

- Unknown metadata keys are preserved and reported; they are not silently discarded or interpreted.
- The human review queue is for game-knowledge claims and interpretations, not for confirming every extracted metadata entry.
- A successful structural check does not establish that a method executes or that a mechanic behaves as described.
- Conflicting fanmade statements remain separate; no source is ranked or selected.

## GRE structural method search

The structural inventory workflow builds a searchable index over all method declarations and exact references from the pinned GRE claim notes.

```sh
node GKB/adapter/gre-structural-lookup.mjs search <artifact-directory> CalculateDamageReductionResult
node GKB/adapter/gre-structural-lookup.mjs search <artifact-directory> damage enemies
```

The index and claim links are navigation aids only. They do not prove execution, data flow, call order, or mechanic behavior.

## GRE metadata explorer

```sh
node GKB/adapter/gre-metadata-explorer.mjs domains <artifact-directory>
node GKB/adapter/gre-metadata-explorer.mjs types <artifact-directory> 04_combat_mechanics
node GKB/adapter/gre-metadata-explorer.mjs type <artifact-directory> 314
node GKB/adapter/gre-metadata-explorer.mjs method <artifact-directory> 0x060008f8
node GKB/adapter/gre-metadata-explorer.mjs claim <artifact-directory> CLM-D04-DR-007
node GKB/adapter/gre-metadata-explorer.mjs search <artifact-directory> damage 04_combat_mechanics
```

The explorer reads local JSONL artifacts. Ambiguous names return candidates; claim references are navigation-only. Structural metadata remains `EXTERNAL-UNVERIFIED`.



### Pinned SDK evidence source

The CI workflow checks out the SDK staging adapter and registry from GKB commit `70598235b4ac2fc8783d1a051736fdd17e3aaf53`. It installs the exact lockfile dependencies, stages the pinned `thetowersdk@0.14.1` knowledge graph, and runs SDK assertion triage before building the combined index. The SDK source checkout is read-only and isolated from this branch's files.

The resulting evidence index includes SDK assertion records and the original source assertions. Each SDK assertion is joined to its triage record by exact `stagingId`; the index exposes its disposition, issue codes, informational flags, and whether manual review is required. The aggregate triage counts are also included. SDK labels such as `verified_here`, `unverified`, and `contradicted` remain source labels; every indexed SDK assertion remains `EXTERNAL-UNVERIFIED` from Samantha's perspective. Structural triage is not mechanics verification.

The workflow also preserves the SDK staging report and manual exception queue as separate artifacts. A missing or duplicate triage record is not guessed or synthesized. It does not approve the 1,618 assertions or write them into canonical GKB domains.

## Cross-source GRE Evidence Navigator

The navigator searches supplied GRE claim staging, TheTowerSDK assertion staging, and GRE structural inventory without merging their conclusions.

```sh
# Build an index using any available input artifacts
node GKB/adapter/gre-evidence-navigator.mjs build \
  --out evidence-index.json \
  --gre-staging path/to/gre-staging.json \
  --sdk-assertions path/to/sdk-assertions.json \
  --sdk-triage path/to/sdk-assertion-triage.json \
  --gre-dir path/to/gre-structural-inventory

# Search all supplied sources
node GKB/adapter/gre-evidence-navigator.mjs search \
  --query "Land Mine Stun" \
  --gre-staging path/to/gre-staging.json \
  --sdk-assertions path/to/sdk-assertions.json

# Filter by source family and domain
node GKB/adapter/gre-evidence-navigator.mjs search \
  --query damage --source GRE_METHOD_DECLARATION --domain 04_combat_mechanics \
  --gre-dir path/to/gre-structural-inventory

# Compare statements linked to a GRE conflict ID
node GKB/adapter/gre-evidence-navigator.mjs compare \
  --conflict CNF-EXAMPLE --gre-staging path/to/gre-staging.json
```

Rules:
- A keyword match is a search result, not proof of semantic equivalence.
- GRE source claims retain their individual source IDs, source references, version context, dates, and limitations.
- SDK source labels remain source metadata; Samantha verification status remains `EXTERNAL-UNVERIFIED`.
- GRE structural declarations remain structural evidence, not mechanics claims.
- Conflict comparison displays linked statements side by side. It never ranks sources or selects a winner.
- The optional derived index preserves the complete upstream record in `rawRecord`.
- No canonical claims, approvals, semantic relationships, conflict resolutions, or canonical writes are produced.
- Wiki, Reddit, and player experiments can be added only when real indexed records and dedicated adapters exist; this navigator does not invent them.
