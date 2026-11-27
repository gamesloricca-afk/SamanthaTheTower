import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';

const schema = JSON.parse(await readFile(new URL('../schema/claim.schema.json', import.meta.url), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: false });
const validate = ajv.compile(schema);

const valid = {
  claimId: 'GKB-TEST-001',
  domain: 'Combat Mechanics',
  subject: 'Example mechanic',
  claim: 'A sample community-reported claim.',
  classification: 'OBJECTIVE',
  verificationStatus: 'EXTERNAL-UNVERIFIED',
  applicableGameVersion: null,
  provenance: [{
    sourceType: 'COMMUNITY',
    sourceName: 'Example fan source',
    sourceReference: 'https://example.invalid/reference',
    sourceVersion: null,
    publicationDate: null,
    retrievedAt: '2026-11-27',
    evidence: 'Sample source statement',
    limitations: ['Test fixture only']
  }],
  unknownUpstreamField: { keep: true }
};

assert.equal(validate(valid), true, JSON.stringify(validate.errors));
assert.equal(valid.unknownUpstreamField.keep, true);

for (const status of ['VERIFIED', 'USER-PROVIDED', 'EXTERNAL-UNVERIFIED', 'HYPOTHESIS', 'CONFLICTING', 'SUPERSEDED']) {
  assert.equal(validate({ ...valid, verificationStatus: status }), true, status);
}
assert.equal(validate({ ...valid, classification: 'UNDECIDED' }), false);
assert.equal(validate({ ...valid, verificationStatus: 'REPORTED' }), false);
assert.equal(validate({ ...valid, provenance: [] }), false);
assert.equal(validate({ ...valid, claimId: undefined }), false);

const relationship = {
  ...valid,
  relationships: [{ type: 'SCALES', targetClaimId: 'GKB-TEST-002', verificationStatus: 'HYPOTHESIS' }]
};
assert.equal(validate(relationship), true, JSON.stringify(validate.errors));

console.log(JSON.stringify({
  test: 'Samantha GKB Canonical Claim Schema',
  status: 'PASSED',
  cases: 13,
  supportedVerificationStatuses: 6,
  unknownFieldsPreserved: true
}, null, 2));
