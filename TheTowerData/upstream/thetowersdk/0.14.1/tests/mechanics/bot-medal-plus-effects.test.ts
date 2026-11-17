import { describe, expect, it } from 'vitest'
import { getBotPlusLevelMultiplier, getFlameWildfireShDamageSupport } from '../../src/mechanics/bots/medal-plus-effects'

describe('bot medal plus effects', () => {
  it('parses bot+ multiplier table values', () => {
    expect(getBotPlusLevelMultiplier({ name: 'Wildfire', levels: [{ level: 0, value: '1.5x' }] }, 0)).toBe(1.5)
  })

  it('adds wildfire SH support when active', () => {
    const support = getFlameWildfireShDamageSupport({
      plusLevel: 5,
      plusStat: { name: 'Wildfire', levels: [{ level: 0, value: '1.5x' }, { level: 5, value: '2.0x' }] },
      flameCoverageFraction: 0.5,
      singularityHarnessActive: true,
    })
    expect(support).toBeGreaterThan(0)
  })
})
