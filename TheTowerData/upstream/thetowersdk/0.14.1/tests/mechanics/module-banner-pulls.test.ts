import { describe, expect, it } from 'vitest'
import {
  estimateModuleBannerCost,
  estimateStandardSharePercent,
  MODULE_BANNER_RULES,
  MODULE_COPIES_TO_ANCESTRAL_5,
  moduleBannerEpicWeights,
  moduleBannerPullBreakdown,
  moduleCopiesSpentToReach,
  modulePullsPerEpic,
} from '../../src/mechanics/modules/banner-pulls'
import { MODULE_MAX_COPIES } from '../../src/data/modules/templates'
import { MODULE_PULL_CHANCE_PERCENT } from '../../src/knowledge/compartments/modules'

const sum = (values: Iterable<number>) => [...values].reduce((total, value) => total + value, 0)
const ids = (prefix: string, count: number) => Array.from({ length: count }, (_, index) => `${prefix}${index}`)
const OLD = ids('old', 24)
const NEW = ids('new', 4)

describe('banner odds (CheckBannerForAdjustedOdds)', () => {
  it('reproduces the in-game Gilded Sniper panel: 50% featured, 24 others at 2.08%', () => {
    // Every other epic maxed and no unmaxed non-featured module: nothing moves.
    const weights = moduleBannerEpicWeights({
      pool: [...OLD, 'gilded-sniper'], maxed: new Set(OLD), featured: ['gilded-sniper'], featuredPercent: 50,
    })
    expect(weights.get('gilded-sniper')).toBe(50)
    for (const id of OLD) expect(weights.get(id)).toBeCloseTo(50 / 24, 6)
    expect(sum(weights.values())).toBeCloseTo(100, 9)
  })

  it('moves 0.75x of each maxed module onto the unmaxed ones, keeping the total at 100', () => {
    const weights = moduleBannerEpicWeights({ pool: [...OLD, ...NEW], maxed: new Set(OLD) })
    for (const id of NEW) expect(weights.get(id)).toBeCloseTo(100 / 28 + 0.75 * (100 / 28) * 24 / 4, 6)
    for (const id of OLD) expect(weights.get(id)).toBeCloseTo(0.25 * 100 / 28, 6)
    expect(sum(weights.values())).toBeCloseTo(100, 9)
  })

  it('caps a lone unmaxed module at 50 and returns the overflow to the maxed ones', () => {
    const weights = moduleBannerEpicWeights({ pool: [...OLD, 'new0'], maxed: new Set(OLD) })
    expect(weights.get('new0')).toBe(50)
    expect(sum(weights.values())).toBeCloseTo(100, 9)
  })

  it('leaves odds flat when nothing, or everything, is maxed', () => {
    const pool = [...OLD, ...NEW]
    for (const maxed of [new Set<string>(), new Set(pool)]) {
      const weights = moduleBannerEpicWeights({ pool, maxed })
      for (const id of pool) expect(weights.get(id)).toBeCloseTo(100 / 28, 9)
    }
  })

  it('agrees with the oracle on the epic rate', () => {
    expect(MODULE_BANNER_RULES.epicChancePercent).toBe(MODULE_PULL_CHANCE_PERCENT.Epic)
  })
})

describe('estimateStandardSharePercent', () => {
  it('matches the game rule for 24 maxed epics and 4 targets in a 28-epic pool', () => {
    expect(estimateStandardSharePercent({ epicsInPool: 28, maxedCount: 24, targetCount: 4 }))
      .toBeCloseTo(100 / 28 + 0.75 * (100 / 28) * 24 / 4, 6)
  })

  it('caps a single target at 50% and leaves an unadjusted pool flat', () => {
    expect(estimateStandardSharePercent({ epicsInPool: 25, maxedCount: 24, targetCount: 1 })).toBe(50)
    expect(estimateStandardSharePercent({ epicsInPool: 28, maxedCount: 0, targetCount: 4 })).toBeCloseTo(100 / 28, 9)
  })

  it('refuses counts that describe no pool', () => {
    expect(estimateStandardSharePercent({ epicsInPool: 0, maxedCount: 0, targetCount: 1 })).toBeNull()
    expect(estimateStandardSharePercent({ epicsInPool: 3, maxedCount: 0, targetCount: 4 })).toBeNull()
  })
})

describe('copies a natural epic spends', () => {
  it('needs 18 of itself and 20 of its type for Ancestral 5, as CanBeMerged requires', () => {
    expect(MODULE_COPIES_TO_ANCESTRAL_5).toEqual({ sameModule: 18, sameTypeEpics: 20 })
    expect(MODULE_COPIES_TO_ANCESTRAL_5.sameModule).toBe(MODULE_MAX_COPIES)
  })

  it('walks the ladder rung by rung', () => {
    expect(moduleCopiesSpentToReach(null)).toEqual({ sameModule: 0, sameTypeEpics: 0 })
    expect(moduleCopiesSpentToReach('Epic')).toEqual({ sameModule: 1, sameTypeEpics: 0 })
    expect(moduleCopiesSpentToReach('Legendary +')).toEqual({ sameModule: 4, sameTypeEpics: 4 })
    expect(moduleCopiesSpentToReach('Ancestral')).toEqual({ sameModule: 8, sameTypeEpics: 20 })
    expect(moduleCopiesSpentToReach('Rare')).toBeNull()
  })
})

