import { describe, expect, it } from 'vitest'
import { MAX_CAMPAIGN_TIER } from '../../src/data'
import { dissonantBoostOfType, getShatterShards } from '../../src/mechanics'
import { dissonanceCalculator, enemyDropsCalculator, innerLandMinesCalculator } from '../../src/builders'

const fullRow = (fill: number) => Array.from({ length: MAX_CAMPAIGN_TIER }, () => fill)

describe('dissonance', () => {
  it('is 1 — no bonus at all — for an account with nothing recorded', () => {
    expect(dissonanceCalculator.compute({ tierPersonalBests: fullRow(0) }).boost).toBe(1)
  })

  it('calls the real mechanic rather than restating it', () => {
    /*
     * The test that compares `cost / (rate * 23)` against `cost / (rate * 23)` is the one
     * this codebase keeps writing. So the expected value comes from the exported function,
     * and what is under test is the builder's wiring into it.
     */
    const bests = fullRow(0)
    bests[4] = 3000
    bests[9] = 1200
    const result = dissonanceCalculator.compute({ type: 'attack', tier: 5, tierPersonalBests: bests, echoLevel: 12 })
    expect(result.boost).toBe(dissonantBoostOfType('attack', 3000, bests, 12))
  })

  it('other tiers are worth something even at Echo 0, and more as Echo climbs', () => {
    // The half-a-percent floor is easy to drop by treating Echo 0 as "no other tiers".
    const bests = fullRow(0)
    bests[0] = 4000
    bests[1] = 4000
    const solo = fullRow(0)
    solo[0] = 4000

    const withOthers = dissonanceCalculator.compute({ tier: 1, tierPersonalBests: bests, echoLevel: 0 })
    const alone = dissonanceCalculator.compute({ tier: 1, tierPersonalBests: solo, echoLevel: 0 })
    expect(withOthers.boost).toBeGreaterThan(alone.boost)

    const highEcho = dissonanceCalculator.compute({ tier: 1, tierPersonalBests: bests, echoLevel: 50 })
    expect(highEcho.boost).toBeGreaterThan(withOthers.boost)
    expect(highEcho.echoContribution).toBeGreaterThan(withOthers.echoContribution)
  })

  it('splits the played tier from the echo contribution without losing any of it', () => {
    const bests = fullRow(1500)
    bests[2] = 5000
    const r = dissonanceCalculator.compute({ tier: 3, tierPersonalBests: bests, echoLevel: 8 })
    expect(r.currentTierBoost + r.echoContribution).toBeCloseTo(r.boost, 10)
    expect(r.echoContribution).toBeGreaterThan(0)
  })

  it('is non-linear in waves, so per-tier bests cannot be summed first', () => {
    // Two tiers at 2500 must be worth strictly less than one at 5000.
    const split = fullRow(0)
    split[0] = 2500
    split[1] = 2500
    const single = fullRow(0)
    single[0] = 5000
    const a = dissonanceCalculator.compute({ tier: 1, tierPersonalBests: split, echoLevel: 200 })
    const b = dissonanceCalculator.compute({ tier: 1, tierPersonalBests: single, echoLevel: 200 })
    expect(a.boost).toBeLessThan(b.boost)
  })

  it('reports the wave cap instead of pretending more waves help', () => {
    const bests = fullRow(0)
    bests[6] = 9999
    const r = dissonanceCalculator.compute({ tier: 7, tierPersonalBests: bests })
    expect(r.cappedTiers).toContain(7)
    // Past the cap the answer stops moving, which is the point of the note.
    const capped = fullRow(0)
    capped[6] = 5000
    expect(r.boost).toBe(dissonanceCalculator.compute({ tier: 7, tierPersonalBests: capped }).boost)
  })

  it('says so when a short row was padded, rather than dropping the tail silently', () => {
    const r = dissonanceCalculator.compute({ tier: 1, tierPersonalBests: [4000, 4000] })
    expect(r.notes.join(' ')).toMatch(/Expected \d+ personal bests/)
  })

  it('utility pays half of what the other three pay', () => {
    const bests = fullRow(0)
    bests[0] = 5000
    const of = (type: 'attack' | 'defense' | 'uw' | 'utility') =>
      dissonanceCalculator.compute({ type, tier: 1, tierPersonalBests: bests }).boost - 1
    expect(of('utility')).toBeCloseTo(of('attack') / 2, 10)
    expect(of('defense')).toBeCloseTo(of('uw'), 10)
  })

  it('survives junk without throwing or returning NaN', () => {
    for (const input of [{}, { tier: -3 }, { tierPersonalBests: [NaN, 'x'] }, { echoLevel: Infinity }]) {
      const r = dissonanceCalculator.compute(input as never)
      expect(Number.isFinite(r.boost), JSON.stringify(input)).toBe(true)
    }
  })
})

