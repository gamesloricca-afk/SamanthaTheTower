# Conflict — Damage reduction order relative to Defense Absolute

- Conflict ID: `CNF-D04-DR-001`
- Domain: 04 — Combat Mechanics
- Subject: Whether Chrono Field, Primordial Collapse, and Flame Bot apply before or after Defense Absolute
- State: OPEN — source disagreement preserved
- Game version alignment: NOT ESTABLISHED across all sources

## Claims involved

| Claim | Source | Source statement |
|---|---|---|
| `CLM-D04-DR-001` | TheTowerSDK 0.14.1 layer-stack helper | Chain Thunder, Chrono Field, Flame Bot, NMP, Primordial Collapse, and Defense % are modeled before Defense Absolute |
| `CLM-D04-DR-003` | Fandom Defense Percent | Defense % is before Defense Absolute; Chrono Field, Primordial Collapse, and Flame Bot are after Defense Absolute |
| `CLM-D04-DR-004` | Reddit Damage Order of Interaction | Defense % and Chrono Field, Primordial Collapse, Flame Bot, and Chain Thunder are before Defense Absolute |

## Additional SDK scope note

The same SDK package also contains `computeDamageReductionResult` (`CLM-D04-DR-002`), which applies Defense %, Chrono Field, Flame Bot, optional module defense, and Rend Armor before Defense Absolute. Its input does not include Chain Thunder, NMP, or Primordial Collapse.

This is a distinct helper/model scope, not proof that every listed effect exists in one live-game pipeline.

## Difference classification

- Order: mitigation layer placement relative to flat Defense Absolute.
- Version/context: Reddit post explicitly says updated with v28.3; Fandom extract does not identify a game version; SDK package is v0.14.1 and commit dated 2026-11-06 but its represented game build is unknown.
- Evidence form: SDK source and test; fanmade wiki statement; player-authored Reddit explanation.

## Current assessment

- The Fandom and Reddit statements directly disagree about CF / Primordial Collapse / Flame Bot relative to Defense Absolute.
- The SDK layer-stack model agrees with the Reddit ordering for those layers, but its helper is a third-party reference model, not native developer code.
- The SDK's different helper has a narrower input surface and should not be conflated with the layer-stack helper.
- No winner selected. Authority and recency are recorded separately.

## What would help resolve context (without forcing a winner)

- A dated, reproducible in-game test with controlled incoming damage and known layer toggles.
- A version-matched native implementation or traceable method body.
- A source revision/history showing when each community statement was updated.

## GKB decision

Do not promote a single universal order. If later approved for GKB, preserve the source-specific claims and conflict as linked records.
