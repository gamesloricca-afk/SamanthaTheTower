import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildGreStaging} from '../adapter/gre-staging.mjs';
import {buildCanonicalClaimFromReviewedGreRecord} from '../adapter/gre-reviewed-claim-normalizer.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const snapshot=path.resolve(here,'../staging/gre-source-snapshot/TestAccount-62ae508f');
const staging=buildGreStaging({snapshotDir:snapshot,retrievedAt:'2026-11-27'});
const record=staging.records.find(x=>x.sourceClaimId==='CLM-D04-DR-002');
const preview=buildCanonicalClaimFromReviewedGreRecord(record,{
  decision:'APPROVE',
  reviewer:'synthetic-test-only',
  reviewedAt:'2026-11-27',
  canonical:{
    claimId:'TEST-GRE-APPROVAL-PREVIEW-001',
    domain:'combat-mechanics',
    subject:'Synthetic approval fixture',
    claim:'Synthetic claim used only to test the explicit GRE approval preview path.',
    classification:'OBJECTIVE',
    verificationStatus:'EXTERNAL-UNVERIFIED'
  }
});
assert.equal(preview.claimId,'TEST-GRE-APPROVAL-PREVIEW-001');
assert.equal(preview.verificationStatus,'EXTERNAL-UNVERIFIED');
assert.equal(preview.provenance[0].sourceType,'UNKNOWN');
assert.equal(preview.sourceRecord.greStagingEnvelope.sourceClaimId,'CLM-D04-DR-002');
assert.throws(()=>buildCanonicalClaimFromReviewedGreRecord(record,{decision:'APPROVE',reviewer:'test',reviewedAt:'2026-11-27',canonical:{claimId:'X',domain:'combat-mechanics',subject:'X',claim:'X',classification:'OBJECTIVE',verificationStatus:'VERIFIED'}}),/requires reviewer-supplied evidence/);
const conflictLinked=staging.records.find(x=>x.sourceClaimId==='CLM-D04-DR-001');
const conflictId=conflictLinked.sourceConflictIds[0];
const linkedConflict=conflictLinked.resolvedConflicts.find(x=>x.sourceConflictId===conflictId);
const conflictPreview=buildCanonicalClaimFromReviewedGreRecord(conflictLinked,{
  decision:'APPROVE',reviewer:'synthetic-conflict-test',reviewedAt:'2026-11-27',
  canonical:{claimId:'TEST-GRE-CONFLICT-PREVIEW-001',domain:'combat-mechanics',subject:'Synthetic conflict fixture',claim:'Synthetic claim retaining the linked source conflict.',classification:'OBJECTIVE',verificationStatus:'CONFLICTING',evidence:'Synthetic reviewer evidence',conflict:{conflictId,relatedClaimIds:linkedConflict.relatedSourceClaimIds,status:'OPEN'}}
});
assert.equal(conflictPreview.conflict.conflictId,conflictId);
assert.throws(()=>buildCanonicalClaimFromReviewedGreRecord(conflictLinked,{
  decision:'APPROVE',reviewer:'synthetic-conflict-test',reviewedAt:'2026-11-27',
  canonical:{claimId:'TEST-GRE-CONFLICT-RELATED-BAD-001',domain:'combat-mechanics',subject:'Bad related claims fixture',claim:'Bad related claims fixture.',classification:'OBJECTIVE',verificationStatus:'CONFLICTING',evidence:'Synthetic evidence',conflict:{conflictId,relatedClaimIds:['CLM-D04-DR-001'],status:'OPEN'}}
}),/relatedClaimIds must exactly match/);
assert.throws(()=>buildCanonicalClaimFromReviewedGreRecord(conflictLinked,{
  decision:'APPROVE',reviewer:'synthetic-conflict-test',reviewedAt:'2026-11-27',
  canonical:{claimId:'TEST-GRE-CONFLICT-BAD-001',domain:'combat-mechanics',subject:'Bad conflict fixture',claim:'Bad conflict fixture.',classification:'OBJECTIVE',verificationStatus:'CONFLICTING',evidence:'Synthetic evidence',conflict:{conflictId:'CNF-WRONG',relatedClaimIds:linkedConflict.relatedSourceClaimIds,status:'OPEN'}}
}),/must match the linked GRE source conflict/);
const sourceOverridePreview=buildCanonicalClaimFromReviewedGreRecord(record,{
  decision:'APPROVE',reviewer:'synthetic-source-type-test',reviewedAt:'2026-11-27',
  canonical:{claimId:'TEST-GRE-SOURCE-TYPE-001',domain:'combat-mechanics',subject:'Synthetic source type fixture',claim:'Synthetic claim for source type override.',classification:'OBJECTIVE',verificationStatus:'EXTERNAL-UNVERIFIED',sourceTypeOverrides:{'SRC-SDK-THETOWERSDK-0141':'OTHER'}}
});
assert.equal(sourceOverridePreview.provenance[0].sourceType,'OTHER');
assert.throws(()=>buildCanonicalClaimFromReviewedGreRecord(record,{
  decision:'APPROVE',reviewer:'synthetic-source-type-test',reviewedAt:'2026-11-27',
  canonical:{claimId:'TEST-GRE-SOURCE-TYPE-BAD-001',domain:'combat-mechanics',subject:'Bad source type fixture',claim:'Bad source type fixture.',classification:'OBJECTIVE',sourceTypeOverrides:{'SRC-NOT-LINKED':'COMMUNITY'}}
}),/unknown sourceId/);
assert.throws(()=>buildCanonicalClaimFromReviewedGreRecord(record,{decision:'PENDING',reviewer:'test',reviewedAt:'2026-11-27',canonical:{}}),/Explicit review decision APPROVE/);
console.log(JSON.stringify({test:'GRE explicit approval preview',status:'PASSED',syntheticOnly:true,canonicalWrites:0,automaticApprovals:0},null,2));
