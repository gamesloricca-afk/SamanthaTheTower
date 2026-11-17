import { describe, expect, it } from 'vitest'
import { CALCULATOR_BUILDERS, findCalculatorBuilder } from '../../src/builders'
import { BOT_UPGRADES_DATA, botStatMaxLevel, findBotByName } from '../../src/data'

/**
 * A calculator must not charge for a level that does not exist.
 *
 * All five bots share one 31-entry cost ladder, and no stat uses all of it: Flame Bot's Damage
 * runs to 30, its Cooldown and Range stop at 15. `bot.upgrade` clamped to the LADDER, so asking
 * for Cooldown 0→30 returned thirty rows, charged 20,400 medals, and reported a maximum of 30.
 * Fifteen of those levels cannot be bought and 14,700 of those medals buy nothing — most of the
 * answer.
 *
 * Nothing failed. Every total was a plausible number, every row had a cost, and the only visible
 * symptom was that fifteen rows came back with `value: null`. The bots compartment had warned
 * about precisely this since 2026-08-17 — "reading `costs.length` as levels available offers
 * upgrades that do not exist" — while the calculator beside it did exactly that.
 */
describe('bot upgrades stop where the stat stops', () => {
  it('caps each stat at its own ceiling, not the shared ladder', () => {
    const builder = findCalculatorBuilder('bot.upgrade')!

    for (const bot of BOT_UPGRADES_DATA) {
      const data = findBotByName(bot.name)!
      for (const stat of bot.statOrder) {
        const ceiling = botStatMaxLevel(data, stat)
        const result = builder.compute({ bot: bot.name, stat, currentLevel: 0, targetLevel: 9999 })

        expect(result.maxLevel, `${bot.name} ${stat} maxLevel`).toBe(ceiling)
        expect(result.levels.length, `${bot.name} ${stat} rows`).toBe(ceiling)
      }
    }
  })

  it('never returns a level row with no value behind it', () => {
    /*
     * The one place the old behaviour surfaced. A row with a cost and no value is a level being
     * sold that the stat table does not describe.
     */
    const builder = findCalculatorBuilder('bot.upgrade')!
    const empty: string[] = []

    for (const bot of BOT_UPGRADES_DATA) {
      for (const stat of bot.statOrder) {
        const result = builder.compute({ bot: bot.name, stat, currentLevel: 0, targetLevel: 9999 })
        for (const row of result.levels) {
          if (row.value === null || row.value === undefined) empty.push(`${bot.name} ${stat} L${row.level}`)
        }
      }
    }

    expect(empty).toEqual([])
  })

  it('charges different totals for stats with different ceilings', () => {
    /*
     * The tell that would have caught this immediately: every stat on a bot reported the same
     * total, because every one was priced over the same ladder.
     */
    const builder = findCalculatorBuilder('bot.upgrade')!
    const totals = findBotByName('Flame Bot')!.statOrder.map(stat =>
      builder.compute({ bot: 'Flame Bot', stat, currentLevel: 0, targetLevel: 9999 }).totalMedals)

    expect(new Set(totals).size).toBeGreaterThan(1)
  })

  it('says which stat was clamped, not just which bot', () => {
    const builder = findCalculatorBuilder('bot.upgrade')!
    const result = builder.compute({ bot: 'Flame Bot', stat: 'Cooldown', currentLevel: 0, targetLevel: 30 })

    expect(result.notes.join(' ')).toContain('Cooldown')
    expect(result.notes.join(' ')).toContain('15')
  })

  it('leaves no calculator returning a priced row with a null value', () => {
    /*
     * The general form, across every calculator that reports per-level rows — this was found by
     * sweeping for null values in results, not by reading the bot code.
     */
    const offenders: string[] = []

    for (const builder of CALCULATOR_BUILDERS) {
      const result = builder.compute(builder.defaults) as { levels?: unknown }
      if (!Array.isArray(result.levels)) continue

      for (const row of result.levels as Record<string, unknown>[]) {
        const priced = Object.keys(row).some(key => /cost/i.test(key))
        if (priced && 'value' in row && (row.value === null || row.value === undefined)) {
          offenders.push(`${builder.id} L${row.level}`)
        }
      }
    }

    expect(offenders).toEqual([])
  })
})
