#!/usr/bin/env node

/**
 * Samantha GKB — SDK Schema Inspector and Graph Validator
 *
 * Version: 2.2.0
 * Target: thetowersdk@0.14.1
 * Validator: ajv@8.17.1
 * Schema: JSON Schema Draft 2020-12
 *
 * Responsibilities:
 * 1. Verify SDK and Ajv versions.
 * 2. Inspect SDK schema dialect.
 * 3. Load the public SDK knowledge graph.
 * 4. Validate graph against the original SDK schema.
 * 5. Classify origin compatibility conflicts.
 * 6. Separate origin errors from other validation errors.
 * 7. Preserve original values and error locations.
 * 8. Generate a structured JSON report.
 *
 * Safety:
 * - No SDK data modification.
 * - No origin normalization.
 * - No schema modification.
 * - No automatic conflict resolution.
 * - No GKB bulk import.
 */

import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';

const VALIDATOR_VERSION = '2.2.0';

const EXPECTED_SDK_VERSION = '0.14.1';
const EXPECTED_AJV_VERSION = '8.17.1';

const EXPECTED_DIALECT =
  'https://json-schema.org/draft/2020-12/schema';

const SDK_SCHEMA_EXPORT = 'thetowersdk/knowledge.schema.json';
const SDK_GRAPH_EXPORT = 'thetowersdk/knowledge-graph.json';

const REPORT_DIRECTORY = resolve(
  process.cwd(),
  '../reports'
);

const REPORT_PATH = resolve(
  REPORT_DIRECTORY,
  'sdk-knowledge-graph-validation-report.json'
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

async function findPackageRoot(entryPath, expectedName) {
  let current = dirname(entryPath);

  while (true) {
    const manifestPath = resolve(current, 'package.json');

    try {
      const manifest = JSON.parse(
        await readFile(manifestPath, 'utf8')
      );

      if (manifest.name === expectedName) {
        return {
          root: current,
          manifest
        };
      }
    } catch {
      // Continue searching parent directories.
    }

    const parent = dirname(current);

    if (parent === current) break;

    current = parent;
  }

  throw new Error(
    `Cannot locate package: ${expectedName}`
  );
}

function countNamedArrays(root, targetNames) {
  const counts = Object.fromEntries(
    [...targetNames].map(name => [name, 0])
  );

  function visit(value) {
    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }
      return;
    }

    if (!isObject(value)) return;

    for (const [key, child] of Object.entries(value)) {
      if (
        targetNames.has(key) &&
        Array.isArray(child)
      ) {
        counts[key] += child.length;
      }

      visit(child);
    }
  }

  visit(root);
  return counts;
}

function collectOrigins(root, result = new Set()) {
  if (Array.isArray(root)) {
    for (const item of root) {
      collectOrigins(item, result);
    }

    return result;
  }

  if (!isObject(root)) return result;

  if (typeof root.origin === 'string') {
    result.add(root.origin);
  }

  for (const value of Object.values(root)) {
    collectOrigins(value, result);
  }

  return result;
}

function normalizeErrors(errors) {
  return (errors ?? []).map(error => ({
    instancePath: error.instancePath,
    schemaPath: error.schemaPath,
    keyword: error.keyword,
    message: error.message ?? null,
    params: error.params ?? {}
  }));
}

/**
 * Resolve an Ajv JSON Pointer against the original graph.
 * This function only reads source data.
 */
