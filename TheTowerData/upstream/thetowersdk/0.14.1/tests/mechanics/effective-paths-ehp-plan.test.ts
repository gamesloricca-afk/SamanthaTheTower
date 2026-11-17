import { describe, expect, it } from 'vitest'
import fixture from '../../fixtures/mechanics/effective-paths-ehp-path.fixtures.json'
import { effectiveHealthPerks, ZERO_EFFECTIVE_HEALTH_LEVELS } from '../../src/mechanics/effective-paths/ehp-model'
import { type EffectiveHealthConfig, type EffectiveHealthLevels } from '../../src/mechanics/effective-paths/types'
import { EFFECTIVE_HEALTH_UPGRADES, planEffectiveHealthPath } from '../../src/mechanics/effective-paths/ehp-plan'
import { type EffectiveHealthPathVariant } from '../../src/mechanics/effective-paths/types'

/**
 * The eHP path, end to end, against the sheet.
 *
 * The earlier path test modelled only the four upgrades the sheet's path
 * happened to choose. This plans with the whole model and every eligible
 * upgrade in play, which is a stronger claim: the other candidates are now
 * genuinely competing at every step and losing, rather than being absent.
 *
 * The starting state is the one the fixture was captured in — a fresh account
 * with tournament overrides on and nothing else.
 */

const EMPTY_ACCOUNT: EffectiveHealthConfig = {
  health: { workshopValue: 5 },
  defenseAbsolute: { workshopValue: 0 },
  defensePercent: { workshopValue: 0 },
  wallHealth: { workshopValue: 0 },
  maxRecovery: { workshopValue: 0 },
  cards: {
    health: { has: false, value: 1 },
    defenseAbsolute: { has: false, value: 1 },
    defensePercent: { has: false, value: 0 },
  },
  armor: { primaryBonus: 1.012, hasAssist: false, assistBonus: 1, labBonusCap: 0 },
  labSubstatCap: { armor: 0, generator: 0 },
  wall: { has: false, primaryEffect: 0, assistEffect: 0 },
  recovery: { has: false },
  perks: effectiveHealthPerks({
    apply: true,
    health: true,
    healthRegen: true,
    extraDefense: true,
    absoluteDefense: true,
    enemyDamageTradeOff: true,
    // A fresh account in the sheet has both health trade-off perks taken.
    coinTradeOff: true,
    regenTradeOff: true,
  }),
  chronoField: { unlocked: false },
  chainThunder: { has: false, damageShare: 0 },
  deathWave: { hasHealth: false },
  enemiesAttackingTogether: 1,
  dissonance: { active: false, tierPersonalBest: 0, allTierPersonalBests: [] },
}

/** The sheet's per-upgrade caps, matched to model keys by name. */
function capsFromFixture(): {
  maxLevels: Partial<Record<keyof EffectiveHealthLevels, number>>
  targetLevels: Partial<Record<keyof EffectiveHealthLevels, number>>
} {
  const maxLevels: Partial<Record<keyof EffectiveHealthLevels, number>> = {}
  const targetLevels: Partial<Record<keyof EffectiveHealthLevels, number>> = {}

  for (const upgrade of EFFECTIVE_HEALTH_UPGRADES) {
    const row = fixture.candidates.find(
      candidate => candidate.name.toLowerCase() === upgrade.sheetName.toLowerCase(),
    )
    if (!row) continue
    maxLevels[upgrade.key] = row.maxLevel
    if (row.targetLevel !== null) targetLevels[upgrade.key] = row.targetLevel
  }
  return { maxLevels, targetLevels }
}

