import { describe, expect, it } from 'vitest'
import { GAME_KNOWLEDGE, allNodes } from '../../src/knowledge'
import { BOT_UPGRADES_DATA } from '../../src/data'

/**
 * A family the graph covers, it covers completely.
 *
 * All nine ultimate weapons had their own node. None of the five bots did — the graph described
 * bot range, bot cooldown and the upgrade ladder, and had nothing specific to say about Flame Bot.
 * Nothing reported that, because a graph with 316 nodes and a bot section looks covered.
 *
 * The gap is the shape worth guarding: not a missing fact, but a missing *subject*, where asking
 * about one thing returns the generic answer for its whole family.
 */
const nodeIds = new Set(allNodes(GAME_KNOWLEDGE).map(node => node.id))

/** `Flame Bot` -> `bot.FlameBot`, matching the ids the assertions already used. */
const botNodeId = (name: string) => `bot.${name.replace(/\s+/g, '')}`

describe('every entity in a covered family has its own node', () => {
  it('gives each bot in the catalog a node', () => {
    const missing = BOT_UPGRADES_DATA
      .map(bot => bot.name)
      .filter(name => !nodeIds.has(botNodeId(name)))

    expect(missing, 'these bots exist in the catalog and have nothing said about them').toEqual([])
  })

  it('does not invent a bot the catalog does not have', () => {
    /*
     * The other direction, and the one that matters more: a node for a bot that does not exist
     * would answer questions about it confidently. `BOT_BASE_UNLOCK_COSTS` has a sixth entry that
     * no bot reaches, and the compartment already warns that indexing it proves nothing.
     */
    const real = new Set(BOT_UPGRADES_DATA.map(bot => botNodeId(bot.name)))
    const invented = [...nodeIds].filter(id => /^bot\.[A-Z]/.test(id) && !real.has(id))

    expect(invented, 'a node for a bot the catalog does not contain').toEqual([])
  })

  it('claims a stat order equal to the catalog, not a copy of it', () => {
    /*
     * A hand-written stat order is a second source that can disagree with the calculator reading
     * the first. This compartment claimed one shared list of four stats until 2026-08-17, when the
     * bots do not share one.
     */
    for (const bot of BOT_UPGRADES_DATA) {
      const node = allNodes(GAME_KNOWLEDGE).find(entry => entry.id === botNodeId(bot.name))
      const claimed = node?.assertions?.find(assertion => assertion.predicate === 'statOrder')?.value

      expect(claimed, `${bot.name} statOrder`).toBe(bot.statOrder.join(', '))
    }
  })
})
