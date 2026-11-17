import { describe, expect, it } from 'vitest'
import {
  shockwaveDamage,
  spotlightCoverage,
  superTowerBonus,
  superTowerCooldown,
  superTowerEffectiveBonus,
  superTowerEffectiveUltimateBonus,
} from '../../src/mechanics/effective-paths/damage-stats'
import fixtures from '../../fixtures/mechanics/effective-paths-damage-stats3.fixtures.json'

/**
 * Super Tower, Spotlight coverage and the shockwave, against the live sheet.
 *
 * `EPD_SUPERTOWER_EFFECTIVE_BONUS` is captured on both branches of the
 * Spotlight gate. That took toggling `eDamage!$BH$33` on the working copy and
 * putting the formula back, because the function reads that cell rather than
 * the `has_sl` parameter it declares — see the test that pins the difference.
 */

const close = (ours: number, sheet: number, digits = 12) =>
  expect(Math.abs(ours / sheet - 1)).toBeLessThan(10 ** -digits)

describe('EPD_SUPERTOWER_BONUS', () => {
  for (const s of fixtures.superTowerBonus) {
    it(`matches the sheet at card level ${s.level}, lab ${s.lab}`, () => {
      close(superTowerBonus(s.level, s.lab), s.sheet)
    })
  }

  it('gives level 7 a tenth more than the line would', () => {
    // The sheet writes this as a string comparison against "Lvl 7"; it fires.
    expect(superTowerBonus(6, 0)).toBeCloseTo(4.5, 12)
    expect(superTowerBonus(7, 0)).toBeCloseTo(5, 12)
    expect(superTowerBonus(7, 0)).not.toBeCloseTo(2.1 + 7 * 0.4, 12)
  })
})

describe('EPD_SUPERTOWER_COOLDOWN', () => {
  for (const s of fixtures.superTowerCooldown) {
    it(`matches the sheet with mastery ${s.has} at level ${s.level}`, () => {
      expect(superTowerCooldown(s.has, s.level)).toBeCloseTo(s.sheet, 12)
    })
  }

  it('starts at 45 seconds and drops 3 a mastery level', () => {
    expect(superTowerCooldown(false, 9)).toBe(45)
    expect(superTowerCooldown(true, 0)).toBe(42)
  })
})

describe('EP_UW_SL_COVERAGE', () => {
  for (const [index, c] of fixtures.spotlightCoverage.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      expect(spotlightCoverage(c.quant, c.angle)).toBeCloseTo(c.sheet, 12)
    })
  }

  it('counts the smallest enemy\u2019s own width, and stops at the full circle', () => {
    // A zero-degree spotlight still covers something: enemies have width.
    expect(spotlightCoverage(1, 0)).toBeCloseTo(4 / 360, 12)
    expect(spotlightCoverage(20, 90)).toBe(1)
  })
})

describe('EPD_SUPERTOWER_EFFECTIVE_BONUS', () => {
  for (const [index, e] of fixtures.superTowerEffective.entries()) {
    it(`matches the sheet on state ${index}, spotlight off`, () => {
      close(superTowerEffectiveBonus({
        hasCard: e.hasCard,
        hasMastery: e.hasMastery,
        bonus: e.bonus,
        cooldownSeconds: e.cooldown,
        hasSpotlight: false,
        spotlightQuantity: e.slQuant,
        spotlightAngleDegrees: e.slAngle,
      }), e.sheet)
    })

    it(`matches the sheet on state ${index}, spotlight on`, () => {
      close(superTowerEffectiveBonus({
        hasCard: e.hasCard,
        hasMastery: e.hasMastery,
        bonus: e.bonus,
        cooldownSeconds: e.cooldown,
        hasSpotlight: true,
        spotlightQuantity: e.slQuant,
        spotlightAngleDegrees: e.slAngle,
      }), e.sheetWithSpotlight)
    })
  }

  it('takes its own hasSpotlight, where the sheet ignores the parameter', () => {
    // The sheet reads `eDamage!$BH$33` instead of `has_sl`, so a row with the
    // parameter false still picked up coverage when the cell was true. Seven
    // of the sixteen fixture rows differ between the branches, and some of
    // those have `hasSl` false — proof the parameter does nothing there.
    const ignored = fixtures.superTowerEffective
      .filter(e => e.sheet !== e.sheetWithSpotlight && !e.hasSl)
    expect(ignored.length).toBeGreaterThan(0)
  })

  it('is one without the card, whatever else is set', () => {
    expect(superTowerEffectiveBonus({
      hasCard: false,
      hasMastery: true,
      bonus: 5,
      cooldownSeconds: 30,
      hasSpotlight: true,
      spotlightQuantity: 8,
      spotlightAngleDegrees: 60,
    })).toBe(1)
  })
})

