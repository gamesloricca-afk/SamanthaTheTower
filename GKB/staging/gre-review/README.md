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
   
   Reviewer-authored source attribution overrides belong inside that canonical JSON as `sourceTypeOverrides`, keyed by the exact source IDs:
   
   ```json
   {
     "claimId": "YOUR-CANONICAL-ID",
     "domain": "combat-mechanics",
     "subject": "Reviewed subject",
     "claim": "Reviewer-authored claim wording",
     "classification": "OBJECTIVE",
     "verificationStatus": "EXTERNAL-UNVERIFIED",
     "sourceTypeOverrides": {
       "SRC-SDK-THETOWERSDK-0141": "OTHER"
     }
   }
   ```
   
   For a claim linked to a GRE conflict, include `conflict` with the exact source conflict ID, all linked GRE claim IDs in `relatedClaimIds`, and its current status. An open source conflict must remain `OPEN` in the preview.
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

The staging adapter automatically verifies the pinned snapshot identity, source commit, exact file inventory, Git blob hashes, parser shape, known metadata fields, source references, and claim-to-conflict references. These checks do not require a person to reconfirm every metadata field.

- Valid source metadata and structural records are retained with their source provenance after automated integrity/shape checks.
- Unknown metadata keys are preserved and reported; they are not silently discarded or interpreted.
- The human review queue is for **game-knowledge claims and interpretations**, not for confirming that every extracted metadata entry exists.
- A claim can require human review when its meaning, domain mapping, game-version scope, source attribution, or conflict relationship is ambiguous.
- A successful structural check does not establish that a method executes, that a mechanic behaves as described, or that a claim matches live-game behavior.
- The current queue contains 12 claims and 1 conflict envelope (13 records). The 7 source metadata records are parsed separately and are not counted as 7 additional manual claim reviews.

This is a two-level process: automated integrity/structure checks first; focused human review only for semantic claims and genuine exceptions.


## GRE structural method search

The structural inventory workflow also builds a searchable index over all 14,641 method declarations and exact references from the pinned GRE claim notes.

From the repository root, after downloading and extracting the workflow artifact:

```sh
node GKB/adapter/gre-structural-lookup.mjs search <artifact-directory> CalculateDamageReductionResult
node GKB/adapter/gre-structural-lookup.mjs search <artifact-directory> damage enemies
```

The artifact includes:
- `gre-method-search-index.jsonl`: method name, token, offset, owner type, parameters, and overlapping domain memberships.
- `gre-claim-method-links.jsonl`: exact claim-to-method references, including the source claim path and method token.
- `gre-structural-lookup-report.json`: indexed counts and unresolved identifiers.

A claim link is a navigation reference only. It is not a new GKB relationship, proof of runtime execution, or confirmation of a mechanic. Exact tokens are preferred; ambiguous method names are reported rather than guessed. Structural metadata remains `EXTERNAL-UNVERIFIED`, and no canonical claims are created or approved by this workflow.


## GRE metadata explorer

After downloading and extracting the latest successful GRE structural inventory artifact, use the explorer from the repository root:

```sh
# List all domains and their type/method counts
node GKB/adapter/gre-metadata-explorer.mjs domains <artifact-directory>

# List types in a domain
node GKB/adapter/gre-metadata-explorer.mjs types <artifact-directory> 04_combat_mechanics

# Inspect a type and its declared methods
node GKB/adapter/gre-metadata-explorer.mjs type <artifact-directory> 314

# Inspect a method by index, exact token, or unambiguous exact name
node GKB/adapter/gre-metadata-explorer.mjs method <artifact-directory> 0x060008f8

# Find GRE claim notes that explicitly reference a method
node GKB/adapter/gre-metadata-explorer.mjs claim <artifact-directory> CLM-D04-DR-007

# Search method/type names, parameters, tokens, and domain memberships
node GKB/adapter/gre-metadata-explorer.mjs search <artifact-directory> damage 04_combat_mechanics
```

The explorer reads the artifact JSONL locally; it does not access the network or write to canonical GKB. Ambiguous exact names are returned as candidates instead of being guessed. Claim references are navigation-only. Structural metadata remains `EXTERNAL-UNVERIFIED` and does not establish runtime execution or mechanic behavior.
