import { describe, expect, it } from 'vitest'
import { BOT_UPGRADES_DATA , botStatValueAt} from '../../src/data'
import {
  computeBotCooldownSecondsAtLevel,
  computeBotDurationSecondsAtLevel,
} from '../../src/mechanics/bots/compute'

/**
 * A formula standing in for a table has to reproduce the table.
 *
 * Rule 9 of the organization contract allows a formula to replace a lookup only where it matches
 * every row exactly, and this is that proof for bot cooldown and duration. It is not decoration:
 * `computeBotDurationSecondsAtLevel` disagreed with the catalog on 19 of Thunder Bot's 21 levels
 * — it stepped a whole second per level where the game steps half of one, so it hit the 15s cap at
 * level 10 instead of level 20 and reported levels 11 to 20 as an identical flat band.
 *
 * Nothing caught that, and nothing would have: neither function is called anywhere in this
 * package. They were reachable only by a consumer importing `thetowersdk/internal/*`, which is
 * exactly the surface Rule 1 exists to abolish — a public API nobody was testing because nobody
 * here used it.
 *
 * Lab level is held at 0 throughout. The lab is a separate term with its own cap, and the catalog
 * rows are the bot's own ladder; folding a lab bonus in would compare the formula against a
 * different question from the one the table answers.
 */

/** Bot name to the prefix its upgrade keys use. */
const PREFIX_BY_BOT: Readonly<Record<string, string>> = {
  'Flame Bot': 'fb',
  'Thunder Bot': 'tb',
  'Golden Bot': 'gb',
  'Amplify Bot': 'ab',
  'Bot Bot': 'bb',
}

/** `"5.5s"` -> `5.5`. The catalog stores these as display strings. */
function seconds(value: unknown): number {
  return Number.parseFloat(String(value).replace(/[^\d.]/g, ''))
}

type Row = { bot: string, stat: string, level: number, catalog: number, formula: number }

function everyRow(): Row[] {
  const rows: Row[] = []
  for (const bot of BOT_UPGRADES_DATA) {
    const prefix = PREFIX_BY_BOT[bot.name]
    if (!prefix) continue
    for (const stat of ['Cooldown', 'Duration'] as const) {
      const definition = bot.stats?.[stat]
      if (!definition) continue
      for (let level = 0; level <= definition.maxLevel; level += 1) {
        rows.push({
          bot: bot.name,
          stat,
          level,
          catalog: botStatValueAt(definition, level),
          formula: stat === 'Cooldown'
            ? computeBotCooldownSecondsAtLevel(prefix, level, 0)
            : computeBotDurationSecondsAtLevel(prefix, level, 0),
        })
      }
    }
  }
  return rows
}

describe('bot timing formulas reproduce the catalog', () => {
  const rows = everyRow()

  it('has rows from every bot, so an empty sweep cannot pass', () => {
    expect(rows.length).toBeGreaterThan(150)
    expect(new Set(rows.map(row => row.bot)).size).toBe(5)
    expect(new Set(rows.map(row => row.stat))).toEqual(new Set(['Cooldown', 'Duration']))
  })

  it('matches every cooldown level on every bot', () => {
    const wrong = rows
      .filter(row => row.stat === 'Cooldown' && row.formula !== row.catalog)
      .map(row => `${row.bot} L${row.level}: catalog ${row.catalog}s, formula ${row.formula}s`)
    expect(wrong).toEqual([])
  })

  it('matches every duration level on every bot that has one', () => {
    const wrong = rows
      .filter(row => row.stat === 'Duration' && row.formula !== row.catalog)
      .map(row => `${row.bot} L${row.level}: catalog ${row.catalog}s, formula ${row.formula}s`)
    expect(wrong).toEqual([])
  })

  it('climbs Thunder Bot in half seconds, reaching the cap at its last level and not before', () => {
    /*
     * The specific shape of the bug, pinned so a "simplification" cannot reintroduce it. A whole-
     * second step passes neither of these: it reaches 15 at level 10, and level 11 is not 10.5.
     */
    expect(computeBotDurationSecondsAtLevel('tb', 1, 0)).toBe(5.5)
    expect(computeBotDurationSecondsAtLevel('tb', 11, 0)).toBe(10.5)
    expect(computeBotDurationSecondsAtLevel('tb', 10, 0)).toBeLessThan(15)
    expect(computeBotDurationSecondsAtLevel('tb', 20, 0)).toBe(15)
  })
})
