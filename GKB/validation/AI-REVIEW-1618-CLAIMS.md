# AI Review — 1,618 SDK Assertions

## Purpose

Let ChatGPT review the 1,618 staged assertions in small, manageable batches. Preserve every original SDK record. This review does not automatically write claims into canonical domain files.

## Simple workflow

1. Read the next 25 pending assertions in staging order.
2. ChatGPT assigns one decision to each assertion.
3. Save the decisions for that batch.
4. Run the existing controlled-import preview for APPROVE decisions only.
5. Continue with the next batch.

At 25 assertions per batch, the full queue is 65 batches (the final batch contains 18).

## Decision rules

- **APPROVE** — the statement is understandable and useful as game knowledge, with enough source context to preserve it. Create the minimum canonical mapping required by the importer.
- **REJECT** — the record is not a useful claim, is malformed beyond recovery, or is an exact duplicate. Give one short reason.
- **DEFER** — meaning, context, domain, version, or evidence is too unclear to decide safely. Give one short reason.

A disagreement between fan-made sources is **not** by itself a reason to REJECT. Keep differing source claims separate and use `CONFLICTING` when both claims are worth retaining. Do not select a winner.

## Keep the review lightweight

- Default to the information already present in the staged assertion and its provenance.
- Do not browse the web for every item.
- Cross-check externally only when a claim is unclear, consequential, numerical, version-sensitive, or explicitly conflicting.
- Do not infer missing values or game versions.
- Do not map SDK verification labels to Samantha verification statuses.
- APPROVE defaults to `EXTERNAL-UNVERIFIED`; use `CONFLICTING` only when conflict details are recorded.
- Keep the review note to one short sentence.
- Preserve the original staging record unchanged.

## Decision output

One JSON decision per reviewed assertion:

```json
{
  "stagingRecordId": "exact-staging-id",
  "decision": "APPROVE",
  "reviewer": "ChatGPT",
  "reviewedAt": "YYYY-MM-DD",
  "note": "Short reason.",
  "canonical": {
    "claimId": "samantha-unique-id",
    "domain": "registered-domain-id",
    "subject": "Claim subject",
    "claim": "Clear claim text",
    "classification": "OBJECTIVE",
    "verificationStatus": "EXTERNAL-UNVERIFIED",
    "sourceName": "TheTowerSDK",
    "sourceType": "UNKNOWN"
  }
}
```

For REJECT and DEFER, omit `canonical`. Keep the exact `stagingRecordId`. Never invent an ID or source detail.

## Batch summary

After each batch, report only:
- batch number and staging ID range;
- APPROVE / REJECT / DEFER counts;
- short list of conflicts or items needing follow-up.

## Safety boundary

A review decision is not an import. The current controlled importer creates a preview only; canonical domain files are not changed. The 25-claim limit applies to each approved import batch.
