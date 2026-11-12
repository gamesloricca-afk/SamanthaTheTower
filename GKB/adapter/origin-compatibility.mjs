/* Samantha GKB — SDK Origin Compatibility Adapter
 *
 * File:
 *   GKB/adapter/origin-compatibility.mjs
 *
 * Purpose:
 *   - Discover origin values in an SDK knowledge graph.
 *   - Compare graph origins with JSON Schema and TypeScript origins.
 *   - Preserve original origin values without silent normalization.
 *   - Report compatibility conflicts.
 *
 * Compatibility target:
 *   TheTowerSDK 0.14.1
 *
 * IMPORTANT:
 *   This module does NOT assign semantic equivalence between:
 *   game, in-game, and game-files.
 *
 *   Samantha's formal target-origin schema has not yet been defined.
 */

const ADAPTER_NAME = 'Samantha GKB Origin Compatibility Adapter';
const ADAPTER_VERSION = '0.1.0';
const EXPECTED_SDK_VERSION = '0.14.1';

function isObject(value) {
  return value !== null && typeof value === 'object';
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

/**
 * Collect every string value stored under a property named "origin".
 * Original paths are retained for traceability.
 */
export function collectOriginOccurrences(root) {
  const occurrences = [];

  function walk(value, path) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        walk(item, `${path}[${index}]`);
      });
      return;
    }

    if (!isObject(value)) return;

    for (const [key, child] of Object.entries(value)) {
      const childPath = path ? `${path}.${key}` : key;

      if (key === 'origin' && typeof child === 'string') {
        occurrences.push({
          origin: child,
          path: childPath,
        });
      }

      walk(child, childPath);
    }
  }

  walk(root, '$');

  return occurrences;
}

/**
 * Discover origin enums from JSON Schema.
 */
export function collectSchemaOrigins(schema) {
  const origins = [];

  function walk(value, path) {
    if (!isObject(value)) return;

    if (
      path.split('.').at(-1) === 'origin' &&
      Array.isArray(value.enum)
    ) {
      for (const item of value.enum) {
        if (typeof item === 'string') {
          origins.push(item);
        }
      }
    }

    for (const [key, child] of Object.entries(value)) {
      walk(child, path ? `${path}.${key}` : key);
    }
  }

  walk(schema, '');

  return uniqueSorted(origins);
}

/**
 * Preserve SDK origin without assigning an unverified mapping.
 */
export function preserveOrigin(origin) {
  if (typeof origin !== 'string' || origin.length === 0) {
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
 * Analyze graph, JSON Schema, and TypeScript origin compatibility.
 *
 * typescriptOrigins must be supplied from an inspected declaration.
 * This function does not parse TypeScript source automatically.
 */
export function analyzeOriginCompatibility({
  sdkVersion,
  graph,
  schema,
  typescriptOrigins,
}) {
  if (!isObject(graph)) {
    throw new TypeError('graph must be an object');
  }

  if (!isObject(schema)) {
    throw new TypeError('schema must be an object');
  }

  if (!Array.isArray(typescriptOrigins)) {
    throw new TypeError(
      'typescriptOrigins must be an explicitly supplied array'
    );
  }

  const occurrences = collectOriginOccurrences(graph);

  const observedOrigins = uniqueSorted(
    occurrences.map(item => item.origin)
  );

  const schemaOrigins = collectSchemaOrigins(schema);

  const declaredTypes = uniqueSorted(
    typescriptOrigins.filter(value => typeof value === 'string')
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

  const conflicts = [];

  if (observedNotInSchema.length > 0) {
    conflicts.push({
      id: 'ORIGIN_GRAPH_SCHEMA_MISMATCH',
      type: 'OBJECTIVE',
      status: 'CONFLICTING',
      values: observedNotInSchema,
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
    });
  }

  const versionMatches =
    sdkVersion === EXPECTED_SDK_VERSION;

  return {
    adapter: {
      name: ADAPTER_NAME,
      version: ADAPTER_VERSION,
    },

    source: {
      name: 'thetowersdk',
      expectedVersion: EXPECTED_SDK_VERSION,
      actualVersion: sdkVersion ?? null,
      versionStatus: versionMatches ? 'MATCHED' : 'REVIEW_REQUIRED',
    },

    compatibility: {
      status: conflicts.length > 0 ? 'CONFLICTING' : 'CONSISTENT',
      observedOrigins,
      schemaOrigins,
      typescriptOrigins: declaredTypes,
      observedNotInSchema,
      typescriptNotInSchema,
      schemaNotInTypescript,
      conflicts,
    },

    preservation: {
      occurrenceCount: occurrences.length,
      occurrences,
      originalValuesPreserved: true,
      automaticNormalization: false,
    },

    mapping: {
      status: 'NOT_DEFINED',
      reason:
        'Samantha target-origin schema has not yet been formally defined.',
      automaticMappingAllowed: false,
    },
  };
}

/**
 * Optional self-test:
 * node GKB/adapter/origin-compatibility.mjs
 */
function runSelfTest() {
  const graph = {
    compartments: [
      {
        nodes: [
          {
            id: 'test.node',
            sources: [
              { origin: 'game' },
              { origin: 'wiki' },
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
    sdkVersion: EXPECTED_SDK_VERSION,
    graph,
    schema,
    typescriptOrigins: ['game', 'wiki'],
  });

  if (report.compatibility.status !== 'CONFLICTING') {
    throw new Error('Self-test failed: expected origin conflict');
  }

  if (!report.preservation.originalValuesPreserved) {
    throw new Error('Self-test failed: original origins not preserved');
  }

  if (report.mapping.automaticMappingAllowed !== false) {
    throw new Error('Self-test failed: automatic mapping must remain disabled');
  }

  console.log(
    JSON.stringify(
      {
        selfTest: 'PASSED',
        compatibility: report.compatibility.status,
        observedOrigins: report.compatibility.observedOrigins,
        conflicts: report.compatibility.conflicts.length,
        originalValuesPreserved:
          report.preservation.originalValuesPreserved,
      },
      null,
      2
    )
  );
}

if (
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href
) {
  runSelfTest();
}
