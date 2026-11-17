import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Where things are, resolved once.
 *
 * Tests used to compute this themselves, each with its own chain of `'..'` counted from wherever
 * the file happened to sit — `path.resolve(__dirname, '..')` meaning the package root in one
 * folder and the source root in another. That arithmetic is invisible until a file moves, and when
 * the whole suite moved into `tests/` it broke in twenty-seven places at once, all of them the
 * same mistake in different quantities.
 *
 * Naming the roots once means a future move edits this file and nothing else.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url))

/** `packages/sdk` — the package being tested. */
export const PACKAGE_ROOT = path.resolve(HERE, '..', '..')

export const SRC = path.join(PACKAGE_ROOT, 'src')
export const TESTS = path.join(PACKAGE_ROOT, 'tests')
export const SCRIPTS = path.join(PACKAGE_ROOT, 'scripts')
export const MCP = path.join(PACKAGE_ROOT, 'mcp')
export const SITE = path.join(PACKAGE_ROOT, 'site')
export const DOCS = path.join(PACKAGE_ROOT, 'docs')
export const FIXTURES = path.join(PACKAGE_ROOT, 'fixtures')
export const DIST = path.join(PACKAGE_ROOT, 'dist')

/**
 * The development monorepo, which is not there when this package stands alone.
 *
 * Callers must check rather than assume — `isMonorepoCheckout()` is the predicate for that. This
 * only says where it would be.
 */
export const MONOREPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..')
