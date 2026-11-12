
#!/usr/bin/env node

/**
 * Samantha GKB — SDK Origin Compatibility Adapter
 *
 * Version: 0.2.0
 * Target SDK: thetowersdk@0.14.1
 *
 * Responsibilities:
 * - Discover origin values in SDK knowledge graphs.
 * - Compare graph origins with JSON Schema origins.
 * - Compare explicitly supplied TypeScript origins.
 * - Preserve original origin values and locations.
 * - Classify compatibility conflicts.
 * - Record SDK provenance and inspection metadata.
 *
 * Safety:
 * - No automatic origin normalization.
 * - No semantic equivalence assumptions.
 * - No source graph or schema modification.
 * - No automatic conflict resolution.
 * - No bulk GKB import.
 */

import { pathToFileURL } from 'node:url';

const ADAPTER_NAME =
  'Samantha GKB Origin Compatibility Adapter';

const ADAPTER_VERSION = '0.2.0';

const EXPECTED_SDK_PACKAGE = 'thetowersdk';

const EXPECTED_SDK_VERSION = '0.14.1';

/**
 * Object check.
 */
function isObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

/**
 * Return unique sorted string values.
 */
function uniqueSorted(values) {
  return [
    ...new Set(
      values.filter(value => typeof value === 'string')
    ),
  ].sort();
}

/**
 * Convert a JavaScript path into a stable JSON-style path.
 */
function appendPath(path, key) {
  if (typeof key === 'number') {
    return `${path}[${key}]`;
  }

  return `${path}.${String(key)}`;
}

/**
 * Discover every string value under a property named origin.
 *
 * Paths are retained for traceability.
 * Original source data is never modified.
 */
export function collectOriginOccurrences(root) {
  const occurrences = [];

  const seen = new WeakSet();

  function walk(value, path) {
    if (value === null || typeof value !== 'object') {
      return;
    }

    if (seen.has(value)) {
      return;
    }

    seen.add(value);

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        walk(item, appendPath(path, index));
      });

      return;
    }

    for (const [key, child] of Object.entries(value)) {
      const childPath = appendPath(path, key);

      if (key === 'origin') {
        occurrences.push({
          origin: child,
          path: childPath,
          valueType:
            child === null
              ? 'null'
              : Array.isArray(child)
                ? 'array'
                : typeof child,
          validString:
            typeof child === 'string' &&
            child.length > 0,
        });
      }

      walk(child, childPath);
    }
  }

  walk(root, '$');

  return occurrences;
}

/**
 * Discover origin enums in JSON Schema.
 *
 * This is a structural discovery function.
 * It does not resolve $ref or claim complete schema coverage.
 */
export function collectSchemaOriginDefinitions(schema) {
  const definitions = [];

  const seen = new WeakSet();

  function walk(value, path) {
    if (!isObject(value) && !Array.isArray(value)) {
      return;
    }

    if (seen.has(value)) {
      return;
    }

    seen.add(value);

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        walk(item, appendPath(path, index));
      });

      return;
    }

    if (
      path.split('.').at(-1) === 'origin' &&
      Array.isArray(value.enum)
    ) {
      definitions.push({
        path,
        values: uniqueSorted(
          value.enum.filter(
            item => typeof item === 'string'
          )
        ),
        nonStringEnumValues: value.enum.filter(
          item => typeof item !== 'string'
        ),
      });
    }

    for (const [key, child] of Object.entries(value)) {
      walk(child, appendPath(path, key));
    }
  }

  walk(schema, '$');

  return definitions;
}

/**
 * Collect the union of discovered schema origin enums.
 */
export function collectSchemaOrigins(schema) {
  return uniqueSorted(
    collectSchemaOriginDefinitions(schema)
      .flatMap(definition => definition.values)
  );
}

/**
 * Preserve source origin without assigning a mapping.
 */
export function preserveOrigin(origin) {
  if (
    typeof origin !== 'string' ||
    origin.length === 0
  ) {
    return {
      sourceOrigin: origin ?? null,
      sourceOriginRaw: origin ?? null,
      mappedOrigin: null,
      mappingStatus: 'INVALID_OR_MISSING',
    };
  }

  return {
    sourceOrigin: origin,
    sourceOriginRaw: origin,
    mappedOrigin: null,
    mappingStatus: 'UNMAPPED_REQUIRES_REVIEW',
  };
}

/**
 * Group graph origin occurrences by value.
 */
function groupOriginOccurrences(occurrences) {
  const groups = new Map();

  for (const occurrence of occurrences) {
    const key =
      typeof occurrence.origin === 'string'
        ? occurrence.origin
        : '__INVALID_OR_MISSING__';

    if (!groups.has(key)) {
      groups.set(key, {
        origin:
          key === '__INVALID_OR_MISSING__'
            ? null
            : key,
        occurrenceCount: 0,
        locations: [],
      });
    }

    const group = groups.get(key);

    group.occurrenceCount += 1;

    group.locations.push({
      path: occurrence.path,
      valueType: occurrence.valueType,
      validString: occurrence.validString,
    });
  }

  return [...groups.values()];
}

