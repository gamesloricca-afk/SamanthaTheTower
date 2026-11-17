import { describe, expect, it } from 'vitest'

import { COOLDOWN_SYNC_TARGETS } from '../../src/knowledge/compartments/footguns'
import { uwStoneChartData } from '../../src/data/ultimate-weapons/stones.data'

/**
 * The cooldown sync floors, checked against the stone chart.
 *
 * Three of these were carried as `unverified` wiki claims: the seconds Black
 * Hole, Death Wave and Golden Tower reach at maximum stones. They are not
 * unverifiable — the stone chart is shipped data this package already owns and
 * prices every cooldown level. They are now derived from it.
 *
 * The literals below are the point of the test. `COOLDOWN_SYNC_TARGETS` reads
 * the chart, so comparing it to the chart again would restate the
 * implementation and pass forever. These are the wiki's numbers, written out,
 * so the test fails if either source moves.
 */
const WIKI_STATED_FLOORS = {
  blackHoleSeconds: 50,
  deathWaveSeconds: 50,
  goldenTowerSeconds: 100,
} as const

describe('cooldown sync floors', () => {
  it('agrees with the wiki figures it replaced', () => {
    expect(COOLDOWN_SYNC_TARGETS.blackHoleSeconds).toBe(WIKI_STATED_FLOORS.blackHoleSeconds)
    expect(COOLDOWN_SYNC_TARGETS.deathWaveSeconds).toBe(WIKI_STATED_FLOORS.deathWaveSeconds)
    expect(COOLDOWN_SYNC_TARGETS.goldenTowerSeconds).toBe(WIKI_STATED_FLOORS.goldenTowerSeconds)
  })

  it('takes the minimum of the ladder, not its last row', () => {
    // A cooldown ladder descends, so the last row is usually the smallest — but
    // relying on that makes the derivation depend on row order. This checks the
    // chart really does bottom out where the claim says.
    for (const [weapon, expected] of [
      ['black_hole', WIKI_STATED_FLOORS.blackHoleSeconds],
      ['death_wave', WIKI_STATED_FLOORS.deathWaveSeconds],
      ['golden_tower', WIKI_STATED_FLOORS.goldenTowerSeconds],
    ] as const) {
      const stat = uwStoneChartData[weapon]?.stats.find(entry => entry.name === 'Cooldown')
      expect(stat, weapon).toBeTruthy()
      const values = (stat?.levels ?? []).map(level => Number.parseFloat(String(level.value)))
      expect(values.length, weapon).toBeGreaterThan(5)
      expect(Math.min(...values), weapon).toBe(expected)
    }
  })

  it('keeps Golden Tower apart from the other two', () => {
    // The sync claim is that things converge, and Golden Tower does not
    // converge to the same number. A model that assumes one floor for every
    // ultimate lines up three windows that never line up.
    expect(COOLDOWN_SYNC_TARGETS.goldenTowerSeconds)
      .toBeGreaterThan(COOLDOWN_SYNC_TARGETS.blackHoleSeconds)
    expect(COOLDOWN_SYNC_TARGETS.blackHoleSeconds).toBe(COOLDOWN_SYNC_TARGETS.deathWaveSeconds)
    expect(COOLDOWN_SYNC_TARGETS.botsExceptFlameSeconds)
      .toBe(COOLDOWN_SYNC_TARGETS.blackHoleSeconds)
  })
})
