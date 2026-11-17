import { describe, expect, it } from 'vitest'
import {
  findModuleMergeRecipe,
  MODULE_MAX_ANCESTRAL_STARS,
  MODULE_MERGE_CEILING_BY_DRAWN_RARITY,
  MODULE_MERGE_RECIPES,
} from '../../src/data/modules/merge'
import { MODULE_RARITIES, rarityFromSaveValue, saveValueForRarity } from '../../src/data/modules/levels'

/**
 * The merge chart, and the save enum offset.
 *
 * Both of these exist because the same mistake kept being made from prose: that
 * merging consumes some abstract "material" (it consumes whole modules), and
 * that a save enum value indexes the rarity list (it does not — it is 1-based
 * with a None at 0).
 */

describe('module merge recipes', () => {
  it('describes one step for every mergeable base, and no duplicates', () => {
    const keys = MODULE_MERGE_RECIPES.map(recipe => `${recipe.baseRarity}${recipe.basePlus ? ' +' : ''}`)
    expect(new Set(keys).size, `duplicate base in ${JSON.stringify(keys)}`).toBe(keys.length)

    // Common is absent on purpose: it cannot be merged at all.
    expect(keys).not.toContain('Common')
  })

  it('requires unique lineage from Legendary + upward, and not below', () => {
    /*
     * This is the rule that makes a Rare stop at Legendary +. If the uniqueOnly
     * boundary ever moves, the merge ceiling below is wrong too.
     */
    for (const recipe of MODULE_MERGE_RECIPES) {
      const isHighTier = ['Mythic', 'Ancestral'].includes(recipe.resultRarity)
        || (recipe.baseRarity === 'Legendary' && recipe.basePlus)
      expect(recipe.uniqueOnly, `${recipe.baseRarity}${recipe.basePlus ? ' +' : ''} uniqueOnly`)
        .toBe(isHighTier)
    }
  })

  it('consumes whole modules — every step names a fodder rarity and a count', () => {
    for (const recipe of MODULE_MERGE_RECIPES) {
      expect(recipe.fodderCount, `${recipe.baseRarity} fodder count`).toBeGreaterThan(0)
      expect(MODULE_RARITIES).toContain(recipe.fodderRarity as never)
      expect(['template', 'type']).toContain(recipe.matchMode)
    }
  })

  it('needs the same module for Mythic + → Ancestral, as the game does', () => {
    // Transcribed from the merge simulator as `type`. v29.0.0
    
    expect(findModuleMergeRecipe('Mythic', true)).toMatchObject({
      fodderCount: 2,
      fodderRarity: 'Epic',
      fodderPlus: true,
      matchMode: 'template',
    })
  })

  it('adds stars only at Ancestral, and only up to five', () => {
    const starSteps = MODULE_MERGE_RECIPES.filter(recipe => recipe.addsStar)
    expect(starSteps).toHaveLength(1)
    expect(starSteps[0]).toMatchObject({
      baseRarity: 'Ancestral',
      fodderRarity: 'Epic',
      fodderPlus: true,
      matchMode: 'template',
    })
    expect(MODULE_MAX_ANCESTRAL_STARS).toBe(5)
  })

  it('agrees with the merge ceilings the wiki states', () => {
    expect(MODULE_MERGE_CEILING_BY_DRAWN_RARITY.Common).toBe('Common')
    expect(MODULE_MERGE_CEILING_BY_DRAWN_RARITY.Rare).toBe('Legendary +')
    expect(MODULE_MERGE_CEILING_BY_DRAWN_RARITY.Epic).toBe('Ancestral 5')

    // A Common has no recipe at all, which is what "cannot be merged" means.
    expect(findModuleMergeRecipe('Common', false)).toBeNull()
    expect(findModuleMergeRecipe('Rare', false)).not.toBeNull()
  })
})

describe('the save rarity enum is 1-based with None at 0', () => {
  it('round-trips every rarity through its save value', () => {
    for (const rarity of MODULE_RARITIES) {
      const value = saveValueForRarity(rarity)
      expect(value, `${rarity} has a save value`).not.toBeNull()
      expect(rarityFromSaveValue(value), `${rarity} round-trips`).toBe(rarity)
    }
  })

  it('does not treat the value as an index', () => {
    // The whole point: Common is 1, not 0, and MODULE_RARITIES[1] is Rare.
    expect(saveValueForRarity('Common')).toBe(1)
    expect(MODULE_RARITIES[1]).toBe('Rare')
    expect(rarityFromSaveValue(1)).toBe('Common')

    // And the top of the range is reachable rather than falling off the end.
    expect(saveValueForRarity('Ancestral 5')).toBe(15)
    expect(rarityFromSaveValue(15)).toBe('Ancestral 5')
  })

  it('treats 0 and out-of-range values as absent rather than as a rarity', () => {
    expect(rarityFromSaveValue(0)).toBeNull()
    expect(rarityFromSaveValue(16)).toBeNull()
    expect(rarityFromSaveValue(-1)).toBeNull()
    expect(rarityFromSaveValue(undefined)).toBeNull()
  })

  it('accepts the save enum spelling as well as the display label', () => {
    // The enum writes RarePlus and Ancestral5; both must resolve.
    expect(saveValueForRarity('RarePlus')).toBe(saveValueForRarity('Rare +'))
    expect(saveValueForRarity('Ancestral5')).toBe(saveValueForRarity('Ancestral 5'))
  })
})
