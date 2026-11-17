import { describe, expect, it } from 'vitest'
import { GAME_KNOWLEDGE } from '../../src/knowledge'
import {
  WAVE_DAMAGE_BAND_DIVISORS,
  WAVE_HEALTH_BAND_DIVISORS,
} from '../../src/knowledge/compartments/enemies'
import { WAVE_FORMULA } from '../../src/mechanics/waves/reference/base-constants'
import { computeWaveBaseDamage, computeWaveBaseHealth } from '../../src/mechanics/waves/base-scaling'

/**
 * The wave-base scaling claims, held to the shipped coefficient table.
 *
 * This was the largest hole in the graph for anyone wanting to SIMULATE rather
 * than merely look things up: 290 nodes and not one of them said how enemy
 * health or damage depends on wave and tier. Every per-enemy figure in the
 * enemies compartment is a MULTIPLE of a base that was nowhere described, so
 * the whole compartment had ratios and no scale.
 */

const node = GAME_KNOWLEDGE.compartments
  .flatMap(c => c.nodes)
  .find(n => n.id === 'enemy.waveScaling')!
const claim = (predicate: string) =>
  node.assertions?.find(a => a.predicate === predicate)?.value

describe('wave scaling is described in the graph', () => {
  it('records the model without claiming independent verification', () => {
    expect(node).toBeDefined()
    expect(node.sources.some(source => source.origin === 'code')).toBe(true)
    expect(node.verification).toBe('unverified')
    expect(node.assertions?.length ?? 0).toBeGreaterThanOrEqual(8)
  })

  /**
   * Literals, deliberately.
   *
   * The first version of this compared the claim against
   * `WAVE_FORMULA.health.polynomialTerms.length` — but the claim is DERIVED
   * from that same table, so both sides moved together and the check could not
   * fail. Deleting a band divisor left it green while the parity suite caught
   * the change three times over.
   *
   * These literal expected counts guard the model structure without deriving the
   * expected value from the same table under test.
   */
  it('pins the expected health and damage band counts', () => {
    expect(claim('healthBandCount')).toBe(12)
    expect(claim('damageBandCount')).toBe(7)
    // And the shipped table still agrees, which is the check that can fail.
    expect(WAVE_FORMULA.health.polynomialTerms.length).toBe(12)
    expect(WAVE_FORMULA.damage.polynomialTerms.length).toBe(7)
    // Damage bands are a SUBSET of the health bands: health adds five tighter
    // divisors (107, 94, 83, 72, 60) on top of the seven they share. That is
    // why reusing one list for the other is wrong in one direction only, and
    // looks right at low waves where the shared terms dominate.
    expect(WAVE_DAMAGE_BAND_DIVISORS.every(d => WAVE_HEALTH_BAND_DIVISORS.includes(d))).toBe(true)
    expect(WAVE_HEALTH_BAND_DIVISORS.length - WAVE_DAMAGE_BAND_DIVISORS.length).toBe(5)
  })

  it('records that health and damage do NOT share band divisors', () => {
    expect(claim('healthAndDamageShareBandDivisors')).toBe(false)
    // And they really differ, so the claim is not passing on a technicality.
    expect(WAVE_HEALTH_BAND_DIVISORS).not.toEqual(WAVE_DAMAGE_BAND_DIVISORS)
  })

  it('carries the exponents a simulator has to choose between', () => {
    expect(claim('healthBaseExponent')).toBe(WAVE_FORMULA.health.body.baseExp)
    expect(claim('damageBaseExponent')).toBe(WAVE_FORMULA.damage.body.baseExp)
    expect(claim('tournamentHealthBaseExponent'))
      .toBe(WAVE_FORMULA.health.body.tournamentBaseExp)
    expect(claim('tournamentHealthBaseExponentNoLeague'))
      .toBe(WAVE_FORMULA.health.body.tournamentBaseExpNoLeague)
  })
})

describe('the scaler behaves as the node describes', () => {
  const ctx = (wave: number, tier: number, tournament = false) => ({ wave, tier, tournament })

  it('rises with wave and with tier', () => {
    expect(computeWaveBaseHealth(ctx(100, 1))).toBeGreaterThan(computeWaveBaseHealth(ctx(10, 1)))
    expect(computeWaveBaseHealth(ctx(100, 10))).toBeGreaterThan(computeWaveBaseHealth(ctx(100, 1)))
    expect(computeWaveBaseDamage(ctx(100, 10))).toBeGreaterThan(computeWaveBaseDamage(ctx(100, 1)))
  })

  it('steps at band boundaries rather than growing smoothly', () => {
    // The smallest health divisor is 5, so crossing a multiple of 5 must move
    // the value by more than the wave before it did. A smooth fit would not.
    const smallest = Math.min(...WAVE_HEALTH_BAND_DIVISORS)
    expect(smallest).toBeLessThanOrEqual(10)
    const before = computeWaveBaseHealth(ctx(smallest * 4 - 1, 1))
    const at = computeWaveBaseHealth(ctx(smallest * 4, 1))
    expect(at).toBeGreaterThan(before)
  })

  it('gives tournament a different answer from campaign at the same wave', () => {
    expect(computeWaveBaseHealth(ctx(100, 10, true)))
      .not.toBe(computeWaveBaseHealth(ctx(100, 10, false)))
  })

  it('is deterministic, which is what makes a simulation reproducible', () => {
    for (const [wave, tier] of [[1, 1], [250, 7], [2011, 20]] as const) {
      expect(computeWaveBaseHealth(ctx(wave, tier))).toBe(computeWaveBaseHealth(ctx(wave, tier)))
    }
  })
})
