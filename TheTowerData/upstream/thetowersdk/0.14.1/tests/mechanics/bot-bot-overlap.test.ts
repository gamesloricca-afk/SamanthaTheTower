import { describe, expect, it } from 'vitest'
import {
  applyEnemyBotRangeEnter,
  applyEnemyBotRangeExit,
  botBotAmplificationApplicationFraction,
  computeAverageAmplifiedBotMetric,
  EMPTY_ENEMY_BOT_RANGE_FLAGS,
} from '../../src/mechanics/bots/overlap'

describe('enemy bot range flags', () => {
  it('sets and clears stun bot range', () => {
    const entered = applyEnemyBotRangeEnter(EMPTY_ENEMY_BOT_RANGE_FLAGS, 'stunBot')
    expect(entered.stunBotRange).toBe(true)
    const exited = applyEnemyBotRangeExit(entered, 'stunBot')
    expect(exited.stunBotRange).toBe(false)
  })

  it('sets amplify lightning flag for amplify bot enemy collider', () => {
    const flags = applyEnemyBotRangeEnter(EMPTY_ENEMY_BOT_RANGE_FLAGS, 'amplifyBotEnemy')
    expect(flags.amplifyLightning).toBe(true)
  })
})

describe('computeAverageAmplifiedBotMetric', () => {
  it('interpolates overlap gain linearly', () => {
    expect(computeAverageAmplifiedBotMetric(100, 200, 0.5, 0)).toBe(50)
    expect(computeAverageAmplifiedBotMetric(100, 200, 0.5, 1)).toBe(150)
    expect(computeAverageAmplifiedBotMetric(100, 200, 0.5, 0.5)).toBe(100)
  })
})

describe('botBotAmplificationApplicationFraction', () => {
  it('multiplies temporal and spatial overlap', () => {
    expect(botBotAmplificationApplicationFraction({
      botBotBonus: 1.5,
      temporalOverlapFraction: 0.5,
      spatialOverlapFraction: 0.8,
    })).toBeCloseTo(0.4, 4)
  })
})
