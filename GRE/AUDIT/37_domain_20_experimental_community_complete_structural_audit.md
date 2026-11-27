# Domain 20 — Experimental and Community: Complete Structural Metadata Audit

## Scope and source identity

- Repository ref: `TestAccount`
- JSON source: `GRE/3/20_experimental_community.json`
- JSON blob SHA: `ec73023f67a120de1dddc55daf09aa2b798c074c`
- Companion index: `GRE/3/20_experimental_community.md`
- Markdown blob SHA: `4ff49a9775245f00fb12c08cf66cda1c75221f25`
- Source label: `Assembly-CSharp.dll metadata v39`
- Declared type indices: 12
- JSON evidence label: `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`

## Complete structural inventory

The JSON contains 12 type records, 63 fields, 81 methods, and 24 properties.

| Type index | Type name | Fields | Methods | Properties |
|---:|---|---:|---:|---:|
| 275 | `DevPanelUWEffectsState` | 5 | 0 | 0 |
| 283 | `DissonanceBonusUI` | 8 | 8 | 0 |
| 284 | `DissonanceBoost` | 7 | 15 | 2 |
| 285 | `DissonanceInfoUI` | 2 | 3 | 0 |
| 286 | `DissonanceType` | 6 | 0 | 0 |
| 287 | `DissonantBoostDisplay` | 4 | 0 | 0 |
| 288 | `DissonanceRemoteData` | 5 | 0 | 0 |
| 289 | `DissonanceManager` | 12 | 30 | 13 |
| 290 | `DissonanceTabButton` | 2 | 5 | 0 |
| 291 | `DissonanceTypeIcon` | 5 | 2 | 0 |
| 874 | `BetaModuleConfig` | 3 | 7 | 3 |
| 875 | `BetaModule` | 4 | 11 | 6 |

## Dissonance declarations

### DissonanceManager (#289)

The manager declares 12 fields, 30 methods, and 13 properties. Fields include:
- Damage, Health, Coin, and Ultimate Weapon boost objects.
- Dissonant boost display and info-shown state.
- Dissonant run active state and selected dissonance.
- New-record state and selected-dissonance change event.

Methods/properties include:
- State and availability: `Active`, `IsUnlocked`, `NewRecord`, `SelectedDissonance`.
- Boost access: `DamageBoost`, `HealthBoost`, `CoinBoost`, `UltDamageBoost`.
- Disable flags: `IsAttackDisabled`, `IsDefenseDisabled`, `IsUtilityDisabled`, `IsUltimateWeaponDisabled`.
- Operations: `UpdateFromRemoteData`, `StartDissonantRun`, `SetRecord`, `ConsumeNewRecord`, `GetBoost`, `GetBoostValue`, `GetSelectedBoostValue`, and info-window methods.

### DissonanceBoost (#284)

This type declares seven fields, 15 methods, and two properties. Fields include `waveReached`, `_researchIndex`, `_bonus`, `_maxWave`, `_globalBonusCache`, `_cachedForTier`, and `ValueChanged`.

Methods include `GetValue`, `GetValueWithoutLab`, `GetResearchBonus`, `GetWaveReached`, `IsMaxed`, `SetRecord`, `SetBonus`, `SetMaxWave`, `CalculateGlobalBonus`, and `ResearchBonus`.

This provides a declaration-level map of stored wave records, research linkage, bonus values, tier cache, and calculation entry points. The exact bonus formula and how it combines with research are not present in the metadata-only export.

### DissonanceRemoteData (#288)

Fields: `maxWave`, `attackBonus`, `defenseBonus`, `utilityBonus`, and `ultimateBonus`. This is a remote-data shape declaration; it does not establish the source endpoint, authority, refresh schedule, or exact validation logic.

### Dissonance enum candidates

- `DissonanceType` (#286): `None=0`, `Attack=1`, `Defense=2`, `Utility=3`, `UltimateWeapon=4`.
- `DissonantBoostDisplay` (#287): `BoostPlusEcho=0`, `BoostOnly=1`, `EchoOnly=2`.
- `DevPanelUWEffectsState` (#275): `All=0`, `UW=1`, `UWPlus=2`, `None=3`.

The source JSON marks these 12 enum fields as decoded candidates and preserves raw bytes.

## Dissonance UI declarations

- `DissonanceBonusUI` (#283): UI for cycle display, info, entries, and Echo texts for Attack/Defense/Utility/Ultimate.
- `DissonanceInfoUI` (#285): info-window open/update methods.
- `DissonanceTabButton` (#290): tab value update and click interface.
- `DissonanceTypeIcon` (#291): icon-setting interface.

These are UI declarations, not proof of exact presentation, eligibility, or gameplay effects.

## Beta module declarations

- `BetaModuleConfig` (#874): configuration properties `enableModules`, `versionLock`, and `modules`.
- `BetaModule` (#875): properties `type`, `id`, `effects`, and `rarity`, plus enum conversion accessors.

These types also appear in Domain 19 (Version History). The repeated type indices identify the same assembly metadata types; this is cross-domain reuse, not independent corroboration. The export does not provide the remote config payload, beta rollout status, exact version gating, or module effect definitions.

## Decoded constant inventory

The JSON contains 12 fields marked `DECODED_CANDIDATE`:
- DevPanelUWEffectsState: 4
- DissonanceType: 5
- DissonantBoostDisplay: 3

Raw bytes, decoded values, and decoder labels are preserved in the JSON.

## Metadata-reference completeness

Across all 12 records:
- Field type references: 0/63 have resolved type names.
- Method return type references: 78/81 are resolved.
- Method parameter type references: 32/37 are resolved.
- Properties: 24; property type information is represented through accessor references rather than a direct resolved property type in this export.

## Audit result

- Structural inventory: **COMPLETE** for all 12 records.
- Dissonance manager/boost/remote-data/UI declarations: **DOCUMENTED**.
- Dissonance enum and display enum candidates: **RECORDED** with source traceability.
- Beta module config/data declarations: **DOCUMENTED** and cross-referenced with Domain 19.
- Exact dissonance bonus formula, wave record eligibility, remote-data source/validation, boost stacking, and beta rollout/version rules: **NOT ESTABLISHED** by metadata declarations alone.
- Game release version: **NOT IDENTIFIED** by `metadata v39` alone.
- GKB promotion: **NOT PERFORMED**.

## Domain 20 audit status

Domain 20 is the final numbered domain currently present in the inspected GRE tree. Its structural inventory is complete. The post-audit cross-domain review and GKB claim validation remain pending by project instruction.
