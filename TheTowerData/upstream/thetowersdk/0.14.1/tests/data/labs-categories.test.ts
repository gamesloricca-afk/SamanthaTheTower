import { describe, expect, it } from 'vitest'
import {
  findLabCategoryForSaveIndex,
  findLabDisplayNameForSaveIndex,
  findLabSlugFromApiName,
} from '../../src/data/labs/categories'

describe('lab-research-site-map', () => {
  it('maps legacy API bot slugs to save indices', () => {
    expect(findLabSlugFromApiName('gold_bot_cooldown')).toMatchObject({
      saveIndex: 104,
      saveSlug: 'golden_bot_cooldown',
    })
    expect(findLabDisplayNameForSaveIndex(104)).toBe('Golden Bot - Cooldown')
  })

  it('maps lab categories when the catalog category is missing', () => {
    expect(findLabCategoryForSaveIndex(131)).toBe('Attack')
    expect(findLabCategoryForSaveIndex(132)).toBe('Attack')
    expect(findLabCategoryForSaveIndex(199)).toBe('Main')
  })

  it('maps shock API slugs to ultimate weapon save indices', () => {
    expect(findLabSlugFromApiName('chain_lightning_shock_chance')).toMatchObject({
      saveIndex: 63,
      saveSlug: 'shock_chance',
    })
    expect(findLabDisplayNameForSaveIndex(63)).toBe('Shock Chance')
  })
})
