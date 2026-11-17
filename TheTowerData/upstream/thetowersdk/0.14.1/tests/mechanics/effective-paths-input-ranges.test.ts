import { describe, expect, it } from 'vitest'
import {
  effectivePathsInputRanges,
  isDamageLabUpgrade,
  midpointOf,
  NOT_LABS,
} from '../../src/mechanics/effective-paths/input-ranges'
import { guardianUpgrades } from '../../src/data/guardians/upgrades.data'
import { WORKSHOP_DATA } from '../../src/data/workshop/table'
import { labMaxCatalogLevel } from '../../src/mechanics/effective-paths/lab-costs'
import { EFFECTIVE_DAMAGE_UPGRADES } from '../../src/mechanics/effective-paths/edamage-plan'
import { EFFECTIVE_HEALTH_UPGRADES } from '../../src/mechanics/effective-paths/ehp-plan'

/**
 * The catalog has to be complete, or it is worse than nothing.
 *
 * A missing maximum does not read as missing. It reads as "this input has no
 * cap", and a test account built from it goes to a level the game cannot
 * reach, after which every number computed from that account is confidently
 * wrong and nothing else in the suite disagrees.
 */

describe('the input range catalog', () => {
  const { ranges, gaps } = effectivePathsInputRanges()

  it('answers for every input, with no guessed maximum', () => {
    expect(gaps, `no data answers the maximum for: ${gaps.join(', ')}`).toEqual([])
  })

  it('covers every domain and the feature controls', () => {
    // Pinned as a list rather than a count: a domain silently dropping out is
    // the failure this catalog exists to prevent, and a count would still pass
    // if one arrived as another left.
    const kinds = new Set(ranges.map(range => range.id.split('.')[0]))
    expect([...kinds].sort()).toEqual([
      'bot', 'card', 'control', 'guardian', 'lab', 'module', 'uw', 'vault', 'workshop',
    ])
    // A catalog that silently shrank would still pass the checks above.
    expect(ranges.length).toBeGreaterThan(200)
  })

  it('gives every entry a source that can be checked', () => {
    const unsourced = ranges.filter(range => !range.source || range.source.length < 8)
    expect(unsourced.map(r => r.id)).toEqual([])
  })

  it('never reports a maximum below its minimum', () => {
    const inverted = ranges.filter(range => range.max !== null && range.max < range.min)
    expect(inverted.map(r => r.id)).toEqual([])
  })

  it('lists the options for anything that is not a plain level', () => {
    const missing = ranges
      .filter(range => range.kind === 'boolean' || range.kind === 'enum')
      .filter(range => !range.options?.length)
    expect(missing.map(r => r.id)).toEqual([])
  })

  it('knows the two filters whose absence hid a dead feature', () => {
    // These are in the catalog because the account they were tested against had
    // every ultimate weapon cooldown maxed, so the filter had nothing to hide
    // and a version of it that matched nothing passed the check.
    const ids = ranges.map(range => range.id)
    expect(ids).toContain('control.hideUwCooldown')
    expect(ids).toContain('control.hideNonUwUpgrades')
  })
})

describe('picking a testable value', () => {
  it('lands strictly inside the range so upgrades remain to buy', () => {
    const { ranges } = effectivePathsInputRanges()
    const levels = ranges.filter(range => range.kind === 'level' && (range.max ?? 0) > 1)

    for (const range of levels) {
      const mid = midpointOf(range)
      expect(mid, `${range.id} midpoint`).toBeGreaterThanOrEqual(range.min)
      // The point of the whole exercise: never at the cap, so every path has
      // something left to plan and every filter has something to hide.
      expect(mid, `${range.id} is at its maximum`).toBeLessThan(range.max as number)
    }
  })

  it('does not invent a level for an input with no known maximum', () => {
    expect(midpointOf({ id: 'x', kind: 'level', source: 's', min: 0, max: null })).toBe(0)
  })
})

