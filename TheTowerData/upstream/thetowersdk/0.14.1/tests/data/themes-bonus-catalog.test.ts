import { describe, expect, it } from 'vitest'

import {
  listThemeBonusCatalogEntries,
  THEME_CATEGORY_BONUS,
  THEMES,
} from '../../src/data/themes/bonus-catalog'
import { THEME_CATEGORY_DEFINITIONS } from '../../src/data/themes/catalog'

/**
 * The catalog used to carry a `bonus` string on every item — 169 literals
 * encoding 7 numbers. These tests pin the derivation to what those literals
 * said, so removing them cannot have moved a published value.
 */

/** Counts as they stood when the per-item literals were removed. */
const EXPECTED_COUNTS: Record<string, number> = {
  TOWER: 54,
  BACKGROUND: 53,
  MILESTONE: 21,
  SONGS: 3,
  GUARDIAN: 19,
  MENU: 9,
  PROFILE_BANNER: 10,
}

describe('theme bonus catalog', () => {
  it('still lists every theme it did before', () => {
    for (const [category, count] of Object.entries(EXPECTED_COUNTS)) {
      expect(THEMES[category as keyof typeof THEMES], category).toHaveLength(count)
    }
    const total = Object.values(EXPECTED_COUNTS).reduce((sum, n) => sum + n, 0)
    expect(listThemeBonusCatalogEntries()).toHaveLength(total)
  })

  it('derives the same bonus each item used to state', () => {
    // Every entry in a category carried exactly this string.
    expect(THEME_CATEGORY_BONUS).toEqual({
      TOWER: '+0.4%',
      BACKGROUND: '+0.8%',
      MILESTONE: '+0.4%',
      SONGS: '+0.6%',
      GUARDIAN: '+0.6%',
      MENU: '+0.6%',
      PROFILE_BANNER: '+0.6%',
    })

    for (const entry of listThemeBonusCatalogEntries()) {
      expect(entry.bonus).toBe(THEME_CATEGORY_BONUS[entry.category])
    }
  })

  it('agrees with the category coefficients used by the coin formula', () => {
    // Two representations of one rate. They overlap on four categories, and a
    // disagreement means the formula and the catalog would pay differently.
    const pairs: [keyof typeof THEME_CATEGORY_BONUS, string][] = [
      ['TOWER', 'tower'],
      ['BACKGROUND', 'background'],
      ['MENU', 'menu'],
      ['GUARDIAN', 'guardian'],
    ]

    for (const [catalogKey, definitionKey] of pairs) {
      const definition = THEME_CATEGORY_DEFINITIONS.find(entry => entry.key === definitionKey)
      expect(definition, definitionKey).toBeDefined()
      expect(THEME_CATEGORY_BONUS[catalogKey], catalogKey).toBe(
        definition!.passiveCoinBonusPerOwnedDisplay.replace(/^/, '+'),
      )
    }
  })

  it('gives every theme a name', () => {
    const unnamed = listThemeBonusCatalogEntries().filter(entry => !entry.name.trim())
    expect(unnamed).toEqual([])
  })
})
