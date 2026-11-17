import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { decodePlayerInfoSaveBytes } from '../../src/node/decode-save'
import { SRC } from '../helpers/paths'

/**
 * Every save key the game's format documents is one this package reads.
 *
 * The format files name the headers and fields the game writes per domain. A
 * key documented there and absent from this package is a value nobody
 * extracts — which does not fail, it just quietly never appears.
 *
 * This is a coverage floor, not a correctness check: it proves the key is
 * known, not that the value is interpreted correctly. `save-format-enums.test.ts`
 * covers the index → name half.
 */

const FIXTURES = join(__dirname, '..', '..', 'fixtures', 'data', 'save-format')
const SOURCE_ROOT = SRC

/** `*Headers` maps a label to a save key; `fields` is keyed by save key. */
function documentedKeys(file: string): string[] {
  const json = JSON.parse(readFileSync(join(FIXTURES, file), 'utf8')) as Record<string, unknown>
  const keys = new Set<string>()

  for (const [group, value] of Object.entries(json)) {
    if (!value || typeof value !== 'object') continue
    if (group.endsWith('Headers')) {
      for (const entry of Object.values(value as Record<string, unknown>)) {
        if (typeof entry === 'string') keys.add(entry)
      }
    }
    if (group === 'fields') {
      for (const key of Object.keys(value as Record<string, unknown>)) keys.add(key)
    }
  }
  return [...keys].sort()
}

/** Every non-test source file, concatenated once. */
function readSource(dir: string, chunks: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'fixtures' && entry.name !== 'node_modules') readSource(full, chunks)
      continue
    }
    if (/\.(ts|mjs|json)$/.test(entry.name) && !entry.name.includes('.test.')) {
      chunks.push(readFileSync(full, 'utf8'))
    }
  }
  return chunks
}

const source = readSource(SOURCE_ROOT).join('\n')
const formatFiles = readdirSync(FIXTURES).filter(name => name.endsWith('.json'))

describe('save-format coverage', () => {
  it('has format files to check', () => {
    expect(formatFiles.length).toBeGreaterThan(8)
  })

  it.each(formatFiles)('%s — every documented key is known to the SDK', file => {
    const keys = documentedKeys(file)
    expect(keys.length, `${file} documents no keys — the parser probably missed them`)
      .toBeGreaterThan(0)

    const unknown = keys.filter(key => !source.includes(key))
    expect(unknown, 'documented save keys nothing in this package mentions').toEqual([])
  })
})

const savePath = process.env.TOWER_TEST_SAVE
const describeSave = savePath && existsSync(savePath) ? describe : describe.skip

describeSave('against a real save', () => {
  it('every documented key is actually present in the file', () => {
    /*
     * The other direction: the format could document a key the game no longer
     * writes. That would mean this package reads for something that never
     * arrives, which reads as an empty target rather than an error.
     */
    const { parsedRoot } = decodePlayerInfoSaveBytes(readFileSync(savePath as string))
    const present = new Set(Object.keys(parsedRoot))

    const missing = formatFiles
      .flatMap(file => documentedKeys(file).map(key => ({ file, key })))
      .filter(({ key }) => !present.has(key))
      .map(({ file, key }) => `${file}: ${key}`)

    expect(missing).toEqual([])
  })
})
