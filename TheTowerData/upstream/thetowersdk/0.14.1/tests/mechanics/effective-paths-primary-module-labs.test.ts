import { describe, expect, it } from 'vitest'
import oracle from '../../fixtures/mechanics/effective-paths-primary-module-labs-v5.11.08.10.fixtures.json'
import { computeEffectiveHealth, ZERO_EFFECTIVE_HEALTH_LEVELS, zeroEffectiveHealthConfig } from '../../src/mechanics/effective-paths/ehp-model'
import { EFFECTIVE_HEALTH_UPGRADES, planEffectiveHealthPath } from '../../src/mechanics/effective-paths/ehp-plan'
import { computeEffectiveEconomy, zeroEffectiveEconomyConfig } from '../../src/mechanics/effective-paths/eecon-compute'
import { ZERO_EFFECTIVE_ECONOMY_LEVELS } from '../../src/mechanics/effective-paths/eecon-levels'
import { EFFECTIVE_ECONOMY_UPGRADES, planEffectiveEconomyPath } from '../../src/mechanics/effective-paths/eecon-plan'

describe('primary-module research uses the current source factor in health and economy', () => {
  for (const state of oracle.cases) {
    it(`armor research level ${state.level} changes the actual eHP output once`, () => {
      const config = zeroEffectiveHealthConfig()
      config.health.workshopValue = 100
      config.armor.primaryBonus = state.primaryBonus
      const result = computeEffectiveHealth(config, { ...ZERO_EFFECTIVE_HEALTH_LEVELS, primaryModuleBonusArmor: state.level })
      expect(result.armor).toBeCloseTo(state.sheetValue, 12)
      expect(result.effectiveHealth).toBeCloseTo(100 * state.sheetValue, 10)
      expect(config.armor.primaryBonus).toBe(state.primaryBonus)
    })
    it(`generator research level ${state.level} changes the earning factor once`, () => {
      const config = zeroEffectiveEconomyConfig()
      config.coinsPerKill.value = 1
      config.generator.bonus = state.primaryBonus
      const result = computeEffectiveEconomy(config, {
        ...ZERO_EFFECTIVE_ECONOMY_LEVELS,
        time: { ...ZERO_EFFECTIVE_ECONOMY_LEVELS.time, primaryModuleBonusGenerator: state.level },
      })
      expect(result.columns.CV5).toBeCloseTo(state.sheetValue, 12)
      expect(config.generator.bonus).toBe(state.primaryBonus)
    })
  }

  it('the health planner buys the primary lab and applies the purchased level', () => {
    const config = zeroEffectiveHealthConfig()
    config.health.workshopValue = 100
    config.armor.primaryBonus = 2
    const plan = planEffectiveHealthPath({ config, levels: { ...ZERO_EFFECTIVE_HEALTH_LEVELS }, variant: 'lab-time', steps: 1,
      excludeKeys: EFFECTIVE_HEALTH_UPGRADES.filter(upgrade => upgrade.key !== 'primaryModuleBonusArmor').map(upgrade => upgrade.key) })
    expect(plan.issues).toEqual([])
    expect(plan.steps).toHaveLength(1)
    expect(plan.steps[0].name).toBe('Primary Module Bonus - Armor')
    expect(plan.steps[0].level).toBe(1)
    expect(plan.steps[0].value).toBeCloseTo(100 * oracle.cases.find(state => state.level === 1)!.sheetValue, 10)
  })

  it('the economy planner buys the primary lab and applies the purchased level', () => {
    const config = zeroEffectiveEconomyConfig()
    config.coinsPerKill.value = 1
    config.generator.bonus = 2
    const plan = planEffectiveEconomyPath({ config, levels: {
      time: { ...ZERO_EFFECTIVE_ECONOMY_LEVELS.time }, stone: { ...ZERO_EFFECTIVE_ECONOMY_LEVELS.stone }, discount: { ...ZERO_EFFECTIVE_ECONOMY_LEVELS.discount },
    }, variant: 'time', steps: 1,
    excludeIds: EFFECTIVE_ECONOMY_UPGRADES.filter(upgrade => upgrade.key !== 'primaryModuleBonusGenerator').map(upgrade => upgrade.id) })
    expect(plan.steps).toHaveLength(1)
    expect(plan.steps[0].name).toBe('Primary Module Bonus - Generator')
    expect(plan.steps[0].level).toBe(1)
    expect(plan.steps[0].value).toBeGreaterThan(computeEffectiveEconomy(config, ZERO_EFFECTIVE_ECONOMY_LEVELS).effectiveEconomy)
  })
})
