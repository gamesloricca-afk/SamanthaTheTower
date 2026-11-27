import assert from 'node:assert/strict';
import { stageKnowledgeGraphEdges } from '../adapter/sdk-edge-staging.mjs';

const registry = {
  registryVersion: '1.0.0',
  gameVersion: null,
  sdk: { package: 'thetowersdk', version: '0.14.1' },
  sources: [{ id: 'sdk-knowledge-graph' }]
};
const kinds = [
  ['gates', 'GATES'],
  ['scales', 'SCALES'],
  ['caps', 'CAPS'],
  ['independentOf', 'INDEPENDENT_OF'],
  ['separatePurchaseFrom', 'SEPARATE_PURCHASE_FROM'],
  ['derivedFrom', 'DERIVED_FROM'],
  ['memberOf', 'MEMBER_OF'],
  ['appliedBefore', 'APPLIED_BEFORE']
];
const graph = {
  schemaVersion: 1,
  graphVersion: 3,
  generatedFor: '2026-10-15',
  nodes: [{ id: 'node.a' }, { id: 'node.b' }],
  edges: [
    ...kinds.map(([kind]) => ({
      from: 'node.a',
      to: 'node.b',
      kind,
      claimType: 'objective',
      compartment: 'test',
      note: `SDK note for ${kind}`,
      sources: [{ origin: 'code', ref: `sdk://${kind}` }],
      unknownField: { keep: kind }
    })),
    {
      from: 'missing.node',
      to: 'node.b',
      kind: 'futureKind',
      sources: []
    }
  ]
};
const result = stageKnowledgeGraphEdges(graph, {
  sdkVersion: '0.14.1',
  registry,
  retrievedAt: '2026-11-27'
});

assert.equal(result.report.status, 'PASSED');
assert.equal(result.report.inputNodeCount, 2);
assert.equal(result.report.inputEdgeCount, 9);
assert.equal(result.report.stagedRecordCount, 9);
assert.equal(result.report.unresolvedEndpointCount, 1);
assert.equal(result.report.unknownKindCount, 1);
assert.equal(result.report.automaticSemanticInference, false);
assert.equal(result.report.relationshipVerificationMapped, false);
assert.equal(result.report.canonicalRelationshipsCreated, false);
assert.equal(result.report.promotionPerformed, false);
assert.equal(result.report.gkbImportPerformed, false);

for (let i = 0; i < kinds.length; i++) {
  const record = result.records[i];
  assert.equal(record.sourceKind, kinds[i][0]);
  assert.equal(record.relationshipCandidate, kinds[i][1]);
  assert.equal(record.relationshipMappingStatus, 'MAPPED_SYNTAX_ONLY');
  assert.equal(record.endpointMappingStatus, 'LINKED');
  assert.equal(record.sourceNodeFromStagingId, 'sdk-graph-node-000001');
  assert.equal(record.sourceNodeToStagingId, 'sdk-graph-node-000002');
  assert.equal(record.verificationStatus, 'EXTERNAL-UNVERIFIED');
  assert.deepEqual(record.sourceRecord, graph.edges[i]);
  assert.equal(record.sourceRecord.unknownField.keep, kinds[i][0]);
}
const unknown = result.records[8];
assert.equal(unknown.relationshipCandidate, null);
assert.equal(unknown.relationshipMappingStatus, 'UNMAPPED_UNKNOWN_KIND');
assert.equal(unknown.endpointMappingStatus, 'UNRESOLVED_ENDPOINT');
assert.equal(unknown.sourceNodeFromStagingId, null);
assert.equal(unknown.sourceNodeToStagingId, 'sdk-graph-node-000002');
assert.equal(unknown.provenance.originMappingStatus, 'INVALID_OR_MISSING');
assert.deepEqual(unknown.sourceRecord, graph.edges[8]);

assert.throws(() => stageKnowledgeGraphEdges(graph, {
  sdkVersion: '0.14.1',
  registry,
  retrievedAt: '2026-02-30'
}), /valid YYYY-MM-DD/);
assert.throws(() => stageKnowledgeGraphEdges(graph, {
  sdkVersion: '0.14.2',
  registry,
  retrievedAt: '2026-11-27'
}), /identity\/version mismatch/);
assert.throws(() => stageKnowledgeGraphEdges({
  ...graph,
  nodes: [{ id: 'duplicate' }, { id: 'duplicate' }]
}, {
  sdkVersion: '0.14.1',
  registry,
  retrievedAt: '2026-11-27'
}), /Duplicate SDK node id/);

console.log(JSON.stringify({
  test: 'Samantha GKB SDK Edge Staging Adapter',
  status: 'PASSED',
  cases: 24,
  relationshipKindsMapped: kinds.length,
  unknownKindsPreserved: true,
  endpointLinking: true,
  rawEdgePreserved: true,
  verificationRemainsExternalUnverified: true,
  canonicalRelationshipPromotion: false,
  bulkImport: false
}, null, 2));
