import { describe, expect, it } from 'vitest'
import {
  buildElsAdditiveSkipBonus,
  buildElsModuleClusterFraction,
  computeElsTrackSkipChance,
  vaultElsSkipBenefit,
} from '../../src/mechanics/modules/els-module-cluster'

describe('els-module-cluster', () => {
  it('vault skip is 0.5% per star additive', () => {
    expect(vaultElsSkipBenefit(0)).toBe(0)
    expect(vaultElsSkipBenefit(1)).toBeCloseTo(0.005, 6)
    expect(vaultElsSkipBenefit(3)).toBeCloseTo(0.015, 6)
  })

  it('module cluster sums primary and assist additively', () => {
    const fraction = buildElsModuleClusterFraction('attack', {
      primaryAttackPct: 8,
      assistAttackPct: 4,
      primaryHealthPct: 0,
      assistHealthPct: 0,
    })
    expect(fraction).toBeCloseTo(0.12, 6)
  })

  it('vault and modules add before ELS+ multiplier', () => {
    const additive = buildElsAdditiveSkipBonus('attack', {
      vaultAttackStars: 3,
      primaryAttackPct: 8,
      assistAttackPct: 8,
      primaryHealthPct: 0,
      assistHealthPct: 0,
    })
    expect(additive).toBeCloseTo(0.015 + 0.16, 6)

    const skip = computeElsTrackSkipChance('attack', 100, 10, {
      vaultAttackStars: 3,
      primaryAttackPct: 8,
      assistAttackPct: 8,
      primaryHealthPct: 0,
      assistHealthPct: 0,
    })
    const base = 0.0005 + 100 * 0.0005 + 0.015 + 0.16
    expect(skip).toBeCloseTo(base * 1.1, 6)
  })
})
