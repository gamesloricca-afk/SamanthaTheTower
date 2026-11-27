# GKB–GRE–TheTowerSDK Integration Readiness Audit

- Date: 2026-11-27
- Repository: `gamesloricca-afk/SamanthaTheTower`
- Audit branch: `TestAccount`
- Scope: read-only inspection of the current `GKB`, `TestAccount`, `main`, and `phase3-completion` branches
- Change scope: this report only; no code, schema, source data, canonical claims, or branch history was modified by the audit
- GKB promotion: none

## 1. Executive result

**INFERRED — The fastest path is to reuse the existing GKB Phase 1–3 pipeline and connect GRE Evidence to its review gate. Do not build a second SDK importer or a second staging system.**

The repository already contains most of the proposed acceleration components on branch `GKB`:

- Samantha-owned canonical claim schema and 20-domain registry.
- Exact `thetowersdk@0.14.1` runtime dependency and public-export smoke checks.
- SDK node, assertion, edge, contradiction, and selected catalog staging.
- Persistent immutable snapshots and content-addressed storage.
- Review queue with explicit `APPROVE`, `REJECT`, and `DEFER` decisions.
- Controlled import preview with a maximum batch of 25 claims.
- Schema tests and GitHub Actions workflows.

The missing integration is the controlled handoff from `GRE/EVIDENCE` on `TestAccount` into the existing GKB review workflow. The two branches currently contain different parts of the architecture and are heavily diverged.

## 2. Branch and repository inspection

Observed branch heads at audit time:

| Branch | HEAD |
|---|---|
| `TestAccount` | `2328df2273113bf99f8f8ec33dc2c3a9e3cc9ae7` |
| `GKB` | `f34f5ce93c6396126ab3e9d40045415ebc03b2de` |
| `main` | `a0a92971e846a219d2b514d0c52411c205718269` |
| `phase3-completion` | `8ee5dcfb54460905563c99f56ade0df2a857ff8c` |

Current GitHub compare results:

| Compare | Status | First branch ahead | First branch behind |
|---|---|---:|---:|
| `GKB...TestAccount` | diverged | TestAccount: 256 | TestAccount: 339 |
| `main...GKB` | diverged | GKB: 339 | GKB: 50 |
| `main...TestAccount` | diverged | TestAccount: 255 | TestAccount: 49 |
| `GKB...phase3-completion` | diverged | phase3-completion: 23 | phase3-completion: 2 |

The comparison results establish that the branches are not safe candidates for a blind merge. File-level compare output is subject to GitHub's compare response limit.

PR #1, `Implement Samantha GKB Phase 3A–3E pipeline`, is closed and merged into `GKB`; merge commit: `a8c03c6f822c4e22695a94a21f46390b48abb283`.

**BLOCKED — Do not merge `GKB` into `TestAccount`, or `TestAccount` into `GKB`, as a shortcut.** First prepare a deliberate branch reconciliation plan and inspect the full missing-commit/file sets. `main` remains untouched.

## 3. Existing GKB assets on branch `GKB`

### 3.1 Foundation

**VERIFIED — Present**

- `GKB/schema/claim.schema.json`
- `GKB/schema/canonical-domain-registry.schema.json`
- `GKB/schema/origin-registry.schema.json`
- `GKB/schema/source-origin.schema.json`
- Dedicated SDK staging, review-decision, catalog, edge, and contradiction schemas.
- `GKB/domains/canonical-domain-registry.json`: 20 Samantha-owned domains.
- `GKB/sources/origin-registry.json`
- Governance documents for source conflicts and SDK origin compatibility.

The canonical claim schema supports the project classification and verification vocabularies, provenance, applicable game version, conflicts, related claims, and the eight approved relationship types. It permits unknown additional properties, which helps preserve upstream information.

### 3.2 SDK compatibility and import

**VERIFIED — Existing implementation**

- Runtime package pins `thetowersdk@0.14.1` and `ajv@8.17.1`.
- SDK package requires Node.js `>=20`; recorded CI runtime is Node `20.20.2`.
- The eight roadmap SDK public subpaths were smoke-tested in the required order: knowledge, data, mechanics, wiki, contributions, save, node, charts.
- The installed SDK package is consumed as a dependency; Samantha's adapter code is separate from the upstream SDK.

The public-export smoke test proves the tested subpaths and representative exports resolve. It does not prove every export's behavior or factual correctness.

### 3.3 Staging pipeline

**VERIFIED — Existing Phase 3A–3E implementation**

The latest persistent snapshot pointer references run `45966274655`, retrieved on `2026-11-27`, using SDK `0.14.1`.

