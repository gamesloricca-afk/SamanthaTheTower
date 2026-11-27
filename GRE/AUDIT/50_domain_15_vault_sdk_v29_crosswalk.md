# Domain 15 — Vault: SDK v0.14.1 Crosswalk and Version Boundary Review

## Objective

Continue the Vault review after the GRE structural inventory by comparing its declaration-level findings with the exact pinned TheTowerSDK snapshot stored in this repository.

This is a source crosswalk, not a gameplay verification or GKB promotion. It keeps the legacy Vault tree, the v29 reference catalog, GRE metadata declarations, and save-parser behavior separate.

## Scope and source identity

- Repository ref: `TestAccount`
- GRE structural source: `GRE/2/15_vault.json`
- GRE audit: [32_domain_15_vault_complete_structural_audit.md](32_domain_15_vault_complete_structural_audit.md)
- GRE source label: `Assembly-CSharp.dll metadata v39`
- GRE source limitation: declarations/signatures/constants only; method bodies/IL are not present.
- SDK snapshot: `TheTowerData/upstream/thetowersdk/0.14.1/`
- SDK package: `thetowersdk@0.14.1`
- SDK package engine requirement: Node.js `>=20`
- SDK license recorded in package metadata: MIT
- SDK author recorded in package metadata: TmRxJD

The SDK package version, the SDK's internal game-version markers, and the GRE metadata label are separate version fields. The GRE label `metadata v39` is not a verified public game release number.

## 1. Legacy Power/Harmony catalog

The SDK snapshot retains the legacy tree API under:

- `src/data/vault/tree.ts`
- `src/data/vault/tree-traversal.ts`
- `src/knowledge/compartments/vault.ts`

The Vault knowledge compartment explicitly associates the legacy game constants with:

- `POWER_TREE_NODE_COUNT = 46`
- `HARMONY_TREE_NODE_COUNT = 48`
- SDK source marker: `v28.3.0`
- Recorded review date: `2026-08-20`

The same file identifies the legacy catalog as `thetowersdk/data vault-tree`, with a recorded review date of `2026-08-17`.

**Assessment:**
- **VERIFIED (repository fact):** the pinned SDK snapshot contains the legacy Power/Harmony catalog and records the above source-version marker.
- **EXTERNAL-UNVERIFIED (game claim):** 46/48 are not a current-v29 node count. The SDK itself labels this legacy data with `v28.3.0`.
- **NOT ESTABLISHED:** whether GRE metadata v39 corresponds to v28.3.0 or another public game release. Do not infer that mapping.

The GRE audit's 46 Power and 48 Harmony decoded candidates therefore remain source-specific metadata observations. They must not be silently reinterpreted as the v29 tree size.

## 2. Separate v29.0.0 reference catalog

The SDK snapshot stores the reworked catalog separately in:

`src/data/generated/vault-v29.generated.ts`

Its header states that the reference is versioned for `v29.0.0`, compiled from a developer-supplied workbook and released upgrade key costs, and cross-confirmed against mytower.app. It also explicitly states:

- `VAULT_V29_VERIFIED = false`
- In-game spot-checks remain pending.
- The generated reference does not establish gameplay behavior.
- The source provenance credits mytower.app.

The accompanying SDK regression test records:
- Harmony: 33 upgrades across 7 categories.
- Power: 47 upgrades across 4 categories.
- Enemy: 4 categories — Simple, Advanced, Elites, and Fleets.
- Harmony and Power costs are represented as per-level arrays.
- The test specifically preserves the corrected Additional Card Slot and Damage cost ladders.
- Two Bastion entries (VaultIDs 1300 and 1310) are excluded from the released buyable catalog in this reference.

**Assessment:**
- **VERIFIED (repository fact):** the pinned SDK contains separate v29 Harmony, Power, and Enemy reference tables and regression tests for their shapes.
- **EXTERNAL-UNVERIFIED (game claim):** the table contents, upgrade costs, category unlock costs, and exclusions remain SDK/community reference data. The SDK's own verification flag is false.
- **NOT ESTABLISHED:** direct in-game verification of every row or equivalence to GRE metadata v39.

The v28.3 legacy tree and v29.0.0 catalog are version-separated references, not competing values that Samantha should resolve by choosing one.

## 3. v29 save-progress reader

The SDK snapshot separates v29 progress parsing into:

