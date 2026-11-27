# D04-01 — Damage Reduction Pipeline: Evidence Report

- Domain: 04 — Combat Mechanics
- Investigation: D04-01
- Status: **PARTIAL — GRE CROSS-DOMAIN RE-INSPECTION COMPLETE; LIVE-GAME ORDER UNRESOLVED**
- Branch: `TestAccount`
- Access date: 2026-11-27

## Objective

Compare the GRE declarations with implementation-capable third-party material and community sources for the position of mitigation layers relative to Defense Absolute.

## 1. GRE baseline

The GRE Domain 04 and Domain 02 exports both contain a `DamageReductionResult` type with 11 fields. Both domains declare:

- `Enemy.CalculateDamageReductionResult`
- `Enemy.ApplyDamageReductionStats`

The duplicate type and method declarations are repeated metadata in overlapping domain exports, not independent corroboration.

The inspected GRE text exports do not provide method bodies. They therefore do not establish:
- the exact reduction formula;
- the order of each reduction layer;
- whether the blocked-stat fields overlap;
- the game-version scope of the behavior.

Source references:
- `GRE/1/04_combat_mechanics.json` and `.md`
- `GRE/1/02_enemies.json` and `.md`
- `GRE/1/01_game_fundamentals.json`
- `GRE/1/03_battle_conditions.json`
- `GRE/3/manifest.json`
- `GRE/3/MECHANISMS.md`
- `GRE/3/mechanism_evidence.json`
- `GRE/1/04_combat_mechanics.md`
- `GRE/1/02_enemies.md`
- `GRE/AUDIT/05_domain_04_combat_mechanics.md`
- `GRE/AUDIT/41_domain_02_enemies_complete_structural_inventory.md`


### Expanded GRE cross-domain inspection (2026-11-27)

The investigation was extended beyond Domain 04. The following are direct metadata findings, not runtime conclusions:

**Domain 02 — Enemies**
- `Enemy` is type index 314 in `GRE/1/02_enemies.json`.
- `CalculateDamageReductionResult(incomingDamage: System.Double)` is method index 2295, token `0x060008f8`, recorded offset 3150934, and returns `DamageReductionResult`.
- `ApplyDamageReductionStats(result: DamageReductionResult)` is method index 2296, token `0x060008f9`, recorded offset 3150964.
- Additional declarations include `GetTitanShockReduction()` (index 2292; offset 3150844) and `GetFlameBotDamageReduction()` (index 2370; offset 3153184).
- Relevant Enemy state fields include `flameBotDamageReduction`, `boostedFlameBotDamageReduction`, `flameBotModuleDebuff`, `thunderDamageReduction`, `titanShocked`, `boostedTitanShocked`, `enemyInChronoRangeBool`, and `inProtector`.

**DamageReductionResult**
- Type index 309 declares 11 fields: `finalDamage`, `chainThunderBlocked`, `chronoFieldBlocked`, `flameBotBlocked`, `magicOrbBlocked`, `primordialCollapseBlocked`, `defensePercentBlocked`, `defenseAbsoluteBlocked`, `bastionBlocked`, `bastionPoolUsed`, and `incomingDamage`.
- The same record appears in Domain 04 and Domain 02 because domain exports overlap. This is one metadata source, not two independent confirmations.

**Domain 01 — Game Fundamentals**
- `Main` type index 618 declares `defenseAbs`, `defenseRel`, `MAX_DEFENSE_PERCENT`, `protectorDamageReduction`, `bastionPool`, and `bastionPoolMax`.
- `Main.ApplyTowerDamage(damage, triggerHitThisWave)` is method index 4739, token `0x06001284`, recorded offset 3224254.

**Domain 03 — Battle Conditions**
- `BattleHistoryEntry` type index 619 declares damage-taken fields and blocked counters for Defense %, Defense Absolute, Chrono Field, Chain Thunder, Flame Bot, Primordial Collapse, and Magic Orb.
- `DissonanceManager.get_IsDefenseDisabled()` is also declared in this domain; its interaction with the Enemy calculation is not established by the inspected metadata.

**Important distinction:** `thunderDamageReduction` and `chainThunderBlocked` are different declared names. GRE does not establish that they represent the same effect. Likewise, the presence of `ApplyTowerDamage` does not prove it calls `Enemy.CalculateDamageReductionResult`.

The GRE mechanism summary itself says precise execution order and stacking are not recoverable from these declarations. The manifest records that native executable method bodies and a call graph are absent, and that formula reconstruction from names alone is unsupported. The original binary named in the manifest was not present in the checked-in tree during this inspection.

New GRE-only claims: `CLM-D04-DR-006`, `CLM-D04-DR-007`, and `CLM-D04-DR-008`. Their VERIFIED status applies only to the existence and content of metadata declarations.

## 2. Source findings

### A. TheTowerSDK 0.14.1

Inspected package metadata and source at commit `9a95672578fa064d71ddd54fad2ce5027a310b3a` (2026-11-06).

Two separate helpers exist:

