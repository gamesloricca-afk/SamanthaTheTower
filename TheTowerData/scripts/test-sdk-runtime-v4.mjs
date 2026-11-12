#!/usr/bin/env node

/**
 * Samantha - TheTowerSDK Runtime Validator
 * Version: 4.1.0
 *
 * Target:
 *   thetowersdk@0.14.1
 *   Node.js >=20
 *
 * Environment:
 *   SDK_DIR     = SDK package directory
 *   REPORT_PATH = JSON report output path
 *
 * Backward-compatible CLI:
 *   node test-sdk-runtime-v4.mjs <sdk-package-dir> [report-path]
 *
 * This validator:
 *   - Verifies SDK identity and version.
 *   - Loads public JSON exports.
 *   - Checks graph structure.
 *   - Checks node and edge references.
 *   - Checks provenance.
 *   - Compares observed origins with JSON Schema.
 *   - Inspects TypeScript declarations when available.
 *   - Preserves unknown values.
 *
 * It does NOT:
 *   - Modify SDK data.
 *   - Verify factual game mechanics.
 *   - Verify formulas independently.
 *   - Establish redistribution rights.
 *   - Perform complete JSON Schema validation.
 */

import {
  readFile,
  writeFile,
  mkdir,
  access
} from 'node:fs/promises';

import {
  resolve,
  dirname,
  join,
  relative,
  isAbsolute
} from 'node:path';

import {
  createRequire
} from 'node:module';

import process from 'node:process';

const EXPECTED_PACKAGE = 'thetowersdk';
const EXPECTED_VERSION = '0.14.1';
const VALIDATOR_VERSION = '4.1.0';

const SDK_DIR = resolve(
  process.env.SDK_DIR ??
  process.argv[2] ??
  ''
);

const REPORT_PATH = resolve(
  process.env.REPORT_PATH ??
  process.argv[3] ??
  'TheTowerData/reports/sdk-runtime-v4-report.json'
);

const EXPORTS = [
  {
    name: 'knowledge-graph',
    specifier: 'thetowersdk/knowledge-graph.json',
    exportKey: './knowledge-graph.json'
  },
  {
    name: 'knowledge-schema',
    specifier: 'thetowersdk/knowledge.schema.json',
    exportKey: './knowledge.schema.json'
  }
];

const report = {
  validator: {
    name: 'Samantha TheTowerSDK Runtime Validator',
    version: VALIDATOR_VERSION
  },

  execution: {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    workingDirectory: process.cwd(),
    sdkDirectory: SDK_DIR,
    reportPath: REPORT_PATH
  },

  package: null,

  exports: [],

  graph: null,

  compatibility: {
    status: 'NOT_ASSESSED',
    observedOrigins: [],
    schemaOrigins: [],
    typescriptOrigins: [],
    conflicts: []
  },

  validation: {
    checks: [],
    passed: 0,
    failed: 0,
    warnings: 0
  },

  readiness: {
    importReadiness: 'NOT_ASSESSED',
    factualValidation: 'NOT_PERFORMED',
    redistributionReview: 'NOT_PERFORMED'
  },

  limitations: []
};

function isObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

function unique(values) {
  return [...new Set(values)];
}

function check(name, status, details = null) {
  report.validation.checks.push({
    name,
    status,
    details
  });

  if (status === 'PASSED') {
    report.validation.passed++;
  } else if (status === 'FAILED') {
    report.validation.failed++;
  } else if (status === 'WARNING') {
    report.validation.warnings++;
  }
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function collectOriginEnums(value, output = []) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectOriginEnums(item, output);
    }

    return output;
  }

  if (!isObject(value)) {
    return output;
  }

  for (const [key, child] of Object.entries(value)) {
    if (
      key === 'origin' &&
      isObject(child) &&
      Array.isArray(child.enum)
    ) {
      output.push(...child.enum);
    }

    collectOriginEnums(child, output);
  }

  return output;
}

