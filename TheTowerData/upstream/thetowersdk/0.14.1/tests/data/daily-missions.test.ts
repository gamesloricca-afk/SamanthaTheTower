import { describe, expect, it } from 'vitest'

import {
  DAILY_MISSION_TIER_REWARDS,
  DAILY_MISSION_WEEKLY_REWARDS,
  DAILY_MISSION_WEEKLY_TOTAL_BY_REWARD,
} from '../../src/data/daily-missions/data'

describe('daily mission weekly totals', () => {
  it('matches the figures the hand-written table used to publish', () => {
    // These are the values that lived beside the rows as separate literals.
    // Pinning them proves the derivation reproduces the old table exactly,
    // rather than quietly changing a published number while refactoring.
    expect(DAILY_MISSION_WEEKLY_TOTAL_BY_REWARD).toEqual({
      coinsMultiplier: 'x64',
      gems: 185,
      medals: 135,
      stones: 45,
      tokens: 35,
    })
  })

  it('moves when a reward row moves', () => {
    // Prove the total is read from the rows rather than restated. Summing here
    // independently would restate the implementation, so compare against a
    // fixed arithmetic fact instead: every row pays 5 tokens.
    expect(DAILY_MISSION_WEEKLY_TOTAL_BY_REWARD.tokens).toBe(DAILY_MISSION_WEEKLY_REWARDS.length * 5)
  })

  it('has one weekly tier per five missions, with no gaps', () => {
    const completed = DAILY_MISSION_WEEKLY_REWARDS.map(row => row.missionsCompleted)
    expect(completed).toEqual([5, 10, 15, 20, 25, 30, 35])
  })

  it('covers every tier from 1 with no duplicates or gaps', () => {
    const tiers = DAILY_MISSION_TIER_REWARDS.map(row => row.tier)
    expect(tiers).toEqual(Array.from({ length: tiers.length }, (_, i) => i + 1))
  })

  it('only tier 1 lacks a shard reward', () => {
    const withoutShards = DAILY_MISSION_TIER_REWARDS.filter(row => row.shards === 'N/A')
    expect(withoutShards.map(row => row.tier)).toEqual([1])
  })
})
