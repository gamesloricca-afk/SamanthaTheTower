import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BOT_UPGRADES_DATA } from '../../src/data/bots/data'

/**
 * Checks our bot upgrade tables against the Effective Paths reference.
 *
 * The upgrade costs come out clean. What this found is a content gap: every bot
 * has a fifth upgrade in the game that we do not carry at all.
 */

interface BotReference {
  bots: Array<{
    name: string
    statOrder: string[]
    upgrades: Array<{ stat: string; levels: Array<{ level: number; display: string; cost: number | null }> }>
  }>
}

const reference = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'fixtures', 'data', 'effective-paths-bots.json'), 'utf8'),
) as BotReference

const ourBots = Object.values(BOT_UPGRADES_DATA) as Array<{
  name: string
  label: string
  statOrder: string[]
  costs: number[]
}>

const findOurs = (name: string) => ourBots.find(bot => bot.name === name || bot.label === name)

/**
 * The fifth upgrade each bot has in game and we do not model.
 *
 * Not a lookup failure -- there is no entry for these under any name, and they
 * carry their own cost curve rather than sharing the one the first four use
 * (Flame's Wildfire runs 100/150/200 where its other upgrades run 100/140/180).
 * Adding them is a feature, not a data fix: the bot calculators, the save
 * import and the bot lab pairing all assume four stats per bot. Recorded here
 * so the gap is visible and cannot quietly grow to six.
 */
const UNMODELLED_FIFTH_UPGRADES: Record<string, string> = {
  'Flame Bot': 'Wildfire',
  'Thunder Bot': 'Titan Shock',
  'Golden Bot': 'Bonus Cell',
  'Amplify Bot': 'Echoing Shot',
  'Bot Bot': 'Maximum Power',
}

describe('bot upgrades against the Effective Paths reference', () => {
  it('carries the same five bots', () => {
    const theirs = reference.bots.map(bot => bot.name).sort()
    const ours = theirs.filter(name => findOurs(name))
    expect(ours).toEqual(theirs)
  })

  it('keeps Amplify Bot and Bot Bot as separate bots', () => {
    // They were once aliased together, which made Bot Bot read Amplify Bot's
    // levels. The reference lists them as distinct blocks with distinct
    // upgrades -- Echoing Shot against Maximum Power.
    const amplify = reference.bots.find(bot => bot.name === 'Amplify Bot')
    const botBot = reference.bots.find(bot => bot.name === 'Bot Bot')
    expect(amplify?.statOrder).not.toEqual(botBot?.statOrder)
    expect(findOurs('Amplify Bot')).not.toBe(findOurs('Bot Bot'))
  })

  it('agrees on upgrade cost at every level the reference has', () => {
    const mismatches: string[] = []
    let compared = 0

    for (const bot of reference.bots) {
      const ours = findOurs(bot.name)
      if (!ours) continue
      // The first four upgrades share one cost curve, which is what `costs` is.
      const shared = bot.upgrades[0]
      for (const level of shared.levels) {
        if (level.cost === null || level.cost === 0) continue
        const our = ours.costs?.[level.level]
        if (our === undefined) continue
        compared += 1
        if (our !== level.cost) {
          mismatches.push(`${bot.name} L${level.level}: ours=${our} reference=${level.cost}`)
        }
      }
    }

    expect(mismatches).toEqual([])
    expect(compared).toBeGreaterThanOrEqual(135)
  })

  it('records the fifth upgrade we do not model, per bot', () => {
    const missing: Record<string, string> = {}
    for (const bot of reference.bots) {
      const ours = findOurs(bot.name)
      if (!ours) continue
      for (const stat of bot.statOrder) {
        // Exact on a normalized label, not a prefix: "Bonus Cell" is a separate
        // upgrade from "Bonus" and a prefix match hid it. The one genuine
        // spelling difference is the sheet abbreviating Damage Reduction.
        const normalize = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '')
        const theirs = normalize(stat) === 'damager' ? 'damagereduction' : normalize(stat)
        const known = ours.statOrder.some(name => normalize(name) === theirs)
        if (!known) missing[bot.name] = stat
      }
    }
    expect(missing).toEqual(UNMODELLED_FIFTH_UPGRADES)
    // Four modelled per bot; if one ever grows to five this fails and the
    // record above should shrink rather than the expectation being relaxed.
    for (const bot of ourBots) expect(bot.statOrder).toHaveLength(4)
  })
})
