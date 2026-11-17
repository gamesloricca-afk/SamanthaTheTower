/**
 * AUTO-GENERATED planner citations for ep.eHP.
 * Source: EP/SDK graph formula + formulaSource only.
 * Regenerate: pnpm planner:codegen -- --family eHP
 * NEVER invent formulas.
 */

export const PLANNER_FAMILY = "ep.eHP" as const

export const PLANNER_CITATIONS = [
  {
    "nodeId": "display.eHP.hideColumnFlags",
    "label": "Hide Col flags (CV2:DY2)",
    "formula": "=OR(AND($AY$14, NOT(IDS_LAB_HAS_UNLOCKED(CW4))), EPG_LEVEL_CHECK(BQ5+1, BD9, BE9))",
    "formulaSource": "formulatext",
    "cells": [
      "eHP!CW2"
    ]
  },
  {
    "nodeId": "stat.eHP.damageAbsorbed",
    "label": "Damage absorbed",
    "formula": "=EPH_DABS($BH$8, BP5, AND($AY$16, $AY$25), $AV$25, $BK$23, CB5, $AN$9, $AO$9, $BI$8, AND($AY$28, $AY$33), BU5, $BL$8, $BM$8)*$AY$11",
    "formulaSource": "formulatext",
    "cells": [
      "eHP!CL5"
    ]
  },
  {
    "nodeId": "display.eHP.showLevelsOnPath",
    "label": "Show all levels on path (eHP)",
    "formula": "=IF('Master Sheet'!I23>159, \"All         | Show all levels on path\", \"\")",
    "formulaSource": "formulatext",
    "cells": [
      "eHP!AM4"
    ]
  },
  {
    "nodeId": "gate.eHP.assistEnabled",
    "label": "Armor assist module enabled",
    "formula": "='_IDS'!BL2",
    "formulaSource": "formulatext",
    "cells": [
      "eHP!AO5"
    ]
  },
  {
    "nodeId": "gate.eHP.healthMasteryActive",
    "label": "Health Mastery card active",
    "formula": "=AND(IDS_CARD_MASTERY(AT19), AY16, AY19)",
    "formulaSource": "formulatext",
    "cells": [
      "eHP!AY20"
    ]
  },
  {
    "nodeId": "hide.eHPStone.assistBonusColumn",
    "label": "Assist Module Bonus column hidden (eHP Stone)",
    "formula": "=OR(NOT($AO$5), AND($AY$14, NOT(IDS_LAB_HAS_UNLOCKED(CJ4))))",
    "formulaSource": "formulatext",
    "cells": [
      "eHP Stone!CJ2"
    ]
  },
  {
    "nodeId": "hide.eHPCoins.labColumn",
    "label": "Lab column hidden on the eHP coin path",
    "formula": "=OR(NOT($AO$5), AND($AY$14, NOT(IDS_LAB_HAS_UNLOCKED(DI4))))",
    "formulaSource": "formulatext",
    "cells": [
      "eHP Coins!DI2"
    ]
  },
  {
    "nodeId": "hide.eHPCoins.healthMasteryColumn",
    "label": "Health Mastery column hidden (eHP Coins)",
    "formula": "=OR(NOT(AY20), AND($AY$14, NOT(IDS_LAB_HAS_UNLOCKED(DC4))))",
    "formulaSource": "formulatext",
    "cells": [
      "eHP Coins!DC2"
    ]
  },
  {
    "nodeId": "hide.eHPCoins.assistColumn",
    "label": "Assist column hidden (eHP Coins)",
    "formula": "=OR(NOT($AO$5), REGEXMATCH(TO_TEXT($AM$4), \"^None\"))",
    "formulaSource": "formulatext",
    "cells": [
      "eHP Coins!DF2"
    ]
  }
] as const

export type PlannerCitation = (typeof PLANNER_CITATIONS)[number]
