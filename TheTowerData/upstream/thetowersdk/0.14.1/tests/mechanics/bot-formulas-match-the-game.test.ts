import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BOT_BENEFIT_COOLDOWN_LAB_INDICES,
  BOT_BENEFIT_DURATION_LAB_INDICES,
  computeBotGetBenefit,
} from '../../src/mechanics/bots/get-benefit'
import { botBotAmplificationApplicationFraction } from '../../src/mechanics/bots/overlap'
import { botBotBoostedMultiplier } from '../../src/mechanics/bots/hit-multiplier'
import {
  botRoamRadius,
  botSpatialCoverageFraction,
  botWorldRadius,
} from '../../src/mechanics/bots/geometry'
import { botTowerFactor } from '../../src/mechanics/bots/effective-range'
import { FLAME_BOT_FIXED_DURATION_SECONDS } from '../../src/data/bots/data'
import { aggregateBotMedalPlanObjective, botBotAmplificationHeadroom, computeOverlapPotentialScore } from '../../src/mechanics/bots/medal-planner-scoring'
import { type BotMedalMetricSnapshot } from '../../src/mechanics/bots/types'
import { botMedalCoverageFraction } from '../../src/mechanics/bots/medal-simulation'

/**
 * Bot formulas checked against facts/v29.0.0/bot-formulas.json.
 * The fixture supplies benefit-slot dependencies, lab operations, durations,
 * amplification rules and geometry reference values used by the planner.
 */

const FACTS = path.resolve(__dirname, '../../facts/v29.0.0')

interface BotFormulaFact {
  gameVersion: string
  benefitFormula: { levelIndexDrivesSlots: Record<string, number[]> }
  labs: {
    cooldown: { operation: string, entries: Record<string, { slot: number }> }
    duration: { operation: string, entries: Record<string, { slot: number }> }
  }
  uptime: { flameDurationIsConstant: number }
  amplification: { amplified: string[], notAmplified: string[] }
  geometry: {
    sizeFactor: { base: number, span: number }
    worldRadius: { triggerColliderRadius: number }
    roamDisc: { factor: number }
  }
}

const fact = JSON.parse(
  readFileSync(path.join(FACTS, 'bot-formulas.json'), 'utf8'),
) as BotFormulaFact

describe('lab indices cover every bot the game gives a lab to', () => {
  const cooldownSlots = Object.values(fact.labs.cooldown.entries).map(e => e.slot).sort((a, b) => a - b)
  const durationSlots = Object.values(fact.labs.duration.entries).map(e => e.slot).sort((a, b) => a - b)

  it('cooldown labs reach all five bots', () => {
    // Missing a slot here does not fail anything downstream: the lab simply never applies,
    // and the cooldown reads a little high. On the Bot Bot that silently shrinks the
    // amplification every other bot depends on.
    const known = Object.values(BOT_BENEFIT_COOLDOWN_LAB_INDICES).sort((a, b) => a - b)
    expect(known).toEqual(cooldownSlots)
  })

  it('duration labs reach every bot that has one', () => {
    const known = Object.values(BOT_BENEFIT_DURATION_LAB_INDICES).sort((a, b) => a - b)
    expect(known).toEqual(durationSlots)
  })
})

describe('benefit follows base + perLevel * level', () => {
  it.each(Object.entries(fact.benefitFormula.levelIndexDrivesSlots))(
    'level index %s drives its slots',
    (_index, slots) => {
      for (const slot of slots) {
        const value = computeBotGetBenefit({
          baseBenefit: 20, benefitPerLevel: 2, level: 7, statIndex: slot,
        })
        expect(value).toBeCloseTo(20 + 2 * 7, 6)
      }
    },
  )

  it('the cooldown lab subtracts and the duration lab adds', () => {
    const cooldownSlot = Object.values(fact.labs.cooldown.entries)[0].slot
    const durationSlot = Object.values(fact.labs.duration.entries)[0].slot
    const withCooldownLab = computeBotGetBenefit({
      baseBenefit: 120, benefitPerLevel: -3, level: 0, statIndex: cooldownSlot,
      cooldownLab: { researchBase: 10, researchPerLevel: 0, selectedLevel: 0 },
    })
    const withDurationLab = computeBotGetBenefit({
      baseBenefit: 20, benefitPerLevel: 0.5, level: 0, statIndex: durationSlot,
      durationLabFlatBonus: 10,
    })
    expect(fact.labs.cooldown.operation).toBe('subtract')
    expect(fact.labs.duration.operation).toBe('add')
    expect(withCooldownLab).toBeCloseTo(110, 6)
    expect(withDurationLab).toBeCloseTo(30, 6)
  })
})

