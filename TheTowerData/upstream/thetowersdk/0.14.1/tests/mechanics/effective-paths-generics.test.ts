import { describe, expect, it } from 'vitest'
import {
  assistSubstatCap,
  isPastLevelStop,
  moduleBonus,
  moduleLevelLimit,
  standardPerksBonusScale,
} from '../../src/mechanics/effective-paths/generics'
import { effectiveArmor } from '../../src/mechanics/effective-paths/hp'
import fixtures from '../../fixtures/mechanics/effective-paths-generics.fixtures.json'

/**
 * The `EPG_*` helpers, against the live sheet.
 *
 * These open nearly every column of the damage and economy tabs, so an error
 * here would land everywhere at once and agree with itself everywhere it
 * landed. Each fixture row is the real function's answer.
 */

describe('EPG_ASSIST_SUB_CAP', () => {
  for (const [index, c] of fixtures.assistSubCap.entries()) {
    it(`matches the sheet on case ${index}`, () => {
      expect(assistSubstatCap(c.hasAssist, c.stone, c.lab)).toBeCloseTo(c.sheet, 12)
    })
  }

  it('is zero without an assist module, not the bare scale', () => {
    // The trap: 0.01 would look like a plausible "one point of capacity".
    expect(assistSubstatCap(false, 45, 20)).toBe(0)
    expect(assistSubstatCap(true, 0, 0)).toBeCloseTo(0.01, 12)
  })

  it('counts stone and lab capacity the same way', () => {
    expect(assistSubstatCap(true, 30, 10)).toBe(assistSubstatCap(true, 10, 30))
  })
})

describe('EPG_MODULE_BONUS', () => {
  for (const [index, b] of fixtures.moduleBonus.entries()) {
    it(`matches the sheet on case ${index}`, () => {
      const ours = moduleBonus({
        primaryBonus: b.prim,
        hasAssist: b.hasAssist,
        assistBonus: b.ass,
        stoneBonusCap: b.stone,
        labBonusCap: b.lab,
      })
      expect(Math.abs(ours / b.sheet - 1)).toBeLessThan(1e-12)
    })
  }

  it('is the same function as EPH_ARMOR', () => {
    // The sheet has both; they must not be allowed to drift apart.
    for (const b of fixtures.moduleBonus) {
      expect(moduleBonus({
        primaryBonus: b.prim,
        hasAssist: b.hasAssist,
        assistBonus: b.ass,
        stoneBonusCap: b.stone,
        labBonusCap: b.lab,
      })).toBe(effectiveArmor({
        primaryBonus: b.prim,
        hasAssist: b.hasAssist,
        assistBonus: b.ass,
        stoneBonusCap: b.stone,
        labBonusCap: b.lab,
      }))
    }
  })
})

describe('EPG_SPB', () => {
  for (const c of fixtures.standardPerksBonus) {
    it(`matches the sheet at level ${c.level}`, () => {
      expect(standardPerksBonusScale(c.level)).toBeCloseTo(c.sheet, 12)
    })
  }
})

describe('EPG_MODULE_LEVEL_LIMIT', () => {
  for (const c of fixtures.moduleLevelLimit) {
    it(`reads ${JSON.stringify(c.text)} as ${c.sheet}`, () => {
      expect(moduleLevelLimit(c.text)).toBe(c.sheet)
    })
  }

  it('takes only the first word, as the sheet does', () => {
    // "160 (locked)" is 160 on the sheet, not a parse failure.
    expect(moduleLevelLimit('160 (locked)')).toBe(160)
    expect(moduleLevelLimit(null)).toBe(0)
  })
})

describe('EPG_LEVEL_CHECK', () => {
  it('stops at the target when one is set, and the maximum when not', () => {
    expect(isPastLevelStop(30, 30, 100)).toBe(false)
    expect(isPastLevelStop(31, 30, 100)).toBe(true)
    expect(isPastLevelStop(100, null, 100)).toBe(false)
    expect(isPastLevelStop(101, null, 100)).toBe(true)
  })

  it('lets a target above the maximum win, as the sheet does', () => {
    // `IF(LEN(target), target, max)` — the sheet does not clamp it.
    expect(isPastLevelStop(150, 200, 100)).toBe(false)
  })
})
