import { describe, expect, it } from 'vitest'
import {
  LAB_CATALOG,
  LAB_RESEARCH_ASSET_TABLE,
  LAB_RESEARCH_IMPORT_CATALOG,
  findLabResearchByIndex,
  findLabResearchBySlug,
  findLabResearchCategory,
  isLabUnlockedAt,
} from '../../src/data'

describe('29.1 primary-module labs', () => {
  it('includes the active five-level Card Presets ladder', () => {
    expect(findLabResearchByIndex(40)?.levelMax).toBe(5)
    const levels = LAB_CATALOG.find(row => row.slug === 'card_presets')!.levels
    expect(levels).toHaveLength(5)
    expect(levels[0]).toEqual({ level: 1, duration: '13:53:20', cost: 350000 })
    expect(levels[4]).toEqual({ level: 5, duration: '14d 0h 0m', cost: 35000000000000 })
  })
  it.each([
    [253, 'Cannon'], [254, 'Armor'], [255, 'Generator'], [256, 'Core'],
  ] as const)('resolves save index %i (%s) through every catalog', (index, kind) => {
    const name = `Primary Module Bonus - ${kind}`
    const slug = `primary_module_bonus_${kind.toLowerCase()}`
    expect(findLabResearchByIndex(index)).toMatchObject({
      displayName: name, slug, category: 'Modules', levelMax: 30,
      baseCoinCost: 1e20, baseTime: 1440000, tierUnlock: 23, milestoneUnlock: 15,
    })
    expect(findLabResearchBySlug(slug)?.index).toBe(index)
    const raw = LAB_RESEARCH_ASSET_TABLE as { researchCount: number; researchNames: readonly string[]; researchLevelMax: readonly number[] }
    expect(raw.researchCount).toBe(260)
    expect(raw.researchNames[index]).toBe(name)
    expect(raw.researchLevelMax[index]).toBe(30)
    expect(LAB_RESEARCH_IMPORT_CATALOG.find(row => row.index === index)).toMatchObject({
      displayName: name, slug, category: 'Modules', gameField: `researchLevel${index}`,
    })
    expect(findLabResearchCategory(index, name, null)).toBe('Modules')
    const lab = LAB_CATALOG.find(row => row.slug === slug)!
    expect(lab.levels).toHaveLength(30)
    expect(lab.levels[0]).toEqual({ level: 1, cost: 1e20, duration: '16d 16h 0m' })
    expect(lab.levels[29]).toEqual({ level: 30, cost: 1.278340390625e25, duration: '500d 0h 0m' })
    expect(isLabUnlockedAt(name, 23, 499)).toBe(false)
    expect(isLabUnlockedAt(name, 23, 500)).toBe(true)
    expect(isLabUnlockedAt(name, 22, 10000)).toBe(false)
  })
})
