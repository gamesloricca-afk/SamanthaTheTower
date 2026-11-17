import { describe, expect, it } from 'vitest'
import {
  BOSS_REROLL_SHARDS_PROC,
  COMMON_MODULE_DROP_BASE,
  getBossRerollShardCount,
  getCommonModuleDropChance,
  getExpectedBossRerollShardsPerKill,
  getRareModuleDropChance,
  getShatterShards,
  RARE_MODULE_DROP_BASE,
  REROLL_SHARDS_BY_TIER,
  getFleetRewardRow,
} from '../../src/mechanics/enemies/drops-game-data'

describe('enemy-drops-game-data', () => {
  it('matches drop chance bases at lab 0', () => {
    expect(getCommonModuleDropChance(0)).toBeCloseTo(COMMON_MODULE_DROP_BASE, 6)
    expect(getRareModuleDropChance(0)).toBeCloseTo(RARE_MODULE_DROP_BASE, 6)
  })

  it('scales drop chance with lab benefit × 0.01', () => {
    expect(getCommonModuleDropChance(1)).toBeCloseTo(0.02 + 0.01, 6)
    expect(getRareModuleDropChance(0.5)).toBeCloseTo(0.005 + 0.005, 6)
  })

  it('uses tier reroll shard table plus rounded lab bonus', () => {
    expect(REROLL_SHARDS_BY_TIER[8]).toBe(32)
    expect(getBossRerollShardCount(10, 0)).toBe(32)
    expect(getBossRerollShardCount(10, 2.4)).toBe(34)
    expect(getExpectedBossRerollShardsPerKill(10, 0)).toBeCloseTo(32 * BOSS_REROLL_SHARDS_PROC, 6)
  })

  it('returns fleet reward row by tier', () => {
    expect(getFleetRewardRow(20)).toEqual({ tier: 20, rerollShards: 1950, moduleShardsPerType: 11 })
  })

  it('computes shatter shards from lab benefit and rarity constants', () => {
    expect(getShatterShards('common', 0)).toBe(5)
    expect(getShatterShards('rare', 0)).toBe(30)
    expect(getShatterShards('common', 20)).toBe(6)
    expect(getShatterShards('rare', 100)).toBe(60)
  })
})
