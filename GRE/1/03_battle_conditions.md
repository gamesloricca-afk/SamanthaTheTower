# Battle Conditions
Source: Assembly-CSharp.dll metadata v39. Types may appear in more than one domain. Names are not proof of runtime behavior.

48 type records. Full field, method and property records in `03_battle_conditions.json`.

## BattleConditionTile
Type #112, offset `0x86ac4c`. Fields: 4; methods: 3; properties: 0.
Methods: `Awake`, `SetCondition`

## BattleConditionsPanelUI
Type #114, offset `0x86ace4`. Fields: 15; methods: 6; properties: 0.
Methods: `Awake`, `Populate`, `PopulateTileArray`, `Button_HeatTab`, `Button_OverheatTab`

## BattleHistoryEntryUI
Type #115, offset `0x86ad30`. Fields: 20; methods: 8; properties: 0.
Methods: `SetValues`, `OpenRoundStatsPanel`, `SetMode`, `UpdateUI`, `SelectForDeletion`, `UnselectForDeletion`, `ToggleForDeletion`
Candidate decoded constants: `SELECTION_OFFSET = 25`

## BattleHistoryEntryUIMode
Type #116, offset `0x86ad7c`. Fields: 3; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `View = 0`, `Edit = 1`

## BattleHistoryStatData
Type #117, offset `0x86adc8`. Fields: 3; methods: 1; properties: 0.
Methods: none selected

## BattleHistoryRoundStatsPanel
Type #118, offset `0x86ae14`. Fields: 6; methods: 9; properties: 0.
Methods: `UpdateBattleRoundHistoryPanel`, `UpdatePanelTitle`, `ClearGeneratedUI`, `GenerateStatsUI`, `CreateSectionHeader`, `CreateStatRow`, `GetStatsData`, `Button_CopyToClipboard`

## BattlePresetsUI
Type #122, offset `0x86af44`. Fields: 7; methods: 10; properties: 2.
Methods: `Open`, `Button_TogglePresetOptions`, `Button_OpenTier`, `Button_OpenTournament`, `Button_OpenDissonant`, `Close`, `Select`

## HeatDefinition
Type #230, offset `0x86cf54`. Fields: 4; methods: 1; properties: 0.
Methods: none selected

## Entry
Type #231, offset `0x86cfa0`. Fields: 3; methods: 1; properties: 0.
Methods: none selected

## BattleConditionsSnapshot
Type #232, offset `0x86cfec`. Fields: 2; methods: 1; properties: 0.
Methods: none selected

## DevPanelBattleConditions
Type #282, offset `0x86dec4`. Fields: 19; methods: 21; properties: 1.
Methods: `Awake`, `OnEnable`, `RebuildDropdown`, `GetConditionName`, `GetRange`, `OnConditionChanged`, `OnLevelEdited`, `SetLevel`, `OnAdd`, `OnClear`, `RemoveOverride`, `PushOverridesToGame`, `ShowResult`, `RefreshActiveList`
Candidate decoded constants: `TableMin = 0`, `TableMax = 1`, `HardCap = 2`

## DissonanceBonusUI
Type #283, offset `0x86df10`. Fields: 8; methods: 8; properties: 0.
Methods: `CycleDisplay`, `OpenInfo`, `Open`, `UpdateUI`, `CreateEntries`, `UpdateEntries`, `UpdateEchoTexts`

## DissonanceBoost
Type #284, offset `0x86df5c`. Fields: 7; methods: 15; properties: 2.
Methods: `GetValue`, `GetValueWithoutLab`, `GetResearchBonus`, `GetWaveReached`, `IsMaxed`, `SetRecord`, `SetBonus`, `SetMaxWave`, `CalculateGlobalBonus`, `ResearchBonus`

## DissonanceInfoUI
Type #285, offset `0x86dfa8`. Fields: 2; methods: 3; properties: 0.
Methods: `Open`, `UpdateUI`

## DissonanceType
Type #286, offset `0x86dff4`. Fields: 6; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `None = 0`, `Attack = 1`, `Defense = 2`, `Utility = 3`, `UltimateWeapon = 4`

## DissonantBoostDisplay
Type #287, offset `0x86e040`. Fields: 4; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `BoostPlusEcho = 0`, `BoostOnly = 1`, `EchoOnly = 2`

## DissonanceRemoteData
Type #288, offset `0x86e08c`. Fields: 5; methods: 0; properties: 0.
Methods: none selected

## DissonanceManager
Type #289, offset `0x86e0d8`. Fields: 12; methods: 30; properties: 13.
Methods: `Awake`, `UpdateFromRemoteData`, `StartDissonantRun`, `SetRecord`, `ConsumeNewRecord`, `GetBoost`, `GetBoostValue`, `GetBoostLocalizationNumber`, `GetTabLocalizationNumber`, `GetSelectedBoostValue`, `OpenDissonanceInfoWindow`

## DissonanceTabButton
Type #290, offset `0x86e124`. Fields: 2; methods: 5; properties: 0.
Methods: `Start`, `OnDestroy`, `UpdateValue`, `Click`

## DissonanceTypeIcon
Type #291, offset `0x86e170`. Fields: 5; methods: 2; properties: 0.
Methods: `SetIcon`

## TournamentLeagueID
Type #515, offset `0x8723f0`. Fields: 8; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Copper = 0`, `Silver = 1`, `Gold = 2`, `Platinum = 3`, `Champion = 4`, `Legend = 5`, `Mythic = 6`

## BattleHistoryEntry
Type #619, offset `0x8742d0`. Fields: 148; methods: 297; properties: 148.
Methods: none selected

## TournamentData
Type #988, offset `0x87b05c`. Fields: 8; methods: 2; properties: 1.
Methods: `LoadFromNode`

