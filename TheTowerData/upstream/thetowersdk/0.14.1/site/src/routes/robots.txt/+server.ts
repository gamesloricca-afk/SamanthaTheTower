import { base } from '$app/paths';
import { SITE_ORIGIN } from '$lib/links';

export const prerender = true;

export function GET() {
	const sitemap = new URL(`${base}/sitemap.xml`, SITE_ORIGIN).href;
	return new Response(`User-agent: *\nAllow: /\nSitemap: ${sitemap}\n`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
}
