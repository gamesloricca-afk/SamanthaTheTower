#!/usr/bin/env node

/**
 * Samantha GKB — SDK JSON Schema Dialect Inspector
 *
 * Target:
 *   thetowersdk@0.14.1
 *
 * Purpose:
 *   Inspect the actual JSON Schema dialect declared
 *   by the installed public SDK schema export.
 *
 * This script does not validate the knowledge graph
 * and does not modify SDK or GKB data.
 */

import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';

const EXPECTED_SDK_VERSION = '0.14.1';
const SDK_SCHEMA_EXPORT = 'thetowersdk/knowledge.schema.json';

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
    runtimeManifest.dependencies?.ajv === '8.17.1',
    'Expected pinned ajv@8.17.1'
  );

  const runtimeRequire = createRequire(
    runtimeManifestPath
  );

  const schemaPath = runtimeRequire.resolve(
    SDK_SCHEMA_EXPORT
  );

  const schema = runtimeRequire(SDK_SCHEMA_EXPORT);

  assert(
    isObject(schema),
    'SDK schema export is not a JSON object'
  );

  const sdkPackage = await findPackageRoot(
    schemaPath,
    'thetowersdk'
  );

  const ajvEntry = runtimeRequire.resolve('ajv');

  const ajvPackage = await findPackageRoot(
    ajvEntry,
    'ajv'
  );

  assert(
    sdkPackage.manifest.version === EXPECTED_SDK_VERSION,
    `SDK version mismatch: ${sdkPackage.manifest.version}`
  );

  const dialect =
    typeof schema.$schema === 'string'
      ? schema.$schema
      : null;

  const report = {
    test: 'Samantha GKB SDK Schema Dialect Inspection',
    testVersion: '1.0.0',

    status: 'INSPECTED',

    sdk: {
      package: 'thetowersdk',
      expectedVersion: EXPECTED_SDK_VERSION,
      actualVersion: sdkPackage.manifest.version,
      versionStatus: 'MATCHED'
    },

    schema: {
      export: SDK_SCHEMA_EXPORT,
      path: relative(sdkPackage.root, schemaPath),
      rootType: schema.type ?? null,
      title: schema.title ?? null,
      id: schema.$id ?? null,
      dialect,
      dialectStatus: dialect ? 'DECLARED' : 'MISSING'
    },

    validator: {
      package: 'ajv',
      expectedVersion: '8.17.1',
      actualVersion: ajvPackage.manifest.version,
      versionStatus:
        ajvPackage.manifest.version === '8.17.1'
          ? 'MATCHED'
          : 'MISMATCHED'
    },

    validationReadiness: dialect
      ? 'DIALECT_IDENTIFIED'
      : 'BLOCKED_DIALECT_NOT_DECLARED',

    limitations: [
      'This script only inspects schema metadata.',
      'This script does not perform JSON Schema validation.',
      'A missing $schema declaration is not interpreted as a guessed dialect.',
      'Nested schema resources and external references are not resolved.',
      'No SDK claims are imported into GKB.'
    ]
  };

  console.log(JSON.stringify(report, null, 2));

  if (!dialect) {
    process.exitCode = 2;
  }
}

main().catch(error => {
  console.error(JSON.stringify({
    test: 'Samantha GKB SDK Schema Dialect Inspection',
    status: 'FAILED',
    error: error.message
  }, null, 2));

  process.exitCode = 1;
});
