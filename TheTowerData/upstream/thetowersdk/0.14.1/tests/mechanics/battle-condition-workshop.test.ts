import { describe, expect, it } from 'vitest'
import {
  buildStandardTierBattleConditions,
  WAVE_INFO_RESISTANCE_BATTLE_CONDITION_NAMES,
} from '../../src/mechanics/battle-conditions/config'
import type { BattleConditionSelection } from '../../src/mechanics/battle-conditions/types'
import { getWaveInfoEnemyStatsUnfloored } from '../../src/mechanics/waves/info-enemy-stats'
import { buildWorkshopTableFloats, workshopTableFloatFromBuild } from '../../src/mechanics/workshop/table-build'
import { MAX_CAMPAIGN_TIER } from '../../src/data'

describe('resistance conditions and enemy row health', () => {
  function resistanceOnly(tier: number) {
    const names = new Set<string>(WAVE_INFO_RESISTANCE_BATTLE_CONDITION_NAMES)
    return buildStandardTierBattleConditions(tier).filter(bc => names.has(bc.name))
  }

  function row(tier: number, battleConditions: readonly BattleConditionSelection[], enemyLabLevels = {}) {
    return getWaveInfoEnemyStatsUnfloored({
      waveBaseHp: 1000, waveBaseDamage: 500, wave: 1000, tier, enemyType: 'Basic',
      battleConditions, bcLabLevels: {}, labBenefitIncreaseAtLevel: () => 0,
      enemyLabLevels, enemyLabBenefitAtLevel: (_slug, level) => level * 0.4,
    })
  }

  it('exercises resistance conditions at the affected high tiers', () => {
    expect(resistanceOnly(21).length).toBeGreaterThan(0)
    expect(resistanceOnly(24).length).toBeGreaterThan(0)
  })

  it('keeps actual row health unchanged by resistance conditions on every tier', () => {
    for (let tier = 1; tier <= MAX_CAMPAIGN_TIER; tier += 1) {
      expect(row(tier, resistanceOnly(tier)).hp, `tier ${tier}`).toBe(row(tier, []).hp)
    }
  })

  it('produces finite positive row health with standard tier conditions', () => {
    for (let tier = 1; tier <= MAX_CAMPAIGN_TIER; tier += 1) {
      const hp = row(tier, buildStandardTierBattleConditions(tier)).hp
      expect(Number.isFinite(hp), `tier ${tier}`).toBe(true)
      expect(hp, `tier ${tier}`).toBeGreaterThan(0)
    }
  })

  it('changes health when the matching enemy research input changes', () => {
    const conditions = resistanceOnly(24)
    const unresearched = row(24, conditions)
    const researched = row(24, conditions, { common_enemy_health: 20 })
    expect(unresearched.hp).toBe(1000)
    expect(researched.hp).toBeCloseTo(920, 8)
    expect(researched.hp).toBeLessThan(unresearched.hp)
    expect(researched.damage).toBe(unresearched.damage)
  })

  it('keeps Protector health finite and applies its health multiplier', () => {
    const stats = getWaveInfoEnemyStatsUnfloored({
      waveBaseHp: 1000, waveBaseDamage: 500, wave: 1000, tier: 24,
      enemyType: 'Protector', battleConditions: buildStandardTierBattleConditions(24),
      bcLabLevels: {}, labBenefitIncreaseAtLevel: () => 0,
    })
    expect(Number.isFinite(stats.hp)).toBe(true)
    expect(stats.hp).toBeCloseTo(600, 3)
    expect(stats.hp).toBeGreaterThan(0)
  })
})

describe('workshop lab values use semantic research keys', () => {
  it('keeps meta values and enemy research under distinct slug keys', () => {
    const input = { tier: 24, labLevels: { common_enemy_health: 1 }, battleConditions: [] }
    const table = buildWorkshopTableFloats(input)
    expect([...table.keys()]).toEqual(['labs_coin_discount', 'labs_speed', 'common_enemy_health'])
    expect(table.get('labs_coin_discount')).toBe(0)
    expect(table.get('common_enemy_health')).toBeCloseTo(8352.7783203125, 6)
    expect(workshopTableFloatFromBuild('common_enemy_health', input, table)).toBe(table.get('common_enemy_health'))
    expect(workshopTableFloatFromBuild('boss_attack', input, table)).toBe(0)
  })
})
