import { describe, expect, it } from 'vitest'
import { getBasicEnemyWaveStats } from '../../src/mechanics/enemies/wave-stats'
import {
  getWaveInfoEnemyStats,
  WAVE_INFO_OVERCHARGE_DAMAGE_MULT,
} from '../../src/mechanics/waves/info-enemy-stats'
import { waveInfoBossHpWorkshopMult } from '../../src/mechanics/enemies/wave-info-labs'

const noopLabBenefit = () => 0

describe('wave-info-enemy-stats', () => {
  it('Vampire uses 2× wave base HP and plain wave base damage', () => {
    const base = getBasicEnemyWaveStats(1, 100, false)
    const stats = getWaveInfoEnemyStats({
      waveBaseHp: base.hp,
      waveBaseDamage: base.damage,
      wave: 100,
      enemyType: 'Vampire',
      battleConditions: [],
      bcLabLevels: {},
      labBenefitIncreaseAtLevel: noopLabBenefit,
    })
    expect(stats.damage).toBe(base.damage)
    expect(stats.hp).toBe(base.hp * 2)
  })

  it('Scatter uses 2× wave base HP and half wave base damage', () => {
    const base = getBasicEnemyWaveStats(1, 100, false)
    const stats = getWaveInfoEnemyStats({
      waveBaseHp: base.hp,
      waveBaseDamage: base.damage,
      wave: 100,
      enemyType: 'Scatter',
      battleConditions: [],
      bcLabLevels: {},
      labBenefitIncreaseAtLevel: noopLabBenefit,
    })
    expect(stats.hp).toBe(base.hp * 2)
    expect(stats.damage).toBe(Math.floor(base.damage * 0.5))
  })

  it('Ray uses wave base HP and damage', () => {
    const base = getBasicEnemyWaveStats(1, 100, false)
    const stats = getWaveInfoEnemyStats({
      waveBaseHp: base.hp,
      waveBaseDamage: base.damage,
      wave: 100,
      enemyType: 'Ray',
      battleConditions: [],
      bcLabLevels: {},
      labBenefitIncreaseAtLevel: noopLabBenefit,
    })
    expect(stats.hp).toBe(base.hp)
    expect(stats.damage).toBe(base.damage)
  })

  it('fleet enemies use 20× wave base HP; Saboteur and Commander deal no damage', () => {
    const base = getBasicEnemyWaveStats(1, 100, false)
    const sharedHp = base.hp * 20
    for (const enemyType of ['Saboteur', 'Commander', 'Overcharge'] as const) {
      const stats = getWaveInfoEnemyStats({
        waveBaseHp: base.hp,
        waveBaseDamage: base.damage,
        wave: 100,
        enemyType,
        battleConditions: [],
        bcLabLevels: {},
        labBenefitIncreaseAtLevel: noopLabBenefit,
      })
      expect(stats.hp).toBe(sharedHp)
    }
    expect(getWaveInfoEnemyStats({
      waveBaseHp: base.hp,
      waveBaseDamage: base.damage,
      wave: 100,
      enemyType: 'Saboteur',
      battleConditions: [],
      bcLabLevels: {},
      labBenefitIncreaseAtLevel: noopLabBenefit,
    }).damage).toBe(0)
    expect(getWaveInfoEnemyStats({
      waveBaseHp: base.hp,
      waveBaseDamage: base.damage,
      wave: 100,
      enemyType: 'Commander',
      battleConditions: [],
      bcLabLevels: {},
      labBenefitIncreaseAtLevel: noopLabBenefit,
    }).damage).toBe(0)
  })

  it('Boss uses 20× wave base HP with boss row labs, not Basic row', () => {
    const base = getBasicEnemyWaveStats(1, 100, false)
    const labLevels = { boss_health: 30, common_enemy_health: 1 }
    const labBenefit = (slug: string, level: number) => (slug === 'boss_health' ? 0.3 * level : 0.4 * level)
    const boss = getWaveInfoEnemyStats({
      waveBaseHp: base.hp,
      waveBaseDamage: base.damage,
      wave: 100,
      enemyType: 'Boss',
      battleConditions: [],
      bcLabLevels: {},
      labBenefitIncreaseAtLevel: noopLabBenefit,
      enemyLabLevels: labLevels,
      enemyLabBenefitAtLevel: labBenefit,
      bossHealthLabValuePerLevel: 0.3,
    })
    expect(boss.hp).toBe(Math.floor(
      base.hp * 20 * waveInfoBossHpWorkshopMult(labLevels, labBenefit, 0.3),
    ))
  })

  it('Overcharge attack is wave base damage × 1/65536', () => {
    const base = getBasicEnemyWaveStats(1, 100, false)
    const stats = getWaveInfoEnemyStats({
      waveBaseHp: base.hp,
      waveBaseDamage: base.damage,
      wave: 100,
      enemyType: 'Overcharge',
      battleConditions: [],
      bcLabLevels: {},
      labBenefitIncreaseAtLevel: noopLabBenefit,
    })
    expect(stats.damage).toBe(Math.floor(base.damage * WAVE_INFO_OVERCHARGE_DAMAGE_MULT))
  })
})
