#!/usr/bin/env node

/**
 * Samantha - TheTowerSDK JSON Export Compatibility Test
 * Version: 3.0.0
 *
 * Target:
 *   thetowersdk@0.14.1
 *   Node.js >= 20
 *
 * Usage:
 *   node test-sdk-runtime-v3.mjs <sdk-package-dir> [report-path]
 *
 * This script:
 *   1. Verifies SDK package identity and version.
 *   2. Loads knowledge-graph.json.
 *   3. Loads knowledge.schema.json.
 *   4. Checks graph structure.
 *   5. Checks node and edge references.
 *   6. Checks provenance structure.
 *   7. Detects duplicate IDs.
 *   8. Audits origin enum differences.
 *   9. Generates a JSON report.
 *
 * It does NOT:
 *   - Modify SDK data.
 *   - Verify the factual correctness of game mechanics.
 *   - Perform complete JSON Schema validation.
 *   - Establish third-party redistribution rights.
 */

import {
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises';

import {
  dirname,
  join,
  resolve,
} from 'node:path';

import {
  createRequire,
} from 'node:module';

const EXPECTED_PACKAGE = 'thetowersdk';
const EXPECTED_VERSION = '0.14.1';

const TYPESCRIPT_ORIGINS = [
  'game',
  'code',
  'wiki',
  'user',
  'save',
  'external-repo',
  'sheet',
];

const packageDir = process.argv[2]
  ? resolve(process.argv[2])
  : null;

const reportPath = resolve(
  process.argv[3] ?? 'sdk-json-export-report.json'
);

const report = {
  test: 'Samantha TheTowerSDK JSON Export Compatibility Test',
  testVersion: '3.0.0',

  startedAt: new Date().toISOString(),

  runtime: {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
  },

  expected: {
    package: EXPECTED_PACKAGE,
    version: EXPECTED_VERSION,
  },

  package: null,
  exports: [],
  graph: null,
  schema: null,
  originAudit: null,

  checks: [],

  summary: {
    tested: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  },

  status: 'FAILED',

  limitations: [
    'Checks JSON export loading and selected structural constraints.',
    'Does not perform complete JSON Schema validation.',
    'Does not verify factual correctness of game claims.',
    'Does not verify numerical mechanics or formulas.',
    'Does not establish redistribution rights.',
  ],
};

const isObject = value =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value);

const addCheck = (
  name,
  passed,
  details = null,
  warning = false
) => {
  report.checks.push({
    name,
    status: passed
      ? 'PASSED'
      : warning
        ? 'WARNING'
        : 'FAILED',
    details,
  });
};

const errorDetails = error => ({
  name: error?.name ?? 'Error',
  message: error?.message ?? String(error),
  code: error?.code ?? null,
});

const fatal = error => {
  report.fatalError = errorDetails(error);
};

