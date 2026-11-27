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
 * - Calendar date validation.
 * - Preservation of original adapter output.
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
  ADAPTER_POLICY,
  mapOrigin,
  validateSourceOriginRecord
} from './origin-mapping.mjs';

const VERSION = '1.0.2';
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

/**
 * Validate a real calendar date in YYYY-MM-DD format.
 */
function isValidCalendarDate(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

async function main() {
  const manifest = JSON.parse(
    await readFile(RUNTIME_MANIFEST, 'utf8')
  );

  assert(
    manifest.dependencies?.ajv === EXPECTED_AJV_VERSION,
    `Expected ajv@${EXPECTED_AJV_VERSION}`
  );

  // Resolve AJV from GKB/runtime/package.json.
  // This avoids the sibling-directory ESM resolution problem.
  const require = createRequire(RUNTIME_MANIFEST);

  const AjvModule = require('ajv/dist/2020.js');
  const Ajv2020 = AjvModule.default ?? AjvModule;

  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    allowUnionTypes: true,
    validateFormats: true
  });

  // Register strict calendar-date validation.
  ajv.addFormat('date', {
    type: 'string',
    validate: isValidCalendarDate
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

  /**
   * Run both validators without modifying the input.
   */
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

  /**
   * Assert both validators agree on validity.
   */
  function checkConsistency(name, result) {
    check(
      `${name}: runtime and JSON Schema agree`,
      result.runtime === result.jsonSchema,
      {
        runtimeValid: result.runtime,
        jsonSchemaValid: result.jsonSchema
      }
    );
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

  checkConsistency(
    'unresolved origin',
    unresolvedResult
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

  checkConsistency(
    'unknown origin',
    unknownResult
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

  checkConsistency(
    'approved mapping',
    approvedResult
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

  checkConsistency(
    'missing origin',
    missingResult
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

  checkConsistency(
    'invalid mapped record',
    invalidMappedResult
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

  checkConsistency(
    'invalid unmapped record',
    invalidUnmappedResult
  );

  // 7. Required fields must exist.
  const missingField = {
    ...unresolved
  };

  delete missingField.originRaw;

  const missingFieldResult = validateBoth(missingField);

  check(
    'record missing required field is rejected',
    !missingFieldResult.runtime &&
    !missingFieldResult.jsonSchema
  );

  checkConsistency(
    'missing required field',
    missingFieldResult
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

  checkConsistency(
    'invalid sourceType',
    invalidSourceTypeResult
  );

  // 9. Invalid calendar date must be rejected.
  const invalidDate = {
    ...approved,
    mappingEvidence: {
      ...approved.mappingEvidence,
      reviewedAt: '2026-02-30'
    }
  };

  const invalidDateResult = validateBoth(invalidDate);

  check(
    'invalid calendar date is rejected',
    !invalidDateResult.runtime &&
    !invalidDateResult.jsonSchema
  );

  checkConsistency(
    'invalid calendar date',
    invalidDateResult
  );

  // 10. Whitespace-only mapping reference must be rejected.
  const whitespaceReference = {
    ...approved,
    mappingEvidence: {
      ...approved.mappingEvidence,
      reference: '   '
    }
  };

  const whitespaceReferenceResult = validateBoth(whitespaceReference);

  check(
    'whitespace-only evidence reference is rejected',
    !whitespaceReferenceResult.runtime &&
    !whitespaceReferenceResult.jsonSchema
  );

  checkConsistency(
    'whitespace-only evidence reference',
    whitespaceReferenceResult
  );

  // 11. Whitespace-only mapping reason must be rejected.
  const whitespaceReason = {
    ...approved,
    mappingEvidence: {
      ...approved.mappingEvidence,
      reason: '   '
    }
  };

  const whitespaceReasonResult = validateBoth(whitespaceReason);

  check(
    'whitespace-only evidence reason is rejected',
    !whitespaceReasonResult.runtime &&
    !whitespaceReasonResult.jsonSchema
  );

  checkConsistency(
    'whitespace-only evidence reason',
    whitespaceReasonResult
  );

  // 12. Optional upstream fields must retain their declared types.
  const invalidUpstream = {
    ...unresolved,
    upstream: {
      ...unresolved.upstream,
      version: 14
    }
  };

  const invalidUpstreamResult = validateBoth(invalidUpstream);

  check(
    'invalid upstream field type is rejected',
    !invalidUpstreamResult.runtime &&
    !invalidUpstreamResult.jsonSchema
  );

  checkConsistency(
    'invalid upstream field type',
    invalidUpstreamResult
  );

  // 13. Original adapter output remains unchanged.
  const original = JSON.stringify(unresolved);

  validateBoth(unresolved);

  check(
    'validation does not modify adapter output',
    JSON.stringify(unresolved) === original
  );

  // 14. Adapter policy explicitly disables unsafe operations.
  check(
    'adapter policy disables bulk import and automatic normalization',
    ADAPTER_POLICY.bulkImportAllowed === false &&
    ADAPTER_POLICY.automaticNormalization === false,
    {
      bulkImportAllowed: ADAPTER_POLICY.bulkImportAllowed,
      automaticNormalization: ADAPTER_POLICY.automaticNormalization
    }
  );

  const report = {
    test: 'Samantha GKB Origin Mapping Schema Integration',
    testVersion: VERSION,
    status: 'PASSED',
    validator: {
      package: 'ajv',
      expectedVersion: EXPECTED_AJV_VERSION,
      dialect: 'Draft 2020-12',
      dateFormatValidation: true
    },
    schema: 'source-origin.schema.json',
    adapter: 'origin-mapping.mjs',
    checkCount: checks.length,
    checks,
    automaticNormalization: ADAPTER_POLICY.automaticNormalization,
    originalValuesPreserved: true,
    bulkImportAllowed: ADAPTER_POLICY.bulkImportAllowed
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
