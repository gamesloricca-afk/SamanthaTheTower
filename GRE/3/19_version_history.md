# Version History
Source: Assembly-CSharp.dll metadata v39. Types may appear in more than one domain. Names are not proof of runtime behavior.

23 type records. Full field, method and property records in `19_version_history.json`.

## MigrationLifetimeStones
Type #630, offset `0x874614`. Fields: 0; methods: 3; properties: 0.
Methods: `ComputeTotalStoneSpendFromState`, `ShouldLogLifetimeStonesMigrationSpend`, `AppendSpendDebugLine`

## ModuleRandomTest
Type #693, offset `0x8758c8`. Fields: 4; methods: 0; properties: 0.
Methods: none selected

## ModuleManager
Type #703, offset `0x875bc0`. Fields: 110; methods: 294; properties: 89.
Methods: `GetMaxSlotLevel`, `GetPrimarySlotLevel`, `GetAssistSlotLevel`, `GetSlotLevel`, `SetSlotLevel`, `GetSlotCoinsSpent`, `GetSlotShardsSpent`, `AddSlotSpend`, `ClearSlotSpend`, `TryGetEquippedSlot`, `GetEffectiveModuleLevel`, `GetEffectiveLevelForSlot`, `IsSlotRarityCapped`, `ResolveLevelUpSlot`, `ClearModuleLevelData`, `GetAllModuleItems`, `MigrateModuleLevelsToSlots`, `HasSlotLevelMigrationRefund`, `ShowSlotLevelMigrationPopupIfNeeded`, `Awake`, `Initialize`, `OnDestroy`, `GetModuleName`, `GetModuleUniqueDescription`, `GetModuleUniqueValue`, `GetEffectDescription`, `GetModuleIcon`, `GetShards`, `GetShardsIcon`, `TestInventory`, `TryBuyModuleFromBanner`, `TryBuyModuleBulkFromBanner`, `BuyModuleBulkFromBanner`, `SimulateBuyModuleFromBanner`, `ApplyModulePreset`, `SnapshotEquippedToPreset`, `ApplyPreset`, `FindInventoryModuleByGuid`, `FindModuleByGuid`, `IsEquippedInOtherPreset`, `EquipModule`, `UnequipModule`, `UnequipModule`, `HaveModuleOfRarityOrHigher`, `Unmerge`, `IsMergeValid`, `IsMergeValid`, `IsAtMaxRarity`, `CanBeMerged`, `IsSelectedToMerge`, `IsSelectedOrCanBeMerged`, `ClearMerge`, `SelectToMerge`, `RemoveFromMerge`, `Merge`, `Merge`, `CalculateAutoMerge`, `TryBossDrop`, `TryCarePackageDrop`, `GetCommonModuleDropChance`, `GetRareModuleDropChance`, `TryRerollShardsDrop`, `TryEliteRerollShardsDrop`, `GetShardsReward`, `GetNumberOfRerollShards`, `GetNumberOfFetchRerollShards`, `GetNumberOfModuleShardsForFleets`, `GetNumberOfRerollShardsForFleets`, `TryFleetsDrop`, `CreateModule`, `CreateModule`, `CreateModule`, `CreateModule`, `CreateModule`, `CreateModuleFromBanner`, `CreateModule`, `IsEquipped`, `IsEquipped`, `TryGetRarityIfEquipped`, `CalculateLevelUpUsingBuyMultiplier`, `CalculateLevelUpOnce`, `CalculateLevelUpToNextEffect`, `CalculateLevelUp`, `CalculateLevelUpMax`, `LevelUpToNextEffect`, `LevelUpMax`, `_levelUpToNewLevel`, `LevelUp`, `RestoreSlot`, `GetShatterUniqueModuleComponents`, `ShatterModule`, `HaveEmptyEffects`, `GetLockedSubstats`, `RollEmptyEffects`, `TryAddAvailableEffects`, `HasEffectsToReroll`, `RerollNotLockedEffects`, `DoRerollNotLockedEffects`, `GetSeedFromModuleIdentityAndRerollCount`, `GetAllStructurallyValidEffectIndicesForModuleType`, `RollDeterministicSubstatCandidate`, `RollEffectRarityFromRandomValue`, `GetRarityToTryForFallbackStep`, `IsCandidateAllowedAfterAllRerollFilters`, `IsClusterBannedForThisModuleType`, `CreateSeededRandomForAttempt`, `GetPotentialEffectsForModule`, `GetAllPotentialEffectsForModule`, `GetAllowedClustersForModule`, `AutoRollRunCheck`, `GetLevelUpShardsCost`, `GetLevelUpCoinsCost`, `GetRerollCost`, `GetBenefitIfEquipped`, `GetEquippedClusterBenefit`, `GetEquippedAssistClusterBenefit`, `GetModuleAfterMergeBenefit`, `GetModuleMainBenefit`, `GetModuleMainBenefit`, `GetCannonBaseBenefit`, `GetArmorBaseBenefit`, `GetGeneratorBaseBenefit`, `GetCoreBaseBenefit`, `GetCannonMainBenefit`, `GetArmorMainBenefit`, `GetGeneratorMainBenefit`, `GetCoreMainBenefit`, `GetModuleFrame`, `GetSubstatClusterType`, `GetSubstatName`, `GetMaxLevelPerRarity`, `GetEffectSlotRequiredLevel`, `GetEffectSlotMaxShownSlots`, `GetEffectMaxSlots`, `GetUniqueBenefit`, `IsNaturalEpicModule`, `GetShatterShards`, `GetUnmergeShards`, `TryGetUniqueBenefit`, `AddModuleTickets`, `SpendModuleTickets`, `LoadModuleTickets`, `RefreshTicketUI`, `GiveFreeTickets`, `GetMainEffectName`, `GetRarityName`, `GetRarityName`, `GetTypeName`, `GetMaxEffectRarity`, `GetMergeRequirement`, `CalculateAllIfRound`, `GetBannersFromConfig`, `StopActiveCoroutines`, `GetFeaturedBanners`, `GetRotatingBanners`, `GetBanners`, `ClearBannerCache`, `TryCreateBanner`, `ValidateBannerData`, `ReportBannerProblem`, `CheckBannerForAdjustedOdds`, `GetPossibleMergeCount`, `IsHighlighted`, `HasHighestAncestralCopy`, `HasHighestAncestral`, `GetHighestModuleLevelByType`, `GetCurrentBanner`, `FeaturedBannerDurationCheck`, `RotatingBannerDurationCheck`, `GetEarliestRotatingBanner`, `GetEarliestFeaturedBanner`, `GetEarliestBanner`, `GetAssistModuleUniqueEffectEfficiency`, `GetAssistModuleUniqueEffectEfficiencyString`, `GetAssistModuleUniqueEffectCost`, `GetPrimaryModuleBonus`, `GetAssistModuleMainEffectEfficiency`, `GetAssistModuleMainEffectEfficiency`, `GetAssistModuleMainEffectLevel`, `GetAssistModuleMainEffectCost`, `GetAssistModuleSubstatEfficiency`, `GetAssistModuleSubstatEfficiency`, `GetAssistModuleSubstatLevel`, `GetAssistModuleSubstatCost`, `UnlockCannonAssistModuleSlot`, `UnlockArmorAssistModuleSlot`, `UnlockGeneratorAssistModuleSlot`, `UnlockCoreAssistModuleSlot`, `IsEquippedAssist`, `IsEquippedAssist`, `EquipModuleAssist`, `UnequipModuleAssist`, `UnequipModuleAssist`, `IsEquippedOnPrimaryOrAssist`, `IsEquippedOnPrimaryOrAssist`, `RespecAssistModules`, `IsDisabledAssistSubstat`, `IsCappedAssistSubstatEffect`, `CorrectModuleSlotTypes`
Candidate decoded constants: `UNMERGE_COST = 20`, `PITY = 150`, `RARE_PITY = 10`, `INVENTORY_LIMIT = 350`, `MODULE_DROP_COOLDOWN = 5`, `MODULE_DROP_COOLDOWN_CHAMPION = 5`, `MODULE_HISTORY_LIMIT = 150`, `MAX_RARITY_DROP_ADJUSTMENT_MULTIPLIER = 0.25`, `ASSIST_MODULE_SLOT_UNLOCK_COST = 1000`, `ASSIST_MODULE_UNIQUE_EFFECT_EFFICIENCY_MAX_LEVEL = 3`, `ASSIST_MODULE_MAIN_EFFECT_EFFICIENCY_MAX_LEVEL = 99`, `ASSIST_MODULE_SUBSTAT_EFFICIENCY_MAX_LEVEL = 69`, `BEING_ANNIHILATOR_GUARANTEED_SUPER_CRITS = 5`, `TACTICAL_BARRAGE_MISSILE_LOCK_DELAY = 0.5`, `NUM_DEFINED_MODULES = 53`, `MODULE_BASE_PRESETS = 2`, `deterministicRollAttemptsPerSlot = 5000`

