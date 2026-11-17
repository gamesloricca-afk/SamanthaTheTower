import { describe, expect, it } from 'vitest'
import { buildThornsBaseChart, buildThornsWallChart } from '../../src/mechanics/combat/thorns-calculator'
import { thornDamageOnHit } from '../../src/mechanics/combat/thorns'
import { getHeatEffectivenessPercent, TOURNAMENT_HEAT_WAVE_TABLE } from '../../src/mechanics/battle-conditions/tournament-heat-bc'

/**
 * Tournament heat has to reach the thorns model at every wave, not just at the breakpoints.
 *
 * The heat table lists 19 waves. It is an INTERVAL table: the row for wave 400 governs 400 to 449,
 * which is how `getHeatEffectivenessPercent` reads it. The thorns calculator kept a private copy
 * and read it with `find(entry => entry.wave === wave)` -- an exact match, so it produced a value
 * at nineteen waves out of a thousand and `undefined` at every other one.
 *
 * `undefined` is the signal for "not in a tournament", so those waves silently fell back to the
 * flat campaign-tier effectiveness. Nothing errored, nothing logged, and the numbers stayed
 * plausible; the tournament setting simply did nothing for 98% of the waves a player can enter.
 *
 * These assertions are written so they cannot pass on the shape of the implementation:
 * the first compares two waves INSIDE one interval, and the second compares against the
 * canonical helper rather than against a number copied out of the same table.
 */

/** Hits to kill an elite is the cheapest observable that moves when effectiveness moves. */
function hitsAtWave(heatWave: number, tournamentTier: 'none' | 't11' | 't14' | 't17'): number {
  const rows = buildThornsWallChart({
    baseThorns: 100,
    tier: 18,
    pcLevel: 0,
    tournamentTier,
    heatWave,
  })
  return rows[0]?.hitsToKillElite ?? -1
}

describe('thorns reads tournament heat as an interval table', () => {
  it('ordinary contact amount uses maximum HP independently of attack damage', () => {
    // v29.1.3 evidence establishes the enemy's maximum-health basis;
    // the low-level contactDamage input is therefore supplied maximum HP.
    expect(thornDamageOnHit({ enemyFactor: 1, thornMultiplier: 0.51, contactDamage: 1000 })).toBe(510)
    expect(thornDamageOnHit({ enemyFactor: 1, thornMultiplier: 0.51, contactDamage: 2000 })).toBe(1020)
  })

  it('keeps the current chart equality policy explicit pending native branch corroboration', () => {
    // This pins current public behavior without treating the inferred strict
    // boundary in the knowledge tests as independent native evidence.
    const row = (percent: number) => buildThornsBaseChart({ baseThorns: percent, tier: 1 })[0]
    expect(row(49).hitsToKillElite).toBe(3)
    expect(row(50).hitsToKillElite).toBe(3)
    expect(row(51).hitsToKillElite).toBe(2)
  })

  it('gives the same answer everywhere inside one breakpoint interval', () => {
    /*
     * 400 is a row; 401 and 449 are inside the row's interval and 450 starts the next one.
     * An exact-match lookup answers only at 400 and falls back for the rest, so the three
     * inside-the-interval waves disagree with each other.
     */
    const atBreakpoint = hitsAtWave(400, 't14')
    const justAfter = hitsAtWave(401, 't14')
    const endOfInterval = hitsAtWave(449, 't14')

    expect({ justAfter, endOfInterval }).toEqual({
      justAfter: atBreakpoint,
      endOfInterval: atBreakpoint,
    })
  })

  it('uses the league column the heat table is actually keyed by', () => {
    /*
     * Silver reads t11 and Gold-and-above read t14. The two columns are identical up to wave 300
     * and diverge after it, so a wave past the split is the only place the choice is observable.
     * Below the split, a model that picked the wrong column would look correct.
     */
    const split = TOURNAMENT_HEAT_WAVE_TABLE.find(row => row.t11 !== row.t14)
    expect(split, 'the columns must diverge somewhere or this test proves nothing').toBeDefined()

    const wave = 800
    expect(getHeatEffectivenessPercent(wave, 'Silver')).not.toBe(getHeatEffectivenessPercent(wave, 'Gold'))

    /* t11 is Silver's column, t14 is Gold's; the thorns options must follow the same split. */
    expect(hitsAtWave(wave, 't11')).not.toBe(hitsAtWave(wave, 't14'))
  })

  it('treats t17 as Legend, which reads the same column as Gold', () => {
    /*
     * T17 is Legend's tier base, and Legend is a Gold-and-above league. It has no column of its
     * own and must not get one invented for it -- the oracle records that these labels name
     * LEAGUES, not tiers.
     */
    for (const wave of [0, 137, 400, 999]) {
      expect(hitsAtWave(wave, 't17'), `wave ${wave}`).toBe(hitsAtWave(wave, 't14'))
    }
  })

  it('applies a tournament at an ordinary wave at all', () => {
    /* If the tournament setting changes nothing, it is not wired -- whatever the numbers look like. */
    expect(hitsAtWave(137, 't14')).not.toBe(hitsAtWave(137, 'none'))
  })
})
