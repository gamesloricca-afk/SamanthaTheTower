# GRE Audit 23 — Domain 11: Bots (structural metadata audit)

- Audit ID: `GRE-AUDIT-023`
- Inspection date: 2026-11-27
- Repository: `gamesloricca-afk/SamanthaTheTower`
- Branch: `TestAccount`
- Source JSON: `GRE/2/11_bots.json`
- Source JSON blob SHA: `f6b8107c565bc05a883a99649713929cc6b07a1e`
- Companion index: `GRE/2/11_bots.md`
- Companion blob SHA: `2977a0ec06bdef107fe3e601a1c550f88ad56864`
- Source metadata label: `Assembly-CSharp.dll metadata v39`
- Scope: initial structural review of the Bots domain; no GKB promotion.

## 1. Source envelope and inventory

The JSON declares:
- `domain: 11_bots`
- `evidence_status: DIRECT_METADATA_DECLARATIONS; behavioral meaning unverified`
- 42 type records, with matching type indices in the source envelope.

The companion Markdown is a selected summary, not a complete listing of all 42 records. It exposes selected type summaries and method names. The JSON contains full metadata records, including field and method records, signatures where resolved, tokens, offsets, and raw record hex.

The metadata format label v39 is not a confirmed game release version.

## 2. Directly observed declarations

### Bot entity — type #141

The record identifies `Bot` as deriving from `UnityEngine.MonoBehaviour`. It declares 16 fields, 19 methods, and 5 properties.

Observed fields include:
- `MOVESPEED` and `RADIUS_PERCENTAGE`
- references named `container`, `trigger`, `particle`, `subParticles`, `particleParent`, and `extraEffect`
- `type`, `durationTimer`, `cooldownTimer`, `aiState`, `destination`
- `haveParticleParent`, `defaultSimulationSpeed`, and `defaultShapeRadius`

Two field defaults are decoded candidates:
- `MOVESPEED`: raw bytes `9a99993e`, candidate float32 value approximately 0.3
- `RADIUS_PERCENTAGE`: raw bytes `6666a63f`, candidate float32 value approximately 1.3

Declared properties and getter names:
- `Active` → `get_Active` (Boolean return)
- `Cooldown` → `get_Cooldown` (Single return)
- `Duration` → `get_Duration` (Single return)
- `BotMoveSpeed` → `get_BotMoveSpeed` (Single return)
- `Synchronized` → `get_Synchronized` (Boolean return)

Selected method declarations include `Awake`, `Start`, `ResetForRound`, `Resume`, `InitializePosition`, `ToggleActiveIfPossible`, `UpdateSize`, `BotUpdate(deltaTime: Single)`, `ChangeState(state: AiState, customDuration: unresolved type)`, and `SetRandomDestination`.

These declarations establish names, selected signatures, and metadata relationships only. They do not establish movement behavior, attack targeting, bot uptime, cooldown calculations, state transitions, or synchronization effects.

### Bot type and AI state enums — types #139 and #140

The source declares nested enum-like records under `Bot`:
- `BotType`: fields named Flame, Thunder, Golden, Amplify, Bot
- `AiState`: fields named Attacking and Moving

The companion summary lists candidate decoded values:
- BotType: Flame=0, Thunder=1, Golden=2, Amplify=3, Bot=4
- AiState: Attacking=0, Moving=1

The JSON labels these decoded integer values `DECODED_CANDIDATE`. Preserve them as candidates, not verified enum semantics.

### Bot management controller — type #145 (`Bots`)

The companion summary reports 47 fields, 58 methods, and 7 properties. Directly visible declaration names include:
- Lifecycle and round: `Initialize`, `ResetForRound`, `Resume`, `BotUpdate`
- Presets: `ApplyPresetWithCharge`, `CanApplyPresetForBattle`, `TryGetPresetLockedByMedalSpend`
- Stats and levels: `GetBotLevelUpCost`, `GetBotBenefit`, `GetBotStatIndices`, `LevelUpBot`
- Bot Plus: `IsBotPlusUnlocked`, `GetBotPlusUpgradeCost`, `BotPlusUnlock`, `BotPlusLevelUp`, `GetBotPlusBenefit`
- Synchronicity: `SynchronicityUpgrade`, `SynchronicityUnlock`, `FindSynchronicityLeadBot`, `GetSynchronicityLeadBotPosition`, `IsBotSynchronized`
- Correction/refund: `ApplyBotPlusCorrection`, `DescribeBotPlusState`, `LockBotPlusAndRefund`

These names suggest areas for follow-up inspection, but do not prove unlock conditions, resource costs in live configuration, upgrade formulas, preset restrictions, synchronization rules, or refund behavior.