describe('the not-a-lab exceptions', () => {
  it('are exactly the names the lab catalog cannot price', () => {
    /*
     * The point of pinning this: `NOT_LABS` is an exception list, and an
     * exception list that is merely "big enough" hides the next real gap. If a
     * lab is renamed and stops resolving, it must land here as a failure —
     * not be quietly absorbed because some other name was already excused.
     */
    const claimed = Object.keys(NOT_LABS).sort()

    const onPaths = new Set<string>()
    for (const upgrade of EFFECTIVE_HEALTH_UPGRADES) onPaths.add(upgrade.sheetName)
    for (const upgrade of EFFECTIVE_DAMAGE_UPGRADES) {
      if (isDamageLabUpgrade(upgrade.id)) onPaths.add(upgrade.sheetName)
    }

    // Workshop stats and their `+` enhancements ride the same paths and are
    // priced by WORKSHOP_DATA, so asking the lab catalog for them would invent
    // gaps that are not gaps.
    const isWorkshop = (name: string) =>
      name in WORKSHOP_DATA || (name.endsWith(' +') && name.slice(0, -2) in WORKSHOP_DATA)

    const unresolvable = [...onPaths]
      .filter(name => !isWorkshop(name))
      .filter(name => labMaxCatalogLevel(name) <= 0)
      .sort()
    expect(unresolvable).toEqual(claimed)
  })

  it('says why for each one', () => {
    for (const [name, reason] of Object.entries(NOT_LABS)) {
      expect(reason.length, `${name} has no reason`).toBeGreaterThan(20)
    }
  })
})

describe('the per-entry domains', () => {
  const { ranges } = effectivePathsInputRanges()
  const idsFor = (prefix: string) => ranges.filter(range => range.id.startsWith(prefix))

  it('gives every guardian every column it actually has', () => {
    /*
     * The first version listed three columns — attackCost, cooldownCost,
     * targetsCost — and matched 9 of the 18. Ally is priced on recoveryCost and
     * maxRecoveryCost, Fetch on findChanceCost and doubleFindChanceCost, Summon
     * on durationCost and cashBonusCost, Scout on rangeBonusCost. The other
     * nine were skipped in silence, which is the shape this catalog exists to
     * catch, so the columns are counted from the data.
     */
    let columns = 0
    for (const rows of Object.values(guardianUpgrades)) {
      const table = rows as unknown as ReadonlyArray<Record<string, unknown>>
      const fields = [...new Set(table.flatMap(row => Object.keys(row)))]
        .filter(field => field.endsWith('Cost'))
      columns += fields.filter(field => table.some(row => typeof row[field] === 'number')).length
    }

    expect(idsFor('guardian.')).toHaveLength(columns)
    expect(columns).toBeGreaterThan(9)
  })

  it('caps a bot stat by its own table, not the shared one', () => {
    // Flame Bot's Cooldown stops at 15 where the generic stat list says 25.
    // Reading the shared list would offer ten levels that do not exist.
    const cooldown = ranges.find(range => range.id === 'bot.Flame Bot.Cooldown')
    expect(cooldown?.max).toBe(15)
  })

  it('caps a guardian stat where its own column stops costing', () => {
    // `targetsCost` goes null long before the rows run out.
    const targets = ranges.find(range => range.id === 'guardian.Attack.Targets')
    const cooldown = ranges.find(range => range.id === 'guardian.Attack.Cooldown')
    expect(targets?.max).toBe(10)
    expect(cooldown?.max).toBeGreaterThan(targets?.max ?? 0)
  })

  it('caps module levels by rarity', () => {
    const epic = ranges.find(range => range.id === 'module.Epic')
    const top = ranges.find(range => range.id === 'module.Ancestral 5')
    expect(epic?.max).toBeGreaterThan(0)
    expect(top?.max).toBeGreaterThan(epic?.max ?? 0)
  })
})
