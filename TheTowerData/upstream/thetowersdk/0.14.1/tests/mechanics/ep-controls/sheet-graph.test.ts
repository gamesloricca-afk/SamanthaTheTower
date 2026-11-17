import { describe, expect, it } from 'vitest'

import {
  EP_CONTROL_SURFACE_SHEET_VERSION,
  EP_SHEET_AST_SHEET_VERSION,
  EP_SHEET_GRAPH_SHEET_VERSION,
  epSheetGraphRequiredInputLeaves,
  epSheetGraphRequiredLeavesMissingWebBinding,
  epSheetGraphStats,
  epSheetGraphUnreferencedInputLeaves,
  epSheetGraphNodes,
} from '../../../src/mechanics/ep-controls'

describe('EP sheet dependency DAG', () => {
  it('tracks the same sheet version as AST / surface', () => {
    expect(EP_SHEET_GRAPH_SHEET_VERSION).toBe(EP_SHEET_AST_SHEET_VERSION)
    expect(EP_SHEET_GRAPH_SHEET_VERSION).toBe(EP_CONTROL_SURFACE_SHEET_VERSION)
  })

  it('marks most interactive leaves as required by formula consumers', () => {
    const stats = epSheetGraphStats()
    expect(stats.requiredInputLeaves).toBeGreaterThan(40)
    expect(stats.unreferencedInputLeaves).toBeLessThanOrEqual(5)
    expect(epSheetGraphRequiredInputLeaves().length).toBe(stats.requiredInputLeaves)
  })

  it('requires Hide UW Cooldown (eDamage!AY24) — the defect class this DAG exists to catch', () => {
    expect(epSheetGraphRequiredInputLeaves()).toContain('eDamage!AY24')
    expect(epSheetGraphNodes()['eDamage!AY24']?.controlType).toBe('TOGGLE')
  })

  it('has no required leaf missing a web binding (DAG → web gate)', () => {
    expect(
      epSheetGraphRequiredLeavesMissingWebBinding().map(n => `${n.id} ${n.label}`),
    ).toEqual([])
  })

  it('only allows known PRESETS cells as unreferenced review leftovers', () => {
    // PRESETS master rows are often dropdown-validated but consumed via spill
    // selectors, not direct A1 reads of the master cell.
    const allow = new Set(['eEcon!AZ4', 'eHP!AX3'])
    expect(epSheetGraphUnreferencedInputLeaves().every(id => allow.has(id))).toBe(true)
  })
})
