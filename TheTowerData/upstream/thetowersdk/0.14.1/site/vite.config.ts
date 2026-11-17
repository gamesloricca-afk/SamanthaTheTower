import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

function githubPagesBase(): '' | `/${string}` {
	const value = process.env.BASE_PATH ?? '';
	if (!value) return '';
	return value.startsWith('/') ? (value as `/${string}`) : `/${value}`;
}

export default defineConfig({
	/*
	 * Let SSR load the SDK the way Node does.
	 *
	 * `thetowersdk` is CommonJS. Installed from npm, Vite externalises it and Node requires it
	 * correctly. Installed as a local link — which is how the site is developed against an
	 * unreleased SDK — Vite treats it as source, inlines it, and evaluates CJS as ESM: every page
	 * importing a newly added entry point 500s with `exports is not defined`, while the production
	 * build of the same page is fine.
	 *
	 * Forcing it external makes development behave like the build, so a page that works here works
	 * where it ships.
	 */
	ssr: {
		external: ['thetowersdk']
	},

	/*
	 * Pre-bundle the SDK for the browser, even when it is linked.
	 *
	 * `thetowersdk` is CommonJS. Vite converts a CJS dependency to ESM for the client as part of
	 * dependency optimisation — but it skips LINKED packages, treating them as source. The browser
	 * then received raw CommonJS and every named import failed with "does not provide an export
	 * named LAB_CATALOG", while the server-rendered HTML was perfectly fine. A page that renders
	 * and then dies on hydration is a 500 in the console and a 200 on the wire.
	 *
	 * Naming the entry points opts them back in, so developing against a local SDK behaves the way
	 * the built site does.
	 */
	optimizeDeps: {
		include: [
			'thetowersdk/bot',
			'thetowersdk/builders',
			'thetowersdk/charts',
			'thetowersdk/contributions',
			'thetowersdk/data',
			'thetowersdk/formatting',
			'thetowersdk/knowledge',
			'thetowersdk/mechanics',
			'thetowersdk/node',
			'thetowersdk/save',
			'thetowersdk/save-decoder',
			'thetowersdk/sheets',
			'thetowersdk/wiki'
		]
	},
	server: {
		host: '127.0.0.1',
		port: 4173,
		strictPort: true
	},
	preview: {
		host: '127.0.0.1',
		port: 4173,
		strictPort: true
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: '404.html',
				precompress: false,
				strict: true
			}),
			paths: {
				base: githubPagesBase(),
				// Absolute asset URLs — relative `./_app` breaks more easily under base-path hosting.
				relative: false
			}
		})
	]
});