function validateProvenance(value) {
  return (
    isObject(value) &&
    typeof value.origin === 'string' &&
    value.origin.length > 0 &&
    typeof value.ref === 'string' &&
    value.ref.length > 0
  );
}

function validateSourceCollection(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return {
      valid: false,
      invalid: 1,
      origins: []
    };
  }

  let invalid = 0;
  const origins = [];

  for (const source of sources) {
    if (!validateProvenance(source)) {
      invalid++;
      continue;
    }

    origins.push(source.origin);
  }

  return {
    valid: invalid === 0,
    invalid,
    origins
  };
}

async function loadPackage() {
  if (
    !process.env.SDK_DIR &&
    !process.argv[2]
  ) {
    throw new Error(
      'SDK_DIR is missing. Set SDK_DIR or provide the SDK directory as argument 1.'
    );
  }

  if (!(await exists(SDK_DIR))) {
    throw new Error(
      `SDK directory does not exist: ${SDK_DIR}`
    );
  }

  const packageJsonPath = join(
    SDK_DIR,
    'package.json'
  );

  if (!(await exists(packageJsonPath))) {
    throw new Error(
      `SDK package.json not found: ${packageJsonPath}`
    );
  }

  const packageJson = JSON.parse(
    await readFile(packageJsonPath, 'utf8')
  );

  report.package = {
    name: packageJson.name ?? null,
    version: packageJson.version ?? null,
    license: packageJson.license ?? null,
    type: packageJson.type ?? 'commonjs-default',
    engines: packageJson.engines ?? null,
    packageJsonPath
  };

  check(
    'package-name',
    packageJson.name === EXPECTED_PACKAGE
      ? 'PASSED'
      : 'FAILED',
    {
      expected: EXPECTED_PACKAGE,
      actual: packageJson.name
    }
  );

  check(
    'package-version',
    packageJson.version === EXPECTED_VERSION
      ? 'PASSED'
      : 'FAILED',
    {
      expected: EXPECTED_VERSION,
      actual: packageJson.version
    }
  );

  const nodeMajor = Number(
    process.versions.node.split('.')[0]
  );

  check(
    'node-version',
    nodeMajor >= 20 ? 'PASSED' : 'FAILED',
    {
      required: '>=20',
      actual: process.version
    }
  );

  const declaredNode = packageJson.engines?.node ?? null;

  check(
    'package-node-engine',
    declaredNode === null
      ? 'WARNING'
      : 'PASSED',
    {
      declared: declaredNode
    }
  );

  return packageJson;
}

async function loadPublicExports(packageJson) {
  const loaded = {};

  const sdkRequire = createRequire(
    join(SDK_DIR, '__samantha_validator__.cjs')
  );

  for (const item of EXPORTS) {
    const result = {
      name: item.name,
      specifier: item.specifier,
      exportKey: item.exportKey,
      status: 'FAILED',
      resolvedPath: null,
      error: null
    };

    try {
      const declaredTarget =
        packageJson.exports?.[item.exportKey];

      if (!declaredTarget) {
        throw new Error(
          `Public export ${item.exportKey} is not declared in package.json.`
        );
      }

      result.declaredTarget = declaredTarget;

      const resolvedPath = sdkRequire.resolve(
        item.specifier
      );

      const raw = await readFile(
        resolvedPath,
        'utf8'
      );

      const parsed = JSON.parse(raw);

      if (!isObject(parsed)) {
        throw new Error(
          'Export must contain a JSON object.'
        );
      }

      loaded[item.name] = parsed;

      result.resolvedPath = resolvedPath;
      result.status = 'PASSED';

    } catch (error) {
      result.error = {
        name: error.name,
        message: error.message,
        code: error.code ?? null
      };
    }

    report.exports.push(result);

    check(
      `public-export:${item.name}`,
      result.status === 'PASSED'
        ? 'PASSED'
        : 'FAILED',
      result
    );
  }

  return loaded;
}

