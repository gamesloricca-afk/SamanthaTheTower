import { describe, expect, it } from 'vitest'
import { describeBotMedalUpgradeInsight } from '../../src/mechanics/bots/medal-planner-insights'

/**
 * Coverage is a FRACTION of the bot's roam disc, so it lives in 0..1.
 *
 * This fixture used to carry a `coverageScale` of 1.05 rising to 1.18 — values coverage
 * cannot take. It was the only place those numbers appeared, and it made a
 * `Math.max(0, coverage - 1)` term elsewhere look like it did something when it was
 * structurally zero for every bot at every level. A fixture that cannot occur will happily
 * vouch for code that never runs.
 */
const baseMetrics = {
  effectiveNumber: 10,
  uptimeFraction: 0.4,
  avgOverlapFraction: 0.2,
  coverageFraction: 0.5,
}

describe('describeBotMedalUpgradeInsight', () => {
  it('describes range coverage expansion', () => {
    const label = describeBotMedalUpgradeInsight({
      botLabel: 'Amplify Bot',
      statName: 'Range',
      upgradeKind: 'base',
      objectiveDelta: 1.2,
      before: baseMetrics,
      after: {
        ...baseMetrics,
        coverageFraction: 0.68,
      },
    })
    expect(label).toContain('coverage')
    expect(label).toContain('0.50')
    expect(label).toContain('0.68')
  })

  it('describes cooldown overlap alignment', () => {
    const label = describeBotMedalUpgradeInsight({
      botLabel: 'Golden Bot',
      statName: 'Cooldown',
      upgradeKind: 'base',
      objectiveDelta: 0.8,
      before: baseMetrics,
      after: {
        ...baseMetrics,
        avgOverlapFraction: 0.31,
        uptimeFraction: 0.48,
      },
      botBotOverlapBefore: 0.18,
      botBotOverlapAfter: 0.27,
    })
    expect(label).toContain('Bot Bot')
    expect(label).toContain('overlap')
  })

  it('describes wildfire plus with Singularity Harness', () => {
    const label = describeBotMedalUpgradeInsight({
      botLabel: 'Flame Bot',
      statName: 'Wildfire+',
      upgradeKind: 'plus',
      objectiveDelta: 2,
      before: baseMetrics,
      after: { ...baseMetrics, effectiveNumber: 12.5 },
      singularityHarnessActive: true,
    })
    expect(label).toContain('Wildfire+')
    expect(label).toContain('Singularity Harness')
  })
})
