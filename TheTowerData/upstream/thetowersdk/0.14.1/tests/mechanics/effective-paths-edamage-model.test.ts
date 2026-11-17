import { describe, expect, it } from 'vitest'
import {
  bulletDamageMultiplier,
  chronoFieldPlusSlow,
  chronoFieldSlow,
  composeEffectiveDamage,
  damageRunEffects,
  slowMultiplier,
} from '../../src/mechanics/effective-paths/edamage-model'
import fixture from '../../fixtures/mechanics/effective-paths-edamage-path.fixtures.json'

/**
 * The eDamage composition, against the factor values captured off row 5 of the
 * real grid. Every factor here is the sheet's own answer, so this checks the
 * shape rather than the arithmetic underneath it.
 */

const factors = fixture.factors
const value = (key: keyof typeof factors) => factors[key].value as number

const close = (ours: number, sheet: number, digits = 12) =>
  expect(Math.abs(ours / sheet - 1)).toBeLessThan(10 ** -digits)

describe('the eDamage composition', () => {
  it('reproduces ES5 from the grid\u2019s own factors', () => {
    close(composeEffectiveDamage({
      base: value('base'),
      crit: value('crit'),
      bulletDamageMultiplier: value('bulletDmgMulti'),
      spotlight: value('spotlight'),
      ultimateWeapons: value('uws'),
      ultimateWeaponCrit: value('uwCrit'),
      slow: value('slow'),
    }), value('eDamage'))
  })

  it('reproduces EA5 from its seven multipliers', () => {
    close(bulletDamageMultiplier({
      multishot: value('multishot'),
      bounceShot: value('bounceAd'),
      bulletsPerSecond: value('bps'),
      rapidFire: value('rapidFire'),
      rangeDamagePerMeter: value('rangeDpm'),
      superTowerCard: value('superTower'),
      maxRendArmour: value('maxRendArmor'),
    }), value('bulletDmgMulti'))
  })

  it('reproduces ER5 from its two Chrono Field terms', () => {
    close(
      slowMultiplier(value('chronoField'), value('chronoFieldPlus')),
      value('slow'),
    )
  })

  it('adds the two damage sources rather than multiplying them', () => {
    // A player with no ultimate weapons still has bullet damage; one running
    // Attack Dissonance has almost only ultimate weapons. Multiplying would
    // zero the whole thing in both cases.
    const shared = { base: 10, crit: 2, bulletDamageMultiplier: 3, spotlight: 1, slow: 1 }
    expect(composeEffectiveDamage({
      ...shared, ultimateWeapons: 0, ultimateWeaponCrit: 1.5,
    })).toBe(60)
    // 10 × (2 × 3 × 1  +  40 × 1.5) = 10 × 66
    expect(composeEffectiveDamage({
      ...shared, ultimateWeapons: 40, ultimateWeaponCrit: 1.5,
    })).toBe(660)
  })

  it('puts Spotlight on the bullet half only', () => {
    const shared = {
      base: 1,
      crit: 1,
      bulletDamageMultiplier: 100,
      ultimateWeapons: 100,
      ultimateWeaponCrit: 1,
      slow: 1,
    }
    // Doubling Spotlight doubles the bullet half and leaves the weapons alone.
    expect(composeEffectiveDamage({ ...shared, spotlight: 1 })).toBe(200)
    expect(composeEffectiveDamage({ ...shared, spotlight: 2 })).toBe(300)
  })
})

describe('Chrono Field', () => {
  it('caps the base slow at 90%, however much is stacked', () => {
    expect(chronoFieldSlow({ has: true, baseSlow: 0.5, substat: 0.9 }))
      .toBeCloseTo(1 / (1 - 0.9), 12)
    expect(chronoFieldSlow({ has: true, baseSlow: 0.5, substat: 0.2 }))
      .toBeCloseTo(1 / (1 - 0.7), 12)
  })

  it('is inert without the weapon', () => {
    expect(chronoFieldSlow({ has: false, baseSlow: 0.9, substat: 0.5 })).toBe(1)
    expect(chronoFieldPlusSlow({ has: false, slow: 0.5 })).toBe(1)
  })

  it('leaves Chrono Loop out of the 90% cap, as a separate term', () => {
    // Locked reads as absent rather than as zero slow.
    expect(chronoFieldPlusSlow({ has: true, slow: null })).toBe(1)
    expect(chronoFieldPlusSlow({ has: true, slow: 0.5 })).toBe(2)
  })
})

describe('what the Run Type switches off', () => {
  it('stops the tower firing only on Attack Dissonance', () => {
    expect(damageRunEffects('Attack Disso').towerFires).toBe(false)
    for (const run of ['Regular', 'Tourney', 'UW Disso', 'Util Disso'] as const) {
      expect(damageRunEffects(run).towerFires, run).toBe(true)
    }
  })

  it('leaves the tournament and UW Dissonance rules to the input layer', () => {
    /**
     * Only two run-type rules live in the grid's columns, and this reports
     * exactly those two.
     *
     * The rest are one layer earlier. `AY61` is driven from the simulated
     * tier, so a tournament arrives at the columns with its perks already
     * switched off; `BH33` is `AND(IDS_UW_OWN("Spotlight"), AX19<>"UW Disso")`,
     * so a UW Dissonance run arrives with Spotlight already locked. A model
     * that re-applied either here would apply it twice — which it did, and was
     * wrong by exactly the perk multipliers until ten sheet-driven accounts
     * said so.
     */
    const effects = damageRunEffects('Tourney')
    expect(Object.keys(effects).sort()).toEqual(['towerFires', 'usesDissonanceCash'])
  })

  it('recomputes cash only on Utility Dissonance', () => {
    expect(damageRunEffects('Util Disso').usesDissonanceCash).toBe(true)
    expect(damageRunEffects('Regular').usesDissonanceCash).toBe(false)
  })
})
