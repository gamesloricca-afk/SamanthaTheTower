/**
 * Samantha GKB — Source Origin Schema Integration Test
 *
 * Version: 1.0.2
 * Target SDK: thetowersdk@0.14.1
 *
 * Validates adapter output against Samantha's source-origin JSON Schema.
 * This test does not normalize SDK origins or import game claims.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.resolve(
  HERE,
  '../schema/source-origin.schema.json'
);
const ADAPTER_PATH = path.resolve(
  HERE,
  './origin-mapping.mjs'
);

function isRealDate(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const schema = JSON.parse(
    await readFile(SCHEMA_PATH, 'utf8')
  );

  const {
    mapOrigin,
    validateSourceOriginRecord
  } = await import(ADAPTER_PATH);

  const ajv = new Ajv2020({
    allErrors: true,
    strict: true
  });

  // Validate the JSON Schema "date" format without another dependency.
  ajv.addFormat('date', {
    type: 'string',
    validate: isRealDate
  });

  const validate = ajv.compile(schema);

  const cases = [
    {
      name: 'unresolved upstream game origin',
      record: mapOrigin({ origin: 'game' }),
      expectedValid: true
    },
    {
      name: 'unknown origin preserved for review',
      record: mapOrigin({ origin: 'future-origin' }),
      expectedValid: true
    },
    {
      name: 'missing origin explicitly classified',
      record: mapOrigin({ hasOrigin: false }),
      expectedValid: true
    },
    {
      name: 'approved mapping with evidence',
      record: mapOrigin({
        origin: 'wiki',
        mappings: {
          wiki: {
            sourceType: 'COMMUNITY',
            approved: true,
            reference: 'GKB-ORIGIN-REVIEW-TEST',
            reason: 'Explicit schema integration test fixture.',
            reviewedAt: '2026-11-17'
          }
        }
      }),
      expectedValid: true
    },
    {
      name: 'reject mapped record without approval evidence',
      record: {
        sourceType: 'COMMUNITY',
        originRaw: 'wiki',
        mappingStatus: 'MAPPED',
        mappingEvidence: {
          reference: 'test',
          reason: 'Missing approved status',
          reviewedAt: '2026-11-17',
          reviewStatus: 'PENDING'
        },
        upstream: null
      },
      expectedValid: false
    },
    {
      name: 'reject unmapped record carrying a source type',
      record: {
        sourceType: 'COMMUNITY',
        originRaw: 'future-origin',
        mappingStatus: 'UNMAPPED_REQUIRES_REVIEW',
        mappingEvidence: null,
        upstream: null
      },
      expectedValid: false
    },
    {
      name: 'reject invalid calendar date in evidence',
      record: {
        sourceType: 'COMMUNITY',
        originRaw: 'wiki',
        mappingStatus: 'MAPPED',
        mappingEvidence: {
          reference: 'test',
          reason: 'Invalid date fixture',
          reviewedAt: '2026-02-30',
          reviewStatus: 'APPROVED'
        },
        upstream: null
      },
      expectedValid: false
    }
  ];

  const results = [];

  for (const testCase of cases) {
    const valid = Boolean(validate(testCase.record));

    assert(
      valid === testCase.expectedValid,
      `Unexpected schema result for "${testCase.name}": ` +
      `expected ${testCase.expectedValid}, got ${valid}. ` +
      JSON.stringify(validate.errors ?? [])
    );

    const runtime = validateSourceOriginRecord(
      testCase.record
    );

    results.push({
      name: testCase.name,
      status: 'PASSED',
      schemaValid: valid,
      expectedSchemaValid: testCase.expectedValid,
      runtimeValid: runtime.valid
    });
  }

  const output = {
    test: 'Samantha GKB Origin Schema Integration',
    testVersion: '1.0.2',
    status: 'PASSED',
    schema: 'GKB/schema/source-origin.schema.json',
    schemaDialect: '2020-12',
    caseCount: results.length,
    results,
    sdkOriginNormalization: false,
    bulkImportPerformed: false
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch(error => {
  console.error(JSON.stringify({
    test: 'Samantha GKB Origin Schema Integration',
    testVersion: '1.0.2',
    status: 'FAILED',
    error: error.message
  }, null, 2));

  process.exitCode = 1;
});
