# Domain 09 — Modules: Benefit Accessors, Banner Configuration, Drop and Merge Interfaces (Findings 401–500)

## Scope and source

- Source artifact: `GRE/1/09_modules.json`
- Source blob SHA: `016cc346998a2c3fafcc945ca0d01308a74e66d5`
- Repository branch: `TestAccount`
- Audit range: findings 401–500
- Evidence: direct metadata field declarations, method signatures, resolved parameter/return types, and decoded constant candidates.
- Game release version: not established by this artifact.
- Executable method bodies: unavailable.

This batch records interfaces and declared constants. Method names and signatures do not establish implementation formulas, runtime ordering, or game balance.

## A. Module benefit accessor map

401. `ModuleManager.get_EquippedCannonBenefit()` returns Single.
402. `ModuleManager.get_EquippedArmorBenefit()` returns Single.
403. `ModuleManager.get_EquippedGeneratorBenefit()` returns Single.
404. `ModuleManager.get_EquippedCoreBenefit()` returns Single.
405. The four equipped main-benefit accessors are declared separately by ModuleType.
406. `ModuleManager.get_AttackSpeed()` returns Single.
407. `ModuleManager.get_CriticalChance()` returns Single.
408. `ModuleManager.get_CriticalFactor()` returns Single.
409. `ModuleManager.get_AttackRange()` returns Single.
410. `ModuleManager.get_AttackPerMeter()` returns Single.
411. `ModuleManager.get_MultishotChance()` and `get_MultishotTargets()` return Single and Int32 respectively.
412. `ModuleManager.get_RapidFireChance()` and `get_RapidFireDuration()` return Single.
413. `ModuleManager.get_BounceShotChance()`, `get_BounceShotTargets()`, and `get_BounceShotRange()` return Single, Int32, and Single respectively.
414. `ModuleManager.get_SuperCriticalChance()` and `get_SuperCriticalMult()` return Single.
415. `ModuleManager.get_RendArmorChance()`, `get_RendArmorMult()`, and `get_RendArmorMax()` return Single.
416. `ModuleManager.get_HealthRegen()` returns Double.
417. `ModuleManager.get_DefensePercentage()` and `get_DefenseAbsolute()` return Double.
418. `ModuleManager.get_ThornDamage()`, `get_Lifesteal()`, `get_KnockbackChance()`, and `get_KnockbackForce()` return Single.
419. `ModuleManager.get_OrbSpeed()` returns Single and `get_OrbCount()` returns Int32.
420. `ModuleManager.get_ShockwaveSize()` and `get_ShockwaveFrequency()` return Single.
421. `ModuleManager.get_LandMineChance()`, `get_LandMineDamage()`, and `get_LandMineRadius()` return Single.
422. `ModuleManager.get_DeathDefy()`, `get_WallHealth()`, and `get_WallRebuild()` return Single.
423. `ModuleManager.get_CashBonus()`, `get_CashPerWave()`, `get_CoinsPerKill()`, and `get_CoinsPerWave()` return Double.
424. `ModuleManager.get_FreeAttackUpgrade()`, `get_FreeDefenseUpgrade()`, and `get_FreeUtilityUpgrade()` return Single.
425. `ModuleManager.get_InterestPerWave()` returns Single.
426. `ModuleManager.get_RecoveryAmount()` and `get_MaxRecovery()` return Double.
427. `ModuleManager.get_PackageChance()` returns Single.
428. `ModuleManager.get_EnemyAttackLevelSkip()` and `get_EnemyHealthLevelSkip()` return Single.
429. The preceding accessors correspond by name to non-UW substat labels in the declared SubstatsCluster enum; this is a naming correspondence, not proof of formula or aggregation behavior.
430. The accessor signatures expose numeric results but do not specify units, caps, rounding, or whether values are additive or multiplicative.

## B. Ultimate Weapon benefit accessor map

