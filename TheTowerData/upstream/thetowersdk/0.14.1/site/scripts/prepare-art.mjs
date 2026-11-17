/**
 * Turn generated source art into the site's background assets.
 *
 *   node scripts/prepare-art.mjs <hero-source.png> <collage-source.png> [more-sheets...]
 *
 * Any number of collage sheets can be passed; tiles are numbered continuously across all of them,
 * so adding a sheet appends rather than renumbering what is already referenced by the page.
 *
 * Both sources are generator output and neither is usable as-is:
 *
 * - The hero source carries a "Made with AI" badge in its top-right corner, and is pillarboxed —
 *   the art is a portrait panel centred in a square canvas with pure black bars either side. Left
 *   alone, `object-fit: cover` would letterbox those bars into the hero at some viewports and crop
 *   them out at others.
 * - The collage is a 3x2 sheet of six tiles separated by white gutters.
 *
 * The badge is removed from the pixels rather than hidden with CSS. `cover` trims the top at wide
 * viewports but the sides at narrow ones, so a crop-based fix would show the badge on phones and
 * nowhere else — the kind of thing that ships unnoticed because nobody checks the breakpoint where
 * it appears.
 *
 * Everything is measured, not hard-coded: gutters and bars are found by scanning the pixels, so
 * re-running against a differently-sized regeneration still works.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const [heroSource, ...collageSources] = process.argv.slice(2);
if (!heroSource || collageSources.length === 0) {
	console.error('usage: node scripts/prepare-art.mjs <hero-source> <collage-source> [more...]');
	process.exit(1);
}

/** Grey value per pixel, for edge and gutter detection. */
async function raster(buffer) {
	const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
	const at = (x, y) => {
		const i = (y * info.width + x) * info.channels;
		return (data[i] + data[i + 1] + data[i + 2]) / 3;
	};
	return { info, at };
}

const kb = (buffer) => `${(buffer.length / 1024).toFixed(0)} KB`;

// ---------------------------------------------------------------- hero

/*
 * The badge occupies the top ~6%. Ten percent comes off before the bars are measured, because the
 * badge is the brightest thing in the image and would otherwise defeat the "is this column pure
 * black" test on the right-hand side — the bar detection would stop at the badge instead of at the
 * art.
 */
const HERO_BADGE_TRIM = 0.1;

{
	const original = readFileSync(heroSource);
	const { info: full } = await raster(original);
	const badgeTrim = Math.round(full.height * HERO_BADGE_TRIM);

	const debadged = await sharp(original)
		.extract({ left: 0, top: badgeTrim, width: full.width, height: full.height - badgeTrim })
		.toBuffer();

	// Columns that never exceed this are the pillarbox, not art. Not zero: JPEG-ish noise and
	// gradient dither leave a few units of signal in bars that read as pure black.
	const BAR_THRESHOLD = 12;
	const { info, at } = await raster(debadged);
	const columnPeak = (x) => {
		let peak = 0;
		for (let y = 0; y < info.height; y++) peak = Math.max(peak, at(x, y));
		return peak;
	};

	let left = 0;
	while (left < info.width && columnPeak(left) < BAR_THRESHOLD) left++;
	let right = info.width - 1;
	while (right > left && columnPeak(right) < BAR_THRESHOLD) right--;

	const buffer = await sharp(debadged)
		.extract({ left, top: 0, width: right - left + 1, height: info.height })
		.resize({ width: 1600, withoutEnlargement: true })
		.webp({ quality: 82 })
		.toBuffer();

	writeFileSync('static/hero-art.webp', buffer);
	const out = await sharp(buffer).metadata();
	console.log(
		`hero    ${full.width}x${full.height} -> ${out.width}x${out.height} (${kb(buffer)}) ` +
			`badge ${badgeTrim}px off the top, bars ${left}px left / ${info.width - 1 - right}px right`
	);
}

// ------------------------------------------------------------- features

/**
 * Runs of consecutive indices that pass `test` — the gutters between tiles.
 *
 * Returned as ranges so a multi-pixel gutter counts once; the sheet's separators are five or six
 * pixels wide, not one.
 */
function runsWhere(count, test) {
	const runs = [];
	for (let i = 0; i < count; i++) {
		if (!test(i)) continue;
		const last = runs.at(-1);
		if (last && i === last.end + 1) last.end = i;
		else runs.push({ start: i, end: i });
	}
	return runs;
}

/** Tile spans between gutters, ignoring any gutter that runs along the outer edge. */
function spans(size, gutters) {
	const result = [];
	let cursor = 0;
	for (const gutter of gutters) {
		if (gutter.start > cursor) result.push({ offset: cursor, size: gutter.start - cursor });
		cursor = gutter.end + 1;
	}
	if (cursor < size) result.push({ offset: cursor, size: size - cursor });
	return result;
}

let tileIndex = 0;
for (const collageSource of collageSources) {
	const original = readFileSync(collageSource);
	const { info, at } = await raster(original);

	// A gutter is near-white across its whole length; art in this set never is.
	const GUTTER_THRESHOLD = 150;
	const columnMean = (x) => {
		let sum = 0;
		for (let y = 0; y < info.height; y++) sum += at(x, y);
		return sum / info.height;
	};
	const rowMean = (y) => {
		let sum = 0;
		for (let x = 0; x < info.width; x++) sum += at(x, y);
		return sum / info.width;
	};

	const columns = spans(
		info.width,
		runsWhere(info.width, (x) => columnMean(x) > GUTTER_THRESHOLD)
	);
	const rows = spans(
		info.height,
		runsWhere(info.height, (y) => rowMean(y) > GUTTER_THRESHOLD)
	);

	const before = tileIndex;
	for (const row of rows) {
		for (const column of columns) {
			const buffer = await sharp(original)
				.extract({ left: column.offset, top: row.offset, width: column.size, height: row.size })
				// These sit behind full sections at viewport scale, so they need real width.
				.resize({ width: 1400, withoutEnlargement: true })
				.webp({ quality: 78 })
				.toBuffer();
			const name = `static/feature-${tileIndex + 1}.webp`;
			writeFileSync(name, buffer);
			console.log(`tile    ${name} ${column.size}x${row.size} (${kb(buffer)})`);
			tileIndex++;
		}
	}
	console.log(
		`sliced ${tileIndex - before} tiles from a ${columns.length}x${rows.length} sheet ` +
			`(${collageSource})`
	);
}

console.log(`\n${tileIndex} tiles total — set ART_TILE_COUNT in +page.svelte to ${tileIndex}`);
