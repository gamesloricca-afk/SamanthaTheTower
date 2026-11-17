import { describe, expect, it } from 'vitest'
import fixture from '../../fixtures/mechanics/effective-paths-v5.11.08.10.json'
import {
  amplifiedChainLightningDps, amplifyBotDamageFactors, bulletsPerSecond,
  chainLightningDps, composeEffectiveHealth, computeEffectiveDamage,
  rapidFireMultiplier, zeroEffectiveDamageConfig, ZERO_EFFECTIVE_DAMAGE_LEVELS,
  EFFECTIVE_PATHS_SOURCE,
  moduleBonus, planEffectiveDamagePath, EFFECTIVE_DAMAGE_UPGRADES,
} from '../../src/mechanics/effective-paths'

/** These expected numbers were evaluated by Google Sheets, not by this port. */
describe('current canonical Effective Paths workbook', () => {
  it('pins the captured revision independently of historical fixtures', () => {
    expect(fixture.source.version).toBe('v5.11.08.10')
    expect(fixture.source.driveVersion).toBe('82842')
    expect(fixture.source.lambdaCount).toBe(267)
    expect(fixture.source.namedRangeCount).toBe(218)
    expect(EFFECTIVE_PATHS_SOURCE.version).toBe(fixture.source.version)
    expect(EFFECTIVE_PATHS_SOURCE.driveVersion).toBe(fixture.source.driveVersion)
    expect(EFFECTIVE_PATHS_SOURCE.sha256).toBe(fixture.source.xlsxSha256)
  })
  for (const row of fixture.bulletsPerSecond) {
    it(`uses the current firing curve at ${row.attackSpeed}`, () => {
      expect(bulletsPerSecond(row.attackSpeed)).toBeCloseTo(row.sheet, 10)
    })
  }
  for (const [index, row] of fixture.rapidFire.entries()) {
    it(`matches current rapid fire ${index}`, () => {
      expect(rapidFireMultiplier(row.input)).toBeCloseTo(row.sheet, 10)
    })
  }
  for (const [index, row] of fixture.chainLightning.entries()) {
    it(`matches current Chain Lightning ${index}`, () => {
      expect(chainLightningDps(row.input)).toBeCloseTo(row.sheet, 9)
    })
  }
  for (const [index, row] of fixture.amplifiedChainLightning.entries()) {
    it(`matches the amplified Chain Lightning mixture ${index}`, () => {
      expect(amplifiedChainLightningDps(row.input)).toBeCloseTo(row.sheet, 8)
    })
  }
  for (const [index, row] of fixture.effectiveHealth.entries()) {
    it(`applies current damage reductions and side-pool floor ${index}`, () => {
      expect(composeEffectiveHealth(row.input)).toBeCloseTo(row.sheet, 10)
    })
  }
  for (const [index, row] of fixture.amplifyBot.entries()) {
    it(`matches current Amplify Bot coverage and echo rounding ${index}`, () => {
      expect(amplifyBotDamageFactors(row.input).towerMultiplier).toBeCloseTo(row.sheet, 10)
    })
  }
  for (const [index, row] of fixture.moduleBonus.entries()) {
    it(`matches the primary-only module research factor ${index}`, () => {
      expect(moduleBonus(row.input)).toBeCloseTo(row.sheet, 12)
    })
  }

  it('applies module research once, from buyable levels, in the real damage model', () => {
    const config = zeroEffectiveDamageConfig()
    Object.assign(config.modules.cannon, { primaryBonus: 2, hasAssist: true, assistBonus: 1.5 })
    config.modules.core.primaryBonus = 2
    const levels = structuredClone(ZERO_EFFECTIVE_DAMAGE_LEVELS)
    Object.assign(levels.lab, { primaryModuleBonusCannon: 10, primaryModuleBonusCore: 30, assistBonusCannon: 5 })
    levels.stone.assistBonusCannonStone = 4
    const result = computeEffectiveDamage(config, levels)
    expect(result.columns.DF5).toBeCloseTo(fixture.moduleBonus[1].sheet, 12)
    expect(result.columns.EO5).toBeCloseTo(fixture.moduleBonus[2].sheet, 12)
  })

  it.each(['primaryModuleBonusCannon', 'primaryModuleBonusCore'] as const)(
    'can purchase %s to its source cap', key => {
      const config = zeroEffectiveDamageConfig()
      config.modules.cannon.primaryBonus = 2
      config.modules.core.primaryBonus = 2
      config.ultimateWeapons['Death Wave'] = { unlocked: true, damage: 10, quantity: 2, cooldown: 100, plus: null }
      const levels = structuredClone(ZERO_EFFECTIVE_DAMAGE_LEVELS)
      levels.lab[key] = 29
      const plan = planEffectiveDamagePath({ config, levels, variant: 'lab-time', steps: 2,
        excludeIds: EFFECTIVE_DAMAGE_UPGRADES.filter(upgrade => upgrade.id !== `lab.${key}`).map(upgrade => upgrade.id),
      })
      expect(plan.steps.map(step => step.level)).toEqual([30])
      expect(plan.steps[0].cost).toBeGreaterThan(0)
    },
  )

  it('uses the frame cap in the real damage composition', () => {
    const config = zeroEffectiveDamageConfig()
    config.gameSpeed = 5
    config.stats['Attack Speed'].workshopLevel = 97
    config.stats['Rapid Fire Chance'].workshopLevel = 80
    config.stats['Rapid Fire Duration'].workshopLevel = 80
    const levels = structuredClone(ZERO_EFFECTIVE_DAMAGE_LEVELS)
    levels.lab.attackSpeed = 99
    const low = computeEffectiveDamage({ ...config, framesPerSecond: 30 }, levels)
    const high = computeEffectiveDamage({ ...config, framesPerSecond: 120 }, levels)
    expect(high.effectiveDamage).toBeGreaterThan(low.effectiveDamage)
  })

  it('uses the bot factor in the real damage composition', () => {
    const config = zeroEffectiveDamageConfig()
    const { towerRangeMetres: _range, lightSpeedShots, ...amplifyBot } = fixture.amplifyBot[0].input
    config.lightSpeedShots = lightSpeedShots
    config.stats.Range.workshopLevel = 60
    config.amplifyBot = amplifyBot
    const levels = structuredClone(ZERO_EFFECTIVE_DAMAGE_LEVELS)
    const active = computeEffectiveDamage(config, levels)
    const inactive = computeEffectiveDamage({ ...config, amplifyBot: { ...amplifyBot, unlocked: false } }, levels)
    expect(active.columns.AmplifyBotMultiplier).toBeCloseTo(fixture.amplifyBot[0].sheet, 10)
    expect(active.effectiveDamage).toBeGreaterThan(inactive.effectiveDamage)
  })

  it('applies the captured bot mixtures to every affected ultimate weapon', () => {
    const config = zeroEffectiveDamageConfig()
    const { towerRangeMetres: _range, lightSpeedShots, ...amplifyBot } = fixture.amplifyBot[0].input
    config.lightSpeedShots = lightSpeedShots
    config.stats.Range.workshopLevel = 60
    config.amplifyBot = amplifyBot
    for (const name of ['Death Wave', 'Smart Missiles', 'Spotlight', 'Spotlight Missiles', 'Poison Swamp', 'Inner Land Mines'] as const) {
      config.ultimateWeapons[name] = { unlocked: true, damage: 10, quantity: 3, cooldown: 100, plus: 1 }
    }
    config.heatUpHits.smartMissiles = fixture.amplifiedWeaponFactors.hitsOnSameTarget
    const levels = structuredClone(ZERO_EFFECTIVE_DAMAGE_LEVELS)
    levels.lab.missileAmplifier = fixture.amplifiedWeaponFactors.missileAmplifierLabLevel
    const active = computeEffectiveDamage(config, levels)
    const inactive = computeEffectiveDamage({ ...config, amplifyBot: { ...amplifyBot, unlocked: false } }, levels)
    for (const [column, expected] of [
      ['EF5', fixture.amplifiedWeaponFactors.deathWaveAndMines],
      ['EM5', fixture.amplifiedWeaponFactors.deathWaveAndMines],
      ['EK5', fixture.amplifiedWeaponFactors.poisonSwamp],
      ['EH5', fixture.amplifiedWeaponFactors.smartMissiles],
      ['EI5', fixture.amplifiedWeaponFactors.spotlightMissiles],
    ] as const) {
      expect(inactive.columns[column], `${column} must exercise an owned weapon`).toBeGreaterThan(0)
      expect(active.columns[column] / inactive.columns[column], column).toBeCloseTo(expected, 10)
    }
  })
})
