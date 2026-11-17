import { describe, expect, it } from 'vitest'
import {
  chainLightningDps,
  deathWaveDps,
  innerLandMinesDps,
  poisonSwampDps,
  smartMissilesDps,
  spotlightFinalBonus,
  spotlightMissilesDps,
} from '../../src/mechanics/effective-paths/uw-dps'
import fixtures from '../../fixtures/mechanics/effective-paths-uw-dps.fixtures.json'
import { realGameSpeed } from '../../src/mechanics/effective-paths/firing'

/**
 * The weapon DPS functions against the sheet's own lambdas.
 *
 * Every case here was evaluated by the live sheet rather than worked out by
 * hand, so a disagreement is a porting error and not a rounding argument.
 */

describe('TTG_GAME_SPEED', () => {
  for (const c of fixtures.gameSpeed) {
    it(`matches ${c.displayed}x`, () => {
      expect(realGameSpeed(c.displayed)).toBeCloseTo(c.sheet, 10)
    })
  }

  it('runs the game slower than the button claims', () => {
    // 5x is really 4x, which is why frame-counting has to use this.
    expect(realGameSpeed(5)).toBeCloseTo(4, 10)
    // And 1x is slightly fast.
    expect(realGameSpeed(1)).toBeCloseTo(1.07, 10)
  })
})

describe('EP_DW_DPS', () => {
  for (const [i, c] of fixtures.deathWave.entries()) {
    it(`matches case ${i}`, () => {
      expect(deathWaveDps({
        unlocked: c.unlocked,
        damage: c.damage,
        quantity: c.quantity,
        cooldownSeconds: c.cooldown,
        damageAmplifierLabLevel: c.amp,
      })).toBeCloseTo(c.sheet, 8)
    })
  }
})

describe('EP_CL_DPS', () => {
  for (const [i, c] of fixtures.chainLightning.entries()) {
    it(`matches case ${i}`, () => {
      expect(chainLightningDps({
        damage: c.damage,
        quantity: c.quantity,
        chance: c.chance,
        attackSpeed: c.aspd,
        rapidFire: c.rapid,
        multishot: c.multi,
        bounce: c.bounce,
        displayedGameSpeed: c.speed,
        framesPerSecond: 120,
        lightSpeedShots: true,
      })).toBeCloseTo(c.sheet, 8)
    })
  }

  it('moves when a bullet stat moves', () => {
    // The property that makes Chain Lightning unlike every other weapon: it
    // procs per bullet, so attack speed is one of its damage stats.
    const base = {
      damage: 100, quantity: 2, chance: 0.05, attackSpeed: 2,
      rapidFire: 1, multishot: 1, bounce: 1, displayedGameSpeed: 5,
      framesPerSecond: 120, lightSpeedShots: true,
    }
    expect(chainLightningDps({ ...base, attackSpeed: 4 }))
      .toBeGreaterThan(chainLightningDps(base))
  })
})

describe('EP_SM_DPS', () => {
  for (const [i, c] of fixtures.smartMissiles.entries()) {
    it(`matches case ${i}`, () => {
      expect(smartMissilesDps({
        damage: c.damage,
        quantity: c.quantity,
        cooldownSeconds: c.cooldown,
        coverFire: c.coverFire,
        heatUp: c.heat,
        areaOfEffect: c.aoe,
        hasAreaOfEffectCard: c.card,
        areaOfEffectCardLevel: c.level,
      })).toBeCloseTo(c.sheet, 8)
    })
  }
})

describe('EP_SLM_DPS', () => {
  for (const [i, c] of fixtures.spotlightMissiles.entries()) {
    it(`matches case ${i}`, () => {
      expect(spotlightMissilesDps({
        smartMissileDamage: c.sm,
        spotlightDamage: c.sl,
        cooldownSeconds: c.cooldown,
        heatUp: c.heat,
        areaOfEffect: c.aoe,
        hasAreaOfEffectCard: c.card,
        areaOfEffectCardLevel: c.level,
      })).toBeCloseTo(c.sheet, 8)
    })
  }
})

describe('EP_PS_DPS', () => {
  for (const [i, c] of fixtures.poisonSwamp.entries()) {
    it(`matches case ${i}`, () => {
      expect(poisonSwampDps({
        unlocked: c.unlocked,
        damage: c.damage,
        durationSeconds: c.duration,
        cooldownSeconds: c.cooldown,
        deathCreep: c.creep,
        rend: c.rend,
        hasAreaOfEffectCard: c.card,
        areaOfEffectCardLevel: c.level,
      })).toBeCloseTo(c.sheet, 8)
    })
  }
})

describe('EP_ILM_DPS', () => {
  for (const [i, c] of fixtures.innerLandMines.entries()) {
    it(`matches case ${i}`, () => {
      expect(innerLandMinesDps({
        unlocked: c.unlocked,
        damage: c.damage,
        detonationsPerSecond: c.rate,
        chronoJump: c.jump,
        chargedMines: c.charged,
        areaOfEffect: c.aoe,
        hasAreaOfEffectCard: c.card,
        areaOfEffectCardLevel: c.level,
      })).toBeCloseTo(c.sheet, 8)
    })
  }
})

describe('EP_SL_FINAL_BONUS', () => {
  for (const [i, c] of fixtures.spotlightFinalBonus.entries()) {
    it(`matches case ${i}`, () => {
      expect(spotlightFinalBonus(c.coverage, c.bonus)).toBeCloseTo(c.sheet, 10)
    })
  }

  it('is worth nothing when it lights nothing', () => {
    expect(spotlightFinalBonus(0, 30)).toBe(1)
  })
})

describe('the three weapons that can be switched off', () => {
  it('contributes nothing when locked', () => {
    // Death Wave, Poison Swamp and Inner Land Mines take the unlock flag
    // themselves; the other four are gated by their caller.
    expect(deathWaveDps({
      unlocked: false, damage: 500, quantity: 5, cooldownSeconds: 100,
      damageAmplifierLabLevel: 9,
    })).toBe(0)
    expect(poisonSwampDps({
      unlocked: false, damage: 500, durationSeconds: 30, cooldownSeconds: 100,
      deathCreep: 2, rend: 2, hasAreaOfEffectCard: true, areaOfEffectCardLevel: 7,
    })).toBe(0)
    expect(innerLandMinesDps({
      unlocked: false, damage: 500, detonationsPerSecond: 2, chronoJump: 10,
      chargedMines: 1, areaOfEffect: 2, hasAreaOfEffectCard: true,
      areaOfEffectCardLevel: 7,
    })).toBe(0)
  })
})