- `src/save/vault/v29-progress.ts`
- `src/save/vault/read.ts`
- `src/save/vault/types.ts`

The v29 reader expects a `root.vault` object and reads:
- `UnlockedGroups`
- `UpgradesLevel`

It maps group enum values to category unlock keys and maps VaultID values to catalog level keys. It also:
- Accepts several serialized collection shapes.
- Caps imported upgrade levels to the catalog's maximum level.
- Collects unknown group IDs and unknown VaultIDs as warnings.
- Returns `null` when no v29 Vault progress object is present.

The reader's comments state that the older `harmonyNodesUnlocked` and `powerNodesLevel` arrays remain in the save but are empty after the v29 rework. This is an SDK-reported save-format interpretation, not a conclusion independently proven by the GRE metadata declarations.

The SDK regression test uses a synthetic save object to check group and VaultID mapping. It is a test definition, not evidence that this audit executed the test or validated a real player save.

**Assessment:**
- **VERIFIED (repository fact):** the pinned SDK implements a distinct v29 save-progress reader and warning path for unknown IDs.
- **EXTERNAL-UNVERIFIED (game/save claim):** the described serialized save shape and the claim that legacy arrays are empty after the rework remain SDK-reported behavior.
- **NOT TESTED:** no SDK tests were executed during this audit; no real save file was used for parity testing.

## 4. v29 mechanics helpers and evidence boundary

The SDK snapshot's `src/mechanics/vault/compute.ts` exposes two narrowly scoped helpers:

1. `computeV29VaultDamageBonus`
   - Accepts Damage, Ultimate Damage, or Spotlight Bonus.
   - Uses a 5% per-level fraction for levels 0–5.
   - Requires an explicit policy identifier.
   - Returns `null` for unsupported node names, policy, or level values.
   - Labels Damage and Ultimate Damage as `direct-community`; Spotlight Bonus as `corroborated-community`.
   - Sets `nativeParity: false`.

2. `computeV29VaultFreeUpgradeBonus`
   - Accepts Free Attack Upgrade, Free Defense Upgrade, or Free Utility Upgrade.
   - Uses a 5% per-level relative fraction for levels 0–5.
   - Requires an explicit policy identifier.
   - Labels the result `direct-player-measurement`.
   - Sets `nativeParity: false`.

The constants file attaches Reddit source URLs to both policies. The implementation comments explicitly limit the helpers to these named v29 nodes and distinguish relative fractions from percentage points.

**Assessment:**
- **VERIFIED (repository fact):** these helper functions, guards, confidence labels, policy identifiers, and source URL lists exist in the pinned SDK.
- **EXTERNAL-UNVERIFIED (mechanic claim):** the 5% coefficients and described stacking interpretation are based on community/player evidence, not native parity.
- **NOT ESTABLISHED:** the helpers do not establish formulas for all Vault nodes, respec behavior, purchase eligibility, or the full runtime benefit application sequence.

Do not map the SDK confidence labels directly to Samantha's canonical `VERIFIED` status.

## 5. Crosswalk to GRE declarations

The GRE Vault audit records the following declaration-level facts:

