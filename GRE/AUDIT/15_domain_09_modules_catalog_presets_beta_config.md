# Domain 09 — Modules: Catalog Access, Beta Module Configuration, Presets, and Assist Interfaces (Findings 301–400)

## Scope and source

- Source artifact: `GRE/1/09_modules.json`
- Source blob SHA: `016cc346998a2c3fafcc945ca0d01308a74e66d5`
- Repository branch: `TestAccount`
- Audit range: findings 301–400
- Evidence: direct metadata declarations, field types where resolved, method signatures, and decoded constant candidates.
- Game release version: not established by this artifact.
- Executable method bodies: unavailable in this metadata dump.

This batch extends the structural inventory. It does not infer actual gameplay behavior from method names, UI labels, or field names.

## A. Module catalog access and presentation interfaces

301. `ModuleManager.modulesInfo` is a declared collection-like field for module information records; its concrete generic element type is unresolved in this dump.
302. `ModuleManager.effects` is a separate declared collection-like field for effect records; its concrete generic element type is unresolved here.
303. `ModuleManager.GetModuleName(Int32 infoIndex)` returns String.
304. `ModuleManager.GetModuleUniqueDescription(Int32 infoIndex)` returns String.
305. `ModuleManager.GetModuleUniqueValue(Int32 infoIndex, ModuleRarity rarity)` returns String.
306. `ModuleManager.GetEffectDescription(Int32 effectIndex)` returns String.
307. `ModuleManager.GetModuleIcon(Int32 infoIndex)` returns UnityEngine.Sprite.
308. `ModuleManager.GetModuleFrame(ModuleType type, ModuleRarity rarity)` returns UnityEngine.Sprite.
309. `ModuleManager.GetMainEffectName(ModuleType type)` returns String.
310. `ModuleManager.GetTypeName(ModuleType type)` returns String.
311. `ModuleManager.GetRarityName(ModuleRarity rarity)` returns String.
312. An overload `GetRarityName(EffectRarity rarity)` also returns String.
313. `ModuleManager.GetUniqueBenefit(Int32 infoIndex, ModuleRarity rarity)` returns Double.
314. `ModuleManager.TryGetUniqueBenefit(Int32 infoIndex, out benefit)` returns Boolean; the exact benefit output type is not resolved in this report.
315. `ModuleManager.GetMaxEffectRarity(ModuleRarity rarity)` returns EffectRarity.
316. `ModuleManager.IsNaturalEpicModule(Int32 infoIndex)` returns Boolean.
317. `ModuleManager.TryGetRarityIfEquipped(Int32 infoIndex, out rarity)` returns Boolean; the output enum type is not resolved here.
318. `ModuleManager.GetEffectBox(EffectRarity rarity)` in ModuleUI returns UnityEngine.Sprite.
319. `ModuleManager.GetRarityColor(ModuleRarity rarity)` in ModuleUI returns UnityEngine.Color.
320. `ModuleManager.GetRarityColor(EffectRarity rarity)` in ModuleUI returns UnityEngine.Color.
321. `ModuleManager.GetPastelRarityColor(EffectRarity rarity)` in ModuleUI returns UnityEngine.Color.
322. `ModuleUniqueEffectUI.Open(ModuleItem module, Boolean fromProfile)` is declared.
323. `ModuleUniqueEffectUI` has a module name text field and an effect description field.
324. `ModuleUniqueEffectUI` has an `effectSelected` collection-like field; its concrete element type is unresolved.
325. These methods expose catalog lookup and presentation interfaces; they do not reveal the actual module catalog records or localized strings.

## B. Module data model and benefit access

326. `ModuleInfo` declares a `type` field.
327. `ModuleInfo` declares a `rarity` field.
328. `ModuleInfo` declares a `uniqueBenefit` field.
329. `ModuleInfo` declares a `benefitType` field.
330. `ModuleEffect` declares a `type` field.
331. `ModuleEffect` declares a `rarity` field.
332. `ModuleEffect` declares a `benefit` field.
333. `ModuleEffect` declares a `benefitType` field.
334. `ModuleEffect` declares a `clusterIndex` field.
335. `ModuleManager.GetModuleMainBenefit(ModuleItem module)` returns Single.
336. An overload `GetModuleMainBenefit(ModuleItem module, Int32 level, ModuleRarity rarityOverride, Boolean isAssist)` returns Single.
337. `ModuleManager.GetModuleAfterMergeBenefit(ModuleItem module)` returns Single.
338. `ModuleManager.GetEquippedClusterBenefit(SubstatsCluster cluster)` returns Double.
339. `ModuleManager.GetEquippedAssistClusterBenefit(SubstatsCluster cluster)` returns Double.
340. The primary and assist equipped-cluster benefit queries are separate method declarations.
341. `ModuleManager.GetMaxLevelPerRarity(ModuleRarity rarity)` returns Int32.
342. `ModuleManager.GetEffectSlotRequiredLevel(Int32 slotIndex)` returns Int32.
343. `ModuleManager.GetEffectSlotMaxShownSlots(Int32 slotLevel)` returns Int32.
344. `ModuleManager.GetEffectMaxSlots(ModuleRarity initialRarity)` returns Int32.
345. These signatures establish lookup interfaces for levels, slots, and benefit values; numerical formulas are not present in this metadata.
346. `ModuleManager.GetEffectiveModuleLevel(ModuleItem module)` returns Int32.
347. `ModuleManager.GetEffectiveLevelForSlot(Boolean isAssist, Int32 slotIndex, ModuleItem module)` returns Int32.
348. `ModuleManager.IsSlotRarityCapped(Boolean isAssist, Int32 slotIndex, ModuleItem module)` returns Boolean.
349. `ModuleManager.GetHighestModuleLevelByType(ModuleType type)` returns Int32.
350. The method signatures distinguish a module's effective level from a slot-specific effective level, without exposing how either is calculated.

