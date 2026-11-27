/**
 * Build a canonical claim preview from an explicitly approved GRE staging record.
 * This function returns an object only; it never writes canonical domain files.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const require=createRequire(path.join(ROOT,'runtime/package.json'));
const Ajv2020=require('ajv/dist/2020.js').default;
const claimSchema=JSON.parse(fs.readFileSync(path.join(ROOT,'schema/claim.schema.json'),'utf8'));
const validateClaim=new Ajv2020({allErrors:true,strict:true,validateFormats:false}).compile(claimSchema);
const domainRegistry=JSON.parse(fs.readFileSync(path.join(ROOT,'domains/canonical-domain-registry.json'),'utf8'));
const validDomains=new Set(domainRegistry.domains.flatMap(item=>[item.domainId,item.label]));
const statuses=['VERIFIED','USER-PROVIDED','EXTERNAL-UNVERIFIED','HYPOTHESIS','CONFLICTING','SUPERSEDED'];
const sourceTypes=['OFFICIAL','COMMUNITY','PLAYER_TESTING','OTHER','UNKNOWN'];

function validDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(value+'T00:00:00.000Z');
  return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;
}
function clone(value){return JSON.parse(JSON.stringify(value));}
function dateOnly(value){return validDate(value)?value:null;}

export function buildCanonicalClaimFromReviewedGreRecord(stagingRecord,review){
  if(!stagingRecord||stagingRecord.recordKind!=='GRE_CLAIM')throw new TypeError('A GRE_CLAIM staging record is required');
  if(!review||review.decision!=='APPROVE')throw new Error('Explicit review decision APPROVE is required');
  if(typeof review.reviewer!=='string'||!review.reviewer.trim())throw new TypeError('review.reviewer is required');
  if(!validDate(review.reviewedAt))throw new TypeError('review.reviewedAt must be a valid YYYY-MM-DD date');
  const canonical=review.canonical??{};
  for(const key of ['claimId','domain','subject','claim']){
    if(typeof canonical[key]!=='string'||!canonical[key].trim())throw new TypeError('review.canonical.'+key+' is required');
  }
  if(!validDomains.has(canonical.domain))throw new TypeError('review.canonical.domain must match Samantha canonical domain registry');
  if(!['OBJECTIVE','SENTIMENT'].includes(canonical.classification))throw new TypeError('review.canonical.classification must be OBJECTIVE or SENTIMENT');
  const verificationStatus=canonical.verificationStatus??'EXTERNAL-UNVERIFIED';
  if(!statuses.includes(verificationStatus))throw new TypeError('Unsupported canonical verificationStatus');
  if(verificationStatus==='VERIFIED'&&!(typeof canonical.evidence==='string'&&canonical.evidence.trim()))throw new Error('VERIFIED requires reviewer-supplied evidence');
  if((verificationStatus==='CONFLICTING'||stagingRecord.sourceConflictIds?.length)&&!canonical.conflict)throw new Error('A linked GRE conflict requires explicit reviewer-authored canonical conflict metadata');
  if(verificationStatus==='CONFLICTING'&&!canonical.conflict)throw new Error('CONFLICTING requires conflict metadata');
  const sources=Array.isArray(stagingRecord.resolvedSources)?stagingRecord.resolvedSources:[];
  if(!sources.length)throw new Error('At least one resolved GRE source is required before canonical preview');
  const provenance=sources.map(source=>{
    const sourceType=review.sourceTypeOverrides?.[source.sourceId]??'UNKNOWN';
    if(!sourceTypes.includes(sourceType))throw new TypeError('Invalid source type override for '+source.sourceId);
    return {
      sourceType,
      sourceName:source.sourceName??source.sourceId,
      sourceReference:source.sourceReference??null,
      sourceVersion:source.sourceVersion??null,
      sdkPackage:null,
      sdkVersion:stagingRecord.sourceSdkVersion??null,
      publicationDate:dateOnly(source.publicationDate)??dateOnly(stagingRecord.sourcePublicationDate),
      retrievedAt:dateOnly(stagingRecord.sourceSnapshot?.retrievedAt),
      evidence:canonical.evidence??(Array.isArray(stagingRecord.evidence)?stagingRecord.evidence.join('\n'):null),
      limitations:[...(Array.isArray(source.limitations)?source.limitations:[]),...(Array.isArray(stagingRecord.limitations)?stagingRecord.limitations:[])]
    };
  });
  const claim={
    claimId:canonical.claimId,
    domain:canonical.domain,
    subject:canonical.subject,
    claim:canonical.claim,
    classification:canonical.classification,
    verificationStatus,
    applicableGameVersion:canonical.applicableGameVersion??(['UNKNOWN','NOT STATED','NOT ESTABLISHED'].includes(stagingRecord.sourceGameVersion)?null:(stagingRecord.sourceGameVersion??null)),
    lastReviewedAt:review.reviewedAt,
    provenance,
    relatedClaims:Array.isArray(canonical.relatedClaims)?clone(canonical.relatedClaims):[],
    relationships:Array.isArray(canonical.relationships)?clone(canonical.relationships):[],
    limitations:[
      'Created only for preview after explicit human APPROVE; no canonical file was written.',
      'GRE source verification labels are retained as source context and are not automatically mapped.',
      ...(Array.isArray(canonical.limitations)?clone(canonical.limitations):[])
    ],
    sourceRecord:{greStagingEnvelope:clone(stagingRecord),reviewDecision:clone(review)}
  };
  if(canonical.conflict)claim.conflict=clone(canonical.conflict);
  if(Array.isArray(canonical.supersedesClaimIds))claim.supersedesClaimIds=clone(canonical.supersedesClaimIds);
  if(!validateClaim(claim)){
    const error=new Error('Canonical claim schema validation failed');
    error.validationErrors=(validateClaim.errors??[]).map(item=>({instancePath:item.instancePath,keyword:item.keyword,message:item.message}));
    throw error;
  }
  return claim;
}
