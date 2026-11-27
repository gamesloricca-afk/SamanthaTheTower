/**
 * Samantha GKB — TheTowerSDK public entry-point smoke test
 * Target: thetowersdk@0.14.1
 *
 * Resolves documented package subpaths and checks representative exports.
 * This is an API-surface test, not a mechanics correctness test.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(ROOT, 'runtime/node_modules/thetowersdk/package.json'), 'utf8'));
const require = createRequire(path.join(ROOT, 'runtime/package.json'));
const EXPECTED_VERSION = '0.14.1';
const nodeMajor = Number(process.versions.node.split('.')[0]);

assert.equal(manifest.version, EXPECTED_VERSION, 'pinned SDK version');
assert.ok(nodeMajor >= 20, `Node.js >=20 required; received ${process.versions.node}`);

const modules = [
  { name: 'knowledge', path: 'thetowersdk/knowledge', required: ['knowledgeFor', 'resolve', 'trapsFor'] },
  { name: 'data', path: 'thetowersdk/data', required: ['LAB_CATALOG', 'MODULE_TEMPLATES', 'uwStoneChartData'] },
  { name: 'mechanics', path: 'thetowersdk/mechanics', required: ['computeWaveBaseHealth'] },
  { name: 'wiki', path: 'thetowersdk/wiki', required: ['fetchWikiPageAsMarkdown', 'searchWiki', 'WIKI_SOURCES'] },
  { name: 'contributions', path: 'thetowersdk/contributions', required: ['CONTRIBUTIONS', 'ATTRIBUTION_LINES'] },
  { name: 'save', path: 'thetowersdk/save', required: ['readLabsFromSaveRoot', 'listImportableBattleRuns'] },
  { name: 'node', path: 'thetowersdk/node', required: ['decodePlayerInfoSaveBytesAsync'] },
  { name: 'charts', path: 'thetowersdk/charts', required: ['SHARED_CHART_REGISTRY', 'resolveCanonicalToolDataset'] }
];

const results = [];
for (const item of modules) {
  const resolvedPath = require.resolve(item.path);
  const namespace = await import(pathToFileURL(resolvedPath).href);
  const exports = Object.keys(namespace).sort();
  const missing = item.required.filter(name => !(name in namespace));
  assert.equal(missing.length, 0, `${item.name} missing documented exports: ${missing.join(', ')}`);
  results.push({
    module: item.name,
    importPath: item.path,
    status: 'PASSED',
    exportCount: exports.length,
    requiredExports: item.required,
    exports
  });
}

console.log(JSON.stringify({
  test: 'Samantha GKB TheTowerSDK Public Entry-Point Smoke Test',
  status: 'PASSED',
  sdk: { package: manifest.name, expectedVersion: EXPECTED_VERSION, actualVersion: manifest.version },
  runtime: { node: process.versions.node, minimumMajor: 20, status: 'COMPATIBLE' },
  moduleCount: results.length,
  modules: results,
  limitations: [
    'Successful import verifies package public subpath resolution and selected named exports only.',
    'It does not verify the factual correctness of catalog values or formulas.',
    'It does not establish compatibility with every possible export.',
    'No save file was read and no wiki network request was made.'
  ]
}, null, 2));