/**
 * Analyze SDK origin compatibility.
 *
 * typescriptOrigins must be supplied explicitly from
 * an inspected TypeScript declaration.
 *
 * This adapter does not parse TypeScript automatically.
 */
export function analyzeOriginCompatibility({
  sdkPackage = EXPECTED_SDK_PACKAGE,
  sdkVersion,
  graph,
  schema,
  typescriptOrigins,
  sourceReference = null,
  inspectionDate = new Date().toISOString(),
}) {
  if (!isObject(graph)) {
    throw new TypeError('graph must be an object');
  }

  if (!isObject(schema)) {
    throw new TypeError('schema must be an object');
  }

  if (
    !Array.isArray(typescriptOrigins) ||
    !typescriptOrigins.every(
      value => typeof value === 'string'
    )
  ) {
    throw new TypeError(
      'typescriptOrigins must be an array of strings'
    );
  }

  if (typeof inspectionDate !== 'string') {
    throw new TypeError(
      'inspectionDate must be a string'
    );
  }

  const occurrences = collectOriginOccurrences(graph);

  const observedOrigins = uniqueSorted(
    occurrences
      .filter(item => item.validString)
      .map(item => item.origin)
  );

  const invalidOccurrences = occurrences.filter(
    item => !item.validString
  );

  const schemaDefinitions =
    collectSchemaOriginDefinitions(schema);

  const schemaOrigins = uniqueSorted(
    schemaDefinitions.flatMap(
      definition => definition.values
    )
  );

  const declaredTypes = uniqueSorted(
    typescriptOrigins
  );

  const observedNotInSchema = observedOrigins.filter(
    value => !schemaOrigins.includes(value)
  );

  const typescriptNotInSchema = declaredTypes.filter(
    value => !schemaOrigins.includes(value)
  );

  const schemaNotInTypescript = schemaOrigins.filter(
    value => !declaredTypes.includes(value)
  );

  const observedNotInTypescript = observedOrigins.filter(
    value => !declaredTypes.includes(value)
  );

  const conflicts = [];

  const groupedOccurrences =
    groupOriginOccurrences(occurrences);

  for (const origin of observedNotInSchema) {
    const group = groupedOccurrences.find(
      item => item.origin === origin
    );

    conflicts.push({
      id: 'ORIGIN_GRAPH_SCHEMA_MISMATCH',
      type: 'OBJECTIVE',
      status: 'CONFLICTING',
      graphOrigin: origin,
      schemaAllows: false,
      resolution: 'UNRESOLVED',
      occurrenceCount: group?.occurrenceCount ?? 0,
      locations: group?.locations ?? [],
    });
  }

  if (
    typescriptNotInSchema.length > 0 ||
    schemaNotInTypescript.length > 0
  ) {
    conflicts.push({
      id: 'ORIGIN_TYPESCRIPT_SCHEMA_MISMATCH',
      type: 'OBJECTIVE',
      status: 'CONFLICTING',
      typescriptNotInSchema,
      schemaNotInTypescript,
      resolution: 'UNRESOLVED',
    });
  }

  if (observedNotInTypescript.length > 0) {
    conflicts.push({
      id: 'ORIGIN_GRAPH_TYPESCRIPT_MISMATCH',
      type: 'OBJECTIVE',
      status: 'CONFLICTING',
      graphOriginsNotInTypescript:
        observedNotInTypescript,
      resolution: 'REVIEW_REQUIRED',
    });
  }

  if (invalidOccurrences.length > 0) {
    conflicts.push({
      id: 'ORIGIN_INVALID_OR_MISSING',
      type: 'OBJECTIVE',
      status: 'CONFLICTING',
      occurrenceCount: invalidOccurrences.length,
      locations: invalidOccurrences.map(item => ({
        path: item.path,
        valueType: item.valueType,
      })),
      resolution: 'REVIEW_REQUIRED',
    });
  }

  const versionMatches =
    sdkPackage === EXPECTED_SDK_PACKAGE &&
    sdkVersion === EXPECTED_SDK_VERSION;

  const hasConflicts = conflicts.length > 0;

  const compatibilityStatus = hasConflicts
    ? 'CONFLICTING'
    : versionMatches
      ? 'CONSISTENT'
      : 'REVIEW_REQUIRED';

  return {
    adapter: {
      name: ADAPTER_NAME,
      version: ADAPTER_VERSION,
    },

    inspection: {
      date: inspectionDate,
      sourceReference,
      inspectionType: 'STRUCTURAL_COMPATIBILITY',
    },

    source: {
      name: sdkPackage,
      expectedPackage: EXPECTED_SDK_PACKAGE,
      expectedVersion: EXPECTED_SDK_VERSION,
      actualVersion: sdkVersion ?? null,
      versionStatus: versionMatches
        ? 'MATCHED'
        : 'REVIEW_REQUIRED',
    },

    gameKnowledge: {
      gameVersion: null,
      status: 'NOT_ASSESSED',
    },

    compatibility: {
      status: compatibilityStatus,

      observedOrigins,
      schemaOrigins,
      typescriptOrigins: declaredTypes,

      observedNotInSchema,
      typescriptNotInSchema,
      schemaNotInTypescript,
      observedNotInTypescript,

      schemaDefinitions,

      conflicts,
    },

    preservation: {
      occurrenceCount: occurrences.length,

      uniqueOriginCount: observedOrigins.length,

      invalidOccurrenceCount:
        invalidOccurrences.length,

      occurrences,

      groupedOccurrences,

      originalValuesPreserved: true,

      automaticNormalization: false,
    },

    mapping: {
      status: 'NOT_DEFINED',

      reason:
        'Samantha target-origin schema has not yet been formally defined.',

      automaticMappingAllowed: false,

      semanticEquivalenceEstablished: false,
    },

    importReadiness: {
      status: hasConflicts || !versionMatches
        ? 'REVIEW_REQUIRED'
        : 'NOT_AUTHORIZED',

      bulkImportAllowed: false,

      reason:
        'Structural compatibility inspection does not authorize GKB ingestion.',
    },

    limitations: [
      'JSON Schema $ref references are not resolved.',
      'Schema discovery does not establish complete schema coverage.',
      'TypeScript declarations are supplied manually.',
      'No semantic equivalence between origin values is assumed.',
      'No factual game-mechanics verification is performed.',
      'No SDK redistribution rights are assessed.',
      'No GKB import is performed.',
    ],
  };
}

