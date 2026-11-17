import { describe, expect, it } from 'vitest'
import fixture from '../../fixtures/mechanics/effective-paths-ehp-path.fixtures.json'
import { composeEffectiveHealth, effectiveHealth } from '../../src/mechanics/effective-paths/hp'
import { planPath } from '../../src/mechanics/effective-paths/planner'
import { type PathUpgrade } from '../../src/mechanics/effective-paths/types'
import { findEffectivePathsLabKey, labDurationDaysToReachLevel } from '../../src/mechanics/effective-paths/lab-costs'

/**
 * Replay the sheet's own eHP path and check we land on its numbers.
 *
 * `effective-paths-ehp-path.fixtures.json` is a 40-step path read off the live
 * spreadsheet, from an all-zero starting state. Four upgrades interleave in it:
 * Health, Standard Perks Bonus, Defense %, and Improve Trade-Off Perks.
 *
 * Two things are checked, and they fail for different reasons:
 *
 * - Replaying the sheet's *choices* and checking eHP after each one tests the
 *   stat model and how levels compose, with the cost tables out of the picture.
 * - Re-planning from scratch and checking we make the same *choices* tests the
 *   greedy loop and the lab durations that drive it.
 *
 * Four upgrades that each enter the formula differently, interleaved over forty
 * steps, is a far stronger check than any single-shot comparison: perturbing
 * the health lab coefficient by 0.0001 fails the first, and mismapping one lab
 * to the wrong catalog entry fails the second at step 2.
 */

/** The starting state the fixture was captured in. */
const BASE = {
  workshopHealth: 5,
  armor: 1.012,
  /** Standard Perks Bonus feeds both the health perk and the defense % perk. */
  hasPerk: true,
  hasCoinTradeOffPerk: true,
  hasRegenTradeOffPerk: true,
} as const

interface Levels {
  health: number
  standardPerksBonus: number
  defensePercent: number
  improvedTradeOff: number
}

function effectiveHealthFor(levels: Levels): number {
  const health = effectiveHealth({
    workshopValue: BASE.workshopHealth,
    labLevel: levels.health,
    hasHealthCard: false,
    cardValue: 1,
    hasCardMastery: false,
    masteryLevel: 0,
    workshopEnhancementLevel: 0,
    hasPerk: BASE.hasPerk,
    perkBonusLabLevel: levels.standardPerksBonus,
    hasCoinTradeOffPerk: BASE.hasCoinTradeOffPerk,
    hasRegenTradeOffPerk: BASE.hasRegenTradeOffPerk,
    relicPct: 0,
    vaultPct: 0,
    hasDeathWaveHealth: false,
    deathWaveHealthLevel: 0,
    dissonance: 1,
  })

  // Defense % here is the lab (0.2 points a level) plus the perk, which the
  // Standard Perks Bonus lab also scales.
  const defensePercent = 0.002 * levels.defensePercent
    + (BASE.hasPerk ? 0.04 * 5 * (1 + 0.01 * levels.standardPerksBonus) : 0)

  return composeEffectiveHealth({
    health,
    armor: BASE.armor,
    defenseAbsolute: 0,
    defensePercent,
    tradeOffReduction: 0.5 * (1 + 0.01 * levels.improvedTradeOff),
  })
}

const LEVEL_KEY: Record<string, keyof Levels> = {
  'Health': 'health',
  'Standard Perks Bonus': 'standardPerksBonus',
  'Defense %': 'defensePercent',
  'Improve Trade-Off Perks': 'improvedTradeOff',
}

