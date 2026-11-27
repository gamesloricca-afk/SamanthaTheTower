# Domain 09 — Modules: Auto Reroll UI, Substat Bans, Random State, and Effect Catalog (Findings 201–300)

## Scope and source

- Source artifact: `GRE/1/09_modules.json`
- Source blob SHA: `016cc346998a2c3fafcc945ca0d01308a74e66d5`
- Repository branch: `TestAccount`
- Audit range: findings 201–300
- Evidence type: direct metadata declarations (field names, method signatures, enum labels, and decoded enum values).
- Game release version: not established by this artifact.
- Runtime method bodies: unavailable in this metadata dump.

This report records declarations only. UI names do not prove the exact player-visible flow, and enum labels do not establish balancing values or live eligibility rules.

## A. Auto Reroll interface declarations

201. `ModuleDetailsUI.Button_OpenAutoReroll()` is declared and returns void.
202. `ModuleDetailsUI.Button_TryStartAutoRoll()` is declared and returns void.
203. `ModuleDetailsUI.Button_StartAutoRolling()` is declared and returns void.
204. `ModuleDetailsUI.Button_StopAutoRolling()` is declared and returns void.
205. `ModuleDetailsUI.AutoReroll()` is declared and returns `System.Collections.IEnumerator`.
206. `ModuleDetailsUI.autoRerollCoroutine` is a declared coroutine field.
207. `ModuleDetailsUI.autoRerollButton` is a declared UI button field.
208. `ModuleDetailsUI.autoRerollStopButton` is a declared UI panel field.
209. `ModuleDetailsUI.autoRerollBlockerPanel` is a declared UI panel field.
210. `ModuleDetailsUI.autoRerollSubstatsContainer` is a declared UI panel field.
211. `ModuleDetailsUI._anyRerollMade` is a Boolean field.
212. The UI declaration set includes distinct start-attempt, start, stop, and coroutine interfaces; exact gating and execution sequence are unknown.
213. `ModuleDetailsUI._moduleItem` stores a ModuleItem reference.
214. `ModuleDetailsUI._moduleInfo` stores a ModuleInfo reference.
215. `ModuleDetailsUI._moduleManager` stores a ModuleManager reference; the fields establish UI-to-manager references, not the exact call graph.

## B. Auto Reroll coroutine state

216. The compiler-generated coroutine type `<AutoReroll>d__120` is present in the metadata.
217. The coroutine state machine declares `<>1__state` as an integer field.
218. The coroutine state machine declares `<>2__current` as an object/current-yield field.
219. The coroutine state machine declares `<>4__this` as a reference to its owning UI instance.
220. The coroutine state machine declares `<waitTime>5__2` as a floating-point field.
221. The coroutine state machine declares `<copiedModule>5__3` as a ModuleItem reference.
222. The coroutine state machine exposes `MoveNext()`, returning Boolean.
223. The coroutine state machine exposes `Dispose()` and IEnumerator current/reset interface methods.
224. A local/state field named `waitTime` exists; its numeric value and timing policy are not present in this declaration.
225. A local/state field named `copiedModule` exists; the reason for copying and the copy semantics are unknown.
226. The generated coroutine is associated by its generated name with `ModuleDetailsUI.AutoReroll`; its exact internal instructions are unavailable.
227. `ModuleManager.AutoRollRunCheck(ModuleItem)` is separately declared and returns void.
228. The existence of `AutoRollRunCheck` and the UI coroutine does not prove which one validates target conditions or when it is called.
229. `ModuleManager.isAutoRerolling` is a Boolean field.
230. `ModuleManager.rarityAutoRerollAllowed` is a collection-like field; its element type and allowed-rarity values are not resolved here.

## C. Substat ban configuration