describe('Bot Bot amplification', () => {
  it('is the bonus alone, with no second multiplier', () => {
    // The game computes `stat * (botBotRange ? benefit[16] : 1)` — one boolean, one factor.
    // At full application the answer must be the bonus EXACTLY. A `maximumPower` term
    // folded in here made this 1.8 * 2.25 = 4.05, and every amplified stat with it.
    const bonus = 1.8
    expect(botBotBoostedMultiplier(bonus, 1)).toBeCloseTo(bonus, 6)
    expect(botBotBoostedMultiplier(bonus, 0)).toBeCloseTo(1, 6)
    expect(botBotBoostedMultiplier(bonus, 0.5)).toBeCloseTo(1 + (bonus - 1) * 0.5, 6)
  })

  it('takes only a bonus and a fraction, so nothing else can be multiplied in', () => {
    // Signature-level, deliberately: the old bug was possible because the function accepted
    // a second factor at all. Two parameters is the guarantee.
    expect(botBotBoostedMultiplier.length).toBe(2)
  })

  it('applies to the three bots the game amplifies and not to Flame damage reduction', () => {
    expect(fact.amplification.amplified.sort()).toEqual(
      ['Amplify bonus', 'Golden coin bonus', 'Thunder linger'],
    )
    expect(fact.amplification.notAmplified).toEqual(['Flame damage reduction'])
  })

  it('P is the product of a temporal and a spatial term', () => {
    expect(botBotAmplificationApplicationFraction({
      botBotBonus: 2, temporalOverlapFraction: 0.5, spatialOverlapFraction: 0.4,
    })).toBeCloseTo(0.2, 6)
  })
})

