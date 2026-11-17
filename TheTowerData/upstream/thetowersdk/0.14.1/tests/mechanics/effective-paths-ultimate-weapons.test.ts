import { describe, expect, it } from 'vitest'
import {
  chainLightningChance,
  chainLightningDamage,
  chainLightningQuantity,
  deathWaveCooldown,
  deathWaveCooldownWithMvn,
  deathWaveDamage,
  deathWaveQuantity,
  innerLandMineDamage,
  innerLandMineQuantity,
  missileAmplifierSlope,
  ultimateCritCardMultiplier,
  smartMissileCooldown,
  smartMissileDamage,
  smartMissileDamagePerSecond,
  smartMissileQuantity,
  spotlightAngle,
  spotlightDamage,
  spotlightLightRange,
  ultimateWeaponHeatUp,
  ultimateWeaponTotalDamage,
} from '../../src/mechanics/effective-paths/ultimate-weapons'
import fixtures from '../../fixtures/mechanics/effective-paths-ultimate-weapons.fixtures.json'

/**
 * The ultimate weapon layer, against the live sheet.
 *
 * Most of these are one line, so the interesting cases are the edges: which
 * counts are floored and when, which arguments the sheet accepts as "absent",
 * and where Spotlight enters the total.
 */

const close = (ours: number, sheet: number, digits = 12) =>
  expect(Math.abs(ours / sheet - 1)).toBeLessThan(10 ** -digits)

describe('shared Missile Amplifier slope', () => {
  it.each([
    [0, false, 1], [0, true, 1], [25, false, 38.5], [25, true, 76],
  ] as const)('uses lab %i with Tactical Barrage %s', (level, tacticalBarrage, expected) => {
    expect(missileAmplifierSlope(level, tacticalBarrage)).toBe(expected)
  })
  it('feeds the canonical repeated-hit average without changing its base', () => {
    expect(ultimateWeaponHeatUp(missileAmplifierSlope(25, false), 2)).toBe(20.25)
    expect(ultimateWeaponHeatUp(missileAmplifierSlope(25, true), 2)).toBe(39)
  })
})

describe('additional Ultimate Crit card multiplier', () => {
  const base = { hasCard: true, cardChanceFraction: 0.03, hasMastery: false, masteryLabLevel: 9, criticalFactor: 35.85000076 }
  it('is neutral when the card is not equipped, including unlocked mastery', () => {
    expect(ultimateCritCardMultiplier({ ...base, hasCard: false, hasMastery: true })).toBe(1)
  })
  it('uses fractional card chance and the tower critical factor', () => {
    expect(ultimateCritCardMultiplier(base)).toBeCloseTo(2.0455000228, 12)
  })
  it('adds mastery once, independently of the ordinary UW critical folding', () => {
    expect(ultimateCritCardMultiplier({ ...base, hasMastery: true })).toBeCloseTo(3.19555004788, 12)
  })
  it('does not create damage when the critical factor has no bonus', () => {
    expect(ultimateCritCardMultiplier({ ...base, criticalFactor: 1 })).toBe(1)
  })
})

describe('the stats that are just base plus substat', () => {
  for (const [index, c] of fixtures.plainStats.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      close(chainLightningDamage(c.base, c.sub, c.perk), c.sheetClDmg)
      close(chainLightningChance(c.base, c.sub), c.sheetClCh)
      close(deathWaveDamage(c.base, c.sub), c.sheetDwDmg)
      close(smartMissileDamage(c.base, c.sub), c.sheetSmDmg)
      close(innerLandMineDamage(c.base, c.sub), c.sheetIlmDmg)
      close(spotlightAngle(c.base, c.sub), c.sheetSlAngle)
    })
  }

  it('doubles Chain Lightning damage for the perk', () => {
    expect(chainLightningDamage(100, 20, true)).toBe(240)
    expect(chainLightningDamage(100, 20, false)).toBe(120)
  })
})

describe('the counts, and what each one floors', () => {
  for (const [index, c] of fixtures.chainLightningQty.entries()) {
    it(`matches Chain Lightning quantity on state ${index}`, () => {
      expect(chainLightningQuantity(c.base, c.sub, c.dc)).toBeCloseTo(c.sheet, 12)
    })
  }
  for (const [index, c] of fixtures.deathWaveQty.entries()) {
    it(`matches Death Wave quantity on state ${index}`, () => {
      expect(deathWaveQuantity(c.base, c.sub, c.perk)).toBe(c.sheet)
    })
  }
  for (const [index, c] of fixtures.smartMissileQty.entries()) {
    it(`matches Smart Missile quantity on state ${index}`, () => {
      expect(smartMissileQuantity(c.base, c.sub, c.perk)).toBe(c.sheet)
    })
  }
  for (const [index, c] of fixtures.innerLandMineQty.entries()) {
    it(`matches Inner Land Mine quantity on state ${index}`, () => {
      expect(innerLandMineQuantity(c.base, c.sub, c.perk)).toBe(c.sheet)
    })
  }

  it('floors Chain Lightning before Death Chain, not after', () => {
    // The 0.6 survives the floor, so it is a chance at another bolt rather
    // than a whole one. Flooring afterwards would throw it away.
    expect(chainLightningQuantity(3.9, 0, true)).toBeCloseTo(3.6, 12)
    expect(chainLightningQuantity(3.9, 0, false)).toBe(3)
  })

  it('floors the other three after their perk, not before', () => {
    expect(deathWaveQuantity(2.7, 0.5, true)).toBe(4)
    expect(smartMissileQuantity(2.7, 0.5, true)).toBe(7)
    expect(innerLandMineQuantity(2.7, 0.5, true)).toBe(9)
  })
})

