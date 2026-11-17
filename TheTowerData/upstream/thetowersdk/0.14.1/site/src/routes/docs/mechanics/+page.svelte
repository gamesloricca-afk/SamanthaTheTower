<script lang="ts">
	import { sdkFacts, spelled } from '$lib/sdk-facts';
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import { planSnippet } from '$lib/content';
	import { href } from '$lib/paths';
</script>

<h1 class="text-3xl font-semibold">Formulas</h1>
<p class="mt-3 text-muted">
	<code>thetowersdk/mechanics</code> is the maths the game runs, as functions you can call: enemy scaling
	by tier and wave, ultimate weapon timing, lab and workshop costs, Effective Paths planning, damage reduction,
	resource drops and more. Each one takes plain values and returns a number, so they drop straight into
	a calculator, a chart, or a bot command.
</p>

<h2 class="mt-10 text-xl font-semibold">Infinity Threshold and Sentry Protocol</h2>
<p class="mt-3 text-muted">
	In game 29.1, Health and Health Regen above level 6,000 use their capped base multiplied by
	Damage(actual level) / Damage(6000). Damage already uses its full curve. Infinity Threshold grants
	1,000–4,000 extra free-upgrade levels by rarity, so continuing the old Health or Regen curve gives
	the wrong result.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import {
  applyWorkshopOvercapMultiplier,
  sentryProtocolWorkshopOrbFireInterval,
  sentryProtocolCardOrbFireInterval,
} from 'thetowersdk/mechanics'

applyWorkshopOvercapMultiplier(100, 7000) // approximately 195.52428085
sentryProtocolWorkshopOrbFireInterval(2) // 0.1 seconds between shots per orb
sentryProtocolCardOrbFireInterval(1, 1)  // 0.25 seconds; card speed + lab bonus`}
	/>
</div>
<p class="mt-3 text-muted">
	These helpers model the released module effects. The Sentry Protocol rarity value controls
	mini-orbs per shot. The workshop helper expects Health or Regen already evaluated at min(actual
	level, 6000), before applying the ratio once.
</p>

<h2 class="mt-10 text-xl font-semibold">Enemy Scaling</h2>
<p class="mt-3 text-muted">
	Give a tier and a wave and get the base health and damage an enemy has there. This is the core of
	any "how far can I push" tool.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { computeWaveBaseHealth, computeWaveBaseDamage } from 'thetowersdk/mechanics'
import { formatNumberForDisplay } from 'thetowersdk/formatting'

const hp = computeWaveBaseHealth({ tier: 10, wave: 4500 })
const dmg = computeWaveBaseDamage({ tier: 10, wave: 4500 })

console.log(formatNumberForDisplay(hp))    // '1.343S'
console.log(formatNumberForDisplay(dmg))   // '110.445T'`}
	/>
</div>
<p class="mt-3 text-muted">
	Both scale continuously, so charting a tier is a loop over waves — every point comes from the same
	function the calculators use.
