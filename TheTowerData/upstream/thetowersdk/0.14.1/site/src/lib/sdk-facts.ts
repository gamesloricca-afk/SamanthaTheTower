import manifest from 'thetowersdk/package.json';
import { CALCULATOR_BUILDERS } from 'thetowersdk/builders';
import { SHARED_CHART_REGISTRY } from 'thetowersdk/charts';
import { GAME_KNOWLEDGE, PATCH_NOTES, allNodes } from 'thetowersdk/knowledge';
import * as mechanics from 'thetowersdk/mechanics';

/**
 * Counts read from the installed package, never typed into a sentence.
 *
 * Every one of these appears in prose somewhere on this site, and a number in prose has nothing to
 * disagree with: the page keeps rendering and keeps being wrong. `SDK_VERSION` is already sourced
 * this way, for the same reason and after the same kind of drift.
 *
 * The alternative — a test that checks the numerals — was tried and is still here as a backstop,
 * but it can only catch a claim phrased the way its pattern expects. Deriving the value removes
 * the question.
 *
 * ## A word that meant two things
 *
 * "Calculator" named two different populations. `CALCULATOR_BUILDERS` is fifteen ready-made
 * builders that declare their own inputs; the MCP registry separately declares over 1,900
 * calculator handles across the whole exported surface. A reader who saw "fifteen calculators"
 * here and asked `calc_list` for a list got a number two orders of magnitude larger, with nothing
 * to explain the gap.
 *
 * So the fifteen are called BUILDERS throughout, which is what they are and what the entry point
 * is named. `sdkFacts.builders` is the number; there is no `sdkFacts.calculators`, deliberately.
 */
export const sdkFacts = {
	/** Ready-made calculators that declare their own inputs — `thetowersdk/builders`. */
	builders: CALCULATOR_BUILDERS.length,

	/** Exported functions on `thetowersdk/mechanics`. */
	formulas: Object.values(mechanics).filter((value) => typeof value === 'function').length,

	/** Curated chart datasets — `thetowersdk/charts`. */
	chartDatasets: SHARED_CHART_REGISTRY.length,

	/** Entities in the knowledge graph. */
	graphNodes: allNodes(GAME_KNOWLEDGE).length,

	/** Subject areas the graph is divided into. */
	compartments: GAME_KNOWLEDGE.compartments.length,

	/** Individual sourced claims across every entity. */
	graphClaims: allNodes(GAME_KNOWLEDGE).flatMap((node) => node.assertions ?? []).length,

	/** Recorded misreadings — ways a mechanic has already been got wrong. */
	graphTraps: allNodes(GAME_KNOWLEDGE).flatMap((node) => node.traps ?? []).length,

	/** Patch notes shipped in the archive. */
	patchNotes: (PATCH_NOTES ?? []).length,

	/** Importable subpaths, read from the package's own exports map. */
	entryPoints: Object.keys(manifest.exports ?? {}).filter(
		(key) => key.startsWith('./') && !key.includes('*') && !key.endsWith('.json')
	).length
} as const;

/** `1656` as `1,656`, for prose. */
export function grouped(value: number): string {
	return value.toLocaleString('en-US');
}

/**
 * Small numbers written out, the way the prose does.
 *
 * Only as far as the counts actually reach. A table that silently falls back to digits would let a
 * sentence read "the 15 builders" mid-paragraph and nobody would notice until it shipped.
 */
const WORDS: Record<number, string> = {
	11: 'eleven',
	12: 'twelve',
	13: 'thirteen',
	14: 'fourteen',
	15: 'fifteen',
	16: 'sixteen',
	17: 'seventeen',
	18: 'eighteen',
	19: 'nineteen',
	20: 'twenty'
};

export function spelled(value: number): string {
	return WORDS[value] ?? grouped(value);
}
