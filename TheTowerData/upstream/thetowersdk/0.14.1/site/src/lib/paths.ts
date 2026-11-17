import { base } from '$app/paths';

/**
 * Static asset URL under `paths.base` (no trailing slash — files are not routes).
 */
export function asset(path: string): string {
	const raw = path.startsWith('/') ? path : `/${path}`;
	return base ? `${base}${raw}` : raw;
}

/**
 * In-app href that respects `paths.base` (GitHub Pages) and trailingSlash: 'always'.
 * Hash fragments are preserved and never get a trailing slash.
 */
export function href(to: string): string {
	const hashIndex = to.indexOf('#');
	const pathOnly = hashIndex >= 0 ? to.slice(0, hashIndex) : to;
	const hash = hashIndex >= 0 ? to.slice(hashIndex + 1) : null;

	const raw = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
	const withSlash = raw === '/' || raw === '' ? '/' : raw.endsWith('/') ? raw : `${raw}/`;

	let result: string;
	if (!base) {
		result = withSlash;
	} else if (withSlash === '/') {
		result = `${base}/`;
	} else {
		result = `${base}${withSlash}`;
	}

	return hash !== null ? `${result}#${hash}` : result;
}
