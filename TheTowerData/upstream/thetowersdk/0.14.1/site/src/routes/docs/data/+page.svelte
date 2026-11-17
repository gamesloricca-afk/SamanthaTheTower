<script lang="ts">
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import { href } from '$lib/paths';
</script>

<h1 class="text-3xl font-semibold">Game Data</h1>
<p class="mt-3 text-muted">
	Every catalog in the game, typed and ready to query: labs, workshop, modules, cards, relics, bots,
	guardians, ultimate weapons, vault trees, perks, battle conditions, tiers, milestones and the
	glossary. They are plain arrays and objects that ship with the install, so you can map, filter and
	reduce them like any other data — no fetch, no key, no setup.
</p>

<h2 class="mt-10 text-xl font-semibold">Game 29.1 Catalog</h2>
<p class="mt-3 text-muted">
	The catalog includes Sentry Protocol (Armor, save index 50), Gilded Sniper (Cannon, 51), Tactical
	Barrage (Core, 52), and Infinity Threshold (Generator, 53), with their rarity values. Primary
	Module Bonus labs occupy indices 253–256 in Cannon, Armor, Generator, Core order. Each has 30
	levels and unlocks at tier 23, wave 500. Cost/time ladders start at 100 quintillion coins and 400
	hours before modifiers. Card Presets has five levels.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { computeModuleStat, findLabResearchByIndex } from 'thetowersdk/data'

findLabResearchByIndex(253)?.displayName // 'Primary Module Bonus - Cannon'
computeModuleStat({ type: 'cannon', rarityLabel: 'Epic +', level: 92, primaryLabLevel: 30 })
// 2.3: research amplifies the module bonus, not the neutral multiplier 1.`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Your First Query</h2>
<p class="mt-3 text-muted">
	Start with labs. Each entry has a name, a category and a ladder of levels, and each level carries
	its own cost and research duration.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { LAB_CATALOG } from 'thetowersdk/data'

const lab = LAB_CATALOG.find((entry) => entry.name === 'Attack Speed')

console.log(lab.category)          // 'Attack'
console.log(lab.levels.length)     // 99
console.log(lab.levels[0])
// { level: 1, duration: '00:00:14', cost: 30 }`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Add Up A Range Of Levels</h2>
<p class="mt-3 text-muted">
	Because levels are an array, "what will the next ten cost me" is a <code>slice</code> and a
	<code>reduce</code>. <code>formatNumberForDisplay</code> renders the total the way the game writes it,
	so your output matches what the player sees on screen.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { LAB_CATALOG } from 'thetowersdk/data'
import { formatNumberForDisplay } from 'thetowersdk/formatting'

const lab = LAB_CATALOG.find((entry) => entry.name === 'Attack Speed')

const from = 10
const next = lab.levels.slice(from, from + 10)
const coins = next.reduce((sum, level) => sum + level.cost, 0)

console.log(formatNumberForDisplay(coins))   // '18.759K' style, as in game`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Group A Catalog Any Way You Like</h2>
<p class="mt-3 text-muted">
	Catalogs carry the fields you would want to group by, so a category breakdown or a rarity split
	comes straight out of the data rather than from a list you maintain yourself.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { LAB_CATALOG, CARD_TEMPLATES } from 'thetowersdk/data'

const byCategory = new Map()
for (const lab of LAB_CATALOG) {
  byCategory.set(lab.category, (byCategory.get(lab.category) ?? 0) + 1)
}

const byRarity = Object.groupBy(CARD_TEMPLATES, (card) => card.rarity)

console.log([...byCategory])          // [['Bots', 10], ['Card Mastery', 31], …]
console.log(Object.keys(byRarity))    // ['common', 'rare', 'epic']`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Cards, And Their Masteries</h2>
<p class="mt-3 text-muted">
	A card carries two ladders: <code>levelValues</code> for the card itself and
	<code>masteryValues</code> for its mastery. Both are arrays of the multiplier at each level, so
	the value at level <em>n</em> is simply the entry at index <em>n − 1</em>.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { CARD_TEMPLATES } from 'thetowersdk/data'

