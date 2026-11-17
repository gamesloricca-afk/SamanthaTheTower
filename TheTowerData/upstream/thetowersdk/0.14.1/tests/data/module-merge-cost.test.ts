import { describe, expect, it } from 'vitest'
import {
  MODULE_MERGE_COST_PER_COMMUNITY_GUIDE,
  MODULE_MERGE_GUIDE_ROW_THAT_AGREES,
  moduleAncestralStarCostInDrawnEpics,
  moduleMergeCostInDrawnEpics,
} from '../../src/data/modules/merge'

/**
 * What a merge actually costs, derived from the recipes rather than transcribed.
 *
 * The point of deriving it: a change to any recipe moves every downstream cost
 * with it. A transcribed table would keep reporting the old number and look
 * fine.
 */

describe('merge cost compounds through the chain', () => {
  it('costs what the recipe chain implies at every grade', () => {
    expect(moduleMergeCostInDrawnEpics('Epic', true)).toBe(2)
    expect(moduleMergeCostInDrawnEpics('Legendary')).toBe(6)
    expect(moduleMergeCostInDrawnEpics('Legendary', true)).toBe(8)
    expect(moduleMergeCostInDrawnEpics('Mythic')).toBe(16)
    expect(moduleMergeCostInDrawnEpics('Mythic', true)).toBe(24)
    expect(moduleMergeCostInDrawnEpics('Ancestral')).toBe(28)
  })

  it('grows monotonically, which a mis-linked chain would break', () => {
    const ladder = [
      moduleMergeCostInDrawnEpics('Epic', true)!,
      moduleMergeCostInDrawnEpics('Legendary')!,
      moduleMergeCostInDrawnEpics('Legendary', true)!,
      moduleMergeCostInDrawnEpics('Mythic')!,
      moduleMergeCostInDrawnEpics('Mythic', true)!,
      moduleMergeCostInDrawnEpics('Ancestral')!,
    ]
    for (const [index, cost] of ladder.entries()) {
      if (index === 0) continue
      expect(cost, `grade ${index} must cost more than grade ${index - 1}`)
        .toBeGreaterThan(ladder[index - 1])
    }
  })

  it('prices an Ancestral star at two drawn epics', () => {
    expect(moduleAncestralStarCostInDrawnEpics()).toBe(2)
    // Five stars on top of reaching Ancestral.
    const maxed = moduleMergeCostInDrawnEpics('Ancestral')! + 5 * moduleAncestralStarCostInDrawnEpics()!
    expect(maxed).toBe(38)
  })

  it('returns null for a grade that is not a merge outcome', () => {
    // Rare and Epic are DRAWN, not merged to; asking their merge cost is a
    // category error and gets a null rather than a plausible 1.
    expect(moduleMergeCostInDrawnEpics('Ancestral', true)).toBeNull()
    expect(moduleMergeCostInDrawnEpics('Nonsense')).toBeNull()
  })
})

describe('the community guide table is kept, and does not reconcile', () => {
  it('agrees on exactly one row', () => {
    /*
     * "Legendary -> Legendary +: 2 duplicates" matches the recipe, whose fodder
     * is one `Epic +` and therefore two copies of the same module. The next row
     * does not: Mythic wants one `Legendary +`, which is eight drawn epics, not
     * four of anything.
     *
     * One row matching and the next not rules out both a unit mismatch and a
     * row shift, which is why this is recorded as unresolved rather than
     * adapted.
     */
    const agreeing = MODULE_MERGE_COST_PER_COMMUNITY_GUIDE
      .find(row => row.step === MODULE_MERGE_GUIDE_ROW_THAT_AGREES)
    expect(agreeing?.duplicates).toBe(2)

    const mythic = MODULE_MERGE_COST_PER_COMMUNITY_GUIDE
      .find(row => row.step === 'Legendary + -> Mythic')
    expect(mythic?.duplicates).toBe(4)
    expect(moduleMergeCostInDrawnEpics('Legendary', true)).not.toBe(mythic?.duplicates)
  })

  it('keeps all six rows verbatim', () => {
    // Adapting them to fit would hide which source said what.
    expect(MODULE_MERGE_COST_PER_COMMUNITY_GUIDE).toHaveLength(6)
    expect(MODULE_MERGE_COST_PER_COMMUNITY_GUIDE.map(row => row.rares))
      .toEqual([0, 36, 36, 108, 180, 180])
  })
})
