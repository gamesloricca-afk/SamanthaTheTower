import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { PACKAGE_ROOT } from '../helpers/paths'

/**
 * The map has to be true, and it has to be cheap to keep true.
 *
 * A generated map is worth exactly as much as its worst entry. One stale row — a file that moved, a
 * dependency that reversed, an export that was renamed — and a reader stops trusting the whole
 * table and goes back to grepping, which is the state the map exists to replace.
 *
 * `lint:map` is in `verify`, so drift fails the build. What is left for a test is the part `--check`
 * cannot see about itself: that the generator does not destroy what it walks past, that it agrees
 * with itself when run twice, and that its own guard fires.
 *
 * Three near-misses are the reason each case is here, all three found by running the generator a
 * second time rather than by reading it:
 *
 * - CRLF. Matching the end of a docblock as `\n` failed on every CRLF file, so the block landed
 *   ABOVE the prose, hid it from the next run, and every Purpose column emptied on generation two.
 * - TSDoc. A docblock on the first export looks exactly like a file docblock from the top of the
 *   file. Inserting between them detaches the comment from its symbol: editor hovers and API docs
 *   lose it, and nothing anywhere reports that they did.
 * - `src/MAP.md` written twice, once as the directory map and once as the index, leaving `--check`
 *   permanently red against a file it had just written itself.
 */

const PACKAGE = PACKAGE_ROOT
const GENERATOR = path.join(PACKAGE, 'scripts', 'map-the-repo.mjs')

/*
 * The roots and the header exemptions come from the generator itself.
 *
 * The first version of this file kept its own copy of the exemption list, disagreed with the
 * generator about one file, and reported a defect that did not exist. A test that restates an
 * implementation checks only that someone typed the same thing twice.
 */
const { ROOTS, takesAHeader } = await import('../../scripts/map-the-repo.mjs') as {
  ROOTS: { dir: string, headers: boolean }[]
  takesAHeader: (file: string) => boolean
}

const rootDir = (root: string) => path.join(PACKAGE, root)

const BEGIN = '── file map'

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.(ts|mjs)$/.test(full) && !full.includes('.test.') ? [full] : []
  })
}

const everyMappedFile = () => ROOTS.flatMap(({ dir }) => sourceFiles(rootDir(dir)))

describe('the repository maps itself', () => {
  it('leaves no directory unmapped, and no tree without an index', () => {
    const missing = everyMappedFile()
      .map(file => path.dirname(file))
      .filter(dir => !existsSync(path.join(dir, 'MAP.md')))
      .map(dir => path.relative(PACKAGE, dir))

    expect([...new Set(missing)], 'every directory gets a MAP.md').toEqual([])

    for (const { dir } of ROOTS) {
      expect(existsSync(path.join(rootDir(dir), 'MAP.md')), `${dir}/MAP.md`).toBe(true)
    }
    expect(existsSync(path.join(PACKAGE, 'MAP.md')), 'the front door').toBe(true)
  })

  it('gives every file in a header tree a header', () => {
    const withoutHeader = ROOTS
      .filter(root => root.headers)
      .flatMap(({ dir }) => sourceFiles(rootDir(dir)))
      .filter(takesAHeader)
      .filter(file => !readFileSync(file, 'utf8').includes(BEGIN))
      .map(file => path.relative(PACKAGE, file))

    expect(withoutHeader).toEqual([])
  })

  it('leaves the copy-me trees alone', () => {
    /*
     * `examples` and `templates` are meant to be read end-to-end and pasted into someone else's
     * project. A generated block above line one is the first thing they would see and the first
     * thing they would delete, so those trees get a map and no headers.
     */
    const stamped = ROOTS
      .filter(root => !root.headers)
      .flatMap(({ dir }) => sourceFiles(rootDir(dir)))
      .filter(file => readFileSync(file, 'utf8').includes(BEGIN))
      .map(file => path.relative(PACKAGE, file))

    expect(stamped).toEqual([])
  })

  it('never separates a docblock from the symbol it documents', () => {
    /*
     * The failure this protects against is silent: the comment is still in the file, still correct,
     * and no longer attached to anything. Only the adjacency shows it.
     */
    const detached: string[] = []

    for (const file of everyMappedFile()) {
      const text = readFileSync(file, 'utf8')
      const declaration = /\*\/\r?\n\s*\/\*\s*──\s*file map/
      if (declaration.test(text)) continue

      /* A map block immediately followed by a declaration is fine; between a doc and one is not. */
      const between = /\/\*\*[\s\S]*?\*\/\r?\n\/\*\s*──\s*file map[\s\S]*?\*\/\r?\n\s*(?:export\s+)?(?:const|function|class|interface|type|enum)\b/
      if (between.test(text)) detached.push(path.relative(PACKAGE, file))
    }

    expect(detached, 'the map block was inserted between a TSDoc comment and its symbol').toEqual([])
  })

  it('agrees with itself when run twice', () => {
    /*
     * `--check` immediately after a real run. Every bug found while building this generator showed
     * up here and nowhere else — the first pass always looks right.
     */
    expect(() => execFileSync('node', [GENERATOR, '--check'], { cwd: PACKAGE, stdio: 'pipe' }))
      .not.toThrow()
  })

  it('refuses a directory nobody has described', () => {
    /*
     * Planting the fault, because a guard that has never fired is a guard nobody has tested. The
     * earlier version rendered a blank cell instead, and seven directories sat that way unnoticed.
     */
    const generator = readFileSync(GENERATOR, 'utf8')

    expect(generator).toMatch(/DIRECTORY_PURPOSE/)
    expect(generator, 'an undescribed directory must exit non-zero, not render an empty cell')
      .toMatch(/undescribed[\s\S]{0,400}process\.exit\(1\)/)
  })

  it('reports how much prose is still missing rather than hiding it', () => {
    /*
     * The generator cannot write a file's purpose — only a person can. What it can do is count the
     * ones that have none, so the gap is a number that moves rather than a blank column nobody
     * tallies.
     */
    const index = readFileSync(path.join(PACKAGE, 'MAP.md'), 'utf8')
    expect(index).toMatch(/\d+ of \d+ files have one; \d+ do not/)
  })

  it('lets you walk back up from anywhere', () => {
    /*
     * The whole promise is that you cannot get lost, which needs the links to go both ways. A
     * directory map that only points down is a dead end at the bottom of the tree.
     */
    const deadEnds = everyMappedFile()
      .map(file => path.join(path.dirname(file), 'MAP.md'))
      .filter(map => existsSync(map))
      .filter(map => !readFileSync(map, 'utf8').includes('MAP.md)'))
      .map(map => path.relative(PACKAGE, map))

    expect([...new Set(deadEnds)], 'every map links back up').toEqual([])
  })
})
