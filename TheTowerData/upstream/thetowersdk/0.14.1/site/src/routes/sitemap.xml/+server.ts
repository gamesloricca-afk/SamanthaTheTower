import { base } from '$app/paths';
import { sitemapUrls } from '$lib/seo';

export const prerender = true;

export function GET() {
	const urls = sitemapUrls(base)
		.map((url) => `<url><loc>${url}</loc></url>`)
		.join('\n');
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
		{
			headers: { 'Content-Type': 'application/xml; charset=utf-8' }
		}
	);
}