function getByJsonPointer(root, pointer) {
  if (!pointer) return root;

  const segments = pointer
    .split('/')
    .slice(1)
    .map(segment =>
      segment
        .replace(/~1/g, '/')
        .replace(/~0/g, '~')
    );

  let current = root;

  for (const segment of segments) {
    if (
      current === null ||
      current === undefined
    ) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
}

/**
 * Identify origin enum errors without modifying
 * the original SDK graph or schema.
 */
function isOriginEnumError(error) {
  return (
    error.keyword === 'enum' &&
    /\/origin\/enum$/.test(error.schemaPath ?? '') &&
    /\/origin$/.test(error.instancePath ?? '')
  );
}

/**
 * Group origin errors by their original graph value.
 */
function classifyOriginConflicts(errors, graph) {
  const originErrors = [];
  const otherErrors = [];

  const grouped = new Map();

  for (const error of errors) {
    if (!isOriginEnumError(error)) {
      otherErrors.push(error);
      continue;
    }

    originErrors.push(error);

    const originalValue = getByJsonPointer(
      graph,
      error.instancePath
    );

    const origin =
      typeof originalValue === 'string'
        ? originalValue
        : null;

    const key = origin ?? '__UNKNOWN_ORIGIN__';

    if (!grouped.has(key)) {
      grouped.set(key, {
        code: 'ORIGIN_GRAPH_SCHEMA_MISMATCH',
        graphOrigin: origin,
        schemaAllows: false,
        resolution: 'UNRESOLVED',
        occurrenceCount: 0,
        locations: []
      });
    }

    const conflict = grouped.get(key);

    conflict.occurrenceCount += 1;

    conflict.locations.push({
      instancePath: error.instancePath,
      schemaPath: error.schemaPath,
      keyword: error.keyword,
      message: error.message ?? null
    });
  }

  return {
    originErrors,
    otherErrors,
    conflicts: [...grouped.values()]
  };
}

async function main() {
  const runtimeManifestPath = resolve(
    process.cwd(),
    'package.json'
  );

  const runtimeManifest = JSON.parse(
    await readFile(runtimeManifestPath, 'utf8')
  );

  assert(
    runtimeManifest.name === 'samantha-gkb-sdk-runtime',
    'Unexpected runtime package'
  );

  assert(
    runtimeManifest.dependencies?.thetowersdk ===
      EXPECTED_SDK_VERSION,
    `Expected thetowersdk@${EXPECTED_SDK_VERSION}`
  );

  assert(
    runtimeManifest.dependencies?.ajv ===
      EXPECTED_AJV_VERSION,
    `Expected ajv@${EXPECTED_AJV_VERSION}`
  );

  const runtimeRequire = createRequire(
    runtimeManifestPath
  );

  const schemaPath = runtimeRequire.resolve(
    SDK_SCHEMA_EXPORT
  );

  const graphPath = runtimeRequire.resolve(
    SDK_GRAPH_EXPORT
  );

  const ajvEntry = runtimeRequire.resolve(
    'ajv/dist/2020.js'
  );

  const schema = runtimeRequire(SDK_SCHEMA_EXPORT);
  const graph = runtimeRequire(SDK_GRAPH_EXPORT);

  assert(
    isObject(schema),
    'SDK schema is not an object'
  );

  assert(
    isObject(graph),
    'SDK graph is not an object'
  );

  const sdkPackage = await findPackageRoot(
    schemaPath,
    'thetowersdk'
  );

  const ajvPackage = await findPackageRoot(
    ajvEntry,
    'ajv'
  );

  assert(
    sdkPackage.manifest.version === EXPECTED_SDK_VERSION,
    `SDK version mismatch: ${sdkPackage.manifest.version}`
  );

  assert(
    ajvPackage.manifest.version === EXPECTED_AJV_VERSION,
    `Ajv version mismatch: ${ajvPackage.manifest.version}`
  );

  const dialect =
    typeof schema.$schema === 'string'
      ? schema.$schema
      : null;

  assert(
    dialect === EXPECTED_DIALECT,
    `Unexpected or missing schema dialect: ${dialect ?? 'MISSING'}`
  );

  const Ajv2020Module = runtimeRequire(
    'ajv/dist/2020.js'
  );

  const Ajv2020 =
    Ajv2020Module.default ?? Ajv2020Module;

  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    allowUnionTypes: true,
    validateFormats: false
  });

  // Compile the original SDK schema.
  const validate = ajv.compile(schema);

  // Validate the original graph without normalization.
  const valid = validate(graph);

  const errors = normalizeErrors(validate.errors);

  // Classify errors without suppressing validation failures.
  const classification = classifyOriginConflicts(
    errors,
    graph
  );

  const originErrorCount =
    classification.originErrors.length;

  const otherErrorCount =
    classification.otherErrors.length;

  const counts = countNamedArrays(
    graph,
    new Set([
      'compartments',
      'nodes',
      'edges'
    ])
  );

  const compatibilityStatus =
    originErrorCount > 0
      ? 'CONFLICTING'
      : 'NO_ORIGIN_CONFLICT_DETECTED';

  const report = {
    test:
      'Samantha GKB SDK Schema and Knowledge Graph Validation',

    testVersion: VALIDATOR_VERSION,

    status: valid ? 'PASSED' : 'FAILED',

    sdk: {
      package: 'thetowersdk',
      expectedVersion: EXPECTED_SDK_VERSION,
      actualVersion: sdkPackage.manifest.version,
      versionStatus: 'MATCHED'
    },

    schema: {
      export: SDK_SCHEMA_EXPORT,
      path: relative(sdkPackage.root, schemaPath),
      title: schema.title ?? null,
      id: schema.$id ?? null,
      dialect,
      dialectStatus: 'MATCHED'
    },

    validator: {
      package: 'ajv',
      expectedVersion: EXPECTED_AJV_VERSION,
      actualVersion: ajvPackage.manifest.version,
      engine: 'Ajv Draft 2020-12',
      strict: true,
      allowUnionTypes: true,
      formatValidation: false
    },

    graph: {
      export: SDK_GRAPH_EXPORT,
      path: relative(sdkPackage.root, graphPath),
      schemaVersion: graph.schemaVersion ?? null,
      graphVersion: graph.graphVersion ?? null,
      generatedFor: graph.generatedFor ?? null,
      counts,
      observedOrigins: [
        ...collectOrigins(graph)
      ].sort()
    },

    compatibility: {
      status: compatibilityStatus,

      conflictCount: originErrorCount,

      conflicts: classification.conflicts,

      resolutionPolicy:
        'Original SDK origin values are preserved. No automatic mapping is performed.'
    },

    validation: {
      valid,

      errorCount: errors.length,

      originErrorCount,

      otherErrorCount,

      originErrors: classification.originErrors,

      otherErrors: classification.otherErrors,

      errors
    },

    limitations: [
      'Schema validation does not establish factual correctness.',
      'Schema validation does not verify game mechanics.',
      'Origin conflicts remain unresolved.',
      'No automatic origin normalization is performed.',
      'External schema references require separate assessment.',
      'Format validation is disabled.',
      'No SDK claims are imported into GKB.',
      'No source redistribution rights are assessed.'
    ]
  };

  await mkdir(REPORT_DIRECTORY, {
    recursive: true
  });

  await writeFile(
    REPORT_PATH,
    JSON.stringify(report, null, 2) + '\n',
    'utf8'
  );

  console.log(
    JSON.stringify({
      ...report,
      reportFile:
        'GKB/reports/sdk-knowledge-graph-validation-report.json'
    }, null, 2)
  );

  // Any schema validation error keeps the test failed.
  if (!valid) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(
    JSON.stringify({
      test:
        'Samantha GKB SDK Schema and Knowledge Graph Validation',

      testVersion: VALIDATOR_VERSION,

      status: 'ERROR',

      error: error.message
    }, null, 2)
  );

  process.exitCode = 1;
});
