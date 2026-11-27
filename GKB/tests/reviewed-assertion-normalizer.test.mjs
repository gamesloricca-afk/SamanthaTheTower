import assert from 'node:assert/strict';
import { stageKnowledgeGraphAssertions } from '../adapter/sdk-assertion-staging.mjs';
import { buildCanonicalClaimFromReviewedAssertion } from '../adapter/reviewed-assertion-normalizer.mjs';

const registry = {
  registryVersion: '1.0.0',
  gameVersion: null,
  sdk: { package: 'thetowersdk', version: '0.14.1' },
  sources: [{ id: 'sdk-knowledge-graph' }]
};
const node = {
  id: 'node.review',
  claimType: 'sentiment',
  verification: 'verified_here',
  assertions: [{
    subject: 'module.example',
    predicate: 'recommendedForTournament',
    value: 'situational',
    verification: 'verified_here',
    provenance: {
      origin: 'game',
      ref: 'SDK source note',
      readAgainstVersion: 'v28.3.0',
      verifiedAt: '2026-10-15'
    }
  }]
};
const graph = {
  schemaVersion: 1,
  graphVersion: 3,
  generatedFor: '2026-10-15',
  nodes: [node],
  edges: []
};
const staged = stageKnowledgeGraphAssertions(graph, {
  sdkVersion: '0.14.1',
  registry,
  retrievedAt: '2026-11-27'
}).records[0];

const review = {
  decision: 'APPROVE',
  claimId: 'GKB-REVIEW-001',
  domain: 'Strategies and Build Interactions',
  subject: 'module.example',
  claim: 'This module is situational for tournament use.',
  classification: 'OBJECTIVE',
  reviewedAt: '2026-11-27'
};
const canonical = buildCanonicalClaimFromReviewedAssertion(staged, node, review);

assert.equal(canonical.claimId, review.claimId);
assert.equal(canonical.classification, 'OBJECTIVE');
assert.equal(canonical.verificationStatus, 'EXTERNAL-UNVERIFIED');
assert.equal(canonical.applicableGameVersion, null);
assert.equal(canonical.lastReviewedAt, '2026-11-27');
assert.equal(canonical.provenance[0].sourceType, 'UNKNOWN');
assert.equal(canonical.provenance[0].sdkPackage, 'thetowersdk');
assert.equal(canonical.provenance[0].sdkVersion, '0.14.1');
assert.equal(canonical.provenance[0].sourceVersion, null);
assert.equal(canonical.provenance[0].publicationDate, null);
assert.equal(canonical.provenance[0].retrievedAt, '2026-11-27');
assert.equal(canonical.provenance[0].sdkReadAgainstVersion, 'v28.3.0');
assert.equal(canonical.provenance[0].sdkVerifiedAt, '2026-10-15');
assert.equal(canonical.provenance[0].originMappingStatus, 'UNRESOLVED');
assert.equal(canonical.sourceRecord.sourceAssertion.verification, 'verified_here');
assert.equal(canonical.sourceRecord.sourceNode.verification, 'verified_here');
assert.equal(canonical.sourceRecord.reviewDecision.decision, 'APPROVE');

assert.throws(() => buildCanonicalClaimFromReviewedAssertion(staged, node, {
  ...review, decision: 'PENDING'
}), /APPROVE is required/);
assert.throws(() => buildCanonicalClaimFromReviewedAssertion(staged, node, {
  ...review, classification: 'UNDECIDED'
}), /OBJECTIVE or SENTIMENT/);
assert.throws(() => buildCanonicalClaimFromReviewedAssertion(staged, node, {
  ...review, reviewedAt: '2026-02-30'
}), /valid YYYY-MM-DD/);
assert.throws(() => buildCanonicalClaimFromReviewedAssertion(staged, node, {
  ...review, verificationStatus: 'VERIFIED'
}), /VERIFIED requires explicit review evidence/);
assert.throws(() => buildCanonicalClaimFromReviewedAssertion(staged, node, {
  ...review, verificationStatus: 'CONFLICTING'
}), /CONFLICTING requires explicit conflict metadata/);

const conflictReview = {
  ...review,
  claimId: 'GKB-REVIEW-CONFLICT-001',
  verificationStatus: 'CONFLICTING',
  conflict: {
    conflictId: 'GKB-CONFLICT-001',
    relatedClaimIds: ['GKB-REVIEW-CONFLICT-002'],
    status: 'OPEN',
    note: 'Keep both source claims visible.'
  }
};
const conflictClaim = buildCanonicalClaimFromReviewedAssertion(staged, node, conflictReview);
assert.equal(conflictClaim.verificationStatus, 'CONFLICTING');
assert.equal(conflictClaim.conflict.status, 'OPEN');
assert.equal(conflictClaim.provenance[0].sourceType, 'UNKNOWN');

console.log(JSON.stringify({
  test: 'Samantha GKB Review-Gated Canonical Claim Normalizer',
  status: 'PASSED',
  cases: 22,
  explicitApprovalRequired: true,
  classificationRequiresReview: true,
  sourceTypeNotAutoMapped: true,
  sdkVerificationNotAutoMapped: true,
  readAgainstVersionNotAutoMapped: true,
  sourceAndSdkDatesSeparated: true,
  conflictingClaimsRemainOpen: true,
  automaticPromotion: false,
  bulkImport: false
}, null, 2));