async function main() {

  if (!packageDir) {
    throw new Error(
      'Usage: node test-sdk-runtime-v3.mjs <sdk-package-dir> [report-path]'
    );
  }

  const nodeMajor = Number(
    process.versions.node.split('.')[0]
  );

  if (nodeMajor < 20) {
    throw new Error('Node.js >=20 is required.');
  }

  // --------------------------------------------------
  // 1. PACKAGE IDENTITY
  // --------------------------------------------------

  const packageJson = JSON.parse(
    await readFile(
      join(packageDir, 'package.json'),
      'utf8'
    )
  );

  if (
    packageJson.name !== EXPECTED_PACKAGE ||
    packageJson.version !== EXPECTED_VERSION
  ) {
    throw new Error(
      `Expected ${EXPECTED_PACKAGE}@${EXPECTED_VERSION}; ` +
      `found ${packageJson.name}@${packageJson.version}`
    );
  }

  report.package = {
    name: packageJson.name,
    version: packageJson.version,
    license: packageJson.license ?? null,
    engines: packageJson.engines ?? null,
    packageType: packageJson.type ?? 'commonjs-default',
    exportPaths: Object.keys(
      packageJson.exports ?? {}
    ).sort(),
  };

  // --------------------------------------------------
  // 2. LOAD PUBLIC JSON EXPORTS
  // --------------------------------------------------

  const sdkRequire = createRequire(
    join(packageDir, '__samantha_v3_test__.cjs')
  );

  const targets = [
    {
      name: 'knowledge-graph',
      specifier: `${EXPECTED_PACKAGE}/knowledge-graph.json`,
      declaredTarget:
        packageJson.exports?.['./knowledge-graph.json'],
    },
    {
      name: 'knowledge-schema',
      specifier: `${EXPECTED_PACKAGE}/knowledge.schema.json`,
      declaredTarget:
        packageJson.exports?.['./knowledge.schema.json'],
    },
  ];

  const loaded = {};

  for (const target of targets) {

    const result = {
      name: target.name,
      specifier: target.specifier,
      declaredTarget: target.declaredTarget ?? null,
      status: 'FAILED',
      resolvedPath: null,
      error: null,
    };

    try {

      if (!target.declaredTarget) {
        throw new Error(
          'Export is missing from package.json.'
        );
      }

      result.resolvedPath = sdkRequire.resolve(
        target.specifier
      );

      loaded[target.name] = sdkRequire(
        target.specifier
      );

      if (!isObject(loaded[target.name])) {
        throw new Error(
          'Export did not resolve to a JSON object.'
        );
      }

      result.status = 'PASSED';

    } catch (error) {

      result.error = errorDetails(error);

    }

    report.exports.push(result);
  }

  const graph = loaded['knowledge-graph'];
  const schema = loaded['knowledge-schema'];

  // --------------------------------------------------
  // 3. GRAPH STRUCTURE
  // --------------------------------------------------

  if (!isObject(graph)) {
    addCheck(
      'graph-object',
      false,
      'Knowledge graph could not be loaded.'
    );

    return;
  }

  const compartments = Array.isArray(graph.compartments)
    ? graph.compartments
    : [];

  const nodes = Array.isArray(graph.nodes)
    ? graph.nodes
    : [];

  const edges = Array.isArray(graph.edges)
    ? graph.edges
    : [];

  report.graph = {
    schemaVersion: graph.schemaVersion ?? null,
    graphVersion: graph.graphVersion ?? null,
    generatedFor: graph.generatedFor ?? null,

    countsDeclared: graph.counts ?? null,

    compartments: compartments.length,
    nodes: nodes.length,
    edges: edges.length,

    maturityEntries: Array.isArray(graph.maturity)
      ? graph.maturity.length
      : null,

    contradictions: Array.isArray(graph.contradictions)
      ? graph.contradictions.length
      : null,
  };

  addCheck(
    'graph-schema-version',
    Number.isInteger(graph.schemaVersion) &&
      graph.schemaVersion >= 1,
    { actual: graph.schemaVersion }
  );

  addCheck(
    'graph-compartments-array',
    Array.isArray(graph.compartments)
  );

  addCheck(
    'graph-nodes-array',
    Array.isArray(graph.nodes)
  );

  addCheck(
    'graph-edges-array',
    Array.isArray(graph.edges)
  );

  // --------------------------------------------------
  // 4. NODE VALIDATION
  // --------------------------------------------------

  const nodeIds = new Set();

  let duplicateNodeIds = 0;
  let invalidNodes = 0;
  let missingSources = 0;
  let invalidProvenance = 0;
  let invalidAssertions = 0;

  const observedOrigins = new Set();

  for (const node of nodes) {

    if (
      !isObject(node) ||
      !node.id ||
      !node.label ||
      !node.kind ||
      typeof node.summary !== 'string' ||
      !node.compartment
    ) {
      invalidNodes++;
    }

    if (node?.id) {

      if (nodeIds.has(node.id)) {
        duplicateNodeIds++;
      }

      nodeIds.add(node.id);
    }

    if (
      !Array.isArray(node?.sources) ||
      node.sources.length === 0
    ) {
      missingSources++;
    }

    for (const source of Array.isArray(node?.sources)
      ? node.sources
      : []) {

      if (
        !isObject(source) ||
        !source.origin ||
        !source.ref ||
        !source.verifiedAt
      ) {
        invalidProvenance++;
      }

      if (source?.origin) {
        observedOrigins.add(source.origin);
      }
    }

    for (const assertion of Array.isArray(node?.assertions)
      ? node.assertions
      : []) {

      if (
        !isObject(assertion) ||
        !assertion.subject ||
        !assertion.predicate ||
        !Object.hasOwn(assertion, 'value') ||
        !isObject(assertion.provenance)
      ) {
        invalidAssertions++;
      }

      if (assertion?.provenance?.origin) {
        observedOrigins.add(
          assertion.provenance.origin
        );
      }
    }
  }

  addCheck(
    'unique-node-ids',
    duplicateNodeIds === 0,
    { duplicateNodeIds }
  );

  addCheck(
    'node-required-fields',
    invalidNodes === 0,
    { invalidNodes }
  );

  addCheck(
    'node-sources-present',
    missingSources === 0,
    { missingSources }
  );

  addCheck(
    'node-provenance-shape',
    invalidProvenance === 0,
    { invalidProvenance }
  );

  addCheck(
    'assertion-required-fields',
    invalidAssertions === 0,
    { invalidAssertions }
  );

  // --------------------------------------------------
  // 5. COMPARTMENT REFERENCES
  // --------------------------------------------------

  const compartmentIds = new Set(
    compartments
      .map(item => item?.id)
      .filter(Boolean)
  );

  let unknownCompartments = 0;

  for (const node of nodes) {

    if (
      node?.compartment &&
      !compartmentIds.has(node.compartment)
    ) {
      unknownCompartments++;
    }
  }

  addCheck(
    'node-compartment-references',
    unknownCompartments === 0,
    { unknownCompartments }
  );

  // --------------------------------------------------
  // 6. EDGE VALIDATION
  // --------------------------------------------------

  let invalidEdges = 0;
  let brokenReferences = 0;
  let invalidEdgeProvenance = 0;

  for (const edge of edges) {

    if (
      !isObject(edge) ||
      !edge.from ||
      !edge.to ||
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
      brokenReferences++;
    }

    if (
      edge?.to &&
      !nodeIds.has(edge.to)
    ) {
      brokenReferences++;
    }

    for (const source of Array.isArray(edge?.sources)
      ? edge.sources
      : []) {

      if (
        !isObject(source) ||
        !source.origin ||
        !source.ref ||
        !source.verifiedAt
      ) {
        invalidEdgeProvenance++;
      }

      if (source?.origin) {
        observedOrigins.add(source.origin);
      }
    }
  }

  addCheck(
    'edge-required-fields',
    invalidEdges === 0,
    { invalidEdges }
  );

  addCheck(
    'edge-provenance',
    invalidEdgeProvenance === 0,
    { invalidEdgeProvenance }
  );

  addCheck(
    'edge-node-references',
    brokenReferences === 0,
    { brokenReferences }
  );

  // --------------------------------------------------
  // 7. DECLARED COUNTS
  // --------------------------------------------------

  const declaredCounts = graph.counts ?? {};

  const countsMatch =
    (declaredCounts.nodes == null ||
      declaredCounts.nodes === nodes.length) &&
    (declaredCounts.edges == null ||
      declaredCounts.edges === edges.length) &&
    (declaredCounts.compartments == null ||
      declaredCounts.compartments === compartments.length);

  addCheck(
    'declared-counts-match',
    countsMatch,
    {
      declared: declaredCounts,
      actual: {
        nodes: nodes.length,
        edges: edges.length,
        compartments: compartments.length,
      },
    }
  );

  // --------------------------------------------------
  // 8. SCHEMA AND ORIGIN AUDIT
  // --------------------------------------------------

  if (!isObject(schema)) {

    addCheck(
      'schema-object',
      false,
      'Knowledge schema could not be loaded.'
    );

    return;
  }

  const nodeProperties =
    schema.properties?.nodes?.items?.properties;

  const edgeProperties =
    schema.properties?.edges?.items?.properties;

  const schemaOrigins = [
    ...(nodeProperties?.sources?.items?.properties?.origin?.enum ?? []),

    ...(nodeProperties?.assertions?.items?.properties?.provenance?.properties?.origin?.enum ?? []),

    ...(edgeProperties?.sources?.items?.properties?.origin?.enum ?? []),
  ];

  const uniqueSchemaOrigins = [
    ...new Set(schemaOrigins),
  ].sort();

  const actualOrigins = [
    ...observedOrigins,
  ].sort();

  const schemaOnly = uniqueSchemaOrigins.filter(
    value => !TYPESCRIPT_ORIGINS.includes(value)
  );

  const typescriptOnly = TYPESCRIPT_ORIGINS.filter(
    value => !uniqueSchemaOrigins.includes(value)
  );

  const observedNotInSchema = actualOrigins.filter(
    value => !uniqueSchemaOrigins.includes(value)
  );

  report.originAudit = {
    typescriptOrigins: [...TYPESCRIPT_ORIGINS].sort(),
    schemaOrigins: uniqueSchemaOrigins,
    observedOrigins: actualOrigins,
    schemaOnly,
    typescriptOnly,
    observedNotInSchema,
  };

  report.schema = {
    id: schema.$id ?? null,
    draft: schema.$schema ?? null,
    title: schema.title ?? null,

    requiredRootProperties: schema.required ?? [],

    provenanceOriginEnum: uniqueSchemaOrigins,

    nodeKindEnum:
      nodeProperties?.kind?.enum ?? [],

    verificationEnum:
      nodeProperties?.verification?.enum ?? [],

    edgeKindEnum:
      edgeProperties?.kind?.enum ?? [],
  };

  const rootContract =
    schema.type === 'object' &&
    [
      'schemaVersion',
      'compartments',
      'nodes',
      'edges',
    ].every(key =>
      schema.required?.includes(key)
    );

  addCheck(
    'schema-root-contract',
    rootContract,
    {
      type: schema.type,
      required: schema.required,
    }
  );

  addCheck(
    'observed-origins-allowed-by-schema',
    observedNotInSchema.length === 0,
    { observedNotInSchema }
  );

  addCheck(
    'typescript-schema-origin-alignment',
    schemaOnly.length === 0 &&
      typescriptOnly.length === 0,
    {
      schemaOnly,
      typescriptOnly,
    },
    true
  );
}

