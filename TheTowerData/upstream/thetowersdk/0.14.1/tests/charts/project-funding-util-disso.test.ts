import { describe, expect, it } from 'vitest'
import { LAB_CATALOG, MODULE_TEMPLATES } from '../../src/data'
import {
  PROJECT_FUNDING_RARITIES,
  projectFundingUtilDissoCash,
  projectFundingUtilDissoGainPer10Data,
  projectFundingUtilDissoMultiplierData,
} from '../../src/charts/datasets/project-funding-util-disso'
import { SHARED_CHART_REGISTRY, findChartsByRendererKey } from '../../src/charts/registry/data'
import { resolveCanonicalToolLookupTable } from '../../src/charts/tables/lookup'

/**
 * The chart is derived, so the assertions here are deliberately NOT a second
 * copy of the arithmetic. They check it against the two catalogs it reads and
 * against the closed form stated in the game's own module description — "tower
 * damage is multiplied by X% of the number of digits in your current cash".
 */
describe('Project Funding under Utility Dissonance', () => {
  const startingCashLab = LAB_CATALOG.find(lab => lab.slug === 'starting_cash')

  it('reads the Starting Cash lab, which is 99 levels of +5', () => {
    expect(startingCashLab).toBeDefined()
    expect(startingCashLab?.levels.length).toBe(99)
    expect(startingCashLab?.value).toBe(5)
  })

  it('grants 80 at level 0 and 5 more per level', () => {
    expect(projectFundingUtilDissoCash(0)).toBe(80)
    expect(projectFundingUtilDissoCash(1) - projectFundingUtilDissoCash(0)).toBe(5)
    expect(projectFundingUtilDissoCash(99)).toBe(575)
  })

  /**
   * The ceiling. One module is equipped per category and Project Funding has no
   * substat that reaches this effect, so Ancestral's rate is the most any
   * account can have. A rate of 2.0 was quoted publicly on 2026-09-06 by
   * summing the sheet's primary and assist halves as though both could hold the
   * same unique; this is the assertion that would have caught it.
   */
  it('tops out at Ancestral, and Ancestral is 1.0 per digit', () => {
    const rates = PROJECT_FUNDING_RARITIES.map(entry => entry.perDigitRate)
    expect(Math.max(...rates)).toBe(1)

    const ancestral = PROJECT_FUNDING_RARITIES.at(-1)
    expect(ancestral?.rarity).toBe('Ancestral')
    expect(ancestral?.perDigitRate).toBe(1)
  })

  it('takes every rate from the module catalog rather than a local copy', () => {
    const template = MODULE_TEMPLATES.find(entry => entry.id === 'project-funding')
    expect(PROJECT_FUNDING_RARITIES.map(entry => entry.perDigitRate))
      .toEqual(template?.rarityBonuses?.map(bonus => bonus.value / 100))
  })

  it('samples every tenth level and finishes at the cap', () => {
    const levels = projectFundingUtilDissoMultiplierData.rows.map(row => row.labLevel)
    expect(levels[0]).toBe(0)
    expect(levels.at(-1)).toBe(99)
    expect(levels.slice(0, -1)).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90])
  })

  it('matches the game description — 1 + rate x digits', () => {
    for (const row of projectFundingUtilDissoMultiplierData.rows) {
      const digits = Math.log10(row.startingCash as number)
      for (const { rarity, perDigitRate } of PROJECT_FUNDING_RARITIES) {
        expect(row[rarity]).toBeCloseTo(1 + perDigitRate * digits, 3)
      }
    }
  })

  /**
   * The shape is the whole point of the chart: the term is logarithmic in a
   * cash figure that is linear in the level, so each band is worth strictly
   * less than the one before it.
   */
  it('falls away band after band, at every rarity', () => {
    for (const { rarity } of PROJECT_FUNDING_RARITIES) {
      const gains = projectFundingUtilDissoGainPer10Data.rows
        .map(row => Number.parseFloat(String(row[rarity]).replace(/[+%]/g, '')))

      expect(gains.every(gain => gain > 0)).toBe(true)
      for (const [index, gain] of gains.slice(1).entries()) {
        expect(gain).toBeLessThan(gains[index])
      }
    }
  })

  it('makes the first ten levels worth more than levels 60 to 99 together', () => {
    const multiplierAt = (level: number) => projectFundingUtilDissoMultiplierData.rows
      .find(row => row.labLevel === level)

    for (const { rarity } of PROJECT_FUNDING_RARITIES) {
      const first = (multiplierAt(10)?.[rarity] as number) / (multiplierAt(0)?.[rarity] as number)
      const rest = (multiplierAt(99)?.[rarity] as number) / (multiplierAt(60)?.[rarity] as number)
      expect(first).toBeGreaterThan(rest)
    }
  })

  it('is reachable from the chart catalog and renders through the lookup', () => {
    for (const rendererKey of ['pf-util-disso-multiplier', 'pf-util-disso-gain-per-10-levels'] as const) {
      const charts = findChartsByRendererKey(rendererKey)
      expect(charts.length).toBe(1)
      expect(charts[0]?.pathId.startsWith('modules:project-funding:')).toBe(true)

      const table = resolveCanonicalToolLookupTable(rendererKey, [])
      expect(table?.rows.length).toBeGreaterThan(0)
      // Every rarity the catalog knows gets a column, so a new rarity shows up
      // rather than being silently dropped.
      for (const { rarity } of PROJECT_FUNDING_RARITIES) {
        expect(table?.columns.some(column => column.key === rarity)).toBe(true)
      }
    }
  })

  it('does not collide with the existing Project Funding chart', () => {
    const pathIds = SHARED_CHART_REGISTRY
      .filter(chart => chart.pathId.startsWith('modules:project-funding:'))
      .map(chart => chart.pathId)

    expect(new Set(pathIds).size).toBe(pathIds.length)
    expect(pathIds).toContain('modules:project-funding:bonus-multipliers')
  })
})
