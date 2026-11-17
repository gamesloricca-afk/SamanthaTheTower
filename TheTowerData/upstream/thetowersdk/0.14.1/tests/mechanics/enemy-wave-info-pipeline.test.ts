import { describe, expect, it } from 'vitest'
import { getBasicEnemyWaveStats } from '../../src/mechanics/enemies/wave-stats'
import { getWaveInfoEnemyStatsUnfloored } from '../../src/mechanics/waves/info-enemy-stats'
import { buildStandardTierBattleConditions } from '../../src/mechanics/battle-conditions/config'
import {
  computeWaveInfoDisplayStats,
  WAVE_INFO_PIPELINE_STAGE_NAMES,
} from '../../src/mechanics/enemies/wave-info-pipeline'
import { tradeOffPresetAllExceptEnemyDmgMinus50 } from '../../src/mechanics/enemies/stat-display'

describe('enemy-wave-info-pipeline', () => {
  it('declares fixed stage order', () => {
    expect(WAVE_INFO_PIPELINE_STAGE_NAMES).toEqual([
      'waveBase',
      'workshop',
      'typeRules',
      'pagePerks',
    ])
  })

  it('applies perks only in stage 4 (after type rules)', () => {
    const tier = 20
    const wave = 6670
    const hpW = wave - 4744
    const dmgW = wave - 4691
    const waveBaseHp = getBasicEnemyWaveStats(tier, hpW, false).hp
    const waveBaseDamage = getBasicEnemyWaveStats(tier, dmgW, false).damage
    const bcs = buildStandardTierBattleConditions(tier)
    const perks = tradeOffPresetAllExceptEnemyDmgMinus50()

    const bcLabLevels = {
      battle_condition_reduction: 10,
      enemy_level_skip_reduction: 10,
      bosss_ultimate: 0,
    }

    const result = computeWaveInfoDisplayStats({
      waveBaseHp,
      waveBaseDamage,
      wave,
      tier,
      enemyType: 'Boss',
      battleConditions: bcs,
      bcLabLevels,
      labBenefitIncreaseAtLevel: () => 0,
      perks,
      improveTradeOffLabPct: 10,
    })

    const bossTyped = getWaveInfoEnemyStatsUnfloored({
      waveBaseHp,
      waveBaseDamage,
      wave,
      tier,
      enemyType: 'Boss',
      battleConditions: bcs,
      bcLabLevels,
      labBenefitIncreaseAtLevel: () => 0,
    })
    expect(result.stages.afterTypeRulesHp).toBeCloseTo(bossTyped.hp, -4)
    expect(result.stages.hpPagePerkMult).toBeCloseTo(0.86801677942276, 5)
    expect(result.hp).toBeCloseTo(bossTyped.hp * result.stages.hpPagePerkMult, -4)
  })
})
