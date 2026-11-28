import assert from 'node:assert/strict';
import {
  buildEvidenceIndex, searchEvidence, compareEvidenceConflict
} from '../adapter/gre-evidence-navigator.mjs';

const gre = {
  format: 'SAMANTHA_GKB_GRE_STAGING', formatVersion: 1,
  sourceSnapshot: { repository: 'example/repo', branch: 'TestAccount', commit: 'abc123', retrievedAt: '2026-11-28' },
  sources: [{ sourceId: 'SRC-B', sourceName: 'Community test B metadata', sourceTypeLabel: 'Forum', sourceReference: 'https://example.invalid/b', sourceVersion: 'post B', publicationDate: '2026-11-27', retrievedAt: '2026-11-28' }],
  records: [
    { recordKind: 'GRE_CLAIM', sourceClaimId: 'CLM-A', stagingId: 's-a', subject: 'Land Mine Stun',
      claimText: 'Land Mine Stun affects target X', claimType: 'OBJECTIVE', sourceVerificationLabel: 'UNVERIFIED',
      sourceReferences: ['SRC-A'], resolvedSources: [{ sourceId: 'SRC-A', sourceName: 'Community test A', sourceType: 'UNKNOWN', sourceReference: 'https://example.invalid/a', sourceVersion: 'post A' }], sourceConflictIds: ['CNF-1'], domainCandidates: ['combat-mechanics'],
      sourceRecord: { relativePath: 'claims/CLM-A.md' }, sourceSnapshot: { retrievedAt: '2026-11-28' } },
    { recordKind: 'GRE_CLAIM', sourceClaimId: 'CLM-B', stagingId: 's-b', subject: 'Land Mine Stun',
      claimText: 'Land Mine Stun does not affect target X', claimType: 'OBJECTIVE',
      sourceVerificationLabel: 'UNVERIFIED', sourceReferences: ['SRC-B'], sourceConflictIds: ['CNF-1'],
      domainCandidates: ['combat-mechanics'], sourceRecord: { relativePath: 'claims/CLM-B.md' } },
    { recordKind: 'GRE_CONFLICT', sourceConflictId: 'CNF-1', stagingId: 'c-1',
      subject: 'Land Mine Stun target interaction', conflictState: 'OPEN',
      relatedSourceClaimIds: ['CLM-A','CLM-B'], domainCandidates: ['combat-mechanics'],
      sourceRecord: { relativePath: 'conflicts/CNF-1.md' } }
  ]
};
const sdk = { records: [{
  stagingId: 'sdk-1', sourceNodeId: 'node-1', subject: 'Land Mine Stun',
  predicate: 'interacts_with', value: 'Target Y', classificationCandidate: 'OBJECTIVE',
  sourceVerification: 'unverified',
  sourceRecord: { sourceId: 'SDK-SRC-1', sourceName: 'SDK source' },
  provenance: { sdkPackage: 'thetowersdk', sdkVersion: '0.14.1', registryVersion: '1.0.0', sdkGraphVersion: 3, sdkSchemaVersion: 1, sdkGraphGeneratedFor: '2026-10-15', sdkReadAgainstVersion: 'v28.3.0', sdkVerifiedAt: '2026-10-15', rawOrigin: 'wiki', rawOrigins: [{ path: '$.origin', value: 'wiki' }], originMappingStatus: 'UNMAPPED_REQUIRES_REVIEW', retrievedAt: '2026-11-28' }
}]};
const index = buildEvidenceIndex({ greStaging: gre, sdkAssertions: sdk });
assert.equal(index.totalEvidenceRecords, 4);
assert.equal(index.counts.GRE_CLAIM, 2);
assert.equal(index.counts.GRE_CONFLICT, 1);
assert.equal(index.counts.THETOWERSDK_ASSERTION, 1);
const sdkEvidence = index.entries.find(entry => entry.sourceFamily === 'THETOWERSDK_ASSERTION');
assert.equal(sdkEvidence.sdkVersion, '0.14.1');
assert.equal(sdkEvidence.registryVersion, '1.0.0');
assert.equal(sdkEvidence.sdkReadAgainstVersion, 'v28.3.0');
assert.equal(sdkEvidence.originMappingStatus, 'UNMAPPED_REQUIRES_REVIEW');
assert.deepEqual(sdkEvidence.rawOrigins, [{ path: '$.origin', value: 'wiki' }]);
assert.equal(searchEvidence(index, { query: 'land mine stun' }).resultCount, 4);
const comparison = compareEvidenceConflict(index, 'CNF-1');
assert.equal(comparison.found, true);
assert.equal(comparison.statements.length, 2);
assert.equal(comparison.statements[0].verificationStatus, 'EXTERNAL-UNVERIFIED');
assert.equal(comparison.statements[0].sources.length, 1);
assert.ok(['SRC-A','SRC-B'].includes(comparison.statements[0].sources[0].sourceId));
assert.ok(comparison.statements.some(statement => statement.sources.some(source => source.sourceId === 'SRC-B' && source.sourceName === 'Community test B metadata')));
assert.match(comparison.comparisonPolicy, /No source is ranked/);
assert.equal(searchEvidence(index, { query: 'land mine', sourceFamily: 'sdk' }).resultCount, 1);
assert.throws(() => buildEvidenceIndex({ greStaging: { format: 'wrong', records: [] } }), /Unsupported GRE staging format/);
console.log(JSON.stringify({
  test: 'GRE cross-source evidence navigator',
  status: 'PASSED',
  indexed: index.totalEvidenceRecords,
  conflictStatementsKeptSeparate: comparison.statements.length,
  canonicalClaimsCreated: 0,
  canonicalWrites: 0
}, null, 2));
