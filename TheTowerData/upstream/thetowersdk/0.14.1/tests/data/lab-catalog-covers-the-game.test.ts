/**
 * Every lab the game has must survive the join into something the UI can render.
 *
 * The failure this exists for is not a crash and not a wrong number — it is a lab that
 * simply is not there. `LAB_RESEARCH_BY_INDEX` is generated from the game and holds every
 * lab; `LAB_CATALOG` is hand-owned and holds fewer. Category is enriched from the second,
 * and `SITE_LAB_TYPE_BY_SLUG` skips anything with no category (`if (!lab.category) continue`).
 * A lab missing from the hand-owned list therefore comes back category-less, and the labs
 * page renders by category — so it has no bucket and never appears.
 *
 * That is how four module labs (Cannon / Armor / Generator / Core Stats) sat in shipped
 * data, resolvable by index, and invisible on the page for at least a release. Nothing
 * reported it, because nothing compared the two lists.
 *
 * This calls the real `findLabResearchByIndex` rather than re-deriving the join. Two
 * previous attempts to find the gap by matching on display name and then on slug both gave
 * wrong answers — the two sides disagree on both (`Berzerker` vs `Berserker`,
 * `golden_bot_cooldown` vs the catalog's own slug), and an alias layer sits between them.
 * Re-implementing a join to test a join measures the re-implementation.
 */
import { describe, expect, it } from 'vitest'

import { findLabResearchByIndex } from '../../src/data/labs/research'

/** Far past the highest index the game uses; the loop stops at whatever exists. */
const SCAN_LIMIT = 400

/**
 * Labs deliberately left without a category, each with its reason.
 *
 * Empty, and that is the point: it exists so a future exclusion has to be written down and
 * justified rather than absorbed silently. The second test below fails if an entry here
 * starts resolving with a category, so the list cannot rot into an allowlist that hides the
 * gaps the first test looks for.
 *
 * Reserved indices 249 and 250 have no display name or category. They retain their
 * save positions without advertising an active research item.
 */
const KNOWN_UNCATEGORISED: Readonly<Record<number, string>> = {}

function uncategorisedLabs(): Array<{ index: number, name: string }> {
  const found: Array<{ index: number, name: string }> = []
  for (let index = 0; index < SCAN_LIMIT; index += 1) {
    const record = findLabResearchByIndex(index) as unknown as
      { displayName?: string, category?: string | null } | undefined
    const name = record?.displayName?.trim()
    if (!record || !name) continue
    if (!record.category) found.push({ index, name })
  }
  return found
}

describe('the lab catalog covers every lab the game ships', () => {
  it('leaves no named lab without a category', () => {
    const unexpected = uncategorisedLabs().filter(lab => !(lab.index in KNOWN_UNCATEGORISED))
    const listed = unexpected.map(lab => `  ${lab.index}  ${lab.name}`).join('\n')
    expect(
      unexpected,
      unexpected.length
        ? `${unexpected.length} lab(s) resolve by index but have no category, so a `
          + `category-keyed UI cannot render them:\n${listed}\n`
          + 'Regenerate with scripts/build-lab-categories.mjs, add them to LAB_CATALOG in '
          + 'src/data/labs/catalog.ts, or record them in KNOWN_UNCATEGORISED with a reason.'
        : '',
    ).toEqual([])
  })

  it('keeps the deliberate exclusions honest', () => {
    // An entry here that HAS a category is stale — it was added to the catalog and the
    // reason no longer applies. Left unchecked, this list would quietly grow into an
    // allowlist that hides the very gaps the first test exists to find.
    const stillUncategorised = new Set(uncategorisedLabs().map(lab => lab.index))
    // Only NAMED records count. An index the build does not ship resolves to undefined, and
    // one with a blank name is a padding slot — neither is evidence the exclusion is stale,
    // and treating them as such made this fail against a build that simply lacks the lab.
    const stale = Object.keys(KNOWN_UNCATEGORISED)
      .map(Number)
      .filter((index) => {
        const record = findLabResearchByIndex(index) as unknown as
          { displayName?: string, category?: string | null } | undefined
        return Boolean(record?.displayName?.trim()) && !stillUncategorised.has(index)
      })
    expect(stale, `KNOWN_UNCATEGORISED lists ${stale.join(', ')}, which now resolve with a `
      + 'category. Remove them.').toEqual([])
  })
})
