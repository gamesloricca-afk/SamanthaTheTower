import { describe, expect, it } from 'vitest'
import { RELIC_TEMPLATES, RELIC_TOTAL_BONUS_CATEGORIES, RELIC_UNLOCK_METHODS } from '../../src/data/relics/data'
import {
  RELIC_DISTINCT_REQUIREMENTS,
  RELIC_TEMPLATE_TYPES,
  RELIC_TOTALS_NAIVE_JOIN,
  RELIC_TOTALS_NAME_ALIASES,
  RELIC_TOTALS_RESOLVED_JOIN,
  RELIC_UNLOCK_METHOD_KEYS,
} from '../../src/knowledge/compartments/progression'

// The alias map is IMPORTED, not re-listed. It was previously copied here, so
// the test and the code it checked kept separate lists that were free to drift
// apart — and a test holding its own copy of the thing under test passes for
// reasons unrelated to whether the code is right.
const ALIASES: Record<string, string> = RELIC_TOTALS_NAME_ALIASES

const sumByBonusType = (): Map<string, number> => {
  const sums = new Map<string, number>()
  for (const relic of RELIC_TEMPLATES) {
    const parsed = /^(-?[\d.]+)/.exec(String(relic.value ?? ''))
    if (!parsed || !relic.bonusType) continue
    sums.set(relic.bonusType, (sums.get(relic.bonusType) ?? 0) + Number(parsed[1]))
  }
  return sums
}

const percentRows = RELIC_TOTAL_BONUS_CATEGORIES
  .flatMap(category => category.rows)
  .filter(row => String(row.total).includes('%'))

describe('both joins of the relic totals are stated and both are true', () => {
  // The two tests that used to sit here recomputed the joins and compared the
  // result to the joins. That was fine while the constants were hand-typed and
  // became a restatement the moment the compartment started deriving them the
  // same way — the same arithmetic on both sides of an equals sign, green
  // whatever the inputs do. Replaced with checks on the alias map, which is the
  // hand-maintained part and therefore the part that can actually be wrong.

  it('lists an alias for every published stat that needs one, and none that does not', () => {
    // Catches both directions. A MISSING alias silently drops a stat from the
    // resolved join and makes the disagreement count look better than it is; a
    // SUPERFLUOUS one is a name someone assumed differed when it does not, and
    // is how this map briefly grew from three entries to seven.
    const sums = sumByBonusType()
    const needing = percentRows.filter(row => !sums.has(row.stat)).map(row => row.stat).sort()
    expect(Object.keys(ALIASES).sort()).toEqual(needing)
  })

  it('maps every alias onto a bonus type some template actually carries', () => {
    const sums = sumByBonusType()
    for (const [from, to] of Object.entries(ALIASES)) {
      expect(sums.has(to), `alias ${from} -> ${to} targets no template bonusType`).toBe(true)
    }
  })

  it('accounts for every percent row under both joins', () => {
    const naive = RELIC_TOTALS_NAIVE_JOIN
    expect(naive.agree + naive.disagree + naive.unmatched).toBe(percentRows.length)
    expect(RELIC_TOTALS_RESOLVED_JOIN.agree + RELIC_TOTALS_RESOLVED_JOIN.disagree)
      .toBe(percentRows.length)
  })

  it('has stats whose template sum is BELOW the published total', () => {
    // This assertion is inverted from what it used to say, and the inversion is
    // the finding. It previously held that our templates always summed at or
    // above the published figure — i.e. the wiki lagged us. After re-reading the
    // wiki table on 2026-08-20 that is no longer true: Attack Speed publishes
    // 19% against 18% of templates, and seven other stats are short too.
    //
    // OUR VALUES ARE NOT THE CAUSE, and that half is now settled rather than
    // assumed. `resolve-relic-totals.mjs` sums RELIC_IMPORT_CATALOG — the game's
    // own relic list — per stat and reproduces these template sums on 25 of 25
    // stats, so nothing here is mis-valued or mis-typed. The list is complete
    // too: 305 templates against a Relic enum whose maximum is 304.
    //
    // What remains open is why the community's figure exceeds the game's on
    // these eight. It is either a relic released after the v28.3.0 dump was
    // taken, or an over-count, and telling those apart needs a newer dump.
    //
    // This test pins the direction, so a silent flip back to "templates always
    // at or above published" fails loudly — that flip is exactly what happened
    // here unnoticed, in the other direction, when the wiki was re-read.
    const sums = sumByBonusType()
    const below = percentRows.filter(row => {
      const sum = sums.get(ALIASES[row.stat] ?? row.stat)
      return sum !== undefined && sum < Number(String(row.total).replace(/[^\d.-]/g, ''))
    })
    expect(below.length, 'expected at least one stat short of the published total').toBeGreaterThan(0)
  })
})

describe('relic unlock methods join to nothing', () => {
  it('has no relic carrying an unlock-method key', () => {
    const keys = new Set(RELIC_UNLOCK_METHOD_KEYS)
    for (const relic of RELIC_TEMPLATES) {
      for (const field of [relic.type, relic.event, relic.requirement]) {
        expect(keys.has(String(field ?? '')), `${relic.name} carries ${field}`).toBe(false)
      }
    }
  })

  it('keeps the two taxonomies different sizes and different words', () => {
    expect(RELIC_UNLOCK_METHOD_KEYS).toHaveLength(RELIC_UNLOCK_METHODS.length)
    expect(RELIC_TEMPLATE_TYPES.length).toBeLessThan(RELIC_UNLOCK_METHOD_KEYS.length)
    const typeWords = new Set(RELIC_TEMPLATE_TYPES.map(t => t.toLowerCase()))
    const lexicallyLinked = RELIC_UNLOCK_METHOD_KEYS
      .filter(key => [...typeWords].some(word => key.includes(word)))
    expect(lexicallyLinked.sort()).toEqual(['milestone_wave_4500', 'tournament_placement'])
    // The other four need semantic judgement, not a join — which is the point.
    expect(RELIC_UNLOCK_METHOD_KEYS.length - lexicallyLinked.length).toBe(4)
  })

  it('puts the real condition in free text, not in a key', () => {
    expect(RELIC_DISTINCT_REQUIREMENTS).toBeGreaterThan(RELIC_UNLOCK_METHOD_KEYS.length * 10)
    expect(RELIC_TEMPLATES.every(r => typeof r.requirement === 'string')).toBe(true)
  })
})
