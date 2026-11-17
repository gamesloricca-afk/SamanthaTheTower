import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { PACKAGE_ROOT } from '../helpers/paths'

/**
 * Every public entry point is documented on the site.
 *
 * The site is the front door: it is where someone decides whether this package does what they
 * need. An entry point that ships and is not written up anywhere is not a feature anyone can
 * find — and five of them were in exactly that state (`builders`, `sheets`, `assets`,
 * `knowledge`, `inputs`), including the four that were the entire point of 0.5.4.
 *
 * Nothing connects `exports` to the site's navigation, so this does. Adding a subpath to the
 * package now fails here until it is either given a page or explicitly folded into one.
 */

const SITE = path.join(PACKAGE_ROOT, 'site')
const read = (relative: string) => readFileSync(path.join(PACKAGE_ROOT, relative), 'utf8')

/**
 * Which page documents each entry point.
 *
 * A folded entry points at the page that covers it, and the comment says why — folding is a
 * decision about how the docs read, not a way to make this pass. Anything genuinely undocumented
 * has no business being in `exports`.
 */
const DOCUMENTED_BY: Record<string, string> = {
  '.': '/docs/',
  'data': '/docs/data/',
  'save': '/docs/save/',
  // Loading a save from disk is what `node` is for; it reads as one subject with `save`.
  'node': '/docs/save/',
  // The browser decoder is the same subject from the other side, and that page covers both.
  'save-decoder': '/docs/save/',
  'formatting': '/docs/formatting/',
  'mechanics': '/docs/mechanics/',
  'charts': '/docs/charts/',
  'wiki': '/docs/wiki/',
  'builders': '/docs/builders/',
  // The registry is what the MCP's calc_* tools serve; that page is where anyone meets it.
  'calculators': '/docs/mcp/',
  'bot': '/docs/bots/',
  'sheets': '/docs/sheets/',
  'knowledge': '/docs/knowledge/',
  // Not under /docs: the roster is for readers, not for people writing code against it.
  'contributions': '/contributions/',
}

/**
 * Entry points that ship but are deliberately not advertised.
 *
 * `assets` resolves The Tower's artwork, which is TechTree Games' and which this project has no
 * permission to redistribute. The wiring stays so it works the moment permission exists; the
 * documentation does not, because documenting it is the part that invites people to install art
 * nobody may hand out. `tower-assets` is `private: true` and workspace-only for the same reason.
 *
 * This is a list of decisions, not a list of gaps. Anything here is undocumented ON PURPOSE and
 * says why; anything undocumented and absent from here still fails the check above.
 */
const DELIBERATELY_UNDOCUMENTED: Record<string, string> = {
  assets: 'artwork this project has no permission to redistribute — wiring kept, docs withheld',
}

/** Entry points from the runtime `exports` map, minus patterns and plain files. */
function publicSubpaths(): string[] {
  const { exports: map } = JSON.parse(read('package.json')) as { exports: Record<string, unknown> }
  return Object.keys(map)
    .filter(key => !key.includes('*') && !/\.\w+$/.test(key))
    .map(key => (key === '.' ? '.' : key.replace(/^\.\//, '')))
}

const routeExists = (page: string) =>
  existsSync(path.join(SITE, 'src/routes', page.replace(/^\/|\/$/g, ''), '+page.svelte'))
  || (page === '/docs/' && existsSync(path.join(SITE, 'src/routes/docs/+page.svelte')))

describe.skipIf(!existsSync(SITE))('the site documents the package', () => {
  const subpaths = publicSubpaths()

  it('found the entry points', () => {
    expect(subpaths).toContain('builders')
    expect(subpaths.length).toBeGreaterThan(10)
  })

  it('every entry point is assigned a page, or deliberately withheld', () => {
    const undocumented = subpaths
      .filter(subpath => !DOCUMENTED_BY[subpath])
      .filter(subpath => !DELIBERATELY_UNDOCUMENTED[subpath])
    expect(
      undocumented,
      `${undocumented.length} entry point(s) the site never mentions: ${undocumented.join(', ')}.\n`
      + 'Give each one a page under site/src/routes/docs/, fold it into an existing page by adding\n'
      + 'it to DOCUMENTED_BY, or record it in DELIBERATELY_UNDOCUMENTED with the reason.',
    ).toEqual([])
  })

  it('nothing is both documented and withheld', () => {
    /*
     * The two lists must not overlap: an entry in both would let a page be deleted without the
     * check noticing, which is exactly the drift it exists to catch.
     */
    const both = Object.keys(DELIBERATELY_UNDOCUMENTED).filter(subpath => DOCUMENTED_BY[subpath])
    expect(both, `listed as both documented and withheld: ${both.join(', ')}`).toEqual([])
  })

  it('every assigned page exists', () => {
    const missing = [...new Set(Object.values(DOCUMENTED_BY))].filter(page => !routeExists(page))
    expect(missing, `pages named here but absent from the site: ${missing.join(', ')}`).toEqual([])
  })

  it('every page is reachable from the docs navigation', () => {
    /*
     * A page nobody links to is a page nobody reads. The nav is the only route into the docs,
     * so a file existing under `routes/` is not the same as the feature being findable.
     */
    /*
     * Both navigation surfaces, because the site has two.
     *
     * This read `content.ts` alone, which is where the header and docs lists live. A page linked
     * only from the footer -- the right home for something that is not a docs page -- therefore
     * failed a check whose stated point is "a page nobody links to is a page nobody reads". It was
     * linked, and read, and still failed.
     */
    const nav = readFileSync(path.join(SITE, 'src/lib/content.ts'), 'utf8')
      + readFileSync(path.join(SITE, 'src/lib/ui/SiteFooter.svelte'), 'utf8')
    const unlinked = [...new Set(Object.values(DOCUMENTED_BY))]
      .filter(page => page !== '/docs/')
      .filter(page => !nav.includes(`'${page}'`))
    expect(
      unlinked,
      `page(s) not in the docs nav in site/src/lib/content.ts: ${unlinked.join(', ')}`,
    ).toEqual([])
  })
})
