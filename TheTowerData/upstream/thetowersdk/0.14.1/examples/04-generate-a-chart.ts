/**
 * Example 4 — Generate charts from game data.
 *
 * There is no chart API in this package, and that is the point: a level
 * progression already *is* a series. The level is the x-axis and every measured
 * field on that level is a line, so producing plot-ready data is a `map`.
 *
 * Nothing here imports a charting library. The output is `{ x, y }` points you
 * hand to Chart.js, D3, Vega, a spreadsheet, or an SVG path you build yourself.
 *
 * Run it:
 *   npx tsx examples/04-generate-a-chart.ts
 */
import { LAB_CATALOG, uwStoneChartData } from 'thetowersdk/data'
import { formatNumberForDisplay } from 'thetowersdk/formatting'

type Point = { x: number, y: number }

/** Lab research time is "HH:MM:SS", where hours may exceed 24. */
function durationToHours(raw: string): number {
  const parts = raw.split(':').map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return 0
  return parts[0] + parts[1] / 60 + parts[2] / 3600
}

// ---------------------------------------------------------------------------
// 1. One entity across its levels — two series from the same progression.
// ---------------------------------------------------------------------------

const lab = LAB_CATALOG.find(entry => entry.name === 'Attack Speed') ?? LAB_CATALOG[0]

const costCurve: Point[] = (lab.levels ?? []).map(level => ({ x: level.level, y: level.cost }))
const timeCurve: Point[] = (lab.levels ?? []).map(level => ({
  x: level.level,
  y: durationToHours(level.duration),
}))

console.log(`${lab.name}: ${costCurve.length} levels\n`)
console.log(`  cost   level 1 -> ${formatNumberForDisplay(costCurve[0].y)}`)
console.log(`  cost   level ${costCurve.at(-1)!.x} -> ${formatNumberForDisplay(costCurve.at(-1)!.y)}`)
console.log(`  time   level ${timeCurve.at(-1)!.x} -> ${timeCurve.at(-1)!.y.toFixed(1)}h`)
console.log()

// ---------------------------------------------------------------------------
// 2. Many entities at once — the shape most real charts need.
// ---------------------------------------------------------------------------

const allWeapons = Object.values(uwStoneChartData)
const datasets: Array<{ label: string, data: Point[] }> = []
const skipped: string[] = []

for (const weapon of allWeapons) {
  const cooldown = weapon.stats?.find(stat => stat.name === 'Cooldown')
  // Level 0 costs "Unlock" rather than a number, so it is not plottable.
  const data = (cooldown?.levels ?? [])
    .filter((level): level is typeof level & { cost: number } => typeof level.cost === 'number')
    .map(level => ({ x: level.level, y: level.cost }))

  if (data.length === 0) {
    skipped.push(weapon.name)
    continue
  }
  datasets.push({ label: weapon.name, data })
}

console.log(`Cooldown stone cost — ${datasets.length} of ${allWeapons.length} ultimate weapons plotted:`)
for (const set of datasets) {
  const total = set.data.reduce((sum, point) => sum + point.y, 0)
  console.log(`  ${set.label.padEnd(22)} ${String(set.data.length).padStart(3)} points  ${formatNumberForDisplay(total).padStart(8)} stones total`)
}

// Say what was left out. A filtered-away entity that goes unmentioned reads as
// "this weapon has no cooldown", which is a different claim from "this catalog
// does not model one".
if (skipped.length > 0) {
  console.log(`\n  no chartable Cooldown series (${skipped.length}): ${skipped.join(', ')}`)
}
console.log()

// ---------------------------------------------------------------------------
// 3. Render it, with no dependencies, to prove the points are all you need.
// ---------------------------------------------------------------------------

/** Lab costs span orders of magnitude, so plot them on a log scale. */
function sparkline(points: Point[], width = 60): string {
  const bars = '▁▂▃▄▅▆▇█'
  if (points.length < 2) return ''

  const step = (points.length - 1) / (width - 1)
  const sampled = Array.from({ length: width }, (_, i) => points[Math.round(i * step)].y)
  const scaled = sampled.map(y => (y > 0 ? Math.log10(y + 1) : 0))
  const max = Math.max(...scaled)
  if (max <= 0) return ''

  return scaled
    .map(value => bars[Math.min(bars.length - 1, Math.floor((value / max) * (bars.length - 1)))])
    .join('')
}

console.log(`${lab.name} coin cost (log scale):`)
console.log(`  ${sparkline(costCurve)}`)
console.log(`${lab.name} research time (log scale):`)
console.log(`  ${sparkline(timeCurve)}`)