describe('uptime outranks overlap, because the game says so', () => {
  /**
   * A bot's average contribution is `base * [uptime + (bonus - 1) * overlap]`. Uptime
   * multiplies everything the bot does; overlap only gates the amplified part, and the Bot
   * Bot's Bonus caps at 2.0. So `(bonus - 1) <= 1` and overlap can at best equal uptime's
   * marginal value — never beat it.
   *
   * The planner had this inverted: overlap carried more objective weight than uptime AND
   * was multiplied into two other terms, so a plan could be preferred for lining bots up
   * rather than for having them switched on.
   */
  const snapshot = (over: Partial<BotMedalMetricSnapshot> = {}): BotMedalMetricSnapshot => ({
    baseNumber: 10,
    effectiveNumber: 3,
    uptimeFraction: 0.3,
    overlapFraction: 0.5,
    avgOverlapFraction: 0.2,
    avgOverlapDisplayFraction: 0.5,
    coverageFraction: 0.3,
    coverageScale: 1.2,
    botBotBonus: 1.5,
    ...over,
  })

  it('overlap headroom is exactly the game\'s (bonus - 1), and never exceeds 1', () => {
    expect(botBotAmplificationHeadroom(1.05)).toBeCloseTo(0.05, 6)
    expect(botBotAmplificationHeadroom(2)).toBeCloseTo(1, 6)
    // A Bonus below 1 or above the cap cannot make overlap worth more than uptime.
    expect(botBotAmplificationHeadroom(0.5)).toBe(0)
    expect(botBotAmplificationHeadroom(99)).toBe(1)
  })

  it('a point of uptime is worth at least as much as a point of overlap', () => {
    const row = { synced: false, isBotBot: false }
    const base = computeOverlapPotentialScore(row, snapshot())
    const moreUptime = computeOverlapPotentialScore(row, snapshot({ uptimeFraction: 0.4 }))
    const moreOverlap = computeOverlapPotentialScore(row, snapshot({ avgOverlapFraction: 0.3 }))
    expect(moreUptime - base).toBeGreaterThan(0)
    expect(moreUptime - base).toBeGreaterThanOrEqual(moreOverlap - base)
  })

  it('at a level-0 Bot Bot, overlap is worth almost nothing next to uptime', () => {
    const row = { synced: false, isBotBot: false }
    const weak = snapshot({ botBotBonus: 1.05 })
    const base = computeOverlapPotentialScore(row, weak)
    const moreUptime = computeOverlapPotentialScore(row, { ...weak, uptimeFraction: 0.4 })
    const moreOverlap = computeOverlapPotentialScore(row, { ...weak, avgOverlapFraction: 0.3 })
    expect(moreOverlap - base).toBeLessThan((moreUptime - base) * 0.2)
  })

  it('the Bot Bot\'s reach is worth only what its Bonus can amplify', () => {
    // The Bot Bot has no effect of its own, so widening its circle at a 1.05 Bonus
    // multiplies almost nothing. For any other bot the same reach covers enemies with that
    // bot's own effect and is worth full value.
    const weak = snapshot({ botBotBonus: 1.05, coverageScale: 1.6, coverageFraction: 0.6 })
    const asBotBot = computeOverlapPotentialScore({ synced: false, isBotBot: true }, weak)
    const asOtherBot = computeOverlapPotentialScore({ synced: false, isBotBot: false }, weak)
    expect(asBotBot).toBeLessThan(asOtherBot)

    // At a maxed Bonus the discount is gone: reach is fully worth buying.
    const strong = snapshot({ botBotBonus: 2, coverageScale: 1.6, coverageFraction: 0.6 })
    expect(computeOverlapPotentialScore({ synced: false, isBotBot: true }, strong))
      .toBeCloseTo(computeOverlapPotentialScore({ synced: false, isBotBot: false }, strong), 6)
  })

  it('the objective has no uptime or overlap term of its own', () => {
    // The invariant is structural now rather than a matter of weights. A bot is worth
    // `base * coverage * uptime * [1 + (bonus - 1) * overlap]`, and the objective scores
    // that value — so uptime is a FACTOR on everything while overlap only gates the
    // amplified part, and no arrangement of coefficients can invert them.
    //
    // It used to be a weight comparison because uptime and overlap were separate additive
    // signals sitting beside the value, offering a second opinion about quantities the
    // value already contained. They disagreed with it, and being linear where the value is
    // logarithmic, they won.
    const flat = {
      totalScore: 0, coordinationScore: 0, potentialScore: 0, timingHarmonyScore: 0,
      averageCadence: 0, pairwiseCycleAlignmentScore: 0, timingPairValue: 0,
      averageUptime: 0, uptimeFloor: 0, averageSimulatedOverlap: 0,
      sustainedCoverageScore: 0, sharedPathContinuityScore: 0, priorityCoverageScore: 0,
      averageCoverage: 0, priorityAnchorScore: 0, naturalSyncAlignmentScore: 0,
      unsyncedRangeShortfall: 0, secondarySyncedDurationPenalty: 0,
      dutyCycleOvershootPenalty: 0,
    }
    const base = aggregateBotMedalPlanObjective(flat)
    expect(aggregateBotMedalPlanObjective({ ...flat, averageUptime: 1 })).toBe(base)
    expect(aggregateBotMedalPlanObjective({ ...flat, averageSimulatedOverlap: 1 })).toBe(base)
    expect(aggregateBotMedalPlanObjective({ ...flat, averageCoverage: 1 })).toBe(base)
    expect(aggregateBotMedalPlanObjective({ ...flat, priorityCoverageScore: 1 })).toBe(base)

    // The value is what moves it.
    expect(aggregateBotMedalPlanObjective({ ...flat, totalScore: 1 })).toBeGreaterThan(base)
  })
})

describe('coverage is a fraction, and nothing may treat it as a scale', () => {
  /**
   * `botMedalCoverageFraction` ends in `Math.min(1, …)`, so it is a share of the arena and
   * can never exceed 1. Five planner heuristics were written against it as though it were a
   * scale around an anchor — `Math.max(0, coverageScale - 1)` and `Math.max(1, coverageScale)`
   * — which made two objective terms permanently zero, one penalty permanently inert, and
   * two multipliers permanently 1. Nothing failed; the terms simply never did anything.
   *
   * This is the check that would have caught it: if a future change makes coverage an
   * anchor-relative scale (`getBotEffectiveRangeScale` is one, and CAN exceed 1), this test
   * fails and the heuristics written against it have to be revisited deliberately.
   */
  it('never exceeds 1, over a wide sweep of range and tower reach', () => {
    let max = 0
    for (const range of [1, 10, 20, 30, 60, 90, 200, 1000, 100000]) {
      for (const tower of [1, 10, 30, 60, 120, 500]) {
        max = Math.max(max, botMedalCoverageFraction(range, tower, 0))
      }
    }
    expect(max).toBeLessThanOrEqual(1)
    // Stated explicitly so the consequence is impossible to miss on a future read.
    expect(Math.max(0, max - 1)).toBe(0)
  })
})

