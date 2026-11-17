import { describe, expect, it } from 'vitest'
import { dissonantBoostOfType } from '../../src/mechanics/effective-paths/ehp-model'
import { COMMUNITY_GUIDE_SOURCES } from '../../src/data/reference/community-guides'

/**
 * The package against NanaSeiYuri's dissonance sheet.
 *
 * Most community guides cannot be checked — they describe how to play, and there is nothing to
 * compare a strategy to. This one states arithmetic: the boost caps, the wave the maximum is
 * reached at, how Echo sums over the other tiers, and the totals those produce. All of it is
 * computed here independently, from the game's own formula.
 *
 * So this is two checks at once, and either direction failing is worth knowing. If the package
 * drifts, a widely-used community reference disagrees with it. If the sheet is wrong, a lot of
 * players are planning against the wrong numbers.
 *
 * As of v28.0.3 they agree exactly, which is the strongest thing that can be said for either.
 */
const MAX_WAVE = 5000
const TIERS = 21
const ALL_TIERS_MAXED = Array.from({ length: TIERS }, () => MAX_WAVE)
const NO_OTHER_TIERS = [MAX_WAVE, ...Array.from({ length: TIERS - 1 }, () => 0)]

/** Echo is 0.5% at level 0 and rises half a point a level; the sheet caps it at 10.5%. */
const MAX_ECHO_LEVEL = 20

describe('the dissonance model matches the community sheet', () => {
  it('caps one tier at +400%, and coins at +200%', () => {
    /* "Dissonant Boosts are rewarded to a maximum of +400% (displayed as x5.00) or +200% for coin" */
    for (const type of ['attack', 'defense', 'uw'] as const) {
      expect(dissonantBoostOfType(type, MAX_WAVE, NO_OTHER_TIERS, 0), type).toBeCloseTo(5, 10)
    }
    expect(dissonantBoostOfType('utility', MAX_WAVE, NO_OTHER_TIERS, 0)).toBeCloseTo(3, 10)
  })

  it('reaches the maximum at 5000 waves, and no further', () => {
    /* "The maximum boost is attained by reaching 5000 waves in a Dissonant Run" */
    const atCap = dissonantBoostOfType('attack', MAX_WAVE, NO_OTHER_TIERS, 0)
    const beyond = dissonantBoostOfType('attack', MAX_WAVE * 3, NO_OTHER_TIERS, 0)
    const below = dissonantBoostOfType('attack', MAX_WAVE - 1, NO_OTHER_TIERS, 0)

    expect(beyond).toBeCloseTo(atCap, 10)
    expect(below).toBeLessThan(atCap)
  })

  it('totals x13.40 for attack, health and UW damage with every tier maxed', () => {
    /* "+400% Boost and +840% Echo - that's +1240% or x13.40 for Attack, Health and UW Damage!" */
    for (const type of ['attack', 'defense', 'uw'] as const) {
      expect(dissonantBoostOfType(type, MAX_WAVE, ALL_TIERS_MAXED, MAX_ECHO_LEVEL), type)
        .toBeCloseTo(13.4, 10)
    }
  })

  it('totals x7.20 for coins', () => {
    /* "For coins, it's +200% Boost and +420% Echo, which is a +620% (x7.20) boost in income" */
    expect(dissonantBoostOfType('utility', MAX_WAVE, ALL_TIERS_MAXED, MAX_ECHO_LEVEL))
      .toBeCloseTo(7.2, 10)
  })

  it('excludes the tier being played from its own echo', () => {
    /*
     * "Total Dissonant Boosts for Echo calculations does not include the Boost from the same tier"
     * — the sheet's worked example, and the part a re-implementation gets wrong most often.
     */
    const alone = dissonantBoostOfType('attack', MAX_WAVE, NO_OTHER_TIERS, MAX_ECHO_LEVEL)
    expect(alone).toBeCloseTo(5, 10)
  })

  it('is credited as a source, since the package is checked against it', () => {
    const guide = COMMUNITY_GUIDE_SOURCES.find(entry => entry.id === 'nanaseiyuri-dissonance')
    expect(guide?.author).toBe('NanaSeiYuri')
  })
})
