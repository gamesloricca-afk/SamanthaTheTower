# Domain 09 — Modules: Assist Slot Progression, Upgrade UI, Slot Accounting, and Restore/Rollback Interfaces (Findings 601–700)

## Scope and source

- Source artifact: `GRE/1/09_modules.json`
- Source blob SHA: `016cc346998a2c3fafcc945ca0d01308a74e66d5`
- Repository branch: `TestAccount`
- Audit range: findings 601–700
- Evidence: direct metadata field declarations, method signatures, resolved parameter/return types, and decoded constant candidates.
- Game release version: not established by this artifact.
- Executable method bodies: unavailable.

This batch maps Assist Module progression declarations and the UI/data interfaces around them. Decoded values are candidates, not confirmed runtime values.

## A. Assist slot model and declared limits

601. `AssistModuleSlot` is a declared data type in the module domain.
602. `AssistModuleSlot.unlocked` is a Boolean field.
603. `AssistModuleSlot.type` uses the `AssistModuleSlotType` enum.
604. `AssistModuleSlot.equippedModule` stores a `ModuleItem` reference.
605. `AssistModuleSlot.uniqueEffectEfficiencyLevel` is an Int32 field.
606. `AssistModuleSlot.mainEffectEfficiencyLevel` is an Int32 field.
607. `AssistModuleSlot.substatEfficiencyLevel` is an Int32 field.
608. `AssistModuleSlot.level` is an Int32 field.
609. `AssistModuleSlot.coinsSpent` is a Double field.
610. `AssistModuleSlot.shardsSpent` is an Int32 field.
611. The slot model separately tracks unique-effect, main-effect, and substat efficiency levels.
612. The slot model also separately records total slot level and resource-spend accounting fields.
613. `AssistModuleSlotType` declares the Cannon member.
614. `AssistModuleSlotType` declares the Armor member.
615. `AssistModuleSlotType` declares the Generator member.
616. `AssistModuleSlotType` declares the Core member.
617. The decoded enum candidates assign Cannon=0, Armor=1, Generator=2, and Core=3.
618. These enum integer assignments are decoded candidates from metadata and should remain marked as such until validated against runtime or another independent artifact.
619. `ModuleManager.ASSIST_MODULE_SLOT_UNLOCK_COST` is a declared constant whose decoded candidate is 1000.
620. The source does not identify the currency unit of that unlock-cost candidate in the constant declaration alone.

## B. Assist efficiency limits and conversion APIs

621. `ASSIST_MODULE_UNIQUE_EFFECT_EFFICIENCY_MAX_LEVEL` is declared with decoded candidate value 3.
622. `ASSIST_MODULE_MAIN_EFFECT_EFFICIENCY_MAX_LEVEL` is declared with decoded candidate value 99.
623. `ASSIST_MODULE_SUBSTAT_EFFICIENCY_MAX_LEVEL` is declared with decoded candidate value 69.
624. The three maximum-level constants are distinct and apply to three separately named efficiency categories.
625. `GetAssistModuleUniqueEffectEfficiency(Int32 level)` returns ModuleRarity.
626. `GetAssistModuleUniqueEffectEfficiencyString(Int32 level)` returns String.
627. `GetAssistModuleUniqueEffectCost(Int32 level)` returns Int32.
628. `GetAssistModuleMainEffectEfficiency(AssistModuleSlot moduleSlot)` returns Single.
629. An overload `GetAssistModuleMainEffectEfficiency(Int32 level, AssistModuleSlotType type)` also returns Single.
630. `GetAssistModuleMainEffectLevel(Single efficiency, AssistModuleSlotType type)` returns Int32.
631. `GetAssistModuleMainEffectCost(Int32 level)` returns Int32.
632. `GetAssistModuleSubstatEfficiency(AssistModuleSlot moduleSlot)` returns Single.
633. An overload `GetAssistModuleSubstatEfficiency(Int32 level, AssistModuleSlotType type)` also returns Single.
634. `GetAssistModuleSubstatLevel(Single efficiency, AssistModuleSlotType type)` returns Int32.
635. `GetAssistModuleSubstatCost(Int32 level)` returns Int32.
636. The main-effect and substat APIs expose both level-to-efficiency and efficiency-to-level interfaces.
637. The unique-effect API exposes a level-to-rarity conversion and a separate string-formatting interface.
638. The unique-effect, main-effect, and substat cost methods each accept a level and return an integer cost.
639. The signatures do not reveal the resource type, cost curve, efficiency curve, rounding behavior, or whether the inverse conversion is exact.
640. The three decoded maximum levels are metadata candidates; they do not establish that all slot types share identical progression behavior.

## C. Assist slot unlock, equip, and respec interfaces

641. `UnlockCannonAssistModuleSlot()` is declared on ModuleManager and returns void.
642. `UnlockArmorAssistModuleSlot()` is declared on ModuleManager and returns void.
643. `UnlockGeneratorAssistModuleSlot()` is declared on ModuleManager and returns void.
644. `UnlockCoreAssistModuleSlot()` is declared on ModuleManager and returns void.
645. The four unlock methods are separated by AssistModuleSlotType.
646. `IsEquippedAssist(ModuleItem module)` returns Boolean.
647. An overload `IsEquippedAssist(Int32 infoIndex)` returns Boolean.
648. `EquipModuleAssist(ModuleItem module)` is declared and returns void.
649. `UnequipModuleAssist(ModuleItem module)` returns ModuleItem.
650. An overload `UnequipModuleAssist(Int32 slotIndex)` also returns ModuleItem.
651. `IsEquippedOnPrimaryOrAssist(Int32 infoIndex)` returns Boolean.
652. An overload `IsEquippedOnPrimaryOrAssist(ModuleItem module)` returns Boolean.
653. `RespecAssistModules()` is declared and returns void.
654. `IsDisabledAssistSubstat(SubstatsCluster cluster)` returns Boolean.
655. `IsCappedAssistSubstatEffect(ModuleEffect effect)` returns Boolean.
656. `CorrectModuleSlotTypes(assistModuleSlots)` is declared and returns void.
657. `get_AssistModulesUnlocked()` returns Boolean.
658. `assistModulesAvailable` is a Boolean field on ModuleManager.
659. `assistModuleSlots` is a collection-like field on ModuleManager.
660. The source does not establish whether `assistModulesAvailable` and `get_AssistModulesUnlocked()` represent the same state or separate availability gates.

