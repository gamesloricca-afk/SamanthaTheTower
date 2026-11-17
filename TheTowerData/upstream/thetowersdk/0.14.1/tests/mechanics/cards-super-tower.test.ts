import { describe, expect, it } from 'vitest'
import { CARD_TEMPLATE_MAP } from '../../src/data'
import { superTowerActiveDamageMultiplier, superTowerActiveUltimateDamageMultiplier, superTowerCycleTiming } from '../../src/mechanics/cards'
import { superTowerBonus, superTowerEffectiveUltimateBonus } from '../../src/mechanics/effective-paths/damage-stats'

describe('Super Tower base card values and separate Bonus lab', () => {
  it('applies the Bonus lab exactly once at every card rank', () => {
    const values = [2.5, 2.9, 3.3, 3.7, 4.1, 4.5, 5]
    for (const [index, value] of values.entries()) {
      expect(superTowerActiveDamageMultiplier(index + 1, 0)).toBe(value)
      expect(superTowerActiveDamageMultiplier(index + 1, 10)).toBeCloseTo(value * 1.30, 12)
      expect(superTowerActiveDamageMultiplier(index + 1, 30)).toBeCloseTo(value * 1.90, 12)
    }
    expect(superTowerActiveDamageMultiplier(7, 30)).toBeCloseTo(9.5, 12)
    expect(superTowerBonus(7, 0)).toBe(5)
    expect(superTowerActiveDamageMultiplier(7, 30)).toBeCloseTo(superTowerBonus(7, 30), 12)
    expect(() => superTowerActiveDamageMultiplier(7, -1)).toThrow(RangeError)
  })

  it('separates active time, inactive time, and start-to-start cycle without choosing phase', () => {
    expect(CARD_TEMPLATE_MAP.st.description).toContain('15 sec')
    expect(CARD_TEMPLATE_MAP.st.description).toContain('30 sec cooldown')
    expect(superTowerCycleTiming(false)).toEqual({ activeDurationSeconds: 15, inactiveDurationSeconds: 30, cycleSeconds: 45 })
    expect(superTowerCycleTiming(true, 0)).toEqual({ activeDurationSeconds: 15, inactiveDurationSeconds: 27, cycleSeconds: 42 })
    expect(superTowerCycleTiming(true, 9)).toEqual({ activeDurationSeconds: 15, inactiveDurationSeconds: 0, cycleSeconds: 15 })
  })

  it('transfers the current active card multiplier to UWs only with mastery', () => {
    expect(CARD_TEMPLATE_MAP.st.masteryDescription).toContain('35%')
    expect(superTowerActiveUltimateDamageMultiplier(7, 30, false)).toBe(1)
    expect(superTowerActiveUltimateDamageMultiplier(7, 30, true)).toBeCloseTo(3.325, 12)
    // The sheet's time-weighting contract agrees when given the lab-adjusted
    // card bonus and a cycle consisting only of its 15-second active window.
    expect(superTowerActiveUltimateDamageMultiplier(7, 30, true)).toBeCloseTo(
      superTowerEffectiveUltimateBonus({ hasCard: true, hasMastery: true,
        bonus: superTowerActiveDamageMultiplier(7, 30), cooldownSeconds: 15 }), 12)
  })
})
