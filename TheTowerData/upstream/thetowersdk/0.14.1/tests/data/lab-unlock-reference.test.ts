import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MILESTONE_KEY_UNLOCK_ROWS } from '../../src/data/milestones/tracks'

/**
 * Checks which tier and wave unlocks each lab against the Effective Paths
 * reference.
 *
 * Our equivalent is MILESTONE_KEY_UNLOCK_ROWS, NOT labs-research's
 * `tierUnlock` / `milestoneUnlock`. Those two fields are table indices,
 * not a tier and a wave: Workshop Attack
 * Discount carries milestoneUnlock 3 where the wave is 40, because 3 indexes a
 * milestone row. Comparing them against the sheet produced 192 "mismatches"
 * that were nothing of the kind.
 */

interface UnlockReference {
  unlocks: Array<{ name: string; tier: number; wave: number }>
}

const reference = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'fixtures', 'data', 'effective-paths-lab-unlocks.json'), 'utf8'),
) as UnlockReference

/**
 * Our milestone rewards use a third lab vocabulary, distinct from both the
 * research catalog slugs and the labs-static display names -- "Orb Speed" for
 * "Orbs Speed", "Super Crit Multiplier" for "Super Crit Multi", "Missile
 * Explosion" for "Missiles Explosion". Fold the plural and that one suffix so
 * the comparison is about tiers and waves rather than spelling.
 */
const matchKey = (value: string): string => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '')
  .replace(/multiplier$/, 'multi')
  .replace(/s$/, '')

/** A reward can appear on both tracks and at more than one tier, so keep them all. */
const oursByReward = new Map<string, Array<{ tier: number; wave: number; track: string }>>()
for (const row of MILESTONE_KEY_UNLOCK_ROWS) {
  if (row.kind !== 'unlock') continue
  const key = matchKey(row.reward)
  if (!oursByReward.has(key)) oursByReward.set(key, [])
  oursByReward.get(key)!.push({ tier: row.tier, wave: row.wave, track: row.track })
}

/**
 * Six labs used to sit at the wrong tier or wave and now match the reference.
 *
 * Each was checked against the rest of its tier before being moved, and in
 * every case the surrounding rows already agreed, which is what made the
 * placement rather than the sheet the thing at fault:
 *
 * - Max Interest was tier 1 wave 80; it belongs at tier 2 wave 80 next to
 *   Interest %, which we already had there.
 * - Land Mine Decay was tier 4 premium; tier 6 wave 30 already held Land Mine
 *   Damage, and the reference lists both together.
 * - Wall Rebuild was tier 7 wave 10; tier 8 wave 10 already held Wall Health.
 * - The four tier 10 bot unlocks and the two tier 16 Swamp Rend unlocks sat at
 *   wave 50, where the reference puts every unlock in those groups at wave 60.
 */

describe('lab unlocks against the Effective Paths reference', () => {
  it('agrees on tier and wave for every lab it shares', () => {
    const disagreements: string[] = []
    let matched = 0

    for (const entry of reference.unlocks) {
      const ours = oursByReward.get(matchKey(entry.name))
      if (!ours) continue
      if (ours.some(row => row.tier === entry.tier && row.wave === entry.wave)) {
        matched += 1
        continue
      }
      const describe = ours.map(row => `T${row.tier} W${row.wave} [${row.track}]`).join(' / ')
      disagreements.push(`${entry.name}: reference=T${entry.tier} W${entry.wave}, ours=${describe}`)
    }

    expect(disagreements.sort()).toEqual([])
    expect(matched).toBeGreaterThanOrEqual(94)
  })

  it('records how much of the reference our milestone rows cover', () => {
    // 203 labs in the reference against 140 rewards in our milestone rows, and
    // the shortfall is real: Dissonant Echo, the Enhancement coin discounts and
    // the Death Wave labs have no milestone entry at all. Ratchet this up as
    // they are filled in; a drop means rows were lost.
    const covered = reference.unlocks.filter(entry => oursByReward.has(matchKey(entry.name))).length
    expect(covered).toBeGreaterThanOrEqual(94)
    expect(reference.unlocks.length).toBeGreaterThanOrEqual(203)
  })
})
