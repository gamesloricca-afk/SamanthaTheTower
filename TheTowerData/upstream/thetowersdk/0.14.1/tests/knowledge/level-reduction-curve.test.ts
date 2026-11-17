import { describe, expect, it } from 'vitest'
import {
  diminishedLevelReductions,
  LEVEL_REDUCTION_ASYMPTOTE,
  LEVEL_REDUCTION_FREE_THRESHOLD,
  LEVEL_REDUCTION_STEP_SIZE,
} from '../../src/knowledge/compartments/enemies'

/**
 * The diminishing curve, and the step in it.
 *
 * The claim that needed checking hardest is that the exponent advances in whole
 * steps of 1500 rather than continuously — that turns a smooth curve into a
 * step function, which is a large difference to take on one reading. It was
 * confirmed independently. These tests pin the consequences.
 */

describe('below the threshold nothing is lost', () => {
  it.each([0, 1, 50, 99, 100])('%i reductions count in full', raw => {
    expect(diminishedLevelReductions(raw)).toBe(raw)
  })
})

describe('the curve is stepped, not smooth', () => {
  it('is flat across the whole first step', () => {
    const first = diminishedLevelReductions(LEVEL_REDUCTION_FREE_THRESHOLD + 1)
    const last = diminishedLevelReductions(LEVEL_REDUCTION_FREE_THRESHOLD + LEVEL_REDUCTION_STEP_SIZE - 1)
    expect(first).toBe(last)
    // And going from 101 to 1599 really does buy nothing.
    expect(first).toBe(LEVEL_REDUCTION_FREE_THRESHOLD)
  })

  it('moves only when the step index changes', () => {
    const before = diminishedLevelReductions(LEVEL_REDUCTION_FREE_THRESHOLD + LEVEL_REDUCTION_STEP_SIZE - 1)
    const after = diminishedLevelReductions(LEVEL_REDUCTION_FREE_THRESHOLD + LEVEL_REDUCTION_STEP_SIZE)
    expect(after).toBeGreaterThan(before)
  })

  it('is continuous at the threshold, which corroborates the reading', () => {
    // Both branches must agree at exactly 100, or the boundary was misread.
    expect(diminishedLevelReductions(LEVEL_REDUCTION_FREE_THRESHOLD))
      .toBe(diminishedLevelReductions(LEVEL_REDUCTION_FREE_THRESHOLD + 1))
  })
})

describe('effective reductions are bounded', () => {
  it('never exceeds the asymptote, and reaches it once the term underflows', () => {
    for (const raw of [10_000, 100_000, 1_000_000]) {
      expect(diminishedLevelReductions(raw)).toBeLessThanOrEqual(LEVEL_REDUCTION_ASYMPTOTE)
    }
    // It genuinely arrives: "approaches but never reaches" is true of the maths
    // and false of the arithmetic, and this is the assertion that says so.
    expect(diminishedLevelReductions(1_000_000)).toBe(LEVEL_REDUCTION_ASYMPTOTE)
    // And it is still below the cap while the term is representable.
    expect(diminishedLevelReductions(1_600)).toBeLessThan(LEVEL_REDUCTION_ASYMPTOTE)
  })

  it('rises monotonically', () => {
    let previous = -1
    for (let raw = 0; raw <= 20_000; raw += 250) {
      const value = diminishedLevelReductions(raw)
      expect(value).toBeGreaterThanOrEqual(previous)
      previous = value
    }
  })

  it('truncates rather than rounds', () => {
    // Every result is an integer, and never above the exact curve.
    for (const raw of [1600, 3100, 4600, 6100]) {
      const step = Math.floor((raw - LEVEL_REDUCTION_FREE_THRESHOLD) / LEVEL_REDUCTION_STEP_SIZE)
      const exact = LEVEL_REDUCTION_ASYMPTOTE - 300 * Math.exp(-step)
      expect(Number.isInteger(diminishedLevelReductions(raw))).toBe(true)
      expect(diminishedLevelReductions(raw)).toBeLessThanOrEqual(exact)
    }
  })
})
