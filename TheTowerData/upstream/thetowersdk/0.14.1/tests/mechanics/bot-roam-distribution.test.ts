import { describe, expect, it } from 'vitest'
import { pickBotActivationDestination } from '../../src/mechanics/bots/movement'
import { UnityRandom } from '../../src/mechanics/primitives/unity-random'

/**
 * Where bots actually go when they roam.
 *
 * Both look like "a random point in a circle" and both produce plausible pictures, which is
 * why the wrong one survived. The distinction shows up as a mean distance of R/2 instead of
 * 2R/3, and it decides how much two bots overlap BY ACCIDENT — bunched at the tower they sit
 * on top of each other most of the time, so a small Bot Bot circle already catches most of a
 * large bot's area and matching their ranges looks close to worthless.
 *
 * Asserted as a distribution rather than a sequence, because that is what the claim is. A
 * fixed-seed snapshot would pass just as happily with the wrong sampler.
 */
function sampleDistances(count: number, maxDistance: number, factor: number): number[] {
  const rng = UnityRandom.fromSeed(20260904)
  const distances: number[] = []
  for (let index = 0; index < count; index += 1) {
    const point = pickBotActivationDestination(rng, maxDistance, factor)
    distances.push(Math.hypot(point.x, point.y))
  }
  return distances
}

const MAX_DISTANCE = 6
const FACTOR = 1.3
const RADIUS = Math.sqrt(MAX_DISTANCE) * FACTOR

describe('bot roam destinations', () => {
  it('are uniform over the disc, not along the radius', () => {
    // Uniform over the area puts the mean at 2R/3. Uniform along the radius puts it at R/2,
    // which is 25% closer to the tower and the shape of the bug this guards.
    const distances = sampleDistances(20_000, MAX_DISTANCE, FACTOR)
    const mean = distances.reduce((sum, value) => sum + value, 0) / distances.length
    expect(mean / RADIUS).toBeGreaterThan(0.63)
    expect(mean / RADIUS).toBeLessThan(0.70)
  })

  it('put a quarter of destinations inside the half-radius, not half of them', () => {
    // Area scales with r^2, so half the radius holds a quarter of the disc. Uniform along the
    // radius would put half the points there — the single clearest tell between the two.
    const distances = sampleDistances(20_000, MAX_DISTANCE, FACTOR)
    const withinHalf = distances.filter(distance => distance <= RADIUS / 2).length / distances.length
    expect(withinHalf).toBeGreaterThan(0.21)
    expect(withinHalf).toBeLessThan(0.29)
  })

  it('stays inside the roam disc', () => {
    for (const distance of sampleDistances(2_000, MAX_DISTANCE, FACTOR)) {
      expect(distance).toBeLessThanOrEqual(RADIUS + 1e-9)
      expect(distance).toBeGreaterThanOrEqual(0)
    }
  })

  it('scales the disc with the square root of the tower reach', () => {
    // The game's own expression. A bigger tower widens the patrol, but sub-linearly.
    const near = sampleDistances(4_000, 3, FACTOR)
    const far = sampleDistances(4_000, 12, FACTOR)
    const meanOf = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
    expect(meanOf(far) / meanOf(near)).toBeCloseTo(Math.sqrt(12 / 3), 1)
  })
})