describe('eHP path replay against the live sheet', () => {
  it('captured a path worth checking', () => {
    expect(fixture.steps.length).toBe(40)
    const chosen = new Set(fixture.steps.map(s => s.name))
    expect(chosen.size).toBeGreaterThan(1)
    for (const name of chosen) expect(LEVEL_KEY[name], `unmodelled upgrade: ${name}`).toBeDefined()
  })

  it('reproduces the starting eHP', () => {
    const start = effectiveHealthFor({
      health: 0, standardPerksBonus: 0, defensePercent: 0, improvedTradeOff: 0,
    })
    expect(start).toBeCloseTo(fixture.startingEffectiveHealth, 12)
  })

  it('reproduces the eHP after every one of the sheet\'s 40 steps', () => {
    const levels: Levels = {
      health: 0, standardPerksBonus: 0, defensePercent: 0, improvedTradeOff: 0,
    }

    for (const step of fixture.steps) {
      const key = LEVEL_KEY[step.name]
      levels[key] += 1

      // The sheet's own level column should agree with our running count.
      expect(levels[key], `step ${step.step} (${step.name}) level`).toBe(step.level)

      const actual = effectiveHealthFor(levels)
      expect(actual, `step ${step.step} (${step.name} -> ${step.level}) eHP`)
        .toBeCloseTo(step.value, 9)
    }
  })

  it('reproduces the sheet\'s ordering from lab durations alone', () => {
    // The time path scores by gain per day of lab research, so the cost is the
    // lab's duration. With the stat model and the catalog both in place, the
    // planner should now choose what the sheet chose, in the sheet's order —
    // including where it breaks off Health to take a perk and comes back.
    const upgrades: PathUpgrade[] = Object.keys(LEVEL_KEY).map(name => {
      const candidate = fixture.candidates.find(c => c.name === name)
      return {
        id: name,
        name,
        level: 0,
        maxLevel: candidate?.maxLevel ?? 100,
        targetLevel: candidate?.targetLevel ?? undefined,
      }
    })

    const path = planPath({
      upgrades,
      steps: fixture.steps.length,
      evaluate: current => {
        const snapshot: Levels = {
          health: 0, standardPerksBonus: 0, defensePercent: 0, improvedTradeOff: 0,
        }
        for (const [name, key] of Object.entries(LEVEL_KEY)) snapshot[key] = current.get(name) ?? 0
        return effectiveHealthFor(snapshot)
      },
      cost: (id, nextLevel) => {
        const key = findEffectivePathsLabKey(id)
        if (key === null) return Number.NaN
        return labDurationDaysToReachLevel(key, nextLevel) ?? Number.NaN
      },
    })

    expect(path.map(s => `${s.name} ${s.level}`))
      .toEqual(fixture.steps.map(s => `${s.name} ${s.level}`))

    for (const [i, step] of path.entries()) {
      expect(step.value, `step ${step.step} eHP`).toBeCloseTo(fixture.steps[i].value, 9)
      // The sheet reports ROI as relative gain over cost; ours is absolute.
      const relativeRoi = step.gain / (step.value - step.gain) / step.cost
      expect(relativeRoi, `step ${step.step} ROI`).toBeCloseTo(fixture.steps[i].roi, 6)
    }
  })

  /**
   * The same model under a cost function the sheet does not use, to pin the
   * invariants that must hold whatever the costs are: levels never pass a cap,
   * and no step is ever bought at a loss.
   */
  it('plans over the real eHP model without exceeding a cap or taking a loss', () => {
    const upgrades: PathUpgrade[] = Object.keys(LEVEL_KEY).map(name => {
      const candidate = fixture.candidates.find(c => c.name === name)
      return {
        id: name,
        name,
        level: 0,
        maxLevel: candidate?.maxLevel ?? 100,
        targetLevel: candidate?.targetLevel ?? undefined,
      }
    })

    // A flat cost of 1 makes this pure gain ordering rather than the sheet's
    // cost model, so the sequence differs by design. What must hold is that
    // every step is a real uncapped upgrade and the levels accumulate.
    const levels: Levels = {
      health: 0, standardPerksBonus: 0, defensePercent: 0, improvedTradeOff: 0,
    }
    const path = planPath({
      upgrades,
      steps: 40,
      evaluate: current => {
        const snapshot: Levels = { ...levels }
        for (const [name, key] of Object.entries(LEVEL_KEY)) {
          snapshot[key] = current.get(name) ?? 0
        }
        return effectiveHealthFor(snapshot)
      },
      cost: () => 1,
    })

    expect(path).toHaveLength(40)
    // Values must rise monotonically — every step is bought because it gains.
    for (let i = 1; i < path.length; i++) {
      expect(path[i].value).toBeGreaterThan(path[i - 1].value)
    }
    // And no step may exceed its cap.
    for (const step of path) {
      const candidate = fixture.candidates.find(c => c.name === step.name)
      const cap = candidate?.targetLevel ?? candidate?.maxLevel ?? Infinity
      expect(step.level).toBeLessThanOrEqual(cap)
    }
  })
})
