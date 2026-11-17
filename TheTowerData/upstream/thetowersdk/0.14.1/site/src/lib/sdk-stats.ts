import {
	ALL_PERKS,
	BOT_UPGRADES_DATA,
	CARD_TEMPLATES,
	GLOSSARY_NAME_ROWS,
	LAB_CATALOG,
	MILESTONE_REWARD_ROWS,
	MODULE_SUBSTATS_CLUSTER,
	MODULE_TEMPLATES,
	RELIC_TEMPLATES,
	TIER_BATTLE_CONDITION_DEFINITIONS,
	VAULT_HARMONY_IMPORT_CATALOG,
	VAULT_POWER_IMPORT_CATALOG,
	buildGuardianDefinitions,
	getWorkshopEnhancementDefinitions,
	getWorkshopStatDefinitions,
	uwStoneChartData
} from 'thetowersdk/data';
import * as mechanics from 'thetowersdk/mechanics';

function countUwStats(): number {
	return Object.values(uwStoneChartData).reduce(
		(sum, weapon) => sum + (weapon.stats?.length ?? 0),
		0
	);
}

function countBotStats(): number {
	return BOT_UPGRADES_DATA.reduce((sum, bot) => {
		const main = Object.keys(bot.stats ?? {}).length;
		const plus = Object.keys(bot.plus?.stats ?? {}).length;
		return sum + main + plus;
	}, 0);
}

function countLabLevels(): number {
	return LAB_CATALOG.reduce((sum, lab) => sum + lab.levels.length, 0);
}

function countGuardianChipStats(): number {
	return buildGuardianDefinitions().reduce(
		(sum, guardian) => sum + Object.keys(guardian.stats ?? {}).length,
		0
	);
}

/** Callable exports from `thetowersdk/mechanics` (ready-to-use formulas). */
function countMechanicsFormulas(): number {
	return Object.values(mechanics).filter((value) => typeof value === 'function').length;
}

/** A value that can be plotted on an axis — number, or a number wearing a unit. */
function isPlottable(value: unknown): boolean {
	if (typeof value === 'number') return Number.isFinite(value);
	if (typeof value !== 'string') return false;
	// "x8.0", "50%", "38:53:00" — a leading number is enough to plot against level.
	return /^[x×]?\s*-?\d/.test(value.trim());
}

/** Keys that identify a row rather than measure anything. */
const AXIS_KEYS = new Set(['level', 'name', 'key', 'label', 'id', 'category']);

/**
 * How many distinct series a single level-progression yields.
 *
 * A lab's `levels[]` carries both `cost` and `duration`, and those are two
 * different charts, not one. A bot stat's levels are bare scalars, so one.
 * Counting the shape rather than hardcoding a multiplier means this tracks the
 * data if a field is added, instead of quietly under-reporting.
 */
function seriesInProgression(levels: unknown): number {
	const rows = Array.isArray(levels)
		? levels
		: levels && typeof levels === 'object'
			? Object.values(levels as Record<string, unknown>)
			: [];

	const sample = rows[0];
	if (sample === undefined) return 0;
	if (typeof sample !== 'object' || sample === null) return isPlottable(sample) ? 1 : 0;

	/*
	 * Union the plottable keys across several rows rather than trusting the
	 * first. Ultimate weapon stats read `cost: "Unlock"` at level 0 and a real
	 * number from level 1 on — sampling only row 0 silently dropped the entire
	 * cost curve for every UW stat in the package.
	 */
	const plottable = new Set<string>();
	for (const row of rows.slice(0, 8)) {
		if (typeof row !== 'object' || row === null) continue;
		for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
			if (!AXIS_KEYS.has(key) && isPlottable(value)) plottable.add(key);
		}
	}
	return plottable.size;
}

/**
 * Every chart the shipped game data can produce, not the handful anyone has
 * hand-authored. One chart = one measurable field plotted across a level range.
 *
 * Deliberately excludes catalogs with no progression to plot: relics carry a
 * single flat `value`, module substats are cluster metadata, vault nodes are
 * id/name pairs, and workshop enhancements declare only a level *range* with no
 * per-level values. Counting those would have added several hundred charts that
 * cannot be drawn.
 */
export function countChartableSeries(): number {
	let total = 0;

	for (const lab of LAB_CATALOG) total += seriesInProgression(lab.levels);
	for (const stat of getWorkshopStatDefinitions()) total += seriesInProgression(stat.levels);

	for (const card of CARD_TEMPLATES) {
		if (card.levelValues?.length) total += 1;
		if (card.masteryValues?.length) total += 1;
	}

	for (const weapon of Object.values(uwStoneChartData)) {
		for (const stat of weapon.stats ?? []) total += seriesInProgression(stat.levels);
	}

	// A bot stat is a formula over levels 0..maxLevel, so each one is exactly one series.
	for (const bot of BOT_UPGRADES_DATA) {
		total += Object.keys(bot.stats ?? {}).length + Object.keys(bot.plus?.stats ?? {}).length;
	}

	for (const guardian of buildGuardianDefinitions()) {
		for (const stat of Object.values(guardian.stats ?? {}))
			total += seriesInProgression(stat?.levels);
	}

	return total;
}

/**
 * Total upgrade levels across every stat of a mechanic.
 *
 * The counts on the home page used to be "how many stats exist" — 47 for the whole of workshop, 36
 * for all nine ultimate weapons. Those undersell the package by orders of magnitude: what it
 * actually carries is every level of every stat, and workshop alone is 31,079 of them. A stat is
 * one row in a table; a level is one row of data you would otherwise have to enter by hand.
 *
 * Ladders come in two shapes across the catalogs — an array of level records, or an object keyed by
 * level number — so both are counted. Anything else contributes nothing rather than guessing.
 */
