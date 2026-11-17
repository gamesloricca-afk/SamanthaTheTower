import { describe, expect, it } from 'vitest'
import { RELIC_TEMPLATES } from '../../src/data/relics/data'
import { RELIC_IMPORT_CATALOG } from '../../src/save/catalogs/indexes.data'

/**
 * The relic catalog against the game's own import catalog.
 *
 * ## The bug this exists to end
 *
 * `RELIC_TEMPLATES` is hand-maintained plus generated, and the generator used a
 * hand-authored `benefitType -> stat` table with nine values missing and a
 * `?? 'Damage'` fallback underneath. Anything the table did not cover became a
 * Damage relic, silently. Eight relics were wrong that way, among them every
 * **Free Attack Upgrade** one, because 18 was in neither the table nor the
 * description parser.
 *
 * Nothing caught it. It surfaced only as an Effective Paths economy residual —
 * the community sheet summing 0.12 of free-attack-upgrade relic where we summed
 * 0.08 — and the first conclusion drawn was that the sheet was over-counting.
 * It was not; the three relics making up the difference were in our catalog
 * under the wrong stat.
 *
 * ## Why the enum is re-derived rather than asserted
 *
 * `RELIC_IMPORT_CATALOG` carries both a numeric `benefitType` and a prose
 * `description` for each relic, so the mapping between them is a fact about the
 * data rather than a constant to be trusted. This rebuilds it and fails if any
 * `benefitType` ever resolves to two different descriptions — which would mean
 * the enum had shifted under us, and every bonus type in the catalog with it.
 */

/** `Increase tower damage by 5%` -> `tower damage`. */
const effectOf = (description: string) =>
  String(description ?? '')
    .toLowerCase()
    .replace(/^increases? /, '')
    .replace(/ by [\d.]+%?.*$/, '')
    .trim()

type CatalogRow = {
  label?: string
  description?: string
  benefit?: number
  benefitType?: number
}

const rows = (RELIC_IMPORT_CATALOG as CatalogRow[]).filter(row => row?.label)

it('retains the existing template IDs for the reviewed Epic relics', () => {
  const ids = [
    114, 116, 118, 120, 122, 124, 126, 128, 130, 132, 136, 138, 140, 143, 144,
    151, 152, 154, 157, 158, 162, 164, 166, 168, 170, 172, 184, 186, 188,
  ]
  const templates = new Map(RELIC_TEMPLATES.map(row => [row.id, row.rarity]))
  for (const suffix of ids) {
    const id = `1-Rare-${suffix}`
    expect(templates.get(id), id).toBe('Epic')
  }
})

describe('the benefitType enum', () => {
  it('resolves each value to exactly one effect across the whole catalog', () => {
    const effects = new Map<number, Set<string>>()

    for (const row of rows) {
      const effect = effectOf(row.description ?? '')
      if (!effect || row.benefitType === undefined) continue
      if (!effects.has(row.benefitType)) effects.set(row.benefitType, new Set())
      effects.get(row.benefitType)!.add(effect)
    }

    const ambiguous = [...effects.entries()]
      .filter(([, seen]) => seen.size > 1)
      .map(([value, seen]) => `${value} -> {${[...seen].join(' | ')}}`)

    expect(ambiguous, 'a benefitType resolving to two effects means the enum moved').toEqual([])
    // A floor rather than an equality: new relics may introduce new values, and
    // that should not fail here — it should fail the coverage test below.
    expect(effects.size).toBeGreaterThanOrEqual(27)
  })
})

