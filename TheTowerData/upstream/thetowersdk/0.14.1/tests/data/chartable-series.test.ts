import { describe, expect, it } from 'vitest'

import { BOT_UPGRADES_DATA } from '../../src/data/bots/data'
import { CARD_TEMPLATES } from '../../src/data/cards/data'
import { LAB_CATALOG } from '../../src/data/labs/catalog.data'
import { uwStoneChartData } from '../../src/data/ultimate-weapons/stones.data'
import { buildGuardianDefinitions } from '../../src/data/guardians/definitions'
import { getWorkshopStatDefinitions } from '../../src/data/workshop/progress-definitions'

/**
 * The README and the SDK site both publish a chartable-series count.
 *
 * A number typed into prose has no way to notice when the data behind it moves,
 * so this recomputes it from the catalogs. If a lab gains a field or a new
 * ultimate weapon ships, this fails and names the new total instead of leaving
 * the docs quietly wrong.
 */

const PUBLISHED_TOTAL = 806

function isPlottable(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'string') return false
  return /^[x×]?\s*-?\d/.test(value.trim())
}

const AXIS_KEYS = new Set(['level', 'name', 'key', 'label', 'id', 'category'])

function seriesInProgression(levels: unknown): number {
  const rows = Array.isArray(levels)
    ? levels
    : levels && typeof levels === 'object'
      ? Object.values(levels as Record<string, unknown>)
      : []

  const sample = rows[0]
  if (sample === undefined) return 0
  if (typeof sample !== 'object' || sample === null) return isPlottable(sample) ? 1 : 0

  // Union across rows: UW stats read `cost: "Unlock"` at level 0 and a real
  // number afterwards, so sampling only row 0 drops every UW cost curve.
  const plottable = new Set<string>()
  for (const row of rows.slice(0, 8)) {
    if (typeof row !== 'object' || row === null) continue
    for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
      if (!AXIS_KEYS.has(key) && isPlottable(value)) plottable.add(key)
    }
  }
  return plottable.size
}

function countByCategory(): Record<string, number> {
  let labs = 0
  for (const lab of LAB_CATALOG) labs += seriesInProgression(lab.levels)

  let workshop = 0
  for (const stat of getWorkshopStatDefinitions()) workshop += seriesInProgression(stat.levels)

  let cards = 0
  for (const card of CARD_TEMPLATES) {
    if (card.levelValues?.length) cards += 1
    if (card.masteryValues?.length) cards += 1
  }

  let ultimateWeapons = 0
  for (const weapon of Object.values(uwStoneChartData)) {
    for (const stat of weapon.stats ?? []) ultimateWeapons += seriesInProgression(stat.levels)
  }

  // Bot stats are formulas rather than enumerated level tables, so each one is a series if
  // it has levels to plot — `seriesInProgression` counts entries and there are none to count.
  let bots = 0
  for (const bot of BOT_UPGRADES_DATA) {
    for (const stat of Object.values(bot.stats ?? {})) bots += (stat?.maxLevel ?? 0) > 0 ? 1 : 0
    for (const stat of Object.values(bot.plus?.stats ?? {})) bots += (stat?.maxLevel ?? 0) > 0 ? 1 : 0
  }

  let guardians = 0
  for (const guardian of buildGuardianDefinitions()) {
    for (const stat of Object.values(guardian.stats ?? {})) guardians += seriesInProgression(stat?.levels)
  }

  return { labs, workshop, cards, ultimateWeapons, bots, guardians }
}

describe('chartable series count published in the docs', () => {
  it('still matches the shipped catalogs', () => {
    const parts = countByCategory()
    expect(parts).toEqual({ labs: 468, workshop: 141, cards: 64, ultimateWeapons: 72, bots: 25, guardians: 36 })
    const total = Object.values(parts).reduce((sum, count) => sum + count, 0)

    expect(
      total,
      `Chartable series moved to ${total}. Update the count in packages/sdk/README.md `
      + `(the "Charts" section and the intro bullet) and the per-source table. Breakdown: `
      + JSON.stringify(parts),
    ).toBe(PUBLISHED_TOTAL)
  })

  it('counts something from every source it claims to cover', () => {
    // A source silently returning 0 would still let the total pass if another
    // source drifted up by the same amount.
    for (const [source, count] of Object.entries(countByCategory())) {
      expect(count, `${source} contributed no chartable series`).toBeGreaterThan(0)
    }
  })

  it('excludes catalogs with nothing to plot', () => {
    // Relics carry one flat value, so a progression scan must find no series.
    expect(seriesInProgression(undefined)).toBe(0)
    expect(seriesInProgression([])).toBe(0)
    // A row of pure identifiers is not a chart.
    expect(seriesInProgression([{ id: 'discount1', name: '2.5% Discount' }])).toBe(0)
  })
})
