# Domain 19 — Version History: Complete Structural Metadata Audit

## Scope and source identity

- Repository ref: `TestAccount`
- JSON source: `GRE/3/19_version_history.json`
- JSON blob SHA: `7a3617f564b7a7e4b301b1bc61fbb5da95aec8a3`
- Companion index: `GRE/3/19_version_history.md`
- Markdown blob SHA: `b62d58dc84b065fb91983f9cb577cd1968e38a00`
- Source label: `Assembly-CSharp.dll metadata v39`
- Declared type indices: 23
- JSON evidence label: `DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`

## Complete structural inventory

The JSON contains 23 type records, 1,072 fields, 2,127 methods, and 956 properties.

| Type index | Type name | Fields | Methods | Properties |
|---:|---|---:|---:|---:|
| 630 | `MigrationLifetimeStones` | 0 | 3 | 0 |
| 693 | `ModuleRandomTest` | 4 | 0 | 0 |
| 694 | `<>c` | 6 | 7 | 0 |
| 695 | `<>c__DisplayClass315_0` | 4 | 4 | 0 |
| 696 | `<>c__DisplayClass381_0` | 5 | 3 | 0 |
| 697 | `<>c__DisplayClass393_0` | 1 | 2 | 0 |
| 698 | `<FeaturedBannerDurationCheck>d__457` | 3 | 6 | 2 |
| 699 | `<GetAllModuleItems>d__135` | 5 | 8 | 2 |
| 700 | `<GetFeaturedBanners>d__440` | 4 | 6 | 2 |
| 701 | `<GetRotatingBanners>d__441` | 4 | 6 | 2 |
| 702 | `<RotatingBannerDurationCheck>d__458` | 3 | 6 | 2 |
| 703 | `ModuleManager` | 110 | 294 | 89 |
| 872 | `SaveType` | 6 | 0 | 0 |
| 873 | `PlayerData` | 836 | 1674 | 835 |
| 874 | `BetaModuleConfig` | 3 | 7 | 3 |
| 875 | `BetaModule` | 4 | 11 | 6 |
| 876 | `<<ScheduleSave>g__ScheduleSaveCoroutine|55_0>d` | 3 | 6 | 2 |
| 877 | `<>c` | 10 | 11 | 0 |
| 878 | `<>c__DisplayClass58_0` | 3 | 2 | 0 |
| 879 | `<>c__DisplayClass62_0` | 1 | 4 | 0 |
| 880 | `<AutoSaveFunction>d__49` | 4 | 6 | 2 |
| 881 | `SaveLoad` | 41 | 38 | 2 |
| 1108 | `VersionLockManager` | 12 | 23 | 7 |

## SaveLoad and version declarations

### SaveLoad (#881)

`SaveLoad` declares 41 fields, 38 methods, and 2 properties. Important decoded constant candidates:
- `VERSION_NUMBER=1301`
- `VERSION_UPDATE_NOTES=642`
- `CURRENT_DATA_VERSION=35`
- `BETA_BOT_PRESET_INDEX=3`

Other fields include `IS_BETA_BUILD`, save/load service references, game initialization state, cloud timer, banned/load-failure state, load failure details, `vaultForceRespecced`, current session ID, current loaded revision, and autosave coroutine state.

Its methods include:
- Save lifecycle: `AutoSaveFunction`, `OnAutoSaveStart`, `OnAutosaveComplete`, `ScheduleSave`, `Save`, `BuildPlayerData`, `SaveData`.
- Load lifecycle: `Load`, `ApplyLoad`, `ReadData`, `LoadArray`, `RecoverCells`, `DescribeLoadFailure`.
- Migration/sanitization: `MigrateFTUEProgress`, `HadOldHarmonyNode`, `ClearBetaBotPreset`, `SanitizeAndMigrateLabSpeedUps`, `SanitizePresetNames`, `MigrateLifetimeStonesEarnedStats`, `LogLifetimeStonesMigrationKeys`.
- Save/reset and diagnostics: `DeleteLocalSave`, `Reset`, `LogDateTimesKind`, `LogMissingFirestoreProperties`, `ResetAutoSaveCoroutine`.

