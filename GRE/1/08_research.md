# Research
Source: Assembly-CSharp.dll metadata v39. Types may appear in more than one domain. Names are not proof of runtime behavior.

15 type records. Full field, method and property records in `08_research.json`.

## Lab
Type #525, offset `0x8726e8`. Fields: 181; methods: 75; properties: 3.
Methods: `Awake`, `Initialize`, `SetResearchName`, `SetResearchName`, `GetResearchNamePlain`, `LanguageUpdate`, `DescriptionUpdate`, `CheckNewResearches`, `ClearNewTags`, `ResearchTilesShowUpdate`, `ToggleHideCompleted`, `ToggleShowSliderResearches`, `UpdateLabTilesPanelHeight`, `LabPanelOpen`, `RefreshCellsDisplay`, `LabPanelUpdate`, `UpdatePausedBoostUI`, `UpdateIdleOrOfflineUI`, `UpdateLabUI`, `ResearchComplete`, `HandleRangeResearchComplete`, `HandleShockwaveResearchComplete`, `HandleSwampRangeResearchComplete`, `HandleFlameBotResearchComplete`, `HandleThunderBotResearchComplete`, `HandleGoldenBotResearchComplete`, `HandleAmplifyBotResearchComplete`, `HandleBotBotResearchComplete`, `HandleEnemyResearchComplete`, `LabPanelClose`, `LabResearchPanelOpen`, `ResearchRequirementsMet`, `AnyResearchAvailable`, `LabResearchPanelUpdate`, `LabResearchPanelClose`, `LabCalculations`, `LabAssignResearch`, `UpdateSelectedResearchLevelUI`, `IncrementLabResearchLevel`, `OnResearchLevelSliderValueChanged`, `DecrementLabResearchLevel`, `ConfirmAssignResearch`, `CancelAssignResearch`, `LabCancel`, `SwapResearchConfirm`, `LabUnlockButton`, `DoLabUnlock`, `InstantCompleteButton`, `SpeedUpClose`, `InstantCompleteConfirm`, `InstantCompleteCostCalc`, `SpeedUpOpen`, `LabUpgradeButton`, `LabUpgradeCostCalc`, `ResearchCompleteFloatingText`, `OpenLabHistoryPanel`, `CloseLabHistoryPanel`, `ToggleCategory`, `ToggleCategory`, `RebuildLayoutEndOfFrame`, `ToggleFavoriteLab`, `InitializeFavoriteLabs`, `OnSearchBarChanged`, `ToggleLabQueue`, `BoostHours`, `BoostMultiplier`, `CalculateLabRushGoldBoxDiscount`, `GetNumGoldBoxLabs`, `OpenLabInfoPanel`, `CloseLabInfoPanel`
Candidate decoded constants: `RESEARCH_LIMIT = 260`, `LAB_RUSH_GOLD_BOX_DISCOUNT = 0.0149999997`

## CompletedLab
Type #526, offset `0x872734`. Fields: 3; methods: 8; properties: 3.
Methods: none selected

## ResearchCategory
Type #527, offset `0x872780`. Fields: 12; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Main = 0`, `Attack = 1`, `Defense = 2`, `Utility = 3`, `Ultimate = 4`, `Cards = 5`, `Perks = 6`, `Bots = 7`, `Enemies = 8`, `Modules = 9`, `Favorites = 10`

## Step
Type #528, offset `0x8727cc`. Fields: 12; methods: 0; properties: 0.
Methods: none selected

## LabClockLogger
Type #529, offset `0x872818`. Fields: 4; methods: 4; properties: 0.
Methods: `BeginSession`, `LogStep`, `FlushToConsoleIfNeeded`

## LabClock
Type #530, offset `0x872864`. Fields: 6; methods: 11; properties: 3.
Methods: `ProgressLabs`, `ProcessLabProgress`, `GetCurrentSpeed`, `ApplyTimeStep`, `HandleEvents`, `HandleBoostExpiration`, `TryAutoQueueSpeedUp`
Candidate decoded constants: `EIGHTEEN_MONTHS_IN_SECONDS = 47088000`, `ONE_MONTH_IN_SECONDS = 2592000`

## LabFloating
Type #531, offset `0x8728b0`. Fields: 10; methods: 5; properties: 0.
Methods: `Awake`, `EnqueueLab`, `ShowNew`

## LabFloatingNotification
Type #532, offset `0x8728fc`. Fields: 2; methods: 1; properties: 0.
Methods: none selected

## LabSpeedUp
Type #534, offset `0x872994`. Fields: 2; methods: 17; properties: 0.
Methods: `Awake`, `OnDestroy`, `Initialize`, `SpeedUpOpen`, `SpeedUpClose`, `SpeedUpPanelUpdateCoroutine`, `SpeedUpConfirm`, `SpeedUpTimeButton`, `SpeedUpMultiplierButton`, `ToggleAutoSpeedUpQueue`, `SpeedUpPanelUpdate`, `GetRemainingSpeedUpTime`, `UpdateSpeedUpCostsFromRemoteConfig`, `BoostDurationSeconds`, `SetBoost`, `ClearBoost`

## LabTimeManager
Type #536, offset `0x872a2c`. Fields: 2; methods: 8; properties: 0.
Methods: `Initialize`, `RestartLabProgressUpdate`, `LabProgressUpdateFunction`, `LabProgressUpdate`, `UpdateLabUI`, `ApplyOfflineProgress`, `UpdateActiveLabTimesFromSideEffect`

## PlayerData
Type #873, offset `0x878e38`. Fields: 836; methods: 1674; properties: 835.
Methods: `To2DArrayExpandable`, `To2DArray`, `To1DArray`
