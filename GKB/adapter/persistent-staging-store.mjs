/**
 * Phase 3A: immutable snapshots keyed by GitHub Actions run ID.
 * Each snapshot stores original generated staging JSON and SHA-256 provenance.
 */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const INPUTS=['staging/sdk-claims.json','staging/sdk-assertions.json','staging/sdk-edges.json','staging/sdk-contradictions.json','staging/sdk-domain-catalogs.json','staging/review-queue.json'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
export function persistStagingSnapshot({runId,retrievedAt,root=ROOT}){
 if(!/^\d{1,20}$/.test(String(runId)))throw new TypeError('runId must be numeric');
 if(typeof retrievedAt!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(retrievedAt))throw new TypeError('retrievedAt must be YYYY-MM-DD');
 const base=path.join(root,'staging/snapshots'),dir=path.join(base,String(runId));
 if(fs.existsSync(dir))throw new Error('Snapshot already exists; immutable snapshots cannot be overwritten');
 fs.mkdirSync(dir,{recursive:true});const files=[];
 for(const sourcePath of INPUTS){const source=path.join(root,sourcePath);if(!fs.existsSync(source))continue;
  const raw=fs.readFileSync(source);JSON.parse(raw.toString('utf8'));const name=path.basename(sourcePath);
  fs.copyFileSync(source,path.join(dir,name));files.push({name,sourcePath,sha256:hash(raw),bytes:raw.length});}
 if(!files.some(x=>x.name==='sdk-assertions.json'))throw new Error('Required assertion staging output is missing');
 const previous=fs.existsSync(base)?fs.readdirSync(base).filter(n=>/^\d+$/.test(n)&&n!==String(runId)).sort((a,b)=>Number(b)-Number(a))[0]:null;
 const oldPath=previous&&path.join(base,previous,'manifest.json'),old=oldPath&&fs.existsSync(oldPath)?JSON.parse(fs.readFileSync(oldPath,'utf8')):null;
 const comparison=files.map(file=>{const prior=old?.files.find(x=>x.name===file.name);return{name:file.name,change:!old?'BASELINE':!prior?'NEW':prior.sha256===file.sha256?'UNCHANGED':'CHANGED',previousSha256:prior?.sha256??null,currentSha256:file.sha256};});
 const manifest={format:'SAMANTHA_GKB_STAGING_SNAPSHOT',formatVersion:1,runId:String(runId),retrievedAt,sdk:{package:'thetowersdk',version:'0.14.1'},previousRunId:previous,files,comparison};
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.join(root,'staging/latest-snapshot.json'),JSON.stringify({runId:String(runId),manifest:`snapshots/${runId}/manifest.json`},null,2)+'\n');return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(persistStagingSnapshot({runId:process.env.GITHUB_RUN_ID??process.argv[2],retrievedAt:process.env.GKB_RETRIEVED_AT??new Date().toISOString().slice(0,10)}),null,2));
