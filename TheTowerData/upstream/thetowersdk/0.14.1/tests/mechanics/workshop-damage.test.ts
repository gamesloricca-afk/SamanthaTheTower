import { describe, expect, it } from 'vitest'
import { WORKSHOP_DATA } from '../../src/data/workshop/table'
import { WORKSHOP_DAMAGE_BANDS, WORKSHOP_DAMAGE_BASE, WORKSHOP_DAMAGE_TABLE_MAX_LEVEL, damageEnhancementMultiplier, effectiveDamageUpgradeLevel, workshopDamageAtLevel, DAMAGE_BASE_RESEARCH_INDEX, DAMAGE_CARD_INDEX, DAMAGE_FACTORS_GATED_ON_CARD_EQUIPPED, DAMAGE_MASTERY_RESEARCH_INDEX } from '../../src/mechanics/workshop/damage'

const TABLE = (WORKSHOP_DATA as unknown as Record<string, Record<number, { value: number }>>).Damage

describe('the damage formula against the shipped table', () => {
  it('reproduces every one of the 6001 rows', () => {
    const levels = Object.keys(TABLE).map(Number)
    expect(levels.length).toBe(6001)
    let worst = 0
    let worstLevel = -1
    for (const level of levels) {
      const expected = Number(TABLE[level]!.value)
      const got = workshopDamageAtLevel(level)
      const error = expected === 0 ? 0 : Math.abs(got / expected - 1)
      if (error > worst) { worst = error; worstLevel = level }
    }
    // 4.15e-7 is the table's own rounding, not formula error.
    expect(worst, `worst at level ${worstLevel}`).toBeLessThan(1e-6)
  })

  it('starts at the table\'s own level-0 value', () => {
    expect(workshopDamageAtLevel(0)).toBe(WORKSHOP_DAMAGE_BASE)
    expect(Number(TABLE[0]!.value)).toBe(WORKSHOP_DAMAGE_BASE)
  })

  it('is defined past the end of the table', () => {
    expect(WORKSHOP_DAMAGE_TABLE_MAX_LEVEL).toBe(6000)
    const beyond = workshopDamageAtLevel(WORKSHOP_DAMAGE_TABLE_MAX_LEVEL + 1000)
    expect(beyond).toBeGreaterThan(Number(TABLE[WORKSHOP_DAMAGE_TABLE_MAX_LEVEL]!.value))
    expect(Number.isFinite(beyond)).toBe(true)
  })
})

describe('the bands are what bend the curve', () => {
  it('rises in exponent at every band', () => {
    const exponents = WORKSHOP_DAMAGE_BANDS.map(([, exponent]) => exponent)
    for (let i = 1; i < exponents.length; i += 1) {
      expect(exponents[i], `band ${i}`).toBeGreaterThanOrEqual(exponents[i - 1]!)
    }
    expect(exponents[exponents.length - 1]).toBeGreaterThan(exponents[0]!)
  })

  it('adds nothing at or below a threshold and something just above it', () => {
    for (const [threshold] of WORKSHOP_DAMAGE_BANDS) {
      const at = workshopDamageAtLevel(threshold)
      const quadraticOnly = WORKSHOP_DAMAGE_BASE + 2.8 * threshold + 0.077 * threshold * threshold
      const bandsBelow = WORKSHOP_DAMAGE_BANDS
        .filter(([t]) => threshold > t)
        .reduce((sum, [t, e, k]) => sum + k * (threshold - t) ** e, 0)
      expect(at).toBeCloseTo(quadraticOnly + bandsBelow, 3)
      expect(workshopDamageAtLevel(threshold + 1)).toBeGreaterThan(at)
    }
  })

  it('grows faster than the quadratic alone once bands open', () => {
    const quadratic = (L: number): number => WORKSHOP_DAMAGE_BASE + 2.8 * L + 0.077 * L * L
    expect(workshopDamageAtLevel(500)).toBeCloseTo(quadratic(500), 6)
    expect(workshopDamageAtLevel(4000) / quadratic(4000)).toBeGreaterThan(1.5)
  })
})

describe('damage decay shifts the level the formula sees', () => {
  it('subtracts the penalty and floors at zero', () => {
    expect(effectiveDamageUpgradeLevel(4000, 500)).toBe(3500)
    expect(effectiveDamageUpgradeLevel(100, 500)).toBe(0)
    expect(effectiveDamageUpgradeLevel(4000)).toBe(4000)
  })

  it('costs more than the levels lost, because bands close behind you', () => {
    const full = workshopDamageAtLevel(4000)
    const decayed = workshopDamageAtLevel(effectiveDamageUpgradeLevel(4000, 501))
    const lostFraction = 1 - decayed / full
    // 501 of 4000 levels is 12.5%; the damage loss is materially larger.
    expect(lostFraction).toBeGreaterThan(501 / 4000)
  })
})

describe('the enhancement multiplier is gated on its lab', () => {
  it('does nothing at all without research 150', () => {
    expect(damageEnhancementMultiplier(400, 0)).toBe(1)
    expect(damageEnhancementMultiplier(0, 1)).toBe(1)
  })

  it('adds one percent per level once the lab is done', () => {
    expect(damageEnhancementMultiplier(100, 1)).toBeCloseTo(2, 10)
    expect(damageEnhancementMultiplier(400, 5)).toBeCloseTo(5, 10)
  })
})

describe('the cardActive branch', () => {
  it('gates two factors on the same flag, not one', () => {
    expect(DAMAGE_FACTORS_GATED_ON_CARD_EQUIPPED).toHaveLength(2)
    expect(DAMAGE_FACTORS_GATED_ON_CARD_EQUIPPED.join(' ')).toContain('cardBenefit')
    expect(DAMAGE_FACTORS_GATED_ON_CARD_EQUIPPED.join(' ')).toContain('Damage Mastery')
  })

  it('keeps the base research separate from the mastery research', () => {
    expect(DAMAGE_BASE_RESEARCH_INDEX).toBe(DAMAGE_CARD_INDEX)
    expect(DAMAGE_MASTERY_RESEARCH_INDEX).toBe(160)
    expect(DAMAGE_MASTERY_RESEARCH_INDEX).not.toBe(DAMAGE_BASE_RESEARCH_INDEX)
  })
})