describe('enemy drops', () => {
  it('every declared lab moves something', () => {
    /*
     * Shatter is probed at level 150, not 30, because at common rarity 30 levels genuinely
     * change nothing — floor(benefit / 100 × 5) needs a benefit of 20, which is level 100.
     * That is the mechanic, not a wiring fault; `shatterShardsDeadLevels` is what reports
     * it. Probing at 30 and calling the flat result a bug is how a correct model gets
     * "fixed" into a wrong one.
     */
    const base = enemyDropsCalculator.compute({ tier: 10 })
    const inert: string[] = []
    const probes: Array<[string, Record<string, unknown>]> = [
      ['commonDropLabLevel', { commonDropLabLevel: 30 }],
      ['rareDropLabLevel', { rareDropLabLevel: 30 }],
      ['rerollShardsLabLevel', { rerollShardsLabLevel: 30 }],
      ['shatterShardsLabLevel', { shatterShardsLabLevel: 150 }],
    ]
    for (const [name, patch] of probes) {
      const moved = enemyDropsCalculator.compute({ tier: 10, ...patch })
      const changed = moved.commonDropChance !== base.commonDropChance
        || moved.rareDropChance !== base.rareDropChance
        || moved.rerollShardsPerBoss !== base.rerollShardsPerBoss
        || moved.shatterShards !== base.shatterShards
      if (!changed) inert.push(name)
    }
    expect(inert, `these labs changed nothing: ${inert.join(', ')}`).toEqual([])
  })

  it('the expected value is the count discounted by the 15% proc, not the count', () => {
    const r = enemyDropsCalculator.compute({ tier: 12, rerollShardsLabLevel: 5 })
    expect(r.expectedRerollShardsPerBoss).toBeCloseTo(r.rerollShardsPerBoss * 0.15, 10)
    expect(r.expectedRerollShardsPerBoss).toBeLessThan(r.rerollShardsPerBoss)
  })

  it('a higher tier pays more shards', () => {
    const low = enemyDropsCalculator.compute({ tier: 3 })
    const high = enemyDropsCalculator.compute({ tier: 18 })
    expect(high.rerollShardsTierBase).toBeGreaterThan(low.rerollShardsTierBase)
  })

  it('drop chances stay a probability', () => {
    const r = enemyDropsCalculator.compute({ tier: 1, commonDropLabLevel: 9999, rareDropLabLevel: 9999 })
    expect(r.commonDropChance).toBeLessThanOrEqual(1)
    expect(r.rareDropChance).toBeLessThanOrEqual(1)
    expect(r.commonDropChance).toBeGreaterThanOrEqual(0)
  })

  it('rarity changes the shatter payout, and matches the mechanic', () => {
    const epic = enemyDropsCalculator.compute({ shatterRarity: 'epic', shatterShardsLabLevel: 10 })
    const common = enemyDropsCalculator.compute({ shatterRarity: 'common', shatterShardsLabLevel: 10 })
    expect(epic.shatterShards).toBeGreaterThan(common.shatterShards)
    expect(common.shatterShards).toBeGreaterThan(0)
  })

  it('shatter shards are floored, so the builder must not report a smooth curve', () => {
    // Straight from the mechanic: two nearby benefits that floor to the same shard count.
    expect(getShatterShards('common', 0)).toBe(getShatterShards('common', 19))
  })

  it('reports the long flat stretch in Shatter Shards rather than leaving it a mystery', () => {
    const common = enemyDropsCalculator.compute({ shatterRarity: 'common', shatterShardsLabLevel: 0 })
    // Ninety-nine dead levels is the whole reason this number is on the result.
    expect(common.shatterShardsDeadLevels).toBeGreaterThan(50)
    expect(common.notes.join(' ')).toMatch(/Shatter Shards level\(s\) do not change the common payout/)

    // And the count is honest: the level it names still pays the same, the next one does not.
    const atEdge = enemyDropsCalculator.compute({
      shatterRarity: 'common',
      shatterShardsLabLevel: common.shatterShardsDeadLevels,
    })
    const past = enemyDropsCalculator.compute({
      shatterRarity: 'common',
      shatterShardsLabLevel: common.shatterShardsDeadLevels + 1,
    })
    expect(atEdge.shatterShards).toBe(common.shatterShards)
    expect(past.shatterShards).toBeGreaterThan(common.shatterShards)
  })

  it('a coarser rarity goes flat for fewer levels than a fine one', () => {
    // Epic's scale is 90 against common's 5, so it clears the floor far sooner.
    const epic = enemyDropsCalculator.compute({ shatterRarity: 'epic', shatterShardsLabLevel: 0 })
    const common = enemyDropsCalculator.compute({ shatterRarity: 'common', shatterShardsLabLevel: 0 })
    expect(epic.shatterShardsDeadLevels).toBeLessThan(common.shatterShardsDeadLevels)
  })

  it('names the dead levels rather than leaving a flat number unexplained', () => {
    const r = enemyDropsCalculator.compute({ tier: 10, rerollShardsLabLevel: 0 })
    if (r.rerollShardsDeadLevels > 0) {
      expect(r.notes.join(' ')).toMatch(/do not change the shard count/)
      const ahead = enemyDropsCalculator.compute({
        tier: 10,
        rerollShardsLabLevel: r.rerollShardsDeadLevels,
      })
      expect(ahead.rerollShardsPerBoss).toBe(r.rerollShardsPerBoss)
    }
  })

  it('never throws on partial input', () => {
    for (const input of [{}, { tier: 0 }, { tier: 999 }, { shatterRarity: 'nonsense' }]) {
      expect(() => enemyDropsCalculator.compute(input as never)).not.toThrow()
    }
  })
})

