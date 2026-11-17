import { describe, expect, it } from 'vitest'
import { BOT_UPGRADES_DATA, botStatValueAt } from '../../src/data/bots/data'
import { BOT_MEDAL_PLANNER_THRESHOLDS } from '../../src/mechanics/bots/medal-planner-types'

/**
 * A threshold the data can never reach is not a policy, it is an off switch.
 *
 * The planner gated duration upgrades behind an absolute uptime gain of 0.012 to 0.030. One
 * duration level is +0.5s, so its gain is `0.5 / cooldown`, which peaks at `0.5 / 50` once the cooldown lab is maxed =
 * 0.01000 — below even the smallest of those. The gate could not pass on any bot at any
 * level, so duration was deferred every time anything else was available and only got bought
 * once everything else had run out. Nothing failed; the plan just quietly never contained
 * duration, which is what players reported.
 *
 * This computes the best gain the catalog can actually produce and holds any uptime-gain
 * threshold to it. It is deliberately about REACHABILITY, not about the right value: a
 * threshold may be strict, but it has to be satisfiable by some real upgrade.
 */

function parseSeconds(value: string): number {
  return Number.parseFloat(String(value).replace(/[^\d.]/g, ''))
}

/** Seconds a maxed lab of this name adds to (or takes off) the stat. */
function labBonus(bot: (typeof BOT_UPGRADES_DATA)[number], name: string): number {
  const lab = bot.labInfo?.find(entry => entry.name === name)
  return lab ? parseSeconds(lab.maxValue) : 0
}

/** The shortest cooldown a bot can reach: its stat floor, then its lab. */
function shortestCooldown(bot: (typeof BOT_UPGRADES_DATA)[number]): number {
  const cooldown = bot.stats.Cooldown
  if (!cooldown) return 0
  return botStatValueAt(cooldown, cooldown.maxLevel) - labBonus(bot, 'Cooldown')
}

/** The largest uptime a single duration level can add, over the whole catalog. */
function bestSingleDurationUptimeGain(): number {
  let best = 0
  for (const bot of BOT_UPGRADES_DATA) {
    const duration = bot.stats.Duration
    const cooldown = shortestCooldown(bot)
    // A duration second is worth the most against the shortest cooldown the bot can reach —
    // which means AFTER its cooldown lab. Leaving labs out understates the range badly:
    // 75s becomes 50s, and the ceiling on uptime goes from 0.47 to 0.90.
    if (!duration || !(duration.perLevel > 0) || !(cooldown > 0)) continue
    best = Math.max(best, duration.perLevel / cooldown)
  }
  return best
}

/** The highest uptime any bot can reach: its longest duration over its shortest cooldown. */
function bestReachableUptime(): number {
  let best = 0
  for (const bot of BOT_UPGRADES_DATA) {
    const cooldown = shortestCooldown(bot)
    if (!(cooldown > 0)) continue
    const duration = bot.stats.Duration
    // Flame has no Duration stat; the game returns a fixed three seconds for it.
    const longestDuration = (duration ? botStatValueAt(duration, duration.maxLevel) : 3)
      + labBonus(bot, 'Duration')
    best = Math.max(best, longestDuration / cooldown)
  }
  return best
}

describe('planner uptime-gain thresholds are reachable', () => {
  const best = bestSingleDurationUptimeGain()

  it('the catalog can produce a duration gain at all', () => {
    expect(best).toBeGreaterThan(0)
  })

  it.each([
    'durationLuxuryMinUptimeGain',
    'durationLuxuryPrimaryMinUptimeGain',
    'durationLowRangeBonusMinUptimeGain',
    'durationLowRangeBonusPrimaryMinUptimeGain',
  ] as const)('%s is satisfiable by some real upgrade', key => {
    const threshold = (BOT_MEDAL_PLANNER_THRESHOLDS as Record<string, number | undefined>)[key]
    // Gone is fine — these four were removed once they were shown to be unreachable. What is
    // not fine is one of them coming back at a value no upgrade can meet.
    if (threshold == null) return
    expect(
      threshold,
      `${key} is ${threshold}, but the best uptime a single duration level can add anywhere `
      + `in the catalog is ${best.toFixed(5)}. A gate at that value never opens.`,
    ).toBeLessThanOrEqual(best)
  })
})

describe('the duty-cycle overshoot penalty can fire', () => {
  /**
   * KNOWN RED, and left that way on purpose.
   *
   * The target is 0.92 and the best any bot can reach is 0.90 — 45s of duration over a 50s
   * cooldown, both labs maxed — so the penalty never applies and subtracting it from the
   * objective is a no-op.
   *
   * It is only just out of reach, and the CONCEPT is sound: `isBotActiveAtTime` uses
   * `min(duration, cooldown)`, so duration past the cooldown is wasted and uptime cannot
   * exceed 1. A diminishing-returns marker near the top of the range is reasonable. This is
   * a threshold two hundredths too high, not a mechanic that should not exist.
   *
   * Left recorded rather than nudged, because the right value is a judgement about when
   * duration stops paying, and that is the owner's call.
   */
  it.fails('its target is below the highest uptime a bot can reach', () => {
    // `dutyCycleOvershootTarget` penalises uptime above 0.92. The best any bot can manage is
    // 35s of duration over a 75s cooldown — 0.467 — so the penalty has never applied to
    // anything, and subtracting it from the objective has been a no-op.
    const best = bestReachableUptime()
    expect(
      BOT_MEDAL_PLANNER_THRESHOLDS.dutyCycleOvershootTarget,
      `the target is ${BOT_MEDAL_PLANNER_THRESHOLDS.dutyCycleOvershootTarget}, but no bot can `
      + `exceed ${best.toFixed(4)} uptime, so the penalty never fires`,
    ).toBeLessThan(best)
  })
})
