import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildGreStaging} from '../adapter/gre-staging.mjs';
import {appendGreReviewDecision,renderGreReviewPacket,summarizeGreReviewQueue} from '../adapter/gre-review.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const snapshot=path.resolve(here,'../staging/gre-source-snapshot/TestAccount-62ae508f');
const staging=buildGreStaging({snapshotDir:snapshot,retrievedAt:'2026-11-27'});
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'samantha-gre-review-'));
const log=path.join(dir,'decisions.jsonl');
const claim=staging.records.find(item=>item.recordKind==='GRE_CLAIM');
const conflict=staging.records.find(item=>item.recordKind==='GRE_CONFLICT');

assert.equal(summarizeGreReviewQueue(staging)[0].decision,'PENDING');
assert.throws(()=>appendGreReviewDecision({staging,logPath:log,decision:{
  stagingRecordId:conflict.stagingId,decision:'APPROVE',reviewer:'tester',reviewedAt:'2026-11-27',
  canonical:{claimId:'X',domain:'combat-mechanics',subject:'x',claim:'x',classification:'OBJECTIVE'}
}}),/cannot be approved/);
assert.throws(()=>appendGreReviewDecision({staging,logPath:log,decision:{
  stagingRecordId:'missing',decision:'DEFER',reviewer:'tester',reviewedAt:'2026-11-27'
}}),/Unknown stagingRecordId/);
const rejected={stagingRecordId:claim.stagingId,decision:'REJECT',reviewer:'tester',reviewedAt:'2026-11-27',note:'Not enough evidence'};
appendGreReviewDecision({staging,logPath:log,decision:rejected});
const deferred={...rejected,decision:'DEFER',note:'Need source follow-up'};
appendGreReviewDecision({staging,logPath:log,decision:deferred});
const decisions=fs.readFileSync(log,'utf8').trim().split('\n').map(JSON.parse);
assert.equal(decisions.length,2,'decisions are append-only');
assert.equal(summarizeGreReviewQueue(staging,decisions).find(item=>item.stagingRecordId===claim.stagingId).decision,'DEFER');
const packet=renderGreReviewPacket(staging,decisions);
assert.match(packet,/Conflict state/);
assert.match(packet,/Linked source claims \(kept separate\)/);
assert.match(packet,/No source is ranked or selected/);
assert.match(packet,/DEFER/);
assert.match(packet,/SRC-SDK-THETOWERSDK-0141/);
fs.rmSync(dir,{recursive:true,force:true});
console.log(JSON.stringify({test:'GRE review workflow',status:'PASSED',records:staging.records.length,appendOnlyDecisions:2,latestDecisionWins:true,conflictsRemainSourceSeparated:true,canonicalWrites:0},null,2));
