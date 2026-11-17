import { describe, expect, it } from 'vitest'
import { getWorkshopCostsByKey, WSP_WORKSHOP_COST_LEVELS } from '../../src/data/workshop/costs'
import {
  ENHANCEMENT_COST_CURVE_GROUPS,
  ENHANCEMENT_COST_STEP_LEVEL,
  ENHANCEMENT_COST_TABLE_OBJECTS,
  ENHANCEMENT_DISTINCT_COST_CURVES,
  ENHANCEMENT_KEYS_SHARING_A_CURVE,
} from '../../src/knowledge/compartments/workshop'

const KEYS = Object.keys(WSP_WORKSHOP_COST_LEVELS)
const curve = (key: string): number[] => getWorkshopCostsByKey(key)!

describe('enhancement cost curves', () => {
  it('covers every enhancement key exactly once', () => {
    expect(ENHANCEMENT_COST_CURVE_GROUPS.flat().sort()).toEqual([...KEYS].sort())
    expect(ENHANCEMENT_COST_CURVE_GROUPS.flat()).toHaveLength(KEYS.length)
  })

  it('has fewer distinct curves than tables, and fewer tables than keys', () => {
    expect(ENHANCEMENT_DISTINCT_COST_CURVES).toBeLessThan(ENHANCEMENT_COST_TABLE_OBJECTS)
    expect(ENHANCEMENT_COST_TABLE_OBJECTS).toBeLessThan(KEYS.length)
    expect(ENHANCEMENT_DISTINCT_COST_CURVES).toBe(ENHANCEMENT_COST_CURVE_GROUPS.length)
  })

  it('makes the eleven-strong group identical at every level, not merely equal in length', () => {
    const biggest = ENHANCEMENT_COST_CURVE_GROUPS[0]!
    expect(biggest).toHaveLength(11)
    const reference = curve(biggest[0]!)
    for (const key of biggest.slice(1)) {
      const other = curve(key)
      expect(other, `${key} length`).toHaveLength(reference.length)
      for (let level = 0; level < reference.length; level += 1) {
        expect(other[level], `${key} at level ${level}`).toBe(reference[level])
      }
    }
  })

  it('keeps every group internally identical and every pair of groups distinct', () => {
    const signatures = ENHANCEMENT_COST_CURVE_GROUPS.map(group => {
      for (const key of group) expect(curve(key)).toEqual(curve(group[0]!))
      return JSON.stringify(curve(group[0]!))
    })
    expect(new Set(signatures).size).toBe(signatures.length)
  })

  it('lists exactly the keys that share a curve with another', () => {
    const shared = KEYS.filter(key =>
      KEYS.some(other => other !== key && JSON.stringify(curve(other)) === JSON.stringify(curve(key))))
    expect([...ENHANCEMENT_KEYS_SHARING_A_CURVE].sort()).toEqual(shared.sort())
    expect(ENHANCEMENT_KEYS_SHARING_A_CURVE.length).toBeGreaterThan(0)
  })

  it('shares tables by reference, so a write would leak across enhancements', () => {
    const byReference = new Map<object, string[]>()
    for (const key of KEYS) {
      const table = WSP_WORKSHOP_COST_LEVELS[key as keyof typeof WSP_WORKSHOP_COST_LEVELS]
      byReference.set(table, [...(byReference.get(table) ?? []), key])
    }
    const aliased = [...byReference.values()].filter(group => group.length > 1)
    expect(aliased.length, 'no aliasing would make the mutation trap wrong').toBeGreaterThan(0)
    for (const table of byReference.keys()) expect(Object.isFrozen(table)).toBe(false)
  })
})

describe('the level-17 step', () => {
  it('is present in every distinct curve at the same level', () => {
    for (const group of ENHANCEMENT_COST_CURVE_GROUPS) {
      const costs = curve(group[0]!)
      const step = ENHANCEMENT_COST_STEP_LEVEL
      const ratio = (level: number): number => costs[level]! / costs[level - 1]!
      expect(ratio(step), `${group[0]} at the step`).toBeGreaterThan(2)
      expect(ratio(step - 1), `${group[0]} before the step`).toBeLessThan(1.5)
      expect(ratio(step + 1), `${group[0]} after the step`).toBeLessThan(ratio(step))
    }
  })

  it('is a step, not the general shape — later levels are far gentler', () => {
    for (const group of ENHANCEMENT_COST_CURVE_GROUPS) {
      const costs = curve(group[0]!)
      if (costs.length <= 60) continue
      const late = costs[50]! / costs[49]!
      expect(late, `${group[0]} at level 50`).toBeLessThan(1.5)
    }
  })
})
