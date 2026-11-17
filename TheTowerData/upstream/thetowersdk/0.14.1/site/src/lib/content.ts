import { INSTALL_CMD } from './links';

/**
 * Whether the governance system appears on the site.
 *
 * ACS is still in development, and a site that advertises it invites people to look for something
 * that is not ready. Flipping this to `true` restores the navigation entries, the home-page
 * section, the footer link, and prerendering of `/ags` and `/docs/ags` — the pages themselves are
 * kept, not deleted, so turning it back on is one edit rather than a rewrite.
 *
 * The governance ENGINE is separately disabled in the monorepo; see
 * `scripts/governance-engine-disabled.mjs`. This flag only controls what the site says.
 */
export const SHOW_GOVERNANCE = false;

const ALL_NAV = [
	{ href: '/start/', label: 'Get Started' },
	{ href: '/tools/', label: 'What You Can Build' },
	{ href: '/playground/', label: 'Examples' },
	{ href: '/docs/', label: 'Docs' },
	{ href: '/ai/', label: 'AI & ACS', governance: true },
	// Last in the bar, and last in the footer's site column, so the two orders match.
	{ href: '/docs/license/', label: 'License' }
] as const;

export const nav = ALL_NAV.filter((item) => SHOW_GOVERNANCE || !('governance' in item));

const ALL_DOCS_NAV = [
	{ href: '/docs/', label: 'Overview' },
	{ href: '/docs/install/', label: 'Install' },
	{ href: '/docs/dependencies/', label: 'Dependencies' },
	{ href: '/docs/data/', label: 'Game Data' },
	{ href: '/docs/save/', label: 'Save Files' },
	{ href: '/docs/mechanics/', label: 'Formulas' },
	{ href: '/docs/formatting/', label: 'Formatting' },
	{ href: '/docs/charts/', label: 'Charts' },
	{ href: '/docs/builders/', label: 'Builders' },
	{ href: '/docs/bots/', label: 'Bots' },
	{ href: '/docs/sheets/', label: 'Spreadsheets' },
	{ href: '/docs/knowledge/', label: 'Knowledge' },
	{ href: '/docs/patch-notes/', label: 'Patch Notes' },
	{ href: '/docs/wiki/', label: 'Wiki' },
	{ href: '/docs/desktop-and-mobile/', label: 'Desktop & Mobile' },
	{ href: '/docs/wasm/', label: 'Any Language' },
	{ href: '/docs/mcp/', label: 'MCP & AI' },
	{ href: '/docs/towerai/', label: 'TowerAI' },
	{ href: '/docs/ags/', label: 'ACS', governance: true },
	{ href: '/docs/license/', label: 'Licensing' }
] as const;

export const docsNav = ALL_DOCS_NAV.filter((item) => SHOW_GOVERNANCE || !('governance' in item));

/**
 * Hero slides, rotating one at a time.
 *
 * Each is a different answer to "what is this for", because the package has several honest answers
 * and a single headline has to pick one. Five is the ceiling: past that the rotation outlasts any
 * reader's attention and the later slides are never seen.
 *
 * Ordered the same way as `features` — the game's own numbers first, and nothing about the
 * assistant tooling here at all. The hero is where a reader decides whether this is a serious data
 * package, and leading with AI in a game where every number is knowable would answer that wrong.
 *
 * `headline` is deliberately short. It renders at display size, and a third line pushes the call to
 * action below the fold on a laptop.
 */
