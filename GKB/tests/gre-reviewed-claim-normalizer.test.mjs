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
assert.throws(()=>buildCanonicalClaimFromReviewedGreRecord(record,{decision:'PENDING',reviewer:'test',reviewedAt:'2026-11-27',canonical:{}}),/Explicit review decision APPROVE/);
console.log(JSON.stringify({test:'GRE explicit approval preview',status:'PASSED',syntheticOnly:true,canonicalWrites:0,automaticApprovals:0},null,2));
