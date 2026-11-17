import { nav } from '$lib/content';

/** Tiles written by `scripts/prepare-art.mjs`; it prints this number when it finishes. */
export const ART_TILE_COUNT = 8;

/**
 * Which backdrop a page starts on.
 *
 * The pages in the header each get their own tile, assigned by position rather than hashed. A hash
 * distributes but does not guarantee: with 8 tiles and 5 nav routes, two of them landing on the
 * same image is likelier than not, and the two pages a reader moves between most often are exactly
 * the ones where a repeat is noticeable.
 *
 * Everything else is still hashed from its path — there are far more routes than tiles, so some
 * repetition is unavoidable there, and a stable choice per route is worth more than an even spread.
 * Docs pages advance through the tiles as they scroll anyway, so the starting tile is where a page
 * begins rather than what it looks like throughout.
 */
const NAV_TILES = new Map(
	nav.map((item, index) => [normalize(item.href), (index % ART_TILE_COUNT) + 1])
);

function normalize(path: string): string {
	const trimmed = path.replace(/\/+$/, '');
	return trimmed === '' ? '/' : trimmed;
}

export function artTileForPath(path: string): number {
	const key = normalize(path);

	const assigned = NAV_TILES.get(key);
	if (assigned !== undefined) return assigned;

	/*
	 * A docs page sits under its nav entry, so it starts one tile along from it. That keeps a
	 * section of the site visually related without every page in it being identical.
	 */
	for (const [navPath, tile] of NAV_TILES) {
		if (navPath !== '/' && key.startsWith(`${navPath}/`)) {
			return ((tile - 1 + hash(key)) % ART_TILE_COUNT) + 1;
		}
	}

	return (hash(key) % ART_TILE_COUNT) + 1;
}

function hash(value: string): number {
	let result = 0;
	for (let index = 0; index < value.length; index += 1) {
		result = (result * 31 + value.charCodeAt(index)) >>> 0;
	}
	return result;
}
