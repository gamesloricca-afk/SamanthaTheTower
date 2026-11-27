/** Phase 3D: bounded import preview from explicit approvals only. */
import fs from 'node:fs'; import path from 'node:path'; import {fileURLToPath} from 'node:url';
import {buildCanonicalClaimFromReviewedAssertion} from './reviewed-assertion-normalizer.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const domainRegistry=JSON.parse(fs.readFileSync(path.join(ROOT,'domains/canonical-domain-registry.json'),'utf8'));
const validDomains=new Set(domainRegistry.domains.flatMap(item=>[item.domainId,item.label]));
function validDate(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(new Date(v+'T00:00:00Z').getTime())&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;}
export function importReviewedBatch({stagingRecords,decisions,maxBatchSize=25}){
 if(!Array.isArray(stagingRecords)||!Array.isArray(decisions))throw new TypeError('stagingRecords and decisions must be arrays');
 if(!Number.isInteger(maxBatchSize)||maxBatchSize<1||maxBatchSize>25)throw new RangeError('maxBatchSize must be 1..25');
 const decisionIds=new Set(),approved=decisions.filter(x=>x.decision==='APPROVE'),byId=new Map(stagingRecords.map(x=>[x.stagingId??x.stagingRecordId,x]));
 for(const item of decisions){
  if(!['APPROVE','REJECT','DEFER'].includes(item.decision))throw new TypeError('decision must be APPROVE, REJECT, or DEFER');
  if(typeof item.stagingRecordId!=='string'||!item.stagingRecordId)throw new TypeError('stagingRecordId is required');
  if(decisionIds.has(item.stagingRecordId))throw new Error('Duplicate decision for stagingRecordId: '+item.stagingRecordId);
  decisionIds.add(item.stagingRecordId);
  if(typeof item.reviewer!=='string'||!item.reviewer.trim())throw new TypeError('reviewer is required');
  if(!validDate(item.reviewedAt))throw new TypeError('reviewedAt must be a valid YYYY-MM-DD date');
 }
 if(approved.length>maxBatchSize)throw new RangeError(`Approved batch exceeds limit of ${maxBatchSize}`);
 const claimIds=new Set(),claims=[];
 for(const item of approved){
  const c=item.canonical??{};
  if(typeof c.claimId!=='string'||!c.claimId.trim())throw new TypeError('canonical.claimId is required for approval');
  if(!validDomains.has(c.domain))throw new TypeError('canonical.domain must match Samantha canonical domain registry');
  if(claimIds.has(c.claimId))throw new Error('Duplicate canonical claimId: '+c.claimId);
  claimIds.add(c.claimId);
  const staging=byId.get(item.stagingRecordId);
  if(!staging)throw new Error('Staging record not found: '+item.stagingRecordId);
  const review={decision:'APPROVE',reviewer:item.reviewer,reviewNote:item.note??null,claimId:c.claimId,domain:c.domain,
   subject:c.subject,claim:c.claim,classification:c.classification,reviewedAt:item.reviewedAt,
   verificationStatus:c.verificationStatus??'EXTERNAL-UNVERIFIED',applicableGameVersion:c.applicableGameVersion??null,
   evidence:c.evidence??null,sourceName:c.sourceName??'TheTowerSDK',sourceType:c.sourceType??'UNKNOWN',conflict:c.conflict};
  claims.push(buildCanonicalClaimFromReviewedAssertion(staging,null,review));
 }
 return {format:'SAMANTHA_GKB_CONTROLLED_IMPORT_PREVIEW',formatVersion:1,importedAt:new Date().toISOString(),
  importedCount:claims.length,rejectedOrDeferredCount:decisions.length-approved.length,claims};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const s=JSON.parse(fs.readFileSync(process.argv[2]??path.join(ROOT,'staging/sdk-assertions.json'),'utf8'));
 const d=JSON.parse(fs.readFileSync(process.argv[3]??path.join(ROOT,'staging/review-decisions.json'),'utf8'));
 const output=process.argv[4]??path.join(ROOT,'staging/controlled-import-preview.json');
 const result=importReviewedBatch({stagingRecords:s.records??s,decisions:d.records??d,maxBatchSize:25});
 fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({status:'PASSED',importedCount:result.importedCount,canonicalWrite:false,output:path.relative(ROOT,output)},null,2));
}
