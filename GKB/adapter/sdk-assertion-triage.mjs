/**
 * Samantha GKB — SDK assertion triage.
 *
 * Performs deterministic structural/provenance triage without deciding whether
 * a game-mechanics assertion is true. Every source assertion is preserved.
 * Only exceptional records enter the manual exception queue; all other records
 * remain EXTERNAL-UNVERIFIED and are not canonical claims.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = path.join(ROOT, 'staging/sdk-assertions.json');
const OUTPUT = path.join(ROOT, 'staging/sdk-assertion-triage.json');
const QUEUE_OUTPUT = path.join(ROOT, 'staging/sdk-assertion-manual-review-queue.json');

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isValidDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

function inspectRecord(record, index, duplicateIds) {
  const issues = [];
  const informational = [];
  const id = typeof record?.stagingId === 'string' && record.stagingId ? record.stagingId : `record-${index + 1}`;

  if (!isObject(record)) {
    return { stagingId: id, sourceNodeStagingId: null, disposition: 'REVIEW_REQUIRED',
      manualReviewRequired: true, issues: ['RECORD_NOT_OBJECT'], informational, verificationStatus: 'EXTERNAL-UNVERIFIED' };
  }
  if (duplicateIds.has(id)) issues.push('DUPLICATE_STAGING_ID');
  for (const key of ['stagingId','sourceNodeStagingId','sourceNodeId','subject','predicate']) {
    if (typeof record[key] !== 'string' || !record[key].trim()) issues.push(`MISSING_OR_INVALID_${key.replace(/[A-Z]/g, x => '_' + x).toUpperCase()}`);
  }
  if (!Object.hasOwn(record, 'value')) issues.push('MISSING_VALUE_FIELD');
  if (!isObject(record.sourceRecord)) issues.push('SOURCE_RECORD_NOT_OBJECT');
  if (!isObject(record.provenance)) issues.push('PROVENANCE_NOT_OBJECT');
  else {
    if (record.provenance.sdkPackage !== 'thetowersdk' || record.provenance.sdkVersion !== '0.14.1') issues.push('SDK_IDENTITY_UNEXPECTED');
    if (!isValidDate(record.provenance.retrievedAt)) issues.push('RETRIEVAL_DATE_INVALID');
    const originStatus = record.provenance.originMappingStatus;
    if (originStatus === 'INVALID_OR_MISSING') issues.push('SOURCE_ORIGIN_MISSING_OR_INVALID');
    else if (originStatus === 'UNRESOLVED') issues.push('SOURCE_ORIGIN_UNRESOLVED');
    else if (originStatus !== 'UNMAPPED_REQUIRES_REVIEW') issues.push('SOURCE_ORIGIN_STATUS_UNKNOWN');
  }

  const sourceVerification = String(record.sourceVerification ?? '').toLowerCase();
  const nodeVerification = String(record.sourceNodeVerification ?? '').toLowerCase();
  if (sourceVerification === 'contradicted' || nodeVerification === 'contradicted') {
    issues.push('SOURCE_MARKS_ASSERTION_OR_NODE_CONTRADICTED');
  } else if (sourceVerification && !['verified_here','unverified'].includes(sourceVerification)) {
    issues.push('UNKNOWN_SOURCE_VERIFICATION_LABEL');
  } else if (!record.sourceVerificationPresent) {
    informational.push('ASSERTION_VERIFICATION_MISSING_PRESERVED_AS_EXTERNAL_UNVERIFIED');
  }
  if (!['OBJECTIVE','SENTIMENT'].includes(record.classificationCandidate)) {
    issues.push('CLASSIFICATION_CANDIDATE_UNMAPPED');
  }

  return {
    stagingId: id,
    sourceNodeStagingId: record.sourceNodeStagingId ?? null,
    sourceNodeId: record.sourceNodeId ?? null,
    disposition: issues.length ? 'REVIEW_REQUIRED' : 'STRUCTURE_VALIDATED_EXTERNAL_UNVERIFIED',
    manualReviewRequired: issues.length > 0,
    issues,
    informational,
    verificationStatus: 'EXTERNAL-UNVERIFIED',
    canonicalPromotion: false
  };
}

export function triageSdkAssertions(records) {
  if (!Array.isArray(records)) throw new TypeError('records must be an array');
  const counts = new Map();
  for (const record of records) {
    const id = record?.stagingId;
    if (typeof id === 'string' && id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const duplicates = new Set([...counts].filter(([, count]) => count > 1).map(([id]) => id));
  const results = records.map((record, index) => inspectRecord(record, index, duplicates));
  const manualReviewQueue = results.filter(item => item.manualReviewRequired);
  const groups = new Map();
  for (const item of results) {
    const key = item.sourceNodeStagingId ?? 'UNLINKED';
    const group = groups.get(key) ?? { sourceNodeStagingId: key, assertionCount: 0, exceptionCount: 0 };
    group.assertionCount++;
    if (item.manualReviewRequired) group.exceptionCount++;
    groups.set(key, group);
  }
  const issueCounts = {};
  for (const item of manualReviewQueue) for (const issue of item.issues) issueCounts[issue] = (issueCounts[issue] ?? 0) + 1;

  return {
    report: {
      format: 'SAMANTHA_GKB_SDK_ASSERTION_TRIAGE',
      formatVersion: 1,
      status: 'PASSED',
      inputAssertionCount: records.length,
      autoTriagedCount: results.length - manualReviewQueue.length,
      manualReviewExceptionCount: manualReviewQueue.length,
      groupedNodeCount: groups.size,
      missingVerificationIsManualException: false,
      missingVerificationPolicy: 'Preserve as EXTERNAL-UNVERIFIED; do not inherit parent node verification.',
      mechanicsVerificationPerformed: false,
      canonicalClaimsCreated: 0,
      automaticApprovals: 0,
      canonicalWrites: 0,
      issueCounts
    },
    records: results,
    nodeGroups: [...groups.values()],
    manualReviewQueue
  };
}

function main() {
  const input = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  if (!Array.isArray(input.records)) throw new Error('SDK assertion staging input has no records array');
  const result = triageSdkAssertions(input.records);
  fs.writeFileSync(OUTPUT, JSON.stringify({ generatedAt: new Date().toISOString(), ...result }, null, 2) + '\n');
  fs.writeFileSync(QUEUE_OUTPUT, JSON.stringify({
    format: 'SAMANTHA_GKB_SDK_ASSERTION_MANUAL_EXCEPTION_QUEUE',
    formatVersion: 1,
    policy: 'Only structural/provenance/classification exceptions are queued. Queue membership is not a judgment that other mechanics are true.',
    records: result.manualReviewQueue
  }, null, 2) + '\n');
  console.log(JSON.stringify(result.report, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (error) {
    console.error(JSON.stringify({ status: 'FAILED', error: error.message }, null, 2));
    process.exitCode = 1;
  }
}
