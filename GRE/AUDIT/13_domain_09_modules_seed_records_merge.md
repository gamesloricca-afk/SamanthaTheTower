# Domain 09 — Modules: Seed, Module Data Model, Merge, and Effect Catalog (Findings 151–200)

## Scope and source

- Source artifact: `GRE/1/09_modules.json`
- Source blob SHA: `016cc346998a2c3fafcc945ca0d01308a74e66d5`
- Repository branch: `TestAccount`
- Audit range: findings 151–200
- Evidence type: direct metadata declarations (field names, signatures, enum labels, and decoded constants).
- Game release version: not established by this artifact.
- Runtime method bodies: not available in this metadata dump.

These findings are structural observations. They do not establish the exact implementation or live-game behavior of the named methods.

## A. Seeded reroll declarations

151. `ModuleManager.GetSeedFromModuleIdentityAndRerollCount(ModuleItem module)` is declared and returns `System.Int32`.
152. The method name explicitly connects seed derivation to Module identity and reroll count; the actual derivation formula is unavailable.
153. `ModuleManager.CreateSeededRandomForAttempt(ModuleItem module, Int32 attemptId)` is declared and returns `System.Random`.
154. The seeded-random factory accepts a Module object and an attempt identifier; how those inputs are combined is unknown.
155. `ModuleManager.RollDeterministicSubstatCandidate(ModuleItem module, candidates, Int32 attemptId)` is declared and returns `System.Int32`.
156. The candidate-roll method accepts a candidate collection and attempt identifier; candidate indexing/selection logic is unavailable.
157. `ModuleManager.RollEffectRarityFromRandomValue(ModuleRarity, Double)` is declared and returns `EffectRarity`.
158. The rarity-roll interface accepts Module rarity and a floating-point random value; thresholds and probability tables are unavailable.
159. `ModuleManager.GetRarityToTryForFallbackStep(EffectRarity, Int32 step)` is declared and returns `EffectRarity`.
160. A fallback-rarity selection interface exists; its ordering and fallback conditions are unknown.
161. `ModuleManager.IsCandidateAllowedAfterAllRerollFilters(...)` accepts Module, ModuleType, modified core-substat bans, slot index, old effect index, and candidate effect index, and returns Boolean.
162. The filter interface exposes separate inputs for module type, bans, slot, previous effect, and candidate effect; the internal filter rules are unavailable.
163. `ModuleManager.IsClusterBannedForThisModuleType(ModuleType, SubstatsCluster, modifiedCoreSubstatBans)` is declared and returns Boolean.
164. A Module-type-specific cluster-ban check is exposed; the exact ban mapping is unavailable.
165. `ModuleManager.GetAllStructurallyValidEffectIndicesForModuleType(ModuleItem)` is declared and returns a collection reference.
166. The API name distinguishes structural validity from the later candidate-filter method; the meaning of each structural rule is unknown.
167. `ModuleManager.GetPotentialEffectsForModule(ModuleItem, potentialRarities)` is declared and returns a collection reference.
168. `ModuleManager.GetAllPotentialEffectsForModule(ModuleItem)` is declared and returns a collection reference.
169. `ModuleManager.GetAllowedClustersForModule(ModuleItem)` is declared and returns a collection reference.
170. The three potential-effect/allowed-cluster methods expose separate retrieval stages; their exact relationship and returned collection schemas are not resolved here.
171. `ModuleManager.deterministicRollAttemptsPerSlot` is a declared field with decoded default candidate `5000`.
172. The value 5000 is a metadata-decoded candidate, not a verified live-game attempt limit.
173. `ModuleManager.EffectRarityFallbackOrder` and `ModuleManager.rarityFallbackOrder` are declared fields; their collection contents are not exposed by this field listing.
174. The existence of two fallback-order fields does not establish whether they are aliases, separate configurations, or used in different paths.
175. `ModuleItem.rerollCounter` is an Int32 field with getter and setter declarations.
176. `ModuleItem.guid` is a string field with getter and setter declarations.
177. The Module identity inputs visible in this model include `guid` and `rerollCounter`; the seed method body is needed to confirm which identity fields are actually read.

## B. Module data structures

