/**
 * Syntax highlighting for the site's code samples.
 *
 * Most of this site is code blocks, and they were rendering as one flat grey — which is most of
 * why the page read as lifeless next to any other SDK's documentation. Shiki is what the reference
 * sites use, and it tokenizes with the real TextMate grammar rather than a regex approximation, so
 * a sample cannot end up confidently coloured and wrong.
 *
 * Three deliberate choices:
 *
 * - **Fine-grained imports.** `shiki`'s default entry bundles every grammar and theme it ships,
 *   which is megabytes. `shiki/core` plus exactly one grammar and one theme is a fraction of that.
 * - **Lazy.** The highlighter is created on first use and never during module evaluation, so a page
 *   with no code block never pays for it, and it stays out of the initial chunk.
 * - **One highlighter, shared.** Creating it is the expensive part; the promise is cached, so
 *   concurrent callers on one page await the same instance instead of building several.
 *
 * `codeToHtml` escapes its input, so the returned markup is safe to inject. The caller renders the
 * plain, escaped source until this resolves, which means the code is readable with JavaScript
 * disabled and never flashes empty.
 */
import type { HighlighterCore } from 'shiki/core';

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
	if (!highlighterPromise) {
		highlighterPromise = (async () => {
			const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
				import('shiki/core'),
				import('shiki/engine/javascript')
			]);
			return createHighlighterCore({
				/*
				 * TypeScript alone covers every sample here — the shell snippets are single commands
				 * where highlighting adds nothing, and TypeScript's grammar handles plain JavaScript.
				 */
				langs: [import('@shikijs/langs/typescript')],
				themes: [import('@shikijs/themes/night-owl')],
				/*
				 * The JavaScript regex engine rather than the WASM Oniguruma one: it needs no `.wasm`
				 * fetch, which keeps this to a single lazy chunk and avoids a second network round
				 * trip on a static host.
				 */
				engine: createJavaScriptRegexEngine()
			});
		})();
	}
	return highlighterPromise;
}

/**
 * Returns highlighted markup for `code`, or `null` if highlighting is unavailable.
 *
 * Failure is not an error worth surfacing: the caller already has the plain source on screen, so a
 * highlighter that cannot load leaves the block exactly as it was rather than blanking it.
 */
export async function highlightCode(code: string): Promise<string | null> {
	try {
		const highlighter = await getHighlighter();
		return highlighter.codeToHtml(code, {
			lang: 'typescript',
			theme: 'night-owl'
		});
	} catch {
		return null;
	}
}
