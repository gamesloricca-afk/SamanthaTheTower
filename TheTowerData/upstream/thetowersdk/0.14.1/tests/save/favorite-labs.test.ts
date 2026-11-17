import { describe, expect, it } from 'vitest'
import { LAB_RESEARCH_BY_INDEX } from '../../src/data/labs/research'
import { readFavoriteLabSlugsFromSaveRoot, saveHasFavoriteLabs } from '../../src/save/labs/favorites'

/** The save stores favourites the way Unity serializes a List<int>. */
const unityList = (values: number[]) => ({ _items: values, _size: values.length })

describe('favorite labs from a save', () => {
  it('resolves research indices to slugs', () => {
    // Index 0 is a real lab, so this also pins that the list is 0-based.
    const first = LAB_RESEARCH_BY_INDEX[0]
    const third = LAB_RESEARCH_BY_INDEX[2]

    const slugs = readFavoriteLabSlugsFromSaveRoot({ favoriteLabs: unityList([0, 2]) })

    expect(slugs).toEqual([first?.slug, third?.slug])
  })

  it('reads a plain array too', () => {
    const slugs = readFavoriteLabSlugsFromSaveRoot({ favoriteLabs: [0] })
    expect(slugs).toEqual([LAB_RESEARCH_BY_INDEX[0]?.slug])
  })

  it('skips an index this catalog does not know instead of inventing a name', () => {
    const slugs = readFavoriteLabSlugsFromSaveRoot({
      favoriteLabs: unityList([0, 99_999]),
    })
    expect(slugs).toEqual([LAB_RESEARCH_BY_INDEX[0]?.slug])
  })

  it('de-duplicates', () => {
    const slugs = readFavoriteLabSlugsFromSaveRoot({ favoriteLabs: unityList([0, 0]) })
    expect(slugs).toHaveLength(1)
  })

  it('returns nothing for a save with no favourites', () => {
    expect(readFavoriteLabSlugsFromSaveRoot({})).toEqual([])
    expect(readFavoriteLabSlugsFromSaveRoot(null)).toEqual([])
  })

  it('distinguishes an empty list from an absent one', () => {
    // An empty list means the player cleared their favourites, and should
    // overwrite; an absent field means this save cannot say, and should not.
    expect(saveHasFavoriteLabs({ favoriteLabs: unityList([]) })).toBe(true)
    expect(saveHasFavoriteLabs({})).toBe(false)
  })
})