export const heroSlides = [
	{
		eyebrow: 'Game Data',
		headline: 'Build Tower Tools On Real Game Data',
		body: 'Every catalog, formula and save field from The Tower, as typed code. Build calculators, trackers, spreadsheets, charts and bots on numbers that came out of the game.'
	},
	{
		eyebrow: 'Catalogs',
		headline: 'Every Number The Game Ships With',
		body: 'Labs, workshop, modules, cards, relics, bots, guardians, ultimate weapons, vault trees, perks and milestones. Every level, every cost, typed and ready to query.'
	},
	{
		eyebrow: 'Math',
		headline: 'The Formulas, Not Just The Tables',
		body: 'Enemy scaling, ultimate weapon timing, lab and workshop costs, and Effective Paths planning, as functions you call with a tier, a wave, or a level.'
	},
	{
		eyebrow: 'Save Files',
		headline: 'Read A Real Account In One Call',
		body: 'Decode tool_export.json and pull research, modules, cards, ultimate weapons, vault and every stored run straight into typed objects.'
	},
	{
		eyebrow: 'Output',
		headline: 'Charts, Sheets And Bots From One Source',
		body: 'The same catalogs render cost tables as images, build live spreadsheets, and answer Discord commands. Add rows to the data and every view regenerates.'
	},
	{
		eyebrow: 'Assistant',
		headline: 'Ship An Assistant That Knows The Game',
		body: 'TowerAI answers from a knowledge base you curate, with the catalogs supplying live numbers. Register the MCP server and your editor builds against real exports too.'
	},
	{
		eyebrow: 'Calculators',
		headline: 'Ready-Made Builders That Describe Themselves',
		body: 'Each one lists its own inputs with their units, ranges and options — enough to generate a form, a Discord command, or a test without writing any of them by hand.'
	}
] as const;

/**
 * Package capabilities, ordered by how objective they are.
 *
 * Catalogs and formulas first: they are the game's own numbers and the reason to install this at
 * all. The assistant tooling is last on purpose — it is the least objective thing here, useful but
 * a bell and whistle beside a cost table that is simply correct.
 */
export const features = [
	{
		title: 'Complete Game Catalogs',
		body: 'Labs, workshop, enhancements, modules, cards, relics, bots, guardians, ultimate weapons, vault trees, perks, battle conditions, tiers, and milestones — ready to query in code.',
		docs: '/docs/data/'
	},
	{
		title: 'Combat And Economy Math',
		body: 'Enemy scaling by tier and wave, ultimate weapon timing, lab and workshop costs, damage reduction, resource drops, and Effective Paths planning — all as functions you call with plain numbers.',
		docs: '/docs/mechanics/'
	},
	{
		title: 'Player Save Reading',
		body: 'Decode tool_export.json and pull labs, modules, cards, ultimate weapons, and run history from a real account. adb-bridge fetches the file from a phone or emulator.',
		docs: '/docs/save/'
	},
	{
		title: 'Charts And Cost Tables',
		body: 'Every catalog with a level progression generates a chart or a table — cost curves, research time, stat scaling. Add rows to the data and every view regenerates.',
		docs: '/docs/charts/'
	},
	{
		title: 'Calculators As Data',
		body: 'Each calculator describes its own inputs — names, units, ranges and caps. Read that description to generate a form, a slash command, or a test straight from the calculator itself.',
		docs: '/docs/builders/'
	},
	{
		title: 'Five Years Of Patch Notes',
		body: 'Every announcement the developers have made since July 2021. Search by text, pull a single version, read a date range, or find the note where a mechanic first appeared.',
		docs: '/docs/patch-notes/'
	},
	{
		title: 'Spreadsheets And Bots',
		body: 'Read live community spreadsheets, write catalogs into Google Sheets as working formulas, and expose any calculator as a Discord slash command that answers with the same numbers as your site.',
		docs: '/docs/sheets/'
	},
	{
		title: 'Wiki Ingestion',
		body: 'Pull The Tower wiki into Markdown inside your app, so mechanic descriptions live alongside the numbers they describe.',
		docs: '/docs/wiki/'
	},
	{
		title: 'Assistant Tooling',
		body: 'An MCP server with thirty-seven tools your editor can register: run the shipped calculators for real numbers, work in an instrumented sandbox, decode a save, and trace the result. Plus a game-knowledge oracle and a spreadsheet oracle.',
		docs: '/docs/mcp/'
	},
	{
		title: 'TowerAI',
		body: 'The assistant core, published alongside the package. Fill its knowledge base with the mechanics you care about and it answers from your curation, pulling live values from the catalogs as it writes.',
		docs: '/docs/towerai/'
	}
] as const;

/**
 * Home-page examples (live + code). Order matters — index matches demos on +page.
 */