### Bot management candidate defaults

The companion summary and visible JSON identify these decoded candidates:
- `BOT_PLUS_UNLOCK_COST = 1250`
- `WILDFIRE_DAMAGE_BOOST = 3.0`
- `SYNCHRONICITY_UNLOCK_COST = 1500`
- `BOT_BASE_PRESETS = 2`

The JSON preserves raw bytes and marks numeric decoding as `DECODED_CANDIDATE`. These values are not promoted as verified gameplay costs or effects. In particular, remote configuration or runtime logic may affect effective values; the inspected declarations do not establish that.

### Bot UI and player-data records

- `BotDescriptionPanel` (#142): fields include bot references, title/description/icon, stat names/values, cooldown slider references, bot stat indices, next benefit, and user bot data. Method signatures include `UpdateBotDescriptionPanel(botIndex: Int32)`, `OnCooldownSliderLevelChanged(level: Int32)`, and `GetCooldownValueText()`.
- `BotPresetsUI` (#143): fields include preset UI objects/buttons/text and normal/selected sprites. It exposes `Button_SelectPreset(index: Int32)` and `Button_HoldPreset(index: Int32)`; its properties expose `Bots`, `MissionEvent`, and `Main`.
- `UserBotData` (#146): 6 fields, 14 methods, 6 properties in the companion summary; `Reset` is a selected method name.
- `UserSynchronicityData` (#147): 1 field, 4 methods, 1 property; `Reset` is a selected method name.

Field names and UI handlers do not establish save serialization, player progression rules, or exact preset interaction behavior.

## 3. Shared and overlapping records

The domain also includes records with indices #586–#618, including `DamageData`, `HitData`, `LightspeedPathData`, `UpgradeType`, `UpgradeMultiplier`, `ClosestEnemyEntry`, and the shared `Main` controller.

The companion summary reports `Main` (#618) with 946 fields, 487 methods, and 62 properties. It is a large cross-domain controller record. Its appearance in the Bots domain is not evidence that all of its methods belong to the Bots system. Do not treat repeated shared types as independent confirmation.

Compiler-generated type #144 (`<>c`) is also present. Preserve it in raw metadata, but do not treat it as a player-facing game concept.

## 4. Candidate values and unresolved interpretation

All numeric defaults above remain `DECODED_CANDIDATE`. Units and runtime use are not established by this metadata extract.

The following remain unresolved:
- Whether candidate bot enum numbering matches any player-facing order or persistent identifier.
- Whether movement and radius candidates are universal constants, per-instance defaults, or overridden values.
- Actual bot effects, targeting, activation timing, cooldown/duration calculations, and stat scaling.
- Exact Bot Plus and Synchronicity prerequisites, costs, level curves, and interactions.
- Whether preset count fields reflect current live limits or only one source build.
- The impact of remote configuration, save migration, and runtime state.

## 5. Audit classification

| Observation | Classification | Status |
|---|---|---|
| Domain envelope declares 42 type records | OBJECTIVE | VERIFIED as source metadata |
| Bot type #141 has the listed fields, methods, and properties | OBJECTIVE | VERIFIED as source metadata |
| Bot derives from UnityEngine.MonoBehaviour | OBJECTIVE | VERIFIED as source metadata |
| Enum labels and candidate numeric defaults | OBJECTIVE | EXTERNAL-UNVERIFIED / decoded candidates |
| Method names imply bot control, preset, Bot Plus, and Synchronicity subsystems | OBJECTIVE (declaration-level) | VERIFIED as declarations; behavior unverified |
| Actual bot mechanics or live player values | OBJECTIVE | NOT ESTABLISHED |

Source authority and recency are separate from this classification. This is a reverse-engineered metadata artifact, not an official developer specification.

## 6. Limitations and next work

This is an initial structural audit, not a complete field-by-field audit of all 42 type records. The companion Markdown enumerates only selected type summaries, and the JSON review in this pass focused on the Bot, BotType, AiState, BotDescriptionPanel, BotPresetsUI, Bots, and selected shared records.

Next:
1. Continue parsing all 42 records and verify type-index/record consistency.
2. Inspect the remaining Bot management fields and method signatures, including user data and synchronicity structures.
3. Cross-reference Bot declarations against Research (#08), Workshop/Enhancements, Economy/Progression, and Version History without assuming a relationship from names alone.
4. Preserve contradictory fanmade claims side by side if external corroboration later produces different values.
5. Do not promote any claim to GKB until its source, scope, game-version applicability, evidence, and limitations are recorded.

**Result: Domain 11 initial structural audit recorded; detailed domain audit remains IN PROGRESS. No GKB data or original GRE source files changed.**