1. `applyDamageReduxLayerStack` models Chain Thunder, Chrono Field, Flame Bot, NMP, Primordial Collapse, Defense %, then Defense Absolute. Its test asserts this exact step order.
2. `computeDamageReductionResult` models Defense %, Chrono Field, Flame Bot, optional module defense, optional Rend Armor, then Defense Absolute. Its input does not include Chain Thunder, NMP, or Primordial Collapse.

The SDK also contains knowledge prose stating that Chrono Field, Primordial Collapse, and Flame Bot apply after Defense Absolute. That prose has mixed wiki/SDK provenance and is not the same as the layer-stack helper.

**Interpretation:** the SDK is useful evidence of third-party model implementations, but its own modules must be kept distinct. The test verifies the SDK helper's expected output, not the live game's runtime behavior.

### B. Fandom — Defense Percent

The page states:
- Defense % applies before Defense Absolute.
- Chrono Field, Primordial Collapse, and Flame Bot are separate reductions applied after Defense Absolute.
- Defense % is capped at 98%.

No game version is established in the inspected extract.

### C. Reddit — Damage Order of Interaction

The post is dated 2025-11-06 and says “Updated with v28.3”. It places:
- Defense % and enemy reductions including Chrono Field, Primordial Collapse, Flame Bot, and Chain Thunder;
- then Defense Absolute.

The post's comment thread shows another player questioning the Defense Absolute placement. The author says the information came directly from a top-three player, but does not identify that player or provide a reproducible test protocol. Treat this as second-hand community attribution, not independent confirmation.

## 3. Conflicts

The Fandom page and Reddit post disagree about whether Chrono Field, Primordial Collapse, and Flame Bot are applied before or after Defense Absolute.

The SDK layer-stack helper agrees with the Reddit ordering for those layers, but this does not settle the game mechanic. The SDK's separate helper and knowledge prose also have different scope/wording.

Conflict record: `GRE/EVIDENCE/conflicts/CNF-D04-DR-001-defense-absolute-order.md`.

**No source is selected as the winner.** The claims are preserved separately, with version and evidence limitations.

## 4. Claim register

| Claim ID | Type | Status | What it records |
|---|---|---|---|
| `CLM-D04-DR-001` | OBJECTIVE | VERIFIED (SDK code only) | SDK layer-stack helper order |
| `CLM-D04-DR-002` | OBJECTIVE | VERIFIED (SDK code only) | Separate SDK helper sequence and narrower input |
| `CLM-D04-DR-003` | OBJECTIVE | EXTERNAL-UNVERIFIED | Fandom ordering statement |
| `CLM-D04-DR-004` | OBJECTIVE | EXTERNAL-UNVERIFIED | Reddit v28.3 ordering statement |
| `CLM-D04-DR-005` | OBJECTIVE | VERIFIED (SDK prose only) | SDK knowledge-compartment ordering statement |
| `CLM-D04-DR-006` | OBJECTIVE | VERIFIED (GRE metadata only) | DamageReductionResult declaration and 11 named fields |
| `CLM-D04-DR-007` | OBJECTIVE | VERIFIED (GRE metadata only) | Enemy reduction method signatures and related state declarations |
| `CLM-D04-DR-008` | OBJECTIVE | VERIFIED (GRE metadata only) | Main defense state and BattleHistory blocked counters |

## 5. What is and is not established

**VERIFIED**
- GRE declares the 11-field `DamageReductionResult` record, the two Enemy method signatures, additional Enemy reduction-related state/method declarations, Main defense-related fields and `ApplyTowerDamage`, and BattleHistory blocked counters. This verifies declarations only, not runtime behavior.
- The inspected SDK commit contains two separate helper implementations, a test for the layer-stack helper order, and knowledge prose that conflicts with that helper.
- The inspected Fandom and Reddit pages make different source-specific statements.

**EXTERNAL-UNVERIFIED**
- Fandom's statement that CF / PC / Flame Bot apply after Defense Absolute.
- Reddit's statement that CF / PC / Flame Bot / Chain Thunder apply before Defense Absolute.

**NOT ESTABLISHED**
- The live game's current order.
- Whether the GRE metadata corresponds to the same game build as SDK v0.14.1.
- Whether every mitigation source is active in every enemy hit path.
- Whether the native blocked-stat fields are mutually exclusive or overlapping.
- Whether source disagreements are due to game-version changes, different mechanic scopes, or source error.

## 6. Next evidence needed

1. Obtain the original binary or another version-matched artifact that contains method bodies for `Enemy.CalculateDamageReductionResult`, `Enemy.ApplyDamageReductionStats`, and `Main.ApplyTowerDamage`; recover and verify their call/data flow if technically possible.
2. Find a reproducible player test with known incoming damage and each mitigation source enabled/disabled separately.
3. Compare the same game version and same hit type across sources.
4. Keep any new conflicting value/order as a separate claim.

## 7. GKB decision

**HOLD — NO GKB PROMOTION.**

Do not encode one universal damage-reduction order from this evidence set. Keep the source-specific claims and conflict in GRE Evidence staging.