export const homeExamples = [
	{
		title: 'Lab Costs',
		blurb: 'Coins and research time for the next levels.',
		code: `import { LAB_CATALOG } from 'thetowersdk/data'
import { formatNumberForDisplay } from 'thetowersdk/formatting'

// Find the lab by its display name
const lab = LAB_CATALOG.find((l) => l.name === 'Attack Speed')

// Levels are 0-based in the array; level 10 → index 10
const from = 10
const steps = 10
const next = lab.levels.slice(from, from + steps)

// Each level has a coin cost
const coins = next.reduce((sum, level) => sum + level.cost, 0)

// Format like the game (1.1q, 2.3s, …)
console.log(formatNumberForDisplay(coins))`
	},
	{
		title: 'Golden Tower vs Black Hole Uptime',
		blurb:
			'Two ultimate weapons compared on the same terms — duration over cooldown, at the same level.',
		code: `import { uwStoneChartData } from 'thetowersdk/data'
import { estimateBotUptimeFraction } from 'thetowersdk/mechanics'

function uptime(weaponName, level) {
  const weapon = Object.values(uwStoneChartData).find((w) => w.name === weaponName)
  // Ladders are keyed by level, but not every stat starts at the same level — find, don't index.
  const stat = (name) =>
    weapon.stats.find((s) => s.name === name).levels.find((l) => l.level === level).value

  const duration = stat('Duration')   // '23s' — a string with units, as the game writes it
  const cooldown = stat('Cooldown')   // '220s'

  // Pass the raw values through. estimateBotUptimeFraction parses the units itself, and
  // throws on a number — stripping the 's' yourself is what breaks it.
  return { duration, cooldown, uptime: estimateBotUptimeFraction(duration, cooldown) }
}

const gt = uptime('Golden Tower', 8)   // { duration: '23s', cooldown: '220s', uptime: 0.1045… }
const bh = uptime('Black Hole', 8)     // { duration: '23s', cooldown: '120s', uptime: 0.1917… }

// Same duration at this level; Black Hole comes back nearly twice as often.
console.log({ gt, bh })`
	},
	{
		title: 'Enemy Stats',
		blurb: 'Base health and damage for a farm tier or tournament league base.',
		code: `import {
  computeWaveBaseHealth,
  computeWaveBaseDamage,
} from 'thetowersdk/mechanics'
import { formatNumberForDisplay } from 'thetowersdk/formatting'

// Farm tier 10, or tournament Copper as tier 1 + tournament:true
const hp = computeWaveBaseHealth({ tier: 10, wave: 4500, tournament: false })
const dmg = computeWaveBaseDamage({ tier: 10, wave: 4500, tournament: false })

console.log(formatNumberForDisplay(hp))
console.log(formatNumberForDisplay(dmg))`
	},
	{
		title: 'Read A Save',
		blurb: 'Read typed account data from a decoded save, then build your own summary.',
		code: `import { readFile } from 'node:fs/promises'
import { decodePlayerInfoSaveBytesAsync } from 'thetowersdk/node'
import {
  readLabsFromSaveRoot,
  readModulesFromSaveRoot,
  readCardsFromSaveRoot,
  readUltimateWeaponsFromSaveRoot,
  readBotsFromSaveRoot,
  readVaultFromSaveRoot,
} from 'thetowersdk/save'
const { parsedRoot } = await decodePlayerInfoSaveBytesAsync(
  await readFile('tool_export.json')
)

const labs = readLabsFromSaveRoot(parsedRoot)
const modules = readModulesFromSaveRoot(parsedRoot)
const cards = readCardsFromSaveRoot(parsedRoot)
const uws = readUltimateWeaponsFromSaveRoot(parsedRoot)
const bots = readBotsFromSaveRoot(parsedRoot)
const vault = readVaultFromSaveRoot(parsedRoot)`
	}
] as const;

