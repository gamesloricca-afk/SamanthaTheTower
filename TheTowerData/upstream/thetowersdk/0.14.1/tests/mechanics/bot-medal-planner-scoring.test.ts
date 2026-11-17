import { describe, expect, it } from 'vitest'
import {
  aggregateBotMedalPlanObjective,
  computeOverlapPotentialScore,
  consolidatedSimulatedOverlap,
  getSustainedApplicationFactor,
} from '../../src/mechanics/bots/medal-planner-scoring'

const baseSnapshot = {
  baseNumber: 100,
  effectiveNumber: 140,
  uptimeFraction: 0.5,
  overlapFraction: 0.8,
  avgOverlapFraction: 0.4,
  avgOverlapDisplayFraction: 0.6,
  coverageFraction: 0.7,
  coverageScale: 1.2,
  // A near-maxed Bot Bot, so overlap carries close to its full weight here.
  botBotBonus: 1.9,
}

describe('consolidatedSimulatedOverlap', () => {
  it('combines temporal and spatial overlap', () => {
    expect(consolidatedSimulatedOverlap(baseSnapshot)).toBeCloseTo(0.4 * 0.8, 4)
  })
})

describe('computeOverlapPotentialScore', () => {
  it('rises with effectiveNumber and overlap', () => {
    const low = computeOverlapPotentialScore({ synced: false, isBotBot: false }, {
      ...baseSnapshot,
      effectiveNumber: 50,
      avgOverlapFraction: 0.05,
      overlapFraction: 0.05,
    })
    const high = computeOverlapPotentialScore({ synced: true, isBotBot: false }, baseSnapshot)
    expect(high).toBeGreaterThan(low)
  })
})

describe('getSustainedApplicationFactor', () => {
  it('reflects amplification from effectiveNumber', () => {
    const boosted = getSustainedApplicationFactor(baseSnapshot)
    const flat = getSustainedApplicationFactor({ ...baseSnapshot, effectiveNumber: 50 })
    expect(boosted).toBeGreaterThan(flat)
  })
})

describe('aggregateBotMedalPlanObjective', () => {
  it('weights totalScore and simulated overlap heavily', () => {
    const baseline = aggregateBotMedalPlanObjective({
      totalScore: 10,
      coordinationScore: 1,
      potentialScore: 2,
      timingHarmonyScore: 0.5,
      averageCadence: 1,
      pairwiseCycleAlignmentScore: 0.2,
      timingPairValue: 0.1,
      averageUptime: 0.5,
      uptimeFloor: 0.4,
      averageSimulatedOverlap: 0.1,
      averageCoverage: 0.5,
      averageCoverageScale: 1,
      averageRangeReach: 0.1,
      sustainedCoverageScore: 0.2,
      sharedPathContinuityScore: 0.1,
      priorityCoverageScore: 0.3,
      subsequentRangePressure: 0.05,
      priorityAnchorScore: 0.5,
      naturalSyncAlignmentScore: 0.2,
      unsyncedRangeShortfall: 0,
      secondarySyncedDurationPenalty: 0,
      dutyCycleOvershootPenalty: 0,
    })
    const improved = aggregateBotMedalPlanObjective({
      totalScore: 20,
      coordinationScore: 1,
      potentialScore: 2,
      timingHarmonyScore: 0.5,
      averageCadence: 1,
      pairwiseCycleAlignmentScore: 0.2,
      timingPairValue: 0.1,
      averageUptime: 0.5,
      uptimeFloor: 0.4,
      averageSimulatedOverlap: 0.35,
      averageCoverage: 0.5,
      averageCoverageScale: 1,
      averageRangeReach: 0.1,
      sustainedCoverageScore: 0.2,
      sharedPathContinuityScore: 0.1,
      priorityCoverageScore: 0.3,
      subsequentRangePressure: 0.05,
      priorityAnchorScore: 0.5,
      naturalSyncAlignmentScore: 0.2,
      unsyncedRangeShortfall: 0,
      secondarySyncedDurationPenalty: 0,
      dutyCycleOvershootPenalty: 0,
    })
    expect(improved).toBeGreaterThan(baseline)
  })

  it('subtracts duration lag and duty-cycle overshoot penalties', () => {
    const baseInput = {
      totalScore: 10,
      coordinationScore: 1,
      potentialScore: 2,
      timingHarmonyScore: 0.5,
      averageCadence: 1,
      pairwiseCycleAlignmentScore: 0.2,
      timingPairValue: 0.1,
      averageUptime: 0.5,
      uptimeFloor: 0.4,
      averageSimulatedOverlap: 0.1,
      averageCoverage: 0.5,
      averageCoverageScale: 1,
      averageRangeReach: 0.1,
      sustainedCoverageScore: 0.2,
      sharedPathContinuityScore: 0.1,
      priorityCoverageScore: 0.3,
      subsequentRangePressure: 0.05,
      priorityAnchorScore: 0.5,
      naturalSyncAlignmentScore: 0.2,
      unsyncedRangeShortfall: 0,
      secondarySyncedDurationPenalty: 0,
      dutyCycleOvershootPenalty: 0,
    }
    const penalized = aggregateBotMedalPlanObjective({
      ...baseInput,
      secondarySyncedDurationPenalty: 1.5,
      dutyCycleOvershootPenalty: 0.8,
    })
    expect(penalized).toBeLessThan(aggregateBotMedalPlanObjective(baseInput))
  })
})
