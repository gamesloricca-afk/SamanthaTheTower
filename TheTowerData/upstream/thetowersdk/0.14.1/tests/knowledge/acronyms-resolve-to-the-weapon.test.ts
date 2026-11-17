import { describe, expect, it } from 'vitest'
/*
 * From the package barrel, not `./substrate/graph`. The substrate functions take the graph as
 * their first argument; the barrel closes over GAME_KNOWLEDGE, and that bound pair is what a
 * consumer of `thetowersdk/knowledge` actually calls. Testing the unbound one would prove
 * nothing about the thing that shipped.
 */
import { resolve, resolveWithConfidence } from '../../src/knowledge'

/**
 * An acronym resolves to the thing it names, not to something whose label spells it.
 *
 * `resolve('gt')` used to return `ultimateWeaponPlus.goldenCombo`, whose label is
 * "Golden Tower - Golden Combo (GT+)". The scoring matched `gt` as a SUBSTRING of the literal
 * "gt+", while "Golden Tower" — which contains no "gt" anywhere — scored nothing. So the wrong
 * node won, and `resolveWithConfidence` reported it as `strong`.
 *
 * `bh` reached Consume (the Black Hole *plus* upgrade) and `dw` reached Kill Wall the same way.
 * Three of the most common abbreviations in the game answered with an adjacent entity and gave
 * no reason to doubt it — which is worse than not resolving at all, because an agent asking the
 * oracle what GT means is asking precisely because it does not know.
 *
 * `GT` and `GT+` are different things here, so both must keep working and must not collide.
 */

/** Acronym → the entity it actually names. Every one is in the glossary. */
const ACRONYMS: Array<[string, string]> = [
  ['gt', 'ultimateWeapon.goldenTower'],
  ['bh', 'ultimateWeapon.blackHole'],
  ['dw', 'ultimateWeapon.deathWave'],
]

/** The `+` shorthand names the upgrade, and must not be answered by the base weapon. */
const PLUS: Array<[string, string]> = [
  ['gt+', 'ultimateWeaponPlus.goldenCombo'],
  ['bh+', 'ultimateWeaponPlus.Consume'],
]

describe('acronyms resolve to the entity they name', () => {
  it.each(ACRONYMS)('%s resolves to %s', (acronym, id) => {
    expect(resolve(acronym)).toBe(id)
  })

  it.each(ACRONYMS)('%s is not answered by a plus upgrade', (acronym) => {
    expect(
      resolve(acronym),
      `${acronym} reached a "+" entity — its label spells the acronym, but it is not what it names`,
    ).not.toMatch(/^ultimateWeaponPlus\./)
  })

  it.each(PLUS)('%s still resolves to %s', (shorthand, id) => {
    expect(resolve(shorthand)).toBe(id)
  })

  it('the full name still beats the acronym path', () => {
    const named = resolveWithConfidence('golden tower')
    expect(named.id).toBe('ultimateWeapon.goldenTower')
    expect(named.confidence, 'a written-out name is exact, not merely strong').toBe('exact')
  })

  it('is case-insensitive, as a player typing GT is', () => {
    expect(resolve('GT')).toBe('ultimateWeapon.goldenTower')
  })

  it('does not invent an answer for an acronym nothing carries', () => {
    /*
     * The point of the initials rule is to find the right node, not to always find one. `zzz`
     * is nobody's initials, and answering anyway would be the original bug with a new cause.
     */
    // `id` is null when nothing matches, and `toMatch` rejects null — so compare as text.
    expect(String(resolveWithConfidence('zzz').id ?? '')).not.toMatch(/^ultimateWeapon/)
  })
})
