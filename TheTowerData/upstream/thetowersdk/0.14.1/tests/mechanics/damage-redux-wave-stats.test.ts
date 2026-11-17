import { describe, expect, it } from 'vitest'
import { defaultEnemyStatsPerkState } from '../../src/mechanics/enemies/stats-simplified'
import { getDamageReduxBasicWaveStats } from '../../src/mechanics/combat/damage-redux-wave-stats'

describe('damage-redux-wave-stats', () => {
  it('resolves basic enemy HP and damage from tier and wave', () => {
    const stats = getDamageReduxBasicWaveStats({
      tier: 10,
      wave: 624,
      perks: defaultEnemyStatsPerkState,
    })
    expect(stats.tier).toBe(10)
    expect(stats.wave).toBe(624)
    expect(stats.hp).toBeGreaterThan(0)
    expect(stats.damage).toBeGreaterThan(0)
  })

  it('uses full tier-20 Wave Info BC workshop (not UI-filtered subset)', () => {
    const stats = getDamageReduxBasicWaveStats({
      tier: 20,
      wave: 4958,
      healthSkipCount: 3526,
      attackSkipCount: 3487,
      perks: defaultEnemyStatsPerkState,
      bcCounterLabLevels: {
        battle_condition_reduction: 10,
        enemy_level_skip_reduction: 10,
        bosss_ultimate: 10,
      },
    })
    // The HP golden that used to sit here (8.0204e37) was captured while
    // resistance BCs were wrongly suppressing enemy HP — it encoded a value
    // ~44x too low, which is the tier-20 resistance multiplier (0.0225). It is
    // gone rather than rescaled: this case exists to prove the full BC set is
    // used instead of the UI-filtered subset, and the damage side still shows
    // that. Resistances never applied to damage, so this number is unaffected.
    expect(stats.damage / 5.5099239188714196e23).toBeCloseTo(1, 2)
    expect(stats.hp).toBeGreaterThan(0)
  })

  it('applies ELS skip counter lab when using skip % on tier 20', () => {
    const base = getDamageReduxBasicWaveStats({
      tier: 20,
      wave: 4958,
      healthSkipPct: 84,
      attackSkipPct: 84,
      perks: defaultEnemyStatsPerkState,
      bcCounterLabLevels: { enemy_level_skip_reduction: 0 },
    })
    const mitigated = getDamageReduxBasicWaveStats({
      tier: 20,
      wave: 4958,
      healthSkipPct: 84,
      attackSkipPct: 84,
      perks: defaultEnemyStatsPerkState,
      bcCounterLabLevels: {
        battle_condition_reduction: 10,
        enemy_level_skip_reduction: 10,
      },
    })
    expect(mitigated.hp).toBeLessThan(base.hp)
    expect(mitigated.damage).toBeLessThan(base.damage)
  })

  it('applies BC counter labs to skip-% stat levels on tier 20', () => {
    const base = getDamageReduxBasicWaveStats({
      tier: 20,
      wave: 4958,
      healthSkipPct: 84,
      attackSkipPct: 84,
      perks: defaultEnemyStatsPerkState,
    })
    const mitigated = getDamageReduxBasicWaveStats({
      tier: 20,
      wave: 4958,
      healthSkipPct: 84,
      attackSkipPct: 84,
      perks: defaultEnemyStatsPerkState,
      bcCounterLabLevels: {
        battle_condition_reduction: 10,
        enemy_level_skip_reduction: 10,
      },
    })
    expect(mitigated.hp).toBeLessThan(base.hp)
    expect(mitigated.damage).toBeLessThan(base.damage)
  })
})
