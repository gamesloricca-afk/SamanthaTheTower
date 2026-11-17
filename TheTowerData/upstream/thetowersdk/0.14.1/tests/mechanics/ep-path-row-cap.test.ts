import { describe, expect, it } from 'vitest'

import { EP_PATH_ROW_CAP, effectivePathsInputRanges } from '../../src/mechanics/effective-paths/input-ranges'

/**
 * The path is capped at 145 rows, and the control used to offer 150.
 *
 * Every planner tab builds its visible path with
 * `EPP_ITEM_NAME(<range>, MIN(145, <rowsCalculated>))`. The truncation is in
 * the path formula, not in the control, so a higher setting returns the same
 * 145 items and says nothing about it.
 *
 * This package offered 150 until 2026-08-18 — a maximum the sheet cannot
 * honour, in a package whose job is to say what the sheet does.
 */
describe('EP path row cap', () => {
  it('reads the catalog it means to read', () => {
    // Not decoration. The first version of this file imported a constant that
    // does not exist, so the suite failed to load — and a suite that cannot
    // load fails on every planted fault too, which made three plants look like
    // they bit when nothing had been tested at all.
    expect(effectivePathsInputRanges().ranges.length).toBeGreaterThan(100)
  })

  const rowsCalculated = effectivePathsInputRanges().ranges
    .find(range => range.id === 'control.rowsCalculated')

  it('caps the control at what the sheet will actually render', () => {
    expect(rowsCalculated).toBeTruthy()
    expect(EP_PATH_ROW_CAP).toBe(145)
    expect(rowsCalculated?.max).toBe(EP_PATH_ROW_CAP)
  })

  it('offers no option above the cap', () => {
    // The list is authored here rather than read from the sheet's validation,
    // so the one thing it must not do is advertise a value the path truncates.
    const options = (rowsCalculated?.options ?? []) as number[]
    expect(options.length).toBeGreaterThan(0)
    for (const option of options) {
      expect(option, String(option)).toBeLessThanOrEqual(EP_PATH_ROW_CAP)
      expect(option).toBeGreaterThanOrEqual(rowsCalculated?.min ?? 1)
    }
  })

  it('keeps the values the sheet is known to produce', () => {
    // 1 is the shipped default and 25 is what eEcon derives when the IDS import
    // is present. Both are observed, not chosen.
    const options = (rowsCalculated?.options ?? []) as number[]
    expect(options).toContain(1)
    expect(options).toContain(25)
  })
})
