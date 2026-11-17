/**
 * AUTO-GENERATED planner citations for ep.eEcon.
 * Source: EP/SDK graph formula + formulaSource only.
 * Regenerate: pnpm planner:codegen -- --family eEcon
 * NEVER invent formulas.
 */

export const PLANNER_FAMILY = "ep.eEcon" as const

export const PLANNER_CITATIONS = [
  {
    "nodeId": "hide.eEcon.EO2.coinBonus",
    "label": "eEcon!EO2 Coin Bonus hide",
    "formula": "=OR(\n  REGEXMATCH(AZ13, \"^None\"),\n  NOT(O$3<>\"DO\"),\n  WSPUTILITY_TOTAL_COINS_INVESTED(\n    CHOOSECOLS('_IDS'!$T$16:$X$21, MATCH(AZ5, '_IDS'!$T$2:$X$2, 0)),\n    '_IDS'!$R$16:$R$21)<=50000000000,\n  IDS_LAB_LEVEL(\"Workshop Enhancements\")=0,\n  BK5+1>BL5)",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon!EO2"
    ]
  },
  {
    "nodeId": "hide.eEcon.EP2.freeUpgrades",
    "label": "eEcon!EP2 Free Upgrades hide",
    "formula": "=OR(\n  REGEXMATCH(AZ13, \"^None\"),\n  AO6+AS6=0,\n  NOT(O$3<>\"DO\"),\n  WSPUTILITY_TOTAL_COINS_INVESTED(\n    CHOOSECOLS('_IDS'!$T$16:$X$21, MATCH(AZ5, '_IDS'!$T$2:$X$2, 0)),\n    '_IDS'!$R$16:$R$21)<=5000000000000,\n  IDS_LAB_LEVEL(\"Workshop Enhancements\")=0,\n  BK6+1>BL6)",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon!EP2"
    ]
  },
  {
    "nodeId": "hide.eEconStones.DW2.uwCd",
    "label": "eEcon Stones!DW2 UW CD composite hide",
    "formula": "=OR(\n  NOT(AZ17),\n  CA5<110)",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon Stones!DW2"
    ]
  },
  {
    "nodeId": "display.eEcon.goldenComboKillsPerSecond",
    "label": "Enemies killed per Second (GT+)",
    "formula": "=7+eDamage!$CX$9",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon!AZ20"
    ]
  },
  {
    "nodeId": "display.eEcon.calculationRows",
    "label": "Calculation Rows",
    "formula": "=IF(IDS!E6=\"✅\", 25, 1)",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon!AK4"
    ]
  },
  {
    "nodeId": "stat.eEcon.extraOrbCoins",
    "label": "Extra Orb coin multiplier",
    "formula": "=IF(DU5, , EPC_CARD_EOM($AZ$34, BZ5, $AZ$26))",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon!CT5"
    ]
  },
  {
    "nodeId": "gate.eEcon.rowOutOfScope",
    "label": "Row beyond the calculated count",
    "formula": "=ROW()-5>=$AK$4",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon!DU5"
    ]
  },
  {
    "nodeId": "stat.eEcon.goldenTowerGoldenCombo",
    "label": "Golden Tower golden-combo term",
    "formula": "=IF(DU5, , EPC_GTGC($BO$15>=0, $BO$15, $AZ$20, DA5))",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon!DC5"
    ]
  },
  {
    "nodeId": "hide.eEconDiscount.retroactiveLabColumn",
    "label": "Retroactive discount column hidden",
    "formula": "=OR(AY14, EPG_LEVEL_CHECK(BD11+1, BE11, BF11), AND(AY11, NOT(IDS_LAB_HAS_UNLOCKED(CL4))))",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon Discount!CL2"
    ]
  },
  {
    "nodeId": "hide.eEconStones.uwTargetColumn",
    "label": "UW column hidden by its target level",
    "formula": "=OR(NOT(BK15), EPG_UW_TARGET_LEVEL(BL15, \"Golden Tower\", \"Multiplier\", AZ18), ISBLANK(DVT_UW_COST(\"Golden Tower\", \"Multiplier\", BL15+1)))",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon Stones!DM2"
    ]
  },
  {
    "nodeId": "display.eEconDiscount.mirroredHideRetroactive",
    "label": "Hide Retroactive Discount Labs (mirrored onto eEcon Discount)",
    "formula": "={eEcon!AM3:AZ50}",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon Discount!AY14"
    ]
  },
  {
    "nodeId": "display.eEconStones.syncedUwCooldown",
    "label": "Synced UW cooldown (seconds)",
    "formula": "=LET(GTCD, IF($BK$15, 300-10*$BN$15, 0), BHCD, IF($BK$16, 200-10*$BN$16, 0), DWCD, IF($BK$17, 300-10*$BN$17, 0), MAX(GTCD, BHCD, DWCD))",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon Stones!CA5"
    ]
  },
  {
    "nodeId": "stat.eEconStones.uwCooldownBundle",
    "label": "UW CD bundle upgrade",
    "formula": "=IFS(OR(DW$2, $DL5), , CA5<110, , TRUE, LET(Old, DD5, GTcdNext, IF(CA5>DVT_UW_STAT(\"Golden Tower\", \"Cooldown\", BS5), 0, 1), BHcdNext, IF(CA5>DVT_UW_STAT(\"Black Hole\", \"Cooldown\", BV5), 0, 1), DWcdNext, IF(CA5>DVT_UW_STAT(\"Death Wave\", \"Cooldown\", BX5), 0, 1), ..., GTCost, IF(AND(HasGT, GTcdNext), DVT_UW_COST(\"Golden Tower\", \"Cooldown\", BS5+1), 0), BHCost, IF(AND(HasBH, BHcdNext), DVT_UW_COST(\"Black Hole\", \"Cooldown\", BV5+1), 0), DWCost, IF(AND(HasDW, DWcdNext), DVT_UW_COST(\"Death Wave\", \"Cooldown\", BX5+1), 0), (New/Old-1)/(GTCost+BHCost+DWCost)))",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon Stones!DW5"
    ]
  },
  {
    "nodeId": "display.eEconStones.uwLevelColumns",
    "label": "UW level columns (BQ5:CD5), at GT Cooldown",
    "formula": "=BN15",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon Stones!BS5"
    ]
  },
  {
    "nodeId": "hide.eEconStones.masteryColumns",
    "label": "Mastery columns hidden when owned",
    "formula": "=OR(IDS_CARD_MASTERY(LEFT(EA4, LEN(EA4)-8)), AND($AZ$11, NOT(IDS_LAB_HAS_UNLOCKED(EA4))))",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon Stones!EA2"
    ]
  },
  {
    "nodeId": "stat.eEconDiscount.multiplierRoi",
    "label": "Workshop Utility discount ROI",
    "formula": "=IFS(OR(CL$2, $CJ5), , EPG_LEVEL_CHECK(BP5+1, $BE$11, $BF$11), , TRUE, LET(Old, BW5, New, 1/(1-(BP5+1)*0.5%), Dur, LABDURATION_SINGLE_ADJUSTED($CL$4, BP5+1), (New/Old-1)/Dur))",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon Discount!CL5"
    ]
  },
  {
    "nodeId": "stat.eEconDiscount.costRoi",
    "label": "Labs Coin Discount ROI",
    "formula": "=IFS(OR(CM$2, $CJ5), , CK5<>\"Laboratory\", , EPG_LEVEL_CHECK(BQ5+1, $BE$12, $BF$12), , TRUE, LET(Old, BX5, New, EPC_LAB_DISCOUNT(BQ5+1), Dur, LABDURATION_SINGLE_ADJUSTED($CM$4, BQ5+1), (Old/New-1)/Dur))",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon Discount!CM5"
    ]
  },
  {
    "nodeId": "hide.eEconDiscount.labsCoinDiscountColumn",
    "label": "Labs Coin Discount column hidden",
    "formula": "=OR(\n  EPG_LEVEL_CHECK(BD12+1, BE12, BF12),\n  AND(AY11, NOT(IDS_LAB_HAS_UNLOCKED(CM4))))",
    "formulaSource": "formulatext",
    "cells": [
      "eEcon Discount!CM2"
    ]
  }
] as const

export type PlannerCitation = (typeof PLANNER_CITATIONS)[number]
