import { describe, expect, it } from 'vitest'
import { TIER_BATTLE_CONDITION_DEFINITIONS, TIER_BATTLE_CONDITION_TIERS } from '../../src/data'
import { BATTLE_CONDITION_ULTIMATE_NAMES, KNOWN_WRONG_NAMES } from '../../src/knowledge/compartments/naming'

/**
 * The catalog checked against the game's own vocabulary.
 *
 * ## What this caught
 *
 * Our tier data shipped `Ray Ultimate`, `Scatter Ultimate` and `Vampire
 * Ultimate`. The game's localisation terms say `Ray's Ultimate`, `Scatter's
 * Ultimate` and `Vampire's Ultimate`.
 *
 * They were wrong *together*, which is why nothing flagged them: internally
 * consistent, plausible, and the kind of string a person writes from memory.
 * Any lookup keyed on them would have missed and returned a neutral value
 * rather than raising — the defect shape this repo produces most.
 *
 * ## The rule
 *
 * Naming authority order is: reading the screen › game files › wiki › our
 * catalogs. This test enforces the second rung.
 *
 * ## What this test does NOT do
 *
 * It does not assert that every game name appears in our catalog. The I2 scan
 * covers ~63% of term ids, and our catalog legitimately omits conditions we
 * have not modelled. Absence is not evidence in either direction — only a
 * near-miss is.
 */

const catalogNames = new Set<string>()
for (const tier of TIER_BATTLE_CONDITION_TIERS) {
  for (const condition of tier.battleConditions) catalogNames.add(condition.name)
}
for (const definition of TIER_BATTLE_CONDITION_DEFINITIONS) {
  catalogNames.add(definition.name)
}

describe('catalog names match the game', () => {
  it('never uses a name the game files proved wrong', () => {
    // Each of these was in the catalog until 2026-08-16. Re-introducing one
    // should fail here rather than silently missing a lookup at runtime.
    for (const [wrong, right] of Object.entries(KNOWN_WRONG_NAMES)) {
      expect(
        catalogNames.has(wrong),
        `catalog uses "${wrong}" — the game calls it "${right}"`,
      ).toBe(false)
    }
  })

  it('uses the corrected possessive forms', () => {
    for (const right of Object.values(KNOWN_WRONG_NAMES)) {
      expect(catalogNames.has(right), `catalog is missing "${right}"`).toBe(true)
    }
  })

  it('keeps Ranged Ultimate without a possessive', () => {
    /*
     * The game is inconsistent here — twelve enemy ultimates take a possessive
     * and this one does not. Regularising it would look like a tidy-up and
     * break the lookup, so it is pinned.
     */
    expect(catalogNames.has('Ranged Ultimate')).toBe(true)
    expect(catalogNames.has("Ranged's Ultimate")).toBe(false)
  })

  it('agrees with every game ultimate name it claims to model', () => {
    // One-directional on purpose: the catalog may legitimately not model a
    // condition, but anything it DOES model must be spelled the game's way.
    const gameNames = new Set<string>(BATTLE_CONDITION_ULTIMATE_NAMES)
    const modelled = [...catalogNames].filter(name => /Ultimate$/.test(name))

    for (const name of modelled) {
      expect(
        gameNames.has(name),
        `catalog models "${name}" but the game files do not name it that`,
      ).toBe(true)
    }
  })
})
