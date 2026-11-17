import { describe, expect, it } from 'vitest'
import { listThemeCatalogRows } from '../../src/save/catalogs/themes'
import { readCollectedThemeNamesFromSaveRoot } from '../../src/save/themes/read'

describe('themes-from-save', () => {
  it('collects unlocked theme names from save unlock arrays', () => {
    const towerRow = listThemeCatalogRows().find(row => row.category === 'tower' && row.name === 'Star')
    expect(towerRow).toBeTruthy()

    const root: Record<string, unknown> = {
      towerUnlocked: Array.from({ length: (towerRow!.catalogIndex + 1) }, (_, index) => index === towerRow!.catalogIndex),
      menuUnlocked: [],
      backgroundUnlocked: [],
      profileBannerUnlocked: [],
      guardianSkinUnlocked: [],
      trackAvailable: [],
    }

    const names = readCollectedThemeNamesFromSaveRoot(root)
    expect(names).toContain('Star')
  })

  it.each([
    ['towerUnlocked', 84, 'Fractal Tower'],
    ['backgroundUnlocked', 57, 'Fairy Forest'],
    ['backgroundUnlocked', 58, 'Steampunk'],
    ['backgroundUnlocked', 59, 'Fractals'],
    ['menuUnlocked', 11, 'Fairy Forest'],
    ['profileBannerUnlocked', 12, 'Fairy Forest'],
  ] as const)('reads %s slot %i as %s', (key, slot, label) => {
    const flags = Array.from({ length: slot + 1 }, (_, index) => index === slot)
    expect(readCollectedThemeNamesFromSaveRoot({ [key]: flags })).toEqual([label])
  })

  it('returns empty list when save has no unlock arrays', () => {
    expect(readCollectedThemeNamesFromSaveRoot({})).toEqual([])
    expect(readCollectedThemeNamesFromSaveRoot(null)).toEqual([])
  })
})