These are direct declarations and signatures. The version/data constants are preserved as decoded candidates; this report does not infer a public game release from the assembly metadata label or equate the data schema revision with a player-facing version.

### SaveType (#872)

Decoded enum candidates:
- `Normal=0`
- `IgnoreCloud=1`
- `IgnoreCloudIfTimer=2`
- `ForceLocalToCloud=3`
- `LastSave=4`

The names indicate distinct save modes in the declaration, but their exact branching behavior requires method implementation.

## VersionLockManager (#1108)

This type declares 12 fields, 23 methods, and 7 properties. Its fields include remote configuration keys for minimum game version, force-version-lock enablement, latest game version, instance state, developer overrides, cached min/latest versions, and listeners.

Methods/properties include:
- Remote/current version accessors: `RemoteMinGameVersion`, `CurrentMinGameVersion`, `RemoteForceLockEnabled`, `LatestGameVersion`, `UpdateAvailable`.
- Lock/update behavior interfaces: `TryForceVersionLock`, `ShouldForceVersionLock`, `TryShowUpdateAvailablePopup`, `OpenStorePage`.
- Version getters and developer overrides: `GetCurrentMin`, `GetCurrentLatest`, `Debug_SetMinVersion`, `Debug_SetLatestVersion`.

This establishes a version-lock/update-check component and its exposed data model. It does not establish actual server values, current lock status, or the precise lock decision without runtime configuration and method bodies.

## MigrationLifetimeStones (#630)

The type declares:
- `ComputeTotalStoneSpendFromState(main, cards, moduleManager)`
- `ShouldLogLifetimeStonesMigrationSpend()`
- `AppendSpendDebugLine(debugLog, line)`

The signature for the first method takes Main, Cards, and ModuleManager and returns an integer. The name indicates a migration accounting operation, but the exact summation inputs and eligibility rules are not visible from this metadata-only record.

## Beta module/save compatibility declarations

- `BetaModuleConfig` (#874): properties `enableModules`, `versionLock`, and `modules`.
- `BetaModule` (#875): properties `type`, `id`, `effects`, and `rarity`, plus enum conversion accessors.
- `PlayerData` (#873): 836 fields, 1,674 methods, and 835 properties; this shared save-data type is present in multiple domains.
- `ModuleManager` (#703): module migration and slot-level migration interfaces appear in this domain as well as the dedicated Modules and Economy exports.

These overlapping records should be reconciled by source identity and type index during final review, not treated as independent evidence.

## Decoded constant inventory

The JSON contains 26 fields marked `DECODED_CANDIDATE`:
- ModuleManager: 17
- SaveType: 5
- SaveLoad: 4

The SaveLoad version/data candidates above are included in this count. Raw bytes, decoder labels, and decoded values are preserved in the source JSON. The values are not silently converted into claims about a specific public release.

## Metadata-reference completeness

Across all 23 records:
- Field type references: 0/1,072 have resolved type names.
- Method return type references: 1,925/2,127 are resolved.
- Method parameter type references: 945/1,190 are resolved.
- Properties: 956; property type information is represented through accessor references rather than a direct resolved property type in this export.

## Audit result

- Structural inventory: **COMPLETE** for all 23 records.
- SaveLoad lifecycle, version/data candidates, migration/sanitization declarations, and SaveType enum: **DOCUMENTED**.
- VersionLockManager fields, methods, and properties: **DOCUMENTED**.
- MigrationLifetimeStones and beta-module configuration/data structures: **DOCUMENTED**.
- Exact save format, cloud merge policy, migration transformations, release mapping, and live version-lock rules: **NOT ESTABLISHED** by metadata declarations alone.
- Game release version: **NOT IDENTIFIED** by `metadata v39` alone; `VERSION_NUMBER=1301` and `CURRENT_DATA_VERSION=35` remain decoded source candidates.
- GKB promotion: **NOT PERFORMED**.

## Next audit target

Domain 20 — Experimental and Community.