## D. Assist Module UI declarations

661. ModuleUI declares a dedicated `assistTab` UI field.
662. ModuleUI declares a dedicated `assistPanel` UI field.
663. ModuleUI declares separate frame fields for Cannon, Armor, Generator, and Core Assist Modules.
664. ModuleUI declares separate equipped-module frame, icon, and level-text fields for the Cannon Assist slot.
665. ModuleUI declares separate equipped-module frame, icon, and level-text fields for the Armor Assist slot.
666. ModuleUI declares separate equipped-module frame, icon, and level-text fields for the Generator Assist slot.
667. ModuleUI declares separate equipped-module frame, icon, and level-text fields for the Core Assist slot.
668. ModuleUI declares separate locked-cover fields for all four Assist slot types.
669. ModuleUI declares separate unlock-button fields for all four Assist slot types.
670. ModuleUI declares separate locked-cost text fields for all four Assist slot types.
671. ModuleUI declares a unique-effect efficiency button for the Cannon slot.
672. ModuleUI declares a main-effect efficiency button for the Cannon slot.
673. ModuleUI declares a substat efficiency button for the Cannon slot.
674. The Armor slot has its own unique-effect, main-effect, and substat efficiency buttons.
675. The Generator slot has its own unique-effect, main-effect, and substat efficiency buttons.
676. The Core slot has its own unique-effect, main-effect, and substat efficiency buttons.
677. ModuleUI declares separate efficiency text and cost text fields for the three upgrade categories on the Cannon slot.
678. ModuleUI declares separate efficiency text and cost text fields for the three upgrade categories on the Armor slot.
679. ModuleUI declares separate efficiency text and cost text fields for the three upgrade categories on the Generator slot.
680. ModuleUI declares separate efficiency text and cost text fields for the three upgrade categories on the Core slot.
681. ModuleUI declares `AssistOpen()` as the Assist panel opening method.
682. ModuleUI declares `TryUnlockCannonAssistModuleSlot()`, `TryUnlockArmorAssistModuleSlot()`, `TryUnlockGeneratorAssistModuleSlot()`, and `TryUnlockCoreAssistModuleSlot()`.
683. ModuleUI declares one upgrade handler for each of the three efficiency categories on the Cannon slot.
684. ModuleUI declares one upgrade handler for each of the three efficiency categories on the Armor slot.
685. ModuleUI declares one upgrade handler for each of the three efficiency categories on the Generator slot.
686. ModuleUI declares one upgrade handler for each of the three efficiency categories on the Core slot.
687. `ViewAssistModuleInfoPanel(Int32 type)` is declared as a UI method.
688. The UI declarations show a repeated per-slot layout for the four module types and three efficiency categories.
689. The UI metadata does not reveal button gating, confirmation rules, resource deduction order, or visual refresh behavior.
690. The UI metadata does not prove that all four slots are unlocked by default or available in every game version.

## E. Slot-level progression, spend tracking, and migration

691. `ModuleManager.GetMaxSlotLevel()` returns Int32.
692. `GetPrimarySlotLevel(Int32 slotIndex)` returns Int32.
693. `GetAssistSlotLevel(Int32 slotIndex)` returns Int32.
694. `GetSlotLevel(Boolean isAssist, Int32 slotIndex)` returns Int32.
695. `SetSlotLevel(Boolean isAssist, Int32 slotIndex, Int32 level)` is declared and returns void.
696. `GetSlotCoinsSpent(Boolean isAssist, Int32 slotIndex)` returns Double.
697. `GetSlotShardsSpent(Boolean isAssist, Int32 slotIndex)` returns Int32.
698. `AddSlotSpend(Boolean isAssist, Int32 slotIndex, Double coins, Int32 shards)` is declared and returns void.
699. `ClearSlotSpend(Boolean isAssist, Int32 slotIndex)` is declared and returns void.
700. ModuleManager declares `MigrateModuleLevelsToSlots()`, `HasSlotLevelMigrationRefund()`, and `ShowSlotLevelMigrationPopupIfNeeded()`; the migration algorithm, refund calculation, and popup conditions remain unknown.

## Status and limitations

- Claim classification: OBJECTIVE (metadata declarations and signatures).
- Verification status: EXTERNAL-UNVERIFIED for live-game behavior; declarations are directly observed in the source artifact.
- Decoded constant values and enum integer assignments remain candidates, not confirmed runtime facts.
- Assist efficiency formulas, resource types, cost curves, unlock requirements, and respec refund rules are UNKNOWN.
- Slot-level migration behavior and historical compatibility are UNKNOWN.
- UI field and method declarations do not establish actual interaction outcomes.
- No executable method bodies were available; no runtime tests or simulation were performed.
- No GKB claim promotion performed.
