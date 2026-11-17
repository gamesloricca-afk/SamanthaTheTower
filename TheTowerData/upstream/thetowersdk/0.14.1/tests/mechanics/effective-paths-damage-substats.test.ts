import { describe, expect, it } from 'vitest'
import {
  assistCapacities,
  combinedSubstat,
} from '../../src/mechanics/effective-paths/damage-substats'
import { assistSubstatCap } from '../../src/mechanics/effective-paths/generics'
import fixtures from '../../fixtures/mechanics/effective-paths-damage-substats.fixtures.json'
import { bulletsPerSecond } from '../../src/mechanics/effective-paths/firing'
import currentWorkbook from '../../fixtures/mechanics/effective-paths-v5.11.08.10.json'

/**
 * How the damage tab reads a substat, and bullets per second.
 *
 * The combined-substat fixture is the exact expression every damage column
 * opens with, evaluated by the sheet — so it checks the shape thirty-odd
 * columns depend on, not just this one function.
 */

const close = (ours: number, sheet: number, digits = 12) =>
  expect(Math.abs(ours / sheet - 1)).toBeLessThan(10 ** -digits)

describe('BULLET_PER_SECOND', () => {
  for (const c of currentWorkbook.bulletsPerSecond) {
    it(`matches the sheet at attack speed ${c.attackSpeed}`, () => {
      expect(bulletsPerSecond(c.attackSpeed)).toBeCloseTo(c.sheet, 12)
    })
  }

  it('retains the historical polynomial capture separately from current runtime expectations', () => {
    expect(fixtures.bulletsPerSecond[0]).toEqual({ attackSpeed: 35.0826, sheet: 326.37579220167845 })
    expect(bulletsPerSecond(0)).toBe(0)
  })
})

describe('the combined substat', () => {
  for (const [index, c] of fixtures.combinedSubstat.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      const capacity = assistSubstatCap(c.has, c.stone, c.lab)
      close(combinedSubstat({ primary: c.primary, assist: c.assist }, capacity), c.sheet)
    })
  }

  it('scales the assist half only', () => {
    // Scaling the primary too would be invisible in any total, and wrong
    // everywhere. The capacity multiplies one term, never both.
    const capacity = assistSubstatCap(true, 45, 20)
    expect(combinedSubstat({ primary: 3, assist: 0 }, capacity)).toBe(3)
    expect(combinedSubstat({ primary: 0, assist: 3 }, capacity)).toBeCloseTo(3 * capacity, 12)
  })

  it('drops the assist half entirely with no assist module', () => {
    const capacity = assistSubstatCap(false, 45, 20)
    expect(combinedSubstat({ primary: 3, assist: 99 }, capacity)).toBe(3)
  })
})

describe('the four assist capacities', () => {
  it('keeps each category on its own stone and lab levels', () => {
    const caps = assistCapacities({
      cannon: { hasAssist: true, stoneCap: 40, labCap: 10 },
      armor: { hasAssist: true, stoneCap: 20, labCap: 5 },
      core: { hasAssist: false, stoneCap: 60, labCap: 30 },
      generator: { hasAssist: true, stoneCap: 0, labCap: 0 },
    })
    expect(caps.cannon).toBeCloseTo(0.51, 12)
    expect(caps.armor).toBeCloseTo(0.26, 12)
    // No assist module in that slot means no capacity at all.
    expect(caps.core).toBe(0)
    expect(caps.generator).toBeCloseTo(0.01, 12)
  })
})