function inspectGraph(graph) {
  if (!isObject(graph)) {
    check(
      'graph-root',
      'FAILED',
      'Graph must be a JSON object.'
    );

    return;
  }

  check('graph-root', 'PASSED');

  const compartments = graph.compartments;
  const nodes = graph.nodes;
  const edges = graph.edges;

  const arraysValid =
    Array.isArray(compartments) &&
    Array.isArray(nodes) &&
    Array.isArray(edges);

  check(
    'graph-arrays',
    arraysValid ? 'PASSED' : 'FAILED',
    {
      compartments: Array.isArray(compartments),
      nodes: Array.isArray(nodes),
      edges: Array.isArray(edges)
    }
  );

  if (!arraysValid) {
    return;
  }

  const nodeIds = new Set();
  const duplicateNodeIds = [];

  let invalidNodes = 0;
  let missingSources = 0;
  let invalidNodeSources = 0;
  let invalidAssertions = 0;
  let invalidAssertionProvenance = 0;

  const observedOrigins = [];

  for (const node of nodes) {
    if (
      !isObject(node) ||
      typeof node.id !== 'string' ||
      !node.id ||
      typeof node.label !== 'string' ||
      !node.label ||
      typeof node.kind !== 'string' ||
      !node.kind ||
      typeof node.summary !== 'string' ||
      typeof node.compartment !== 'string' ||
      !node.compartment
    ) {
      invalidNodes++;
    }

    if (node?.id) {
      if (nodeIds.has(node.id)) {
        duplicateNodeIds.push(node.id);
      }

      nodeIds.add(node.id);
    }

    if (
      !Array.isArray(node?.sources) ||
      node.sources.length === 0
    ) {
      missingSources++;
    } else {
      const sourceResult =
        validateSourceCollection(node.sources);

      invalidNodeSources += sourceResult.invalid;

      observedOrigins.push(
        ...sourceResult.origins
      );
    }

    if (
      node?.assertions !== undefined &&
      !Array.isArray(node.assertions)
    ) {
      invalidAssertions++;
      continue;
    }

    for (const assertion of node?.assertions ?? []) {
      if (
        !isObject(assertion) ||
        assertion.subject === undefined ||
        assertion.predicate === undefined ||
        !Object.hasOwn(assertion, 'value') ||
        !isObject(assertion.provenance)
      ) {
        invalidAssertions++;
        continue;
      }

      if (!validateProvenance(assertion.provenance)) {
        invalidAssertionProvenance++;
      } else {
        observedOrigins.push(
          assertion.provenance.origin
        );
      }
    }
  }

  check(
    'unique-node-ids',
    duplicateNodeIds.length === 0
      ? 'PASSED'
      : 'FAILED',
    {
      total: nodes.length,
      duplicates: unique(duplicateNodeIds)
    }
  );

  check(
    'node-required-fields',
    invalidNodes === 0 ? 'PASSED' : 'FAILED',
    {
      total: nodes.length,
      invalid: invalidNodes
    }
  );

  check(
    'node-sources-present',
    missingSources === 0 ? 'PASSED' : 'FAILED',
    {
      missing: missingSources
    }
  );

  check(
    'node-source-provenance',
    invalidNodeSources === 0 ? 'PASSED' : 'FAILED',
    {
      invalid: invalidNodeSources
    }
  );

  check(
    'assertion-structure',
    invalidAssertions === 0 ? 'PASSED' : 'FAILED',
    {
      invalid: invalidAssertions
    }
  );

  check(
    'assertion-provenance',
    invalidAssertionProvenance === 0
      ? 'PASSED'
      : 'FAILED',
    {
      invalid: invalidAssertionProvenance
    }
  );

  const compartmentIds = new Set(
    compartments
      .map(item => item?.id)
      .filter(value => typeof value === 'string')
  );

  const unknownCompartments = [];

  for (const node of nodes) {
    if (
      node?.compartment &&
      !compartmentIds.has(node.compartment)
    ) {
      unknownCompartments.push(node.compartment);
    }
  }

  check(
    'node-compartment-references',
    unknownCompartments.length === 0
      ? 'PASSED'
      : 'FAILED',
    {
      unknown: unique(unknownCompartments)
    }
  );

  let invalidEdges = 0;
  let brokenEdgeReferences = 0;
  let invalidEdgeSources = 0;

  for (const edge of edges) {
    if (
      !isObject(edge) ||
      typeof edge.from !== 'string' ||
      !edge.from ||
      typeof edge.to !== 'string' ||
      !edge.to ||
      typeof edge.kind !== 'string' ||
      !edge.kind ||
      typeof edge.note !== 'string' ||
      !Array.isArray(edge.sources) ||
      edge.sources.length === 0
    ) {
      invalidEdges++;
    }

    if (
      edge?.from &&
      !nodeIds.has(edge.from)
    ) {
      brokenEdgeReferences++;
    }

    if (
      edge?.to &&
      !nodeIds.has(edge.to)
    ) {
      brokenEdgeReferences++;
    }

    if (Array.isArray(edge?.sources)) {
      const sourceResult =
        validateSourceCollection(edge.sources);

      invalidEdgeSources += sourceResult.invalid;

      observedOrigins.push(
        ...sourceResult.origins
      );
    }
  }

  check(
    'edge-required-fields',
    invalidEdges === 0 ? 'PASSED' : 'FAILED',
    {
      total: edges.length,
      invalid: invalidEdges
    }
  );

  check(
    'edge-node-references',
    brokenEdgeReferences === 0
      ? 'PASSED'
      : 'FAILED',
    {
      invalid: brokenEdgeReferences
    }
  );

  check(
    'edge-source-provenance',
    invalidEdgeSources === 0
      ? 'PASSED'
      : 'FAILED',
    {
      invalid: invalidEdgeSources
    }
  );

  const declaredCounts = graph.counts ?? {};

  const actualCounts = {
    compartments: compartments.length,
    nodes: nodes.length,
    edges: edges.length
  };

  const countMismatches = [];

  for (const [name, actual] of Object.entries(actualCounts)) {
    if (
      typeof declaredCounts[name] === 'number' &&
      declaredCounts[name] !== actual
    ) {
      countMismatches.push({
        field: name,
        declared: declaredCounts[name],
        actual
      });
    }
  }

  check(
    'declared-counts',
    countMismatches.length === 0
      ? 'PASSED'
      : 'WARNING',
    {
      declared: declaredCounts,
      actual: actualCounts,
      mismatches: countMismatches
    }
  );

  report.compatibility.observedOrigins =
    unique(observedOrigins).sort();

  report.graph = {
    schemaVersion: graph.schemaVersion ?? null,
    graphVersion: graph.graphVersion ?? null,
    generatedFor: graph.generatedFor ?? null,

    compartments: compartments.length,
    nodes: nodes.length,
    edges: edges.length,

    maturityEntries: Array.isArray(graph.maturity)
      ? graph.maturity.length
      : null,

    contradictions: Array.isArray(graph.contradictions)
      ? graph.contradictions.length
      : null,

    declaredCounts,
    actualCounts
  };
}

