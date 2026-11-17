import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { PACKAGE_ROOT } from '../helpers/paths'

/**
 * What the site says about dependencies must be what the manifest says.
 *
 * A dependency page is exactly the kind that rots without breaking. Add a second runtime
 * dependency and the page keeps rendering "one runtime dependency" — correct prose about a package
 * that no longer exists. And the claim is not decorative: it tells a reader what enters their tree
 * and whose license travels with what they ship.
 *
 * The README and `docs/DESKTOP_AND_MOBILE.md` both said "no runtime dependencies" while the
 * package depended on zod, which is how this was found. Nothing was wrong with the sentence when
 * it was written; the dependency arrived later and nothing connected the two.
 *
 * So this reads `package.json` and holds the pages to it, rather than restating a number.
 */


const manifest = JSON.parse(
  readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'),
) as { dependencies?: Record<string, string> }

const runtimeDependencies = Object.keys(manifest.dependencies ?? {})

const read = (relative: string) => {
  const full = path.join(PACKAGE_ROOT, relative)
  return existsSync(full) ? readFileSync(full, 'utf8') : null
}

const DEPENDENCY_PAGE = 'site/src/routes/docs/dependencies/+page.svelte'
const LICENSE_PAGE = 'site/src/routes/docs/license/+page.svelte'

describe('the dependency claims match the manifest', () => {
  it('has exactly the dependencies the pages were written for', () => {
    /*
     * The pages say "one runtime dependency" and name zod. If that ever stops being true, the
     * sentence has to change — so this fails rather than letting the prose quietly go stale.
     */
    expect(runtimeDependencies).toEqual(['zod'])
  })

  it('names every runtime dependency on the dependencies page', () => {
    const page = read(DEPENDENCY_PAGE)
    expect(page, `${DEPENDENCY_PAGE} is missing`).not.toBeNull()

    const unnamed = runtimeDependencies.filter(name => !page!.includes(name))
    expect(unnamed, 'a dependency enters the consumer tree unmentioned').toEqual([])
  })

  it('states the license of every runtime dependency', () => {
    /*
     * Naming the package is not accreditation. The license is the part a reader needs, and for the
     * WebAssembly build it is the part that legally travels with what they ship.
     */
    const page = read(DEPENDENCY_PAGE)!
    const licensePage = read(LICENSE_PAGE)!

    for (const name of runtimeDependencies) {
      expect(page, `${name} has no license on the dependencies page`).toMatch(/MIT/)
      expect(licensePage, `${name} is not on the licensing page`).toContain(name)
    }
  })

  it('reproduces every dependency license in NOTICE', () => {
    /*
     * NOTICE is what ships. A page on a website is not distributed with the artifact, so the
     * license text has to be in the tarball as well as on the site.
     */
    const notice = read('NOTICE')
    expect(notice, 'NOTICE is missing').not.toBeNull()

    for (const name of runtimeDependencies) {
      expect(notice!, `${name} is not accredited in NOTICE`).toContain(name)
    }

    expect(notice!, 'the MIT text itself must be present, not just the name')
      .toContain('Permission is hereby granted, free of charge')
  })

  it('says whether each artifact requires or bundles it', () => {
    /*
     * The distinction that decides obligations. The npm tarball requires zod; the WebAssembly build
     * compiles it in. A page that mentioned only the first would understate what a `.wasm`
     * redistributor is carrying.
     */
    const page = read(DEPENDENCY_PAGE)!

    expect(page).toMatch(/Requires zod/i)
    expect(page).toMatch(/Bundles zod/i)
  })

  it('claims no absence of dependencies anywhere', () => {
    /*
     * The original defect, guarded at the source rather than the sentence. Both prose files said
     * "no runtime dependencies". The save reader genuinely has none and says so about ITSELF,
     * which is a different and true claim — so this looks only for the package-wide form.
     */
    const offenders: string[] = []

    for (const relative of ['README.md', 'docs/DESKTOP_AND_MOBILE.md', DEPENDENCY_PAGE]) {
      const text = read(relative)
      if (!text) continue
      if (/(?:package|SDK)[^.]{0,60}no runtime dependencies/i.test(text)) offenders.push(relative)
    }

    expect(offenders, 'the package has a runtime dependency').toEqual([])
  })
})