describe('planning the eHP time path with the whole model', () => {
  const { maxLevels, targetLevels } = capsFromFixture()

  const plan = planEffectiveHealthPath({
    config: EMPTY_ACCOUNT,
    levels: ZERO_EFFECTIVE_HEALTH_LEVELS,
    variant: 'lab-time',
    steps: fixture.steps.length,
    maxLevels,
    targetLevels,
  })

  it('starts where the sheet starts', () => {
    expect(plan.startingEffectiveHealth).toBeCloseTo(fixture.startingEffectiveHealth, 9)
  })

  it('had more candidates available than it chose', () => {
    // If only the four winning upgrades were eligible this test would prove
    // nothing about the others losing on merit.
    const eligible = EFFECTIVE_HEALTH_UPGRADES.length - plan.excluded.length
    expect(eligible).toBeGreaterThanOrEqual(11)
    const chosen = new Set(plan.steps.map(step => step.name))
    expect(chosen.size).toBeLessThan(eligible)
  })

  it('takes the sheet\'s upgrades, in the sheet\'s order, at the sheet\'s levels', () => {
    expect(plan.steps.map(step => `${step.name} ${step.level}`))
      .toEqual(fixture.steps.map(step => `${step.name} ${step.level}`))
  })

  it('reaches the sheet\'s eHP at every step', () => {
    for (const [index, step] of plan.steps.entries()) {
      expect(step.value, `step ${step.step}`).toBeCloseTo(fixture.steps[index].value, 9)
    }
  })

  it('reports the sheet\'s ROI, once converted to the sheet\'s relative form', () => {
    for (const [index, step] of plan.steps.entries()) {
      const relative = step.gain / (step.value - step.gain) / step.cost
      expect(relative, `step ${step.step}`).toBeCloseTo(fixture.steps[index].roi, 6)
    }
  })

  it('says which upgrades it left out, and why', () => {
    const names = plan.excluded.map(entry => entry.sheetName)
    // The stone slot upgrades and the workshop enhancements cannot be on a
    // lab path. Their lab twins, the masteries and the echo all can, and are.
    expect(names).toContain('Assist Module Substats - Armor')
    expect(names).toContain('Health +')
    expect(names).not.toContain('Health Mastery')
    expect(names).not.toContain('Dissonant Echo - Defense')
    for (const entry of plan.excluded) expect(entry.reason.length).toBeGreaterThan(0)
  })
})

describe('planning against a developed account', () => {
  const developed: EffectiveHealthConfig = {
    ...EMPTY_ACCOUNT,
    health: { workshopValue: 250000, enhancementLevel: 40, relicPct: 0.2, vaultPct: 0.1 },
    defenseAbsolute: { workshopValue: 4000, enhancementLevel: 20, primarySubstat: 1.5 },
    defensePercent: { workshopValue: 0.1, primarySubstat: 0.02 },
    wallHealth: { workshopValue: 60000, enhancementLevel: 20, primarySubstat: 2 },
    maxRecovery: { workshopValue: 12, enhancementLevel: 10 },
    cards: {
      health: { has: true, value: 2.4, hasMastery: true },
      defenseAbsolute: { has: true, value: 1.8 },
      defensePercent: { has: true, value: 0.05, hasMastery: true },
    },
    wall: { has: true, primaryEffect: 2.5, assistEffect: 1.2 },
    recovery: { has: true },
    chronoField: { unlocked: true },
    chainThunder: { has: true, damageShare: 0.2 },
    deathWave: { hasHealth: true },
    enemiesAttackingTogether: 3,
  }

  it('spreads across more upgrades once they are unlocked', () => {
    const plan = planEffectiveHealthPath({
      config: developed,
      levels: ZERO_EFFECTIVE_HEALTH_LEVELS,
      variant: 'lab-time',
      steps: 60,
    })

    expect(plan.steps).toHaveLength(60)
    // A developed account has wall, recovery, chrono and chain in play, so a
    // path that still only bought Health would mean the model is not seeing
    // them.
    const chosen = new Set(plan.steps.map(step => step.name))
    expect(chosen.size).toBeGreaterThan(3)
    expect(plan.finalEffectiveHealth).toBeGreaterThan(plan.startingEffectiveHealth)
  })

  it('plans a coin path from the same state, and a different one', () => {
    const time = planEffectiveHealthPath({
      config: developed, levels: ZERO_EFFECTIVE_HEALTH_LEVELS, variant: 'lab-time', steps: 40,
    })
    const coins = planEffectiveHealthPath({
      config: developed, levels: ZERO_EFFECTIVE_HEALTH_LEVELS, variant: 'lab-coins', steps: 40,
    })

    expect(coins.steps).toHaveLength(40)
    // Same upgrades, different currency: the ordering should not be identical,
    // or one of the two cost functions is not being consulted.
    expect(coins.steps.map(s => `${s.name} ${s.level}`))
      .not.toEqual(time.steps.map(s => `${s.name} ${s.level}`))
  })

  it('respects a player-imposed target', () => {
    const plan = planEffectiveHealthPath({
      config: developed,
      levels: ZERO_EFFECTIVE_HEALTH_LEVELS,
      variant: 'lab-time',
      steps: 80,
      targetLevels: { health: 5 },
    })
    const healthSteps = plan.steps.filter(step => step.name === 'Health')
    expect(healthSteps.length).toBeLessThanOrEqual(5)
    for (const step of healthSteps) expect(step.level).toBeLessThanOrEqual(5)
  })

  it('starts from where the player already is, not from zero', () => {
    const partway: EffectiveHealthLevels = { ...ZERO_EFFECTIVE_HEALTH_LEVELS, health: 30 }
    const plan = planEffectiveHealthPath({
      config: developed, levels: partway, variant: 'lab-time', steps: 10,
    })
    for (const step of plan.steps.filter(s => s.name === 'Health')) {
      expect(step.level).toBeGreaterThan(30)
    }
  })
})

