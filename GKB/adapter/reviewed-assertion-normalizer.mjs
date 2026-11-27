/**
 * Samantha GKB — reviewed assertion normalizer.
 * Requires explicit Samantha review input; never promotes SDK records automatically.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'runtime/package.json'));
const Ajv2020 = require('ajv/dist/2020.js').default;
const claimSchema = JSON.parse(require('node:fs').readFileSync(path.join(ROOT, 'schema/claim.schema.json'), 'utf8'));
const validateClaim = new Ajv2020({ allErrors: true, strict: true, validateFormats: false }).compile(claimSchema);
const clone = value => JSON.parse(JSON.stringify(value));

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function buildCanonicalClaimFromReviewedAssertion(stagingRecord, sourceNodeRecord, review) {
  if (!stagingRecord || stagingRecord.recordKind !== 'SDK_GRAPH_ASSERTION_ENVELOPE') {
    throw new TypeError('A valid SDK assertion staging record is required');
  }
  if (!review || typeof review !== 'object' || review.decision !== 'APPROVE') {
    throw new Error('Explicit Samantha review decision APPROVE is required');
  }
  const requiredStrings = ['claimId','domain','subject','claim'];
  for (const key of requiredStrings) {
    if (typeof review[key] !== 'string' || review[key].trim().length === 0) {
      throw new TypeError(`review.${key} must be a non-empty string`);
    }
  }
  if (!['OBJECTIVE','SENTIMENT'].includes(review.classification)) {
    throw new TypeError('review.classification must be OBJECTIVE or SENTIMENT');
  }
  if (!isValidDate(review.reviewedAt)) {
    throw new TypeError('review.reviewedAt must be a valid YYYY-MM-DD calendar date');
  }
  const retrievedAt = stagingRecord.provenance?.retrievedAt;
  if (!isValidDate(retrievedAt)) {
    throw new TypeError('stagingRecord provenance retrievedAt is missing or invalid');
  }

  const verificationStatus = review.verificationStatus ?? 'EXTERNAL-UNVERIFIED';
  const allowedStatuses = ['VERIFIED','USER-PROVIDED','EXTERNAL-UNVERIFIED','HYPOTHESIS','CONFLICTING','SUPERSEDED'];
  if (!allowedStatuses.includes(verificationStatus)) {
    throw new TypeError('review.verificationStatus is not a canonical status');
  }
  if (verificationStatus === 'VERIFIED' && !(typeof review.evidence === 'string' && review.evidence.trim())) {
    throw new Error('VERIFIED requires explicit review evidence');
  }
  if (verificationStatus === 'CONFLICTING' && !review.conflict) {
    throw new Error('CONFLICTING requires explicit conflict metadata');
  }

  const sdkProvenance = stagingRecord.provenance;
  const sourceReference = review.sourceReference ??
    sdkProvenance.sdkSourceReference ??
    sdkProvenance.sourceReference ??
    'thetowersdk/knowledge-graph.json';

  const provenance = {
    sourceType: review.sourceType ?? 'UNKNOWN',
    sourceName: review.sourceName ?? 'TheTowerSDK Knowledge Graph',
    sourceReference,
    sourceVersion: review.sourceVersion ?? null,
    sdkPackage: sdkProvenance.sdkPackage,
    sdkVersion: sdkProvenance.sdkVersion,
    publicationDate: review.publicationDate ?? null,
    retrievedAt,
    evidence: review.evidence ?? null,
    limitations: Array.isArray(review.provenanceLimitations) ? clone(review.provenanceLimitations) : [],
    registryVersion: sdkProvenance.registryVersion,
    sdkGraphReference: sdkProvenance.sourceReference,
    sdkGraphVersion: sdkProvenance.sdkGraphVersion,
    sdkSchemaVersion: sdkProvenance.sdkSchemaVersion,
    sdkGraphGeneratedFor: sdkProvenance.sdkGraphGeneratedFor,
    sdkSourceReference: sdkProvenance.sdkSourceReference,
    sdkReadAgainstVersion: sdkProvenance.sdkReadAgainstVersion,
    sdkVerifiedAt: sdkProvenance.sdkVerifiedAt,
    rawOrigin: clone(sdkProvenance.rawOrigin),
    rawOrigins: clone(sdkProvenance.rawOrigins),
    originMappingStatus: sdkProvenance.originMappingStatus
  };

  const claim = {
    claimId: review.claimId,
    domain: review.domain,
    subject: review.subject,
    claim: review.claim,
    classification: review.classification,
    verificationStatus,
    applicableGameVersion: review.applicableGameVersion ?? null,
    lastReviewedAt: review.reviewedAt,
    provenance: [provenance],
    relatedClaims: Array.isArray(review.relatedClaims) ? clone(review.relatedClaims) : [],
    relationships: Array.isArray(review.relationships) ? clone(review.relationships) : [],
    limitations: [
      'Created only after explicit Samantha review approval.',
      'SDK verification labels remain in sourceRecord and are not automatically mapped.',
      'Game version and source version are only populated from explicit review input.',
      ...(Array.isArray(review.limitations) ? clone(review.limitations) : [])
    ],
    sourceRecord: {
      sourceAssertion: clone(stagingRecord.sourceRecord),
      sourceNode: sourceNodeRecord ? clone(sourceNodeRecord) : null,
      stagingEnvelope: clone(stagingRecord),
      reviewDecision: clone(review)
    }
  };
  if (review.conflict) claim.conflict = clone(review.conflict);
  if (Array.isArray(review.supersedesClaimIds)) claim.supersedesClaimIds = clone(review.supersedesClaimIds);

  const valid = validateClaim(claim);
  if (!valid) {
    const error = new Error('Canonical claim schema validation failed');
    error.validationErrors = (validateClaim.errors ?? []).map(item => ({
      instancePath: item.instancePath,
      keyword: item.keyword,
      message: item.message
    }));
    throw error;
  }
  return claim;
}
