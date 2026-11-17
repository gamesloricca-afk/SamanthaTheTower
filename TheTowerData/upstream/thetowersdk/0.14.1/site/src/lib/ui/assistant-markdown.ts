/**
 * Render an assistant reply the way the Run Tracker renders it.
 *
 * Ported from `src/services/tracker-ai/chatResponseFormatting.ts` in the tracker, so an answer on
 * this site reads exactly as it does there rather than as raw markdown. The pipeline is the same
 * and the order matters:
 *
 *   1. Lift maths out into placeholders, because Markdown would mangle `\[ … \]` and `$…$` before
 *      KaTeX ever saw it — backslashes become escapes and underscores become emphasis.
 *   2. Parse the remaining Markdown with GFM on, which is what produces the tables and lists.
 *   3. Sanitize, since the HTML comes from a model.
 *   4. Put the rendered maths back.
 *
 * The tracker also handles Discord timestamps and reasoning traces; neither reaches this site's
 * demo, so those steps are left out rather than carried across unused.
 */
import DOMPurify from 'dompurify';
import katex from 'katex';
// KaTeX emits markup that only reads as maths with its own stylesheet; without this the rendered
// expression collapses into a run of unstyled characters.
import 'katex/dist/katex.min.css';
import { marked } from 'marked';

type MathPlaceholder = { token: string; html: string };

const PLACEHOLDER_PREFIX = '@@TOWERAI_MATH_';

function renderMath(expression: string, displayMode: boolean): string {
	try {
		return katex.renderToString(expression, {
			displayMode,
			throwOnError: false,
			output: 'html'
		});
	} catch {
		// An expression KaTeX cannot parse is shown as written, which is still readable.
		return displayMode ? `<pre>${expression}</pre>` : `<code>${expression}</code>`;
	}
}

/**
 * A `$…$` run is only maths if it looks like maths.
 *
 * Answers about this game talk about costs, so "$5.31T earned" is common. Treating every dollar
 * sign as a delimiter turns ordinary prose into a KaTeX error.
 */
function looksLikeMath(expression: string): boolean {
	return /[\\^_{}]|\\times|\\frac|\\text/.test(expression);
}

function liftMath(input: string): { text: string; placeholders: MathPlaceholder[] } {
	const placeholders: MathPlaceholder[] = [];
	let text = String(input || '');

	const push = (expression: string, displayMode: boolean): string => {
		const trimmed = expression.trim();
		if (!trimmed) return '';
		const token = `${PLACEHOLDER_PREFIX}${placeholders.length}@@`;
		placeholders.push({ token, html: renderMath(trimmed, displayMode) });
		return token;
	};

	text = text.replace(/```math\s*\n([\s\S]*?)\n```/g, (_m, body) => `\n\n${push(body, true)}\n\n`);
	text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_m, body) => `\n\n${push(body, true)}\n\n`);
	text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_m, body) => `\n\n${push(body, true)}\n\n`);
	text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_m, body) => push(body, false));
	text = text.replace(/(^|[^\\$])\$([^\n$]+?)\$/g, (match, prefix, body) =>
		looksLikeMath(body) ? `${prefix}${push(body, false)}` : match
	);

	return { text, placeholders };
}

function restoreMath(html: string, placeholders: MathPlaceholder[]): string {
	let out = html;
	for (const placeholder of placeholders) {
		// A display expression sits alone in its own paragraph; unwrap it so it is not inside a <p>.
		out = out.replace(new RegExp(`<p>\\s*${placeholder.token}\\s*</p>`, 'g'), placeholder.html);
		out = out.split(placeholder.token).join(placeholder.html);
	}
	return out;
}

export function renderAssistantMarkdown(input: string): string {
	const source = String(input || '').trim();
	if (!source) return '';

	const { text, placeholders } = liftMath(source);
	const parsed = marked.parse(text, { async: false, breaks: false, gfm: true });
	const html = typeof parsed === 'string' ? parsed : '';

	/*
	 * KaTeX output carries the attributes and elements its own CSS targets, so they are allowed
	 * through explicitly. Without this the maths is sanitized into unstyled fragments.
	 */
	const sanitized = DOMPurify.sanitize(html, {
		USE_PROFILES: { html: true, mathMl: true, svg: true },
		ADD_ATTR: ['aria-hidden', 'style', 'class'],
		ADD_TAGS: ['semantics', 'annotation', 'mrow', 'mi', 'mo', 'mn', 'msup', 'mfrac']
	});

	return restoreMath(sanitized, placeholders);
}
