import { describe, expect, it } from 'vitest'
import {
  computeEconomyScaledBenefitPerCost,
  computeEconomyScaledRoiPct,
  computeRoiReferenceCost,
  formatAdaptiveRoiMultiplier,
  formatAdaptiveRoiPct,
} from '../../src/mechanics/planning/roi-scaling'

describe('computeRoiReferenceCost', () => {
  it('returns the minimum positive cost', () => {
    expect(computeRoiReferenceCost([4.31e18, 2.03e11, 0, -1])).toBe(2.03e11)
  })

  it('falls back to 1 when no positive costs exist', () => {
    expect(computeRoiReferenceCost([0, -5, NaN])).toBe(1)
  })
})

describe('computeEconomyScaledRoiPct', () => {
  it('equals relative improvement × 100 when cost equals reference cost', () => {
    const relativeImprovement = 0.05
    expect(computeEconomyScaledRoiPct(relativeImprovement, 100, 100)).toBeCloseTo(5, 10)
  })

  it('preserves sort order when cost scales uniformly', () => {
    const ref = 1e11
    const lowCostRoi = computeEconomyScaledRoiPct(0.01, 1e11, ref)
    const highCostRoi = computeEconomyScaledRoiPct(0.01, 1e14, ref)
    expect(lowCostRoi).toBeGreaterThan(highCostRoi)
  })

  it('returns positive ROI for tiny improvements at high cost when reference is lower', () => {
    const roi = computeEconomyScaledRoiPct(0.001, 4.31e18, 2.03e11)
    expect(roi).toBeGreaterThan(0)
  })

  it('returns 0 for non-positive benefit', () => {
    expect(computeEconomyScaledRoiPct(0, 100, 100)).toBe(0)
    expect(computeEconomyScaledRoiPct(-1, 100, 100)).toBe(0)
  })
})

describe('formatAdaptiveRoiPct', () => {
  it('never formats a positive value as 0%', () => {
    expect(formatAdaptiveRoiPct(0.0000103)).not.toBe('0%')
    expect(formatAdaptiveRoiPct(1e-8)).not.toBe('0%')
  })

  it('uses tiered precision for readable ranges', () => {
    expect(formatAdaptiveRoiPct(150)).toBe('150%')
    expect(formatAdaptiveRoiPct(12.34)).toBe('12.3%')
    expect(formatAdaptiveRoiPct(1.234)).toBe('1.23%')
    expect(formatAdaptiveRoiPct(0.123)).toBe('0.123%')
  })

  it('returns 0% only for non-positive input', () => {
    expect(formatAdaptiveRoiPct(0)).toBe('0%')
    expect(formatAdaptiveRoiPct(-1)).toBe('0%')
  })
})

describe('computeEconomyScaledBenefitPerCost', () => {
  it('matches raw benefit-per-cost when cost equals reference', () => {
    expect(computeEconomyScaledBenefitPerCost(0.5, 10, 10)).toBeCloseTo(0.05, 10)
  })
})

describe('formatAdaptiveRoiMultiplier', () => {
  it('never formats a positive multiplier as 0', () => {
    expect(formatAdaptiveRoiMultiplier(0.00087)).not.toBe('0')
  })
})