describe('inner land mines', () => {
  const active = { chargedMinesActive: true, chargedMinesLevel: 8 }

  it('a mine that sits is worth more than one that detonates at once', () => {
    const fresh = innerLandMinesCalculator.compute({ ...active, mineAgeSeconds: 0 })
    const aged = innerLandMinesCalculator.compute({ ...active, mineAgeSeconds: 20 })
    expect(fresh.charge).toBe(1)
    expect(aged.charge).toBeGreaterThan(fresh.charge)
    expect(aged.charge).toBeLessThanOrEqual(aged.maxCharge)
  })

  it('caps the age at the mine lifetime instead of inventing charge the game cannot reach', () => {
    const r = innerLandMinesCalculator.compute({ ...active, mineAgeSeconds: 10_000 })
    expect(r.charge).toBe(r.maxCharge)
    expect(r.mineLifetimeSeconds).toBeGreaterThan(0)
  })

  it('ILM+ off means Charged Mines and Chrono Jump contribute nothing, and it says so', () => {
    const off = innerLandMinesCalculator.compute({
      chargedMinesActive: false,
      chargedMinesLevel: 12,
      chronoJumpLabLevel: 10,
      timesHitByIlm: 5,
      mineAgeSeconds: 25,
    })
    expect(off.charge).toBe(1)
    expect(off.notes.join(' ')).toMatch(/ILM\+ is not active/)
  })

  it('Chrono Jump needs hits, and reports when it got none', () => {
    const noHits = innerLandMinesCalculator.compute({ ...active, chronoJumpLabLevel: 10, timesHitByIlm: 0, mineAgeSeconds: 25 })
    const hits = innerLandMinesCalculator.compute({ ...active, chronoJumpLabLevel: 10, timesHitByIlm: 6, mineAgeSeconds: 25 })
    expect(hits.charge).toBeGreaterThan(noHits.charge)
    expect(noHits.notes.join(' ')).toMatch(/pays per hit/)
  })

  it('never divides by an uncharted cooldown', () => {
    // Level 9999 is off the end of every chart, so the cooldown is 0.
    const r = innerLandMinesCalculator.compute({ cooldownLevel: 9999, damageLevel: 9999, quantityLevel: 9999 })
    expect(Number.isFinite(r.damageMultiplierPerSecond)).toBe(true)
    expect(r.damageMultiplierPerSecond).toBe(0)
  })

  it('distinguishes an uncharted level from a real zero', () => {
    const r = innerLandMinesCalculator.compute({ damageLevel: 9999 })
    expect(r.notes.join(' ')).toMatch(/No Damage row is charted/)
  })

  it('effective damage folds in both the count and the charge', () => {
    const r = innerLandMinesCalculator.compute({ ...active, damageLevel: 3, quantityLevel: 3, mineAgeSeconds: 15 })
    expect(r.effectiveDamageMultiplier).toBeCloseTo(r.damageMultiplier * r.mineCount * r.charge, 10)
  })

  it('never throws on partial input', () => {
    for (const input of [{}, { mineAgeSeconds: -5 }, { chargedMinesLevel: NaN }]) {
      expect(() => innerLandMinesCalculator.compute(input as never)).not.toThrow()
    }
  })
})
