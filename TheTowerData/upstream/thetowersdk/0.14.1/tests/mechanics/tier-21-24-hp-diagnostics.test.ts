import { describe, expect, it } from 'vitest'
import { getBasicEnemyWaveStats } from '../../src/mechanics/enemies/wave-stats'
import { buildStandardTierBattleConditions } from '../../src/mechanics/battle-conditions/config'
import { bcCounterLabBenefitIncreaseAtLevel } from '../../src/mechanics/labs/bc-counter-labs'
import { CAMPAIGN_TIER_PRESSURE } from '../../src/mechanics/waves/scaling-regression-profile'
import { computeWaveInfoDisplayStats } from '../../src/mechanics/enemies/wave-info-pipeline'

describe('tier 21-24 HP diagnostics', () => {
  const wave = 1000
  const perks = {
    perkEnemyHpMinus50: false,
    perkBossHpX8: false,
    perkBossHpMinus70: false,
    perkEnemyDmgMinus50: false,
    perkEnemyDmgX25: false,
    perkRangedDmgX3: false,
  }

  it('tier pressure ladder stays ×1200 through T24 (not ×120000 jump at T22)', () => {
    for (let tier = 19; tier <= 23; tier += 1) {
      const ratio = CAMPAIGN_TIER_PRESSURE[tier + 1]! / CAMPAIGN_TIER_PRESSURE[tier]!
      expect(ratio).toBeGreaterThan(1000)
      expect(ratio).toBeLessThan(1500)
    }
  })

  it('actual displayed health stays finite and positive with tier conditions', () => {
    for (const tier of [20, 21, 22, 23, 24]) {
      const base = getBasicEnemyWaveStats(tier, wave, false)
      const row = computeWaveInfoDisplayStats({
        waveBaseHp: base.hp, waveBaseDamage: base.damage, wave, tier,
        enemyType: 'Basic', battleConditions: buildStandardTierBattleConditions(tier),
        bcLabLevels: {}, labBenefitIncreaseAtLevel: bcCounterLabBenefitIncreaseAtLevel,
        perks,
      })
      expect(Number.isFinite(row.hp), `tier ${tier}`).toBe(true)
      expect(row.hp, `tier ${tier}`).toBeGreaterThan(0)
    }
  })

  it('Basic HP scales monotonically with tier at fixed wave', () => {
    const bcLabs = {
      orb_resistance: 20,
      death_ray_resistance: 20,
      thorns_resistance: 20,
      knockback_resistance: 20,
      plasma_cannon_resistance: 20,
    }
    let prev = 0
    for (const tier of [20, 21, 22, 23, 24]) {
      const base = getBasicEnemyWaveStats(tier, wave, false)
      const bcs = buildStandardTierBattleConditions(tier)
      const row = computeWaveInfoDisplayStats({
        waveBaseHp: base.hp,
        waveBaseDamage: base.damage,
        wave,
        tier,
        enemyType: 'Basic',
        battleConditions: bcs,
        bcLabLevels: bcLabs,
        labBenefitIncreaseAtLevel: bcCounterLabBenefitIncreaseAtLevel,
        perks,
      })
      expect(row.hp, `tier ${tier}`).toBeGreaterThan(prev)
      prev = row.hp
    }
  })
})