describe('cooldowns', () => {
  for (const [index, c] of fixtures.cooldowns.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      close(deathWaveCooldown(c.base, c.sub, c.gcomp), c.sheetDw)
      close(smartMissileCooldown(c.base, c.sub, c.gcomp), c.sheetSm)
    })
  }

  for (const [index, c] of fixtures.cooldownMvn.entries()) {
    it(`matches Max Value Nuke on state ${index}`, () => {
      close(deathWaveCooldownWithMvn(c.base, c.sub, c.gcomp, c.mvn), c.sheet)
    })
  }

  it('lets a Max Value Nuke cooldown win outright', () => {
    expect(deathWaveCooldownWithMvn(100, 20, 0.5, 7)).toBe(7)
    expect(deathWaveCooldownWithMvn(100, 20, 0.5, null)).toBe(60)
  })
})

describe('Smart Missiles per second', () => {
  for (const [index, c] of fixtures.smartMissileDps.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      const ours = smartMissileDamagePerSecond(c.dmg, c.cd)
      if (c.sheet === 0) expect(ours).toBe(0)
      else close(ours, c.sheet)
    })
  }

  it('answers zero without a cooldown rather than dividing', () => {
    expect(smartMissileDamagePerSecond(900, null)).toBe(0)
  })
})

describe('Spotlight', () => {
  for (const [index, c] of fixtures.spotlightLightRange.entries()) {
    it(`matches Light Range on state ${index}`, () => {
      close(spotlightLightRange(c.lr, c.dpm), c.sheet)
    })
  }

  for (const [index, c] of fixtures.spotlightDamage.entries()) {
    it(`matches Spotlight damage on state ${index}`, () => {
      close(spotlightDamage({
        base: c.base,
        substat: c.sub,
        lightRange: c.lr,
        relicPct: c.relic,
        vaultPct: c.vault,
        hasPerk: c.perk,
      }), c.sheet)
    })
  }

  it('leaves Light Range at one when the upgrade is absent, not zero', () => {
    expect(spotlightLightRange(null, 4)).toBe(1)
    expect(spotlightLightRange(0.1, 4)).toBeCloseTo(1.3, 12)
  })
})

describe('EP_UW_HEATUP', () => {
  for (const [index, c] of fixtures.heatUp.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      close(ultimateWeaponHeatUp(c.amp, c.hits), c.sheet)
    })
  }

  it('is one with no hit count to ramp over', () => {
    expect(ultimateWeaponHeatUp(3, null)).toBe(1)
    // One hit is no ramp either — the midpoint of a ramp of length zero.
    expect(ultimateWeaponHeatUp(3, 1)).toBe(1)
  })
})

describe('EP_UW_TOTAL_DAMAGE', () => {
  for (const [index, c] of fixtures.totalDamage.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      close(ultimateWeaponTotalDamage({
        deathWave: c.dw,
        chainLightning: c.cl,
        smartMissiles: c.sm,
        spotlightDamage: c.slm,
        spotlightBonus: c.sl,
        poisonSwamp: c.ps,
        innerLandMines: c.ilm,
        damageBoost: c.boost,
        superTowerUltimateMastery: c.stm,
        ultimateCritCard: c.crit,
      }), c.sheet)
    })
  }

  it('adds the Spotlight weapon outside the Spotlight bonus', () => {
    // A weapon does not light itself. Moving it inside the bracket would
    // multiply it by the coverage bonus, which is wrong and looks fine.
    const base = {
      deathWave: 100,
      chainLightning: 0,
      smartMissiles: 0,
      poisonSwamp: 0,
      innerLandMines: 0,
      spotlightBonus: 2,
      damageBoost: 1,
      superTowerUltimateMastery: 1,
      ultimateCritCard: 1,
    }
    expect(ultimateWeaponTotalDamage({ ...base, spotlightDamage: 50 })).toBe(250)
    expect(ultimateWeaponTotalDamage({ ...base, spotlightDamage: 0 })).toBe(200)
  })

  it('applies the Super Tower share twice, as the sheet does', () => {
    // Once inside the bracket and once outside, so it is squared for every
    // weapon except Spotlight. Deliberate, and pinned so nobody tidies it.
    const base = {
      deathWave: 100,
      chainLightning: 0,
      smartMissiles: 0,
      poisonSwamp: 0,
      innerLandMines: 0,
      spotlightDamage: 0,
      spotlightBonus: 1,
      damageBoost: 1,
      ultimateCritCard: 1,
    }
    expect(ultimateWeaponTotalDamage({ ...base, superTowerUltimateMastery: 2 })).toBe(400)
  })
})
