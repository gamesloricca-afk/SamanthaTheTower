/**
 * Every relic's `bonusType` against the description the GAME ships for it.
 *
 * ## The axis the other relic tests do not cover
 *
 * `relics-vs-catalog.test.ts` checks each relic's VALUE against its description,
 * and `relic-game-truth.test.ts` checks that each `benefitType` resolves to one
 * `bonusType`. Both pass while a relic sits under the wrong STAT, because a
 * consistently wrong mapping is still consistent — and consistency is all those
 * tests can see.
 *
 * That gap is not hypothetical. The generator once used a hand-authored
 * `benefitType -> stat` table with a `?? 'Damage'` fallback, and every
 * benefitType the table missed became a Damage relic silently. Eight relics were
 * wrong that way, including every Free Attack Upgrade one. Nothing here caught
 * it; it surfaced as an Effective Paths residual, and the first conclusion drawn
 * was that the community sheet must be over-counting. It was not.
 *
 * ## Why a majority vote rather than a table
 *
 * The expected stat for each phrase is learned from the catalog by majority. A
 * hand-written phrase->stat table is precisely what caused the original bug, so
 * writing another one here would reproduce the failure inside its own guard. If
 * twenty relics reading "increase tower damage" are typed Damage and one reading
 * "increase free attack upgrade" is ALSO typed Damage, the majority establishes
 * the honest mapping and the odd one out is the defect.
 */
import { describe, expect, it } from 'vitest'
import { RELIC_TEMPLATES } from '../../src/data/relics/data'
import { RELIC_IMPORT_CATALOG } from '../../src/save/catalogs/indexes.data'

type CatalogRow = { label?: string, description?: string }

const templateByName = new Map(RELIC_TEMPLATES.map(template => [template.name, template]))

/** `Increase free attack upgrade by 1%` -> `free attack upgrade`. */
const effectOf = (description: unknown): string | null => {
  const match = /(increase|decrease)s?\s+(.+?)\s+by\s+[\d.]+\s*(%|m\b|s\b|x\b)/i
    .exec(String(description ?? ''))
  return match ? match[2].toLowerCase().replace(/\s+/g, ' ').trim() : null
}

const rows = (RELIC_IMPORT_CATALOG as CatalogRow[]).filter(row => row?.label && row?.description)

/**
 * Effect phrase -> the bonusType most relics using that phrase are given.
 *
 * Takes the name->bonusType map as an argument so the planted-fault test can
 * run the real detection over a corrupted copy. A guard that cannot be pointed
 * at bad data has never been shown to reject any.
 */
function majorityStatByEffect(typeOf: Map<string, string>): Map<string, string> {
  const votes = new Map<string, Map<string, number>>()
  for (const row of rows) {
    const bonusType = typeOf.get(row.label!)
    const effect = effectOf(row.description)
    if (!bonusType || !effect) continue
    if (!votes.has(effect)) votes.set(effect, new Map())
    const tally = votes.get(effect)!
    tally.set(bonusType, (tally.get(bonusType) ?? 0) + 1)
  }

  const winners = new Map<string, string>()
  for (const [effect, tally] of votes) {
    const ranked = [...tally].sort((a, b) => b[1] - a[1])
    // A tie is not a majority. Guessing would report half the relics as wrong.
    if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) continue
    winners.set(effect, ranked[0][0])
  }
  return winners
}

/** Relics whose bonusType contradicts the stat their description names. */
function mistyped(typeOf: Map<string, string>): string[] {
  const expected = majorityStatByEffect(typeOf)
  const wrong: string[] = []
  for (const row of rows) {
    const bonusType = typeOf.get(row.label!)
    const effect = effectOf(row.description)
    if (!bonusType || !effect) continue
    const shouldBe = expected.get(effect)
    if (shouldBe && shouldBe !== bonusType) {
      wrong.push(`${row.label}: typed ${bonusType}, described as ${shouldBe} — "${row.description}"`)
    }
  }
  return wrong
}

const SHIPPED_TYPES = new Map(
  RELIC_TEMPLATES
    .filter(template => template.bonusType)
    .map(template => [template.name, template.bonusType as string]))

describe('relic bonusType against the game’s own description', () => {
  it('types every relic as the stat its description names', () => {
    expect(mistyped(SHIPPED_TYPES)).toEqual([])
  })

  it('has a majority for enough phrases to make the check meaningful', () => {
    // The guard on the guard. If the description format changed and nothing
    // parsed, the test above would pass on an empty comparison and report
    // health it never measured.
    expect(majorityStatByEffect(SHIPPED_TYPES).size).toBeGreaterThan(20)
    expect(rows.length).toBeGreaterThan(300)
  })

  it('detects a relic pushed onto the fallback stat', () => {
    // The exact historical fault, planted: one relic re-typed to Damage, which
    // is what the missing `?? 'Damage'` fallback produced for every benefitType
    // its table did not cover.
    const victim = rows.find(row => {
      const bonusType = SHIPPED_TYPES.get(row.label!)
      return bonusType && bonusType !== 'Damage' && effectOf(row.description)
    })
    expect(victim, 'no non-Damage relic to plant the fault on').toBeDefined()

    const corrupted = new Map(SHIPPED_TYPES)
    corrupted.set(victim!.label!, 'Damage')

    const found = mistyped(corrupted)
    expect(found.some(line => line.startsWith(`${victim!.label}:`)), found.join('\n')).toBe(true)
  })
})
