import { describe, expect, it } from 'vitest'
import { BOT_UPGRADES_DATA, botStatValueAt } from '../../src/data/bots/data'
import { type BotStatDefinition } from '../../src/data/bots/types'
import {
  BOT_COOLDOWN_FLOOR_SECONDS,
  BOT_COOLDOWN_OUTLIER,
  COOLDOWN_SYNC_TARGETS,
  IRREVERSIBLE_UPGRADES,
  REVERSIBLE_UPGRADES,
} from '../../src/knowledge/compartments/footguns'

type Bot = {
  name: string
  stats: Record<string, BotStatDefinition | undefined>
  labInfo: { name: string, maxValue: string }[]
}
const BOTS = BOT_UPGRADES_DATA as unknown as Bot[]
const num = (t: string | undefined): number =>
  Number.parseFloat(String(t ?? '0').replace(/[^\d.-]/g, '')) || 0

const ladderFloor = (bot: Bot): number => {
  const stat = bot.stats.Cooldown!
  return botStatValueAt(stat, stat.maxLevel)
}

describe('the wiki cooldown claim, derived from two shipped tables', () => {
  it('lands four of the five bots on the stated common floor', () => {
    const atFloor = Object.entries(BOT_COOLDOWN_FLOOR_SECONDS)
      .filter(([, floor]) => floor === COOLDOWN_SYNC_TARGETS.botsExceptFlameSeconds)
    expect(atFloor).toHaveLength(4)
    expect(atFloor.map(([name]) => name).sort())
      .toEqual(['Amplify Bot', 'Bot Bot', 'Golden Bot', 'Thunder Bot'])
  })

  it('names Flame Bot as the only exception, as the wiki says', () => {
    expect(BOT_COOLDOWN_OUTLIER).toEqual(['Flame Bot'])
  })

  it('needs the lab as well as the ladder — the ladder alone reaches neither figure', () => {
    for (const bot of BOTS) {
      const floor = BOT_COOLDOWN_FLOOR_SECONDS[bot.name]!
      expect(ladderFloor(bot), `${bot.name} ladder`).toBeGreaterThan(floor)
    }
    // And specifically: four bots sit at 75s before the lab, not 50s.
    const beforeLab = BOTS
      .filter(b => b.name !== 'Flame Bot')
      .map(b => ladderFloor(b))
    expect(new Set(beforeLab)).toEqual(new Set([75]))
  })

  it('gives every bot a cooldown lab of the same size, so the gap is the ladder', () => {
    const labs = BOTS.map(b => num(b.labInfo.find(l => l.name === 'Cooldown')?.maxValue))
    expect(new Set(labs)).toEqual(new Set([-25]))
  })

  it('makes Flame an order-of-magnitude outlier, not a near miss', () => {
    const flame = BOT_COOLDOWN_FLOOR_SECONDS['Flame Bot']!
    expect(flame).toBe(5)
    expect(COOLDOWN_SYNC_TARGETS.botsExceptFlameSeconds / flame).toBe(10)
  })
})

describe('permanence categories', () => {
  it('keeps the irreversible and reversible lists disjoint and non-empty', () => {
    expect(IRREVERSIBLE_UPGRADES.length).toBeGreaterThan(0)
    expect(Object.keys(REVERSIBLE_UPGRADES).length).toBeGreaterThan(0)
    for (const entry of IRREVERSIBLE_UPGRADES) {
      expect(Object.keys(REVERSIBLE_UPGRADES), entry).not.toContain(entry)
    }
  })

  it('records bot cooldown labs as irreversible and bot medal upgrades as not', () => {
    expect(IRREVERSIBLE_UPGRADES.join(' ')).toContain('Bot cooldown LABS')
    expect(Object.keys(REVERSIBLE_UPGRADES)).toContain('Bot medal upgrades')
  })
})
