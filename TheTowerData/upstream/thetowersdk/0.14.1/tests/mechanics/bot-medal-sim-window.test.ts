import { describe, expect, it } from 'vitest'
import {
  BOT_MEDAL_SIM_DURATION_SECONDS,
  botMedalInteractionWindowSeconds,
  simulateBotMedalInteraction,
} from '../../src/mechanics/bots/medal-simulation'

/**
 * The interaction window has to be long enough to measure the pair it is measuring.
 *
 * Two bots on unequal cooldowns co-activate on their beat period. A fixed half-hour window is
 * 15 cycles at a 120 s cooldown, which does not sample that period — it samples wherever the
 * window happens to land in it, and for many pairs that is somewhere they never coincide.
 *
 * This is a planted-fault test: it asserts the failure at the old window and its absence at
 * the new one, so it cannot pass by accident if the window is quietly reduced again.
 */
function overlapAt(botBotCooldownSeconds: number, durationSeconds?: number): number {
  return simulateBotMedalInteraction({
    otherBotLabel: 'Golden Bot',
    otherDurationSeconds: 20,
    otherCooldownSeconds: 120,
    otherRangeMeters: 20,
    botBotDurationSeconds: 20,
    botBotCooldownSeconds,
    botBotRangeMeters: 20,
    sharedPath: false,
    arenaRadiusMeters: 60,
    durationSeconds,
  }).conditionedSpatialOverlapFraction
}

const COOLDOWNS = [120, 117, 114, 111, 108, 105, 90, 75]

describe('interaction window', () => {
  it('scales with the slower cooldown rather than being one fixed half-hour', () => {
    expect(botMedalInteractionWindowSeconds(120, 120)).toBeGreaterThan(BOT_MEDAL_SIM_DURATION_SECONDS)
    // A pair of fast bots still gets at least the floor.
    expect(botMedalInteractionWindowSeconds(1, 1)).toBe(BOT_MEDAL_SIM_DURATION_SECONDS)
  })

  it('the old fixed window reported no overlap at all for ordinary cooldowns', () => {
    // The fault, planted. Buying cooldown levels moved 120 -> 117 -> 114, and each step looked
    // like it destroyed the Bot Bot's amplification outright.
    const zeros = COOLDOWNS.filter(cd => overlapAt(cd, BOT_MEDAL_SIM_DURATION_SECONDS) === 0)
    expect(zeros.length).toBeGreaterThan(0)
  })

  it('never reports zero overlap for two bots that plainly do overlap', () => {
    for (const cd of COOLDOWNS) {
      const overlap = overlapAt(cd)
      expect(overlap, `cooldown ${cd} reported no overlap`).toBeGreaterThan(0.01)
      expect(overlap).toBeLessThanOrEqual(1)
    }
  })
})
