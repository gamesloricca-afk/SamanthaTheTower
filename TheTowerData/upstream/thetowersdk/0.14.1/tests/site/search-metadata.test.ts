import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SITE } from '../helpers/paths'
import { PAGE_METADATA, pageMetadata, serializeStructuredData, shareLogoUrl, siteStructuredData, sitemapUrls } from '../../site/src/lib/seo'

describe('search and link previews', () => {
  it('describes every real page and keeps one source of head metadata', () => {
    const routes = path.join(SITE, 'src/routes')
    let pages = 0
    const realRoutes = new Set<string>()
    function visit(dir: string) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name)
        if (entry.isDirectory()) visit(file)
        else if (entry.name === '+page.svelte') {
          const route = `/${path.relative(routes, dir).split(path.sep).filter(Boolean).join('/')}`
          realRoutes.add(route.endsWith('/') ? route : `${route}/`)
          const metadata = pageMetadata(route)
          expect(metadata.title, route).not.toContain('Not Found')
          expect(metadata.description.length, route).toBeGreaterThan(30)
          const content = readFileSync(file, 'utf8')
          expect(content, route).not.toMatch(/<title>|name="description"/)
          pages++
        }
      }
    }
    visit(routes)
    expect(pages).toBeGreaterThan(20)
    for (const route of Object.keys(PAGE_METADATA)) expect(realRoutes.has(route), route).toBe(true)
    expect(new Set(Object.values(PAGE_METADATA).map(row => row[1])).size).toBe(Object.keys(PAGE_METADATA).length)
  })

  it('pins the deployed canonical and image URLs, without campaign parameters', () => {
    const save = pageMetadata('/TheTowerSDK/docs/save/?utm_source=discord#example', '/TheTowerSDK')
    expect(save.canonical).toBe('https://tmrxjd.github.io/TheTowerSDK/docs/save/')
    expect(save.title).toBe('Read Tower Save Files · TheTowerSDK')
    expect(shareLogoUrl('/TheTowerSDK')).toBe('https://tmrxjd.github.io/TheTowerSDK/TheTowerSDK_logo.v5.png')
    expect(new URL(pageMetadata('//untrusted.example/').canonical).origin).toBe('https://tmrxjd.github.io')
    const png = readFileSync(path.join(SITE, 'static/TheTowerSDK_logo.v5.png'))
    expect(png.subarray(1, 4).toString()).toBe('PNG')
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([500, 500])
  })

  it('lists actual SDK pages, excluding hidden integrations and missing routes', () => {
    const urls = sitemapUrls('/TheTowerSDK')
    expect(urls).toContain('https://tmrxjd.github.io/TheTowerSDK/docs/save/')
    expect(urls).not.toContain('https://tmrxjd.github.io/TheTowerSDK/ags/')
    expect(urls).toHaveLength(Object.keys(PAGE_METADATA).length)
    for (const url of urls) expect(pageMetadata(new URL(url).pathname, '/TheTowerSDK').indexable).toBe(true)
    expect(pageMetadata('/missing/').indexable).toBe(false)
    expect(pageMetadata('/ags/').indexable).toBe(false)
  })

  it('emits parseable structured data and escapes script-closing content', () => {
    const schema = siteStructuredData('/TheTowerSDK')
    expect(schema['@graph'].find(node => node['@type'] === 'SoftwareSourceCode')).toMatchObject({
      codeRepository: 'https://github.com/TmRxJD/TheTowerSDK', programmingLanguage: 'TypeScript',
    })
    const planted = { description: '</script><script>unexpected()</script>' }
    const serialized = serializeStructuredData(planted)
    expect(serialized).not.toContain('<')
    expect(JSON.parse(serialized)).toEqual(planted)
  })
})
