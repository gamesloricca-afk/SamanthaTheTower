# SDK Origin Compatibility Review

- Review date: 2026-11-27
- Source package: `thetowersdk@0.14.1`
- SDK graph export: `thetowersdk/knowledge-graph.json`
- SDK graph generated for: `2026-10-15`
- Validation report version: `1.5.0`
- Review status: `CONFLICTING`
- Workflow execution: `PASSED`
- SDK JSON Schema validation: `FAILED`
- Origin evidence integrity: `PASSED`

## Finding

The pinned SDK knowledge graph contains the raw origin value `game`, but the SDK JSON Schema origin enums do not allow it. The inspected TypeScript `ClaimOrigin` declaration does allow `game`. The graph therefore disagrees with the JSON Schema while the TypeScript declaration agrees with the observed graph value.

The latest validation run records 70 schema validation errors, all attributable to this known origin mismatch. The report marks `expectedOriginConflictsOnly: true`; this means the validation execution completed and isolated the expected conflict. It does **not** mean the SDK JSON Schema validation passed.

## Observed graph origin counts

| Raw origin | Occurrences |
|---|---:|
| `code` | 1,522 |
| `wiki` | 884 |
| `user` | 82 |
| `game` | 70 |
| `save` | 10 |
| `sheet` | 11 |

The counts above are source observations, not Samantha-approved source classifications.

## Schema and TypeScript vocabularies

The JSON Schema enum allows:

- `in-game`
- `game-files`
- `code`
- `wiki`
- `user`
- `save`
- `external-repo`
- `sheet`

The inspected TypeScript declaration allows:

- `code`
- `external-repo`
- `game`
- `save`
- `sheet`
- `user`
- `wiki`

The observed graph values are:

- `code`
- `game`
- `save`
- `sheet`
- `user`
- `wiki`

The schema additionally lists `in-game`, `game-files`, and `external-repo`, which are not observed in this graph snapshot. Their presence in the schema does not prove they are used by this graph.

## Samantha handling

1. Preserve every raw `game` value and its original source path.
2. Keep the 70 occurrences unresolved; do not rewrite them to `in-game`, `game-files`, or another origin.
3. Do not infer Samantha `sourceType` from an SDK origin label.
4. Keep SDK verification labels separate from Samantha verification statuses.
5. Keep this compatibility issue visible until the SDK source schema/declaration mismatch is addressed or a documented adapter policy is approved.
6. Do not treat schema compatibility as evidence that a game mechanic is factually correct.

## Limitations

- The latest run is a structural compatibility inspection, not a game-mechanics verification.
- JSON Schema `$ref` references are not resolved by this inspection.
- TypeScript parsing is limited to supported named string-literal union declarations.
- The review does not assess SDK redistribution rights.
- No canonical GKB claim or relationship is created by this review.

## Source run

[GitHub Actions run 45952388239](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45952388239)

The full machine-readable validation result is stored in `GKB/reports/sdk-knowledge-graph-validation-report.json`.
