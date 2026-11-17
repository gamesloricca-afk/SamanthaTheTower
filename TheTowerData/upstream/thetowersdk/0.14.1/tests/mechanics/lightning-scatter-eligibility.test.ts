import { describe, expect, it } from 'vitest'
import { isLightningEliteType, lightningDamageWithStack } from '../../src/mechanics/combat/ultimates'

describe('Lightning Scatter amplification eligibility', () => {
  it('accepts Scatter parent and child without granting Vampire or Ray the same ramp', () => {
    expect(isLightningEliteType(6)).toBe(false)
    expect(isLightningEliteType(7)).toBe(true)
    expect(isLightningEliteType(8)).toBe(true)
    expect(isLightningEliteType(9)).toBe(false)
  })

  it('uses the prior-hit counter quadratically and starts without a free first-hit boost', () => {
    const multipliers = [0, 1, 2].map(hitCount => lightningDamageWithStack({
      baseDamage: 1, moduleBonus: 0, labValue: 25, hitCount,
      isEliteType: true, labActive: true,
    }))
    expect(multipliers).toEqual([1, 26, 101])
  })

  it('keeps excluded native types at ordinary damage despite accumulated hit counters', () => {
    for (const enemyType of [6, 9]) {
      expect(lightningDamageWithStack({ baseDamage: 10, moduleBonus: 0,
        labValue: 25, hitCount: 2, isEliteType: isLightningEliteType(enemyType), labActive: true }))
        .toBe(10)
    }
  })
})
