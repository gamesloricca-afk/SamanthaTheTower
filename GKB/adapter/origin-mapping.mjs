
/**
 * Samantha GKB — Source Origin Mapping Adapter
 *
 * Version: 1.0.2
 * Target SDK: thetowersdk@0.14.1
 *
 * Responsibilities:
 * - Preserve original upstream origin values.
 * - Map approved origins to Samantha source types.
 * - Require evidence and explicit approval for every mapping.
 * - Preserve unresolved and unknown origins.
 * - Report invalid or missing origin values.
 *
 * Safety:
 * - No automatic semantic normalization.
 * - No default SDK origin mappings.
 * - No modification of upstream SDK data.
 * - No factual verification of game claims.
 * - No GKB bulk import.
 */

import { pathToFileURL } from 'node:url';

const ADAPTER_NAME =
  'Samantha GKB Source Origin Mapping Adapter';

const ADAPTER_VERSION = '1.0.2';

const EXPECTED_SDK_PACKAGE = 'thetowersdk';
const EXPECTED_SDK_VERSION = '0.14.1';

const SOURCE_TYPES = new Set([
  'OFFICIAL',
  'COMMUNITY',
  'PLAYER_TESTING',
  'OTHER'
]);

export const ADAPTER_POLICY = Object.freeze({
  automaticNormalization: false,
  bulkImportAllowed: false
});

const MAPPING_STATUSES = new Set([
  'MAPPED',
  'UNMAPPED_REQUIRES_REVIEW',
  'UNRESOLVED',
  'INVALID_OR_MISSING'
]);

/**
 * Origins with a known upstream structural conflict.
 *
 * This list records compatibility findings only.
 * It does not define semantic equivalence.
 */
const KNOWN_UNRESOLVED_ORIGINS = new Set([
  'game'
]);

/**
 * Check whether a value is a plain object.
 */
function isObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

/**
 * Validate an ISO calendar date in YYYY-MM-DD format.
 */
