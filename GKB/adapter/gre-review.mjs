/**
 * GRE review CLI: persistent, append-only decisions and source-separated review packets.
 * It never edits staging envelopes or canonical GKB domain files.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const require=createRequire(path.join(ROOT,'runtime/package.json'));
const Ajv2020=require('ajv/dist/2020.js').default;
const decisionSchema=JSON.parse(fs.readFileSync(path.join(ROOT,'schema/review-decision.schema.json'),'utf8'));
const validateDecision=new Ajv2020({allErrors:true,strict:false,validateFormats:false}).compile(decisionSchema);
const {buildCanonicalClaimFromReviewedGreRecord}=await import('./gre-reviewed-claim-normalizer.mjs');

function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function validDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const d=new Date(value+'T00:00:00.000Z');
  return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value;
}
function readDecisionLog(file){
  if(!fs.existsSync(file))return [];
  return fs.readFileSync(file,'utf8').split(/\r?\n/).filter(Boolean).map((line,index)=>{
    try{return JSON.parse(line);}catch(error){throw new Error('Invalid JSONL at '+file+':'+(index+1)+' — '+error.message);}
  });
}
function latestById(decisions){
  const latest=new Map();
  for(const decision of decisions)latest.set(decision.stagingRecordId,decision);
  return latest;
}
export function summarizeGreReviewQueue(staging,decisions=[]){
  const latest=latestById(decisions);
  return staging.records.map(record=>({
    stagingRecordId:record.stagingId,
    recordKind:record.recordKind,
    sourceId:record.sourceClaimId??record.sourceConflictId,
    subject:record.subject??null,
    decision:latest.get(record.stagingId)?.decision??'PENDING',
    reviewer:latest.get(record.stagingId)?.reviewer??null,
    reviewedAt:latest.get(record.stagingId)?.reviewedAt??null
  }));
}
function sourceLines(record){
  const sources=record.resolvedSources??[];
  if(!sources.length)return ['- No resolved source records are attached.'];
  return sources.map(source=>{
    const ref=source.sourceReference??source.sourceId;
    const version=source.sourceVersion??'version not stated';
    return '- **'+source.sourceId+'** — '+(source.sourceName??'Name not stated')+'; reference: '+ref+'; version: '+version+'; type: '+(source.sourceType??'UNKNOWN');
  });
}
export function renderGreReviewPacket(staging,decisions=[]){
  const latest=latestById(decisions);
  const lines=['# GRE evidence review packet','','- Snapshot commit: `'+staging.sourceSnapshot.commit+'`','- Retrieved: '+staging.sourceSnapshot.retrievedAt,'- Records: '+staging.records.length,'','> Review rule: preserve every source independently. Conflicting statements are shown side by side; this packet does not rank sources or select a winner.','','## Review queue',''];
  for(const record of staging.records){
    const id=record.sourceClaimId??record.sourceConflictId;
    const decision=latest.get(record.stagingId);
    lines.push('### '+id+' — '+record.recordKind);
    lines.push('');
    lines.push('- Staging ID: `'+record.stagingId+'`');
    lines.push('- Domain candidate(s): '+((record.domainCandidates??[]).join(', ')||'UNMAPPED'));
    lines.push('- Review decision: **'+(decision?.decision??'PENDING')+'**'+(decision?' by '+decision.reviewer+' on '+decision.reviewedAt:''));
    if(record.subject)lines.push('- Subject: '+record.subject);
    if(record.claimText){lines.push('','**Claim statement**','',record.claimText);}
    if(record.recordKind==='GRE_CONFLICT'){
      lines.push('','**Conflict state:** '+(record.conflictState??'NOT STATED'),'','**Linked source claims (kept separate):**');
      for(const claimId of record.relatedSourceClaimIds??[]){
        const linked=staging.records.find(item=>item.sourceClaimId===claimId);
        lines.push('- **'+claimId+'**'+(linked?.claimText?' — '+linked.claimText:' — linked claim not present in this snapshot'));
        if(linked)for(const source of linked.resolvedSources??[])lines.push('  - '+source.sourceId+': '+(source.sourceName??'Name not stated')+' — '+(source.sourceReference??'reference not stated'));
      }
    }else{
      lines.push('','**Source records (independent entries):**','',...sourceLines(record));
      if(record.sourceVerificationLabel)lines.push('','**Source verification label (verbatim):** '+record.sourceVerificationLabel);
      if(record.sourceGameVersion)lines.push('**Game version/build (source wording):** '+record.sourceGameVersion);
      if(record.sourceSdkVersion)lines.push('**SDK version (separate field):** '+record.sourceSdkVersion);
      if(record.limitations?.length)lines.push('','**Limitations:**',...record.limitations.map(item=>'- '+item));
    }
    lines.push('','---','');
  }
  return lines.join('\n')+'\n';
}
export function appendGreReviewDecision({staging,decision,logPath}){
  if(!staging||!Array.isArray(staging.records))throw new TypeError('A GRE staging envelope is required');
  if(!decision||!validateDecision(decision)){
    const error=new Error('Review decision schema validation failed');
    error.validationErrors=(validateDecision.errors??[]).map(item=>({instancePath:item.instancePath,keyword:item.keyword,message:item.message}));
    throw error;
  }
  if(!validDate(decision.reviewedAt))throw new TypeError('reviewedAt must be a real YYYY-MM-DD date');
  const record=staging.records.find(item=>item.stagingId===decision.stagingRecordId);
  if(!record)throw new Error('Unknown stagingRecordId: '+decision.stagingRecordId);
  if(decision.decision==='APPROVE'){
    if(record.recordKind!=='GRE_CLAIM')throw new Error('GRE conflict envelopes cannot be approved as canonical claims');
    // Validate the complete canonical preview before recording approval.
    buildCanonicalClaimFromReviewedGreRecord(record,{...decision,review:undefined});
  }
  fs.mkdirSync(path.dirname(path.resolve(logPath)),{recursive:true});
  fs.appendFileSync(logPath,JSON.stringify(decision)+'\n',{encoding:'utf8',flag:'a'});
  return {stagingRecordId:decision.stagingRecordId,decision:decision.decision,logPath};
}
export function writeGreReviewPacket({stagingPath,outputPath,decisionsPath}){
  const staging=readJson(stagingPath);
  const decisions=decisionsPath?readDecisionLog(decisionsPath):[];
  const packet=renderGreReviewPacket(staging,decisions);
  fs.mkdirSync(path.dirname(path.resolve(outputPath)),{recursive:true});
  fs.writeFileSync(outputPath,packet);
  return {records:staging.records.length,decisions:decisions.length,outputPath};
}
function usage(){
  console.log([
    'GRE review CLI',
    '  node ../adapter/gre-review.mjs packet <staging.json> <packet.md> [decisions.jsonl]',
    '  node ../adapter/gre-review.mjs list <staging.json> [decisions.jsonl]',
    '  node ../adapter/gre-review.mjs show <staging.json> <stagingId>',
    '  node ../adapter/gre-review.mjs decide <staging.json> <decisions.jsonl> <stagingId> <APPROVE|REJECT|DEFER> <reviewer> <YYYY-MM-DD> [note] [canonical-json]',
    'APPROVE requires canonical-json and is schema-checked before the append-only decision is recorded.'
  ].join('\n'));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [command,...args]=process.argv.slice(2);
  try{
    if(command==='packet'){
      const [stagingPath,outputPath,decisionsPath]=args;
      if(!stagingPath||!outputPath)throw new Error('packet requires staging.json and output.md');
      console.log(JSON.stringify(writeGreReviewPacket({stagingPath,outputPath,decisionsPath}),null,2));
    }else if(command==='list'){
      const [stagingPath,decisionsPath]=args;
      if(!stagingPath)throw new Error('list requires staging.json');
      const staging=readJson(stagingPath);
      console.log(JSON.stringify(summarizeGreReviewQueue(staging,decisionsPath?readDecisionLog(decisionsPath):[]),null,2));
    }else if(command==='show'){
      const [stagingPath,stagingId]=args;
      if(!stagingPath||!stagingId)throw new Error('show requires staging.json and stagingId');
      const record=readJson(stagingPath).records.find(item=>item.stagingId===stagingId);
      if(!record)throw new Error('Unknown stagingRecordId: '+stagingId);
      console.log(JSON.stringify(record,null,2));
    }else if(command==='decide'){
      const [stagingPath,logPath,stagingRecordId,decision,reviewer,reviewedAt,note,canonicalJson]=args;
      if(!stagingPath||!logPath||!stagingRecordId||!decision||!reviewer||!reviewedAt)throw new Error('decide is missing required arguments');
      const payload={stagingRecordId,decision,reviewer,reviewedAt,note:note??null};
      if(canonicalJson)payload.canonical=JSON.parse(canonicalJson);
      const result=appendGreReviewDecision({staging:readJson(stagingPath),decision:payload,logPath});
      console.log(JSON.stringify(result,null,2));
    }else{usage();if(command)process.exitCode=2;}
  }catch(error){console.error(error.message);if(error.validationErrors)console.error(JSON.stringify(error.validationErrors,null,2));process.exitCode=1;}
}
