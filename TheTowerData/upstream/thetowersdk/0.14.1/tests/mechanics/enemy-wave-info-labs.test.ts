import { describe, expect, it } from 'vitest'
import {
  waveInfoBossHpTableFloat,
  waveInfoBossHpWorkshopMult,
  waveInfoEnemyLabMultiplierForRow,
  waveInfoEnemyLabSlugForRow,
} from '../../src/mechanics/enemies/wave-info-labs'

describe('enemy-wave-info-labs', () => {
  it('applies additive −0.4% per level from chart totals', () => {
    const benefitAtLevel = (slug: string, level: number) =>
      slug === 'common_enemy_health' ? 0.4 * level : 0

    expect(waveInfoEnemyLabMultiplierForRow(
      'Basic',
      'hp',
      { common_enemy_health: 1 },
      benefitAtLevel,
    )).toBeCloseTo(0.996, 6)

    expect(waveInfoEnemyLabMultiplierForRow(
      'Basic',
      'hp',
      { common_enemy_health: 30 },
      benefitAtLevel,
    )).toBeCloseTo(0.88, 6)
  })

  it('Boss HP uses workshop@0x1FC table float, not chart (1 − benefit%)', () => {
    const benefitAtLevel = (slug: string, level: number) =>
      slug === 'boss_health' ? 0.3 * level : 0
    const labs = { boss_health: 30 }

    expect(waveInfoEnemyLabMultiplierForRow('Boss', 'hp', labs, benefitAtLevel)).toBeCloseTo(0.91, 6)
    expect(waveInfoBossHpTableFloat(labs, benefitAtLevel, 0.3)).toBeCloseTo(54, 3)
    expect(waveInfoBossHpWorkshopMult(labs, benefitAtLevel, 0.3)).toBeCloseTo(0.46, 2)
  })

  it('maps Wave Info rows to type-specific lab slugs', () => {
    expect(waveInfoEnemyLabSlugForRow('Basic', 'hp')).toBe('common_enemy_health')
    expect(waveInfoEnemyLabSlugForRow('Boss', 'hp')).toBe('boss_health')
    expect(waveInfoEnemyLabSlugForRow('Boss', 'attack')).toBe('boss_attack')
    expect(waveInfoEnemyLabSlugForRow('Tank', 'hp')).toBe('tank_enemy_health')
    expect(waveInfoEnemyLabSlugForRow('Vampire', 'hp')).toBe('vampire_enemy_health')
    expect(waveInfoEnemyLabSlugForRow('Overcharge', 'hp')).toBe('overcharge_enemy_health')
    expect(waveInfoEnemyLabSlugForRow('Overcharge', 'attack')).toBe('overcharge_enemy_damage')
    expect(waveInfoEnemyLabSlugForRow('Commander', 'hp')).toBe('commander_enemy_health')
    expect(waveInfoEnemyLabSlugForRow('Saboteur', 'hp')).toBe('saboteur_enemy_health')
  })
})