/** Turn stored battle reports into tracker rows. */
export const runTrackerSnippet = `import { listImportableBattleRuns } from 'thetowersdk/save'
import { formatNumberForDisplay } from 'thetowersdk/formatting'

// Every run the game kept, as it stored them.
const runs = listImportableBattleRuns(parsedRoot)

const rows = runs.map((run) => ({
  tier: run.tier,
  wave: run.wave,
  duration: run.durationSeconds,
  coins: run.coinsEarned,
  at: run.dateTime,
}))

// The number the table exists to produce.
const seconds = rows.reduce((sum, r) => sum + r.duration, 0)
const coins = rows.reduce((sum, r) => sum + r.coins, 0)
console.log(formatNumberForDisplay((coins / seconds) * 3600), 'coins/hour')`;

/** A cost table generated from a level progression. */
export const chartSnippet = `import { uwStoneChartData } from 'thetowersdk/data'
import { formatNumberForDisplay } from 'thetowersdk/formatting'

const gt = Object.values(uwStoneChartData).find((w) => w.name === 'Golden Tower')
const multiplier = gt.stats.find((s) => s.name === 'Multiplier')

// Level, value, cost, running total — the table players actually want.
let running = 0
const rows = multiplier.levels.map((l) => {
  if (typeof l.cost === 'number') running += l.cost
  return [l.level, l.value, l.cost, formatNumberForDisplay(running)]
})`;

/** The same data plotted instead of tabulated. */
export const chartCompareSnippet = `import { uwStoneChartData } from 'thetowersdk/data'

// One series per ultimate weapon: stone cost to reach each cooldown level.
const datasets = Object.values(uwStoneChartData).map((weapon) => {
  const cooldown = weapon.stats.find((s) => s.name === 'Cooldown')
  return {
    label: weapon.name,
    data: (cooldown?.levels ?? [])
      .filter((l) => typeof l.cost === 'number')
      .map((l) => ({ x: l.level, y: l.cost })),
  }
})

// Hand the points to Chart.js, D3, Vega, or a spreadsheet.
chart.data = { datasets }`;

/** Connect to the bridge and receive a save as the player plays. */
export const adbBridgeSnippet = `import { decodeSaveFile } from 'thetowersdk/save-decoder'
import { readLabsFromSaveRoot } from 'thetowersdk/save'

// Terminal: npx adb-bridge
// First tap Player ID five times in the game to create the first export.
// Then enable Auto Export for External Tools before watching.
const socket = new WebSocket('ws://127.0.0.1:8787')

socket.onmessage = async (event) => {
  const bytes = new Uint8Array(await event.data.arrayBuffer())

  const parsedRoot = await decodeSaveFile(bytes)
  const labs = readLabsFromSaveRoot(parsedRoot)

  render(\`\${labs.researchedCount} researched, \${labs.maxedCount} maxed\`)
}

// Ask for the current save; the bridge re-sends whenever the game updates the export.
socket.onopen = () => socket.send(JSON.stringify({ type: 'watch', game: 'the-tower' }))`;

/** Build a spreadsheet from the catalogs. */
export const sheetBuildSnippet = `import { LAB_CATALOG } from 'thetowersdk/data'

// One row per level: what a sheet actually needs.
const rows = LAB_CATALOG.flatMap((lab) =>
  lab.levels.map((l) => [lab.name, l.level, l.cost, l.duration])
)

// Write it wherever your sheet lives — CSV, xlsx, or the Sheets API.
await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: 'Labs!A2',
  valueInputOption: 'RAW',
  requestBody: { values: rows },
})`;

/** Generate formulas rather than values, so the sheet stays live. */
export const sheetFormulaSnippet = `// Write formulas, not just numbers — the sheet keeps calculating.
const formulas = LAB_CATALOG.map((lab, i) => [
  lab.name,
  \`=SUMIF(Levels!A:A,A\${i + 2},Levels!C:C)\`,   // total coins to max
  \`=B\${i + 2}/Inputs!$B$1\`,                    // hours at your coin rate
])

// Check one against the sheet before shipping it.
eval_formula({ formula: '=SUMIF(Levels!A:A,"Attack Speed",Levels!C:C)' })`;