// --------------------------------------------------
// 9. EXECUTION
// --------------------------------------------------

try {

  await main();

} catch (error) {

  fatal(error);

}

// --------------------------------------------------
// 10. REPORT GENERATION
// --------------------------------------------------

report.finishedAt = new Date().toISOString();

report.summary = {
  tested:
    report.exports.length +
    report.checks.length,

  passed:
    report.exports.filter(
      item => item.status === 'PASSED'
    ).length +
    report.checks.filter(
      item => item.status === 'PASSED'
    ).length,

  failed:
    report.exports.filter(
      item => item.status === 'FAILED'
    ).length +
    report.checks.filter(
      item => item.status === 'FAILED'
    ).length,

  warnings:
    report.checks.filter(
      item => item.status === 'WARNING'
    ).length,
};

report.status =
  report.fatalError ||
  report.summary.failed > 0
    ? 'FAILED'
    : report.summary.warnings > 0
      ? 'PASSED_WITH_WARNINGS'
      : 'PASSED';

try {

  await mkdir(
    dirname(reportPath),
    { recursive: true }
  );

  await writeFile(
    reportPath,
    JSON.stringify(report, null, 2) + '\n',
    'utf8'
  );

} catch (error) {

  console.error(
    'REPORT_WRITE_FAILED:',
    JSON.stringify(errorDetails(error))
  );

  process.exitCode = 2;
}

console.log(
  JSON.stringify(report, null, 2)
);

if (report.status === 'FAILED') {
  process.exitCode = 1;
}
