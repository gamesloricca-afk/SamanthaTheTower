import { describe, expect, it } from 'vitest'
import {
  DAILY_MISSION_TIER_REWARDS,
  DAILY_MISSION_WEEKLY_REWARDS,
  DAILY_MISSION_WEEKLY_TOTAL_BY_REWARD,
} from '../../src/data/daily-missions/data'
import { MAX_CAMPAIGN_TIER } from '../../src/data/tiers/campaign'
import {
  DAILY_MISSION_COIN_STRING_FORMATS,
  DAILY_MISSION_GEMS_PER_MISSION,
  DAILY_MISSION_REROLL_GEM_COST,
  DAILY_MISSION_TIER_COUNT,
  DAILY_MISSION_TIERS_BEYOND_WIKI,
  DAILY_MISSION_TIERS_ON_WIKI,
  DAILY_MISSION_TIERS_WITHOUT_SHARDS,
  DAILY_MISSION_WEEKLY_THRESHOLDS,
} from '../../src/knowledge/compartments/daily-missions'

// The wiki's own totals row, transcribed once so the cumulative claim is
// checked against the source that settles it rather than against our own sum.
const WIKI_TOTALS = { coins: 'x64', gems: 185, medals: 135, stones: 45, tokens: 35 } as const

describe('daily mission tier rewards', () => {
  it('has one row per campaign tier', () => {
    expect(DAILY_MISSION_TIER_COUNT).toBe(MAX_CAMPAIGN_TIER)
    expect(DAILY_MISSION_TIER_REWARDS.map(r => r.tier))
      .toEqual(Array.from({ length: MAX_CAMPAIGN_TIER }, (_, i) => i + 1))
  })

  it('names the rows that go beyond the wiki table', () => {
    expect(DAILY_MISSION_TIERS_BEYOND_WIKI).toEqual([22, 23, 24])
    expect(DAILY_MISSION_TIERS_ON_WIKI).toBeLessThan(DAILY_MISSION_TIER_COUNT)
  })

  it('has exactly one tier whose shard cell is not a number', () => {
    expect(DAILY_MISSION_TIERS_WITHOUT_SHARDS).toEqual([1])
    expect(Number(DAILY_MISSION_TIER_REWARDS[0]!.shards)).toBeNaN()
  })

  it('carries coin strings in four shapes, three of which Number() rejects', () => {
    const shapes = new Set(DAILY_MISSION_TIER_REWARDS.map(row => {
      if (/^\d+$/.test(row.coins)) return 'plain'
      if (/^[\d,]+$/.test(row.coins)) return 'comma'
      if (/^\d+\.\d+ (Mil|Bil)$/.test(row.coins)) return 'decimal-unit'
      if (/^\d+ (Mil|Bil)$/.test(row.coins)) return 'int-unit'
      return 'other'
    }))
    expect(shapes).not.toContain('other')
    expect(shapes.size).toBe(DAILY_MISSION_COIN_STRING_FORMATS)
    const unparseable = DAILY_MISSION_TIER_REWARDS.filter(r => Number.isNaN(Number(r.coins)))
    expect(unparseable.length).toBeGreaterThan(DAILY_MISSION_TIER_REWARDS.length / 2)
  })

  it('never lets shards fall as the tier rises', () => {
    const numeric = DAILY_MISSION_TIER_REWARDS.filter(r => /^\d+$/.test(r.shards))
    for (let i = 1; i < numeric.length; i += 1) {
      expect(Number(numeric[i]!.shards), `tier ${numeric[i]!.tier}`)
        .toBeGreaterThan(Number(numeric[i - 1]!.shards))
    }
  })
})

describe('weekly reward brackets are cumulative', () => {
  it('sums every bracket to the wiki total, which is what proves it', () => {
    expect(DAILY_MISSION_WEEKLY_TOTAL_BY_REWARD.gems).toBe(WIKI_TOTALS.gems)
    expect(DAILY_MISSION_WEEKLY_TOTAL_BY_REWARD.medals).toBe(WIKI_TOTALS.medals)
    expect(DAILY_MISSION_WEEKLY_TOTAL_BY_REWARD.stones).toBe(WIKI_TOTALS.stones)
    expect(DAILY_MISSION_WEEKLY_TOTAL_BY_REWARD.tokens).toBe(WIKI_TOTALS.tokens)
    expect(DAILY_MISSION_WEEKLY_TOTAL_BY_REWARD.coinsMultiplier).toBe(WIKI_TOTALS.coins)
  })

  it('is not explained by the highest bracket alone', () => {
    const top = DAILY_MISSION_WEEKLY_REWARDS[DAILY_MISSION_WEEKLY_REWARDS.length - 1]!
    expect(top.gems).toBeLessThan(WIKI_TOTALS.gems)
    expect(top.tokens).toBeLessThan(WIKI_TOTALS.tokens)
    // Seven brackets of 5 tokens each is the whole token total.
    expect(top.tokens * DAILY_MISSION_WEEKLY_REWARDS.length).toBe(WIKI_TOTALS.tokens)
  })

  it('steps thresholds by five up to thirty-five', () => {
    expect(DAILY_MISSION_WEEKLY_THRESHOLDS).toEqual([5, 10, 15, 20, 25, 30, 35])
  })

  it('pays no stones in the first four brackets', () => {
    const noStones = DAILY_MISSION_WEEKLY_REWARDS.filter(r => r.stones === 0)
    expect(noStones.map(r => r.missionsCompleted)).toEqual([5, 10, 15, 20])
  })

  it('pays a flat token amount in every bracket', () => {
    expect(new Set(DAILY_MISSION_WEEKLY_REWARDS.map(r => r.tokens)).size).toBe(1)
  })
})

describe('reroll economics', () => {
  it('costs more gems than a mission pays, so it is never gem-positive', () => {
    expect(DAILY_MISSION_REROLL_GEM_COST).toBeGreaterThan(DAILY_MISSION_GEMS_PER_MISSION)
  })
})
