/**
 * Samantha GKB — TheTowerSDK Knowledge Graph Validator
 *
 * Version: 1.2.0
 * SDK: thetowersdk@0.14.1
 * Validator: ajv@8.17.1
 *
 * Purpose:
 * - Validate SDK Knowledge Graph against its JSON Schema.
 * - Preserve original SDK data.
 * - Report schema errors and origin conflicts.
 * - Never import SDK claims into GKB.
 */

import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { analyzeOriginCompatibility } from './origin-compatibility.mjs';

const EXPECTED_SDK_VERSION = '0.14.1';
const EXPECTED_AJV_VERSION = '8.17.1';

const GRAPH_EXPORT = 'thetowersdk/knowledge-graph.json';
const SCHEMA_EXPORT = 'thetowersdk/knowledge.schema.json';

const REPORT_DIRECTORY = resolve(process.cwd(), '../reports');
const REPORT_PATH = resolve(
  REPORT_DIRECTORY,
  'sdk-knowledge-graph-validation-report.json'
);

const require = createRequire(
  resolve(process.cwd(), 'package.json')
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

      if (manifest.name === packageName) return manifest;
    } catch {
      // Continue searching parent directories.
    }

    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new Error(`Cannot locate package: ${packageName}`);
}

function collectOrigins(root, result = []) {
  if (Array.isArray(root)) {
    for (const item of root) collectOrigins(item, result);
    return result;
  }

  if (!isObject(root)) return result;

  if (Object.hasOwn(root, 'origin')) {
    result.push({
      origin: root.origin,
      valueType: typeof root.origin
    });
  }

  for (const value of Object.values(root)) {
    collectOrigins(value, result);
  }

  return result;
}

function collectSchemaOriginEnums(root, result = []) {
  if (Array.isArray(root)) {
    for (const item of root) {
      collectSchemaOriginEnums(item, result);
    }
    return result;
  }

  if (!isObject(root)) return result;

  if (
    Array.isArray(root.enum) &&
    root.enum.every(value => typeof value === 'string')
  ) {
    result.push(...root.enum);
  }

  for (const value of Object.values(root)) {
    collectSchemaOriginEnums(value, result);
  }

  return result;
}

/**
 * Parse a named string-literal union from a TypeScript declaration.
 * Unsupported syntax is reported as NOT_INSPECTED; values are never guessed.
 */