/**
 * Self-test.
 *
 * Run:
 * node GKB/adapter/origin-compatibility.mjs
 */
export function runSelfTest() {
  const graph = {
    compartments: [
      {
        nodes: [
          {
            id: 'test.node',
            sources: [
              { origin: 'game' },
              { origin: 'wiki' },
              { origin: 'game' },
            ],
          },
        ],
      },
    ],
  };

  const schema = {
    properties: {
      provenance: {
        properties: {
          origin: {
            type: 'string',
            enum: ['wiki', 'in-game'],
          },
        },
      },
    },
  };

  const report = analyzeOriginCompatibility({
    sdkPackage: EXPECTED_SDK_PACKAGE,
    sdkVersion: EXPECTED_SDK_VERSION,
    graph,
    schema,
    typescriptOrigins: ['game', 'wiki'],
    sourceReference: 'synthetic-self-test',
  });

  const graphSchemaConflict =
    report.compatibility.conflicts.find(
      conflict =>
        conflict.id === 'ORIGIN_GRAPH_SCHEMA_MISMATCH'
    );

  if (!graphSchemaConflict) {
    throw new Error(
      'Self-test failed: expected graph/schema conflict'
    );
  }

  if (
    graphSchemaConflict.graphOrigin !== 'game' ||
    graphSchemaConflict.occurrenceCount !== 2
  ) {
    throw new Error(
      'Self-test failed: incorrect origin conflict grouping'
    );
  }

  if (
    report.preservation.originalValuesPreserved !== true
  ) {
    throw new Error(
      'Self-test failed: original values not preserved'
    );
  }

  if (
    report.mapping.automaticMappingAllowed !== false
  ) {
    throw new Error(
      'Self-test failed: automatic mapping must remain disabled'
    );
  }

  if (
    report.importReadiness.bulkImportAllowed !== false
  ) {
    throw new Error(
      'Self-test failed: bulk import must remain disabled'
    );
  }

  if (
    report.compatibility.status !== 'CONFLICTING'
  ) {
    throw new Error(
      'Self-test failed: expected CONFLICTING status'
    );
  }

  const output = {
    selfTest: 'PASSED',
    adapterVersion: ADAPTER_VERSION,
    compatibility: report.compatibility.status,
    observedOrigins: report.compatibility.observedOrigins,
    conflicts: report.compatibility.conflicts.length,
    gameConflictOccurrences:
      graphSchemaConflict.occurrenceCount,
    originalValuesPreserved:
      report.preservation.originalValuesPreserved,
    automaticNormalization:
      report.preservation.automaticNormalization,
    bulkImportAllowed:
      report.importReadiness.bulkImportAllowed,
  };

  console.log(JSON.stringify(output, null, 2));

  return output;
}

/**
 * Robust direct execution detection.
 */
const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(
    process.argv[1]
  ).href;

if (isDirectExecution) {
  try {
    runSelfTest();
  } catch (error) {
    console.error(
      JSON.stringify({
        selfTest: 'FAILED',
        adapterVersion: ADAPTER_VERSION,
        error: error.message,
      }, null, 2)
    );

    process.exitCode = 1;
  }
}
