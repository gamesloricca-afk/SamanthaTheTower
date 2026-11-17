import { describe, expect, it } from 'vitest'

import {
  EP_CONTROL_SURFACE_SHEET_VERSION,
  EP_SHEET_AST_SCHEMA_VERSION,
  EP_SHEET_AST_SHEET_VERSION,
  EP_WEB_CONTROL_MAP_SHEET_VERSION,
  epSheetAstBoundInteractiveControls,
  epSheetAstControlsMissingUi,
  epSheetAstInteractiveControls,
  epSheetAstTabs,
} from '../../../src/mechanics/ep-controls'

describe('EP sheet AST', () => {
  it('tracks the same sheet version as the surface and web map', () => {
    expect(EP_SHEET_AST_SHEET_VERSION).toBe(EP_CONTROL_SURFACE_SHEET_VERSION)
    expect(EP_SHEET_AST_SHEET_VERSION).toBe(EP_WEB_CONTROL_MAP_SHEET_VERSION)
    expect(EP_SHEET_AST_SCHEMA_VERSION).toBe(1)
  })

  it('emits layoutBlocks for every planner tab', () => {
    const tabs = epSheetAstTabs()
    for (const name of ['eEcon', 'eHP', 'eRegen', 'eDamage']) {
      expect(tabs[name]?.layoutBlocks.length, name).toBeGreaterThan(0)
    }
  })

  it('records panel merges when the capture includes them', () => {
    const tabs = epSheetAstTabs()
    // At least one visible planner tab should have merges in the panel window
    // once capture includes sheets.merges (v5.10 panels use merged headers).
    const anyMerges = Object.values(tabs).some(t => (t.merges?.length ?? 0) > 0)
    expect(anyMerges).toBe(true)
  })

  it('classifies interactive controls with real controlTypes', () => {
    const interactive = epSheetAstInteractiveControls()
    expect(interactive.length).toBeGreaterThan(20)
    const unknown = interactive.filter(c => c.controlType === 'UNKNOWN')
    expect(
      unknown.map(c => `${c.id} ${c.label}`),
      'interactive cells must not stay UNKNOWN after dataValidation capture',
    ).toEqual([])
  })

  it('has no interactive controls missing UI (compiler gate)', () => {
    expect(
      epSheetAstControlsMissingUi().map(c => `${c.id} ${c.label} [${c.webStatus}]`),
    ).toEqual([])
  })

  it('binds every interactive control that is not explained away', () => {
    const bound = epSheetAstBoundInteractiveControls()
    expect(bound.length).toBeGreaterThan(20)
    for (const control of bound) {
      expect(control.webKey, control.id).toBeTruthy()
    }
  })
})