function inspectSchema(schema) {
  if (!isObject(schema)) {
    check(
      'schema-root',
      'FAILED',
      'Schema must be a JSON object.'
    );

    return;
  }

  check('schema-root', 'PASSED');

  const rootContract =
    schema.type === 'object' &&
    [
      'schemaVersion',
      'compartments',
      'nodes',
      'edges'
    ].every(field =>
      schema.required?.includes(field)
    );

  check(
    'schema-root-contract',
    rootContract ? 'PASSED' : 'WARNING',
    {
      type: schema.type ?? null,
      required: schema.required ?? []
    }
  );

  report.compatibility.schemaOrigins =
    unique(
      collectOriginEnums(schema)
        .filter(value => typeof value === 'string')
    ).sort();

  check(
    'schema-origin-enum-discovery',
    report.compatibility.schemaOrigins.length > 0
      ? 'PASSED'
      : 'WARNING',
    {
      origins: report.compatibility.schemaOrigins
    }
  );
}

async function inspectTypeScriptDeclarations(packageRoot) {
  const candidates = [
    'dist/knowledge/substrate/types.d.ts',
    'dist/knowledge/types.d.ts',
    'knowledge/substrate/types.d.ts',
    'knowledge/types.d.ts',
    'dist/types.d.ts',
    'types.d.ts'
  ];

  let declarationFound = false;

  for (const candidate of candidates) {
    const path = join(packageRoot, candidate);

    if (!(await exists(path))) {
      continue;
    }

    declarationFound = true;

    const content = await readFile(path, 'utf8');

    const match = content.match(
      /(?:type|interface)\s+ClaimOrigin[^=]*=\s*([^;]+);?/s
    );

    if (!match) {
      continue;
    }

    const values = [
      ...match[1].matchAll(/['"]([^'"]+)['"]/g)
    ].map(item => item[1]);

    report.compatibility.typescriptOrigins =
      unique(values).sort();

    check(
      'typescript-origin-declaration',
      values.length > 0 ? 'PASSED' : 'WARNING',
      {
        path: candidate,
        origins: report.compatibility.typescriptOrigins
      }
    );

    return;
  }

  check(
    'typescript-origin-declaration',
    'WARNING',
    declarationFound
      ? 'Declaration files found, but ClaimOrigin was not parsed.'
      : 'No declaration found in inspected candidate paths.'
  );
}

