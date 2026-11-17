/**
 * AUTO-GENERATED planner citations for ep.workbook.
 * Source: EP/SDK graph formula + formulaSource only.
 * Regenerate: pnpm planner:codegen -- --family workbook
 * NEVER invent formulas.
 */

export const PLANNER_FAMILY = "ep.workbook" as const

export const PLANNER_CITATIONS = [
  {
    "nodeId": "lambda.workbook.moduleLevelLimit",
    "label": "EPG_MODULE_LEVEL_LIMIT",
    "formula": "LAMBDA(input_text, LET(raw, IFERROR(INDEX(SPLIT(input_text, \" \"), 1), input_text), IFS(raw=\"none\", 0, raw=\"all\", 300, ISNUMBER(raw), raw, TRUE, 0)))",
    "formulaSource": "lambda",
    "cells": [],
    "lambdaName": "EPG_MODULE_LEVEL_LIMIT"
  }
] as const

export type PlannerCitation = (typeof PLANNER_CITATIONS)[number]
