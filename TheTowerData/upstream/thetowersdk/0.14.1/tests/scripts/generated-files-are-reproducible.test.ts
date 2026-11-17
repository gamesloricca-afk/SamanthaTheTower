import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { isMonorepoCheckout } from '../../tooling/repo-root'
import { PACKAGE_ROOT, MONOREPO_ROOT } from '../helpers/paths'

/**
 * Running a generator twice must produce the same bytes.
 *
 * Three generated artifacts here stamped the wall clock into their output. Two of them are
 * committed, which forced a choice nobody should have to make about a derived file: commit a diff
 * that carries no information, or live with a permanently dirty tree. The third ships inside the
 * published package, so two releases cut on different days differed with nothing behind the
 * difference.
 *
 * The cost was not the noise. It was that a real change could not be distinguished from the churn —
 * and both files turned out to be carrying one. `docs/mechanics-map/generated/` had been emitted
 * from a run where the doctor never executed, so it reported no `doctorStatus` at all; the registry
 * was nine mechanic nodes and a coverage entry behind the graph it claims to index. Neither was
 * noticed, because every diff of those files already looked like a timestamp.
 *
 * `compartmentMaturity` had this right and said so in its own docblock — it refuses to default
 * `asOf` to the clock because "a metric that changes when nothing changed cannot be tested, diffed,
 * or trusted in a report". The emitter passed it `new Date()` anyway, under a comment claiming
 * reruns were byte-identical.
 */

const PACKAGE = PACKAGE_ROOT
const MONOREPO = MONOREPO_ROOT

/** Generators whose output is committed or published, with the command that rewrites it. */
const REPRODUCIBLE = [
  {
    what: 'the knowledge graph that ships in dist',
    file: path.join(PACKAGE, 'dist', 'knowledge', 'knowledge-graph.v1.json'),
    run: () => execFileSync('node', ['scripts/emit-knowledge-graph.mjs'], { cwd: PACKAGE, stdio: 'pipe' }),
  },
]

describe('a generator run twice produces the same bytes', () => {
  for (const { what, file, run } of REPRODUCIBLE) {
    it(what, () => {
      if (!existsSync(file)) {
        /* Built artifacts only exist after `build`; `verify` orders it that way. */
        expect.soft(existsSync(file), `${file} — run the build first`).toBe(true)
        return
      }

      const before = readFileSync(file, 'utf8')
      run()
      const after = readFileSync(file, 'utf8')

      expect(after, 'regenerating changed the file with no input change').toBe(before)
    }, 120_000)
  }

  it.skipIf(!isMonorepoCheckout())('builds the same mechanics registry twice', async () => {
    /*
     * Called directly rather than through its CLI. The first version of this case shelled out to
     * `npx tsx` from inside a vitest worker, which tore the worker's IPC channel down under load —
     * a flaky test dressed up as a determinism check. The function is what has to be deterministic;
     * the subprocess added nothing but a race.
     *
     * Monorepo only, and dynamically imported so that stays true. The registry builder reaches
     * `kernel/load`, which imports `@tmrxjd/governance-engine` — an in-development package that is
     * disabled here and absent from the published repository, where this failed to resolve. The
     * import has to stay inside the body: a static one runs before `skipIf` can apply, and takes
     * the whole file's collection down with it.
     */
    const { buildMechanicsRegistry } = await import('../../tooling/registry/build')

    const first = buildMechanicsRegistry({ repoRoot: MONOREPO })
    const second = buildMechanicsRegistry({ repoRoot: MONOREPO })

    expect(second.contentHash).toBe(first.contentHash)
    expect(JSON.stringify(second)).toBe(JSON.stringify(first))
  }, 120_000)

  it('names no wall clock in a generator that writes a committed or published file', () => {
    /*
     * The pattern rather than the instances, because the instances were three separate files that
     * each looked reasonable alone. A timestamp is fine in a live handle; what is not fine is
     * writing one into an artifact somebody else has to diff.
     */
    const offenders: string[] = []

    const emitters = [
      'scripts/emit-knowledge-graph.mjs',
      'tooling/registry/build.ts',
      'tooling/docs-gen/index.ts',
    ]

    for (const relative of emitters) {
      const text = readFileSync(path.join(PACKAGE, relative), 'utf8')
      /* Strip comments — these files discuss the trap at length, and that prose is the point. */
      const code = text
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')

      if (/new Date\(\)|Date\.now\(\)/.test(code)) offenders.push(relative)
    }

    expect(
      offenders,
      'this generator writes a file someone has to read a diff of; derive the stamp from content',
    ).toEqual([])
  })
})
