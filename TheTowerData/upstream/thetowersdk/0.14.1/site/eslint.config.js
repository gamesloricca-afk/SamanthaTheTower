import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},
	{
		rules: {
			/*
			 * This site resolves its own links, in `src/lib/paths.ts`.
			 *
			 * `href()` reads `base` from `$app/paths` and applies `trailingSlash: 'always'`, which
			 * is what this rule is asking for — it just cannot see through the helper, so every
			 * `href={href('/docs/')}` on the site reads as unresolved. That was 87 of the 88
			 * remaining errors, and while they stood, `npm run lint` failed on every run and the
			 * real problems hid behind them: four dead imports, a function computed and never
			 * rendered, and an error page declaring props SvelteKit never passes, so it showed an
			 * empty status and a generic message for every failure.
			 *
			 * If the links ever move to SvelteKit's own `resolve()`, delete this and let the rule
			 * do the checking again.
			 */
			'svelte/no-navigation-without-resolve': 'off'
		}
	}
);
