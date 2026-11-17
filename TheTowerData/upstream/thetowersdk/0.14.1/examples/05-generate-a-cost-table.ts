/**
 * Example 5 — Generate a cost table for an ultimate weapon.
 *
 * A chart is one rendering of a series. A table is another, and often the more
 * useful one: players want "what does the next level cost, and what do I get"
 * far more often than they want a curve.
 *
 * The point of this example is that the table is *generated*. Nobody maintains
 * a picture or a hand-typed markdown block. When a stat gains levels, or a cost
 * is rebalanced, the same code emits the corrected table — and so does every
 * chart drawn from the same array.
 *
 * Run it:
 *   npx tsx examples/05-generate-a-cost-table.ts
 *   npx tsx examples/05-generate-a-cost-table.ts "Death Wave"
 */
import { uwStoneChartData } from 'thetowersdk/data'
import { formatNumberForDisplay } from 'thetowersdk/formatting'

// Join the rest of argv: every weapon but Spotlight has a space in its name, so
// reading argv[2] alone turns `Golden Tower` into `Golden` unless the caller quotes it.
const requested = process.argv.slice(2).join(' ') || 'Golden Tower'

const weapon = Object.values(uwStoneChartData).find(
  entry => entry.name.toLowerCase() === requested.toLowerCase(),
)

if (!weapon) {
  const known = Object.values(uwStoneChartData).map(entry => entry.name).join(', ')
  console.error(`No ultimate weapon named "${requested}". Known: ${known}`)
  process.exit(1)
}

/** Stone costs are numbers from level 1; level 0 reads "Unlock". */
function stoneCost(level: { cost: unknown }): number | null {
  return typeof level.cost === 'number' ? level.cost : null
}

// ---------------------------------------------------------------------------
// One stat, level by level, with a running total.
// ---------------------------------------------------------------------------

function renderStatTable(statName: string): string[] {
  const stat = weapon!.stats?.find(entry => entry.name === statName)
  if (!stat) return [`  (no "${statName}" stat on ${weapon!.name})`]

  const rows: string[] = []
  let running = 0

  rows.push(`  ${'Lvl'.padStart(4)}  ${'Value'.padStart(10)}  ${'Cost'.padStart(8)}  ${'Total'.padStart(9)}`)
  rows.push(`  ${'-'.repeat(4)}  ${'-'.repeat(10)}  ${'-'.repeat(8)}  ${'-'.repeat(9)}`)

  for (const level of stat.levels ?? []) {
    const cost = stoneCost(level)
    if (cost !== null) running += cost
    rows.push(
      `  ${String(level.level).padStart(4)}`
      + `  ${String(level.value).padStart(10)}`
      + `  ${(cost === null ? '—' : formatNumberForDisplay(cost)).padStart(8)}`
      + `  ${(cost === null ? '—' : formatNumberForDisplay(running)).padStart(9)}`,
    )
  }

  return rows
}

console.log(`${weapon.name} — stone costs\n`)

const statNames = (weapon.stats ?? []).map(stat => stat.name)
console.log(`Stats: ${statNames.join(', ')}\n`)

const primary = statNames[0]
console.log(`${primary}:`)
for (const row of renderStatTable(primary)) console.log(row)
console.log()

// ---------------------------------------------------------------------------
// The whole weapon at a glance — one row per stat.
// ---------------------------------------------------------------------------

console.log(`Every stat on ${weapon.name}:`)
console.log(`  ${'Stat'.padEnd(16)} ${'Levels'.padStart(6)}  ${'To max'.padStart(9)}  Final`)
console.log(`  ${'-'.repeat(16)} ${'-'.repeat(6)}  ${'-'.repeat(9)}  ${'-'.repeat(12)}`)

const skipped: string[] = []

for (const stat of weapon.stats ?? []) {
  const levels = stat.levels ?? []
  const costs = levels.map(stoneCost).filter((cost): cost is number => cost !== null)

  if (costs.length === 0) {
    skipped.push(stat.name)
    continue
  }

  const toMax = costs.reduce((sum, cost) => sum + cost, 0)
  const final = levels.at(-1)?.value ?? '—'
  console.log(
    `  ${stat.name.padEnd(16)} ${String(levels.length).padStart(6)}`
    + `  ${formatNumberForDisplay(toMax).padStart(9)}  ${final}`,
  )
}

// Say what was left out rather than letting a short table imply completeness.
if (skipped.length > 0) {
  console.log(`\n  no numeric stone costs (${skipped.length}): ${skipped.join(', ')}`)
}

// ---------------------------------------------------------------------------
// The same data as Markdown, ready to paste into docs that regenerate.
// ---------------------------------------------------------------------------

console.log(`\nMarkdown:\n`)
console.log(`| Stat | Levels | Stones to max |`)
console.log(`|---|---:|---:|`)
for (const stat of weapon.stats ?? []) {
  const costs = (stat.levels ?? []).map(stoneCost).filter((cost): cost is number => cost !== null)
  if (costs.length === 0) continue
  const toMax = costs.reduce((sum, cost) => sum + cost, 0)
  console.log(`| ${stat.name} | ${stat.levels?.length ?? 0} | ${formatNumberForDisplay(toMax)} |`)
}
