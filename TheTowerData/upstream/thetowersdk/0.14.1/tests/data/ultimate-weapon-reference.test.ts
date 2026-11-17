import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { uwStoneChartData } from '../../src/data/ultimate-weapons/stones.data'

/**
 * Checks our ultimate weapon stone tables against the Effective Paths reference.
 *
 * Every one of the 1428 shared values agreed but one: Death Wave's Damage cost
 * at level 30, which read 4081 where its own cost deltas -- climbing by a
 * constant 75 through 306, 381, 456, 531 -- put it at 2800 + 606 = 3406, and
 * the reference said 3406 too. Corrected, along with the cumulative in the
 * chart baseline that is derived from it (18,266 -> 17,591).
 */

interface UwReference {
  weapons: Array<{
    name: string
    stats: Array<{ stat: string; levels: Array<{ level: number; display: string; cost: number | null }> }>
  }>
}

const reference = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'fixtures', 'data', 'effective-paths-ultimate-weapons.json'), 'utf8'),
) as UwReference

/**
 * The sheet writes values with the unit attached and not always the way we do:
 * "x2" against "2", "30°" against "30", "#5" against "x5". Compare the number
 * and drop the decoration, or 62 Spotlight angles read as mismatches purely on
 * a degree sign.
 */
function normalizeValue(raw: string | number): string {
  const text = String(raw ?? '').trim().toLowerCase().replace(/,/g, '')
  if (!text) return ''
  const match = text.match(/^[x#]?\s*(-?[\d.]+)\s*(?:[x°]|s|%)?$/)
  return match ? String(Number.parseFloat(match[1])) : text
}

const weaponKey = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '')

/** uwStoneChartData is keyed by weapon slug, not an array. */
const ourWeapons = Object.values(uwStoneChartData)

describe('ultimate weapons against the Effective Paths reference', () => {
  it('carries the same nine weapons', () => {
    // The tab misspells Chain Lightning as "Chain Ligtning", so match on a
    // prefix rather than the whole name.
    const theirs = reference.weapons.map(weapon => weaponKey(weapon.name).slice(0, 6))
    const ours = ourWeapons.map(weapon => weaponKey(weapon.name).slice(0, 6))
    expect(theirs.length).toBe(9)
    for (const key of theirs) expect(ours).toContain(key)
  })

  it('agrees on every upgrade value and cost', () => {
    const mismatches: string[] = []
    let compared = 0

    for (const weapon of reference.weapons) {
      const key = weaponKey(weapon.name).slice(0, 6)
      const ours = ourWeapons.find(entry => weaponKey(entry.name).slice(0, 6) === key)
      if (!ours) continue

      for (let index = 0; index < weapon.stats.length; index += 1) {
        const theirStat = weapon.stats[index]
        const ourStat = ours.stats[index]
        if (!ourStat) continue

        for (const level of theirStat.levels) {
          const record = ourStat.levels.find(entry => Number(entry.level) === level.level)
          if (!record) continue

          if (level.display) {
            compared += 1
            if (normalizeValue(record.value) !== normalizeValue(level.display)) {
              mismatches.push(`${ours.name} ${ourStat.name} L${level.level}: ours=${record.value} reference=${level.display}`)
            }
          }
          if (level.cost !== null) {
            compared += 1
            // Level 0 is the weapon's unlock, which we store as the string
            // 'Unlock' and the sheet stores as 0. Platform's
            // normalizeUnlockCost does the same coercion.
            const ourCost = record.cost === 'Unlock' ? 0 : Number(record.cost)
            if (ourCost !== level.cost) {
              mismatches.push(`${ours.name} ${ourStat.name} L${level.level} cost: ours=${record.cost} reference=${level.cost}`)
            }
          }
        }
      }
    }

    expect(mismatches).toEqual([])
    expect(compared).toBeGreaterThanOrEqual(1400)
  })

  it('keeps Death Wave damage costs on their own progression', () => {
    // How the level 30 fault was isolated without leaving the repo, and a guard
    // against it coming back: past the early levels the cost deltas rise by a
    // constant 75.
    const damage = ourWeapons.find(weapon => weapon.name === 'Death Wave')?.stats[0]
    const costs = (damage?.levels ?? []).map(level => Number(level.cost))
    const deltas = costs.slice(1).map((cost, index) => cost - costs[index])
    const tail = deltas.slice(-4)
    for (let index = 1; index < tail.length; index += 1) {
      expect(tail[index] - tail[index - 1]).toBe(75)
    }
  })
})
