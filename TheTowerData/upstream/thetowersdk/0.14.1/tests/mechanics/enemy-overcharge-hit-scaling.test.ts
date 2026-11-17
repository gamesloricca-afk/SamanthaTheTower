import { describe, expect, it } from 'vitest'
import {
  enemyHeatUpMultiplierThroughHit,
  overchargeVolleyDamageMultiplier,
  rawOverchargeHitDamageBeforeReduction,
} from '../../src/mechanics/enemies/overcharge-hit-scaling'

describe('enemy-overcharge-hit-scaling', () => {
  it('shares volley multiplier across outbound and return hits', () => {
    expect(overchargeVolleyDamageMultiplier(1)).toBe(1)
    expect(overchargeVolleyDamageMultiplier(2)).toBe(1)
    expect(overchargeVolleyDamageMultiplier(3)).toBe(2)
    expect(overchargeVolleyDamageMultiplier(4)).toBe(2)
    expect(overchargeVolleyDamageMultiplier(5)).toBe(3)
  })

  it('applies volley and optional heat-up to raw OC hit damage', () => {
    expect(rawOverchargeHitDamageBeforeReduction({ hitNumber: 1, baseAdjustedDmg: 1000 })).toBe(1000)
    expect(rawOverchargeHitDamageBeforeReduction({ hitNumber: 2, baseAdjustedDmg: 1000 })).toBe(1000)
    expect(rawOverchargeHitDamageBeforeReduction({ hitNumber: 3, baseAdjustedDmg: 1000 })).toBe(2000)
    expect(rawOverchargeHitDamageBeforeReduction({
      hitNumber: 3,
      baseAdjustedDmg: 1000,
      includeHeatUp: true,
    })).toBeCloseTo(2163.2, 1)
  })

  it('compounds heat-up per hit index', () => {
    expect(enemyHeatUpMultiplierThroughHit(1)).toBe(1)
    expect(enemyHeatUpMultiplierThroughHit(2)).toBeCloseTo(1.04, 6)
    expect(enemyHeatUpMultiplierThroughHit(10)).toBeCloseTo(1.04 ** 9, 4)
  })
})
