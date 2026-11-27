/**
 * Samantha GKB — GRE evidence staging adapter.
 * Read-only ingestion: no canonical writes, no automatic approvals, no conflict resolution.
 * Node.js >=20. Uses only built-in modules.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GKB_ROOT = path.resolve(HERE, '..');
const DEFAULT_SNAPSHOT = path.join(GKB_ROOT, 'staging/gre-source-snapshot/TestAccount-62ae508f');
const DEFAULT_OUTPUT = path.join(GKB_ROOT, 'staging/gre-import');
const SOURCE_REPOSITORY = 'gamesloricca-afk/SamanthaTheTower';
const SOURCE_BRANCH = 'TestAccount';
const SOURCE_COMMIT = '62ae508f3473231b81d27903bdf63e899bb739be';

const DOMAIN_MAP = new Map([
  ['01 Game Fundamentals','game-fundamentals'],['02 Enemies','enemies'],
  ['03 Battle Conditions','battle-conditions'],['04 Combat Mechanics','combat-mechanics'],
  ['05 Ultimate Weapons','ultimate-weapons'],['06 Workshop','workshop'],
  ['07 Workshop Enhancements','workshop-enhancements'],['08 Research','research'],
  ['09 Modules','modules'],['10 Cards and Masteries','cards-and-masteries'],
  ['11 Bots','bots'],['12 Guardians','guardians'],['13 Perks','perks'],
  ['14 Relics','relics'],['15 Vault','vault'],['16 Economy and Progression','economy-and-progression'],
  ['17 Formulas and Calculations','formulas-and-calculations'],
  ['18 Strategy Interactions','strategies-and-build-interactions'],
  ['19 Version History','game-version-history'],
  ['20 Experimental and Community','experimental-and-community-knowledge']
]);

function sha(value) { return createHash('sha256').update(value).digest('hex'); }
function listMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(name => name.endsWith('.md')).sort().map(name => path.join(dir,name));
}
function readText(file) { return fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n'); }
function section(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const match = markdown.match(new RegExp('^##\\s+'+escaped+'\\s*\\n([\\s\\S]*?)(?=^##\\s+|$)','m'));
  return match ? match[1].trim() : '';
}
function field(markdown, label) {
  const re = new RegExp('^\\s*-\\s*'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+':\\s*(.*)$','mi');
  return markdown.match(re)?.[1]?.trim() ?? null;
}
function inlineId(value) {
  return value?.match(/`([A-Z0-9][A-Z0-9-]+)`/)?.[1] ?? null;
}
function idsFrom(markdown, label) {
  const lines = markdown.split('\n');
  const found = [];
  let active = false;
  for (const line of lines) {
    if (new RegExp('^\\s*-\\s*'+label+'\\s*:', 'i').test(line)) {
      active = true;
      const id = inlineId(line);
      if (id) found.push(id);
      continue;
    }
    if (active && /^\s{2,}-\s+/.test(line)) {
      const id = inlineId(line);
      if (id) found.push(id);
      continue;
    }
    if (active && line.trim() && !/^\s/.test(line)) active = false;
  }
  return [...new Set(found)];
}
function cleanDomain(value) {
  if (!value) return null;
  const normalized = value.replace(/^\d{2}\s*[—-]\s*/,'').trim();
  for (const [label,id] of DOMAIN_MAP) if (label.replace(/^\d{2}\s*/,'') === normalized) return {label,id};
  return null;
}
function parseSource(file, root) {
  const raw = readText(file);
  const sourceId = field(raw,'Source ID') ?? path.basename(file,'.md');
  return {
    sourceId,
    sourceName: field(raw,'Title/name') ?? field(raw,'Title') ?? sourceId,
    sourceType: 'UNKNOWN',
    authorOrMaintainer: field(raw,'Author/maintainer'),
    sourceReference: field(raw,'Repository') ?? field(raw,'URL') ?? field(raw,'Source URL'),
    sourceVersion: field(raw,'Version'),
    inspectedCommit: field(raw,'Inspected commit'),
    publicationDate: field(raw,'Publication date') ?? field(raw,'Commit date') ?? field(raw,'Source date'),
    retrievedAt: field(raw,'Access date'),
    gameVersion: field(raw,'Game version/build') ?? field(raw,'Game version'),
    license: field(raw,'Package license') ?? field(raw,'License'),
    limitations: section(raw,'Limitations').split('\n').filter(x=>x.trim()).map(x=>x.replace(/^[-*]\\s*/,'')),
    sourceRecord: { relativePath:path.relative(root,file).split(path.sep).join('/'), rawMarkdown:raw }
  };
}
function parseClaim(file, root) {
  const raw = readText(file);
  const sourceDomain = field(raw,'Domain');
  const domain = cleanDomain(sourceDomain);
  const claimId = field(raw,'Claim ID') ?? path.basename(file,'.md');
  const sourceRefs = idsFrom(raw,'Source IDs?');
  const single = field(raw,'Source ID');
  if (single) sourceRefs.push(inlineId(single) ?? single.replace(/[`]/g,''));
  const sourceVerificationLabel = field(raw,'Verification status');
  const claimType = field(raw,'Claim type');
  const gameVersion = field(raw,'Game version/build');
  const sdkVersion = field(raw,'SDK version');
  const related = [...new Set((raw.match(/`CLM-[A-Z0-9-]+`/g) ?? []).map(x=>x.slice(1,-1)).filter(x=>x!==claimId))];
  const conflicts = [...new Set((raw.match(/`CNF-[A-Z0-9-]+`/g) ?? []).map(x=>x.slice(1,-1)))];
  const evidence = section(raw,'Evidence').split('\n').filter(x=>x.trim()).map(x=>x.replace(/^[-*]\\s*/,'')); 
  const limitations = section(raw,'Limitations').split('\n').filter(x=>x.trim()).map(x=>x.replace(/^[-*]\\s*/,'')); 
  return {
    recordKind:'GRE_CLAIM',
    sourceClaimId:claimId,
    domainSourceLabel:sourceDomain,
    domainCandidate:domain?.id ?? null,
    domainLabel:domain?.label ?? null,
    subject:field(raw,'Subject'),
    claimText:section(raw,'Claim content').replace(/^\s*\n|\n\s*$/g,'') || null,
    classificationCandidate:['OBJECTIVE','SENTIMENT'].includes(claimType) ? claimType : null,
    sourceVerificationLabel,
    provisionalVerificationStatus:'EXTERNAL-UNVERIFIED',
    reviewStatus:'PENDING_REVIEW',
    sourceGameVersion:gameVersion,
    sourceSdkVersion:sdkVersion,
    sourceReferences:[...new Set(sourceRefs)],
    evidence,
    relatedSourceClaimIds:related,
    sourceConflictIds:conflicts,
    limitations,
    sourceRecord:{relativePath:path.relative(root,file).split(path.sep).join('/'),rawMarkdown:raw,parsedFields:{claimId,sourceDomain,claimType,sourceVerificationLabel,gameVersion,sdkVersion}}
  };
}
function parseConflict(file, root) {
  const raw = readText(file);
  const claimsSection = section(raw,'Claims involved');\n  const related = [...new Set((claimsSection.match(/`CLM-[A-Z0-9-]+`/g) ?? []).map(x=>x.slice(1,-1)))];
  return {
    recordKind:'GRE_CONFLICT',
    sourceConflictId:field(raw,'Conflict ID') ?? path.basename(file,'.md'),
    domainSourceLabel:field(raw,'Domain'),
    domainCandidate:cleanDomain(field(raw,'Domain'))?.id ?? null,
    subject:field(raw,'Subject'),
    conflictState:field(raw,'State'),
    gameVersionAlignment:field(raw,'Game version alignment'),
    relatedSourceClaimIds:related,
    reviewStatus:'PENDING_REVIEW',
    provisionalVerificationStatus:'EXTERNAL-UNVERIFIED',
    sourceRecord:{relativePath:path.relative(root,file).split(path.sep).join('/'),rawMarkdown:raw}
  };
}
function deterministicId(kind, sourceId, relativePath) {
  return 'GRE-'+sha([SOURCE_COMMIT,kind,sourceId,relativePath].join('|')).slice(0,24);
}

export function buildGreStaging({snapshotDir=DEFAULT_SNAPSHOT,retrievedAt=new Date().toISOString().slice(0,10)}={}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(retrievedAt)) throw new TypeError('retrievedAt must be YYYY-MM-DD');
  const claimsDir=path.join(snapshotDir,'claims'), sourcesDir=path.join(snapshotDir,'sources'), conflictsDir=path.join(snapshotDir,'conflicts');
  const claimFiles=listMarkdown(claimsDir), sourceFiles=listMarkdown(sourcesDir), conflictFiles=listMarkdown(conflictsDir);
  const sources=sourceFiles.map(file=>parseSource(file,snapshotDir));
  const sourceById=new Map();
  const duplicateSourceIds=[];
  for(const source of sources){if(sourceById.has(source.sourceId)) duplicateSourceIds.push(source.sourceId); else sourceById.set(source.sourceId,source);}
  const claimRecords=claimFiles.map(file=>parseClaim(file,snapshotDir));
  const conflictRecords=conflictFiles.map(file=>parseConflict(file,snapshotDir));
  const claimIds=new Set(), duplicateClaimIds=[];
  for(const claim of claimRecords){if(claimIds.has(claim.sourceClaimId)) duplicateClaimIds.push(claim.sourceClaimId); claimIds.add(claim.sourceClaimId);}
  const unresolvedSourceReferences=[];
  const unknownFieldRecords=[];
  for(const claim of claimRecords){
    claim.unresolvedSourceReferences=claim.sourceReferences.filter(id=>!sourceById.has(id));
    for(const id of claim.unresolvedSourceReferences) unresolvedSourceReferences.push({claimId:claim.sourceClaimId,sourceId:id});
    claim.resolvedSources=claim.sourceReferences.filter(id=>sourceById.has(id)).map(id=>sourceById.get(id));
    claim.sourceSnapshot={repository:SOURCE_REPOSITORY,branch:SOURCE_BRANCH,commit:SOURCE_COMMIT,relativePath:claim.sourceRecord.relativePath,retrievedAt};
    claim.stagingId=deterministicId('CLAIM',claim.sourceClaimId,claim.sourceRecord.relativePath);
    claim.stagingStatus='PENDING_REVIEW';
    claim.sourceSnapshot.retrievedAt=retrievedAt;
    unknownFieldRecords.push({recordId:claim.sourceClaimId,rawPreserved:true});
  }
  const unresolvedConflictReferences=[];
  for(const conflict of conflictRecords){
    conflict.unresolvedClaimReferences=conflict.relatedSourceClaimIds.filter(id=>!claimIds.has(id));
    for(const id of conflict.unresolvedClaimReferences) unresolvedConflictReferences.push({conflictId:conflict.sourceConflictId,claimId:id});
    conflict.stagingId=deterministicId('CONFLICT',conflict.sourceConflictId,conflict.sourceRecord.relativePath);
    conflict.sourceSnapshot={repository:SOURCE_REPOSITORY,branch:SOURCE_BRANCH,commit:SOURCE_COMMIT,relativePath:conflict.sourceRecord.relativePath,retrievedAt};
    conflict.stagingStatus='PENDING_REVIEW';
    unknownFieldRecords.push({recordId:conflict.sourceConflictId,rawPreserved:true});
  }
  const duplicateIds=[...duplicateClaimIds.map(id=>({kind:'CLAIM',id})),...duplicateSourceIds.map(id=>({kind:'SOURCE',id}))];
  const unmappedDomainRecords=[...claimRecords.filter(x=>!x.domainCandidate).map(x=>x.sourceClaimId),...conflictRecords.filter(x=>!x.domainCandidate).map(x=>x.sourceConflictId)];
  const records=[...claimRecords,...conflictRecords];
  const reviewQueue={
    format:'SAMANTHA_GKB_REVIEW_QUEUE',formatVersion:1,
    records:records.map(record=>({
      stagingRecordId:record.stagingId,
      recordKind:record.recordKind,
      sourceSubject:record.subject??null,
      sourcePredicate:null,
      sourceValue:record.claimText??null,
      sourceVerification:record.sourceVerificationLabel??record.conflictState??null,
      decision:'PENDING',
      canonical:null,
      sourceContext:record
    }))
  };
  const report={
    format:'SAMANTHA_GKB_GRE_IMPORT_REPORT',formatVersion:1,
    sourceSnapshot:{repository:SOURCE_REPOSITORY,branch:SOURCE_BRANCH,commit:SOURCE_COMMIT,retrievedAt},
    counts:{
      claimsParsed:claimRecords.length,sourcesParsed:sources.length,conflictsParsed:conflictRecords.length,
      recordsStaged:records.length,invalid:duplicateIds.length+unmappedDomainRecords.length,
      unmappedDomain:unmappedDomainRecords.length,missingSource:unresolvedSourceReferences.length,
      unresolvedConflictReference:unresolvedConflictReferences.length,unknownFields:unknownFieldRecords.length,
      pending:records.length,automaticApprovals:0,canonicalWrites:0
    },
    duplicateIds,unmappedDomainRecords,unresolvedSourceReferences,unresolvedConflictReferences,
    unknownFieldRecords,limitations:[
      'GRE source verification labels are retained verbatim and are not promoted to Samantha verification status.',
      'All source types remain UNKNOWN until attribution is explicitly reviewed.',
      'Game version, SDK version, metadata version, publication date, and retrieval date remain separate.',
      'Conflicting source statements remain separate; no source is ranked or selected.',
      'This report validates staged Markdown records, not live-game mechanics.'
    ],
    status:duplicateIds.length||unmappedDomainRecords.length?'REVIEW_REQUIRED':'STAGED'
  };
  return {
    format:'SAMANTHA_GKB_GRE_STAGING',formatVersion:1,
    sourceSnapshot:report.sourceSnapshot,
    sources,
    records,
    reviewQueue,
    report
  };
}

export function writeGreStaging({snapshotDir=DEFAULT_SNAPSHOT,outputDir=DEFAULT_OUTPUT,retrievedAt=new Date().toISOString().slice(0,10)}={}) {
  const result=buildGreStaging({snapshotDir,retrievedAt});
  fs.mkdirSync(outputDir,{recursive:true});
  fs.writeFileSync(path.join(outputDir,'gre-staging.json'),JSON.stringify({format:result.format,formatVersion:result.formatVersion,sourceSnapshot:result.sourceSnapshot,sources:result.sources,records:result.records},null,2)+'\n');
  fs.writeFileSync(path.join(outputDir,'gre-review-queue.json'),JSON.stringify(result.reviewQueue,null,2)+'\n');
  fs.writeFileSync(path.join(outputDir,'gre-import-report.json'),JSON.stringify(result.report,null,2)+'\n');
  return result.report;
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [snapshotDir,outputDir,retrievedAt]=process.argv.slice(2);
  const report=writeGreStaging({snapshotDir:snapshotDir??DEFAULT_SNAPSHOT,outputDir:outputDir??DEFAULT_OUTPUT,retrievedAt:retrievedAt??new Date().toISOString().slice(0,10)});
  console.log(JSON.stringify(report,null,2));
  if(report.status!=='STAGED') process.exitCode=1;
}