describe('the candidate list against the sheet', () => {
  /**
   * Each path's candidates, read off the sheet's own "UPDATE MATRIX" header
   * rows — `eHP!EA:EQ`, `eHP Stone!CH:CJ`, `eHP Coins!DL:DW`. A candidate
   * missing here is an upgrade the path silently never offers, which is
   * invisible in the output.
   */
  const offered = (variant: EffectiveHealthPathVariant) => EFFECTIVE_HEALTH_UPGRADES
    .filter(upgrade => upgrade.variants.includes(variant))
    .map(upgrade => upgrade.sheetName)

  it('offers the lab paths all eighteen', () => {
    expect(offered('lab-time')).toEqual([
      'Health',
      'Defense Absolute',
      'Defense %',
      'Wall Health',
      'Wall Fortification',
      'Recovery Package Max',
      'Standard Perks Bonus',
      'Improve Trade-Off Perks',
      'Chrono Field Reduction %',
      'Death Wave Health',
      'Chain Thunder',
      'Primary Module Bonus - Armor',
      'Health Mastery',
      'Extra Defense Mastery',
      'Assist Module Substats - Armor',
      'Assist Module Substats - Generator',
      'Assist Module Bonus - Armor',
      'Dissonant Echo - Defense',
    ])
    expect(offered('lab-coins')).toEqual(offered('lab-time'))
  })

  it('offers the stone path its three', () => {
    expect(offered('stone')).toEqual([
      'Assist Module Substats - Armor',
      'Assist Module Substats - Generator',
      'Assist Module Bonus - Armor',
    ])
  })

  it('offers the coin path all thirteen', () => {
    expect(offered('coin')).toEqual([
      'Primary Module Bonus - Armor',
      'Health Mastery',
      'Extra Defense Mastery',
      'Assist Module Substats - Armor',
      'Assist Module Substats - Generator',
      'Assist Module Bonus - Armor',
      'Dissonant Echo - Defense',
      'Primary Module - Armor',
      'Assist Module - Armor',
      'Health +',
      'Defense Absolute +',
      'Wall Health +',
      'Recovery Package +',
    ])
  })
})
