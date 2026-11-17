import { describe, expect, it } from 'vitest'
import { maxRendArmourMultiplier, rendArmorProcCoefficients } from '../../src/mechanics'

const base = { hasRend: true, workshopChanceFraction: .3, workshopAdditionalMultiplierPerProc: .3,
  chanceSubstatFraction: 0, additionalMultiplierSubstat: 0, enhancementLevel: 300 }

describe('source-qualified Rend proc composition', () => {
  it('separates half-effect proc composition from full-effect total cap', () => {
    const result = rendArmorProcCoefficients(base)
    expect(result.chancePerProjectileHit).toBe(.75)
    expect(result.additionalMultiplierPerProc).toBe(.75)
    expect(result.enhancementMultiplier).toBe(2.5)
    expect(result.enhancementBasis).toBe('community_half_effect')
    expect(maxRendArmourMultiplier({ hasRend: true, labLevel: 30, substat: 0, enhancementLevel: 300 })).toBe(62)
  })
  it('matches the independent approximate36% owner example at enhancement1.39', () => {
    expect(rendArmorProcCoefficients({ ...base, enhancementLevel: 39 }).chancePerProjectileHit).toBeCloseTo(.3585, 14)
  })
  it('preserves base units, combines substats inside enhancement and grants no locked effect', () => {
    const result = rendArmorProcCoefficients({ ...base, enhancementLevel: 0, chanceSubstatFraction: .08,
      additionalMultiplierSubstat: .05 })
    expect(result.chancePerProjectileHit).toBe(.38)
    expect(result.additionalMultiplierPerProc).toBe(.35)
    expect(rendArmorProcCoefficients({ ...base, hasRend: false }).chancePerProjectileHit).toBe(0)
  })
  it('leaves above100% proc behavior unresolved without clipping or granting multiple procs', () => {
    const result = rendArmorProcCoefficients({ ...base, enhancementLevel: 400, chanceSubstatFraction: .1 })
    expect(result.chanceBeforeProcInterpretation).toBeCloseTo(1.2, 14)
    expect(result.chancePerProjectileHit).toBeNull()
    expect(result.overOneChanceUnresolved).toBe(true)
  })
  it('rejects invalid and overflowing inputs', () => {
    for (const value of [-1, NaN, Infinity]) expect(() => rendArmorProcCoefficients({ ...base,
      workshopChanceFraction: value })).toThrow('FINITE_NONNEGATIVE')
    expect(() => rendArmorProcCoefficients({ ...base, enhancementLevel: .5 })).toThrow('INTEGER_ENHANCEMENT')
    expect(() => rendArmorProcCoefficients({ ...base, additionalMultiplierSubstat: Number.MAX_VALUE })).toThrow('OVERFLOW')
  })
})