## C. Module inventory and identity interfaces

351. `ModuleManager.inventory` is a declared collection-like field.
352. `ModuleManager.GetAllModuleItems()` returns a collection-like result.
353. `ModuleManager.FindInventoryModuleByGuid(String guid)` returns ModuleItem.
354. `ModuleManager.FindModuleByGuid(String guid)` returns ModuleItem.
355. Two GUID lookup methods are declared with different names; their search scope difference is not established by signatures alone.
356. `ModuleItem.guid` is exposed through getter and setter methods.
357. `ModuleItem.infoIndex` is exposed through getter and setter methods.
358. `ModuleItem.currentRarity` is exposed through getter and setter methods.
359. `ModuleItem.level` is exposed through getter and setter methods.
360. `ModuleItem.maxLevelReached` is exposed through getter and setter methods.
361. `ModuleItem.effects` is exposed through getter and setter methods.
362. `ModuleItem.effectLocked` is exposed through getter and setter methods.
363. `ModuleItem.rerollCounter` is exposed through getter and setter methods.
364. `ModuleItem.favorite` is exposed through getter and setter methods.
365. `ModuleItem.GetInfo()` returns ModuleInfo.
366. `ModuleManager.INVENTORY_LIMIT` has decoded constant candidate 350.
367. The decoded value 350 is a metadata constant candidate; runtime enforcement and any exceptions are not proven here.
368. `ModuleManager.TestInventory()` is declared and returns void.
369. `ModuleManager.ClearModuleLevelData(ModuleItem module)` is declared and returns void.
370. `ModuleManager.MigrateModuleLevelsToSlots()` is declared and returns void.

## D. Module presets data and operations

371. `ModulePresetData` declares a `presetName` field.
372. `ModulePresetData` declares a `primaryModuleGuids` field.
373. `ModulePresetData` declares an `assistModuleGuids` field.
374. `ModulePresetData.get_PresetName()` returns String.
375. `ModulePresetData.set_PresetName(String value)` is declared.
376. `ModulePresetData.get_PrimaryModuleGuids()` returns a collection-like type whose concrete generic element is unresolved.
377. `ModulePresetData.set_PrimaryModuleGuids(value)` is declared with the same unresolved collection type.
378. `ModulePresetData.get_AssistModuleGuids()` returns a collection-like type whose concrete generic element is unresolved.
379. `ModulePresetData.set_AssistModuleGuids(value)` is declared with the same unresolved collection type.
380. `ModulePresetData.CreateDefault(Int32 index)` returns ModulePresetData.
381. `ModuleManager.modulePresets` is a declared collection-like field.
382. `ModuleManager.currentModulePreset` is an Int32 field.
383. `ModuleManager.MODULE_BASE_PRESETS` has decoded constant candidate 2.
384. `ModuleManager.MODULE_MAX_PRESETS` is a declared constant field, but its decoded value is not present in the extracted field record.
385. `ModuleManager.get_PresetsUnlocked()` returns Boolean.
386. `ModuleManager.get_PresetCount()` returns Int32.
387. `ModuleManager.ApplyModulePreset(Int32 index)` is declared.
388. `ModuleManager.SnapshotEquippedToPreset(Int32 presetIndex)` is declared.
389. `ModuleManager.ApplyPreset(ModulePresetData preset)` is declared.
390. `ModulePresetsUI.Button_SelectPreset(Int32 index)` is declared.
391. `ModulePresetsUI.Button_HoldPreset(Int32 index)` is declared.
392. `ModulePresetsUI.UpdateModulePresetsUI()` is declared.
393. The preset data model separately records primary-module GUIDs and assist-module GUIDs.
394. The declarations do not establish whether applying a preset is atomic, whether unavailable modules are skipped, or how conflicts are handled.
395. The UI has normal and selected preset sprites, but visual states do not establish persistence behavior.

## E. Beta module configuration model

396. `BetaModuleConfig` declares an `enableModules` Boolean property.
397. `BetaModuleConfig` declares a `versionLock` Int32 property.
398. `BetaModuleConfig` declares a `modules` collection-like property; its generic element type is unresolved in this metadata output.
399. `BetaModule` declares a `type` String property.
400. `BetaModule` additionally declares `id` and `rarity` as Int32 properties, an `effects` collection-like property, and conversion getters `get_ModuleTypeEnum()` and `get_RarityEnum()`; this beta configuration model is structurally distinct from the runtime `ModuleItem` model.

## Status and limitations

- Claim classification: OBJECTIVE (metadata structure and signatures).
- Verification status: EXTERNAL-UNVERIFIED for live-game behavior; declarations are directly observed in the source artifact.
- Module catalog contents, unique-effect values, localized names/descriptions, and effect definitions: not extracted by these declarations.
- Inventory limit enforcement, GUID lookup scope, migration behavior, and preset application behavior: UNKNOWN.
- Beta configuration origin, activation lifecycle, version-lock semantics, and compatibility policy: UNKNOWN.
- No executable method bodies were available; no runtime tests or simulation were performed.
- No GKB claim promotion performed.
