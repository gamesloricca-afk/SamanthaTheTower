import { describe, expect, it } from 'vitest'
import { computeEffectiveRegen, EFFECTIVE_REGEN_UPGRADES, planEffectiveRegenPath, ZERO_EFFECTIVE_REGEN_LEVELS } from '../../src/mechanics/effective-paths/regen-plan'
import { type EffectiveRegenConfig } from '../../src/mechanics/effective-paths/types'
import { effectiveRegen, effectiveWallRegen } from '../../src/mechanics/effective-paths/hp'
import { effectiveHealthPerks, ZERO_EFFECTIVE_HEALTH_LEVELS } from '../../src/mechanics/effective-paths/ehp-model'
import { type EffectiveHealthConfig } from '../../src/mechanics/effective-paths/types'
import fixtures from '../../fixtures/mechanics/effective-paths-regen.fixtures.json'

/**
 * The regen path, against the live sheet.
 *
 * The fixture holds 30 randomised states evaluated by the real `EPH_REGEN` and
 * `EPH_WALL_REGEN` in the spreadsheet, so this checks our stat layer against
 * the sheet rather than against itself.
 */

type FixtureCase = typeof fixtures.cases[number]

describe('regen stats against the sheet', () => {
  it('has states worth checking', () => {
    expect(fixtures.cases.length).toBe(30)
    const varied = (pick: (c: FixtureCase) => boolean) =>
      fixtures.cases.some(pick) && fixtures.cases.some(c => !pick(c))
    expect(varied(c => c.hasCard)).toBe(true)
    expect(varied(c => c.hasRto)).toBe(true)
    expect(varied(c => c.hasSwm)).toBe(true)
  })

  for (const [index, c] of fixtures.cases.entries()) {
    it(`matches the sheet on state ${index}`, () => {
      const ours = effectiveRegen({
        workshopValue: c.wsVal,
        labLevel: c.labLvl,
        hasRegenCard: c.hasCard,
        cardValue: 1.2 + 0.2 * c.cardLvl,
        hasCardMastery: c.hasMastery,
        masteryLevel: c.masteryLvl,
        stoneSubstatCap: c.stoneSac,
        labSubstatCap: c.labSac,
        primarySubstat: c.primSub,
        assistSubstat: c.assSub,
        workshopEnhancementLevel: c.wse,
        hasPerk: c.hasPerk,
        perkBonusLabLevel: c.spb,
        hasEnemyHealthTradeOffPerk: c.hasRgnTo,
        hasRegenTradeOffPerk: c.hasRto,
        improveTradeOffPerksLabLevel: c.ito,
        relicPct: c.relic,
        vaultPct: c.vault,
        hasSecondWindMastery: c.hasSwm,
        secondWindMasteryLevel: c.swmLvl,
      })
      expect(Math.abs(ours / c.sheetRegen - 1)).toBeLessThan(1e-9)

      const wall = effectiveWallRegen({
        labLevel: c.wallLvl, primaryEffect: c.primEff, assistEffect: c.assEff,
      })
      expect(Math.abs(wall - c.sheetWallRegen)).toBeLessThan(1e-9)
    })
  }
})

const EHEALTH: EffectiveHealthConfig = {
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
  armor: { primaryBonus: 1, hasAssist: false, assistBonus: 1 },
  wall: { has: true, primaryEffect: 1.2, assistEffect: 0 },
  recovery: { has: false },
  perks: effectiveHealthPerks({ apply: true, healthRegen: true }),
  chronoField: { unlocked: false },
  chainThunder: { has: false, damageShare: 0 },
  deathWave: { hasHealth: false },
  enemiesAttackingTogether: 1,
  dissonance: { active: false, tierPersonalBest: 0, allTierPersonalBests: [] },
}

const REGEN: EffectiveRegenConfig = {
  healthRegen: { workshopValue: 12 },
  card: { has: false, value: 1 },
  hasSecondWindMastery: false,
}

const ZERO = { ...ZERO_EFFECTIVE_HEALTH_LEVELS, ...ZERO_EFFECTIVE_REGEN_LEVELS }

describe('the regen path', () => {
  it('offers the seven candidates the sheet offers, in its order', () => {
    expect(EFFECTIVE_REGEN_UPGRADES.map(entry => entry.sheetName)).toEqual([
      'Health Regen',
      'Wall Regen',
      'Standard Perks Bonus',
      'Improve Trade-off Perks',
      'Health Regen Mastery',
      'Second Wind Mastery',
      'Assist Module Substats - Armor',
    ])
  })

  it('is worth nothing until the wall regen lab exists', () => {
    // `EPH_WALL_REGEN` is `10% * level`, and the sheet multiplies by it, so a
    // player with no Wall Regen has an effective regen of zero.
    expect(computeEffectiveRegen(REGEN, EHEALTH, ZERO).effectiveRegen).toBe(0)
    expect(computeEffectiveRegen(REGEN, EHEALTH, { ...ZERO, wallRegen: 1 }).effectiveRegen)
      .toBeGreaterThan(0)
  })

  it('buys Wall Regen first, because nothing else pays until it exists', () => {
    const plan = planEffectiveRegenPath({
      config: REGEN, eHealth: EHEALTH, levels: ZERO, variant: 'lab-time', steps: 10,
    })
    expect(plan.steps[0].name).toBe('Wall Regen')
    expect(plan.finalEffectiveRegen).toBeGreaterThan(plan.startingEffectiveRegen)
  })

  it('continues from where the player already is', () => {
    const partway = { ...ZERO, wallRegen: 5, healthRegen: 12 }
    const plan = planEffectiveRegenPath({
      config: REGEN, eHealth: EHEALTH, levels: partway, variant: 'lab-time', steps: 6,
    })
    for (const step of plan.steps.filter(s => s.name === 'Health Regen')) {
      expect(step.level).toBeGreaterThan(12)
    }
  })

  it('charges coins on the coin variant, and days on the time one', () => {
    const options = {
      config: REGEN, eHealth: EHEALTH, levels: { ...ZERO, wallRegen: 3 }, steps: 4,
    } as const
    const days = planEffectiveRegenPath({ ...options, variant: 'lab-time' })
    const coins = planEffectiveRegenPath({ ...options, variant: 'lab-coins' })
    expect(coins.steps[0].cost).toBeGreaterThan(days.steps[0].cost)
  })

  it('leaves out an upgrade it is told is locked, and says so', () => {
    const plan = planEffectiveRegenPath({
      config: REGEN,
      eHealth: EHEALTH,
      levels: ZERO,
      variant: 'lab-time',
      steps: 5,
      excludeKeys: ['wallRegen'],
    })
    expect(plan.excluded.map(entry => entry.sheetName)).toContain('Wall Regen')
    expect(plan.steps.every(step => step.name !== 'Wall Regen')).toBe(true)
  })
})
