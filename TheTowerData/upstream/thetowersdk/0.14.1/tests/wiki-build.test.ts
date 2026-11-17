import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/**
 * The GitHub wiki is generated, and a generated wiki that quietly produces the wrong thing
 * is worse than none — nobody reviews it. The first run produced a wiki with zero README
 * pages because these files are CRLF and JavaScript's `.` does not match `\r`, and it
 * reported success.
 */
describe('the wiki generator', () => {
  const outDir = mkdtempSync(path.join(tmpdir(), 'wiki-'))
  execFileSync(process.execPath, ['scripts/build-wiki.mjs', '--out', outDir], { cwd: PACKAGE_ROOT })
  const pages = readdirSync(outDir).filter(name => name.endsWith('.md'))
  const read = (name: string) => readFileSync(path.join(outDir, `${name}.md`), 'utf8')

  it('gives every README section its own page', () => {
    /*
     * CRLF broke the split into zero sections while the script still exited 0 and wrote a
     * plausible-looking 21 pages. A count comparison passes that (21 > 19); naming the
     * pages does not.
     */
    const titles = readFileSync(path.join(PACKAGE_ROOT, 'README.md'), 'utf8')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter(line => /^## (?!#)/.test(line))
      .map(line => line.replace(/^## /, '').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-'))

    expect(titles.length).toBeGreaterThan(10)
    const missing = titles.filter(title => !pages.includes(`${title}.md`))
    expect(missing, `README sections with no wiki page:\n  ${missing.join('\n  ')}`).toEqual([])
  })

  it('emits the navigation GitHub expects', () => {
    for (const required of ['Home', '_Sidebar', '_Footer']) {
      expect(pages, required).toContain(`${required}.md`)
    }
  })

  it('puts one H1 on Home, not two', () => {
    expect(read('Home').split('\n').filter(line => line.startsWith('# ')).length).toBe(1)
  })

  it('marks every page as generated', () => {
    const unmarked = pages.filter(name => !readFileSync(path.join(outDir, name), 'utf8').includes('Generated from'))
    // Only the sidebar is exempt: it is a nav rail, and the footer already repeats the
    // notice on every page it renders under.
    expect(unmarked.sort()).toEqual(['_Sidebar.md'])
  })

  it('rewrites README anchors to the pages they became', () => {
    const home = read('Home')
    expect(home).toContain('](Credits)')
    expect(home).not.toContain('](#credits)')
  })

  it('turns repo-relative links into absolute blob URLs', () => {
    const all = pages.map(name => readFileSync(path.join(outDir, name), 'utf8')).join('\n')
    expect(all).toContain('https://github.com/TmRxJD/TheTowerSDK/blob/main/src/')
  })

  it('carries the Effective Paths credit and the support code', () => {
    const credits = read('Credits')
    for (const name of ['Mattew', 'QuietFanta', 'Bisse', 'SHEETLORD']) {
      expect(credits, name).toContain(name)
    }
    expect(credits).not.toMatch(/matthew/i)
  })

  it('embeds every example and template with its source', () => {
    const exampleCount = readdirSync(path.join(PACKAGE_ROOT, 'examples')).filter(f => f.endsWith('.ts')).length
    const templateCount = readdirSync(path.join(PACKAGE_ROOT, 'templates')).filter(f => f.endsWith('.ts')).length
    expect(pages.filter(name => name.startsWith('Example-')).length).toBe(exampleCount)
    expect(pages.filter(name => name.startsWith('Template-')).length).toBe(templateCount)
    // Source inline, not just a link out.
    expect(read('Template-calculator')).toContain('export function computeAffordability')
  })
})
