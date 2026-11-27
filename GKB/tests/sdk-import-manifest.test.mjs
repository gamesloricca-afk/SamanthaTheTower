import assert from 'node:assert/strict';
import { buildSdkImportManifest, compareSdkImportManifests } from '../adapter/sdk-import-manifest.mjs';

const packageJson = { name: 'thetowersdk', version: '0.14.1', license: 'MIT', engines: { node: '>=20' } };
const graph = {
  schemaVersion: 1, graphVersion: 3, generatedFor: '2026-10-15',
  nodes: [{ id: 'a', assertions: [{ provenance: { origin: 'code' } }, { provenance: { origin: 'game' } }] }],
  edges: [{ from: 'a', to: 'b' }]
};
const schema = { type: 'object' };
const graphBytes = Buffer.from(JSON.stringify(graph));
const schemaBytes = Buffer.from(JSON.stringify(schema));
const manifest = buildSdkImportManifest({ packageJson, graph, graphBytes, schema, schemaBytes, retrievedAt: '2026-11-27' });

assert.equal(manifest.sdk.version, '0.14.1');
assert.equal(manifest.graph.nodeCount, 1);
assert.equal(manifest.graph.edgeCount, 1);
assert.equal(manifest.graph.assertionCount, 2);
assert.deepEqual(manifest.graph.originCounts, { code: 1, game: 1 });
assert.equal(manifest.artifacts.knowledgeGraph.sha256.length, 64);
assert.equal(compareSdkImportManifests(null, manifest).status, 'BASELINE_NOT_FOUND');
assert.equal(compareSdkImportManifests(manifest, structuredClone(manifest)).status, 'NO_DRIFT');

const changed = structuredClone(manifest);
changed.graph.assertionCount = 3;
changed.graph.originCounts.game = 2;
const drift = compareSdkImportManifests(manifest, changed);
assert.equal(drift.status, 'DRIFT_DETECTED');
assert.deepEqual(drift.changes.map(item => item.field), ['graph.assertionCount', 'graph.originCounts.game']);

assert.throws(() => buildSdkImportManifest({ packageJson, graph: {}, graphBytes, schema, schemaBytes, retrievedAt: '2026-11-27' }), /Unsupported SDK graph shape/);\nassert.throws(() => buildSdkImportManifest({ packageJson, graph, graphBytes, schema, schemaBytes, retrievedAt: '2026-02-30' }), /valid YYYY-MM-DD calendar date/);\nconst checksumChanged = structuredClone(manifest);\nchecksumChanged.artifacts.knowledgeGraph.sha256 = 'f'.repeat(64);\nassert.equal(compareSdkImportManifests(manifest, checksumChanged).changes[0].field, 'artifacts.knowledgeGraph.sha256');
console.log(JSON.stringify({ test: 'SDK import manifest and drift detector', status: 'PASSED', cases: 13, baselineMutation: false }, null, 2));
