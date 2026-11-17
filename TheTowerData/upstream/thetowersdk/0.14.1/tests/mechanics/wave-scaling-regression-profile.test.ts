import { describe, expect, it } from 'vitest'
import {
  DAMAGE_TIER_DIVISOR_TABLE,
  TIER_COIN_MULTIPLIER_TABLE,
  TIER_DIFFICULTY_MULTIPLIER_TABLE,
  WAVE_FORMULA,
} from '../../src/mechanics/waves/reference/base-constants'
import { MAX_CAMPAIGN_TIER } from '../../src/data'
import {
  CAMPAIGN_COIN_REWARD_CURVE,
  CAMPAIGN_TIER_PRESSURE,
  DAMAGE_TIER_ATTENUATION,
  REGRESSION_DAMAGE_PROFILE,
  REGRESSION_HP_PROFILE,
} from '../../src/mechanics/waves/scaling-regression-profile'

describe('wave-scaling-regression-profile coefficients', () => {
  it('matches legacy reference tables byte-for-byte during migration', () => {
    expect([...CAMPAIGN_TIER_PRESSURE].slice(0, TIER_DIFFICULTY_MULTIPLIER_TABLE.length))
      .toEqual([...TIER_DIFFICULTY_MULTIPLIER_TABLE])
    expect([...CAMPAIGN_COIN_REWARD_CURVE].slice(0, TIER_COIN_MULTIPLIER_TABLE.length))
      .toEqual([...TIER_COIN_MULTIPLIER_TABLE])
    expect([...DAMAGE_TIER_ATTENUATION].slice(0, 21))
      .toEqual([...DAMAGE_TIER_DIVISOR_TABLE].slice(0, 21))
    expect(CAMPAIGN_TIER_PRESSURE.length).toBe(MAX_CAMPAIGN_TIER + 1)
    expect(DAMAGE_TIER_ATTENUATION.length).toBe(MAX_CAMPAIGN_TIER + 1)
    expect(CAMPAIGN_COIN_REWARD_CURVE.length).toBe(MAX_CAMPAIGN_TIER + 1)
  })

  it('matches legacy HP and damage regression profiles', () => {
    expect(REGRESSION_HP_PROFILE).toEqual(WAVE_FORMULA.health)
    expect(REGRESSION_DAMAGE_PROFILE).toEqual(WAVE_FORMULA.damage)
  })

  it('extends tier pressure T22–24 with ×1200 ladder from T21', () => {
    const t21 = CAMPAIGN_TIER_PRESSURE[21]!
    const t22 = CAMPAIGN_TIER_PRESSURE[22]!
    const t23 = CAMPAIGN_TIER_PRESSURE[23]!
    const t24 = CAMPAIGN_TIER_PRESSURE[24]!
    expect(t22 / t21).toBeCloseTo(1200, 6)
    expect(t23 / t22).toBeCloseTo(1200, 6)
    expect(t24 / t23).toBeCloseTo(1200, 6)
    expect(DAMAGE_TIER_ATTENUATION[22]).toBeCloseTo(DAMAGE_TIER_ATTENUATION[21]! * 5, 6)
    expect(DAMAGE_TIER_ATTENUATION[24]).toBeCloseTo(DAMAGE_TIER_ATTENUATION[21]! * 5 ** 3, 4)
  })
})
