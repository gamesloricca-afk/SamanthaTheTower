# GRE Audit Workspace

This directory contains the staged, source-traceable audit of the existing `GRE/` reverse-engineering package.

## Purpose

Audit the full GRE package slowly and domain by domain before promoting any validated, normalized knowledge into Samantha's GKB. GRE is treated as a source artifact, not as an already verified universal game knowledge base.

## Audit rules

1. Preserve the original GRE files; audit notes are additive.
2. Distinguish direct metadata declarations, decoded candidates, interpretation/inference, and externally corroborated claims.
3. A symbol name, field name, enum label, string literal, or offset is not proof of runtime behavior.
4. Keep source binary identity, metadata format version, and game release version separate.
5. Preserve contradictory fanmade sources side by side; do not silently select a winner.
6. Record unsupported, unresolved, missing, and conflicting information.
7. Do not promote claims to GKB until provenance, scope, version applicability, evidence, and limitations are documented.
8. Do not merge or copy this audit to `GKB` or `main` as part of this phase.

## Current status

- Phase 0 — repository and branch safety: complete.
- Phase 1 — package structure and metadata inventory: initial structural pass complete.
- Phase 2 — domain-by-domain content audit: in progress; Domains 01–02 reviewed.
- Phase 3 — cross-domain relationship and contradiction audit: pending.
- Phase 4 — GKB-ready claim extraction and validation: pending.

See [00_repository_and_source_audit.md](00_repository_and_source_audit.md), [01_domain_inventory.md](01_domain_inventory.md), and [02_domain_01_game_fundamentals.md](02_domain_01_game_fundamentals.md), and [03_domain_02_enemies.md](03_domain_02_enemies.md).