</p>
<div class="mt-4">
	<CodeBlock
		code={`const series = []
for (let wave = 100; wave <= 5000; wave += 100) {
  series.push({ wave, hp: computeWaveBaseHealth({ tier: 10, wave }) })
}`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Ultimate Weapon Uptime</h2>
<p class="mt-3 text-muted">
	<code>computeUptimeRatio</code> takes a duration and a cooldown, in that order, and returns the fraction
	of the time the weapon is active. Pair it with the catalogs and you can compare any two weapons at any
	level.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { computeUptimeRatio } from 'thetowersdk/mechanics'
import { uwStoneChartData } from 'thetowersdk/data'

const seconds = (value) => Number(String(value).replace(/[^0-9.]/g, ''))

function uptime(weaponName, level) {
  const weapon = Object.values(uwStoneChartData).find((w) => w.name === weaponName)
  const at = (statName) =>
    weapon.stats.find((s) => s.name === statName).levels.find((l) => l.level === level).value

  return computeUptimeRatio(seconds(at('Duration')), seconds(at('Cooldown')))
}

console.log(uptime('Golden Tower', 8))   // 0.1045…
console.log(uptime('Black Hole', 8))     // 0.1917…`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Effective Paths Planning</h2>
<p class="mt-3 text-muted">
	The planner answers "what should I buy next" across health, damage, economy and regen, using a
	dated port of the community workbook. Its source versions and coverage limits are documented in
	the Effective Paths reference.
</p>
<div class="mt-4">
	<CodeBlock code={planSnippet} />
</div>

<h2 class="mt-10 text-xl font-semibold">Start With A Builder</h2>
<p class="mt-3 text-muted">
	There are {sdkFacts.formulas} functions here. For the {spelled(sdkFacts.builders)} questions people
	ask most, a
	<a href={href('/docs/builders/')}>builder</a> already wraps the right ones, declares the inputs they
	need with their units and limits, and hands back a full result. Reach for a raw function when you want
	one value inside something larger; reach for a builder when you want a working calculator.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { findCalculatorBuilder } from 'thetowersdk/builders'

const wave = findCalculatorBuilder('enemy.wave')

console.log(wave.summary)     // what it answers
console.log(wave.fields)      // exactly what to ask the user for
console.log(wave.compute(wave.normalize(wave.defaults)))`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">How The Names Are Organised</h2>
<p class="mt-3 text-muted">
	Every export is named after what it does, with a consistent prefix, so you can find a family
	without a list to hand.
</p>
<div class="mt-6 overflow-x-auto rounded-lg border border-line/70">
	<table class="w-full min-w-[34rem] text-left text-sm">
		<thead class="border-b border-line/70 text-xs tracking-wide text-muted uppercase">
			<tr>
				<th class="px-4 py-2 font-medium">Prefix</th>
				<th class="px-4 py-2 font-medium">Count</th>
				<th class="px-4 py-2 font-medium">What it holds</th>
			</tr>
		</thead>
		<tbody class="[&_td]:px-4 [&_td]:py-2">
			<tr class="border-b border-line/50">
				<td><code>compute*</code></td>
				<td class="font-mono text-gold">125</td>
				<td class="text-muted">The top-level calculators — a question in, a number out.</td>
			</tr>
			<tr class="border-b border-line/50">
				<td><code>build*</code></td>
				<td class="font-mono text-gold">43</td>
				<td class="text-muted">Planners that assemble a whole result set, such as a buy order.</td>
			</tr>
			<tr class="border-b border-line/50">
				<td><code>apply*</code></td>
				<td class="font-mono text-gold">17</td>
				<td class="text-muted">Layer one effect onto a value — defense, rend, reductions.</td>
			</tr>
			<tr>
				<td class="text-muted">the mechanic's name</td>
				<td class="font-mono text-gold">—</td>
				<td class="text-muted">
					Its own stats: <code>blackHoleDuration</code>, <code>bounceShotChance</code>,
					<code>attackSpeed</code>.
				</td>
			</tr>
		</tbody>
	</table>
</div>

<h2 class="mt-10 text-xl font-semibold">Search The Module From Code</h2>
<p class="mt-3 text-muted">
	Everything is a named export on one object, so you can list what exists at runtime — handy in a
	REPL, and the fastest way to find the family you want.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import * as mechanics from 'thetowersdk/mechanics'

const named = (pattern) =>
  Object.keys(mechanics).filter((key) => pattern.test(key) && typeof mechanics[key] === 'function')

named(/uptime/i)       // every uptime helper
named(/^blackHole/)    // Black Hole duration, cooldown, coin bonus, range
named(/coin/i)         // 49 coin bonus and income helpers
named(/wave/i)         // 111 wave and enemy-scaling functions
named(/^compute/)      // the 125 top-level calculators`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Worked Example: A Survivability Table</h2>
<p class="mt-3 text-muted">
	A few of them together give a table a player can read at a glance — enemy health and damage across
	a tier, next to how many hits a given tower takes.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { computeWaveBaseHealth, computeWaveBaseDamage } from 'thetowersdk/mechanics'
import { formatNumberForDisplay } from 'thetowersdk/formatting'

const towerHealth = 4.2e18
const rows = []

for (let wave = 1000; wave <= 6000; wave += 500) {
  const hp = computeWaveBaseHealth({ tier: 10, wave })
  const dmg = computeWaveBaseDamage({ tier: 10, wave })

  rows.push({
    wave,
    enemyHealth: formatNumberForDisplay(hp),
    enemyDamage: formatNumberForDisplay(dmg),
    hitsSurvived: Math.floor(towerHealth / dmg)
  })
}

console.table(rows)`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">Put It On A Chart</h2>
<p class="mt-3 text-muted">
	Any series you compute goes straight into the chart renderer as an image, or into a spreadsheet as
	live formulas.
</p>

<p class="mt-8 text-sm">
	<a href={href('/docs/charts/')}>Charts →</a>
	·
	<a href={href('/docs/builders/')}>Builders →</a>
	·
	<a href={href('/playground/')}>Live Formula Examples →</a>
</p>