const card = CARD_TEMPLATES.find((entry) => entry.name === 'Damage')

console.log(card.rarity)             // 'common'
console.log(card.description)        // 'Increases tower damage by x'
console.log(card.levelValues)        // [1.5, 2, 2.4, 2.8, 3.2, 3.6, 4]
console.log(card.masteryName)        // 'Damage+'
console.log(card.masteryValues)      // the mastery ladder

const atLevel = (values, level) => values[level - 1]
console.log(atLevel(card.levelValues, 3))   // 2.4`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Workshop Costs In Two Currencies</h2>
<p class="mt-3 text-muted">
	Workshop stats come from a function rather than a constant, and every level carries its value plus
	both prices — so a cost table is a direct read.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { getWorkshopStatDefinitions } from 'thetowersdk/data'

const damage = getWorkshopStatDefinitions().find((stat) => stat.key === 'Damage')

console.log(damage.category)        // 'attack'
console.log(damage.levels[0])
// { level: 0, value: 3, cash: 10, coins: 30 }

const toLevel50 = damage.levels
  .slice(0, 50)
  .reduce((sum, level) => sum + level.coins, 0)`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Modules And Rarity Bonuses</h2>
<p class="mt-3 text-muted">
	Modules carry their type, their rarity range, and the bonus at each rarity — enough to build a
	loadout planner or a merge calculator directly.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { MODULE_TEMPLATES } from 'thetowersdk/data'

const module = MODULE_TEMPLATES.find((entry) => entry.name === 'Astral Deliverance')

console.log(module.type)          // 'Cannon'
console.log(module.initials)      // 'AD'
console.log(module.minRarity, '→', module.maxRarity)
console.log(module.rarityBonuses)
// [{ rarity: 'Epic', value: 20 }, { rarity: 'Legendary', value: 40 }, …]

const cannons = MODULE_TEMPLATES.filter((entry) => entry.type === 'Cannon')`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Ultimate Weapons</h2>
<p class="mt-3 text-muted">
	Ultimate weapons are keyed by weapon, each with its stats, and each stat with a ladder of levels
	carrying the value and its stone cost. Values keep their units as the game writes them.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { uwStoneChartData } from 'thetowersdk/data'

const gt = Object.values(uwStoneChartData).find((w) => w.name === 'Golden Tower')

console.log(gt.stats.map((stat) => stat.name))
// ['Multiplier', 'Duration', 'Cooldown', 'Golden Combo']

const cooldown = gt.stats.find((stat) => stat.name === 'Cooldown')
console.log(cooldown.levels[8])
// { level: 8, value: '220s', cost: 136 }`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Finding An Entry By What A Player Typed</h2>
<p class="mt-3 text-muted">
	A catalog stores one spelling; players use several. The lookup helpers close that gap, so a form,
	a chat command or an imported spreadsheet column can all reach the same row without you writing a
	normaliser per surface.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import {
  findLabResearchByLooseName,
  findLabResearchBySlug,
  findLabResearchByIndex
} from 'thetowersdk/data'

// Case and spacing do not matter.
findLabResearchByLooseName('attack speed')
// { index: 1, displayName: 'Attack Speed', description: 'Firing rate of Tower Projectiles.',
//   category: 'Attack', slug: 'attack_speed', levelMax: 99, baseCoinCost: 30, baseTime: 15,
//   tierUnlock: 0, milestoneUnlock: 0 }

findLabResearchBySlug('attack_speed')   // the stable key, for your own storage
findLabResearchByIndex(1)               // the index a save file stores`}
	/>
</div>
<p class="mt-3 text-muted">
	Three ways in, on purpose. Use the <strong>slug</strong> as the key in your own database — it does
	not change when a display name does. Use the <strong>index</strong> when you are reading a save,
	because that is what the save stores. Use the <strong>loose name</strong> only at the edge, where a
	person typed something. There are 95 helpers like these across the catalogs.
</p>

