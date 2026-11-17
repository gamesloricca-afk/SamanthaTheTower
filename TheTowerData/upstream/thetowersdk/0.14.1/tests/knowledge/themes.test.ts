import { describe, expect, it } from 'vitest'
import { listThemeBonusCatalogEntries, THEME_CATEGORY_BONUS, THEMES } from '../../src/data/themes/bonus-catalog'
import { computeThemePassiveCoinBonus, THEME_CATEGORY_DEFINITIONS } from '../../src/data/themes/catalog'
import {
  THEME_AMBIGUOUS_NAMES,
  THEME_CATALOG_TOTAL,
  THEME_FORMULA_CATEGORIES,
  THEME_GROUP_SIZE,
  THEME_GROUPS_UNRECONCILED,
  THEME_TOWER_QUANTITY_SHORTFALL_POINTS,
  THEME_UNRECONCILED_BONUS_POINTS,
} from '../../src/knowledge/compartments/themes'

describe('theme catalog shape', () => {
  it('totals the groups without double counting', () => {
    expect(THEME_CATALOG_TOTAL)
      .toBe(Object.values(THEMES).reduce((sum, items) => sum + items.length, 0))
    expect(THEME_CATALOG_TOTAL).toBe(listThemeBonusCatalogEntries().length)
  })

  it('prices more groups than the coin formula has terms for', () => {
    expect(Object.keys(THEME_GROUP_SIZE).length).toBeGreaterThan(THEME_FORMULA_CATEGORIES.length)
  })

  it('agrees with the coin formula on every overlapping rate', () => {
    for (const category of THEME_CATEGORY_DEFINITIONS) {
      const group = category.key.toUpperCase() as keyof typeof THEME_CATEGORY_BONUS
      expect(THEME_CATEGORY_BONUS[group], category.key)
        .toBe(`+${category.passiveCoinBonusPerOwnedPercent}%`)
    }
  })
})

describe('milestone themes count as tower', () => {
  it('shares no name with the tower group, so the counts must be added', () => {
    const tower = new Set(THEMES.TOWER.map(item => item.name))
    const overlap = THEMES.MILESTONE.filter(item => tower.has(item.name))
    expect(overlap, 'an overlap would mean adding the counts double-counts').toEqual([])
  })

  it('quantifies what passing the tower group alone loses', () => {
    const towerRate = THEME_CATEGORY_DEFINITIONS.find(c => c.key === 'tower')!
      .passiveCoinBonusPerOwnedPercent
    expect(THEME_TOWER_QUANTITY_SHORTFALL_POINTS)
      .toBe(THEME_GROUP_SIZE.MILESTONE! * towerRate)
    // And that the loss is real in the formula, not just arithmetic on paper.
    const withMilestones = computeThemePassiveCoinBonus({
      tower: THEME_GROUP_SIZE.TOWER! + THEME_GROUP_SIZE.MILESTONE!,
    })
    const without = computeThemePassiveCoinBonus({ tower: THEME_GROUP_SIZE.TOWER! })
    expect((withMilestones - without) * 100)
      .toBeCloseTo(THEME_TOWER_QUANTITY_SHORTFALL_POINTS, 6)
  })
})

describe('theme names are not unique', () => {
  it('finds the repeats the catalog actually contains', () => {
    const counts = new Map<string, number>()
    for (const entry of listThemeBonusCatalogEntries()) {
      counts.set(entry.name, (counts.get(entry.name) ?? 0) + 1)
    }
    const repeated = [...counts.entries()].filter(([, n]) => n > 1).map(([name]) => name).sort()
    expect(THEME_AMBIGUOUS_NAMES).toEqual(repeated)
    expect(THEME_AMBIGUOUS_NAMES.length).toBeGreaterThan(0)
  })

  it('gives a repeated name two different rates, which is why name-only lookup is wrong', () => {
    const entries = listThemeBonusCatalogEntries()
    const differing = THEME_AMBIGUOUS_NAMES.filter(name => {
      const rates = new Set(entries.filter(e => e.name === name).map(e => e.bonus))
      return rates.size > 1
    })
    expect(differing.length, 'at least one repeat must be mispriced by a name-only lookup')
      .toBeGreaterThan(0)
  })
})

describe('the unreconciled groups', () => {
  it('names the groups that are priced but have no formula term', () => {
    expect(THEME_GROUPS_UNRECONCILED.slice().sort()).toEqual(['PROFILE_BANNER', 'SONGS'])
  })

  it('has no coin-formula term for any of them', () => {
    for (const group of THEME_GROUPS_UNRECONCILED) {
      expect(THEME_FORMULA_CATEGORIES).not.toContain(group.toLowerCase())
      const before = computeThemePassiveCoinBonus({})
      const after = computeThemePassiveCoinBonus(
        { [group.toLowerCase()]: 10 } as Record<string, number>,
      )
      expect(after, `${group} should not move the formula`).toBe(before)
    }
  })

  it('sizes the disagreement rather than leaving it vague', () => {
    const expected = THEME_GROUPS_UNRECONCILED.reduce((sum, group) => {
      const rate = Number.parseFloat(
        THEME_CATEGORY_BONUS[group as keyof typeof THEME_CATEGORY_BONUS].replace(/[+%]/g, ''),
      )
      return sum + rate * THEME_GROUP_SIZE[group]!
    }, 0)
    expect(THEME_UNRECONCILED_BONUS_POINTS).toBeCloseTo(expected, 6)
    expect(THEME_UNRECONCILED_BONUS_POINTS).toBeGreaterThan(0)
  })
})