## TournamentInfo
Type #990, offset `0x87b0f4`. Fields: 12; methods: 12; properties: 1.
Methods: `Init`, `OnValueChanged`, `LoadFromServer`, `LoadFromSnapshot`, `Cleanup`

## TournamentInfoUI
Type #991, offset `0x87b140`. Fields: 4; methods: 4; properties: 0.
Methods: `Awake`, `OnDestroy`, `_checkLeagueStatus`

## PanelState
Type #992, offset `0x87b18c`. Fields: 6; methods: 0; properties: 0.
Methods: none selected
Candidate decoded constants: `Start = 0`, `TryAgain = 1`, `Progress = 2`, `Finished = 3`, `Loading = 4`

## TournamentManager
Type #1002, offset `0x87b484`. Fields: 173; methods: 129; properties: 20.
Methods: `Awake`, `Start`, `Initialize`, `OneSecondCheckers`, `CheckTournamentOvertime`, `GetTournamentPath`, `GetTournamentPrizeByLeagueID`, `GetLeagueIcon`, `GetLeagueNameCode`, `GetLeagueIDFromNameCode`, `GetLeagueName`, `GetLeagueNameSmall`, `GetLeagueTier`, `GetLeagueIDFromTier`, `GetPromotionRank`, `GetDemotionRank`, `SetCurrentLeague`, `UpdateCurrentTournament`, `TryGiveFreeTicket`, `ForceFinishTournament`, `CheckTournamentButton`, `LoadLeaguesInfo`, `InitPlayerData`, `AfterInfoAndPlayerDataLoad`, `SendMailForUnclaimedTournaments`, `SyncPlayerBannedFromTournament`, `BanFromTournament`, `UpdateTournamentIDText`, `StartTournament`, `AttemptSuccessful`, `JoinSuccessful`, `AttemptFailed`, `JoinTournament`, `StartAttempt`, `EndAttempt`, `SetAttempt`, `TryRegisterAttemptCoroutine`, `TryRegisterAttempt`, `ReportRegisterAttemptIssue`, `GetTournamentLeaderboard`, `GetTournamentLeaderboard`, `RefreshLeaderboardLocally`, `UpdateLeaderboardPositions`, `UpdateLeaderboardPositions`, `OnLeaderboardUpdated`, `UpdateLeaderboard`, `TournamentPanelOpen`, `UpdatePanelState`, `TournamentPanelClose`, `HistoryOpen`, `HistoryClose`, `HistoryUpdate`, `TournamentUpdateDataCoroutine`, `TournamentPanelUpdateTimeLeftCoroutine`, `AddTicket`, `ViewAllPrizes`, `UpdateSelectedPrizes`, `SelectCopperLeague`, `SelectSilverLeague`, `SelectGoldLeague`, `SelectPlatinumLeague`, `SelectChampionLeague`, `SelectGrandChampionLeague`, `SelectMythicLeague`, `ViewAllPrizesClose`, `ShowTournamentFinished`, `LeaguePromotion`, `AwardLegendRelic`, `AwardRelics`, `PromotionPanelClose`, `CalculateNewLeague`, `GetLeaguePromotion`, `GetPrizeRewards`, `GetBracketPrizeMultiplier`, `GetPrize`, `GetClaimPrize`, `GetCurrentPrizeIndex`, `CollectTournamentPrize`, `ClaimTournamentPrize`, `FreeTicketPanelOpen`, `AddFreeTicket`, `BuyTicketPanelOpen`, `ClaimTicket`, `BuyTicketAds`, `BuyTicketGems`, `GetBestTournamentRecord`, `InitTournamentPrizes`, `TournamentInfoPanelOpen`, `TournamentFTUEPanelOpen`, `TournamentFTUEPanelClose`, `StartTournamentFTUEBattle`, `TournamentFTUEEndPanelOpen`, `TournamentFTUEEndPanelClose`, `ClaimTournamentFTUEReward`, `OnDestroy`, `TryGetTournamentPrize`, `ViewAllPrizesInfo`
Candidate decoded constants: `ALL_PRIZES_DESCRIPTION_X_POS = -30`, `MIN_PLAYERS_FOR_RELICS_PROMOTIONS_DEMOTIONS = 10`, `TOURNAMENT_FTUE_STONE_REWARD = 5`

## TournamentPrizeEntry
Type #1003, offset `0x87b4d0`. Fields: 5; methods: 1; properties: 0.
Methods: none selected

## TournamentLeaderboardEntry
Type #1004, offset `0x87b51c`. Fields: 4; methods: 2; properties: 0.
Methods: `CompareTo`

## TournamentAttempt
Type #1005, offset `0x87b568`. Fields: 4; methods: 9; properties: 4.
Methods: none selected

## TournamentRegistry
Type #1006, offset `0x87b5b4`. Fields: 5; methods: 11; properties: 5.
Methods: none selected

## TournamentPlayerData
Type #1008, offset `0x87b64c`. Fields: 9; methods: 15; properties: 2.
Methods: `Init`, `OnValueChanged`, `LoadFromServer`, `LoadFromSnapshot`, `TryGetTournamentBanEndDateTime`, `IsTournamentBanActive`, `Cleanup`

## TournamentRegistryEntry
Type #1009, offset `0x87b698`. Fields: 5; methods: 2; properties: 0.
Methods: `Set`

## WaveInfoPanel
Type #1110, offset `0x87d494`. Fields: 20; methods: 10; properties: 1.
Methods: `ShowWaveInfoPanel`, `ShowStatsPanel`, `WaveInfoPanelOpen`, `WaveInfoPanelClose`, `WaveInfoPanelUpdateFunction`, `WaveInfoPanelUpdate`, `CalculateEnemyValues`, `ApplyVaultEnemyReductions`