231. `ModuleManager.cannonSubstatBans` is a collection-like field.
232. `ModuleManager.armorSubstatBans` is a collection-like field.
233. `ModuleManager.generatorSubstatBans` is a collection-like field.
234. `ModuleManager.coreSubstatBans` is a collection-like field.
235. The four ban fields are separated by ModuleType; exact default contents and persistence are unknown.
236. `ModuleManager.cannonAutoRerollSubstats` is a collection-like field.
237. `ModuleManager.armorAutoRerollSubstats` is a collection-like field.
238. `ModuleManager.generatorAutoRerollSubstats` is a collection-like field.
239. `ModuleManager.coreAutoRerollSubstats` is a collection-like field.
240. The four Auto Reroll substat fields are also separated by ModuleType; whether they store desired effects, filters, or another selection state requires field type resolution and method bodies.
241. `ModuleBansUI.GetBannedSubstats(ModuleItem)` is declared and returns a collection reference.
242. `ModuleBansUI.Button_BanRow(SubstatsCluster)` is declared and returns void.
243. `ModuleBansUI.Button_ModuleBansTab(Int32 moduleType)` is declared and returns void.
244. `ModuleBansUI.ModuleBansPanelUpdate(Int32 moduleType)` is declared and returns void.
245. `ModuleBansUI.Open(Int32 tab)` and `Close()` are declared.
246. `ModuleBansUI.bansCountText` is a declared UI text field.
247. `ModuleBansUI.banRows` and `banRowTexts` are declared collection-like UI fields.
248. `ModuleBansUI.banRowButtons`, `banRowCheckmarks`, and `banRowXs` are declared collection-like UI fields.
249. `ModuleBansUI.moduleBansTabButtons` is a declared collection-like UI field.
250. The UI has distinct checked and banned sprites; the exact meaning of each visual state and any maximum-ban count are unknown.

## D. Random-state test type

251. A type named `ModuleRandomTest` is present in the metadata.
252. `ModuleRandomTest.s0` is declared as an Int32 field.
253. `ModuleRandomTest.s1` is declared as an Int32 field.
254. `ModuleRandomTest.s2` is declared as an Int32 field.
255. `ModuleRandomTest.s3` is declared as an Int32 field.
256. The four fields form a four-integer state-like structure by naming and layout; this is not enough to identify a specific random-number algorithm.
257. `ModuleRandomTest` has no methods declared in this metadata listing.
258. `ModuleManager.moduleRandom` is a declared field with an unresolved type reference in the current report.
259. The presence of `ModuleRandomTest` and `ModuleManager.moduleRandom` does not prove that this test type is the production random generator.
260. No seed initialization, state transition, output function, or test-vector behavior can be established from these declarations alone.

## E. SubstatsCluster enum catalog — Attack-related labels

261. `SubstatsCluster` is an enum-like type with a declared underlying value field.
262. `SubstatsCluster.None` has decoded enum value 0.
263. `SubstatsCluster.Attack_Speed` has decoded enum value 1.
264. `SubstatsCluster.Critical_Chance` has decoded enum value 2.
265. `SubstatsCluster.Critical_Factor` has decoded enum value 3.
266. `SubstatsCluster.Attack_Range` has decoded enum value 4.
267. `SubstatsCluster.Attack_Per_Meter` has decoded enum value 5.
268. `SubstatsCluster.Multishot_Chance` has decoded enum value 6.
269. `SubstatsCluster.Multishot_Targets` has decoded enum value 7.
270. `SubstatsCluster.Rapid_Fire_Chance` has decoded enum value 8.
271. `SubstatsCluster.Rapid_Fire_Duration` has decoded enum value 9.
272. `SubstatsCluster.Bounce_Shot_Chance` has decoded enum value 10.
273. `SubstatsCluster.Bounce_Shot_Targets` has decoded enum value 11.
274. `SubstatsCluster.Bounce_Shot_Range` has decoded enum value 12.
275. `SubstatsCluster.Super_Critical_Chance` has decoded enum value 13.
276. `SubstatsCluster.Super_Critical_Factor` has decoded enum value 14.
277. `SubstatsCluster.Rend_Armor_Chance` has decoded enum value 15.
278. `SubstatsCluster.Rend_Armor_Mult` has decoded enum value 16.
279. `SubstatsCluster.Rend_Armor_Max` has decoded enum value 17.
280. These enum names and numeric values are direct metadata observations; the enum alone does not prove which Module types can roll each entry.