/** Extra examples beyond the home set. */
export const moreExamples = [
	{
		title: 'Generate A Cost Table',
		blurb: 'Level, value, cost and running total, generated from the catalog.',
		code: chartSnippet
	},
	{
		title: 'Module Shard Cost',
		blurb: 'Shards to take a module from one level to the next.',
		code: `import { getModuleShardUpgradeCost } from 'thetowersdk/data'
import { formatNumberForDisplay } from 'thetowersdk/formatting'

// Cost to reach level 161 from 160
const shards = getModuleShardUpgradeCost(161)
console.log(formatNumberForDisplay(shards))`
	},
	{
		title: 'Card Gem Cost',
		blurb: 'Gems to raise a card from one level to another (copies × 20).',
		code: `import { cardLevelUpgradeGemCost } from 'thetowersdk/mechanics'
import { formatNumberForDisplay } from 'thetowersdk/formatting'

const gems = cardLevelUpgradeGemCost(0, 7)
console.log(formatNumberForDisplay(gems))`
	},
	{
		title: 'Effective Paths',
		blurb: 'Next economy buys from your starting levels, including what was skipped.',
		code: `import {
  planEffectiveEconomyPath,
  ZERO_EFFECTIVE_ECONOMY_LEVELS,
  zeroEffectiveEconomyConfig,
} from 'thetowersdk/mechanics'

const levels = {
  ...ZERO_EFFECTIVE_ECONOMY_LEVELS,
  time: {
    ...ZERO_EFFECTIVE_ECONOMY_LEVELS.time,
    coinsPerKillBonus: 20,
  },
}

const plan = planEffectiveEconomyPath({
  config: zeroEffectiveEconomyConfig(),
  levels,
  variant: 'time',
  steps: 5,
})

console.log(plan.steps.map((s) => s.name))
console.log(plan.excluded.length, 'skipped')`
	},
	{
		title: 'Glossary Lookup',
		blurb: 'Resolve Tower acronyms from the package glossary (generated + curated, no network).',
		code: `import { lookupGlossary } from 'thetowersdk/data'

const hits = lookupGlossary('CF')
console.log(hits.map((h) => h.expansion ?? h.term))`
	},
	{
		title: 'Any Calculator, From Its Own Declaration',
		blurb: 'Fields, units and caps are declared, so a form renders a calculator it has never seen.',
		code: `import { CALCULATOR_BUILDERS, findCalculatorBuilder } from 'thetowersdk/builders'

const builder = findCalculatorBuilder('assist.stones')

builder.fields // [{ key: 'currentLevel', label: 'Current level', kind: 'number', min: 0, max: 69 }, …]

const result = builder.compute(builder.normalize({ currentLevel: 0, targetLevel: 10 }))
console.log(result.totalStones) // 285`
	}
] as const;

/** @deprecated use homeExamples — kept for any stray imports */
export const codeExamples = homeExamples;

/**
 * Example tools you can build on this package.
 * Titles only — no separate type badge.
 */
/**
 * Tool shapes you can build, each pointing at the page that shows you how.
 *
 * `docs` is what makes the cards on `/tools/` actionable: a reader who sees the thing they want to
 * build lands on the reference for it in one click, instead of having to guess which doc covers it.
 * Every entry links to a page that exists — `src/routes/docs/` is the list.
 */