431. `ModuleManager.get_ChainLightningDamage()`, `get_ChainLightningQuantity()`, and `get_ChainLightningChance()` return Double.
432. `ModuleManager.get_SmartMissilesDamage()`, `get_SmartMissilesQuantity()`, and `get_SmartMissilesCooldown()` return Double.
433. `ModuleManager.get_DeathWaveDamage()`, `get_DeathWaveQuantity()`, and `get_DeathWaveCooldown()` return Double.
434. `ModuleManager.get_ChronoFieldDuration()`, `get_ChronoFieldSpeedReduction()`, and `get_ChronoFieldCooldown()` return Double.
435. `ModuleManager.get_InnerLandMinesDamage()`, `get_InnerLandMinesQuantity()`, and `get_InnerLandMinesCooldown()` return Double.
436. `ModuleManager.get_GoldenTowerBonus()`, `get_GoldenTowerDuration()`, and `get_GoldenTowerCooldown()` return Double.
437. `ModuleManager.get_PoisonSwampDamage()`, `get_PoisonSwampDuration()`, and `get_PoisonSwampCooldown()` return Double.
438. `ModuleManager.get_BlackHoleSize()`, `get_BlackHoleDuration()`, and `get_BlackHoleCooldown()` return Double.
439. `ModuleManager.get_SpotlightBonus()`, `get_SpotlightAngle()`, and `get_SpotlightQuantity()` return Double.
440. These accessors map to the corresponding Ultimate Weapon substat labels declared in `SubstatsCluster`; the signatures do not establish the effect formula or final in-game value.
441. The API uses Double for the listed UW benefit accessors, while many ordinary tower benefit accessors use Single or Int32.
442. No direct method signature here exposes a per-effect cap or a per-UW calculation formula.
443. `GetEquippedClusterBenefit(SubstatsCluster)` and `GetEquippedAssistClusterBenefit(SubstatsCluster)` are distinct benefit-query interfaces.
444. The presence of separate primary and assist benefit queries supports keeping their data pathways separate in the adapter; it does not establish whether the values are combined before or after other modifiers.

## C. Module drop and creation interfaces

445. `ModuleManager.TryBossDrop()` returns ModuleItem.
446. `ModuleManager.TryCarePackageDrop()` returns ModuleItem.
447. `ModuleManager.GetCommonModuleDropChance()` returns Single.
448. `ModuleManager.GetRareModuleDropChance()` returns Single.
449. `ModuleManager.TryRerollShardsDrop()` returns Int32.
450. `ModuleManager.TryEliteRerollShardsDrop(Single chance)` returns Int32.
451. `ModuleManager.GetShardsReward(Int32 tier)` returns Int32.
452. `ModuleManager.GetNumberOfRerollShards(Int32 tier)` returns Int32.
453. `ModuleManager.GetNumberOfFetchRerollShards(Int32 tier)` returns Int32.
454. `ModuleManager.GetNumberOfModuleShardsForFleets(Int32 wave)` returns Int32.
455. `ModuleManager.GetNumberOfRerollShardsForFleets(Int32 tier)` returns Int32.
456. `ModuleManager.TryFleetsDrop(Int32 spawnedWave)` returns void.
457. These drop interfaces accept tier, wave, or chance inputs as shown; the formulas and drop eligibility rules are not present in the signatures.
458. `ModuleManager.CreateModule()` returns ModuleItem.
459. An overload `CreateModule(ModuleType type)` returns ModuleItem.
460. An overload `CreateModule(ModuleRarity rarity)` returns ModuleItem.
461. An overload `CreateModule(ModuleType type, ModuleRarity rarity)` returns ModuleItem.
462. An overload `CreateModule(Int32 moduleInfoIndex)` returns ModuleItem.
463. An overload `CreateModule(ModuleItem module)` returns ModuleItem.
464. `CreateModuleFromBanner(ModuleBanner banner, Boolean epicPityActive, Boolean rarePityActive)` returns ModuleItem.
465. The creation API has overloads for unconstrained creation, type-constrained creation, rarity-constrained creation, info-index creation, copying from an existing module, and banner-based creation.
466. The overload signatures do not reveal whether they share a common implementation or use different validation and randomization paths.

