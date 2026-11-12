#!/usr/bin/env node

/**
 * Samantha GKB — TheTowerSDK JSON Export Smoke Test
 *
 * Target SDK: thetowersdk@0.14.1
 *
 * Reads the SDK's public JSON exports directly.
 * Does not modify SDK data or import claims into GKB.
 */

import { createRequire } from 'node:module';
import {
  readFile,
  access,
} from 'node:fs/promises';
import {
  dirname,
  relative,
  resolve,
} from 'node:path';

const EXPECTED_PACKAGE = 'thetowersdk';
const EXPECTED_VERSION = '0.14.1';

const EXPORTS = [
  'thetowersdk/knowledge-graph.json',
  'thetowersdk/knowledge.schema.json',
];

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

async function findPackageRoot(entryPath) {
  let current = dirname(entryPath);

  while (true) {
    const manifestPath = resolve(current, 'package.json');

    try {
      const manifest = JSON.parse(
        await readFile(manifestPath, 'utf8')
      );

      if (manifest.name === EXPECTED_PACKAGE) {
        return {
          root: current,
          manifest,
        };
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
    `Could not locate ${EXPECTED_PACKAGE}/package.json`
  );
}

function collectOrigins(root) {
  const occurrences = [];
  const visited = new WeakSet();

  function walk(value, path) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        walk(item, `${path}[${index}]`);
      });
      return;
    }

    if (!isObject(value)) return;
    if (visited.has(value)) return;

    visited.add(value);

    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}.${key}`;

      if (
        key === 'origin' &&
        typeof child === 'string'
      ) {
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

function countNamedArrays(root, targetNames) {
  const counts = Object.fromEntries(
    targetNames.map(name => [name, 0])
  );

  const visited = new WeakSet();

  function walk(value) {
    if (Array.isArray(value)) {
      return;
    }

    if (!isObject(value)) return;
    if (visited.has(value)) return;

    visited.add(value);

    for (const [key, child] of Object.entries(value)) {
      if (
        targetNames.includes(key) &&
        Array.isArray(child)
      ) {
        counts[key] += child.length;
      }

      walk(child);
    }
  }

  walk(root);

  return counts;
}

async function main() {
  const runtimeManifestPath = resolve(
    process.cwd(),
    'package.json'
  );

  await access(runtimeManifestPath);

  const runtimeManifest = JSON.parse(
    await readFile(runtimeManifestPath, 'utf8')
  );

  assert(
    runtimeManifest.name === 'samantha-gkb-sdk-runtime',
    'Unexpected runtime package name'
  );

  assert(
    runtimeManifest.dependencies?.[EXPECTED_PACKAGE] ===
      EXPECTED_VERSION,
    `Runtime manifest must pin ${EXPECTED_PACKAGE}@${EXPECTED_VERSION}`
  );

  // Resolve from GKB/runtime, where npm installs dependencies.
  const runtimeRequire = createRequire(
    runtimeManifestPath
  );

  const graphPath = runtimeRequire.resolve(EXPORTS[0]);
  const schemaPath = runtimeRequire.resolve(EXPORTS[1]);

  const graph = runtimeRequire(EXPORTS[0]);
  const schema = runtimeRequire(EXPORTS[1]);

  assert(
    isObject(graph),
    'Knowledge graph export is not a JSON object'
  );

  assert(
    isObject(schema),
    'Knowledge schema export is not a JSON object'
  );

  const installed = await findPackageRoot(graphPath);
  const actualVersion = installed.manifest.version;

  assert(
    actualVersion === EXPECTED_VERSION,
    `SDK version mismatch: expected ${EXPECTED_VERSION}, found ${actualVersion}`
  );

  const origins = collectOrigins(graph);

  const observedOrigins = [
    ...new Set(origins.map(item => item.origin)),
  ].sort();

  const counts = countNamedArrays(
    graph,
    ['compartments', 'nodes', 'edges']
  );

  const report = {
    test: 'Samantha GKB TheTowerSDK JSON Export Smoke Test',
    testVersion: '1.0.0',
    status: 'PASSED',

    sdk: {
      package: EXPECTED_PACKAGE,
      expectedVersion: EXPECTED_VERSION,
      actualVersion,
      versionStatus: 'MATCHED',
    },

    exports: {
      knowledgeGraph: {
        status: 'LOADED',
        path: relative(installed.root, graphPath),
      },
      knowledgeSchema: {
        status: 'LOADED',
        path: relative(installed.root, schemaPath),
      },
    },

    graph: {
      schemaVersion: graph.schemaVersion ?? null,
      graphVersion: graph.graphVersion ?? null,
      generatedFor: graph.generatedFor ?? null,
      counts,
      originOccurrenceCount: origins.length,
      observedOrigins,
    },

    schema: {
      rootType: schema.type ?? null,
      rootTitle: schema.title ?? null,
    },

    limitations: [
      'This test verifies package version and public JSON export loading.',
      'This test does not establish factual correctness of game mechanics.',
      'This test does not perform full JSON Schema validation.',
      'This test does not import or normalize claims into GKB.',
      'Origin compatibility conflicts are preserved for separate review.',
    ],
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch(error => {
  console.error(
    JSON.stringify(
      {
        test: 'Samantha GKB TheTowerSDK JSON Export Smoke Test',
        status: 'FAILED',
        error: error.message,
      },
      null,
      2
    )
  );

  process.exitCode = 1;
});
