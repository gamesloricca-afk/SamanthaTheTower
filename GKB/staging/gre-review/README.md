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