export const trackerExamples = [
	{
		title: 'Labs Calculator',
		body: 'Coin and research time for the next lab levels, with discount-aware totals.',
		docs: '/docs/data/'
	},
	{
		title: 'Cards Calculator',
		body: 'Gem cost to raise a card across levels — each level’s copies × 20 gems.',
		docs: '/docs/data/'
	},
	{
		title: 'Workshop Calculator',
		body: 'Workshop upgrades, enhancements, and discount-aware cost curves.',
		docs: '/docs/data/'
	},
	{
		title: 'Module Calculator',
		body: 'Shard and coin costs for module levels, rarities, and loadouts.',
		docs: '/docs/data/'
	},
	{
		title: 'Bots Calculator',
		body: 'In-game bot upgrades, medals, and timing windows for planning.',
		docs: '/docs/data/'
	},
	{
		title: 'Guardians Calculator',
		body: 'Guardian chip upgrades and related costs.',
		docs: '/docs/data/'
	},
	{
		title: 'Ultimate Weapons Calculator',
		body: 'UW stone planners for cooldowns, duration, quantity, and related stats.',
		docs: '/docs/mechanics/'
	},
	{
		title: 'Uptime Calculator',
		body: 'Sync windows across ultimate weapons and in-game bots — GT, Black Hole, Golden Bot, and more.',
		docs: '/docs/mechanics/'
	},
	{
		title: 'Effective Paths',
		body: 'Next-buy planners for health, damage, economy, and regen.',
		docs: '/docs/builders/'
	},
	{
		title: 'Enemy Stats & Resource Drops',
		body: 'Enemy toughness by wave and estimated drops.',
		docs: '/docs/mechanics/'
	},
	{
		title: 'Thorns & Damage Reduction',
		body: 'Combat calculators for common mid- and late-game questions.',
		docs: '/docs/mechanics/'
	},
	{
		title: 'CPH, Shard Splitter, Medal Splitter',
		body: 'Coins per hour and currency-split helpers.',
		docs: '/docs/builders/'
	},
	{
		title: 'Run Tracker',
		body: 'Import battle reports from a save and keep run history across tiers and waves.',
		docs: '/docs/save/'
	},
	{
		title: 'Account trackers',
		body: 'Labs, cards, modules, bots, guardians, vault, relics, themes, and UW progress from the same catalogs.',
		docs: '/docs/save/'
	},
	{
		title: 'Patch Note Archive',
		body: 'Five years of patch notes, searchable by version, date, or the mechanic they changed.',
		docs: '/docs/patch-notes/'
	},
	{
		title: 'Charts & Cost Tables',
		body: 'Render any level progression as an image — cost curves, research time, stat scaling.',
		docs: '/docs/charts/'
	},
	{
		title: 'Spreadsheets',
		body: 'Feed the same catalogs into Google Sheets, with live formulas rather than pasted values.',
		docs: '/docs/sheets/'
	},
	{
		title: 'Discord Bots',
		body: 'Turn any builder into a command — the bot answers with the same numbers as your site.',
		docs: '/docs/bots/'
	}
] as const;

export const toolKinds = trackerExamples;

/**
 * Sample tool-design asks. `result` = TheTowerSDK + ACS workflow (research before code).
 */
export const agentPrompts = [
	{
		title: 'Lab cost tool',
		prompt: `Design a lab cost tool with thetowersdk: lab picker, current level, and a table of coin cost + research time for the next 10 levels, formatted like the game.`,
		result: `1. ACS opens a labs task and records status (researching)
2. TheTowerSDK MCP loads wiki context for Labs before any UI is written
3. list_exports / get_export resolves LAB_CATALOG + game number formatters from the package
4. Only then scaffolds the picker, level input, and next-10 cost/time table
5. ACS checkpoints the slice and moves status to implementing → awaiting your review`
	},
	{
		title: 'Save reader tool',
		prompt: `Build a save reader: drop in tool_export.json and show labs researched/maxed plus equipped modules.`,
		result: `1. ACS opens a save-reading task (researching)
2. Wiki + package docs for playerInfo / labs / modules are pulled through MCP first
3. Exports confirmed: decodePlayerInfoSaveBytes and lab/module extractors
4. Builds upload → decode → researched/maxed + equipped modules UI on those APIs
5. ACS checkpoints; incomplete saves surface extractor warnings instead of invented fields`
	},
	{
		title: 'Economy planner tool',
		prompt: `Build an economy planner UI that runs the effective economy path for N steps and lists what was bought vs skipped (with reasons).`,
		result: `1. ACS opens an Effective Paths / economy task (researching)
2. Wiki + MCP context for Effective Paths before controls or tables exist
3. Resolves planEffectiveEconomyPath and config helpers from thetowersdk/mechanics
4. Builds step/variant controls; renders plan.steps and plan.excluded from the planner
5. ACS checkpoints each slice so the UI cannot drift into a hand-written priority list`
	},
	{
		title: 'Wiki-backed reference tool',
		prompt: `Design a small in-app reference that loads Tower wiki pages as Markdown (starting with Golden Tower) so the tool can show cooldown and related sections from the wiki.`,
		result: `1. ACS opens a wiki-ingestion task (researching)
2. Loads Golden Tower (and related titles) via wiki_page / fetchFandomPageAsMarkdown first
3. Confirms the Markdown API and section shape from that live pull
4. Then scaffolds page picker + Markdown panel wired to the same fetch path
5. ACS checkpoints so later pages reuse that path instead of hardcoded wiki text`
	}
] as const;

