/**
 * AUTO-GENERATED planner citations for ep.eDamage.
 * Source: EP/SDK graph formula + formulaSource only.
 * Regenerate: pnpm planner:codegen -- --family eDamage
 * NEVER invent formulas.
 */

export const PLANNER_FAMILY = "ep.eDamage" as const

export const PLANNER_CITATIONS = [
  {
    "nodeId": "stat.eDamage.chronoSlowMultiplier",
    "label": "Chrono Field slow multiplier",
    "formula": "=LET(SubstatAssistCap, '_IDS'!$BV$5 + CS5/100, Substat, $AM$38 + SubstatAssistCap * $AO$38, IF(AND(AY33,BH36), 1/(1-MIN(90%, $BJ$36+Substat)), 1))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!EP5"
    ]
  },
  {
    "nodeId": "stat.eDamage.chronoLoopMultiplier",
    "label": "Chrono Loop multiplier",
    "formula": "=IF(AND(AY33,BH36,BL36<>\"Locked\"), 1/(1-$BL$36), 1)",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!EQ5"
    ]
  },
  {
    "nodeId": "stat.eDamage.chronoTotalMultiplier",
    "label": "Chrono total multiplier",
    "formula": "=EP5*EQ5",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!ER5"
    ]
  },
  {
    "nodeId": "stat.eDamage.rangeDpmMultiplier",
    "label": "Range/DPM multiplier",
    "formula": "=IF($AX$19=\"Attack Disso\", 1, EPD_RANGEDPM($DU5, $DV5, $AY$22))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!DW5"
    ]
  },
  {
    "nodeId": "stat.eDamage.ampStrikeMultiplier",
    "label": "Amplifying Strike multiplier",
    "formula": "=1+4*MIN(1, AY35*(AM8+AR8)/CX7)",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!DH5"
    ]
  },
  {
    "nodeId": "stat.eDamage.projectFundingMultiplier",
    "label": "Project Funding multiplier",
    "formula": "=LET(PFCash, IF($AX$19=\"Util Disso\", 80 + 5*BY5, UNFORMAT_NUMBER($AY$34)), PF, $AM$45+$AR$45, 1+IF(PF<>0, PF*log10(PFCash), 0))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!DG5"
    ]
  },
  {
    "nodeId": "display.eDamage.hideColumnFlags",
    "label": "Hide Col flags (EV2:HC2)",
    "formula": "=OR(NOT($AY$48), $AX$19=\"Attack Disso\", EPG_LEVEL_CHECK(BC40+1, BD40, BE40), AND($AY$26, NOT(IDS_LAB_HAS_UNLOCKED(EV4))))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!EV2"
    ]
  },
  {
    "nodeId": "display.eDamage.labTargetLevel",
    "label": "Lab target level (BD column)",
    "formula": "=IF($AU$23, ,IDS_LAB_TARGET(BB5))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!BD5"
    ]
  },
  {
    "nodeId": "display.eDamage.simulatedTier",
    "label": "Simulated Tier",
    "formula": "=IF(AX19=\"Tourney\", \"Tourney\", IDS_PS_FARMING_TIER())",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!AX20"
    ]
  },
  {
    "nodeId": "stat.eDamage.bounceShotMultiplier",
    "label": "Bounce Shot multiplier",
    "formula": "=IF($AX$19=\"Attack Disso\", 1, LET(SubstatAssistCap, EPG_ASSIST_SUB_CAP($AN$4, $BL$42, CO5), BSC, EPD_BSC($BG$18, $AM$21 + SubstatAssistCap * $AO$21, $BM$18), BST, EPD_BST($BG$19, IF(AND($AY$61, $AY$64), $AX$64, 0), $AM$22 + SubstatAssistCap * $AO$22), EPD_BOUNCESHOT(BSC, BST, $AM$6+$AR$6)))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!DQ5"
    ]
  },
  {
    "nodeId": "hide.eDamageStone.dwCooldownColumn",
    "label": "DW Cooldown column hidden (eDamage Stone)",
    "formula": "=OR(NOT($BH$30), $AY$24)",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Stone!EL2"
    ]
  },
  {
    "nodeId": "stat.eDamageStone.dwCooldownRoi",
    "label": "DW Cooldown ROI (eDamage Stone)",
    "formula": "=IFS(\n  OR($EH5, EL$2), ,\n  EPG_UW_TARGET_LEVEL(BQ5+1, \"Death Wave\", \"Cooldown\", $AY$23), ,\n  DVT_UW_STAT(\"Death Wave\", \"Cooldown\", BQ5+1)=\"\", ,\n  TRUE, LET(\n    SubstatAssistCap, EPG_ASSIST_SUB_CAP($AN$23, CQ5, $BC$48),\n    DW, LET(\n      DWB, LET(\n        Substat, $AM$26 + SubstatAssistCap * $AO$26,\n        STAT_UW_DW_FINAL_DMG(DVT_UW_STAT(\"Death Wave\", \"Damage\", BO5), Substat)),\n      DWQ, LET(\n        Substat, $AM$27 + SubstatAssistCap * $AO$27,\n        STAT_UW_DW_FINAL_QTY(DVT_UW_STAT(\"Death Wave\", \"Quantity\", BP5), Substat, AND($AY$61, $AY$67))),\n      DWC, LET(\n        Substat, $AM$28 + SubstatAssistCap * $AO$28,\n        STAT_UW_DW_FINAL_CD(DVT_UW_STAT(\"Death Wave\", \"Cooldown\", BQ5+1), Substat, eDamage!$EC$5)),\n    \n      EP_DW_DPS($BH$30, DWB, DWQ, DWC, $BC$30)),\n\n    CL, DS5,\n    SM, DT5,\n    SLM, DU5,\n    SL, DQ5,\n    PS, DW5,\n    ILM, DY5,\n      UWDMG, EP_UW_TOTAL_DAMAGE(DW, CL, SM, SLM, SL, PS, ILM, $DO5*DN5*DM$5, $DP$5, 1),\n\n    $CU5 * ($CZ5 * $DL5 * SL + UWDMG * $DA5)*ED5)\n)",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Stone!EL5"
    ]
  },
  {
    "nodeId": "hide.eDamageCoins.labColumn",
    "label": "Lab column hidden on the coin path",
    "formula": "=OR(NOT($AY$43), REGEXMATCH(TO_TEXT($AY$27), \"^None\"), $AX$19=\"Attack Disso\", EPG_LEVEL_CHECK(BC38+1, BD38, BE38), AND($AY$26, NOT(IDS_LAB_HAS_UNLOCKED(FA4))))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Coins!FA2"
    ]
  },
  {
    "nodeId": "hide.eDamageKeys.attackDissoColumns",
    "label": "Key columns hidden on Attack Disso",
    "formula": "=$AX$19=\"Attack Disso\"",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Keys!DL2"
    ]
  },
  {
    "nodeId": "hide.eDamageStone.smCooldownColumn",
    "label": "SM Cooldown column hidden (eDamage Stone)",
    "formula": "=OR(NOT($BH$32), $AY$24)",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Stone!ER2"
    ]
  },
  {
    "nodeId": "hide.eDamageStone.cfSlowColumn",
    "label": "CF Slow / CF+ columns hidden (eDamage Stone)",
    "formula": "=OR(NOT($AY$33), NOT($BH$36))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Stone!FF2"
    ]
  },
  {
    "nodeId": "gate.eDamageStone.uwPlusRequiresNineUws",
    "label": "UW+ stats require more than eight UWs unlocked",
    "formula": "=IFS(OR($EH5, ES$2), , EPG_UW_TARGET_LEVEL(BX5+1, \"Smart Missiles\", \"Cover Fire\", $AY$23), , OR(DVT_UW_STAT(\"Smart Missiles\", \"Cover Fire\", BX5+1)=\"\", IDS_UW_COUNT()<=8), , TRUE, LET(...))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Stone!ES5"
    ]
  },
  {
    "nodeId": "gate.eDamageStone.spotlightAngleCap",
    "label": "Spotlight angle capped at 90 degrees",
    "formula": "=IFS(OR($EH5, EU$2), , EPG_UW_TARGET_LEVEL(BZ5+1, \"Spotlight\", \"Angle\", $AY$23), , OR(DVT_UW_STAT(\"Spotlight\", \"Angle\", BZ5+1)=\"\", INDEX(AUW_SL_ANGLE_VAL, BZ5)+$AM$30>=90), , TRUE, LET(...))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Stone!EU5"
    ]
  },
  {
    "nodeId": "hide.eDamageStone.ilmColumnsShareOneFlag",
    "label": "ILM columns all read FB$2",
    "formula": "=IFS(OR($EH5, FB$2), , EPG_UW_TARGET_LEVEL(CH5+1, \"Inner Land Mines\", \"Quantity\", $AY$23), , DVT_UW_STAT(\"Inner Land Mines\", \"Quantity\", CH5+1)=\"\", , TRUE, LET(...))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Stone!FC5"
    ]
  },
  {
    "nodeId": "display.eDamageStone.uwLevelColumns",
    "label": "UW stat level columns (BO5:CQ5)",
    "formula": "=VALUE(LEFT(IDS_UW_LEVEL(\"Death Wave\", \"Damage\"), 2))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Stone!BO5"
    ]
  },
  {
    "nodeId": "display.eDamageStone.uwPlusLockedSentinel",
    "label": "UW+ locked sentinel (-1)",
    "formula": "=IFERROR(VALUE(LEFT(IDS_UW_LEVEL(\"Smart Missiles\", \"Cover Fire\"), 2)), -1)",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Stone!BX5"
    ]
  },
  {
    "nodeId": "stat.eDamageStone.assistCannonBonusRoi",
    "label": "Assist Module Bonus - Cannon ROI",
    "formula": "=IFS(OR($EH5, GK$2), , CM5>=99, , TRUE, (EPG_MODULE_BONUS($AM$4, $AN$4, $AO$4, CM5+1, $BC$49)/CS5-1)/((CM5+1)*3+12))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Stone!GK5"
    ]
  },
  {
    "nodeId": "gate.eDamageStone.moduleLevelCaps",
    "label": "Assist module hard level caps",
    "formula": "=IFS(OR($EH5, FH$2), , CN5>=69, , TRUE, LET(SubstatAssistCap, EPG_ASSIST_SUB_CAP($AN$23, CN5+1, $BC$45), ...))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Stone!FH5"
    ]
  },
  {
    "nodeId": "display.eDamageStone.assistCannonBonusLevel",
    "label": "Assist Module Bonus - Cannon level",
    "formula": "=BL41",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Stone!CM5"
    ]
  },
  {
    "nodeId": "display.eDamageStone.assistModuleLevelColumns",
    "label": "Assist module level columns (CM5:CQ5)",
    "formula": "=BL42",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Stone!CN5"
    ]
  },
  {
    "nodeId": "display.eDamageKeys.vaultLevelColumns",
    "label": "Vault level columns (BO5:BY5)",
    "formula": "=BM8/5%",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Keys!BO5"
    ]
  },
  {
    "nodeId": "display.eDamage.coinPathHeader",
    "label": "Coin path header, with no path under it",
    "formula": "↓ COIN PATH ↓",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!T5"
    ]
  },
  {
    "nodeId": "display.eDamage.moduleLevelHorizon",
    "label": "Module level horizon (eDamage)",
    "formula": "=IF('Master Sheet'!I7>159, \"All         | Show all levels on path\", \"\")",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!AL4"
    ]
  },
  {
    "nodeId": "stat.eDamageCoins.cashBonusRoi",
    "label": "Cash Bonus ROI (eDamage Coins)",
    "formula": "=IF(EJ5=\"\", \"\", (EJ5/$CT5-1)/WSPCOST_SINGLE_ADJUSTED(SUBSTITUTE(FF$4, \" +\", \"\"), BU5+1)*$EF$3)",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Coins!FF5"
    ]
  },
  {
    "nodeId": "display.eDamage.perksMaster",
    "label": "Perks master",
    "formula": "=NOT(EQ(AX20, \"Tourney\"))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!AY61"
    ]
  },
  {
    "nodeId": "hide.eDamage.improveTradeOffPerksColumn",
    "label": "Improve Trade-off Perks column hidden",
    "formula": "=OR(NOT(AND($AY$61, $AY$65)), $AX$19=\"Attack Disso\", EPG_LEVEL_CHECK(BC29+1, BD29, BE29), AND($AY$26, NOT(IDS_LAB_HAS_UNLOCKED(FY4))))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!FY2"
    ]
  },
  {
    "nodeId": "stat.eDamage.critChanceMasteryShadow",
    "label": "Critical Chance Mastery shadow column",
    "formula": "=IFS(OR($EU5, EV$2), , EPG_LEVEL_CHECK(BU5+1, $BD$40, $BE$40), , TRUE, LET(SubstatAssistCap, EPG_ASSIST_SUB_CAP($AN$4, $BL$42, CO5), Substat, $AM$15 + SubstatAssistCap * $AO$15, CardCCMastery, 1+(1%*(1+BU5+1)), CC, DJ5+1%, CF, DK5, SCC, DL5+1%, SCM, ($AN$68*(1+(2%*BX5))+Substat)*$BK$21*(1+$BL$21)*(1+$BM$21)*CardCCMastery, UWCrit, EPD_UWCRITICAL(CC, CF, SCC, SCM), BulletCrit, EPD_CRITICAL(CC, CF, SCC, SCM, IF($AM$7+$AR$7, 5, 0)), DI5 * (BulletCrit * EA5 * ED5 + EO5 * UWCrit)*ER$5))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!EV5"
    ]
  },
  {
    "nodeId": "stat.eDamage.coreModulePair",
    "label": "Core module pair (eDamage, fixed bonuses)",
    "formula": "=EPG_MODULE_BONUS($AM$23, $AN$23, $AO$23, $BL$47, CR5)",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!EN5"
    ]
  },
  {
    "nodeId": "stat.eDamageCoins.coreModulePair",
    "label": "Core module pair (eDamage Coins, derived from rarity at level)",
    "formula": "=EPG_MODULE_BONUS(MODSTAT_CORE(IDS_MOD_CORE_RARITY(IDS_MOD_CORE_NAME($AX$15)), CE5), $AN$23, MODSTAT_CORE(IDS_MOD_CORE_RARITY(IDS_MOD_CORE_ASSIST_NAME($AX$15)), CF5), $BL$47, CK5)",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Coins!DO5"
    ]
  },
  {
    "nodeId": "control.eDamageCoins.bandDamage",
    "label": "Coin band start — Damage enhancement (BO5)",
    "formula": "=BI8",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Coins!BO5"
    ]
  },
  {
    "nodeId": "control.eDamageCoins.bandCriticalFactor",
    "label": "Coin band — Critical Factor enhancement (BS5)",
    "formula": "=BI11",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Coins!BS5"
    ]
  },
  {
    "nodeId": "control.eDamage.poisonSwampLabLevel",
    "label": "Poison Swamp lab level (eDamage BS5)",
    "formula": "=BC31",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!BS5"
    ]
  },
  {
    "nodeId": "stat.eDamage.ultimateWeaponTotal",
    "label": "Ultimate weapon total damage (eDamage EO5)",
    "formula": "=LET( CardUC, IF(AND($AY$39,$AY$54), 1 + ($AV$54 + IF($AY$55, 0.33%*(1+CM5), 0)) * (DK5 - 1), 1), UWAdditionalDMG, $CX$6 * EN5 * EB5, DW, EE5, CL, EF5, SM, EG5, SLM, EH5, SL, ED5, PS, EJ5, ILM, EL5, EP_UW_TOTAL_DAMAGE(DW, CL, SM, SLM, SL, PS, ILM, UWAdditionalDMG, DY5, CardUC))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!EO5"
    ]
  },
  {
    "nodeId": "stat.eDamageCoins.ultimateWeaponTotal",
    "label": "Ultimate weapon total damage (eDamage Coins EA5)",
    "formula": "=LET( CardUC, IF(AND($AY$39, $AY$54), 1 + ($AV$54 + IF($AY$55, 0.33%*(1+CB5), 0)) * (CX5 - 1), 1), UWAdditionalDMG, eDamage!$CX$6*DO5*DN5, DW, DR5, CL, $DS5, SM, DT5, SLM, DU5, SL, DQ5, PS, DW5, ILM, DY5, EP_UW_TOTAL_DAMAGE(DW, CL, SM, SLM, SL, PS, ILM, UWAdditionalDMG, DP5, CardUC))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Coins!EA5"
    ]
  },
  {
    "nodeId": "stat.eDamageCoins.criticalFactor",
    "label": "Critical Factor (eDamage Coins CX5, enhancement buyable)",
    "formula": "=IF($AX$19=\"Attack Disso\", 1, LET( Base, $AN$58, Lab, $BF$11, SubstatAssistCap, EPG_ASSIST_SUB_CAP($AN$4, $BL$42, CG5), Substat, $AM$11 + SubstatAssistCap * $AO$11, WSPlus, 1+1%*BS5, Relics, 1+$BL$11, Vault, 1+$BM$11, (Base * Lab + Substat) * WSPlus * Relics * Vault))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Coins!CX5"
    ]
  },
  {
    "nodeId": "stat.eDamageCoins.damageEnhanced",
    "label": "Damage + (eDamage Coins CQ5)",
    "formula": "=IF($AX$19=\"Attack Disso\", 1, LET( Cannon, CP5, Base, $AN$55 * Cannon, Lab, $BF$8, WSPlus, 1+(1%*BO5), CardDMG, IF(AND($AY$39, $AY$42), $AV$42*IF($AY$43, 1+(0.4*(1+BP5)), 1), 1), Base * Lab * WSPlus * CardDMG))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Coins!CQ5"
    ]
  },
  {
    "nodeId": "stat.eDamage.shockMultiplier",
    "label": "Shock Multiplier (eDamage DC5)",
    "formula": "=LET( HasDC, ($AM$25+$AR$25)>0, IF(AND($BH$31, $AL$75), (1+(0.1+(0.04*BS5))*IF(HasDC, 2*($AM$25+$AR$25), 1)), 1))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!DC5"
    ]
  },
  {
    "nodeId": "stat.eDamage.maxRendArmorMultiplier",
    "label": "Max Rend Armor Multiplier (eDamage DZ5)",
    "formula": "=IF($AX$19=\"Attack Disso\", 1, LET( SubstatAssistCap, EPG_ASSIST_SUB_CAP($AN$4, $BL$42, CO5), Substat, $AM$16 + SubstatAssistCap * $AO$16, EPD_MAXREND($AL$69, CG5, Substat, $BI$22)))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage!DZ5"
    ]
  },
  {
    "nodeId": "stat.eDamageCoins.maxRendArmorMultiplier",
    "label": "Max Rend Armor Multiplier (eDamage Coins DL5) — wrong-column substat cap",
    "formula": "=IF($AX$19=\"Attack Disso\", 1, LET( SubstatAssistCap, EPG_ASSIST_SUB_CAP($AN$4, $BL$42, CJ5), IF($AL$69, ($BF$22 + $AM$16 + SubstatAssistCap * $AO$16)*(1+1%*CA5), 1)))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Coins!DL5"
    ]
  },
  {
    "nodeId": "stat.eDamageCoins.poisonSwampDps",
    "label": "Poison Swamp DPS (eDamage Coins DW5)",
    "formula": "=LET( SubstatAssistCap, EPG_ASSIST_SUB_CAP($AN$23, $BL$48, CI5), Substat, $AM$37 + SubstatAssistCap * $AO$37, PSDmg, $BI$35+Substat, PSDur, $BJ$35, PSCD, $BK$35, PSRend, 1+(DL5-1)*$BF$35, EP_PS_DPS($BH$35, PSDmg, PSDur, PSCd, $DX$5 * $AY$31, PSRend, $AY$59, RIGHT($AU$59, 1)))",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Coins!DW5"
    ]
  },
  {
    "nodeId": "candidate.eDamageCoins.criticalChanceMastery",
    "label": "Critical Chance Mastery candidate (eDamage Coins EG5)",
    "formula": "=IFS( OR($EE5, EG$2), , OR(EPG_LEVEL_CHECK(BR5+1, $BD$40, $BE$40), BR$5+EPG_MODULE_LEVEL_LIMIT($AY$27)<=BR5), , TRUE, LET( CardCCMastery, 1+(1%*(1+BR5+1)), CC, CW5+1%, CF, CX5, SCC, CY5+1%, SCM, ($AN$68*$BF$21+$AM$15+$AR$15)*(1+1%*BT5)*(1+$BL$21)*(1+$BM$21)*CardCCMastery, normalCrit, EPD_CRITICAL(CC, CF, SCC, SCM, IF($AM$7+$AR$7, 5, 0)), UWCritical, EPD_UWCRITICAL(CC, CF, SCC, SCM), CV5 * (normalCrit * DM5 * DQ5 + EA5 * UWCritical)*$EB$5) )",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Coins!EG5"
    ]
  },
  {
    "nodeId": "candidate.eDamageCoins.assistSubstatCannon",
    "label": "Assist Module Substats - Cannon candidate (eDamage Coins ET5)",
    "formula": "=IFS( OR($EE5, ET$2), , OR(EPG_LEVEL_CHECK(CG5+1, $BD$45, $BE$45), CG$5+EPG_MODULE_LEVEL_LIMIT($AY$27)<=CG5), , TRUE, LET( SubstatAssistCap, EPG_ASSIST_SUB_CAP($AN$4, $BL$42, CG5+1), ... Rend, IF($AL$69, ($BF$22 + $AM$16 + SubstatAssistCap * $AO$16)*(1+1%*CA5), 1), ... CV5*(BACrit*BulletDmg*SL+UWDmg*CritUw)*$EB$5) )",
    "formulaSource": "formulatext",
    "cells": [
      "eDamage Coins!ET5"
    ]
  }
] as const

export type PlannerCitation = (typeof PLANNER_CITATIONS)[number]
