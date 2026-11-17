import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { auditSourceBoundaries } from '../../scripts/check-source-boundaries.mjs'
import { PACKAGE_ROOT } from '../helpers/paths'

const scratch = process.env.SDK_TEST_TMPDIR ?? tmpdir()
const roots: string[] = []
function fixture() {
  mkdirSync(scratch, { recursive: true })
  const root = mkdtempSync(path.join(scratch, 'sdk-boundary-'))
  roots.push(root)
  return root
}
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })))

describe('source boundaries', () => {
  it('finds private tooling across source, fixtures, docs and site files without rewriting them', () => {
    const root = fixture()
    for (const file of ['code.ts', 'fixture.json', 'guide.md', 'page.svelte', 'graph.mjs']) {
      const content = 'private input: tower-extractor'
      writeFileSync(path.join(root, file), content)
    }
    const result = auditSourceBoundaries(root)
    expect(result.scanned).toBe(5)
    expect(result.problems).toHaveLength(5)
    expect(readFileSync(path.join(root, 'guide.md'), 'utf8')).toBe('private input: tower-extractor')
  })

  it('finds a private tooling filename even when the file is empty', () => {
    const root = fixture()
    writeFileSync(path.join(root, 'native-disasm.ts'), '')
    expect(auditSourceBoundaries(root).problems).toContain('native-disasm.ts: private tooling in path')
  })

  it('allows community sheet extraction, save decoding and algorithm constants', () => {
    const root = fixture()
    writeFileSync(path.join(root, 'public.ts'), 'Spreadsheet extraction; decode playerInfo.dat; 0x9E3779B9; linux-arm64')
    expect(auditSourceBoundaries(root)).toEqual({ scanned: 1, problems: [] })
  })

  it('audits coverage tooling while excluding the generated root coverage report', () => {
    const root = fixture()
    for (const dir of ['tooling/coverage', 'coverage']) {
      mkdirSync(path.join(root, dir), { recursive: true })
      writeFileSync(path.join(root, dir, 'input.ts'), 'private input: tower-extractor')
    }
    expect(auditSourceBoundaries(root)).toEqual({
      scanned: 1,
      problems: ['tooling/coverage/input.ts:1: private tooling reference'],
    })
  })

  it('rejects memory-layout and instruction metadata without blocking algorithm constants', () => {
    const root = fixture()
    writeFileSync(path.join(root, 'layout.ts'), 'const FIELD_OFFSETS = { health: 472 }; // ldr d1, [x19]')
    writeFileSync(path.join(root, 'input.ts'), 'workshopGlobal0x33C: number')
    expect(auditSourceBoundaries(root).problems).toHaveLength(2)
  })

  it('the current public source has no boundary violations', () => {
    const result = auditSourceBoundaries(PACKAGE_ROOT)
    expect(result.scanned).toBeGreaterThan(1000)
    expect(result.problems).toEqual([])
  })
})
