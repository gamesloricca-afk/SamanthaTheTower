import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildGreStaging} from '../adapter/gre-staging.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const snapshot=path.resolve(here,'../staging/gre-source-snapshot/TestAccount-62ae508f');
const a=buildGreStaging({snapshotDir:snapshot,retrievedAt:'2026-11-27'});
const b=buildGreStaging({snapshotDir:snapshot,retrievedAt:'2026-11-27'});

assert.equal(a.report.status,'STAGED');
assert.equal(a.report.counts.claimsParsed,12);
assert.equal(a.report.counts.sourcesParsed,7);
assert.equal(a.report.counts.conflictsParsed,1);
assert.equal(a.report.counts.recordsStaged,13);
assert.equal(a.report.counts.automaticApprovals,0);
assert.equal(a.report.counts.canonicalWrites,0);
assert.equal(a.report.counts.pending,13);
assert.equal(a.report.unresolvedSourceReferences.length,0);
assert.equal(a.report.unresolvedConflictReferences.length,0);
assert.equal(a.report.duplicateIds.length,0);
assert.equal(a.report.unmappedDomainRecords.length,0);
assert.deepEqual(a.records.map(x=>x.stagingId),b.records.map(x=>x.stagingId));

for(const record of a.records){
  assert.equal(record.reviewStatus,'PENDING_REVIEW');
  assert.equal(record.stagingStatus,'PENDING_REVIEW');
  assert.equal(record.provisionalVerificationStatus,'EXTERNAL-UNVERIFIED');
  assert.ok(record.sourceRecord.rawMarkdown.length>0);
}
const sdkClaim=a.records.find(x=>x.sourceClaimId==='CLM-D04-DR-001');
assert.equal(sdkClaim.sourceVerificationLabel,'VERIFIED (source-code statement only; not verified as live-game behavior)');
assert.equal(sdkClaim.sourceGameVersion,'UNKNOWN');
assert.equal(sdkClaim.sourceSdkVersion,'`thetowersdk@0.14.1`');
assert.equal(sdkClaim.domainCandidate,'combat-mechanics');
assert.equal(sdkClaim.sourceReferences[0],'SRC-SDK-THETOWERSDK-0141');

const conflict=a.records.find(x=>x.recordKind==='GRE_CONFLICT');
assert.equal(conflict.sourceConflictId,'CNF-D04-DR-001');
assert.equal(conflict.conflictState,'OPEN — source disagreement preserved');
assert.deepEqual(new Set(conflict.relatedSourceClaimIds),new Set([
  'CLM-D04-DR-001','CLM-D04-DR-003','CLM-D04-DR-004','CLM-D04-DR-005'
]));
assert.ok(a.reviewQueue.records.every(x=>x.decision==='PENDING'&&x.canonical===null));
assert.ok(a.reviewQueue.records.every(x=>x.sourceContext.sourceRecord.rawMarkdown));

const unknown=buildGreStaging({snapshotDir:snapshot,retrievedAt:'2026-11-27'});
unknown.records[0].sourceRecord.rawMarkdown+='\n- Unrecognized future field: preserve me\n';
assert.match(unknown.records[0].sourceRecord.rawMarkdown,/Unrecognized future field/);

console.log(JSON.stringify({test:'GRE staging adapter',status:'PASSED',claims:a.report.counts.claimsParsed,sources:a.report.counts.sourcesParsed,conflicts:a.report.counts.conflictsParsed,staged:a.report.counts.recordsStaged,pending:a.report.counts.pending,canonicalWrites:0,automaticApprovals:0},null,2));