function parseStringUnionDeclaration(source, typeName) {
  const pattern = new RegExp(
    String.raw\`export\\s+type\\s+\${typeName}\\s*=([\\s\\S]*?);\`,
    'g'
  );
  const matches = [...source.matchAll(pattern)];

  if (matches.length !== 1) {
    return {
      status: 'NOT_INSPECTED',
      reason: matches.length === 0 ? 'DECLARATION_NOT_FOUND' : 'MULTIPLE_DECLARATIONS_FOUND',
      values: [],
      declarationLocations: []
    };
  }

  const match = matches[0];
  const body = match[1]
    .replace(/\\/\\*[\\s\\S]*?\\*\\//g, '')
    .replace(/\\/\\/[^\\r\\n]*/g, '');
  const members = body.split('|').map(value => value.trim()).filter(Boolean);
  const values = [];

  for (const member of members) {
    const literal = member.match(/^(['"])([^'"]+)\\1$/);
    if (!literal) {
      return {
        status: 'NOT_INSPECTED',
        reason: 'UNSUPPORTED_UNION_MEMBER_SYNTAX',
        values: [],
        declarationLocations: []
      };
    }
    values.push(literal[2]);
  }

  if (values.length === 0 || new Set(values).size !== values.length) {
    return {
      status: 'NOT_INSPECTED',
      reason: 'EMPTY_OR_DUPLICATE_UNION_VALUES',
      values: [],
      declarationLocations: []
    };
  }

  const line = source.slice(0, match.index).split('\\n').length;
  return {
    status: 'INSPECTED',
    method: 'AUTOMATIC_DTS_PARSE',
    values,
    declarationLocations: [{
      path: null,
      typeName,
      startLine: line,
      endLine: line + match[0].split('\\n').length - 1
    }]
  };
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

function countValues(items) {
  const counts = {};

  for (const item of items) {
    const key = String(item.origin);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return counts;
}

async function main() {
  const runtimeManifest = JSON.parse(
    await readFile(
      resolve(process.cwd(), 'package.json'),
      'utf8'
    )
  );

  assert(
    runtimeManifest.dependencies?.thetowersdk === EXPECTED_SDK_VERSION,
    `Expected thetowersdk@${EXPECTED_SDK_VERSION}`
  );

  assert(
    runtimeManifest.dependencies?.ajv === EXPECTED_AJV_VERSION,
    `Expected ajv@${EXPECTED_AJV_VERSION}`
  );

  const graph = require(GRAPH_EXPORT);
  const schema = require(SCHEMA_EXPORT);

  assert(isObject(graph), 'Knowledge Graph must be an object');
  assert(isObject(schema), 'JSON Schema must be an object');

  const schemaPath = require.resolve(SCHEMA_EXPORT);
  const graphPath = require.resolve(GRAPH_EXPORT);
  const ajvPath = require.resolve('ajv/dist/2020.js');

  const typescriptDeclarationPath = resolve(
    dirname(schemaPath),
    'substrate/types.d.ts'
  );
  let typescriptInspection = {
    status: 'NOT_INSPECTED',
    reason: 'DECLARATION_FILE_NOT_FOUND',
    values: [],
    declarationLocations: []
  };

  try {
    const declarationSource = await readFile(typescriptDeclarationPath, 'utf8');
    typescriptInspection = parseStringUnionDeclaration(declarationSource, 'ClaimOrigin');
    typescriptInspection.declarationLocations =
      typescriptInspection.declarationLocations.map(location => ({
        ...location,
        path: typescriptDeclarationPath
      }));
  } catch (error) {
    typescriptInspection = {
      status: 'NOT_INSPECTED',
      reason: 'DECLARATION_READ_FAILED',
      error: error.message,
      values: [],
      declarationLocations: []
    };
  }

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

  const AjvModule = require('ajv/dist/2020.js');
  const Ajv2020 = AjvModule.default ?? AjvModule;

  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    allowUnionTypes: true,
    validateFormats: false
  });

  const validate = ajv.compile(schema);
  const valid = validate(graph);

  const errors = normalizeErrors(validate.errors);
  const origins = collectOrigins(graph);
  const allowedOrigins = [
    ...new Set(collectSchemaOriginEnums(schema))
  ];

  const originCounts = countValues(origins);

  const originCompatibility = analyzeOriginCompatibility({
    sdkPackage: 'thetowersdk',
    sdkVersion: sdkManifest.version,
    graph,
    schema,
    typescriptOrigins: typescriptInspection.status === 'INSPECTED'
      ? typescriptInspection.values
      : null,
    typescriptInspectionMethod: typescriptInspection.method ?? 'NOT_INSPECTED',
    typescriptDeclarationLocations: typescriptInspection.declarationLocations,
    sourceReference: `${GRAPH_EXPORT} + ${SCHEMA_EXPORT}`
  });

  const report = {
    test: 'Samantha GKB SDK Knowledge Graph Validation',
    testVersion: '1.2.0',
    status: valid ? 'PASSED' : 'FAILED',

    sdk: {
      package: 'thetowersdk',
      expectedVersion: EXPECTED_SDK_VERSION,
      actualVersion: sdkManifest.version
    },

    validator: {
      package: 'ajv',
      expectedVersion: EXPECTED_AJV_VERSION,
      actualVersion: ajvManifest.version,
      engine: 'Ajv Draft 2020-12',
      strict: true,
      allowUnionTypes: true,
      formatValidation: false
    },

    graph: {
      export: GRAPH_EXPORT,
      schemaVersion: graph.schemaVersion ?? null,
      graphVersion: graph.graphVersion ?? null,
      generatedFor: graph.generatedFor ?? null,
      observedOrigins: originCounts
    },

    validation: {
      valid,
      errorCount: errors.length,
      displayedErrorCount: Math.min(errors.length, 20),
      errors: errors.slice(0, 20),
      truncated: errors.length > 20
    },

    typescriptDeclaration: {
      typeName: 'ClaimOrigin',
      file: typescriptDeclarationPath,
      status: typescriptInspection.status,
      reason: typescriptInspection.reason ?? null,
      values: typescriptInspection.values,
      declarationLocations: typescriptInspection.declarationLocations
    },

    compatibility: {
      ...originCompatibility.compatibility,
      inspection: originCompatibility.inspection,
      limitations: originCompatibility.limitations
    },

    safeguards: [
      'Original SDK values are preserved.',
      'No automatic origin normalization is performed.',
      'No SDK claims are imported into GKB.',
      'Schema validation does not establish factual correctness.',
      'Schema validation does not verify game mechanics.',
      'Redistribution rights are not assessed.',
      'TypeScript parsing supports named string-literal union declarations only.'
    ],

    reportFile: 'GKB/reports/sdk-knowledge-graph-validation-report.json'
  };

  await mkdir(REPORT_DIRECTORY, { recursive: true });

  await writeFile(
    REPORT_PATH,
    JSON.stringify(report, null, 2) + '\n',
    'utf8'
  );

  console.log(JSON.stringify(report, null, 2));

  if (!valid) process.exitCode = 1;
}

main().catch(error => {
  console.error(JSON.stringify({
    test: 'Samantha GKB SDK Knowledge Graph Validation',
    status: 'ERROR',
    error: error.message
  }, null, 2));

  process.exitCode = 1;
});
    