describe('modulePullsPerEpic and moduleBannerPullBreakdown', () => {
  it('matches a brute-force expectation of min(Geometric, pity)', () => {
    let expected = 0
    for (let k = 0; k < 150; k += 1) expected += 0.975 ** k
    expect(modulePullsPerEpic()).toBeCloseTo(expected, 9)
    expect(modulePullsPerEpic()).toBeCloseTo(39.1, 1)
  })

  it('splits one pull into targets, other epics and non-epics that sum to 100', () => {
    const featured = moduleBannerPullBreakdown({ targetSharesPercent: [50] })
    expect(featured.targetsPercent[0]).toBeCloseTo(1.25, 9)
    expect(featured.otherEpicPercent).toBeCloseTo(1.25, 9)
    expect(featured.nonEpicPercent).toBeCloseTo(97.5, 9)
    const standard = moduleBannerPullBreakdown({ targetSharesPercent: [19.64, 19.64, 19.64, 19.64] })
    expect(sum([...standard.targetsPercent, standard.otherEpicPercent, standard.nonEpicPercent])).toBeCloseTo(100, 9)
  })
})

describe('estimateModuleBannerCost', () => {
  const STANDARD_FOUR = 100 / 28 + 0.75 * (100 / 28) * 24 / 4
  const four = Array.from({ length: 4 }, () => ({ copiesNeeded: 18 }))
  const base = { trials: 400, seed: 29 }

  it('prefers the featured banner when you only want one module', () => {
    const result = estimateModuleBannerCost({ ...base, targets: [{ copiesNeeded: 18 }], featuredSharePercent: 50, standardSharePercent: STANDARD_FOUR })
    expect(result.cheaper).toBe('featured')
  })

  it('prefers waiting for four modules, even holding the standard rate fixed', () => {
    // A fixed standard share is conservative: in game the remaining targets rise
    // as others hit 5 stars (about 1.5x with that modelled; 1.2-1.3x without).
    const result = estimateModuleBannerCost({ ...base, targets: four, featuredSharePercent: 50, standardSharePercent: STANDARD_FOUR })
    expect(result.cheaper).toBe('standard')
    const ratio = result.featured!.gems.mean / result.standard!.gems.mean
    expect(ratio).toBeGreaterThan(1.15)
    expect(ratio).toBeLessThan(1.45)
    expect(result.standard!.gems.mean).toBeGreaterThan(70_000)
    expect(result.standard!.gems.mean).toBeLessThan(105_000)
  })

  it('makes both plans cost the same at the break-even featured share', () => {
    const first = estimateModuleBannerCost({ ...base, targets: four, featuredSharePercent: 50, standardSharePercent: STANDARD_FOUR })
    const breakEven = first.breakEvenFeaturedSharePercent!
    expect(breakEven).toBeGreaterThan(60)
    expect(breakEven).toBeLessThan(90)
    const at = estimateModuleBannerCost({ ...base, seed: 7, targets: four, featuredSharePercent: breakEven, standardSharePercent: STANDARD_FOUR })
    expect(Math.abs(at.featured!.gems.mean / at.standard!.gems.mean - 1)).toBeLessThan(0.06)
  })

  it('moves when a rate moves', () => {
    const at50 = estimateModuleBannerCost({ ...base, targets: four, featuredSharePercent: 50, standardSharePercent: STANDARD_FOUR })
    const at70 = estimateModuleBannerCost({ ...base, targets: four, featuredSharePercent: 70, standardSharePercent: STANDARD_FOUR })
    const slowStandard = estimateModuleBannerCost({ ...base, targets: four, featuredSharePercent: 50, standardSharePercent: 100 / 28 })
    expect(at70.featured!.gems.mean).toBeLessThan(at50.featured!.gems.mean)
    expect(slowStandard.standard!.gems.mean).toBeGreaterThan(at50.standard!.gems.mean * 2)
  })

  it('is deterministic for a seed and says when a plan cannot finish', () => {
    const first = estimateModuleBannerCost({ ...base, targets: four, featuredSharePercent: 50, standardSharePercent: STANDARD_FOUR })
    const second = estimateModuleBannerCost({ ...base, targets: four, featuredSharePercent: 50, standardSharePercent: STANDARD_FOUR })
    expect(first.standard!.gems).toEqual(second.standard!.gems)
    const none = estimateModuleBannerCost({ ...base, targets: four, featuredSharePercent: 0, standardSharePercent: STANDARD_FOUR })
    expect(none.featured).toBeNull()
    expect(none.cheaper).toBe('standard')
  })
})
