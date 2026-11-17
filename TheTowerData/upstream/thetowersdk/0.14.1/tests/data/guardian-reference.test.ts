import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { guardianUpgrades } from '../../src/data/guardians/upgrades.data'

/**
 * Checks our guardian upgrade tables against the Effective Paths reference.
 *
 * Every one of the 1436 shared values agreed but four, all the same fault:
 * Attack and Ally both claimed a level 90 cooldown of 30s costing 90, where
 * every other row in those same columns follows cooldown = 121 - level and
 * cost = level - 1, which gives 31s costing 89. Our own arithmetic and the
 * reference agreed against that last row, so it was corrected.
 */

interface GuardianReference {
  groups: Array<{
    group: string
    stats: string[]
    levels: Array<{ level: number; values: Record<string, { display: string; cost: number | null }> }>
  }>
}

const reference = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'fixtures', 'data', 'effective-paths-guardians.json'), 'utf8'),
) as GuardianReference

/**
 * "x1.1" and "1.1x" are the same value written two ways, as are "120s" and
 * "120.0s". Without folding that, 214 rows read as mismatches purely on
 * notation and the four real faults were lost in the noise.
 */
function normalizeValue(raw: string): string {
  const text = String(raw ?? '').trim().toLowerCase()
  if (!text) return ''
  const match = text.match(/^x?\s*(-?[\d.]+)\s*(x|s|%|)$/)
  if (!match) return text
  const suffix = match[2] === '' && text.startsWith('x') ? 'x' : match[2]
  return `${Number.parseFloat(match[1])}${suffix}`
}

/** Our records list their fields per group; read them in order instead. */
const fieldsOf = (record: object): string[] => Object.keys(record).filter(key => key !== 'level')

describe('guardian upgrades against the Effective Paths reference', () => {
  it('agrees on every upgrade value and cost', () => {
    const mismatches: string[] = []
    let compared = 0

    for (const group of reference.groups) {
      const key = group.group.toLowerCase().replace(/\s+/g, '')
      const ours = (guardianUpgrades as unknown as Record<string, Array<Record<string, unknown>>>)[key]
      if (!ours?.length) continue
      const fields = fieldsOf(ours[0])

      for (const entry of group.levels) {
        // The sheet numbers levels from 0 where ours start at 1.
        const record = ours[entry.level]
        if (!record) continue

        for (let index = 0; index < group.stats.length; index += 1) {
          const stat = group.stats[index]
          const theirs = entry.values[stat]
          if (!theirs) continue
          const valueField = fields[index * 2]
          const costField = fields[index * 2 + 1]

          if (theirs.display && valueField) {
            compared += 1
            const ourValue = normalizeValue(String(record[valueField] ?? ''))
            if (ourValue !== normalizeValue(theirs.display)) {
              mismatches.push(`${group.group} L${entry.level} ${valueField}: ours=${record[valueField]} reference=${theirs.display}`)
            }
          }
          if (theirs.cost !== null && costField) {
            compared += 1
            if (Number(record[costField]) !== theirs.cost) {
              mismatches.push(`${group.group} L${entry.level} ${costField}: ours=${record[costField]} reference=${theirs.cost}`)
            }
          }
        }
      }
    }

    expect(mismatches).toEqual([])
    expect(compared).toBeGreaterThanOrEqual(1430)
  })

  it('keeps the cooldown tracks on their own arithmetic', () => {
    // How the level 90 fault was pinned down without leaving the repo: every
    // Attack and Ally cooldown row is 121 - level at a cost of level - 1.
    for (const group of ['attack', 'ally'] as const) {
      const rows = (guardianUpgrades[group] as Array<{ level: number; cooldown: string | null; cooldownCost: number | null }>)
        .filter(row => row.cooldown !== null)
      for (const row of rows) {
        expect(row.cooldown, `${group} level ${row.level}`).toBe(`${121 - row.level}s`)
        expect(row.cooldownCost, `${group} level ${row.level}`).toBe(row.level - 1)
      }
    }
  })

  it('has a Scout group the reference tab does not carry', () => {
    // Not a discrepancy to chase: the tab covers five groups and we carry six.
    expect(reference.groups.map(group => group.group)).not.toContain('SCOUT')
    expect(guardianUpgrades.scout.length).toBeGreaterThan(0)
  })
})
