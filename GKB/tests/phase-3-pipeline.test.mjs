import assert from 'node:assert/strict';
import {buildReviewQueue} from '../adapter/review-queue.mjs';
import {importReviewedBatch} from '../adapter/controlled-import.mjs';
import {persistStagingSnapshot} from '../adapter/persistent-staging-store.mjs';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import {stageKnowledgeGraphAssertions} from '../adapter/sdk-assertion-staging.mjs';
const registry={registryVersion:'1.0.0',gameVersion:null,sdk:{package:'thetowersdk',version:'0.14.1'},sources:[{id:'sdk-knowledge-graph'}]};
const node={id:'node.phase3',claimType:'objective',assertions:[{subject:'tower.example',predicate:'hasExample',value:1,provenance:{origin:'wiki'}}]};
const graph={schemaVersion:1,graphVersion:1,generatedFor:'2026-11-27',nodes:[node],edges:[]};
const staged=stageKnowledgeGraphAssertions(graph,{sdkVersion:'0.14.1',registry,retrievedAt:'2026-11-27'}).records;
const queue=buildReviewQueue(staged); assert.equal(queue.records.length,1); assert.equal(queue.records[0].decision,'PENDING');
const deferred={stagingRecordId:staged[0].stagingId,decision:'DEFER',reviewer:'test-reviewer',reviewedAt:'2026-11-27'};
const pending=importReviewedBatch({stagingRecords:staged,decisions:[deferred]}); assert.equal(pending.importedCount,0);
const decision={stagingRecordId:staged[0].stagingId,decision:'APPROVE',reviewer:'test-reviewer',reviewedAt:'2026-11-27',
 canonical:{claimId:'GKB-P3-001',domain:'Game Fundamentals',subject:'tower.example',claim:'Example fact.',classification:'OBJECTIVE'}};
const imported=importReviewedBatch({stagingRecords:staged,decisions:[decision]});
assert.equal(imported.importedCount,1); assert.equal(imported.claims[0].verificationStatus,'EXTERNAL-UNVERIFIED');
assert.equal(imported.claims[0].provenance[0].sdkVersion,'0.14.1');
assert.throws(()=>importReviewedBatch({stagingRecords:staged,decisions:Array.from({length:26},(_,i)=>({...decision,stagingRecordId:`stage-${i}`,canonical:{...decision.canonical,claimId:`GKB-${i}`}}))}),/exceeds limit/);
const twoStaged=[...staged,{...staged[0],stagingId:'stage-2'}];
assert.throws(()=>importReviewedBatch({stagingRecords:twoStaged,decisions:[decision,{...decision,stagingRecordId:'stage-2'}]}),/Duplicate canonical claimId/);
assert.throws(()=>importReviewedBatch({stagingRecords:staged,decisions:[{...decision,reviewer:''}]}),/reviewer is required/);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gkb-p3-'));
try {
 fs.mkdirSync(path.join(tmp,'staging'),{recursive:true});
 fs.writeFileSync(path.join(tmp,'staging/sdk-assertions.json'),JSON.stringify({records:staged}));
 const first=persistStagingSnapshot({runId:'100',retrievedAt:'2026-11-27',root:tmp}); assert.equal(first.comparison[0].change,'BASELINE');
 fs.writeFileSync(path.join(tmp,'staging/sdk-assertions.json'),JSON.stringify({records:[...staged,{...staged[0],stagingId:'stage-2'}]}));
 const second=persistStagingSnapshot({runId:'101',retrievedAt:'2026-11-28',root:tmp});
 assert.equal(second.previousRunId,'100'); assert.equal(second.comparison.find(x=>x.name==='sdk-assertions.json').change,'CHANGED');
 assert.throws(()=>persistStagingSnapshot({runId:'101',retrievedAt:'2026-11-28',root:tmp}),/cannot be overwritten/);
} finally {fs.rmSync(tmp,{recursive:true,force:true});}
console.log(JSON.stringify({test:'Samantha GKB Phase 3A-3E pipeline',status:'PASSED',cases:12,persistentSnapshots:true,explicitReview:true,controlledBatchLimit:25,canonicalImportOnlyAfterApproval:true,automaticVerificationPromotion:false},null,2));