## F. SubstatsCluster enum catalog — remaining labels

281. `SubstatsCluster.Health_Regen` has decoded enum value 18.
282. `SubstatsCluster.Defense_Percent` has decoded enum value 19.
283. `SubstatsCluster.Defense_Absolute` has decoded enum value 20.
284. `SubstatsCluster.Thorn_Damage` has decoded enum value 21.
285. `SubstatsCluster.Lifesteal` has decoded enum value 22.
286. `SubstatsCluster.Knockback_Chance` has decoded enum value 23.
287. `SubstatsCluster.Knockback_Force` has decoded enum value 24.
288. `SubstatsCluster.Orb_Speed` and `SubstatsCluster.Orbs` have decoded enum values 25 and 26.
289. `SubstatsCluster.Shockwave_Size` and `SubstatsCluster.Shockwave_Frequency` have decoded enum values 27 and 28.
290. `SubstatsCluster.Land_Mine_Chance`, `Land_Mine_Damage`, and `Land_Mine_Radius` have decoded enum values 29, 30, and 31.
291. `SubstatsCluster.Death_Defy` has decoded enum value 32.
292. `SubstatsCluster.Wall_Health` and `Wall_Rebuild` have decoded enum values 33 and 34.
293. `SubstatsCluster.Cash_Bonus`, `Cash_Per_Wave`, `Coins_Per_Kill`, and `Coins_Per_Wave` have decoded enum values 35–38 respectively.
294. `SubstatsCluster.Free_Attack_Upgrade`, `Free_Defense_Upgrade`, and `Free_Utility_Upgrade` have decoded enum values 39, 40, and 41.
295. `SubstatsCluster.Interest_Per_Wave`, `Recovery_Amount`, `Max_Recovery`, and `Package_Chance` have decoded enum values 42–45 respectively.
296. `SubstatsCluster.Enemy_Attack_Level_Skip` and `Enemy_Health_Level_Skip` have decoded enum values 46 and 47.
297. Ultimate-weapon-related labels include Chain Lightning (48–50), Smart Missiles (51–53), Death Wave (54–56), Chrono Field (57–59), Inner Land Mines (60–62), Golden Tower (63–65), Poison Swamp (66–68), Black Hole (69–71), and Spotlight (72–74).
298. The three values in each listed Ultimate Weapon group are the named Damage/Quantity/Chance, Duration/Cooldown, or other label combinations as individually declared in the enum; the exact per-group labels remain the enum names, not an inferred uniform schema.
299. `ModuleManager.GetSubstatClusterType(SubstatsCluster)` is declared and returns `SubstatsClusterType`.
300. `ModuleManager.GetSubstatName(SubstatsCluster)` is declared and returns String; the enum-to-category mapping and localized display names require method implementation or data inspection.

## Status and limitations

- Claim classification: OBJECTIVE (structural metadata observations).
- Verification status: EXTERNAL-UNVERIFIED for live-game behavior; direct declaration presence is confirmed in the source metadata.
- Auto Reroll execution, wait interval, stop conditions, reroll spending, and target matching: UNKNOWN.
- Ban defaults, per-type allowed lists, and maximum number of bans: UNKNOWN.
- `ModuleRandomTest` algorithm identity and relationship to production random state: UNKNOWN.
- Enum numeric values are decoded metadata values, not a verified player-facing ordering or eligibility map.
- No executable method bodies were available; no runtime tests or simulation were performed.
- No GKB claim promotion performed.
