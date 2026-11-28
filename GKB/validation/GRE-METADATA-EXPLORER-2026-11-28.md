# GRE Metadata Explorer — 2026-11-28

**Status: VERIFIED — CI passed on the updated integration branch.**

- Workflow: [Run 46089713223](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/46089713223)
- Artifact: [samantha-gre-structural-inventory-46089713223](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/46089713223/artifacts/15240792096)
- Tested branch commit: `41e45e31f82e934e8589e8dbc2828b82a3cca421`
- GRE source commit: `62ae508f3473231b81d27903bdf63e899bb739be`

## Added

- `GKB/adapter/gre-metadata-explorer.mjs`
- `GKB/tests/gre-metadata-explorer.test.mjs`
- GRE review workspace instructions updated with CLI examples.
- CI runs the explorer tests alongside the inventory and structural lookup tests.

## Explorer commands

| Command | Purpose |
|---|---|
| `domains` | List recorded domains with type and method counts |
| `types [domain]` | List types, optionally filtered by domain |
| `type <index-or-name>` | Inspect a type and its methods |
| `method <index-token-or-name>` | Inspect a method |
| `claim <claim-id>` | Show exact method references from a GRE claim note |
| `search <query> [domain]` | Search method/type names, parameters, tokens, and domain membership |

## Evidence and safety boundaries

- Reads the generated artifact JSONL locally; no network access is used by the explorer.
- Ambiguous exact method names return candidates rather than selecting one.
- Claim references remain navigation-only; no semantic GKB relationship is inferred.
- Structural metadata remains `EXTERNAL-UNVERIFIED`.
- No canonical claims, automatic approvals, or canonical writes.
- The explorer is a CLI utility, not yet a player-facing GUI or integrated runtime API.

## Validation

CI completed successfully. The dedicated explorer test passed for domain listing, type filtering and inspection, method lookup by token/name, claim reference lookup, and combined search.
