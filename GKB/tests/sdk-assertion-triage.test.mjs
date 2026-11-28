import assert from 'node:assert/strict';
import { triageSdkAssertions } from '../adapter/sdk-assertion-triage.mjs';

const base = {
  stagingVersion: '1.0.0',
  recordKind: 'SDK_GRAPH_ASSERTION_ENVELOPE',
  stagingId: 'node-1-assertion-1',
  sourceNodeStagingId: 'node-1',
  sourceNodeId: 'node.one',
  subject: 'enemy.fleet',
  predicate: 'countsTowardPopulationCap',
  value: false,
  classificationCandidate: 'OBJECTIVE',
  sourceVerification: null,
  sourceVerificationPresent: false,
  sourceNodeVerification: 'verified_here',
  provenance: {
    sdkPackage: 'thetowersdk',
    sdkVersion: '0.14.1',
    retrievedAt: '2026-11-28',
    originMappingStatus: 'UNMAPPED_REQUIRES_REVIEW'
  },
  sourceRecord: { raw: true },
  verificationStatus: 'EXTERNAL-UNVERIFIED'
};

const result = triageSdkAssertions([
  base,
  {
    ...base,
    stagingId: 'node-1-assertion-2',
    sourceNodeId: 'node.one',
    sourceVerification: 'unverified',
    sourceVerificationPresent: true,
    provenance: { ...base.provenance, originMappingStatus: 'UNRESOLVED' }
  },
  {
    ...base,
    stagingId: 'node-2-assertion-1',
    sourceNodeStagingId: 'node-2',
    sourceNodeId: 'node.two',
    sourceVerification: 'contradicted',
    sourceVerificationPresent: true
  },
  {
    ...base,
    stagingId: 'node-3-assertion-1',
    sourceNodeStagingId: 'node-3',
    sourceNodeId: 'node.three',
    classificationCandidate: null
  }
]);

assert.equal(result.report.inputAssertionCount, 4);
assert.equal(result.report.autoTriagedCount, 1);
assert.equal(result.report.manualReviewExceptionCount, 3);
assert.equal(result.report.groupedNodeCount, 3);
assert.equal(result.report.mechanicsVerificationPerformed, false);
assert.equal(result.report.canonicalClaimsCreated, 0);
assert.equal(result.records[0].disposition, 'STRUCTURE_VALIDATED_EXTERNAL_UNVERIFIED');
assert.deepEqual(result.records[0].informational, [
  'ASSERTION_VERIFICATION_MISSING_PRESERVED_AS_EXTERNAL_UNVERIFIED'
]);
assert.ok(result.manualReviewQueue.some(x => x.issues.includes('SOURCE_ORIGIN_UNRESOLVED')));
assert.ok(result.manualReviewQueue.some(x => x.issues.includes('SOURCE_MARKS_ASSERTION_OR_NODE_CONTRADICTED')));
assert.ok(result.manualReviewQueue.some(x => x.issues.includes('CLASSIFICATION_CANDIDATE_UNMAPPED')));

const duplicate = triageSdkAssertions([base, base]);
assert.ok(duplicate.manualReviewQueue.every(x => x.issues.includes('DUPLICATE_STAGING_ID')));
assert.equal(duplicate.report.automaticApprovals, 0);
assert.equal(duplicate.report.canonicalWrites, 0);

assert.throws(() => triageSdkAssertions(null), /records must be an array/);
console.log(JSON.stringify({
  test: 'SDK assertion automatic triage',
  status: 'PASSED',
  input: 4,
  autoTriaged: 1,
  manualExceptions: 3,
  missingVerificationAutoException: false,
  mechanicsVerified: false,
  canonicalPromotion: false
}, null, 2));