function compareOrigins() {
  const observed =
    report.compatibility.observedOrigins;

  const schema =
    report.compatibility.schemaOrigins;

  const typescript =
    report.compatibility.typescriptOrigins;

  const observedNotInSchema = observed.filter(
    value => !schema.includes(value)
  );

  const typescriptNotInSchema = typescript.filter(
    value => !schema.includes(value)
  );

  const schemaNotInTypescript = (
    typescript.length > 0
  )
    ? schema.filter(value => !typescript.includes(value))
    : [];

  if (observedNotInSchema.length > 0) {
    report.compatibility.conflicts.push({
      id: 'ORIGIN_GRAPH_SCHEMA_MISMATCH',
      type: 'OBJECTIVE',
      status: 'CONFLICTING',
      observedNotInSchema
    });
  }

  if (
    typescriptNotInSchema.length > 0 ||
    schemaNotInTypescript.length > 0
  ) {
    report.compatibility.conflicts.push({
      id: 'ORIGIN_TYPESCRIPT_SCHEMA_MISMATCH',
      type: 'OBJECTIVE',
      status: 'CONFLICTING',
      typescriptNotInSchema,
      schemaNotInTypescript
    });
  }

  const hasConflict =
    report.compatibility.conflicts.length > 0;

  report.compatibility.status =
    hasConflict ? 'CONFLICTING' : 'ALIGNED';

  check(
    'observed-origins-allowed-by-schema',
    observedNotInSchema.length === 0
      ? 'PASSED'
      : 'WARNING',
    {
      observed,
      schema,
      observedNotInSchema
    }
  );

  if (typescript.length > 0) {
    check(
      'typescript-schema-origin-alignment',
      typescriptNotInSchema.length === 0 &&
      schemaNotInTypescript.length === 0
        ? 'PASSED'
        : 'WARNING',
      {
        typescript,
        schema,
        typescriptNotInSchema,
        schemaNotInTypescript
      }
    );
  } else {
    check(
      'typescript-schema-origin-alignment',
      'WARNING',
      'TypeScript origin declaration unavailable; comparison incomplete.'
    );
  }
}

