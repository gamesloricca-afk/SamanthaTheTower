/** @type {import("prettier").Config} */
const config = {
	useTabs: true,
	singleQuote: true,
	trailingComma: 'none',
	/*
	 * Without this, every file fails on a Windows checkout.
	 *
	 * Git hands out CRLF here and Prettier's default is 'lf', so `npm run lint` reported
	 * style issues in 50 files — 24 of which had nothing wrong with them but their line
	 * endings. A check that fails the same way for everyone on one platform is a check
	 * nobody on that platform runs.
	 */
	endOfLine: 'auto',
	printWidth: 100,
	plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
	overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
	tailwindStylesheet: './src/routes/layout.css'
};

export default config;
