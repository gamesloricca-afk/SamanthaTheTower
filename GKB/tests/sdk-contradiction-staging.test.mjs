import assert from 'node:assert/strict';
import { stageKnowledgeGraphContradictions } from '../adapter/sdk-contradiction-staging.mjs';

const registry = {
  registryVersion: '1.0.0',
  gameVersion: null,
  sdk: { package: 'thetowersdk', version: '0.14.1' },
  sources: [{ id: 'sdk-knowledge-graph' }]
};
const graph = {
  schemaVersion: 1,
  graphVersion: 3,
  generatedFor: '2026-10-15',
  nodes: [],
  edges: [],
  contradictions: [
    { subject: 'subject.a', predicate: 'sameMechanic', note: 'raw graph contradiction' },
    { subject: 'subject.b', predicate: 'anotherMechanic' }
  ]
};
const sdkContradictions = [
  {
    subject: 'subject.a',
    predicate: 'sameMechanic',
    likelyValue: 'valueA',
    crossSource: true,
    claims: [
      { value: 'valueA', authorityRank: 1, provenance: { origin: 'wiki', ref: 'https://example.invalid/a' } },
      { value: 'valueB', authorityRank: 2, provenance: { origin: 'code', ref: 'sdk://claim/b' } }
    ],
    extraAnalysisField: { keep: true }
  },
  {
    subject: 'subject.b',
    predicate: 'anotherMechanic',
    claims: [{ value: 'unknown', provenance: {} }]
  }
];

const result = stageKnowledgeGraphContradictions(graph, sdkContradictions, {
  sdkVersion: '0.14.1',
  registry,
  retrievedAt: '2026-11-27'
});

assert.equal(result.report.status, 'PASSED');
assert.equal(result.report.sdkContradictionCount, 2);
assert.equal(result.report.graphContradictionRecordCount, 2);
assert.equal(result.report.stagedRecordCount, 2);
assert.equal(result.report.sourceClaimCount, 3);
assert.deepEqual(result.report.originCounts, { wiki: 1, code: 1 });
assert.equal(result.report.likelyValuePreserved, true);
assert.equal(result.report.likelyValueUsedAsWinner, false);
assert.equal(result.report.authorityRankPreservedOnly, true);
assert.equal(result.report.conflictResolved, false);
assert.equal(result.report.canonicalConflictCreated, false);
assert.equal(result.report.gkbImportPerformed, false);

const first = result.records[0];
assert.equal(first.sourceLikelyValue, 'valueA');
assert.equal(first.sourceCrossSource, true);
assert.equal(first.sourceClaimCount, 2);
assert.equal(first.likelyValueTreatment, 'SDK_HINT_ONLY_NOT_FACTUAL_WINNER');
assert.equal(first.conflictStatus, 'UNRESOLVED');
assert.equal(first.verificationStatus, 'EXTERNAL-UNVERIFIED');
assert.equal(first.provenance.originMappingStatus, 'UNMAPPED_REQUIRES_REVIEW');
assert.deepEqual(first.sourceRecord.graphRecord, graph.contradictions[0]);
assert.deepEqual(first.sourceRecord.sdkAnalysis, sdkContradictions[0]);
assert.equal(first.sourceRecord.sdkAnalysis.extraAnalysisField.keep, true);
assert.equal(first.sourceClaims[0].authorityRank, 1);
assert.equal(first.sourceClaims[1].authorityRank, 2);

const second = result.records[1];
assert.equal(second.sourceLikelyValue, null);
assert.equal(second.sourceClaimCount, 1);
assert.equal(second.provenance.originMappingStatus, 'INVALID_OR_MISSING');
assert.equal(second.conflictStatus, 'UNRESOLVED');

assert.throws(() => stageKnowledgeGraphContradictions(graph, sdkContradictions, {
  sdkVersion: '0.14.1',
  registry,
  retrievedAt: '2026-02-30'
}), /valid YYYY-MM-DD/);
assert.throws(() => stageKnowledgeGraphContradictions(graph, sdkContradictions, {
  sdkVersion: '0.14.2',
  registry,
  retrievedAt: '2026-11-27'
}), /identity\/version mismatch/);
assert.throws(() => stageKnowledgeGraphContradictions(graph, null, {
  sdkVersion: '0.14.1',
  registry,
  retrievedAt: '2026-11-27'
}), /must be an array/);

console.log(JSON.stringify({
  test: 'Samantha GKB SDK Contradiction Staging Adapter',
  status: 'PASSED',
  cases: 22,
  sourceClaimsPreserved: true,
  likelyValueNotAdopted: true,
  authorityRankNotUsedToSelectWinner: true,
  conflictingSourcesRemainSeparate: true,
  canonicalConflictResolution: false,
  bulkImport: false
}, null, 2));
