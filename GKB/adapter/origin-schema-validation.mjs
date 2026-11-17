#!/usr/bin/env node

/**
 * Samantha GKB — Origin Mapping / JSON Schema Integration Test
 *
 * Version: 1.0.1
 * Target SDK: thetowersdk@0.14.1
 * Validator: ajv@8.17.1
 *
 * Tests:
 * - Adapter output against Samantha source-origin JSON Schema.
 * - Runtime validator and JSON Schema consistency.
 * - Approved and unresolved mapping behavior.
 * - Rejection of inconsistent records.
 *
 * Safety:
 * - No source data modification.
 * - No automatic normalization.
 * - No bulk import.
 */

import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  mapOrigin,
  validateSourceOriginRecord
} from './origin-mapping.mjs';

const VERSION = '1.0.1';
const EXPECTED_AJV_VERSION = '8.17.1';

const HERE = dirname(fileURLToPath(import.meta.url));

const SCHEMA_PATH = resolve(
  HERE,
  '../schema/source-origin.schema.json'
);

const RUNTIME_MANIFEST = resolve(
  HERE,
  '../runtime/package.json'
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const manifest = JSON.parse(
    await readFile(RUNTIME_MANIFEST, 'utf8')
  );

  assert(
    manifest.dependencies?.ajv === EXPECTED_AJV_VERSION,
    `Expected ajv@${EXPECTED_AJV_VERSION}`
  );

  const require = createRequire(RUNTIME_MANIFEST);

  const AjvModule = require('ajv/dist/2020.js');
  const Ajv2020 = AjvModule.default ?? AjvModule;

  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    allowUnionTypes: true,
    validateFormats: false
  });

  const schema = JSON.parse(
    await readFile(SCHEMA_PATH, 'utf8')
  );

  const validateSchema = ajv.compile(schema);

  const checks = [];

  function check(name, condition, details = null) {
    assert(condition, `FAILED: ${name}`);

    checks.push({
      name,
      status: 'PASSED',
      ...(details ? { details } : {})
    });
  }

  function validateBoth(record) {
    const runtime = validateSourceOriginRecord(record);
    const jsonSchema = validateSchema(record);

    return {
      runtime: runtime.valid,
      runtimeErrors: runtime.errors,
      jsonSchema,
      schemaErrors: (validateSchema.errors ?? []).map(error => ({
        instancePath: error.instancePath,
        schemaPath: error.schemaPath,
        keyword: error.keyword,
        message: error.message
      }))
    };
  }

  // 1. Unresolved upstream origin.
  const unresolved = mapOrigin({
    origin: 'game'
  });

  const unresolvedResult = validateBoth(unresolved);

  check(
    'game unresolved record passes both validators',
    unresolvedResult.runtime &&
    unresolvedResult.jsonSchema
  );

  // 2. Unknown origin remains preserved.
  const unknown = mapOrigin({
    origin: 'future-origin'
  });

  const unknownResult = validateBoth(unknown);

  check(
    'unknown origin passes both validators',
    unknown.originRaw === 'future-origin' &&
    unknownResult.runtime &&
    unknownResult.jsonSchema
  );

  // 3. Explicitly approved mapping.
  const approved = mapOrigin({
    origin: 'wiki',
    mappings: {
      wiki: {
        sourceType: 'COMMUNITY',
        approved: true,
        reference: 'GKB-ORIGIN-REVIEW-001',
        reason: 'Explicitly reviewed source classification.',
        reviewedAt: '2026-11-17'
      }
    }
  });

  const approvedResult = validateBoth(approved);

  check(
    'approved mapping passes both validators',
    approved.mappingStatus === 'MAPPED' &&
    approvedResult.runtime &&
    approvedResult.jsonSchema
  );

  // 4. Missing origin.
  const missing = mapOrigin({
    hasOrigin: false
  });

  const missingResult = validateBoth(missing);

  check(
    'missing origin record passes both validators',
    missingResult.runtime &&
    missingResult.jsonSchema
  );

  // 5. Invalid mapped record must be rejected.
  const invalidMapped = {
    ...approved,
    mappingEvidence: {
      ...approved.mappingEvidence,
      reviewStatus: 'PENDING'
    }
  };

  const invalidMappedResult = validateBoth(invalidMapped);

  check(
    'mapped record without approved evidence is rejected',
    !invalidMappedResult.runtime &&
    !invalidMappedResult.jsonSchema
  );

  // 6. Unmapped record cannot claim a source type.
  const invalidUnmapped = {
    ...unknown,
    sourceType: 'COMMUNITY'
  };

  const invalidUnmappedResult = validateBoth(invalidUnmapped);

  check(
    'unmapped record with sourceType is rejected',
    !invalidUnmappedResult.runtime &&
    !invalidUnmappedResult.jsonSchema
  );

  // 7. Required fields must exist.
  const missingField = {
    ...unresolved
  };

  delete missingField.originRaw;

  const missingFieldResult = validateBoth(missingField);

  check(
    'record missing required field is rejected',
    !missingFieldResult.jsonSchema
  );

  // 8. Invalid source type must be rejected.
  const invalidSourceType = {
    ...unresolved,
    sourceType: 'UNRECOGNIZED'
  };

  const invalidSourceTypeResult = validateBoth(
    invalidSourceType
  );

  check(
    'unknown sourceType is rejected',
    !invalidSourceTypeResult.runtime &&
    !invalidSourceTypeResult.jsonSchema
  );

  // 9. Original adapter output remains unchanged.
  const original = JSON.stringify(unresolved);

  validateBoth(unresolved);

  check(
    'validation does not modify adapter output',
    JSON.stringify(unresolved) === original
  );

  // 10. Record the declared safety policy without claiming a runtime test.
  const bulkImportAllowed = false;

  check(
    'bulk import policy is declared disabled',
    bulkImportAllowed === false,
    {
      bulkImportAllowed,
      verification: 'DECLARATION_ONLY'
    }
  );

  const report = {
    test: 'Samantha GKB Origin Mapping Schema Integration',
    testVersion: VERSION,
    status: 'PASSED',
    validator: {
      package: 'ajv',
      expectedVersion: EXPECTED_AJV_VERSION,
      dialect: 'Draft 2020-12'
    },
    schema: 'source-origin.schema.json',
    adapter: 'origin-mapping.mjs',
    checkCount: checks.length,
    checks,
    automaticNormalization: false,
    originalValuesPreserved: true,
    bulkImportAllowed,
    limitations: [
      'Bulk import is recorded as a declared policy, not verified by runtime inspection.'
    ]
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch(error => {
  console.error(JSON.stringify({
    test: 'Samantha GKB Origin Mapping Schema Integration',
    testVersion: VERSION,
    status: 'FAILED',
    error: error.message
  }, null, 2));

  process.exitCode = 1;
});
