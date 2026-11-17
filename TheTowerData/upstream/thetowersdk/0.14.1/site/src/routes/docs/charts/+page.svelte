<script lang="ts">
	import { sdkFacts } from '$lib/sdk-facts';
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import { href } from '$lib/paths';
</script>

<h1 class="text-3xl font-semibold">Charts</h1>
<p class="mt-3 text-muted">
	Forty-six ready-made chart datasets — cost curves, upgrade ladders, spawn rates, drop tables —
	each one resolving to a finished table with its own title, columns and formatted cells. Render
	them however you like: as HTML, as an image, into a spreadsheet, or as a Discord embed.
</p>

<h2 class="mt-10 text-xl font-semibold">Browse What Exists</h2>
<p class="mt-3 text-muted">
	<code>SHARED_CHART_REGISTRY</code> lists every chart with a stable id, a title and a description.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { SHARED_CHART_REGISTRY } from 'thetowersdk/charts'

for (const chart of SHARED_CHART_REGISTRY) {
  console.log(chart.pathId, '—', chart.title)
}

// vault:upgrades-and-cost:harmony-tree     — Harmony Tree Upgrades & Costs
// bots:upgrades-and-costs:golden-bot       — Bot Upgrades: Golden Bot
// ultimate-weapons:death-wave:gold-bot-vs-death-wave-uptime
//                                          — Golden Bot vs Death Wave Uptime

console.log(SHARED_CHART_REGISTRY.length)   // 46`}
	/>
</div>
<p class="mt-3 text-muted">
	Each entry carries <code>pathId</code>, <code>rendererKey</code>, <code>title</code>,
	<code>description</code>, <code>fileName</code> and <code>colorHex</code> — enough to build a browsable
	index without opening any of them.
</p>

<h2 class="mt-10 text-xl font-semibold">Get A Chart's Data</h2>
<p class="mt-3 text-muted">
	<code>resolveCanonicalToolDataset</code> takes a renderer key and its arguments, and returns the table.
	Cells arrive already formatted the way the game writes them, so a value is ready to print.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { resolveCanonicalToolDataset } from 'thetowersdk/charts'

const dataset = resolveCanonicalToolDataset('bot-upgrades', ['Golden Bot'])

console.log(dataset.title)
// 'Golden Bot Upgrades'

console.log(dataset.columns.map((column) => column.label))
// ['Level', 'Damage Reduction', 'Cost', 'Cooldown', 'Cost', 'Damage', 'Cost', 'Range', 'Cost']

console.log(dataset.rows[0])
// { id: 0, c0: 'Unlock', c1: '20%', c2: '0', c3: '75s', c4: '0', c5: '50x', … }`}
	/>
</div>
<p class="mt-3 text-muted">
	Rows are keyed <code>c0</code>, <code>c1</code>, <code>c2</code> and so on, matching the order of
	<code>columns</code>. Pair the two and a row prints itself.
</p>

<h3 class="mt-6 text-lg font-medium">The Arguments</h3>
<p class="mt-2 text-muted">
	Several charts share one renderer — the four bot charts are the same renderer with a different bot
	— so the argument list picks which one you want. It takes the item's <strong>display name</strong
	>, which is the last segment of the <code>pathId</code> in title case. Deriving it from the registry
	means you never have to keep a second list.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { SHARED_CHART_REGISTRY, resolveCanonicalToolDataset } from 'thetowersdk/charts'

/** 'bots:upgrades-and-costs:golden-bot' -> 'Golden Bot' */
const argsFor = (chart) => [
  chart.pathId
    .split(':')
    .pop()
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
]

for (const chart of SHARED_CHART_REGISTRY) {
  const dataset = resolveCanonicalToolDataset(chart.rendererKey, argsFor(chart))
  console.log(chart.title, '->', dataset.rows.length, 'rows')
}`}
	/>
</div>
<p class="mt-3 text-muted">
	A renderer with only one chart ignores the argument, so the same call works for every entry in the
	registry.
</p>

<h2 class="mt-10 text-xl font-semibold">Render It As A Table</h2>
<p class="mt-3 text-muted">
	Because columns and rows line up by index, one loop renders any of the {sdkFacts.chartDatasets}.
</p>
<div class="mt-4">
	<CodeBlock
		code={`function toHtmlTable(dataset) {
  const head = dataset.columns.map((column) => \`<th>\${column.label}</th>\`).join('')

  const body = dataset.rows
    .map((row) => {
      const cells = dataset.columns
        .map((column, index) => \`<td>\${row[\`c\${index}\`] ?? ''}</td>\`)
        .join('')
      return \`<tr>\${cells}</tr>\`
    })
    .join('')

  return \`<table><caption>\${dataset.title}</caption>
    <thead><tr>\${head}</tr></thead><tbody>\${body}</tbody></table>\`
}`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Look Up A Single Cell</h2>
<p class="mt-3 text-muted">
	When you want one value rather than a whole table, <code>resolveCanonicalToolLookupTable</code>
	indexes the same data by row and column key.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { resolveCanonicalToolLookupTable } from 'thetowersdk/charts'

const table = resolveCanonicalToolLookupTable('gold-bot-vs-death-wave-uptime', [])

console.log(table.columnKeys)   // ['gbCooldown', 'dwOffset', 'syncUptime']
console.log(table.rows[0].record)
// { gbCooldown: '38s', dwOffset: '2s', syncUptime: '0%' }

// Or reach a cell directly by its row id and column key.
console.log(table.rows[0].cellsByKey.syncUptime.value)`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Charts From Your Own Series</h2>
<p class="mt-3 text-muted">
	The registry covers the common questions. For anything else, any catalog with a level progression
	is already a series — build the rows yourself and render them the same way.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { LAB_CATALOG } from 'thetowersdk/data'
import { formatNumberForDisplay } from 'thetowersdk/formatting'

const lab = LAB_CATALOG.find((entry) => entry.name === 'Attack Speed')

const dataset = {
  title: \`\${lab.name} — cost by level\`,
  columns: [{ label: 'Level' }, { label: 'Coins' }, { label: 'Research time' }],
  rows: lab.levels.map((level, index) => ({
    id: index,
    c0: String(level.level),
    c1: formatNumberForDisplay(level.cost),
    c2: level.duration
  }))
}

console.log(toHtmlTable(dataset))`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Every Renderer Key</h2>
<p class="mt-3 text-muted">
	<code>listChartRendererKeys</code> gives the twenty-seven distinct renderers behind the {sdkFacts.chartDatasets}
	charts, and <code>findChartsByRendererKey</code> gives every chart that uses one.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { listChartRendererKeys, findChartsByRendererKey } from 'thetowersdk/charts'

console.log(listChartRendererKeys().length)          // 27

for (const chart of findChartsByRendererKey('bot-upgrades')) {
  console.log(chart.title)
}
// Bot Upgrades: Flame Bot
// Bot Upgrades: Golden Bot
// Bot Upgrades: Thunder Bot
// Bot Upgrades: Amplify Bot`}
	/>
</div>

<p class="mt-8 text-sm">
	<a href={href('/docs/data/')}>Catalogs →</a>
	·
	<a href={href('/docs/sheets/')}>Spreadsheets →</a>
	·
	<a href={href('/docs/bots/')}>Discord Bots →</a>
</p>
