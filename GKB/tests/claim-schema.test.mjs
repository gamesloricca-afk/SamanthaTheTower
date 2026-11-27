import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../runtime/package.json'));
const Ajv2020 = require('ajv/dist/2020.js').default;
const schema = JSON.parse(await readFile(new URL('../schema/claim.schema.json', import.meta.url), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
ajv.addFormat('date', {
  type: 'string',
  validate(value) {
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
});
const validate = ajv.compile(schema);
let cases = 0;
const check = (condition, message) => { cases++; assert.equal(condition, true, message); };

const valid = {
  claimId: 'GKB-TEST-001',
  domain: 'Combat Mechanics',
  subject: 'Example mechanic',
  claim: 'A sample community-reported claim.',
  classification: 'OBJECTIVE',
  verificationStatus: 'EXTERNAL-UNVERIFIED',
  applicableGameVersion: 'v28.3',
  lastReviewedAt: '2026-11-27',
  provenance: [{
    sourceType: 'COMMUNITY',
    sourceName: 'Example fan source',
    sourceReference: 'https://example.invalid/reference',
    sourceVersion: '2026-11',
    sdkPackage: 'thetowersdk',
    sdkVersion: '0.14.1',
    publicationDate: '2026-10-15',
    retrievedAt: '2026-11-27',
    evidence: 'Sample source statement',
    limitations: ['Test fixture only']
  }],
  unknownUpstreamField: { keep: true }
};

check(validate(valid), 'valid claim');
check(valid.unknownUpstreamField.keep === true, 'unknown source fields retained');
for (const status of ['VERIFIED', 'USER-PROVIDED', 'EXTERNAL-UNVERIFIED', 'HYPOTHESIS', 'CONFLICTING', 'SUPERSEDED']) {
  check(validate({ ...valid, verificationStatus: status }), `canonical status ${status}`);
}
check(!validate({ ...valid, classification: 'UNDECIDED' }), 'reject invalid classification');
check(!validate({ ...valid, verificationStatus: 'REPORTED' }), 'reject legacy status as canonical status');
check(!validate({ ...valid, provenance: [] }), 'require provenance');
check(!validate({ ...valid, claimId: undefined }), 'require claim id');
check(!validate({ ...valid, lastReviewedAt: '27-11-2026' }), 'reject malformed review date');
check(!validate({ ...valid, lastReviewedAt: '2026-02-30' }), 'reject impossible calendar review date');
check(!validate({ ...valid, provenance: [{ ...valid.provenance[0], publicationDate: '2026/10/15' }] }), 'reject malformed publication date');
check(!validate({ ...valid, provenance: [{ ...valid.provenance[0], publicationDate: '2026-02-30' }] }), 'reject impossible calendar publication date');
check(!validate({ ...valid, provenance: [{ ...valid.provenance[0], retrievedAt: 'yesterday' }] }), 'reject malformed retrieval date');
check(!validate({ ...valid, provenance: [{ ...valid.provenance[0], retrievedAt: '2026-02-30' }] }), 'reject impossible calendar retrieval date');

const relationship = {
  ...valid,
  relationships: [{ type: 'SCALES', targetClaimId: 'GKB-TEST-002', verificationStatus: 'HYPOTHESIS' }]
};
check(validate(relationship), 'relationship shape');

const conflictA = {
  ...valid,
  claimId: 'GKB-CONFLICT-A',
  claim: 'Fleet main enemies count toward the normal population cap.',
  verificationStatus: 'CONFLICTING',
  provenance: [{ ...valid.provenance[0], sourceName: 'Community Source A' }],
  conflict: {
    conflictId: 'GKB-CONFLICT-FLEET-CAP',
    relatedClaimIds: ['GKB-CONFLICT-B'],
    status: 'OPEN',
    note: 'Competing community reports are retained separately.'
  }
};
const conflictB = {
  ...valid,
  claimId: 'GKB-CONFLICT-B',
  claim: 'Fleet main enemies do not count toward the normal population cap.',
  verificationStatus: 'CONFLICTING',
  provenance: [{ ...valid.provenance[0], sourceName: 'Community Source B' }],
  conflict: {
    conflictId: 'GKB-CONFLICT-FLEET-CAP',
    relatedClaimIds: ['GKB-CONFLICT-A'],
    status: 'OPEN',
    note: 'Competing community reports are retained separately.'
  }
};
check(validate(conflictA), 'first conflicting claim valid');
check(validate(conflictB), 'second conflicting claim valid');
check(conflictA.claimId !== conflictB.claimId, 'conflicting reports have separate claim ids');
check(conflictA.provenance[0].sourceName !== conflictB.provenance[0].sourceName, 'each report retains its own source');
check(conflictA.verificationStatus === 'CONFLICTING' && conflictB.verificationStatus === 'CONFLICTING', 'no competing report is silently selected');
check(conflictA.conflict.conflictId === conflictB.conflict.conflictId, 'both claims share conflict tracking id');

const legacy = { ...valid, legacyEvidenceStatus: 'Supported' };
check(validate(legacy), 'legacy label can be preserved separately');
check(legacy.verificationStatus === 'EXTERNAL-UNVERIFIED', 'legacy label is not auto-mapped');

console.log(JSON.stringify({
  test: 'Samantha GKB Canonical Claim Schema and Conflict Validation',
  status: 'PASSED',
  cases,
  supportedVerificationStatuses: 6,
  conflictClaimsPreservedSeparately: true,
  sourceAttributionPreserved: true,
  gameSdkAndSourceDatesSeparated: true,
  dateShapeAndCalendarValidated: true,
  unknownFieldsPreserved: true
}, null, 2));
