import { describe, expect, it } from 'vitest'

import { moduleCoinsKillBonusFromSubstats, parseModuleSubstatMultiplierAdd } from '../../src/mechanics/resource-drops/coin-module-cpk'

describe('resource-drops-coin-module-cpk', () => {
  it('parses +0.4x substat display values', () => {
    expect(parseModuleSubstatMultiplierAdd('+0.4x')).toBe(0.4)
  })

  it('combines primary and assist substats with substat efficiency', () => {
    expect(moduleCoinsKillBonusFromSubstats(0.3, 0.5, 100, 0)).toBeCloseTo(0.3 + 0.5 * 1.01, 6)
  })
})