- `VaultManager` (#1105): 11 fields, 53 methods, 12 properties.
- `VaultUpgradeData` (#1107): declarations for ID, icon, enemy type, localized labels, benefit type/symbol, dependency stat, requirements, and levels.
- `VaultLevel` (#1104): benefit and key-cost fields.
- `VaultGroupData` (#1103): group, localized name, unlock cost, requirements, and upgrade collection.
- `VaultPlayerProgress` (#1106): unlocked groups, upgrade levels, viewed state, free respec count, and last respec date.
- `VaultManager` declares group/upgrade lookup, lock checks, purchase methods, progress load/save methods, respec methods, and progress summaries.
- The GRE export contains decoded candidates `DEFAULT_RESPEC_COOLDOWN_WEEKS = 4` and `DEFAULT_RESPEC_COST = 500`; these remain decoded candidates with raw bytes, not verified active defaults.
- `TechTreeManager` (#963) declares Power/Harmony node collections and methods including `GetTechTreeBenefit`, `IncreasePowerTreeTier`, and `ResetTechTree`.

The SDK v29 reference catalog adds a separate category/upgrade structure and explicit `dependsOn` fields for selected upgrades. Its tests check the Bot Presets dependency on Bot Respec Discount. This is a catalog-level relationship, not proof that all GRE requirement fields or all runtime gates behave identically.

### Relationship handling

| Candidate relationship | Available evidence | Current treatment |
|---|---|---|
| Vault group requirements → group unlock | GRE `VaultGroupData.requirements`; `CanUnlockGroup` and `TryUnlockGroup` declarations | **HYPOTHESIS / NOT ESTABLISHED** for exact gate logic |
| Upgrade requirements/dependency → purchase eligibility | GRE `VaultUpgradeData.requirements`; `CanBuyUpgradeLevel` and `IsUpgradeLocked`; SDK v29 `dependsOn` entries | **HYPOTHESIS** until runtime evaluation is established |
| Vault benefit → game stat | GRE `benefitType`, `benefit`, and `GetBenefit` declarations; limited SDK v29 helpers | **HYPOTHESIS** except for explicitly source-reported helper outputs |
| Vault respec discount → respec cost | GRE respec methods and VaultID identifiers; Main declares a respec discount application interface | **HYPOTHESIS**; exact formula and affected respec paths are not established |
| Vault purchase → Keys balance | GRE manager purchase interfaces and progress fields; SDK save reader exposes Keys fields | **DIRECT DECLARATION** of related data/API surfaces only; transaction behavior is not established |

No typed GKB edge is asserted by this report.

## 6. Candidate knowledge records — not canonical

The following are suitable for controlled review as separate, source-qualified observations. They are not imported or approved canonical claims.

| Candidate | Classification | Suggested status | Limitation |
|---|---|---|---|
| GRE metadata declares VaultManager with 53 methods and 12 properties | OBJECTIVE | USER-PROVIDED / source-observation pending normalization | Declaration inventory only |
| GRE metadata includes 46/48 Tech Tree constant candidates | OBJECTIVE | EXTERNAL-UNVERIFIED | Raw decoded candidates; game release unknown |
| SDK 0.14.1 retains a legacy tree marked v28.3.0 | OBJECTIVE | EXTERNAL-UNVERIFIED | SDK source marker; not a current-game guarantee |
| SDK 0.14.1 includes a separate v29.0.0 Harmony/Power/Enemy catalog | OBJECTIVE | EXTERNAL-UNVERIFIED | SDK's own in-game verification flag is false |
| SDK v29 save reader maps UnlockedGroups and UpgradesLevel | OBJECTIVE | EXTERNAL-UNVERIFIED | Implementation behavior in SDK; synthetic test only |
| SDK community helpers model selected v29 bonuses at 5% per level | OBJECTIVE | EXTERNAL-UNVERIFIED | Explicit community/player provenance; nativeParity=false |

For the GRE observation, use the exact GRE JSON source reference and preserve the metadata-v39 label. Do not fill in a public game version. For SDK observations, retain package version `0.14.1` separately from the internal `v28.3.0` and `v29.0.0` markers.

## 7. Remaining gaps

1. No method bodies/IL are available in the GRE export; purchase, requirement, benefit, and respec execution paths remain unresolved.
2. The public game release corresponding to GRE metadata v39 is not identified.
3. The v29 SDK catalog still declares in-game spot-checks pending.
4. The v29 save reader has only synthetic fixture coverage in the inspected tests; real-save compatibility was not tested here.
5. The SDK's limited v29 mechanics helpers do not cover every Vault upgrade.
6. No independent in-game verification was performed during this review.
7. No canonical GKB claim or relationship was created or promoted.

## Audit result

- GRE Vault structural inventory: **COMPLETE** (see audit 32).
- SDK 0.14.1 Vault source crosswalk: **COMPLETE** for the inspected legacy catalog, v29 catalog, save reader, and limited mechanics helpers.
- Version boundary between legacy v28.3.0 and v29.0.0 references: **DOCUMENTED**.
- Runtime mechanics verification: **INCOMPLETE**.
- Real-save parity: **NOT TESTED**.
- GKB claim promotion: **NOT PERFORMED**.
- `GKB` and `main`: **UNCHANGED**.
- Tests: **NOT RUN**.

## Next priority

Proceed with a small controlled review of Vault claim candidates using the GKB schema and source provenance. Keep the GRE declarations, legacy SDK tree, v29 SDK catalog, and community mechanics helpers as separate source-qualified records. Preserve competing fanmade reports side by side; do not select a winner or bulk-import the domain.
