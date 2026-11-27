/**
 * Samantha GKB — SDK staging integrity report
 * Cross-checks node, assertion, edge, and contradiction staging without canonical import.
 */
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stageKnowledgeGraph } from './sdk-claim-staging.mjs';
import { stageKnowledgeGraphAssertions } from './sdk-assertion-staging.mjs';
import { stageKnowledgeGraphEdges } from './sdk-edge-staging.mjs';
import { stageKnowledgeGraphContradictions } from './sdk-contradiction-staging.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GKB_ROOT = path.resolve(HERE, '..');
const require = createRequire(path.join(GKB_ROOT, 'runtime/package.json'));
const EXPECTED_VERSION = '0.14.1';
const registry = JSON.parse(await readFile(path.join(GKB_ROOT, 'sources/origin-registry.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(GKB_ROOT, 'runtime/node_modules/thetowersdk/package.json'), 'utf8'));
assert.equal(manifest.version, EXPECTED_VERSION);
const graph = require('thetowersdk/knowledge-graph.json');
const knowledge = await import(pathToFileURL(require.resolve('thetowersdk/knowledge')).href);
const sdkContradictions = knowledge.findContradictions();
const retrievedAt = new Date().toISOString().slice(0, 10);
const options = { sdkVersion: manifest.version, registry, retrievedAt };

const nodeStage = stageKnowledgeGraph(graph, options);
const assertionStage = stageKnowledgeGraphAssertions(graph, options);
const edgeStage = stageKnowledgeGraphEdges(graph, options);
const contradictionStage = stageKnowledgeGraphContradictions(graph, sdkContradictions, options);

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const countOrigins = root => {
  const counts = {};
  const walk = value => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!isObject(value)) return;
    for (const [key, child] of Object.entries(value)) {
      if (key === 'origin') {
        const origin = String(child);
        counts[origin] = (counts[origin] ?? 0) + 1;
      }
      walk(child);
    }
  };
  walk(root);
  return counts;
};
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);

assert.equal(nodeStage.records.length, graph.nodes.length, 'one node envelope per graph node');
assert.equal(assertionStage.records.length, graph.nodes.reduce((n,node)=>n+(Array.isArray(node.assertions)?node.assertions.length:0),0), 'one assertion envelope per assertion');
assert.equal(edgeStage.records.length, graph.edges.length, 'one edge envelope per graph edge');
assert.equal(contradictionStage.records.length, sdkContradictions.length, 'one contradiction envelope per SDK contradiction');

for (let i=0;i<graph.nodes.length;i++) {
  assert.ok(same(nodeStage.records[i].sourceRecord, graph.nodes[i]), `node sourceRecord ${i}`);
}
const nodeStageIdBySourceId = new Map(nodeStage.records.map(record => [record.sourceRecord.id, record.stagingId]));
let assertionIndex = 0;
for (const node of graph.nodes) {
  for (let i=0;i<(node.assertions?.length ?? 0);i++) {
    const record = assertionStage.records[assertionIndex++];
    assert.ok(same(record.sourceRecord, node.assertions[i]), `assertion sourceRecord ${node.id}[${i}]`);
    assert.equal(record.sourceNodeId, node.id);
    assert.equal(record.sourceNodeStagingId, nodeStageIdBySourceId.get(node.id));
  }
}
for (let i=0;i<graph.edges.length;i++) {
  const record = edgeStage.records[i];
  assert.ok(same(record.sourceRecord, graph.edges[i]), `edge sourceRecord ${i}`);
  assert.equal(record.sourceNodeFromStagingId, nodeStageIdBySourceId.get(graph.edges[i].from));
  assert.equal(record.sourceNodeToStagingId, nodeStageIdBySourceId.get(graph.edges[i].to));
}
for (let i=0;i<sdkContradictions.length;i++) {
  const record = contradictionStage.records[i];
  assert.ok(same(record.sourceRecord.graphRecord, graph.contradictions[i] ?? null), `raw contradiction sourceRecord ${i}`);
  assert.ok(same(record.sourceRecord.sdkAnalysis, sdkContradictions[i]), `SDK contradiction analysis ${i}`);
}

const expectedOriginCounts = countOrigins(graph);
const stagedSourceOrigins = countOrigins({
  nodes: nodeStage.records.map(record => record.sourceRecord),
  edges: edgeStage.records.map(record => record.sourceRecord),
  contradictions: contradictionStage.records.map(record => record.sourceRecord.graphRecord)
});
assert.ok(same(expectedOriginCounts, stagedSourceOrigins), 'all raw origin occurrences preserved across staging source records');

const report = {
  test: 'Samantha GKB SDK Staging Integrity Report',
  status: 'PASSED',
  sdkVersion: manifest.version,
  registryVersion: registry.registryVersion,
  retrievedAt,
  sourceCounts: {
    nodes: graph.nodes.length,
    assertions: assertionStage.records.length,
    edges: graph.edges.length,
    contradictions: sdkContradictions.length
  },
  stagingCounts: {
    nodeEnvelopes: nodeStage.records.length,
    assertionEnvelopes: assertionStage.records.length,
    edgeEnvelopes: edgeStage.records.length,
    contradictionEnvelopes: contradictionStage.records.length,
    total: nodeStage.records.length + assertionStage.records.length + edgeStage.records.length + contradictionStage.records.length
  },
  assertionVerification: {
    counts: assertionStage.report.sourceVerificationCounts,
    missing: assertionStage.report.missingAssertionVerificationCount
  },
  relationshipCandidates: edgeStage.report.relationshipCandidateCounts,
  contradictionSourceClaims: contradictionStage.report.sourceClaimCount,
  originCounts: expectedOriginCounts,
  sourceRecordPreservation: {
    nodes: true,
    assertions: true,
    edges: true,
    graphContradictions: true,
    sdkContradictionAnalysis: true,
    allRawOriginsPreserved: true
  },
  links: {
    assertionToNode: true,
    edgeEndpointsToNodes: true
  },
  policy: {
    canonicalClaimsCreated: false,
    canonicalRelationshipsCreated: false,
    canonicalConflictsCreated: false,
    verificationPromoted: false,
    sdkLikelyValueUsedAsWinner: false,
    originSemanticsAutomaticallyMapped: false,
    bulkImportPerformed: false
  },
  limitations: [
    'This report validates staging structure and source preservation only.',
    'It does not assess whether any game mechanic or community statement is true.',
    'SDK source labels remain unverified until Samantha review.',
    'The known SDK JSON Schema origin mismatch remains unresolved.'
  ]
};

const outputPath = path.join(GKB_ROOT, 'reports/sdk-staging-integrity-report.json');
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(report, null, 2));
