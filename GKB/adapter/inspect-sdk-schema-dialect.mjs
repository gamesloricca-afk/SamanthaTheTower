#!/usr/bin/env node

/**
 * Samantha GKB — SDK Schema Inspector and Graph Validator
 *
 * Target:
 *   thetowersdk@0.14.1
 *
 * Schema:
 *   JSON Schema Draft 2020-12
 *
 * Validator:
 *   ajv@8.17.1
 *
 * Responsibilities:
 *   1. Verify SDK and Ajv versions.
 *   2. Inspect the declared schema dialect.
 *   3. Load the public SDK knowledge graph.
 *   4. Validate the graph against the SDK schema.
 *   5. Preserve validation errors in a JSON report.
 *
 * Safety:
 *   - No SDK data modification.
 *   - No automatic origin normalization.
 *   - No GKB bulk import.
 */

import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';

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

  assert(isObject(schema), 'SDK schema is not an object');
  assert(isObject(graph), 'SDK graph is not an object');

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
    validateFormats: false
  });

  // Schema compilation errors are reported as ERROR.
  const validate = ajv.compile(schema);

  // Graph validation.
  const valid = validate(graph);
  const errors = normalizeErrors(validate.errors);

  const counts = countNamedArrays(
    graph,
    new Set(['compartments', 'nodes', 'edges'])
  );

  const report = {
    test: 'Samantha GKB SDK Schema and Knowledge Graph Validation',
    testVersion: '2.0.0',

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

    validation: {
      valid,
      errorCount: errors.length,
      errors
    },

    limitations: [
      'Schema validation does not establish factual correctness.',
      'Schema validation does not verify game mechanics.',
      'Origin compatibility conflicts are not automatically resolved.',
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

  console.log(JSON.stringify({
    ...report,
    reportFile:
      'GKB/reports/sdk-knowledge-graph-validation-report.json'
  }, null, 2));

  if (!valid) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(JSON.stringify({
    test: 'Samantha GKB SDK Schema and Knowledge Graph Validation',
    status: 'ERROR',
    error: error.message
  }, null, 2));

  process.exitCode = 1;
});
