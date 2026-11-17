import { describe, expect, it } from 'vitest'
import { GAME_KNOWLEDGE } from '../../src/knowledge'
import {
  ASSIST_HARD_CAPS,
  ASSIST_STONE_COST_ALL_TYPES,
  ASSIST_STONE_COST_BY_PURCHASE,
  ASSIST_STONE_COST_PER_TYPE,
  ASSIST_STONE_COST_UNLOCK_AND_UNIQUE_ALL_TYPES,
  ASSIST_STONE_COST_UNLOCK_AND_UNIQUE_PER_TYPE,
  MODULE_RARITY_MAX_LEVEL,
} from '../../src/knowledge/compartments/modules'
import { ABSOLUTE_MAX_MODULE_LEVEL, MODULE_RARITY_LEVEL_CAPS } from '../../src/data/modules/levels'
import { MODULE_REROLL_COSTS_BY_LOCKED_SUBSTATS } from '../../src/data/modules/costs'

/**
 * The assist and module-economy claims, held to their own parts.
 *
 * These were the last five bare nodes in the compartment. Most of what they
 * said was already true and simply unrecorded; the checks worth having are the
 * ones where two tables have to agree, because those are what drift.
 */

const modules = GAME_KNOWLEDGE.compartments.find(c => c.id === 'modules')!
const claim = (id: string, predicate: string) =>
  modules.nodes.find(n => n.id === id)?.assertions?.find(a => a.predicate === predicate)?.value

describe('the module compartment is fully asserted', () => {
  it('leaves no node without a claim', () => {
    expect(modules.nodes.filter(n => !(n.assertions?.length)).map(n => n.id)).toEqual([])
  })
})

describe('assist stone costs reconcile', () => {
  it('the per-type total is the sum of its four purchases', () => {
    const summed = Object.values(ASSIST_STONE_COST_BY_PURCHASE).reduce((sum, cost) => sum + cost, 0)
    expect(summed).toBe(ASSIST_STONE_COST_PER_TYPE)
    expect(claim('module.economy', 'assistStonesPerType')).toBe(summed)
  })

  it('the all-types total is the per-type total across the four module types', () => {
    expect(ASSIST_STONE_COST_PER_TYPE * 4).toBe(ASSIST_STONE_COST_ALL_TYPES)
    expect(claim('module.economy', 'assistStonesAllTypes')).toBe(ASSIST_STONE_COST_ALL_TYPES)
  })

  it('the unlock-plus-unique figure is the two ladders it names', () => {
    const unlockAndUnique = ASSIST_STONE_COST_BY_PURCHASE.slotUnlock
      + ASSIST_STONE_COST_BY_PURCHASE.uniqueEffectLadder
    expect(unlockAndUnique).toBe(ASSIST_STONE_COST_UNLOCK_AND_UNIQUE_PER_TYPE)
    expect(unlockAndUnique * 4).toBe(ASSIST_STONE_COST_UNLOCK_AND_UNIQUE_ALL_TYPES)
  })

  it('records the slot cost the assist node quotes', () => {
    expect(claim('assistModule', 'slotStoneCost')).toBe(ASSIST_STONE_COST_BY_PURCHASE.slotUnlock)
  })
})

describe('the reroll table is read by price, not by length', () => {
  it('has a trailing zero that is padding rather than a free reroll', () => {
    const costs = MODULE_REROLL_COSTS_BY_LOCKED_SUBSTATS
    expect(costs[costs.length - 1]).toBe(0)
    expect(costs.slice(0, -1).every(cost => cost > 0)).toBe(true)
  })

  it('asserts the priced tiers separately from the table length', () => {
    const priced = MODULE_REROLL_COSTS_BY_LOCKED_SUBSTATS.filter(cost => cost > 0).length
    expect(claim('module.economy', 'pricedRerollTiers')).toBe(priced)
    expect(claim('module.economy', 'rerollCostTableLength'))
      .toBe(MODULE_REROLL_COSTS_BY_LOCKED_SUBSTATS.length)
    expect(priced).not.toBe(MODULE_REROLL_COSTS_BY_LOCKED_SUBSTATS.length)
  })

  it('rises monotonically, so a cheaper deeper lock is a defect', () => {
    const priced = MODULE_REROLL_COSTS_BY_LOCKED_SUBSTATS.filter(cost => cost > 0)
    for (let i = 1; i < priced.length; i += 1) expect(priced[i]).toBeGreaterThan(priced[i - 1])
  })
})

describe('the two rarity-cap tables agree on values but not on keys', () => {
  /**
   * Whitespace only. The `+` is SEMANTIC here and must survive.
   *
   * The enhancement join in the workshop compartment normalises to
   * alphanumerics, and doing the same thing here collapses `Rare+` onto `Rare`
   * — two different rungs with caps of 40 and 30. The first version of this
   * test did exactly that and reported `Rare: compartment 30, shipped 40`,
   * which looks like a data conflict and is a broken join.
   *
   * Two tables, two different correct normalisations. Reusing one join key
   * because it worked elsewhere is how a tier quietly disappears.
   */
  const normalise = (rarity: string) => rarity.toLowerCase().replace(/\s+/g, '')

  it('disagrees on four keys, which is why a raw join must not be used', () => {
    const shipped = new Set(Object.keys(MODULE_RARITY_LEVEL_CAPS))
    const rawMisses = Object.keys(MODULE_RARITY_MAX_LEVEL).filter(key => !shipped.has(key))
    expect(rawMisses).toEqual(['Rare+', 'Epic+', 'Legendary+', 'Mythic+'])
  })

  it('agrees on every cap once the key is normalised', () => {
    const shipped = new Map(
      Object.entries(MODULE_RARITY_LEVEL_CAPS).map(([key, cap]) => [normalise(key), cap]),
    )
    const problems: string[] = []
    for (const [rarity, cap] of Object.entries(MODULE_RARITY_MAX_LEVEL)) {
      const other = shipped.get(normalise(rarity))
      if (other === undefined) problems.push(`${rarity} missing from the shipped caps`)
      else if (other !== cap) problems.push(`${rarity}: compartment ${cap}, shipped ${other}`)
    }
    expect(problems, problems.join('\n  ')).toEqual([])
    expect(shipped.size).toBe(Object.keys(MODULE_RARITY_MAX_LEVEL).length)
  })

  it('tops out where the shipped absolute maximum says', () => {
    expect(Math.max(...Object.values(MODULE_RARITY_MAX_LEVEL))).toBe(ABSOLUTE_MAX_MODULE_LEVEL)
    expect(claim('module.economy', 'maxLevelAtTopRarity')).toBe(ABSOLUTE_MAX_MODULE_LEVEL)
  })
})

describe('assist hard caps are data, not prose', () => {
  it('records every cap the assist node lists', () => {
    expect(claim('assistModule', 'hardCapCount')).toBe(Object.keys(ASSIST_HARD_CAPS).length)
    expect(Object.values(ASSIST_HARD_CAPS).every(cap => cap > 0)).toBe(true)
  })

  it('is reachable from the public SDK, since a planner must respect these', () => {
    expect(ASSIST_HARD_CAPS.defensePercent).toBe(98)
    expect(ASSIST_HARD_CAPS.deathDefyPercent).toBe(40)
  })
})
