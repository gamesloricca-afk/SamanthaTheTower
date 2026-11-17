import { describe, expect, it } from 'vitest'
import { computeEffectiveDamage } from '../../src/mechanics/effective-paths/edamage-compute'
import { zeroEffectiveDamageConfig } from '../../src/mechanics/effective-paths/edamage-config'
import { ZERO_EFFECTIVE_DAMAGE_LEVELS } from '../../src/mechanics/effective-paths/edamage-levels'
import { goldenTowerBonus } from '../../src/mechanics/effective-paths/eecon-stats'
import { computeEffectiveEconomy, zeroEffectiveEconomyConfig } from '../../src/mechanics/effective-paths/eecon-compute'
import { ZERO_EFFECTIVE_ECONOMY_LEVELS } from '../../src/mechanics/effective-paths/eecon-levels'
import { EFFECTIVE_DAMAGE_UPGRADES, planEffectiveDamagePath } from '../../src/mechanics/effective-paths/edamage-plan'

describe('29.1 and current EP regressions', () => {
  it.each([
    [0, 0, 1.5], [0, 14, 1.5], [1, 0, 2.25], [1, 14, 3], [3, 14, 6],
  ])('amplifier lab %s with TB interval %s has heat-up %s', (lab, seconds, expected) => {
    const config = zeroEffectiveDamageConfig()
    config.heatUpHits.smartMissiles = 2
    config.uniques['Tactical Barrage'] = { primary: seconds, assist: 0 }
    const levels = { ...ZERO_EFFECTIVE_DAMAGE_LEVELS, lab: { ...ZERO_EFFECTIVE_DAMAGE_LEVELS.lab, missileAmplifier: lab } }
    // Literal EP_UW_HEATUP outputs; TB doubles the lab slope, never neutral 1.
    expect(computeEffectiveDamage(config, levels).columns.EJ5).toBe(expected)
  })

  const base = { stoneLevel: 0, labLevel: 0, hasPerk: false, stoneCap: 0, labCap: 0, primarySubstat: 0, assistSubstat: 0 }

  it.each([
    [0, 0, 5], [0, 0.05, 5.249999761581421],
    [2, 0, 7], [2, 0.05, 7.349999666213989],
  ])('matches the Vault arithmetic reference values: module %s, Vault %s', (module, vault, expected) => {
    expect(goldenTowerBonus({ ...base, primarySubstat: module, vaultPct: vault })).toBeCloseTo(expected, 6)
  })

  it('scales assist contribution and preserves omitted Vault compatibility', () => {
    expect(goldenTowerBonus({ ...base, assistSubstat: 2, stoneCap: 9, vaultPct: 0.05 })).toBeCloseTo(5.46, 10)
    expect(goldenTowerBonus(base)).toBe(5)
    expect(goldenTowerBonus({ ...base, vaultPct: 0 })).toBe(5)
  })

  it('passes the Vault input through the economy model and changes its output', () => {
    const config = zeroEffectiveEconomyConfig()
    const before = computeEffectiveEconomy(config, ZERO_EFFECTIVE_ECONOMY_LEVELS).columns.CZ5
    config.weapons.goldenTower.vaultPct = 0.05
    const after = computeEffectiveEconomy(config, ZERO_EFFECTIVE_ECONOMY_LEVELS).columns.CZ5
    expect(before).toBe(5)
    expect(after).toBe(5.25)
  })

  it.each([[9, 0.3448275862068966], [10, 0.45], [11, null]])(
    'caps CF Slow candidate valuation from level %s', (level, expectedGain) => {
      const config = zeroEffectiveDamageConfig()
      config.chronoFieldEnabled = true
      config.ultimateWeapons['Chrono Field'] = { unlocked: true, damage: 0, quantity: 0.2, cooldown: 180, plus: null }
      config.modules.core.hasAssist = true
      config.substats['Chrono Field - Speed Reduction'] = { primary: 0.15, assist: 0.1 }
      const levels = { ...ZERO_EFFECTIVE_DAMAGE_LEVELS, stone: {
        ...ZERO_EFFECTIVE_DAMAGE_LEVELS.stone, chronoFieldSlow: level, assistSubstatCoreStone: 4,
      } }
      const plan = planEffectiveDamagePath({ config, levels, variant: 'stone', steps: 1,
        excludeIds: EFFECTIVE_DAMAGE_UPGRADES.filter(u => u.id !== 'stone.chronoFieldSlow').map(u => u.id),
      })
      if (expectedGain === null) {
        expect(plan.steps).toHaveLength(0)
      }
      else {
        expect(plan.steps).toHaveLength(1)
        // Catalog slow plus a valid 5%-capacity assist: 80.5%, 85.5%, then capped 90%.
        // Literal relative gains from the current sheet's capped candidate formula.
        const candidate = plan.firstStepRoi.find(r => r.name === 'CF Slow')
        if (!candidate) throw new Error('CF Slow candidate was not valued')
        expect(candidate.gain / plan.startingEffectiveDamage).toBeCloseTo(expectedGain, 8)
      }
    },
  )
})