describe('a bot\'s value is a product, so duration and cooldown cannot be starved', () => {
  /**
   * `value ∝ base × coverage × uptime × [1 + (bonus - 1) × overlap]`.
   *
   * Coverage and uptime are both plain factors, so neither can be structurally outranked by
   * the other — whichever is proportionally further behind earns the next medal. The planner
   * used to put uptime inside `log1p(effectiveNumber)` and coverage outside it as linear
   * terms; a linear term always overtakes a logarithmic one, so range outbid Duration and
   * Cooldown at every level, which is what players reported.
   */
  it('the same proportional gain is worth the same from either factor', () => {
    const value = (coverage: number, uptime: number) => coverage * uptime
    const base = value(0.2, 0.2)
    const tenPctMoreCoverage = value(0.22, 0.2)
    const tenPctMoreUptime = value(0.2, 0.22)
    expect(tenPctMoreCoverage).toBeCloseTo(tenPctMoreUptime, 12)
    expect(tenPctMoreCoverage / base).toBeCloseTo(1.1, 12)
  })

  it('the objective no longer carries the two provably-zero range terms', () => {
    // They were `averageRangeReach * 10` and `subsequentRangePressure * 4`. Passing an
    // object without them must still type-check and score, which it does by construction
    // here — the fields are gone from the input type.
    const scored = aggregateBotMedalPlanObjective({
      totalScore: 1, coordinationScore: 0, potentialScore: 0, timingHarmonyScore: 0,
      averageCadence: 0, pairwiseCycleAlignmentScore: 0, timingPairValue: 0,
      averageUptime: 0, uptimeFloor: 0, averageSimulatedOverlap: 0,
      sustainedCoverageScore: 0, sharedPathContinuityScore: 0, priorityCoverageScore: 0,
      averageCoverage: 0, priorityAnchorScore: 0, naturalSyncAlignmentScore: 0,
      unsyncedRangeShortfall: 0, secondarySyncedDurationPenalty: 0,
      dutyCycleOvershootPenalty: 0,
    })
    expect(scored).toBe(10)
  })
})

describe('the geometry constants are the game\'s', () => {
  it('size factor runs 0.7 to 1.3', () => {
    expect(fact.geometry.sizeFactor.base).toBeCloseTo(0.7, 4)
    expect(fact.geometry.sizeFactor.base + fact.geometry.sizeFactor.span).toBeCloseTo(1.3, 4)
  })

  it('every bot trigger is a half-unit circle, and the roam factor is 1.3', () => {
    expect(fact.geometry.worldRadius.triggerColliderRadius).toBe(0.5)
    expect(fact.geometry.roamDisc.factor).toBeCloseTo(1.3, 4)
  })

  it('Flame has no duration stat and uses a fixed three seconds', () => {
    expect(fact.uptime.flameDurationIsConstant).toBe(3)
    expect(FLAME_BOT_FIXED_DURATION_SECONDS).toBe(fact.uptime.flameDurationIsConstant)
  })

  it('matches the size-law reference values', () => {
    // `botTowerFactor` is the SDK's existing implementation of the same law, reused here
    // rather than duplicated. At tower range 12, the range-60 reference bot
    // scales 7.8, so its radius is half that.
    expect(botTowerFactor(0)).toBeCloseTo(0.7, 5)
    expect(botTowerFactor(3)).toBeCloseTo(0.7, 5)
    expect(botTowerFactor(7.5)).toBeCloseTo(1.0, 5)
    expect(botTowerFactor(12)).toBeCloseTo(1.3, 5)
    expect(botTowerFactor(24)).toBeCloseTo(1.3, 5)
    expect(botWorldRadius(60, 12)).toBeCloseTo(3.9, 5)
    expect(botWorldRadius(20, 0)).toBeCloseTo(0.7, 5)
    expect(botRoamRadius(12)).toBeCloseTo(1.3 * Math.sqrt(12), 5)
  })

  it('range moves coverage a great deal, which is the point of measuring it', () => {
    // A flat overlap constant flattens exactly this. Bot Bot Range is the input that moves
    // the amplification three other bots depend on.
    const low = botSpatialCoverageFraction(20, 12)
    const high = botSpatialCoverageFraction(60, 12)
    expect(low).toBeLessThan(0.1)
    expect(high).toBeGreaterThan(0.7)
    expect(high / low).toBeGreaterThan(8)
  })
})