## D. Banner configuration data model

467. `ModuleBanner.Name` is declared as String.
468. `ModuleBanner.StartDate` and `ModuleBanner.EndDate` are declared as DateTime fields.
469. `ModuleBanner.Price` is declared as Int32.
470. `ModuleBanner.PityRarity` is declared as ModuleRarity.
471. `ModuleBanner.Background` is declared as String.
472. `ModuleBanner.TitleLoc` and `SubtitleLoc` are declared as Int32 localization identifiers.
473. `ModuleBanner.ShowModulePreview` and `Valid` are declared as Boolean fields.
474. `ModuleBanner.Highlighted` is a declared collection-like field.
475. `ModuleBanner.Rarities` and `Modules` are declared collection-like fields.
476. `ModuleBannerModule.InfoIndex` is Int32.
477. `ModuleBannerModule.Chance` is a floating-point field.
478. `ModuleBannerModule.Adjusted` and `Highlighted` are Boolean fields.
479. The banner module entry identifies a module by InfoIndex and carries a Chance field plus two Boolean flags.
480. The metadata does not establish whether Chance is a raw weight, normalized probability, or display percentage.

## E. Banner loading, validation, and display interfaces

481. `ModuleManager.GetBannersFromConfig()` is declared and returns void.
482. `ModuleManager.GetFeaturedBanners()` returns IEnumerator.
483. `ModuleManager.GetRotatingBanners()` returns IEnumerator.
484. `ModuleManager.GetBanners(banners, fieldName)` returns Boolean.
485. `ModuleManager.ClearBannerCache(key)` is declared and returns void.
486. `ModuleManager.TryCreateBanner(name, data, out banner, out problem)` returns Boolean.
487. `ModuleManager.ValidateBannerData(data)` returns String.
488. `ModuleManager.ReportBannerProblem(problem)` is declared and returns void.
489. `ModuleManager.CheckBannerForAdjustedOdds(ModuleBanner banner)` is declared and returns void.
490. `ModuleManager.GetCurrentBanner(banners)` returns ModuleBanner.
491. `ModuleManager.GetEarliestRotatingBanner()` and `GetEarliestFeaturedBanner()` return ModuleBanner.
492. `ModuleManager.GetEarliestBanner(banners)` returns ModuleBanner.
493. `ModuleManager.IsHighlighted(Int32 infoIndex, ModuleBanner banner)` returns Boolean.
494. `ModuleManager.GetPossibleMergeCount()` returns Int32.
495. `ModuleManager.HasHighestAncestralCopy(Int32 infoIndex)` and `HasHighestAncestral(Int32 infoIndex)` return Boolean.
496. `ModuleManager.GetHighestModuleLevelByType(ModuleType type)` returns Int32.
497. ModuleUI declares separate UI methods for featured and rotating banner panels, and a shared `BannerInfoPanelOpen(ModuleBanner banner)` method.
498. ModuleUI declares `OnBannerInfoRarityHeaderClicked()`, `OnBannerInfoTypeHeaderClicked()`, and `OnBannerInfoSearch(String input)`.
499. ModuleUI contains separate featured and rotating buy-one and buy-ten button handlers.
500. The banner interfaces establish configuration retrieval, validation, selection, highlighting, and UI entry points; exact schedule selection, odds adjustment, purchase validation, and display ordering require implementation or source-data evidence.

## Status and limitations

- Claim classification: OBJECTIVE (metadata declarations and signatures).
- Verification status: EXTERNAL-UNVERIFIED for live-game behavior; declarations are directly observed in the source artifact.
- Benefit accessors are not calculation formulas; values, units, caps, and aggregation remain UNKNOWN.
- Drop chance methods and reward methods are interfaces only; their actual probability and reward tables remain UNKNOWN.
- Banner Chance interpretation, odds adjustment, schedule selection, validation rules, and remote/config source remain UNKNOWN.
- No executable method bodies were available; no runtime tests or simulation were performed.
- No GKB claim promotion performed.