| Staged artifact | Records |
|---|---:|
| SDK node envelopes | 320 |
| SDK assertion envelopes | 1,618 |
| SDK edges | 396 |
| SDK contradiction records | 3 (6 source claims) |
| Selected SDK catalogs | 347 across 4 catalogs |
| Pending review queue | 1,618 |

The selected catalogs are Research, Workshop, Cards/Masteries, and Perks. This is not a complete import of every SDK data catalog.

The latest manifest marks all six payloads `UNCHANGED` from the preceding snapshot. Persistent manifests and content-addressed objects already provide a useful basis for change detection.

### 3.4 Review and controlled import

**VERIFIED — Existing safeguards**

- Every staged assertion remains `PENDING` until an explicit review decision.
- Decisions are `APPROVE`, `REJECT`, or `DEFER`.
- Reviewer identity and review date are required.
- Only explicit approvals can enter a controlled import preview.
- Batch size is capped at 25.
- Duplicate IDs, duplicate decisions, unknown staging references, and invalid domains are rejected.
- SDK verification labels are not automatically mapped to Samantha statuses.
- The importer creates a preview; it does not write canonical domain files.

Latest Phase 3 report records 20 integrated pipeline test cases and 5 review-decision schema cases passed. Latest Phase 3 workflow run `45966274655` completed successfully. No real SDK claims were approved or imported; the queue contains 1,618 pending entries.

## 4. Existing GRE assets on branch `TestAccount`

**VERIFIED — Present**

- GRE structural exports cover all 20 game domains.
- GRE audit records include the domain inventories and cross-domain declaration/relationship reviews.
- `GRE/EVIDENCE/` has source, claim, conflict, domain, template, and report areas.
- The current evidence workspace contains 12 source-linked claims in D04-01 and D04-02.
- One source conflict remains open: `CNF-D04-DR-001` (Damage Reduction order).
- The 12 claims have completed source-audit review, but some underlying gameplay propositions remain unverified.
- No GRE claim has been promoted to canonical GKB.

The GRE evidence rules correctly distinguish metadata declarations from runtime behavior, preserve competing source reports, keep game version separate from SDK and metadata versions, and prevent account-specific data from becoming universal knowledge automatically.

## 5. Integration gaps

### GAP-1 — GRE evidence is not connected to the GKB review queue

**VERIFIED — Branch/tree finding**

The current `TestAccount` tree contains GRE but no `GKB/` directory. The current `GKB` tree contains GKB but no `GRE/EVIDENCE/` workspace. No existing adapter was found that imports GRE claim/source records into the GKB staging/review-decision format.

This is the main integration gap.

### GAP-2 — Canonical claim population remains sparse

**VERIFIED — Branch/tree and report finding**

The GKB domain registry has 20 domains, but the inspected `GKB/domains/` collection contains the registry and a unique-module catalog rather than a populated canonical claim collection. The two mechanics documents are prose drafts, not schema-validated canonical claim records. Phase 3 reports zero real canonical imports.

The registry and staging counts must not be presented as completed canonical knowledge coverage.

### GAP-3 — SDK origin/schema mismatch remains unresolved

**VERIFIED — Existing compatibility report**

The SDK graph contains 70 occurrences of raw origin `game`, while the SDK JSON Schema enum rejects that value and the inspected TypeScript declaration permits it. The validator records 70 affected locations under one compatibility conflict.

The latest GKB origin workflow completed successfully, but the machine-readable report still records:
- workflow execution: `PASSED`;
- SDK JSON Schema validation: `FAILED`;
- origin evidence integrity: `PASSED`.

A successful workflow here means the known incompatibility was detected and reported; it does not mean the upstream schema validation passed. Keep the raw `game` values unchanged and unresolved.

### GAP-4 — Existing SDK contradictions must remain source-separated

**VERIFIED — Existing GKB re-check report**

Three SDK source disagreements are already staged:

| Subject | SDK code report | SDK wiki report |
|---|---|---|
| Module slot 8 unlock level | 241 | 242 |
| Perk wave requirement application | multiply | add |
| Protector penalty percent | 30 | 60 |

Preserve both reports and their source metadata. Do not select a winner using SDK `likelyValue`, `authorityRank`, or repetition.

### GAP-5 — GRE source records need an explicit bridge mapping

**INFERRED — Required design work**

GRE's Markdown source/claim records and GKB's canonical claim/review schemas are different record types. A bridge must explicitly map:
- GRE claim identity and domain;
- claim text and classification;
- current verification status;
- each source reference and source type;
- game version, source version, SDK version, publication date, retrieval date, and review date as distinct fields;
- evidence locations, limitations, and conflict links.

