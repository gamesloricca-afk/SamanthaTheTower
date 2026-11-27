/** Phase 3C: create a review queue; human decisions remain separate input. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function buildReviewQueue(stagingRecords) {
  if(!Array.isArray(stagingRecords)) throw new TypeError('stagingRecords must be an array');
  return {format:'SAMANTHA_GKB_REVIEW_QUEUE',formatVersion:1,records:stagingRecords.map(record=>({
    stagingRecordId:record.stagingId??record.stagingRecordId??null,
    recordKind:record.recordKind??'UNKNOWN',sourceSubject:record.subject??null,
    sourcePredicate:record.predicate??null,sourceValue:record.value??null,
    sourceVerification:record.sourceVerification??null,decision:'PENDING',canonical:null
  }))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const input=process.argv[2]??path.join(ROOT,'staging/sdk-assertions.json');
  const output=process.argv[3]??path.join(ROOT,'staging/review-queue.json');
  const source=JSON.parse(fs.readFileSync(input,'utf8')),records=Array.isArray(source)?source:source.records;
  if(!Array.isArray(records)) throw new Error('Input has no records array');
  fs.writeFileSync(output,JSON.stringify(buildReviewQueue(records),null,2)+'\n');
  console.log(JSON.stringify({status:'PASSED',queued:records.length,approved:0,automaticPromotion:false,output:path.relative(ROOT,output)},null,2));
}
