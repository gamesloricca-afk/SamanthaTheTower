import { describe, expect, it } from 'vitest'
import {
  bounceShotChance,
  bounceShotMultiplier,
  bounceShotTargets,
  criticalChance,
  criticalMultiplier,
  criticalFactorStat,
  superCriticalChanceStat,
  superCriticalMultiplierStat,
  multishotChance,
  multishotMultiplier,
  multishotTargets,
  rapidFireChance,
  rapidFireDuration,
  ultimateWeaponCriticalMultiplier,
} from '../../src/mechanics/effective-paths/damage-stats'
import fixtures from '../../fixtures/mechanics/effective-paths-damage-stats.fixtures.json'

/**
 * The `EPD_*` damage stats, against the live sheet.
 *
 * Twenty-four randomised states each, evaluated by the real functions. These
 * multiply together into `BulletDmgMulti`, so a single wrong one is invisible
 * in the total — which is why each is checked on its own rather than through
 * the composition.
 */

const close = (ours: number, sheet: number, digits = 12) =>
  expect(Math.abs(ours / sheet - 1)).toBeLessThan(10 ** -digits)

it('static critical helpers preserve lab/substat/enhancement and mastery grouping', () => {
  expect(criticalFactorStat({ base: 10, labLevel: 99, substat: 2,
    enhancementMultiplier: 5, relicPct: .18, vaultPct: .1 }))
    .toBe((10 * (1 + .03 * 99) + 2) * 5 * 1.18 * 1.1)
  expect(superCriticalChanceStat({ base: .2, labLevel: 20, substat: .03,
    hasCriticalChanceMastery: true, masteryLevel: 9, flatBonus: .01, beingAnnihilator: .04 }))
    .toBe(.01 + .2 + .03 + .02 + .1 + .04)
  expect(superCriticalMultiplierStat({ base: 4, labLevel: 22, substat: 2,
    enhancementMultiplier: 5, relicPct: .1, vaultPct: .2,
    hasCriticalChanceMastery: true, masteryLevel: 9 }))
    .toBe((4 * (1 + .02 * 22) + 2) * 5 * 1.1 * 1.2 * 1.1)
})

describe('EPD_CRIT_CHANCE', () => {
  for (const [index, c] of fixtures.criticalChance.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      expect(criticalChance({
        workshopLevel: c.ws,
        hasCriticalChanceCard: c.hasCard,
        cardLevel: c.cardLevel,
        hasCardMastery: c.hasMastery,
        masteryLevel: c.masteryLevel,
        relicPct: c.relic,
        vaultPct: c.vault,
        substat: c.substat,
      })).toBeCloseTo(c.sheet, 12)
    })
  }

  it('starts at one percent with nothing invested', () => {
    expect(criticalChance({
      workshopLevel: 0,
      hasCriticalChanceCard: false,
      cardLevel: 0,
      hasCardMastery: false,
      masteryLevel: 0,
      relicPct: 0,
      vaultPct: 0,
      substat: 0,
    })).toBeCloseTo(0.01, 12)
  })
})

describe('EPD_CRITICAL and EPD_UWCRITICAL', () => {
  for (const [index, c] of fixtures.critical.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      close(criticalMultiplier({
        criticalChance: c.cc,
        criticalFactor: c.cf,
        superCritChance: c.scc,
        superCritMultiplier: c.scm,
        beingAnnihilator: c.ba,
      }), c.sheet)

      close(ultimateWeaponCriticalMultiplier({
        criticalChance: c.cc,
        criticalFactor: c.cf,
        superCritChance: c.scc,
        superCritMultiplier: c.scm,
      }), c.sheetUw)
    })
  }

  it('caps critical chance at one, and only there', () => {
    const at = (chance: number) => criticalMultiplier({
      criticalChance: chance,
      criticalFactor: 10,
      superCritChance: 0.2,
      superCritMultiplier: 3,
      beingAnnihilator: 0,
    })
    expect(at(1.5)).toBe(at(1))
    expect(at(0.9)).toBeLessThan(at(1))
  })

  it('is worth more with Being Annihilator than without', () => {
    const base = {
      criticalChance: 0.5,
      criticalFactor: 12,
      superCritChance: 0.3,
      superCritMultiplier: 4,
    }
    expect(criticalMultiplier({ ...base, beingAnnihilator: 5 }))
      .toBeGreaterThan(criticalMultiplier({ ...base, beingAnnihilator: 0 }))
  })

  it('does not clamp the ultimate weapon multiplier', () => {
    // A different shape entirely — two independent bonuses, no expectation.
    const over = ultimateWeaponCriticalMultiplier({
      criticalChance: 1.5, criticalFactor: 10, superCritChance: 0.2, superCritMultiplier: 3,
    })
    const at = ultimateWeaponCriticalMultiplier({
      criticalChance: 1, criticalFactor: 10, superCritChance: 0.2, superCritMultiplier: 3,
    })
    expect(over).toBeGreaterThan(at)
  })
})

describe('EPD_MSC, EPD_MST and EPD_MULTISHOT', () => {
  for (const [index, m] of fixtures.multishot.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      expect(multishotChance(m.wsC, m.subC, m.vault)).toBeCloseTo(m.sheetChance, 12)
      expect(multishotTargets(m.wsT, m.subT)).toBe(m.sheetTargets)
      close(multishotMultiplier(m.sheetChance, m.sheetTargets), m.sheetMultiplier)
    })
  }

  it('floors a partial target rather than rounding it', () => {
    // Half a target does not exist, and rounding would invent one.
    expect(multishotTargets(0, 1.9)).toBe(3)
    expect(multishotTargets(0, 0.9)).toBe(2)
  })
})

describe('EPD_BSC, EPD_BST and EPD_BOUNCESHOT', () => {
  for (const [index, b] of fixtures.bounce.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      expect(bounceShotChance(b.wsC, b.subC, b.vault)).toBeCloseTo(b.sheetChance, 12)
      expect(bounceShotTargets(b.wsT, b.perk, b.subT)).toBe(b.sheetTargets)
      close(bounceShotMultiplier(b.sheetChance, b.sheetTargets, b.astral), b.sheetMultiplier)
    })
  }

  it('sums the bounces rather than multiplying them', () => {
    // Each bounce needs the one before it to land, so bounce k is chance^k.
    expect(bounceShotMultiplier(0.5, 3, 0)).toBeCloseTo(1 + 0.5 + 0.25 + 0.125, 12)
  })

  it('takes no vault bonus on targets, only on chance', () => {
    // The sheet's own `EPD_BST` carries a dead `VaultBonus` binding; `LET` is
    // lazy so it never evaluates, and the answer is right without it.
    expect(bounceShotTargets(4, 1, 2.5)).toBe(1 + 4 + 1 + 2)
  })
})

// These dated captures still cover the unchanged chance/duration functions.
// Current EPD_RAPIDFIRE requires FPS/LSS and is covered by current-workbook.test.
describe('EPD_RFC and EPD_RFD', () => {
  for (const [index, r] of fixtures.rapidFire.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      expect(rapidFireChance(r.wsC, r.subC, r.vault)).toBeCloseTo(r.sheetChance, 12)
      expect(rapidFireDuration(r.wsT, r.subT)).toBeCloseTo(r.sheetDuration, 12)
    })
  }

  it('preserves the old multiplier capture as dated source evidence', () => {
    expect(fixtures.rapidFire.every(r => Number.isFinite(r.sheetMultiplier))).toBe(true)
  })
})