<h2 class="mt-10 text-xl font-semibold">Levels, Costs And Research Times</h2>
<p class="mt-3 text-muted">
	Every lab in <code>LAB_CATALOG</code> carries its own level rows, each with the coin cost and the
	research time at that level. That is what makes "what will the next ten levels cost me" a
	<code>reduce</code> rather than a formula you have to get right.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { LAB_CATALOG } from 'thetowersdk/data'
import { formatNumberForDisplay, parseDurationToHours, formatHoursDuration } from 'thetowersdk/formatting'

const lab = LAB_CATALOG.find((entry) => entry.name === 'Attack Speed')

lab.levels[0]        // { level: 1, duration: '00:00:14', cost: 30 }
lab.levels.length    // how far this lab goes

const next = lab.levels.slice(10, 20)
formatNumberForDisplay(next.reduce((sum, level) => sum + level.cost, 0))
// '243.56K'

formatHoursDuration(next.reduce((sum, level) => sum + parseDurationToHours(level.duration), 0))
// '5d 19h 2m 0s'`}
	/>
</div>
<p class="mt-3 text-muted">
	Research time is stored as <code>HH:MM:SS</code>, which does not add up as a string.
	<code>parseDurationToHours</code> is the one to reach for — see
	<a href={href('/docs/formatting/')}>Formatting</a>.
</p>

<h2 class="mt-10 text-xl font-semibold">Categories, Derived Rather Than Listed</h2>
<p class="mt-3 text-muted">
	Every catalog entry carries its own category, so the groupings a UI needs come out of the data.
	Hand-listing them is how a filter comes to be missing a category nobody noticed was added.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { LAB_CATALOG, ALL_PERKS } from 'thetowersdk/data'

const categories = [...new Set(LAB_CATALOG.map((lab) => lab.category))]
// 15 of them: 'Bots', 'Card Mastery', 'Modules', 'Attack', 'Perks', …

const pools = [...new Set(ALL_PERKS.map((perk) => perk.pool))]
// 'standard', 'ultimate_weapon', 'trade_off'

ALL_PERKS[0]   // { perk: 'x1.20 Max Health', quantity: 5, pool: 'standard' }`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Reading A Catalog From A Save</h2>
<p class="mt-3 text-muted">
	A save stores a lab as an index, not a name. <code>LAB_RESEARCH_IMPORT_CATALOG</code> is the bridge:
	it pairs each index with the field the save actually writes and the name a player sees.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { LAB_RESEARCH_IMPORT_CATALOG } from 'thetowersdk/data'

LAB_RESEARCH_IMPORT_CATALOG[0]
// { index: 0, gameField: 'researchLevel0', displayName: 'Damage', slug: 'damage', category: null }`}
	/>
</div>
<p class="mt-3 text-muted">
	This is the mapping that turns a decoded save into named things, and getting it wrong does not
	throw — every level reads as a plausible number against the wrong lab. It is
	<a href={href('/contributions/')}>someone else's work</a>, and the reason the save reader can be
	trusted at all.
</p>

<h2 class="mt-10 text-xl font-semibold">The Rest Of The Catalogs</h2>
<p class="mt-3 text-muted">
	They all follow the same pattern — import the constant, read the fields.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import {
  BOT_UPGRADES_DATA,          // bots, with base and plus stat ladders
  RELIC_TEMPLATES,            // every relic, its bonus type and value
  VAULT_POWER_IMPORT_CATALOG, // vault power tree nodes
  VAULT_HARMONY_IMPORT_CATALOG,
  ALL_PERKS,                  // perk definitions
  TIER_BATTLE_CONDITION_DEFINITIONS,
  MILESTONE_REWARD_ROWS,      // milestone rewards by tier
  TIER_DATA,                  // per-tier scaling
  GLOSSARY_NAME_ROWS          // canonical names, for parsing player text
} from 'thetowersdk/data'`}
	/>
</div>

<p class="mt-4 text-sm text-muted">
	The counts on the home page are read from these same catalogs at build time, so they always
	describe the package you installed.
</p>

<p class="mt-8 text-sm">
	<a href={href('/docs/mechanics/')}>Formulas →</a>
	·
	<a href={href('/docs/charts/')}>Charts →</a>
	·
	<a href={href('/playground/')}>Runnable Examples →</a>
</p>
