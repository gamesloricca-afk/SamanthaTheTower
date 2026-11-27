# Unique Module Catalog vs TheTowerSDK Review

- Review date: 2026-11-27
- Repository branch: `GKB`
- Pinned SDK package: `thetowersdk@0.14.1`
- Source workflow: [GitHub Actions run 45957051111](https://github.com/gamesloricca-afk/SamanthaTheTower/actions/runs/45957051111)
- Review status: `COMPLETED — DIFFERENCES PRESERVED`

## Objective

Inspect the existing Samantha Unique Module catalog comparison against the pinned SDK. Separate identifier coverage, metadata differences, and effect-text differences. Do not choose a source as correct or overwrite either source.

## 1. Coverage

The comparison found:

| Measure | Result |
|---|---:|
| Samantha unique-module records | 28 |
| SDK unique-module records | 28 |
| Matched by exact ID | 28 |
| Missing in SDK | 0 |
| Missing in Samantha | 0 |
| Metadata matches | 27 |
| Metadata mismatches | 1 |
| Effect-text literal differences | 24 |
| Exact metadata + effect-text matches | 4 |

All 28 records matched by exact ID. This is identifier coverage, not proof that the source values or descriptions are equivalent.

## 2. One metadata difference: Gilded Sniper

The only metadata mismatch is `rarityBonuses` for `gilded-sniper`.

| Rarity | Samantha catalog | Pinned SDK |
|---|---:|---:|
| Epic | 10 | 0.1 |
| Legendary | 20 | 0.2 |
| Mythic | 30 | 0.3 |
| Ancestral | 40 | 0.4 |

The effect templates also render the supplied values differently:

- Samantha template with `10`: `10% chance`.
- Samantha template with `0.1`: `0.1% chance`.
- SDK description with `0.1`: `10% chance`.
- SDK description with `0.4`: `40% chance`.

**INFERRED:** The two representations appear to use different numeric scales (percentage points versus fractional ratios). The SDK's description function multiplies the supplied ratio into the displayed percentage, while Samantha's template expects the displayed percentage value.

This is a representation/units difference observed in the comparison, not a decision about which source should be changed. The adapter must keep both raw values and their source context. No conversion should be applied silently.

## 3. Effect-text differences

Twenty-four of the 28 matched records produce different literal effect strings when the comparator substitutes the same sentinel value (`123.456`).

Affected IDs:

- `astral-deliverance`
- `death-penalty`
- `havoc-bringer`
- `shrink-ray`
- `anti-cube-portal`
- `negative-mass-projector`
- `space-displacer`
- `sharp-fortitude`
- `orbital-augment`
- `singularity-harness`
- `galaxy-compressor`
- `pulsar-harvester`
- `black-hole-digestor`
- `project-funding`
- `restorative-bonus`
- `om-chip`
- `harmony-conductor`
- `dimension-core`
- `multiverse-nexus`
- `magnetic-hook`
- `primordial-collapse`
- `sentry-protocol`
- `gilded-sniper`
- `tactical-barrage`

The comparison is a strict string comparison. Differences include wording, punctuation, capitalization, and—in Gilded Sniper's case—the numeric representation passed to the description function. A literal mismatch alone does not establish a gameplay-mechanics conflict. Each source string should remain available for side-by-side review.

## 4. Provenance limitation

The Samantha catalog records:

- Source name: `TheTowerSDK`
- SDK package/version: `thetowersdk@0.14.1`
- Source reference: `https://github.com/TmRxJD/TheTowerSDK/blob/main/src/data/modules/templates.ts`
- Source revision: `main`
- Exact source commit: not captured
- Retrieval date: not captured

The catalog itself states that equivalence between the inspected repository `main` source and the pinned npm package `0.14.1` was not independently established.

The comparator reads the pinned npm package `0.14.1`, but this provenance gap means the comparison should not be described as a fully version-matched source-to-source audit until the original catalog's source commit/retrieval details are captured.

## 5. Preservation and decision

- Keep all 28 exact-ID matches as comparison links only.
- Preserve the 24 effect-text differences without rewriting either source.
- Preserve both Gilded Sniper numeric representations and explicitly label the scale inference.
- Do not update `modules-unique.json` from this comparison.
- Do not promote any value to `VERIFIED`.
- Keep the catalog's current `EXTERNAL-UNVERIFIED` status.
- Capture exact source commit and retrieval date for future imports.

No adapter or canonical catalog change is justified by this review alone.

## 6. Test evidence and limitations

The source workflow completed successfully. The unique-module comparison reported `PASSED`; the catalog test also reported schema validation `PASSED`.

This review does not independently validate module effects in-game, determine which fanmade source is correct, or prove that the two source snapshots represent the same game version. The comparison output is a discrepancy report, not a correctness verdict.