describe('EPD_SUPERTOWER_EFFECTIVE_UWBONUS', () => {
  for (const [index, e] of fixtures.superTowerEffectiveUw.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      close(superTowerEffectiveUltimateBonus({
        hasCard: e.hasCard,
        hasMastery: e.hasMastery,
        bonus: e.bonus,
        cooldownSeconds: e.cooldown,
      }), e.sheet)
    })
  }

  it('needs both the card and the mastery', () => {
    const base = { bonus: 5, cooldownSeconds: 30 }
    expect(superTowerEffectiveUltimateBonus({ ...base, hasCard: true, hasMastery: false })).toBe(1)
    expect(superTowerEffectiveUltimateBonus({ ...base, hasCard: false, hasMastery: true })).toBe(1)
    expect(superTowerEffectiveUltimateBonus({ ...base, hasCard: true, hasMastery: true }))
      .not.toBe(1)
  })
})

describe('EPD_SHOCKWAVE_DAMAGE', () => {
  for (const [index, s] of fixtures.shockwave.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      close(shockwaveDamage({
        cannonBonus: s.acp,
        sizeWorkshopLevel: s.sizeWs,
        sizeLabLevel: s.sizeLab,
        frequencyWorkshopLevel: s.freqWs,
        frequencyVault: s.freqVault,
        frequencySubstat: s.freqSub,
      }), s.sheet)
    })
  }

  it('is one with no cannon bonus to spread', () => {
    expect(shockwaveDamage({
      cannonBonus: 0,
      sizeWorkshopLevel: 30,
      sizeLabLevel: 20,
      frequencyWorkshopLevel: 80,
      frequencyVault: -3,
      frequencySubstat: -4,
    })).toBe(1)
  })

  it('floors the frequency at seven seconds before adding the wave\u2019s size', () => {
    const fast = shockwaveDamage({
      cannonBonus: 3,
      sizeWorkshopLevel: 0,
      sizeLabLevel: 0,
      frequencyWorkshopLevel: 999,
      frequencyVault: -50,
      frequencySubstat: -50,
    })
    // Floored at 7, plus half the 0.6s base size.
    expect(fast).toBeCloseTo(1 + 2 * (7 / 7.3), 12)
  })
})

describe('the Super Tower ultimate-weapon share', () => {
  /**
   * The card multiplies bullet damage; its mastery passes 35% of that
   * multiplier to ultimate weapons. `35% × bonus − 1` is that multiplier
   * turned into a bonus above 1, the same shape the sibling pro-rates.
   *
   * A mastery can only be unlocked on a maxed card, so every state these can
   * actually be called in has card level 7.
   */
  const at = (bonus: number, cooldown = 45) => superTowerEffectiveUltimateBonus({
    hasCard: true, hasMastery: true, bonus, cooldownSeconds: cooldown,
  })

  it('is a bonus everywhere the mastery can exist', () => {
    // Mastery implies a maxed card, so the bonus starts at 5 and only grows.
    for (const lab of [0, 1, 5, 10, 20, 30]) {
      expect(at(superTowerBonus(7, lab)), `lab ${lab}`).toBeGreaterThan(1)
    }
    expect(superTowerBonus(7, 0)).toBe(5)
    expect(0.35 * superTowerBonus(7, 0)).toBeCloseTo(1.75, 12)
  })

  it('passes 35% of the card’s multiplier, not 35% of its bonus', () => {
    // The distinction the two siblings turn on: one takes a share of the
    // multiplier, the other a share of the part above 1.
    const bonus = superTowerBonus(7, 0)
    const cooldown = superTowerCooldown(true, 0)
    expect(at(bonus, cooldown)).toBeCloseTo(1 + (15 * (0.35 * bonus - 1)) / cooldown, 12)
  })

  it('still matches the sheet, including on states the game cannot reach', () => {
    // The fixture bonuses are randomised rather than reachable, which is what
    // makes them a parity check — the function has to agree everywhere, not
    // only where the game can go.
    for (const e of fixtures.superTowerEffectiveUw) {
      expect(superTowerEffectiveUltimateBonus({
        hasCard: e.hasCard,
        hasMastery: e.hasMastery,
        bonus: e.bonus,
        cooldownSeconds: e.cooldown,
      })).toBeCloseTo(e.sheet, 12)
    }
  })
})