## SaveType
Type #872, offset `0x878dec`. Fields: 6; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Normal = 0`, `IgnoreCloud = 1`, `IgnoreCloudIfTimer = 2`, `ForceLocalToCloud = 3`, `LastSave = 4`

## PlayerData
Type #873, offset `0x878e38`. Fields: 836; methods: 1674; properties: 835.
Methods: `To2DArrayExpandable`, `To2DArray`, `To1DArray`

## BetaModuleConfig
Type #874, offset `0x878e84`. Fields: 3; methods: 7; properties: 3.
Methods: none selected

## BetaModule
Type #875, offset `0x878ed0`. Fields: 4; methods: 11; properties: 6.
Methods: none selected

## SaveLoad
Type #881, offset `0x879098`. Fields: 41; methods: 38; properties: 2.
Methods: `Awake`, `Start`, `OnDestroy`, `OnNotAbleToCloudSave`, `AutoSaveFunction`, `OnAutoSaveStart`, `OnAutosaveComplete`, `OnSessionChanged`, `OnApplicationQuit`, `ScheduleSave`, `Save`, `BuildPlayerData`, `SaveData`, `Load`, `RecoverCells`, `MigrateFTUEProgress`, `ApplyLoad`, `DescribeLoadFailure`, `ReadData`, `DeleteLocalSave`, `Reset`, `HadOldHarmonyNode`, `ClearBetaBotPreset`, `LoadArray`, `LoadArray`, `LoadArray`, `LogDateTimesKind`, `SanitizeAndMigrateLabSpeedUps`, `LogMissingFirestoreProperties`, `SanitizePresetNames`, `ResetAutoSaveCoroutine`, `MigrateLifetimeStonesEarnedStats`, `LogLifetimeStonesMigrationKeys`
Candidate decoded constants: `VERSION_NUMBER = 1301`, `VERSION_UPDATE_NOTES = 642`, `CURRENT_DATA_VERSION = 35`, `BETA_BOT_PRESET_INDEX = 3`

## VersionLockManager
Type #1108, offset `0x87d3fc`. Fields: 12; methods: 23; properties: 7.
Methods: `Awake`, `Start`, `OnDestroy`, `TryForceVersionLock`, `ShouldForceVersionLock`, `TryShowUpdateAvailablePopup`, `OpenStorePage`, `GetCurrentMin`, `GetCurrentLatest`, `Debug_SetMinVersion`, `Debug_SetLatestVersion`