describe('RELIC_TEMPLATES against the import catalog', () => {
  const templates = RELIC_TEMPLATES as Array<{ name: string, bonusType?: string, value?: string }>
  const byName = new Map(templates.map(template => [template.name, template]))

  it('has an entry for every relic the game knows, and no duplicates', () => {
    const missing = rows.filter(row => !byName.has(row.label!)).map(row => row.label)
    expect(missing, 'relics the game has and the catalog does not').toEqual([])

    const counts = new Map<string, number>()
    for (const template of templates) counts.set(template.name, (counts.get(template.name) ?? 0) + 1)
    const duplicated = [...counts.entries()].filter(([, n]) => n > 1).map(([name]) => name)
    expect(duplicated, 'the same relic listed twice').toEqual([])
  })

  it('invents no relic the game does not have', () => {
    // Ours drifted on spelling too — `Miner's Tool` for `Miner's Tools`, and a
    // numeral replace that ran inside roman numerals, turning `T:VII` into
    // `T: V2`. Both read as unknown relics to anything matching by name.
    const known = new Set(rows.map(row => row.label))
    const invented = templates.filter(template => !known.has(template.name)).map(t => t.name)
    expect(invented).toEqual([])
  })

  it('agrees with the game on every value, in the game’s own unit', () => {
    /*
     * The unit comes from the description, not from an assumption here.
     *
     * This test used to build its expectation as `benefit * 100 + '%'` — the
     * same formula the generator used — so it agreed with the generator rather
     * than with the game, and passed while seven Bot Range relics said "100%"
     * for what the game calls "1m" and a Wall Rebuild relic said "200%" for
     * "2s". A test that reproduces the implementation cannot disagree with it.
     *
     * The descriptions state the unit outright:
     *
     *   Increase super critical mult by 5%    benefit 0.05  → 5%
     *   Increase bot range by 2m              benefit 2     → 2m
     *   Decrease wall rebuild time by 2s      benefit 2     → 2s
     */
    const wrong: string[] = []
    let checkedFlat = 0

    for (const row of rows) {
      const template = byName.get(row.label!)
      if (!template) continue

      const benefit = row.benefit ?? 0
      const stated = String(row.description ?? '').match(/by\s+[\d.]+\s*(%|m\b|s\b|x\b)/i)
      const unit = stated?.[1]?.toLowerCase()

      let expected: string
      if (unit && unit !== '%') {
        expected = `${Math.round(benefit * 100) / 100}${unit}`
        checkedFlat += 1
      }
      else {
        expected = `${Math.round(benefit * 1000) / 10}%`
      }

      if (template.value !== expected) {
        wrong.push(`${row.label} value ${template.value} != ${expected} — "${row.description}"`)
      }
    }

    expect(wrong).toEqual([])
    // The guard on the guard: if no description stated a non-percent unit, this
    // would have collapsed back into the percentage-only test it replaced.
    expect(checkedFlat, 'no flat-unit relic was checked').toBeGreaterThan(0)
  })

  it('gives one bonus type per benefitType', () => {
    /*
     * This is the assertion that would have caught the original bug, and it
     * needs no table of its own. The game groups relics by a numeric benefit
     * type; if two relics share that number and we call them different stats,
     * one of them is wrong. The `?? 'Damage'` fallback failed exactly here —
     * it collapsed nine distinct benefit types onto Damage, so the Damage
     * group filled up with relics whose numbers disagreed.
     */
    const byBenefitType = new Map<number, Map<string, string[]>>()

    for (const row of rows) {
      const template = byName.get(row.label!)
      if (!template || row.benefitType === undefined) continue
      const bonus = template.bonusType ?? '(none)'
      if (!byBenefitType.has(row.benefitType)) byBenefitType.set(row.benefitType, new Map())
      const group = byBenefitType.get(row.benefitType)!
      if (!group.has(bonus)) group.set(bonus, [])
      group.get(bonus)!.push(row.label!)
    }

    const split = [...byBenefitType.entries()]
      .filter(([, group]) => group.size > 1)
      .map(([value, group]) => `benefitType ${value}: `
        + [...group.entries()].map(([bonus, names]) => `${bonus} (${names.join(', ')})`).join(' vs '))

    expect(split).toEqual([])
  })
})
