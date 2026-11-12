
#!/usr/bin/env node

/**
 * Samantha GKB — TheTowerSDK Knowledge Graph Validator
 *
 * Target SDK:
 *   thetowersdk@0.14.1
 *
 * JSON Schema dialect:
 *   Draft 2020-12
 *
 * Validator:
 *   ajv@8.17.1
 *
 * Purpose:
 *   Validate the public TheTowerSDK knowledge graph
 *   against its published JSON Schema.
 *
 * Safety:
 *   - Read-only SDK inspection.
 *   - No SDK data modification.
 *   - No automatic origin normalization.
 *   - No GKB bulk import.
 */

import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const EXPECTED_SDK_VERSION = '0.14.1';
const EXPECTED_AJV_VERSION = '8.17.1';

const GRAPH_EXPORT = 'thetowersdk/knowledge-graph.json';
const SCHEMA_EXPORT = 'thetowersdk/knowledge.schema.json';

const REPORT_DIRECTORY = resolve(
  process.cwd(),
  '../reports'
);

const REPORT_PATH = resolve(
  REPORT_DIRECTORY,
  'sdk-knowledge-graph-validation-report.json'
);

const require = createRequire(
  resolve(process.cwd(), 'package.json')
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

async function findPackageManifest(entryPath, packageName) {
  let current = dirname(entryPath);

  while (true) {
    const manifestPath = resolve(current, 'package.json');

    try {
      const manifest = JSON.parse(
        await readFile(manifestPath, 'utf8')
      );

      if (manifest.name === packageName) {
        return manifest;
      }
    } catch {
      // Continue searching parent directories.
    }

    const parent = dirname(current);

    if (parent === current) {
      break;
    }

    current = parent;
  }

  throw new Error(
    `Cannot locate package manifest: ${packageName}`
  );
}

function countArray(root, targetName) {
  if (Array.isArray(root)) {
    return root.reduce(
      (total, item) => total + countArray(item, targetName),
      0
    );
  }

  if (!isObject(root)) {
    return 0;
  }

  let count = 0;

  for (const [key, value] of Object.entries(root)) {
    if (key === targetName && Array.isArray(value)) {
      count += value.length;
    }

    count += countArray(value, targetName);
  }

  return count;
}

function collectOrigins(root, result = new Set()) {
  if (Array.isArray(root)) {
    for (const item of root) {
      collectOrigins(item, result);
    }

    return result;
  }

  if (!isObject(root)) {
    return result;
  }

  if (typeof root.origin === 'string') {
    result.add(root.origin);
  }

  for (const value of Object.values(root)) {
    collectOrigins(value, result);
  }

  return result;
}

function normalizeAjvErrors(errors) {
  return (errors ?? []).map((error) => ({
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
    runtimeManifest.dependencies?.thetowersdk ===
      EXPECTED_SDK_VERSION,
    `Expected thetowersdk@${EXPECTED_SDK_VERSION}`
  );

  assert(
    runtimeManifest.dependencies?.ajv ===
      EXPECTED_AJV_VERSION,
    `Expected ajv@${EXPECTED_AJV_VERSION}`
  );

  const sdkSchema = require(SCHEMA_EXPORT);
  const graph = require(GRAPH_EXPORT);

  assert(
    isObject(sdkSchema),
    'SDK JSON Schema must be an object'
  );

  assert(
    isObject(graph),
    'SDK Knowledge Graph must be an object'
  );

  const expectedDialect =
    'https://json-schema.org/draft/2020-12/schema';

  assert(
    sdkSchema.$schema === expectedDialect,
    `Unexpected JSON Schema dialect: ${sdkSchema.$schema ?? 'MISSING'}`
  );

  const schemaPath = require.resolve(SCHEMA_EXPORT);
  const graphPath = require.resolve(GRAPH_EXPORT);
  const ajvPath = require.resolve('ajv/dist/2020.js');

  const sdkManifest = await findPackageManifest(
    schemaPath,
    'thetowersdk'
  );

  const ajvManifest = await findPackageManifest(
    ajvPath,
    'ajv'
  );

  assert(
    sdkManifest.version === EXPECTED_SDK_VERSION,
    `SDK version mismatch: ${sdkManifest.version}`
  );

  assert(
    ajvManifest.version === EXPECTED_AJV_VERSION,
    `Ajv version mismatch: ${ajvManifest.version}`
  );

  const Ajv2020Module = require('ajv/dist/2020.js');

  const Ajv2020 =
    Ajv2020Module.default ?? Ajv2020Module;

  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    validateFormats: false
  });

  const validate = ajv.compile(sdkSchema);
  const valid = validate(graph);

  const validationErrors = normalizeAjvErrors(
    validate.errors
  );

  const report = {
    test: 'Samantha GKB TheTowerSDK Knowledge Graph Validation',
    testVersion: '1.0.0',

    status: valid ? 'PASSED' : 'FAILED',

    sdk: {
      package: 'thetowersdk',
      expectedVersion: EXPECTED_SDK_VERSION,
      actualVersion: sdkManifest.version,
      versionStatus: 'MATCHED'
    },

    validator: {
      package: 'ajv',
      expectedVersion: EXPECTED_AJV_VERSION,
      actualVersion: ajvManifest.version,
      dialect: sdkSchema.$schema,
      dialectStatus: 'MATCHED'
    },

    graph: {
      schemaVersion: graph.schemaVersion ?? null,
      graphVersion: graph.graphVersion ?? null,
      generatedFor: graph.generatedFor ?? null,

      counts: {
        compartments: countArray(graph, 'compartments'),
        nodes: countArray(graph, 'nodes'),
        edges: countArray(graph, 'edges')
      },

      observedOrigins: [
        ...collectOrigins(graph)
      ].sort()
    },

    validation: {
      engine: 'Ajv Draft 2020-12',
      valid,
      errorCount: validationErrors.length,
      errors: validationErrors
    },

    limitations: [
      'Schema validation does not establish factual correctness.',
      'Schema validation does not verify game mechanics.',
      'Schema validation does not resolve origin compatibility conflicts.',
      'External schema references may require separate review.',
      'Format validation is disabled in this initial validator.',
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
    reportFile: 'GKB/reports/sdk-knowledge-graph-validation-report.json'
  }, null, 2));

  if (!valid) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    test: 'Samantha GKB TheTowerSDK Knowledge Graph Validation',
    status: 'ERROR',
    error: error.message
  }, null, 2));

  process.exitCode = 1;
});
