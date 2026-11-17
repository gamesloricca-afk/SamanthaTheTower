import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import workshop from '../../src/data/workshop/table.json'
import { getWorkshopStatDefinitionByKey } from '../../src/data/workshop/progress-definitions'

/**
 * Checks our workshop stat curves against the Effective Paths reference.
 *
 * The tab carries six of the forty-eight stats we ship, at every one of 6001
 * levels, which is the deepest single check in this set -- and the one most
 * worth having, since a workshop curve that drifts at level 4000 is invisible
 * to anyone not standing there.
 */

interface WorkshopReference {
  stats: Record<string, Array<number | null>>
}

const reference = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'fixtures', 'data', 'effective-paths-workshop.json'), 'utf8'),
) as WorkshopReference

const ourWorkshop = workshop as unknown as Record<string, Record<string, { value: number }>>

describe('workshop stats against the Effective Paths reference', () => {
  it('names stats we actually carry', () => {
    for (const stat of Object.keys(reference.stats)) {
      expect(ourWorkshop[stat], `workshop.json has no "${stat}"`).toBeDefined()
    }
  })

  it('agrees on every stat value at every level', () => {
    const mismatches: string[] = []
    let compared = 0

    for (const [stat, values] of Object.entries(reference.stats)) {
      const ours = ourWorkshop[stat]
      if (!ours) continue

      for (let level = 0; level < values.length; level += 1) {
        const theirs = values[level]
        if (theirs === null) continue
        const record = ours[String(level)]
        if (!record) continue
        const our = Number(record.value)
        if (!Number.isFinite(our)) continue
        compared += 1

        // The sheet quotes three significant figures (5.88E+00 for our 5.877),
        // so compare relatively. Zero is exact on both sides.
        if (theirs === 0 || our === 0) {
          if (theirs !== our) mismatches.push(`${stat} L${level}: ours=${our} reference=${theirs}`)
          continue
        }
        const drift = Math.abs(our - theirs) / Math.max(Math.abs(our), Math.abs(theirs))
        if (drift >= 0.005) {
          mismatches.push(`${stat} L${level}: ours=${our} reference=${theirs} (${(drift * 100).toFixed(2)}%)`)
        }
      }
    }

    // Report a handful rather than thousands if a whole curve shifts.
    expect(mismatches.slice(0, 10)).toEqual([])
    expect(mismatches).toHaveLength(0)
    // Not 6 x 6001: the stats cap at different levels. Damage, Health and
    // Health Regen run to 6000, Defense Absolute to 5000, Damage / Meter to
    // 200 and Lifesteal to 80, which is 23286 values.
    expect(compared).toBeGreaterThanOrEqual(23000)
  })

  it('caps each stat at the same level the reference does', () => {
    // Our level counts match the reference exactly for all six, which is worth
    // asserting on its own -- a curve that runs too far is as wrong as one that
    // carries bad values, and it would not show up as a mismatch above.
    for (const [stat, values] of Object.entries(reference.stats)) {
      const ours = ourWorkshop[stat]
      if (!ours) continue
      expect(Object.keys(ours), stat).toHaveLength(values.length)
    }
  })
})

describe('Wall Health costs against the original 29.1.3 APK', () => {
  const native = JSON.parse(
    readFileSync(join(__dirname, '..', '..', 'fixtures', 'data', 'wall-health-native-29.1.3.json'), 'utf8'),
  ) as { nativeSha256: string; baseCoinCosts: number[]; baseCashCosts: number[] }
  const wall = workshop['Wall Health'] as Record<string, { value: number; cash: number; coins: number }>

  it('prices every next-level purchase from the native replay, including the cap', () => {
    // Independent ARM64 execution output, not a formula reconstructed from this table.
    // Whole-coin rounding preserves this table's existing representation; Android libm
    // last-bit parity is not claimed; the fixture records replay limitations.
    expect(native.nativeSha256).toBe('ebd443c219564a52fac8995a1ed40b611d1522e4e60534eb76d17772bd296919')
    expect(native.baseCoinCosts).toHaveLength(1801)
    expect(Object.keys(wall)).toHaveLength(1801)
    const mismatches = native.baseCoinCosts.flatMap((cost, level) =>
      wall[String(level)]?.coins === Math.round(cost) ? [] : [level])
    expect(mismatches).toEqual([])
    expect(wall['0'].coins).toBe(8_000_000)
    expect(wall['1'].coins).toBe(8_200_003) // The old 400k term charged 8,400,003.
    expect(wall['1800'].coins).toBe(0)
  })

  it('exposes the corrected ladder to workshop stat consumers', () => {
    const stat = getWorkshopStatDefinitionByKey('Wall Health')
    expect(stat?.maxLevel).toBe(1800)
    expect(stat?.levels.map(row => row.coins)).toEqual(native.baseCoinCosts.map(Math.round))
    expect(stat?.levels.reduce((total, row) => total + row.coins, 0)).toBe(3_211_238_307_356_109)
    expect(stat?.levels[0].value).toBe(20)
    expect(stat?.levels[1800].value).toBe(200)
    expect(wall['0'].cash).toBe(175)
    expect(wall['1'].cash).toBe(276)
  })

  it('matches every cash row and the cash values exposed to consumers', () => {
    expect(native.baseCashCosts).toHaveLength(1801)
    const mismatches = native.baseCashCosts.flatMap((cost, level) =>
      wall[String(level)]?.cash === cost ? [] : [level])
    expect(mismatches).toEqual([])
    expect(getWorkshopStatDefinitionByKey('Wall Health')?.levels.map(row => row.cash))
      .toEqual(native.baseCashCosts)
    expect(wall['312'].cash).toBe(4_927_515)
    expect(wall['1605'].cash).toBe(29_282_979_924)
  })

  it('keeps the cash calculation at the cap separate from coin terminality', () => {
    expect(wall['1799'].cash).toBe(119_534_315_004)
    expect(wall['1800'].cash).toBe(119_713_753_980)
    expect(wall['1800'].coins).toBe(0)
  })
})
