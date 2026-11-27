import assert from 'node:assert/strict';
import { stageKnowledgeGraph } from '../adapter/sdk-claim-staging.mjs';

const registry = {
  registryVersion: '1.0.0',
  gameVersion: null,
  sdk: { package: 'thetowersdk', version: '0.14.1' },
  sources: [{ id: 'sdk-knowledge-graph', values: ['game', 'wiki'] }]
};
const graph = {
  nodes: [
    { id: 'node.one', provenance: { source: { origin: 'game' } }, title: 'Example', description: 'Raw description', extra: { keep: true } },
    { id: 'node.two', sources: [{ origin: 'wiki' }], name: 'Another', payload: [1, 2] },
    { id: 'node.three', meta: { origin: 17 }, unknownField: 'preserve-me' },
    { id: 'node.four', noOrigin: true },
    { id: 'node.five', title: 'Summary example', summary: 'Candidate text from SDK summary' }
  ]
};

const result = stageKnowledgeGraph(graph, { sdkVersion: '0.14.1', registry });
assert.equal(result.report.status, 'PASSED');
assert.equal(result.report.inputNodeCount, 5);
assert.equal(result.report.stagedRecordCount, 5);
assert.equal(result.report.pendingReviewCount, 5);
assert.equal(result.report.classifiedCount, 0);
assert.equal(result.report.rawOriginPreservedCount, 3);
assert.equal(result.report.rawOriginOccurrenceCount, 3);
assert.equal(result.records[0].provenance.rawOrigins[0].value, 'game');
assert.equal(result.records[1].provenance.rawOrigins[0].value, 'wiki');
assert.equal(result.records[2].provenance.rawOrigins[0].value, 17);
assert.equal(result.records[2].provenance.originMappingStatus, 'INVALID_OR_MISSING');
assert.equal(result.records[3].provenance.rawOrigins.length, 0);
assert.deepEqual(result.records[0].sourceRecord, graph.nodes[0]);
assert.deepEqual(result.records[4].sourceRecord, graph.nodes[4]);
assert.equal(result.records[4].claim, graph.nodes[4].summary);
assert.equal(result.records[4].verificationStatus, 'EXTERNAL-UNVERIFIED');
assert.equal(result.records[4].reviewStatus, 'PENDING_REVIEW');
assert.equal(result.records[4].classification, null);
assert.equal(result.records[0].claim, graph.nodes[0].description);
assert.equal(result.report.automaticMapping, false);
assert.equal(result.report.promotionPerformed, false);
assert.equal(result.report.gkbImportPerformed, false);

assert.throws(() => stageKnowledgeGraph({ items: [] }, { sdkVersion: '0.14.1', registry }), /graph.nodes/);
assert.throws(() => stageKnowledgeGraph(graph, { sdkVersion: '0.14.2', registry }), /version mismatch/);
console.log(JSON.stringify({
  test: 'Samantha GKB SDK Claim Staging Adapter',
  status: 'PASSED',
  cases: 15,
  summaryFallback: true,
  sourceRecordPreserved: true,
  classificationDeferred: true,
  verificationRemainsExternalUnverified: true,
  automaticMapping: false,
  promotion: false,
  gkbImport: false
}, null, 2));
