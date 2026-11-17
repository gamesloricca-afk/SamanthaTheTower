import { describe, expect, it } from 'vitest'

import {
  EP_CONTROL_SURFACE_SHEET_VERSION,
  EP_WEB_CONTROL_MAP_SHEET_VERSION,
  EP_WEB_CONTROL_NON_SHEET_ALLOWLIST,
  epControlRows,
  epWebControlEntries,
  epWebControlsMissingUi,
  epWebControlsRequiringBinding,
} from '../../../src/mechanics/ep-controls'

describe('EP web control map', () => {
  it('tracks the same sheet version as the control surface', () => {
    expect(EP_WEB_CONTROL_MAP_SHEET_VERSION).toBe(EP_CONTROL_SURFACE_SHEET_VERSION)
  })

  it('maps every control-surface row', () => {
    const surfaceRefs = new Set(
      epControlRows().map(row => `${row.tab}!${row.cell}`),
    )
    const mapped = new Set(
      epWebControlEntries()
        .filter(entry => entry.tab && entry.cell)
        .map(entry => `${entry.tab}!${entry.cell}`),
    )
    const missing = [...surfaceRefs].filter(ref => !mapped.has(ref))
    expect(missing, 'every surface row must appear in the web map').toEqual([])
  })

  it('has no missing_ui rows', () => {
    expect(epWebControlsMissingUi().map(e => `${e.tab}!${e.cell} ${e.label}`)).toEqual([])
  })

  it('only allows highestTier/wave as non-sheet controls', () => {
    expect([...EP_WEB_CONTROL_NON_SHEET_ALLOWLIST].sort()).toEqual([
      'highestTier',
      'highestWave',
    ])
    const nonSheet = epWebControlEntries().filter(e => e.status === 'non_sheet')
    expect(nonSheet.map(e => e.webKey).sort()).toEqual(['highestTier', 'highestWave'])
  })

  it('names remaining planner gaps rather than hiding them', () => {
    // Ceiling: these are unlock-gated eDamage rows with no web key yet.
    const gaps = epWebControlsRequiringBinding()
    expect(gaps.length).toBeLessThanOrEqual(2)
    for (const gap of gaps) {
      expect(gap.note, `${gap.tab}!${gap.cell}`).toBeTruthy()
    }
  })
})