function countLevels(ladder: unknown): number {
	if (Array.isArray(ladder)) return ladder.length;
	if (ladder && typeof ladder === 'object') return Object.keys(ladder).length;
	return 0;
}

const sumLevels = <T>(items: readonly T[], ladders: (item: T) => unknown[]): number =>
	items.reduce(
		(total, item) =>
			total + ladders(item).reduce<number>((sum, ladder) => sum + countLevels(ladder), 0),
		0
	);

/** Every level of every ultimate weapon stat — nine weapons, four stats each. */
function countUwLevels(): number {
	return sumLevels(Object.values(uwStoneChartData), (weapon) =>
		(weapon.stats ?? []).map((stat) => stat.levels)
	);
}

/**
 * Bots carry a base stat block and a "plus" block. Each stat is a formula over levels
 * 0..maxLevel, so it holds `maxLevel + 1` levels.
 */
function countBotLevels(): number {
	return BOT_UPGRADES_DATA.reduce(
		(total, bot) =>
			total +
			[...Object.values(bot.stats ?? {}), ...Object.values(bot.plus?.stats ?? {})].reduce(
				(sum, stat) => sum + stat.maxLevel + 1,
				0
			),
		0
	);
}

function countWorkshopLevels(): number {
	return sumLevels(getWorkshopStatDefinitions(), (stat) => [stat.levels]);
}

function countGuardianLevels(): number {
	return sumLevels(buildGuardianDefinitions(), (guardian) =>
		Object.values(guardian.stats ?? {}).map((stat) => stat?.levels)
	);
}

/** Cards level twice: the card itself, and its mastery, on separate ladders. */
function countCardLevels(): number {
	return sumLevels(CARD_TEMPLATES, (card) => [card.levelValues, card.masteryValues]);
}

/** Counts from the installed package — prefer leaf data over parent totals. */
export const sdkStats = {
	labs: LAB_CATALOG.length,
	labLevels: countLabLevels(),
	workshopStats: getWorkshopStatDefinitions().length,
	workshopEnhancements: getWorkshopEnhancementDefinitions().length,
	modules: MODULE_TEMPLATES.length,
	moduleSubstats: MODULE_SUBSTATS_CLUSTER.length,
	cards: CARD_TEMPLATES.length,
	relics: RELIC_TEMPLATES.length,
	bots: BOT_UPGRADES_DATA.length,
	botStats: countBotStats(),
	guardianChipStats: countGuardianChipStats(),
	vaultNodes: VAULT_HARMONY_IMPORT_CATALOG.length + VAULT_POWER_IMPORT_CATALOG.length,
	ultimateWeapons: Object.keys(uwStoneChartData).length,
	uwStats: countUwStats(),
	perks: ALL_PERKS.length,
	battleConditions: TIER_BATTLE_CONDITION_DEFINITIONS.length,
	milestoneRewards: MILESTONE_REWARD_ROWS.length,
	glossaryNames: GLOSSARY_NAME_ROWS.length,
	formulas: countMechanicsFormulas(),
	chartableSeries: countChartableSeries(),

	// Level totals — see `countLevels`. These are what the home page shows.
	workshopLevels: countWorkshopLevels(),
	uwLevels: countUwLevels(),
	botLevels: countBotLevels(),
	guardianLevels: countGuardianLevels(),
	cardLevels: countCardLevels()
} as const;

/**
 * Thousands separators, pinned to `en-US`.
 *
 * These numbers are rendered at build time on whatever machine runs the build, and the site is
 * written in American English throughout. Left to the host locale, `31,079` would ship as `31.079`
 * from a German CI runner — a hundredfold understatement that looks like a typo, not a bug.
 */
const grouped = (value: number): string => value.toLocaleString('en-US');

/** Every level total added together, for the one figure that stands for the rest. */
export const totalUpgradeLevels =
	sdkStats.workshopLevels +
	sdkStats.labLevels +
	sdkStats.guardianLevels +
	sdkStats.uwLevels +
	sdkStats.botLevels +
	sdkStats.cardLevels;

/**
 * Home page counts.
 *
 * Level totals wherever a mechanic has ladders, plain counts only where it genuinely has none —
 * relics, vault nodes, perks and battle conditions are flat catalogs, and labelling a count as
 * though it were a level total would be the same overselling in the other direction.
 *
 * Labels say "levels" when that is what the number is. The previous set said "Workshop Stats" over
 * a count of 47, which was accurate but read as the whole of workshop being 47 things.
 */
export const packageContents = [
	{ value: grouped(sdkStats.workshopLevels), label: 'Workshop levels' },
	{ value: grouped(sdkStats.labLevels), label: 'Lab levels' },
	{ value: grouped(sdkStats.guardianLevels), label: 'Guardian levels' },
	{ value: grouped(sdkStats.chartableSeries), label: 'Chartable series' },
	{ value: grouped(sdkStats.uwLevels), label: 'UW levels' },
	{ value: grouped(sdkStats.formulas), label: 'Formulas' },
	{ value: grouped(sdkStats.botLevels), label: 'Bot levels' },
	{ value: grouped(sdkStats.cardLevels), label: 'Card levels' },
	{ value: grouped(sdkStats.milestoneRewards), label: 'Milestone rewards' },
	{ value: grouped(sdkStats.glossaryNames), label: 'Glossary terms' },
	{ value: grouped(sdkStats.relics), label: 'Relics' },
	{ value: grouped(sdkStats.vaultNodes), label: 'Vault nodes' },
	{ value: grouped(sdkStats.moduleSubstats), label: 'Module substats' },
	{ value: grouped(sdkStats.perks), label: 'Perks' },
	{ value: grouped(sdkStats.battleConditions), label: 'Battle conditions' }
] as const;
