import assert from 'node:assert/strict';
import { stageKnowledgeGraphAssertions } from '../adapter/sdk-assertion-staging.mjs';

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
  nodes: [
    {
      id: 'node.one',
      claimType: 'objective',
      verification: 'verified_here',
      assertions: [
        {
          subject: 'enemy.fleet',
          predicate: 'countsTowardPopulationCap',
          value: false,
          provenance: {
            origin: 'game',
            ref: 'sdk://assertion/1',
            readAgainstVersion: 'v28.3.0',
            verifiedAt: '2026-10-15'
          },
          extraAssertionField: { preserve: true }
        },
        {
          subject: 'enemy.elite',
          predicate: 'stunImmune',
          value: true,
          verification: 'unverified',
          provenance: {
            origin: 'wiki',
            ref: 'https://example.invalid/wiki',
            readAgainstVersion: 'v28.3.0',
            verifiedAt: '2026-10-15'
          }
        }
      ]
    },
    {
      id: 'node.two',
      claimType: 'sentiment',
      verification: 'unverified',
      assertions: [
        {
          subject: 'module.example',
          predicate: 'preferredForTournament',
          value: 'situational',
          verification: 'contradicted',
          provenance: {
            origin: 'wiki',
            ref: 'https://example.invalid/guide',
            verifiedAt: '2026-10-16'
          }
        }
      ]
    },
    {
      id: 'node.three',
      assertions: [
        {
          subject: 'unknown.subject',
          predicate: 'unknownPredicate',
          value: { raw: ['keep', 1] },
          provenance: { ref: 'sdk://assertion/4' }
        }
      ]
    }
  ]
};

const result = stageKnowledgeGraphAssertions(graph, {
  sdkVersion: '0.14.1',
  registry,
  retrievedAt: '2026-11-27'
});

assert.equal(result.report.status, 'PASSED');
assert.equal(result.report.inputNodeCount, 3);
assert.equal(result.report.inputAssertionCount, 4);
assert.equal(result.report.stagedRecordCount, 4);
assert.equal(result.report.missingAssertionVerificationCount, 2);
assert.deepEqual(result.report.sourceVerificationCounts, {
  unverified: 1,
  contradicted: 1
});
assert.deepEqual(result.report.classificationCandidateCounts, {
  OBJECTIVE: 2,
  SENTIMENT: 1,
  UNMAPPED: 1
});
assert.deepEqual(result.report.originCounts, { game: 1, wiki: 2 });
assert.equal(result.report.invalidOriginRecordCount, 1);
assert.equal(result.report.unresolvedOriginRecordCount, 1);

const missing = result.records[0];
assert.equal(missing.sourceNodeStagingId, 'sdk-graph-node-000001');
assert.equal(missing.sourceNodeId, 'node.one');
assert.equal(missing.sourceAssertionIndex, 0);
assert.equal(missing.subject, 'enemy.fleet');
assert.equal(missing.predicate, 'countsTowardPopulationCap');
assert.equal(missing.claimPreview, 'countsTowardPopulationCap = false');
assert.equal(missing.classificationCandidate, 'OBJECTIVE');
assert.equal(missing.sourceVerificationPresent, false);
assert.equal(missing.sourceVerification, null);
assert.equal(missing.sourceNodeVerification, 'verified_here');
assert.equal(missing.verificationStatus, 'EXTERNAL-UNVERIFIED');
assert.equal(missing.provenance.originMappingStatus, 'UNRESOLVED');
assert.equal(missing.provenance.sdkReadAgainstVersion, 'v28.3.0');
assert.equal(missing.provenance.sdkVerifiedAt, '2026-10-15');
assert.equal(missing.provenance.retrievedAt, '2026-11-27');
assert.deepEqual(missing.sourceRecord, graph.nodes[0].assertions[0]);
assert.equal(missing.sourceRecord.extraAssertionField.preserve, true);

const sentiment = result.records[2];
assert.equal(sentiment.classificationCandidate, 'SENTIMENT');
assert.equal(sentiment.sourceVerification, 'contradicted');
assert.equal(sentiment.sourceVerificationPresent, true);
assert.equal(sentiment.verificationStatus, 'EXTERNAL-UNVERIFIED');
assert.equal(sentiment.provenance.originMappingStatus, 'UNMAPPED_REQUIRES_REVIEW');

const unmapped = result.records[3];
assert.equal(unmapped.classificationCandidate, null);
assert.equal(unmapped.provenance.originMappingStatus, 'INVALID_OR_MISSING');
assert.deepEqual(unmapped.value, { raw: ['keep', 1] });

assert.equal(result.report.sourceRecordPreserved, true);
assert.equal(result.report.automaticOriginMapping, false);
assert.equal(result.report.sdkVerificationMapped, false);
assert.equal(result.report.canonicalClaimsCreated, false);
assert.equal(result.report.promotionPerformed, false);
assert.equal(result.report.gkbImportPerformed, false);

assert.throws(() => stageKnowledgeGraphAssertions(graph, {
  sdkVersion: '0.14.1',
  registry,
  retrievedAt: '2026-02-30'
}), /valid YYYY-MM-DD/);
assert.throws(() => stageKnowledgeGraphAssertions(graph, {
  sdkVersion: '0.14.2',
  registry,
  retrievedAt: '2026-11-27'
}), /identity\/version mismatch/);
assert.throws(() => stageKnowledgeGraphAssertions({
  ...graph,
  nodes: [{ id: 'node.bad', assertions: [{ predicate: 'missingSubject', value: 1 }] }]
}, {
  sdkVersion: '0.14.1',
  registry,
  retrievedAt: '2026-11-27'
}), /no string subject/);
assert.throws(() => stageKnowledgeGraphAssertions({
  ...graph,
  nodes: [graph.nodes[0], graph.nodes[0]]
}, {
  sdkVersion: '0.14.1',
  registry,
  retrievedAt: '2026-11-27'
}), /Duplicate SDK node id/);

console.log(JSON.stringify({
  test: 'Samantha GKB SDK Assertion Staging Adapter',
  status: 'PASSED',
  cases: 25,
  assertionRecordsStaged: result.records.length,
  missingVerificationPreserved: true,
  parentNodeVerificationNotInherited: true,
  sourceVerificationNotMapped: true,
  sourceVersionFieldsSeparated: true,
  unknownAssertionFieldsPreserved: true,
  originsNotNormalized: true,
  canonicalPromotion: false,
  bulkImport: false
}, null, 2));
