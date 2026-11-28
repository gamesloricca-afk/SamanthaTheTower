# GRE Structural Search and Claim References — 2026-11-28

**Status: VERIFIED — automated lookup build and tests passed.**

- Workflow: [Run 46088101868](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/46088101868)
- Artifact: [samantha-gre-structural-inventory-46088101868](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/46088101868/artifacts/15240395379)
- Pinned GRE source commit: `62ae508f3473231b81d27903bdf63e899bb739be`
- Integration branch commit tested: `b20194e533e5005fdb936f5255bc933dd0852088`

## Results

| Check | Result |
|---|---:|
| Method declarations indexed | 14,641 |
| Exact claim-to-method references | 5 |
| Unresolved method identifiers | 0 |
| Canonical claims created | 0 |
| Automatic approvals | 0 |
| Canonical writes | 0 |

The 5 references are generated only when a pinned claim note contains an exact method token or an exact method name. The index includes method name, token, offset, owner type, parameters, and all recorded overlapping domain memberships.

## Artifact files

- `gre-method-search-index.jsonl` — searchable method records.
- `gre-claim-method-links.jsonl` — exact claim-to-method navigation references.
- `gre-structural-lookup-report.json` — counts, unresolved identifiers, and limitations.
- Existing `gre-methods.jsonl`, `gre-types.jsonl`, `gre-domain-memberships.jsonl`, and inventory report remain included.

## Evidence boundary

- These links mean only that a claim note references a matching structural declaration.
- They do not establish method execution, call order, data flow, formula, or runtime mechanic behavior.
- No GKB relationship type was added or inferred.
- Method declarations remain structural metadata with `EXTERNAL-UNVERIFIED` status.
- Ambiguous names are not guessed; unresolved identifiers are reported.
- No canonical GKB claims were created, approved, or written.

The inventory and lookup outputs remain CI artifacts rather than canonical domain imports.