/** Build a TowerAI knowledge base from curated chunks plus package data. */
/**
 * What the live demo on the home page does, as code.
 *
 * It sits next to that demo, so it has to be the same flow: post a question to a small endpoint
 * that holds the key and the knowledge base, then render the markdown that comes back. An example
 * of building a knowledge base belongs on the TowerAI page, not beside a panel that does not do it.
 */
export const askDemoSnippet = `// Your endpoint holds the model key and the knowledge base.
// The browser only ever sends a question and receives an answer.
async function ask(question) {
  const response = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question })
  })

  const { ok, answer } = await response.json()
  if (!ok) throw new Error('The assistant could not answer.')
  return answer
}

const answer = await ask('How do I sync Golden Bot with Death Wave?')

// The reply is markdown, so render it the way you render any markdown.
element.innerHTML = renderMarkdown(answer)`;

export const towerAiSnippet = `import {
  buildTrackerAiCanonicalKbChunks,
  validateCanonicalKbArray,
  buildCanonicalKbVersion,
} from 'towerai/kb'
import { LAB_CATALOG } from 'thetowersdk/data'

// The shipped chunks, then your own on top.
const base = buildTrackerAiCanonicalKbChunks()

const mine = LAB_CATALOG.map((lab) => ({
  chunk_id: \`lab_cost_\${lab.slug}\`,
  source: 'My Notes',
  section: 'Labs',
  topic: \`\${lab.name} cost\`,
  title: \`\${lab.name} cost\`,
  disambiguation: 'Cost to max this lab, not research order.',
  mechanics: [lab.name],
  tags: ['labs', lab.name.toLowerCase()],
  // Numbers come from the catalog, so prose cannot go stale.
  content: \`\${lab.name} has \${lab.levels.length} levels.\`,
}))

const knowledgeBase = [...base, ...mine]

// It tells you what is malformed instead of failing at query time.
validateCanonicalKbArray(knowledgeBase)
console.log(buildCanonicalKbVersion(knowledgeBase), knowledgeBase.length, 'chunks')`;

export const mcpJson = `{
  "mcpServers": {
    "thetowersdk": {
      "command": "node",
      "args": ["./node_modules/thetowersdk/mcp/server.mjs"]
    }
  }
}`;

export const installSnippet = INSTALL_CMD;

export const dataSnippet = `import { LAB_CATALOG } from 'thetowersdk/data'

// Sum every level's coin cost for one lab
const costToMax = (lab) =>
  lab.levels.reduce((sum, level) => sum + level.cost, 0)

// Rank labs by total coin cost
const priciest = LAB_CATALOG
  .map((lab) => ({ name: lab.name, total: costToMax(lab) }))
  .sort((a, b) => b.total - a.total)[0]`;

export const saveSnippet = `import { readFile } from 'node:fs/promises'
import { decodePlayerInfoSaveBytesAsync } from 'thetowersdk/node'
import { readLabsFromSaveRoot } from 'thetowersdk/save'
const { parsedRoot } = await decodePlayerInfoSaveBytesAsync(
  await readFile('tool_export.json')
)

const labs = readLabsFromSaveRoot(parsedRoot)
if (!labs) throw new Error('no lab data in this save')
console.log(\`\${labs.researchedCount} researched, \${labs.maxedCount} maxed\`)`;

export const planSnippet = `import {
  planEffectiveDamagePath,
  ZERO_EFFECTIVE_DAMAGE_LEVELS,
  zeroEffectiveDamageConfig,
} from 'thetowersdk/mechanics'

const plan = planEffectiveDamagePath({
  config: zeroEffectiveDamageConfig(),
  levels: ZERO_EFFECTIVE_DAMAGE_LEVELS,
  variant: 'lab-time',
  steps: 10,
})

plan.steps
plan.excluded`;
