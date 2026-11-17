import { describe, expect, it } from 'vitest'
import {
  computeDutyCycleOvershootPenalty,
  computeSecondarySyncedDurationPenalty,
  scoreBotMedalPrimaryLabSyncTiming,
  scoreBotMedalSecondarySyncTiming,
} from '../../src/mechanics/bots/medal-sync-scoring'

describe('scoreBotMedalSecondarySyncTiming', () => {
  it('rises with fit and overlap terms', () => {
    const low = scoreBotMedalSecondarySyncTiming({
      fitScore: 0.2,
      overlapOfTotalTimeFraction: 0.1,
      overlapOfBotUptimeFraction: 0.1,
      uptimeRatio: 0.4,
    })
    const high = scoreBotMedalSecondarySyncTiming({
      fitScore: 0.9,
      overlapOfTotalTimeFraction: 0.5,
      overlapOfBotUptimeFraction: 0.4,
      uptimeRatio: 0.7,
    })
    expect(high).toBeGreaterThan(low)
  })

  it('subtracts medal and lab penalties', () => {
    const base = scoreBotMedalSecondarySyncTiming({
      fitScore: 0.5,
      overlapOfTotalTimeFraction: 0.3,
      overlapOfBotUptimeFraction: 0.2,
      uptimeRatio: 0.5,
    })
    const penalized = scoreBotMedalSecondarySyncTiming({
      fitScore: 0.5,
      overlapOfTotalTimeFraction: 0.3,
      overlapOfBotUptimeFraction: 0.2,
      uptimeRatio: 0.5,
      medalPenalty: 2,
      labPenalty: 1,
    })
    expect(penalized).toBeCloseTo(base - 3, 6)
  })
})

describe('scoreBotMedalPrimaryLabSyncTiming', () => {
  it('penalizes harmony drift and added lab levels', () => {
    const clean = scoreBotMedalPrimaryLabSyncTiming({
      fitScore: 0.8,
      overlapOfBotUptimeFraction: 0.4,
      overlapOfBotBotUptimeFraction: 0.2,
      uptimeObjective: 1.2,
      cooldownGapPenalty: 0.05,
      harmonyCooldownGapDelta: 0,
      harmonyDurationGapDelta: 0,
      totalLabLevelsAdded: 0,
    })
    const drifted = scoreBotMedalPrimaryLabSyncTiming({
      fitScore: 0.8,
      overlapOfBotUptimeFraction: 0.4,
      overlapOfBotBotUptimeFraction: 0.2,
      uptimeObjective: 1.2,
      cooldownGapPenalty: 0.05,
      harmonyCooldownGapDelta: 0.2,
      harmonyDurationGapDelta: 0.15,
      totalLabLevelsAdded: 2,
    })
    expect(clean).toBeGreaterThan(drifted)
  })
})

describe('computeSecondarySyncedDurationPenalty', () => {
  it('penalizes synced rows that exceed primary duration lag allowance', () => {
    expect(computeSecondarySyncedDurationPenalty({
      rows: [{
        synced: true,
        durationLevel: 17,
        primaryDurationLevel: 20,
        maxLagLevels: 4,
      }],
    })).toBeCloseTo(0.35, 6)

    expect(computeSecondarySyncedDurationPenalty({
      rows: [{
        synced: true,
        durationLevel: 16,
        primaryDurationLevel: 20,
        maxLagLevels: 4,
      }],
    })).toBe(0)
  })
})

describe('computeDutyCycleOvershootPenalty', () => {
  it('penalizes duty cycles above target', () => {
    expect(computeDutyCycleOvershootPenalty({
      rows: [{ durationSeconds: 10, cooldownSeconds: 10, synced: true }],
      targetDuty: 0.92,
    })).toBeGreaterThan(0)

    expect(computeDutyCycleOvershootPenalty({
      rows: [{ durationSeconds: 8, cooldownSeconds: 10, synced: false }],
      targetDuty: 0.92,
    })).toBe(0)
  })
})
