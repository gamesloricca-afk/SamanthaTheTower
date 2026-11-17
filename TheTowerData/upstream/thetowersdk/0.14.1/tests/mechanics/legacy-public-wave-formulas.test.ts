import { describe, expect, it } from 'vitest'
import {
  legacyNewDmg,
  legacyPublicEnemyDmg,
  legacyPublicEnemyHp,
  legacyTierDiff,
} from '../../src/mechanics/waves/reference/public-wave-formulas'

describe('legacy public wave formulas (community v1.2 reference)', () => {
  it('TierDiff(1) is unity', () => {
    expect(legacyTierDiff(1)).toBe(1)
  })

  it('TierDiff grows monotonically through T14', () => {
    let prev = legacyTierDiff(1)
    for (let tier = 2; tier <= 14; tier++) {
      const next = legacyTierDiff(tier)
      expect(next).toBeGreaterThan(prev)
      prev = next
    }
  })

  it('NewDMG applies attenuation from T10 onward', () => {
    expect(legacyNewDmg(9)).toBe(1)
    expect(legacyNewDmg(10)).toBeLessThan(1)
    expect(legacyNewDmg(15)).toBeLessThan(legacyNewDmg(10))
  })

  it('ENEMYHP/ENEMYDMG produce finite positive values at sample points', () => {
    expect(legacyPublicEnemyHp(100, 10, false)).toBeGreaterThan(0)
    expect(legacyPublicEnemyDmg(100, 10, false)).toBeGreaterThan(0)
    expect(legacyPublicEnemyHp(500, 14, true)).toBeGreaterThan(legacyPublicEnemyHp(500, 14, false))
  })

  it('documents that legacy output is not modern parity target', () => {
    // Modern T10 W8 skip-level HP is ~510k — legacy framework uses different coefficients.
    expect(legacyPublicEnemyHp(8, 10, false)).not.toBeCloseTo(510_799, -2)
  })
})
