/**
 * Samantha GKB — cross-source evidence navigator.
 *
 * Search/index only: preserves source records independently, never ranks sources,
 * infers semantic links, verifies mechanics, approves claims, or writes canonical GKB.
 * Node.js >=20; built-in modules only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const norm = value => String(value ?? '').normalize('NFKC')
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ').trim();
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const readJsonl = file => fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean)
  .map((line, index) => {
    try { return JSON.parse(line); }
    catch (error) { throw new Error('Invalid JSONL at ' + file + ':' + (index + 1) + ': ' + error.message); }
  });
const optionalJson = file => file && fs.existsSync(file) ? readJson(file) : null;
const optionalJsonl = file => file && fs.existsSync(file) ? readJsonl(file) : [];
const textOf = value => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(textOf).join(' ');
  if (typeof value === 'object') return Object.entries(value).map(([k,v]) => k + ' ' + textOf(v)).join(' ');
  return String(value);
};
const pick = (...values) => values.find(value => value !== undefined && value !== null && value !== '') ?? null;

function greClaimEntry(record, staging, sourceMap = new Map()) {
  return {
    evidenceId: 'GRE:' + (record.sourceClaimId ?? record.stagingId),
    sourceFamily: 'GRE_CLAIM',
    sourceName: 'GRE source claim note',
    sourceReference: record.sourceRecord?.relativePath ?? null,
    sourceRepository: staging.sourceSnapshot?.repository ?? null,
    sourceBranch: staging.sourceSnapshot?.branch ?? null,
    sourceCommit: staging.sourceSnapshot?.commit ?? null,
    gameVersion: record.sourceGameVersion ?? record.gameVersion ?? null,
    sdkVersion: record.sourceSdkVersion ?? null,
    publicationDate: record.publicationDate ?? null,
    retrievedAt: record.sourceSnapshot?.retrievedAt ?? staging.sourceSnapshot?.retrievedAt ?? null,
    domain: record.domainCandidates ?? [],
    subject: record.subject ?? null,
    statement: record.claimText ?? null,
    classification: record.claimType ?? null,
    sourceVerificationLabel: record.sourceVerificationLabel ?? null,
    verificationStatus: 'EXTERNAL-UNVERIFIED',
    sourceIds: record.sourceReferences ?? [],
    sources: (record.resolvedSources ?? (record.sourceReferences ?? []).map(id => sourceMap.get(id)).filter(Boolean)).map(source => ({
      sourceId: source.sourceId ?? null,
      sourceName: source.sourceName ?? null,
      sourceType: source.sourceType ?? 'UNKNOWN',
      sourceTypeLabel: source.sourceTypeLabel ?? null,
      authorOrMaintainer: source.authorOrMaintainer ?? null,
      branchRef: source.branchRef ?? null,
      inspectedCommit: source.inspectedCommit ?? null,
      metadataFormatVersion: source.metadataFormatVersion ?? null,
      license: source.license ?? null,
      sourceReference: source.sourceReference ?? null,
      sourceVersion: source.sourceVersion ?? null,
      gameVersion: source.gameVersion ?? null,
      publicationDate: source.publicationDate ?? null,
      retrievedAt: source.retrievedAt ?? null,
      limitations: source.limitations ?? [],
      rawSourceRecord: source.sourceRecord ?? null
    })),
    conflictIds: (record.sourceConflictIds ?? []).concat((record.resolvedConflicts ?? []).map(x => x.sourceConflictId)),
    limitations: record.limitations ?? [],
    rawRecord: record
  };
}
function greConflictEntry(record, staging) {
  return {
    evidenceId: 'GRE_CONFLICT:' + (record.sourceConflictId ?? record.stagingId),
    sourceFamily: 'GRE_CONFLICT',
    sourceName: 'GRE source conflict note',
    sourceReference: record.sourceRecord?.relativePath ?? null,
    sourceRepository: staging.sourceSnapshot?.repository ?? null,
    sourceBranch: staging.sourceSnapshot?.branch ?? null,
    sourceCommit: staging.sourceSnapshot?.commit ?? null,
    gameVersion: record.gameVersionAlignment ?? null,
    sdkVersion: null,
    publicationDate: null,
    retrievedAt: record.sourceSnapshot?.retrievedAt ?? staging.sourceSnapshot?.retrievedAt ?? null,
    domain: record.domainCandidates ?? [],
    subject: record.subject ?? null,
    statement: null,
    classification: null,
    sourceVerificationLabel: record.conflictState ?? null,
    verificationStatus: 'CONFLICTING',
    sourceIds: [],
    conflictIds: [record.sourceConflictId].filter(Boolean),
    relatedClaimIds: record.relatedSourceClaimIds ?? [],
    limitations: ['Conflict envelope is not a mechanics claim; linked source claims remain independent.'],
    rawRecord: record
  };
}
function sdkEntry(record, index, triageById = new Map()) {
  const triage = triageById.get(record.stagingId) ?? null;
  const source = record.sourceRecord ?? {};
  const provenance = record.provenance ?? {};
  return {
    evidenceId: 'SDK:' + (record.stagingId ?? index + 1),
    sourceFamily: 'THETOWERSDK_ASSERTION',
    sourceName: pick(source.sourceName, source.name, provenance.sdkPackage, 'TheTowerSDK assertion'),
    sourceReference: pick(source.sourceReference, source.reference, source.url, null),
    sourceRepository: pick(provenance.repository, null),
    sourceBranch: null,
    sourceCommit: pick(provenance.commit, null),
    gameVersion: pick(record.gameVersion, record.gameVersionBuild, source.gameVersion, provenance.gameVersion, null),
    sdkVersion: pick(provenance.sdkVersion, source.sdkVersion, null),
    registryVersion: provenance.registryVersion ?? null,
    sdkGraphVersion: provenance.sdkGraphVersion ?? null,
    sdkSchemaVersion: provenance.sdkSchemaVersion ?? null,
    sdkGraphGeneratedFor: provenance.sdkGraphGeneratedFor ?? null,
    sdkReadAgainstVersion: provenance.sdkReadAgainstVersion ?? null,
    sdkVerifiedAt: provenance.sdkVerifiedAt ?? null,
    publicationDate: pick(provenance.publicationDate, source.publicationDate, null),
    retrievedAt: pick(provenance.retrievedAt, null),
    rawOrigin: provenance.rawOrigin ?? null,
    rawOrigins: provenance.rawOrigins ?? [],
    originMappingStatus: provenance.originMappingStatus ?? null,
    sourceNodeId: record.sourceNodeId ?? null,
    sourceNodeStagingId: record.sourceNodeStagingId ?? null,
    sourceAssertionIndex: record.sourceAssertionIndex ?? null,
    sourceVerificationPresent: record.sourceVerificationPresent ?? false,
    domain: pick(record.domain, record.domainCandidates, []),
    subject: pick(record.subject, record.sourceNodeId, null),
    statement: [record.predicate, textOf(record.value)].filter(Boolean).join(': '),
    classification: record.classificationCandidate ?? null,
    sourceVerificationLabel: pick(record.sourceVerification, record.sourceNodeVerification, null),
    triageDisposition: triage?.disposition ?? null,
    triageIssues: triage?.issues ?? [],
    triageInformational: triage?.informational ?? [],
    manualReviewRequired: triage?.manualReviewRequired ?? null,
    verificationStatus: 'EXTERNAL-UNVERIFIED',
    sourceIds: [pick(source.sourceId, source.id, null)].filter(Boolean),
    sources: [{
      sourceId: pick(source.sourceId, source.id, null),
      sourceName: pick(source.sourceName, source.name, provenance.sdkPackage, 'TheTowerSDK assertion'),
      sourceType: 'UNKNOWN',
      sourceReference: pick(source.sourceReference, source.reference, source.url, null),
      sourceVersion: pick(source.version, provenance.sdkVersion, null),
      gameVersion: pick(record.gameVersion, record.gameVersionBuild, source.gameVersion, provenance.gameVersion, null),
      publicationDate: pick(provenance.publicationDate, source.publicationDate, null),
      retrievedAt: pick(provenance.retrievedAt, null),
      rawSourceRecord: source
    }],
    conflictIds: [],
    limitations: ['SDK triage and source labels do not establish game-mechanics truth.'],
    rawRecord: record
  };
}
function greStructuralEntries(directory) {
  if (!directory) return [];
  const methods = optionalJsonl(path.join(directory, 'gre-methods.jsonl'));
  const types = optionalJsonl(path.join(directory, 'gre-types.jsonl'));
  const memberships = optionalJsonl(path.join(directory, 'gre-domain-memberships.jsonl'));
  const domains = new Map();
  for (const item of memberships) {
    const list = domains.get(item.typeIndex) ?? [];
    list.push(item.domain); domains.set(item.typeIndex, list);
  }
  const source = methods[0] ?? types[0] ?? {};
  const base = {
    sourceName: 'GRE structural metadata',
    sourceReference: 'GRE structural inventory artifact',
    sourceRepository: source.repository ?? null,
    sourceBranch: source.branch ?? null,
    sourceCommit: source.commit ?? null,
    gameVersion: source.gameReleaseVersion ?? null,
    sdkVersion: null, publicationDate: null, retrievedAt: null,
    classification: null, sourceVerificationLabel: null,
    verificationStatus: 'EXTERNAL-UNVERIFIED',
    limitations: ['Declaration metadata only; not proof of method execution, call order, or game mechanics.']
  };
  return [
    ...types.map(type => ({
      ...base, evidenceId: 'GRE_TYPE:' + type.index, sourceFamily: 'GRE_TYPE_DECLARATION',
      subject: type.name, statement: 'Type declaration ' + type.name + ' (' + type.namespace + ')',
      domain: domains.get(type.index) ?? [], sourceIds: [], conflictIds: [], rawRecord: type
    })),
    ...methods.map(method => ({
      ...base, evidenceId: 'GRE_METHOD:' + method.index, sourceFamily: 'GRE_METHOD_DECLARATION',
      subject: method.name, statement: 'Method declaration ' + method.name + ' token ' + method.token +
        ' owner ' + (method.ownerType?.name ?? 'unknown') + ' parameters ' + textOf(method.parameters ?? []),
      domain: domains.get(method.ownerType?.index) ?? [], sourceIds: [], conflictIds: [],
      methodToken: method.token, rawRecord: method
    }))
  ];
}

export function buildEvidenceIndex({ greStaging = null, sdkAssertions = null, sdkTriage = null, greDirectory = null } = {}) {
  const entries = [];
  if (greStaging) {
    if (greStaging.format !== 'SAMANTHA_GKB_GRE_STAGING' || !Array.isArray(greStaging.records))
      throw new Error('Unsupported GRE staging format; expected SAMANTHA_GKB_GRE_STAGING with records.');
    const claims = greStaging.records.filter(x => x.recordKind === 'GRE_CLAIM');
    const conflicts = greStaging.records.filter(x => x.recordKind === 'GRE_CONFLICT');
    const sourceMap = new Map((greStaging.sources ?? []).map(source => [source.sourceId, source]));
    entries.push(...claims.map(x => greClaimEntry(x, greStaging, sourceMap)));
    entries.push(...conflicts.map(x => greConflictEntry(x, greStaging)));
  }
  let sdkTriageSummary = null;
  if (sdkTriage) {
    if (sdkTriage.format !== 'SAMANTHA_GKB_SDK_ASSERTION_TRIAGE' ||
        !Array.isArray(sdkTriage.records) || !sdkTriage.report) {
      throw new Error('Unsupported SDK triage format; expected SAMANTHA_GKB_SDK_ASSERTION_TRIAGE with report and records.');
    }
    const triageById = new Map(sdkTriage.records.map(item => [item.stagingId, item]));
    if (triageById.size !== sdkTriage.records.length) throw new Error('Duplicate SDK triage stagingId.');
    sdkTriageSummary = {
      inputAssertionCount: sdkTriage.report.inputAssertionCount ?? sdkTriage.records.length,
      autoTriagedCount: sdkTriage.report.autoTriagedCount ?? null,
      manualReviewExceptionCount: sdkTriage.report.manualReviewExceptionCount ?? null,
      issueCounts: sdkTriage.report.issueCounts ?? {},
      mechanicsVerificationPerformed: sdkTriage.report.mechanicsVerificationPerformed ?? false,
      canonicalClaimsCreated: sdkTriage.report.canonicalClaimsCreated ?? 0,
      canonicalWrites: sdkTriage.report.canonicalWrites ?? 0
    };
    if (sdkAssertions) {
      if (!Array.isArray(sdkAssertions.records)) throw new Error('SDK assertion input must contain a records array.');
      entries.push(...sdkAssertions.records.map((record, index) => sdkEntry(record, index, triageById)));
    }
  } else if (sdkAssertions) {
    if (!Array.isArray(sdkAssertions.records)) throw new Error('SDK assertion input must contain a records array.');
    entries.push(...sdkAssertions.records.map(sdkEntry));
  }
  entries.push(...greStructuralEntries(greDirectory));
  const ids = new Set();
  for (const entry of entries) {
    if (!entry.evidenceId || ids.has(entry.evidenceId)) throw new Error('Missing or duplicate evidenceId: ' + entry.evidenceId);
    ids.add(entry.evidenceId);
  }
  return {
    format: 'SAMANTHA_GKB_CROSS_SOURCE_EVIDENCE_INDEX',
    formatVersion: 1,
    generatedAt: new Date().toISOString(),
    counts: Object.fromEntries([...new Set(entries.map(x => x.sourceFamily))].sort().map(family =>
      [family, entries.filter(x => x.sourceFamily === family).length])),
    totalEvidenceRecords: entries.length,
    sdkTriageSummary,
    evidenceBoundary: 'Search and source navigation only. No semantic equivalence, mechanic verification, source ranking, canonical claim, approval, or canonical write.',
    entries
  };
}

export function searchEvidence(index, { query = '', sourceFamily = '', domain = '', limit = 100 } = {}) {
  const q = norm(query), family = norm(sourceFamily), d = norm(domain);
  if (!q) return { results: [], message: 'A non-empty query is required.' };
  const results = index.entries.filter(entry => {
    const haystack = norm([
      entry.evidenceId, entry.sourceFamily, entry.sourceName, entry.sourceReference,
      entry.sourceCommit, entry.subject, entry.statement, entry.sourceVerificationLabel,
      entry.gameVersion, entry.sdkVersion, entry.methodToken,
      textOf(entry.domain), textOf(entry.sourceIds), textOf(entry.conflictIds),
      textOf(entry.relatedClaimIds), textOf(entry.triageDisposition), textOf(entry.triageIssues),
      textOf(entry.triageInformational), textOf(entry.manualReviewRequired)
    ].join(' '));
    const familyMatch = !family || norm(entry.sourceFamily).includes(family);
    const domainMatch = !d || (Array.isArray(entry.domain) ? entry.domain : [entry.domain]).some(x => norm(x).includes(d));
    return haystack.includes(q) && familyMatch && domainMatch;
  }).slice(0, Math.max(1, Math.min(500, Number(limit) || 100)));
  return { query, resultCount: results.length, results };
}

export function compareEvidenceConflict(index, conflictId) {
  const conflict = index.entries.find(entry => entry.sourceFamily === 'GRE_CONFLICT' &&
    (entry.evidenceId === conflictId || entry.conflictIds.includes(conflictId)));
  if (!conflict) return { found: false, conflictId };
  const related = new Set(conflict.relatedClaimIds ?? []);
  const claims = index.entries.filter(entry => entry.sourceFamily === 'GRE_CLAIM' &&
    (related.has(entry.rawRecord?.sourceClaimId) || entry.conflictIds.includes(conflictId)));
  return {
    found: true, conflict: { ...conflict, rawRecord: undefined },
    statements: claims.map(entry => ({
      evidenceId: entry.evidenceId, subject: entry.subject, statement: entry.statement,
      sourceIds: entry.sourceIds, sources: entry.sources ?? [], sourceVerificationLabel: entry.sourceVerificationLabel,
      verificationStatus: entry.verificationStatus, sourceReference: entry.sourceReference,
      gameVersion: entry.gameVersion, publicationDate: entry.publicationDate,
      retrievedAt: entry.retrievedAt, limitations: entry.limitations
    })),
    comparisonPolicy: 'Statements and source references are displayed independently. No source is ranked and no winner is selected.'
  };
}

function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (!key.startsWith('--')) throw new Error('Unexpected argument: ' + key);
    const name = key.slice(2);
    const value = args[++i];
    if (!value || value.startsWith('--')) throw new Error('Missing value for ' + key);
    options[name] = value;
  }
  return options;
}
function main() {
  const [command, ...args] = process.argv.slice(2);
  const options = parseArgs(args);
  const index = buildEvidenceIndex({
    greStaging: optionalJson(options['gre-staging']),
    sdkAssertions: optionalJson(options['sdk-assertions']),
    sdkTriage: optionalJson(options['sdk-triage']),
    greDirectory: options['gre-dir'] ?? null
  });
  if (command === 'build') {
    if (!options.out) throw new Error('build requires --out <index.json>');
    fs.writeFileSync(options.out, JSON.stringify(index, null, 2) + '\n');
    console.log(JSON.stringify({ status: 'PASSED', output: options.out, counts: index.counts, totalEvidenceRecords: index.totalEvidenceRecords, canonicalWrites: 0 }, null, 2));
  } else if (command === 'search') {
    const result = searchEvidence(index, { query: options.query ?? '', sourceFamily: options.source ?? '', domain: options.domain ?? '' });
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'compare') {
    console.log(JSON.stringify(compareEvidenceConflict(index, options.conflict ?? ''), null, 2));
  } else throw new Error('Commands: build --out index.json [--gre-staging file] [--sdk-assertions file] [--sdk-triage file] [--gre-dir artifact-dir] | search --query text [--source family] [--domain domain] [input flags] | compare --conflict ID [input flags]');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (error) { console.error(JSON.stringify({ status: 'FAILED', error: error.message }, null, 2)); process.exitCode = 1; }
}