function isValidDate(value) {
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

/**
 * Validate an explicitly approved mapping.
 *
 * A mapping requires:
 * - a recognized Samantha source type;
 * - approved === true;
 * - a non-empty evidence reference;
 * - a non-empty reason;
 * - a valid review date.
 */
function validateApprovedMapping(origin, mapping) {
  if (!isObject(mapping)) {
    throw new TypeError(
      `Mapping for "${origin}" must be an object`
    );
  }

  if (!SOURCE_TYPES.has(mapping.sourceType)) {
    throw new TypeError(
      `Invalid sourceType for "${origin}"`
    );
  }

  if (mapping.approved !== true) {
    throw new Error(
      `Mapping for "${origin}" is not explicitly approved`
    );
  }

  if (
    typeof mapping.reference !== 'string' ||
    mapping.reference.trim().length === 0
  ) {
    throw new Error(
      `Mapping for "${origin}" requires an evidence reference`
    );
  }

  if (
    typeof mapping.reason !== 'string' ||
    mapping.reason.trim().length === 0
  ) {
    throw new Error(
      `Mapping for "${origin}" requires a reason`
    );
  }

  if (!isValidDate(mapping.reviewedAt)) {
    throw new Error(
      `Mapping for "${origin}" requires a valid reviewedAt date`
    );
  }

  return {
    sourceType: mapping.sourceType,
    reference: mapping.reference,
    reason: mapping.reason,
    reviewedAt: mapping.reviewedAt,
    reviewStatus: 'APPROVED'
  };
}

/**
 * Validate the complete mapping configuration.
 *
 * The default configuration is intentionally empty.
 */
function validateMappingConfig(mappings = {}) {
  if (!isObject(mappings)) {
    throw new TypeError(
      'mappings must be an object'
    );
  }

  const validated = {};

  for (const [origin, mapping] of Object.entries(mappings)) {
    if (
      typeof origin !== 'string' ||
      origin.length === 0
    ) {
      throw new TypeError(
        'Mapping origin keys must be non-empty strings'
      );
    }

    validated[origin] =
      validateApprovedMapping(origin, mapping);
  }

  return validated;
}

/**
 * Preserve and classify one upstream origin.
 *
 * No mapping is performed unless the caller supplies
 * an explicitly approved mapping with evidence.
 */
export function mapOrigin({
  origin,
  hasOrigin = true,
  mappings = {},
  sdkPackage = EXPECTED_SDK_PACKAGE,
  sdkVersion = EXPECTED_SDK_VERSION,
  sourceReference = null
} = {}) {
  if (typeof sdkPackage !== 'string') {
    throw new TypeError('sdkPackage must be a string');
  }

  if (typeof sdkVersion !== 'string') {
    throw new TypeError('sdkVersion must be a string');
  }

  if (
    sourceReference !== null &&
    typeof sourceReference !== 'string'
  ) {
    throw new TypeError('sourceReference must be a string or null');
  }

  const approvedMappings =
    validateMappingConfig(mappings);

  const upstream = {
    package: sdkPackage,
    version: sdkVersion,
    sourceReference
  };

  /**
   * Missing or invalid origin.
   *
   * The original value is retained as far as possible.
   */
  if (
    !hasOrigin ||
    typeof origin !== 'string' ||
    origin.length === 0
  ) {
    return {
      sourceType: null,
      originRaw: hasOrigin ? origin : null,
      mappingStatus: 'INVALID_OR_MISSING',
      mappingEvidence: null,
      upstream
    };
  }

  /**
   * An explicitly approved mapping takes precedence.
   *
   * Known upstream conflicts must not be mapped
   * without a separate evidence-based review.
   */
  if (
    KNOWN_UNRESOLVED_ORIGINS.has(origin) &&
    !Object.hasOwn(approvedMappings, origin)
  ) {
    return {
      sourceType: null,
      originRaw: origin,
      mappingStatus: 'UNRESOLVED',
      mappingEvidence: null,
      upstream
    };
  }

  const approvedMapping =
    approvedMappings[origin];

  if (approvedMapping) {
    return {
      sourceType: approvedMapping.sourceType,
      originRaw: origin,
      mappingStatus: 'MAPPED',
      mappingEvidence: {
        reference: approvedMapping.reference,
        reason: approvedMapping.reason,
        reviewedAt: approvedMapping.reviewedAt,
        reviewStatus: 'APPROVED'
      },
      upstream
    };
  }

  return {
    sourceType: null,
    originRaw: origin,
    mappingStatus: 'UNMAPPED_REQUIRES_REVIEW',
    mappingEvidence: null,
    upstream
  };
}

/**
 * Map an origin field from an existing provenance object.
 *
 * The original provenance object is not modified.
 */
export function mapProvenanceOrigin(
  provenance,
  options = {}
) {
  if (!isObject(provenance)) {
    throw new TypeError(
      'provenance must be an object'
    );
  }

  const hasOrigin =
    Object.hasOwn(provenance, 'origin');

  return mapOrigin({
    ...options,
    origin: provenance.origin,
    hasOrigin
  });
}

/**
 * Validate a Samantha source-origin record.
 *
 * This is a lightweight runtime validator.
 * JSON Schema validation remains a separate check.
 */
export function validateSourceOriginRecord(record) {
  const errors = [];

  if (!isObject(record)) {
    return {
      valid: false,
      errors: ['Record must be an object']
    };
  }

  if (!Object.hasOwn(record, 'originRaw')) {
    errors.push('originRaw is required');
  }

  if (!Object.hasOwn(record, 'sourceType')) {
    errors.push('sourceType is required');
  } else if (
    record.sourceType !== null &&
    !SOURCE_TYPES.has(record.sourceType)
  ) {
    errors.push('sourceType is invalid');
  }

  if (!MAPPING_STATUSES.has(record.mappingStatus)) {
    errors.push('mappingStatus is invalid');
  }

  if (!Object.hasOwn(record, 'mappingEvidence')) {
    errors.push('mappingEvidence is required');
  }

  if (!Object.hasOwn(record, 'upstream')) {
    errors.push('upstream is required');
  }

  if (record.mappingStatus === 'MAPPED') {
    if (record.sourceType === null) {
      errors.push(
        'MAPPED record requires a sourceType'
      );
    }

    if (!isObject(record.mappingEvidence)) {
      errors.push(
        'MAPPED record requires mappingEvidence'
      );
    } else {
      if (
        record.mappingEvidence.reviewStatus !==
        'APPROVED'
      ) {
        errors.push(
          'MAPPED record requires APPROVED evidence'
        );
      }

      if (
        typeof record.mappingEvidence.reference !== 'string' ||
        record.mappingEvidence.reference.trim() === ''
      ) {
        errors.push(
          'Mapping evidence reference is required'
        );
      }

      if (
        typeof record.mappingEvidence.reason !== 'string' ||
        record.mappingEvidence.reason.trim() === ''
      ) {
        errors.push(
          'Mapping evidence reason is required'
        );
      }

      if (
        !isValidDate(record.mappingEvidence.reviewedAt)
      ) {
        errors.push(
          'Mapping evidence reviewedAt must be a valid date'
        );
      }
    }
  }

  if (
    record.mappingStatus !== 'MAPPED' &&
    record.sourceType !== null
  ) {
    errors.push(
      'Unmapped records must have sourceType null'
    );
  }

  if (
    record.mappingStatus !== 'MAPPED' &&
    record.mappingEvidence !== null
  ) {
    errors.push(
      'Unmapped records must have mappingEvidence null'
    );
  }

  if (
    record.upstream !== null &&
    !isObject(record.upstream)
  ) {
    errors.push(
      'upstream must be an object or null'
    );
  } else if (isObject(record.upstream)) {
    if (
      Object.hasOwn(record.upstream, 'package') &&
      typeof record.upstream.package !== 'string'
    ) {
      errors.push('upstream.package must be a string');
    }

    if (
      Object.hasOwn(record.upstream, 'version') &&
      typeof record.upstream.version !== 'string'
    ) {
      errors.push('upstream.version must be a string');
    }

    if (
      Object.hasOwn(record.upstream, 'sourceReference') &&
      record.upstream.sourceReference !== null &&
      typeof record.upstream.sourceReference !== 'string'
    ) {
      errors.push('upstream.sourceReference must be a string or null');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Self-test.
 *
 * Run:
 * node GKB/adapter/origin-mapping.mjs
 */
export function runSelfTest() {
  const checks = [];

  function check(name, condition) {
    if (!condition) {
      throw new Error(`Self-test failed: ${name}`);
    }

    checks.push({
      name,
      status: 'PASSED'
    });
  }

  // 1. Preserve the known upstream conflict.
  const gameResult = mapOrigin({
    origin: 'game'
  });

  check(
    'game remains unresolved',
    gameResult.mappingStatus === 'UNRESOLVED' &&
    gameResult.sourceType === null &&
    gameResult.originRaw === 'game'
  );

  // 2. Unknown origins are preserved.
  const unknownResult = mapOrigin({
    origin: 'future-origin'
  });

  check(
    'unknown origin is preserved',
    unknownResult.originRaw === 'future-origin' &&
    unknownResult.mappingStatus ===
      'UNMAPPED_REQUIRES_REVIEW'
  );

  // 3. No default mapping is performed.
  const wikiResult = mapOrigin({
    origin: 'wiki'
  });

  check(
    'wiki is not automatically mapped',
    wikiResult.sourceType === null &&
    wikiResult.mappingStatus ===
      'UNMAPPED_REQUIRES_REVIEW'
  );

  // 4. Missing origin is reported.
  const missingResult = mapOrigin({
    hasOrigin: false
  });

  check(
    'missing origin is reported',
    missingResult.mappingStatus ===
      'INVALID_OR_MISSING'
  );

  // 5. Non-string origin is preserved.
  const invalidResult = mapOrigin({
    origin: 123
  });

  check(
    'non-string origin is preserved',
    invalidResult.originRaw === 123 &&
    invalidResult.mappingStatus ===
      'INVALID_OR_MISSING'
  );

  // 6. Approved mapping works with evidence.
  const approvedResult = mapOrigin({
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

  check(
    'approved mapping is applied',
    approvedResult.sourceType === 'COMMUNITY' &&
    approvedResult.mappingStatus === 'MAPPED' &&
    approvedResult.mappingEvidence.reviewStatus ===
      'APPROVED'
  );

  // 7. Mapping without approval must fail.
  let rejectedUnapproved = false;

  try {
    mapOrigin({
      origin: 'wiki',
      mappings: {
        wiki: {
          sourceType: 'COMMUNITY',
          approved: false,
          reference: 'test',
          reason: 'Test mapping',
          reviewedAt: '2026-11-17'
        }
      }
    });
  } catch {
    rejectedUnapproved = true;
  }

  check(
    'unapproved mapping is rejected',
    rejectedUnapproved
  );

  // 8. Mapping with invalid evidence date must fail.
  let rejectedInvalidDate = false;

  try {
    mapOrigin({
      origin: 'wiki',
      mappings: {
        wiki: {
          sourceType: 'COMMUNITY',
          approved: true,
          reference: 'test',
          reason: 'Test mapping',
          reviewedAt: 'not-a-date'
        }
      }
    });
  } catch {
    rejectedInvalidDate = true;
  }

  check(
    'invalid evidence date is rejected',
    rejectedInvalidDate
  );

  // 9. Invalid upstream metadata types must be rejected.
  const invalidMetadataCases = [
    {
      name: 'numeric SDK package is rejected',
      options: { sdkPackage: 14 }
    },
    {
      name: 'numeric SDK version is rejected',
      options: { sdkVersion: 14 }
    },
    {
      name: 'numeric source reference is rejected',
      options: { sourceReference: 14 }
    }
  ];

  for (const testCase of invalidMetadataCases) {
    let rejected = false;

    try {
      mapOrigin({
        origin: 'wiki',
        ...testCase.options
      });
    } catch {
      rejected = true;
    }

    check(testCase.name, rejected);
  }

  // 10. Output record passes runtime validation.
  const validation =
    validateSourceOriginRecord(gameResult);

  check(
    'unresolved record passes runtime validation',
    validation.valid
  );

  check(
    'adapter policy keeps bulk import disabled',
    ADAPTER_POLICY.bulkImportAllowed === false &&
    ADAPTER_POLICY.automaticNormalization === false
  );

  // 10. Source provenance is not mutated.
  const original = {
    origin: 'game',
    reference: 'sdk-record'
  };

  const originalBefore =
    JSON.stringify(original);

  mapProvenanceOrigin(original);

  check(
    'original provenance remains unchanged',
    JSON.stringify(original) === originalBefore
  );

  const output = {
    test: 'Samantha GKB Origin Mapping Adapter',
    adapterVersion: ADAPTER_VERSION,
    status: 'PASSED',
    checkCount: checks.length,
    checks,
    defaultMappings: 0,
    automaticNormalization: ADAPTER_POLICY.automaticNormalization,
    originalValuesPreserved: true,
    bulkImportAllowed: ADAPTER_POLICY.bulkImportAllowed
  };

  console.log(JSON.stringify(output, null, 2));

  return output;
}

/**
 * Direct execution detection.
 */
const isDirectExecution =
  process.argv[1] &&
  import.meta.url ===
    pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  try {
    runSelfTest();
  } catch (error) {
    console.error(
      JSON.stringify({
        test: 'Samantha GKB Origin Mapping Adapter',
        adapterVersion: ADAPTER_VERSION,
        status: 'FAILED',
        error: error.message
      }, null, 2)
    );

    process.exitCode = 1;
  }
}
