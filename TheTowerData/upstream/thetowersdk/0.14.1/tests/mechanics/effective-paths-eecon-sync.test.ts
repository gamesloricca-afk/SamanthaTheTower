import { describe, expect, it } from 'vitest'
import { syncMultiplier } from '../../src/mechanics/effective-paths/eecon-stats'
import type { SyncWeaponCycle } from '../../src/mechanics/effective-paths/types'
import fixtures from '../../fixtures/mechanics/effective-paths-eecon-sync.fixtures.json'

/**
 * `EPC_SYNC`, against the sheet's own array machinery.
 *
 * This is the one economy function that is a simulation rather than a formula:
 * it lays each coin weapon's cycle out second by second, folds each to its
 * per-phase average, and averages the product across the combined period. A
 * port of that is worth checking case by case rather than spot-checking, since
 * an off-by-one in where the uptime sits would still produce a plausible
 * number.
 */

interface SheetCase {
  gt: { on: boolean, m: number, d: number, cd: number }
  bh: { on: boolean, m: number, d: number, cd: number }
  dw: { on: boolean, m: number, d: number, cd: number }
  gb: { on: boolean, m: number, d: number, cd: number }
  sheet: number
}

const cycle = (w: SheetCase['gt']): SyncWeaponCycle => ({
  active: w.on, multiplier: w.m, duration: w.d, cooldown: w.cd,
})

const run = (c: SheetCase) => syncMultiplier({
  goldenTower: cycle(c.gt),
  blackHole: cycle(c.bh),
  deathWave: cycle(c.dw),
  goldBot: cycle(c.gb),
})

describe('EPC_SYNC', () => {
  const cases = fixtures as unknown as SheetCase[]

  it('has a fixture with something switched on in every case', () => {
    expect(cases.length).toBeGreaterThanOrEqual(15)
    for (const c of cases)
      expect(c.gt.on || c.bh.on || c.dw.on || c.gb.on).toBe(true)
  })

  for (const [index, c] of cases.entries()) {
    it(`matches case ${index}`, () => {
      expect(run(c)).toBeCloseTo(c.sheet, 9)
    })
  }
})

describe('what the shape of it means', () => {
  const off: SyncWeaponCycle = { active: false, multiplier: 1, duration: 0, cooldown: 1 }

  it('is one when nothing is running', () => {
    expect(syncMultiplier({})).toBe(1)
    expect(syncMultiplier({ goldenTower: off, blackHole: off })).toBe(1)
  })

  it('averages a lone weapon over its own cycle', () => {
    // Up for a quarter of a 100-second cycle at 5x: 75 seconds at 1 and 25 at
    // 5, so 2.
    expect(syncMultiplier({
      goldenTower: { active: true, multiplier: 5, duration: 25, cooldown: 100 },
    })).toBeCloseTo(2, 9)
  })

  it('counts a weapon that is always up as its full multiplier', () => {
    expect(syncMultiplier({
      goldenTower: { active: true, multiplier: 4, duration: 60, cooldown: 60 },
    })).toBeCloseTo(4, 9)
  })

  it('is worth more when two cycles can line up than when they cannot', () => {
    /**
     * The reason the phase averaging exists. Two weapons on cooldowns sharing a
     * divisor overlap on a fixed schedule; two coprime ones drift, and their
     * windows coincide only as often as chance allows.
     */
    const shared = syncMultiplier({
      goldenTower: { active: true, multiplier: 6, duration: 30, cooldown: 120 },
      blackHole: { active: true, multiplier: 6, duration: 30, cooldown: 60 },
    })
    const coprime = syncMultiplier({
      goldenTower: { active: true, multiplier: 6, duration: 30, cooldown: 121 },
      blackHole: { active: true, multiplier: 6, duration: 30, cooldown: 61 },
    })
    expect(shared).not.toBeCloseTo(coprime, 6)
  })
})
