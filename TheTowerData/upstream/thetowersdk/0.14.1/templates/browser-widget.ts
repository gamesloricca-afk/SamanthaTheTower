/**
 * TEMPLATE — a browser-safe module.
 *
 * Everything here runs in a bundle with no Node built-ins. That is the whole
 * point of the file: `thetowersdk/node` is the only entry point that needs Node,
 * so a widget that never decodes a save file never imports it.
 *
 * Copy this into a component, a Svelte store, a plain <script type="module"> —
 * it has no framework in it.
 *
 * Browser-safe entry points: data, save, formatting, mechanics, wiki, charts,
 * knowledge, inputs. Node-only: node.
 */
import { LAB_CATALOG, type LabCatalogRecord } from 'thetowersdk/data'
import { formatDuration, formatLargeNumber, parseDurationToHours } from 'thetowersdk/formatting'

export interface LabSummary {
  readonly name: string
  readonly category: string
  readonly maxLevel: number
  readonly costToMax: string
  readonly timeToMax: string
}

/**
 * Turn the catalog into rows a UI can render directly.
 *
 * Formatting happens here rather than in the template, so the numbers a player
 * sees match the game's own ladder no matter which framework renders them.
 */
export function summarizeLabs(catalog: readonly LabCatalogRecord[] = LAB_CATALOG): LabSummary[] {
  return catalog.map(lab => {
    const levels = lab.levels ?? []
    const costToMax = levels.reduce((sum, level) => sum + (level.cost ?? 0), 0)
    /*
     * `duration` is text, and it is NOT all one shape: most rows are "HH:MM:SS"
     * (with hours running past 24, e.g. "500:00:00") but some are "0s". Use
     * `parseDurationToHours` rather than splitting on ":" — a hand-rolled split
     * returns NaN on the "0s" rows and poisons the whole sum.
     */
    const secondsToMax = levels.reduce(
      (sum, level) => sum + parseDurationToHours(level.duration) * 3600,
      0,
    )

    return {
      name: lab.name,
      category: lab.category ?? 'Uncategorized',
      maxLevel: levels.length,
      costToMax: formatLargeNumber(costToMax),
      timeToMax: formatDuration(secondsToMax),
    }
  })
}

/** Narrow to one category — the filter a picker UI needs. */
export function labsInCategory(category: string): LabSummary[] {
  return summarizeLabs().filter(lab => lab.category.toLowerCase() === category.toLowerCase())
}

/*
 * Rendering, framework-free. Replace with your own view layer; the data above
 * does not care which one you use.
 */
export function renderLabTable(rows: readonly LabSummary[]): string {
  const header = ['Lab', 'Category', 'Levels', 'Cost to max', 'Time to max']
  const body = rows.map(row => [row.name, row.category, String(row.maxLevel), row.costToMax, row.timeToMax])
  const widths = header.map((_, index) =>
    Math.max(header[index]!.length, ...body.map(cells => cells[index]!.length)))

  const line = (cells: readonly string[]): string =>
    cells.map((cell, index) => cell.padEnd(widths[index]!)).join('  ')

  return [line(header), line(widths.map(width => '-'.repeat(width))), ...body.map(line)].join('\n')
}
