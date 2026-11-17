/**
 * Example 1 — Use the game data with no save file at all.
 *
 * The simplest thing the SDK does: it hands you the game's own tables as typed
 * arrays. Useful for cost calculators, planners, wikis, or anything that needs
 * to know what the game contains.
 *
 * Run it:
 *   npx tsx examples/01-browse-game-data.ts
 */
import { LAB_CATALOG, type LabCatalogRecord } from 'thetowersdk/data'

console.log(`The game has ${LAB_CATALOG.length} labs.\n`)

// Each record is { name, category, base, value, levels }, and every entry in
// `levels` is { level, duration, cost }. `duration` is research time as
// "HH:MM:SS"; `cost` is a plain number of coins.
const [firstLab] = LAB_CATALOG
console.log(`Example record: ${firstLab.name} (${firstLab.category ?? 'uncategorized'})`)
console.log(`  ${firstLab.levels?.length ?? 0} levels`)
console.log(`  level 1 -> cost ${firstLab.levels?.[0]?.cost}, duration ${firstLab.levels?.[0]?.duration}`)
console.log()

// A real question: what does it cost to max each lab? Sum its level costs.
// Costs are coins throughout, so they add up without conversion.
const totalCostToMax = (lab: LabCatalogRecord): number =>
  (lab.levels ?? []).reduce((sum, level) => sum + (level.cost ?? 0), 0)

const ranked = LAB_CATALOG
  .map(lab => ({ name: lab.name, category: lab.category ?? '-', total: totalCostToMax(lab) }))
  .filter(lab => lab.total > 0)
  .sort((a, b) => b.total - a.total)

console.log('10 most expensive labs to max (sum of all level costs):')
for (const lab of ranked.slice(0, 10)) {
  console.log(`  ${lab.name.padEnd(32)} ${lab.category.padEnd(12)} ${lab.total.toExponential(3)}`)
}
console.log()

// Group by category, the way a planner UI would.
const byCategory = new Map<string, number>()
for (const lab of LAB_CATALOG) {
  const category = lab.category ?? 'Uncategorized'
  byCategory.set(category, (byCategory.get(category) ?? 0) + 1)
}
console.log('Labs per category:')
for (const [category, count] of [...byCategory].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${category.padEnd(20)} ${count}`)
}