function determineReadiness() {
  const failed = report.validation.failed;
  const warnings = report.validation.warnings;
  const conflicts =
    report.compatibility.conflicts.length;

  if (failed > 0) {
    report.readiness.importReadiness = 'BLOCKED';
  } else if (warnings > 0 || conflicts > 0) {
    report.readiness.importReadiness = 'REVIEW_REQUIRED';
  } else {
    report.readiness.importReadiness =
      'STRUCTURAL_CHECKS_PASSED';
  }

  report.limitations = [
    'Structural checks do not establish factual correctness of game mechanics.',
    'Numerical formulas and values are not independently verified.',
    'Third-party redistribution rights are not assessed.',
    'Full JSON Schema validation of every graph element is not performed.',
    'TypeScript declaration discovery is limited to inspected paths.',
    'Unknown SDK values are preserved and are not silently normalized.',
    'A passing result does not authorize bulk import into Samantha GKB.'
  ];
}

async function saveReport() {
  await mkdir(dirname(REPORT_PATH), {
    recursive: true
  });

  report.summary = {
    status:
      report.validation.failed > 0
        ? 'FAILED'
        : report.validation.warnings > 0
          ? 'PASSED_WITH_WARNINGS'
          : 'PASSED',

    passed: report.validation.passed,
    failed: report.validation.failed,
    warnings: report.validation.warnings,

    compatibilityStatus:
      report.compatibility.status,

    importReadiness:
      report.readiness.importReadiness
  };

  report.finishedAt = new Date().toISOString();

  await writeFile(
    REPORT_PATH,
    JSON.stringify(report, null, 2) + '\n',
    'utf8'
  );

  console.log('\n========================================');
  console.log(' SAMANTHA SDK RUNTIME VALIDATOR v4.1.0');
  console.log('========================================');

  console.log(
    `Package: ${report.package?.name ?? 'UNKNOWN'}`
  );

  console.log(
    `Version: ${report.package?.version ?? 'UNKNOWN'}`
  );

  console.log(
    `Graph nodes: ${report.graph?.nodes ?? 'UNKNOWN'}`
  );

  console.log(
    `Graph edges: ${report.graph?.edges ?? 'UNKNOWN'}`
  );

  console.log(
    `Passed: ${report.validation.passed}`
  );

  console.log(
    `Failed: ${report.validation.failed}`
  );

  console.log(
    `Warnings: ${report.validation.warnings}`
  );

  console.log(
    `Compatibility: ${report.compatibility.status}`
  );

  console.log(
    `Import readiness: ${report.readiness.importReadiness}`
  );

  console.log(`Report: ${REPORT_PATH}`);
}

async function main() {
  console.log(
    'Starting Samantha TheTowerSDK Validator v4.1.0...'
  );

  const packageJson = await loadPackage();

  const loaded = await loadPublicExports(packageJson);

  const graph = loaded['knowledge-graph'];
  const schema = loaded['knowledge-schema'];

  if (graph) {
    inspectGraph(graph);
  } else {
    check(
      'graph-validation',
      'FAILED',
      'Knowledge graph export unavailable.'
    );
  }

  if (schema) {
    inspectSchema(schema);
  } else {
    check(
      'schema-validation',
      'FAILED',
      'Knowledge schema export unavailable.'
    );
  }

  await inspectTypeScriptDeclarations(SDK_DIR);

  if (graph && schema) {
    compareOrigins();
  } else {
    report.compatibility.status = 'NOT_ASSESSED';

    check(
      'origin-compatibility',
      'WARNING',
      'Graph or schema unavailable.'
    );
  }
}

try {
  await main();
} catch (error) {
  check(
    'validator-execution',
    'FAILED',
    {
      name: error.name,
      message: error.message,
      code: error.code ?? null,
      stack: error.stack ?? null
    }
  );
}

determineReadiness();

try {
  await saveReport();
} catch (error) {
  console.error(
    'REPORT_WRITE_FAILED:',
    error.message
  );

  process.exitCode = 2;
}

if (report.validation.failed > 0) {
  process.exitCode = 1;
}
