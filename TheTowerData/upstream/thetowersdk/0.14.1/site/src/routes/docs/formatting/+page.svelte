<script lang="ts">
	import CodeBlock from '$lib/ui/CodeBlock.svelte';
	import { href } from '$lib/paths';
</script>

<h1 class="text-3xl font-semibold">Formatting</h1>
<p class="mt-3 text-muted">
	The Tower writes numbers its own way — <code>18.759M</code>, <code>4.77T</code>,
	<code>1.34S</code> — and players type them back the same way. Thirty-nine functions read and write that
	notation, plus durations, multipliers and rates, so what your tool shows matches what the game shows
	and what a player pastes in is understood.
</p>

<h2 class="mt-10 text-xl font-semibold">Numbers The Way The Game Writes Them</h2>
<div class="mt-4">
	<CodeBlock
		code={`import {
  formatNumberForDisplay,
  formatCoin,
  formatShard,
  formatCompact,
  formatLargeNumber,
  formatGroupedNumber
} from 'thetowersdk/formatting'

formatNumberForDisplay(18_759_000)     // '18.759M'
formatCoin(4_770_477_147_914)          // '4.77T'
formatShard(482_970)                   // '482.97K'
formatCompact(1_234_567)               // '1.23M'
formatLargeNumber(1.343e24)            // '1.34S'
formatGroupedNumber(1_234_567)         // '1,234,567'`}
	/>
</div>
<p class="mt-3 text-muted">
	The suffixes carry on well past <code>T</code> — the game reaches values a browser would otherwise
	print in exponential notation, and a player reading <code>1.343e+24</code> has to translate it before
	it means anything.
</p>

<h2 class="mt-10 text-xl font-semibold">Reading What A Player Types</h2>
<p class="mt-3 text-muted">
	The same notation in reverse. A tracker that asks for a coin total gets <code>4.77T</code> pasted in,
	not a digit string.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import {
  parseNumberInput,
  parseResource,
  parseValueWithUnit,
  standardizeNotation
} from 'thetowersdk/formatting'

parseNumberInput('18.759K')     // 18759
parseResource('4.77T')          // { value: 4770000000000 }
parseValueWithUnit('23s')       // { value: 23, unit: 's', parsed: true }

// Accepts what people actually type, then normalises the case.
standardizeNotation('1.5b')     // '1.5B'`}
	/>
</div>
<p class="mt-3 text-muted">
	<code>parseValueWithUnit</code> reports whether it understood the input, so a form can say "that does
	not look like a number" rather than quietly treating it as zero.
</p>

<h2 class="mt-10 text-xl font-semibold">Durations</h2>
<p class="mt-3 text-muted">
	Research times, run lengths and cooldowns all arrive in different shapes. These read and write all
	of them.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import {
  formatDuration,
  formatHoursDuration,
  formatSecondsAsHoursMinutes,
  parseDuration,
  parseDurationToHours
} from 'thetowersdk/formatting'

formatDuration(3661)                 // '1h, 1m, 1s'
formatSecondsAsHoursMinutes(5400)    // '1h 30m'
formatHoursDuration(38.88)           // '1d 14h 52m 48s'

parseDuration('1h, 1m, 1s')          // 3661
parseDurationToHours('38:53:00')     // 38.8833…  — the catalog's own format`}
	/>
</div>
<p class="mt-3 text-muted">
	<code>parseDurationToHours</code> is the one to reach for with lab research times: the catalogs
	write them as <code>38:53:00</code>, and this turns that into hours you can add up.
</p>

<h2 class="mt-10 text-xl font-semibold">Multipliers And Rates</h2>
<div class="mt-4">
	<CodeBlock
		code={`import {
  formatMultiplier,
  formatMultiplier3Decimals,
  computeHourlyRate
} from 'thetowersdk/formatting'

formatMultiplier(2.4)            // '2.400×'
formatMultiplier3Decimals(2.4)   // '2.400×'

// Coins per hour from a run's coins and its real time in seconds.
computeHourlyRate(4_770_477_147_914, 3600)   // '1.325B'`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">A Worked Example</h2>
<p class="mt-3 text-muted">
	A lab cost table, rendered the way a player would recognise it — costs in the game's notation,
	research time as a readable duration.
</p>
<div class="mt-4">
	<CodeBlock
		code={`import { LAB_CATALOG } from 'thetowersdk/data'
import { formatNumberForDisplay, parseDurationToHours, formatHoursDuration } from 'thetowersdk/formatting'

const lab = LAB_CATALOG.find((entry) => entry.name === 'Attack Speed')

const next = lab.levels.slice(10, 20)
const coins = next.reduce((sum, level) => sum + level.cost, 0)
const hours = next.reduce((sum, level) => sum + parseDurationToHours(level.duration), 0)

console.log(formatNumberForDisplay(coins))   // '243.56K'
console.log(formatHoursDuration(hours))      // days, hours, minutes`}
	/>
</div>

<h2 class="mt-10 text-xl font-semibold">The Rest</h2>
<p class="mt-3 text-muted">
	Also here: <code>formatDateTimeForDisplay</code>, <code>formatDateToISO</code> and
	<code>parseSaveDateTimeToMs</code> for the timestamps in a save;
	<code>normalizeDecimalSeparator</code> for input from locales that use a comma;
	<code>sortByUnit</code> and <code>sortByConvertedDuration</code> for ordering a table by a column
	of formatted values; and <code>roundToDisplayPrecision</code> and
	<code>stripInsignificantDecimalZeros</code> for matching the game's own rounding.
</p>

<p class="mt-8 text-sm">
	<a href={href('/docs/data/')}>Catalogs →</a>
	·
	<a href={href('/docs/save/')}>Save Files →</a>
	·
	<a href={href('/docs/charts/')}>Charts →</a>
</p>
