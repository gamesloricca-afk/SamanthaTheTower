import { describe, expect, it } from 'vitest'
import { buildStandardTierBattleConditions } from '../../src/mechanics/battle-conditions/config'
import {
  computeEffectiveEnemySkipPctWithBcLabs,
  computeEnemyStatLevelWithBcLabs,
} from '../../src/mechanics/labs/bc-counter-labs'
import { getEnemyStatsAtWave } from '../../src/mechanics/enemies/stats-simplified'

describe('BC counter lab visibility', () => {
  const lowBc = { battle_condition_reduction: 0, enemy_level_skip_reduction: 0, bosss_ultimate: 0 }
  const highBc = { battle_condition_reduction: 10, enemy_level_skip_reduction: 10, bosss_ultimate: 10 }
  const perks = {
    perkEnemyHpMinus50: false,
    perkBossHpX8: false,
    perkBossHpMinus70: false,
    perkEnemyDmgMinus50: false,
    perkEnemyDmgX25: false,
    perkRangedDmgX3: false,
  }

  it('tier 20: effective skip % rises when BC counter labs mitigate tier ELS BC', () => {
    const conditions = buildStandardTierBattleConditions(20)
    const eff0 = computeEffectiveEnemySkipPctWithBcLabs(84, lowBc, 20, 500, false, null, conditions)
    const eff10 = computeEffectiveEnemySkipPctWithBcLabs(84, highBc, 20, 500, false, null, conditions)
    expect(eff10).toBeGreaterThan(eff0)
    expect(eff10 - eff0).toBeGreaterThan(0)
  })

  it('tier 11 tournament: ELS subtract stays 0 so BC labs do not change Basic HP', () => {
    // v29 tournament heat has no ELS Reduction subtract cap; counter labs for that
    // BC therefore cannot change skip-driven Basic HP on a tournament run.
    const conditions = buildStandardTierBattleConditions(11).map(row => ({ ...row, enabled: true }))
    const wave = 3000
    const skipPct = 70
    const base = {
      tier: 11,
      healthSkipPct: skipPct,
      attackSkipPct: skipPct,
      perks,
      enabledBattleConditions: [] as const,
      battleConditions: conditions,
      tournament: true,
      tournamentLeague: 'Legend' as const,
    }
    const high = getEnemyStatsAtWave(11, wave, 'Basic', { ...base, bcCounterLabLevels: highBc })
    const low = getEnemyStatsAtWave(11, wave, 'Basic', { ...base, bcCounterLabLevels: lowBc })
    expect(high.hp).toBe(low.hp)
  })

  it('tier 17: BC labs change stat level with skip %', () => {
    const conditions = buildStandardTierBattleConditions(17)
    const wave = 1500
    const skipPct = 75
    const s0 = computeEnemyStatLevelWithBcLabs(wave, skipPct, null, lowBc, 17, false, null, conditions)
    const s10 = computeEnemyStatLevelWithBcLabs(wave, skipPct, null, highBc, 17, false, null, conditions)
    expect(s10).not.toBe(s0)
  })
})