Unknown fields must be retained in a raw source record or extension object. The bridge must not infer missing dates or versions, translate legacy labels automatically, or promote a claim simply because it was reviewed in GRE.

## 6. Recommended integration design

**INFERRED — Lowest-duplication architecture**

Reuse the existing GKB Phase 3 pipeline. Add a separate GRE evidence staging adapter; do not create a second canonical schema, second review queue, or second persistent snapshot mechanism.

Suggested flow:

1. Read GRE source and claim records from a pinned `TestAccount` commit.
2. Validate GRE record structure and required identifiers.
3. Create immutable GRE source/claim staging envelopes, preserving the complete original record and exact file/line references.
4. Map only unambiguous fields into GKB's reviewable claim format.
5. Place each mapped record into the existing review queue as `PENDING`.
6. Require explicit `APPROVE`, `REJECT`, or `DEFER` decisions.
7. Use the existing controlled importer for small approved batches.
8. Keep source-specific conflicting claims separate; a conflict does not require a winner.
9. Generate an import report listing mapped, unmapped, rejected, pending, conflicting, and unknown fields.

SDK and GRE should be independent staging sources that converge only at the review layer:

- SDK adapter -> SDK staging -> review queue.
- GRE adapter -> GRE staging -> review queue.
- Both -> existing controlled import preview -> canonical GKB only after approval.

Do not make GRE a dependency of the SDK adapter, or vice versa.

## 7. Safe implementation sequence

1. **Branch reconciliation plan:** identify the intended development integration base and inspect all divergence before any merge or cherry-pick.
2. **Schema crosswalk:** document GRE-to-GKB field mapping and unmapped fields without writing canonical data.
3. **GRE staging adapter:** implement read-only conversion to a dedicated staging envelope.
4. **Fixture tests:** test the existing 12 GRE claims, source conflicts, missing version/date fields, legacy statuses, unknown properties, and duplicate identifiers.
5. **Review-queue integration:** feed GRE staging IDs into the existing review queue without auto-approval.
6. **Synthetic controlled-import test:** verify an explicitly approved test claim appears only in the import preview and remains `EXTERNAL-UNVERIFIED` unless the reviewer explicitly supplies sufficient evidence/status.
7. **CI:** run GRE adapter and existing GKB Phase 3 tests together after the branches are safely reconciled.
8. **Owner-approved real import:** only after review and explicit Project Owner approval.

## 8. Non-goals and safety

- No merge or rebase was performed.
- No changes were made to `main` or the `GKB` branch.
- No canonical claim was created or promoted.
- No SDK origin was normalized.
- No SDK or community contradiction was resolved.
- No account-specific save or experiment data was imported.
- No game-mechanic correctness was inferred from a passing structural/CI test.

## 9. Audit conclusion

**VERIFIED:** GKB Phase 1–3 already supplies most of the reusable infrastructure needed to accelerate ingestion and controlled review.

**VERIFIED:** GRE has a source-linked evidence workflow and 20-domain structural material, but it currently lives on a separate, heavily diverged branch.

**INFERRED:** The highest-value next development task is a small, read-only GRE-to-GKB staging adapter plus a field crosswalk. It should reuse GKB's existing review queue and controlled importer rather than rebuilding those components.

**BLOCKED:** Implementing that bridge directly across the current branches is not safe until the branch divergence and intended development base are reconciled. Do not perform a blind merge.

## References

- GKB branch: https://github.com/gamesloricca-afk/SamanthaTheTower/tree/GKB
- TestAccount branch: https://github.com/gamesloricca-afk/SamanthaTheTower/tree/TestAccount
- GKB README: https://github.com/gamesloricca-afk/SamanthaTheTower/blob/GKB/GKB/README.md
- GKB Phase 1 audit: https://github.com/gamesloricca-afk/SamanthaTheTower/blob/GKB/GKB/validation/PHASE-1-AUDIT.md
- GKB Phase 2 SDK compatibility: https://github.com/gamesloricca-afk/SamanthaTheTower/blob/GKB/GKB/validation/PHASE-2-SDK-COMPATIBILITY.md
- GKB Phase 3 completion report: https://github.com/gamesloricca-afk/SamanthaTheTower/blob/GKB/GKB/validation/PHASE-3-COMPLETION-REPORT.md
- GKB post-GRE re-check: https://github.com/gamesloricca-afk/SamanthaTheTower/blob/TestAccount/GRE/AUDIT/49_gkb_post_gre_recheck.md
- GRE Evidence workspace: https://github.com/gamesloricca-afk/SamanthaTheTower/blob/TestAccount/GRE/EVIDENCE/README.md
- PR #1 (merged): https://github.com/gamesloricca-afk/SamanthaTheTower/pull/1