178. `ModuleItem` declares `infoIndex`, `currentRarity`, `level`, and `maxLevelReached`.
179. `ModuleItem` declares `effects` and `effectLocked` collection-like fields; their exact generic element schemas are not resolved in this report.
180. `ModuleItem` also declares `isNew`, `coinsSpent`, `shardsSpent`, and `favorite`.
181. `ModuleItem.GetInfo()` is declared and returns `ModuleInfo`.
182. `ModuleInfo` declares `type`, `rarity`, `uniqueBenefit`, and `benefitType`.
183. `ModuleEffect` declares `type`, `rarity`, `benefit`, `benefitType`, and `clusterIndex`.
184. The metadata distinguishes the Module's base information (`ModuleInfo`) from an individual effect record (`ModuleEffect`); runtime ownership and mutation behavior are not shown.
185. `ModuleRegistry` declares `infoIndex`, `rarity`, and `dateObtained`.
186. `ModuleRegistry` exposes getters/setters for those three fields and a constructor accepting `infoIndex` and `rarity`.
187. The registry record's date is exposed as `System.DateTime`; persistence and registry lifecycle are unknown.
188. `ModuleManager.moduleRecords` is a declared collection-like field; its element type is not resolved in the current metadata output.
189. `ModuleManager.MODULE_HISTORY_LIMIT` has decoded default candidate `150`; whether this limits `moduleRecords` or another history structure is not proven by the field name alone.

## C. Merge and module creation interfaces

190. `ModuleManager.ClearMerge()`, `SelectToMerge(ModuleItem)`, and `RemoveFromMerge(ModuleItem)` are declared.
191. `ModuleManager.Merge()` and the overload `Merge(ModuleItem, ModuleItem, ModuleItem, Boolean)` are declared; both return `ModuleItem`.
192. The four-argument Merge overload accepts three Module objects and a Boolean flag; the flag's meaning is unknown.
193. `ModuleManager.CalculateAutoMerge()` is declared and returns void.
194. `ModuleManager.mergeModules` and `ModuleManager.autoMergeEntries` are declared collection-like fields; their exact schemas are not resolved here.
195. The declarations establish separate manual merge-selection and auto-merge calculation interfaces, but do not establish merge eligibility, ordering, or execution rules.
196. `ModuleManager.GetMergeRequirement(ModuleRarity mainRarity, ..., ...)` is declared and returns Boolean; the two merge-input parameter types are not resolved in this report.
197. `ModuleManager.CreateModule()`, `CreateModule(ModuleType)`, `CreateModule(ModuleRarity)`, and `CreateModule(ModuleType, ModuleRarity)` are declared overloads returning `ModuleItem`.
198. Additional creation overloads accept a module info index or an existing `ModuleItem`; the latter returns a `ModuleItem`.
199. `ModuleManager.CreateModuleFromBanner(ModuleBanner, Boolean epicPityActive, Boolean rarePityActive)` is declared and returns `ModuleItem`.
200. The creation interfaces distinguish general creation, type/rarity-constrained creation, info-index creation, copying/derivation from an existing Module, and banner-based creation; the actual initialization and randomization logic is unavailable.

## Supporting enum declarations observed

- `ModuleType`: Cannon, Armor, Generator, Core.
- `ModuleRarity`: None, Common, Rare, RarePlus, Epic, EpicPlus, Legendary, LegendaryPlus, Mythic, MythicPlus, Ancestral, Ancestral1–Ancestral5.
- `EffectRarity`: Common, Rare, Epic, Legendary, Mythic, Ancestral.
- `ModuleBenefitType`: Normal, Add, Add10, AddMult, Multiply, Percentage, Percentage100, Subtract, Time, AddTime, SubtractTime, Meters, Angle.
- `SubstatsClusterType`: Attack, Defense, Utility, Ultimate.

Enum labels and decoded numeric values are metadata observations, not proof of player-facing behavior or balance values.

## Status and limitations

- Claim classification: OBJECTIVE (structural metadata observations).
- Verification status: EXTERNAL-UNVERIFIED for game mechanics; direct declaration presence is confirmed in the source metadata.
- Seed formula, PRNG algorithm, attempt semantics, reroll reproducibility, and exact candidate filtering: UNKNOWN.
- Merge eligibility, auto-merge policy, and creation implementation: UNKNOWN.
- No executable method bodies were available; no game runtime or simulation was executed.
- No GKB claim promotion performed.
