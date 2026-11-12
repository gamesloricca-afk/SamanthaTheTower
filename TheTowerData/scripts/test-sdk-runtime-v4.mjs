
#!/usr/bin/env node

/**
 * Samantha - TheTowerSDK Runtime Validator v4
 *
 * Target:
 *   thetowersdk@0.14.1
 *
 * Purpose:
 *   - Verify package identity and runtime compatibility.
 *   - Verify public JSON exports.
 *   - Validate knowledge graph structure.
 *   - Validate node, edge, source, and provenance references.
 *   - Compare observed claim origins with JSON Schema enums.
 *   - Inspect published TypeScript declarations when available.
 *   - Preserve unknown values and report compatibility conflicts.
 *
 * Important:
 *   This script does NOT validate factual game mechanics.
 *   This script does NOT modify SDK data.
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
  join
} from 'node:path';

import {
  createRequire
} from 'node:module';

import process from 'node:process';

const EXPECTED_PACKAGE = 'thetowersdk';
const EXPECTED_VERSION = '0.14.1';

const OUTPUT_FILE = resolve(
  process.cwd(),
  'TheTowerData/reports/sdk-runtime-v4-report.json'
);

const MODULES = [
  'thetowersdk/knowledge-graph.json',
  'thetowersdk/knowledge.schema.json'
];

const report = {
  validator: {
    name: 'Samantha TheTowerSDK Runtime Validator',
    version: '4.0.0'
  },

  execution: {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    workingDirectory: process.cwd()
  },

  package: {},
  exports: [],
  graph: {},
  validation: {
    checks: [],
    passed: 0,
    failed: 0,
    warnings: 0
  },

  compatibility: {
    status: 'NOT_ASSESSED',
    observedOrigins: [],
    schemaOrigins: [],
    typescriptOrigins: [],
    conflicts: []
  },

  readiness: {
    importReadiness: 'NOT_ASSESSED',
    factualValidation: 'NOT_PERFORMED',
    redistributionReview: 'NOT_PERFORMED'
  },

  limitations: []
};

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

function unique(values) {
  return [...new Set(values)];
}

function isObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function collectStrings(value, output = []) {
  if (typeof value === 'string') {
    output.push(value);
    return output;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, output);
    }

    return output;
  }

  if (isObject(value)) {
    for (const item of Object.values(value)) {
      collectStrings(item, output);
    }
  }

  return output;
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

function validateRequiredFields(
  object,
  fields,
  label,
  errors
) {
  if (!isObject(object)) {
    errors.push(`${label}: expected object`);
    return;
  }

  for (const field of fields) {
    if (
      object[field] === undefined ||
      object[field] === null
    ) {
      errors.push(`${label}: missing ${field}`);
    }
  }
}

async function resolvePackage() {
  const require = createRequire(
    join(process.cwd(), 'package.json')
  );

  const packageJsonPath = require.resolve(
    `${EXPECTED_PACKAGE}/package.json`
  );

  const packageJson = JSON.parse(
    await readFile(packageJsonPath, 'utf8')
  );

  report.package = {
    name: packageJson.name,
    version: packageJson.version,
    type: packageJson.type ?? 'commonjs',
    engines: packageJson.engines ?? null,
    license: packageJson.license ?? null,
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

  const minimumNode = Number(
    packageJson.engines?.node?.match(/\d+/)?.[0] ?? 0
  );

  check(
    'node-version',
    Number(process.versions.node.split('.')[0]) >= 20
      ? 'PASSED'
      : 'FAILED',
    {
      required: '>=20',
      actual: process.version,
      packageRequirement: packageJson.engines?.node ?? null
    }
  );

  return {
    require,
    packageJsonPath,
    packageRoot: dirname(packageJsonPath)
  };
}

async function loadJsonExports(require) {
  const loaded = {};

  for (const moduleName of MODULES) {
    try {
      const modulePath = require.resolve(moduleName);
      const content = JSON.parse(
        await readFile(modulePath, 'utf8')
      );

      loaded[moduleName] = content;

      report.exports.push({
        name: moduleName,
        status: 'PASSED',
        resolvedPath: modulePath,
        format: 'JSON'
      });

      check(
        `public-export:${moduleName}`,
        'PASSED'
      );
    } catch (error) {
      report.exports.push({
        name: moduleName,
        status: 'FAILED',
        error: error.message
      });

      check(
        `public-export:${moduleName}`,
        'FAILED',
        error.message
      );
    }
  }

  return loaded;
}

function inspectGraph(graph) {
  const errors = [];
  const warnings = [];

  if (!isObject(graph)) {
    check(
      'graph-root',
      'FAILED',
      'Graph root must be an object'
    );

    return;
  }

  check('graph-root', 'PASSED');

  const compartments = graph.compartments;
  const nodes = graph.nodes;
  const edges = graph.edges;

  for (const [name, value] of Object.entries({
    compartments,
    nodes,
    edges
  })) {
    if (!Array.isArray(value)) {
      errors.push(`${name} must be an array`);
    }
  }

  if (errors.length > 0) {
    check(
      'graph-arrays',
      'FAILED',
      errors
    );

    return;
  }

  check('graph-arrays', 'PASSED');

  const nodeIds = nodes.map(node => node?.id);
  const validNodeIds = nodeIds.filter(
    id => typeof id === 'string' && id.length > 0
  );

  const duplicateNodeIds = validNodeIds.filter(
    (id, index) => validNodeIds.indexOf(id) !== index
  );

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

  const nodeIdSet = new Set(validNodeIds);
  const compartmentIds = new Set(
    compartments
      .map(item => item?.id)
      .filter(Boolean)
  );

  let invalidNodes = 0;
  let missingSources = 0;
  let invalidAssertions = 0;
  let invalidProvenance = 0;

  const observedOrigins = [];

  for (const node of nodes) {
    const required = [
      'id',
      'label',
      'kind'
    ];

    if (
      required.some(
        field => node?.[field] === undefined ||
          node?.[field] === null
      )
    ) {
      invalidNodes++;
    }

    if (
      !Array.isArray(node?.sources) ||
      node.sources.length === 0
    ) {
      missingSources++;
    }

    if (Array.isArray(node?.assertions)) {
      for (const assertion of node.assertions) {
        if (
          !isObject(assertion) ||
          assertion.subject === undefined ||
          assertion.predicate === undefined ||
          assertion.value === undefined
        ) {
          invalidAssertions++;
        }

        if (assertion?.provenance) {
          const provenance = assertion.provenance;

          if (
            !isObject(provenance) ||
            !provenance.origin ||
            !provenance.ref
          ) {
            invalidProvenance++;
          }

          if (typeof provenance.origin === 'string') {
            observedOrigins.push(provenance.origin);
          }
        }
      }
    }

    if (Array.isArray(node?.sources)) {
      for (const source of node.sources) {
        if (
          typeof source === 'string' &&
          source.length === 0
        ) {
          warnings.push('Empty source reference');
        }
      }
    }
  }

  check(
    'node-required-fields',
    invalidNodes === 0 ? 'PASSED' : 'FAILED',
    {
      total: nodes.length,
      invalid: invalidNodes
    }
  );

  check(
    'node-sources',
    missingSources === 0 ? 'PASSED' : 'FAILED',
    {
      total: nodes.length,
      missing: missingSources
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
    'provenance-structure',
    invalidProvenance === 0 ? 'PASSED' : 'FAILED',
    {
      invalid: invalidProvenance
    }
  );

  const unknownCompartmentRefs = [];

  for (const node of nodes) {
    const refs = [];

    if (node?.compartment) {
      refs.push(node.compartment);
    }

    if (Array.isArray(node?.compartments)) {
      refs.push(...node.compartments);
    }

    for (const ref of refs) {
      if (
        typeof ref === 'string' &&
        !compartmentIds.has(ref)
      ) {
        unknownCompartmentRefs.push(ref);
      }
    }
  }

  check(
    'compartment-references',
    unknownCompartmentRefs.length === 0
      ? 'PASSED'
      : 'WARNING',
    {
      unknown: unique(unknownCompartmentRefs)
    }
  );

  let invalidEdges = 0;
  let invalidEdgeRefs = 0;
  let invalidEdgeProvenance = 0;

  for (const edge of edges) {
    if (
      !isObject(edge) ||
      !edge.id ||
      !edge.kind
    ) {
      invalidEdges++;
    }

    const from = edge?.from ?? edge?.source;
    const to = edge?.to ?? edge?.target;

    if (
      !from ||
      !to ||
      !nodeIdSet.has(from) ||
      !nodeIdSet.has(to)
    ) {
      invalidEdgeRefs++;
    }

    if (
      edge?.provenance !== undefined &&
      (
        !isObject(edge.provenance) ||
        !edge.provenance.origin ||
        !edge.provenance.ref
      )
    ) {
      invalidEdgeProvenance++;
    }
  }

  check(
    'edge-structure',
    invalidEdges === 0 ? 'PASSED' : 'FAILED',
    {
      total: edges.length,
      invalid: invalidEdges
    }
  );

  check(
    'edge-node-references',
    invalidEdgeRefs === 0 ? 'PASSED' : 'FAILED',
    {
      invalid: invalidEdgeRefs
    }
  );

  check(
    'edge-provenance',
    invalidEdgeProvenance === 0
      ? 'PASSED'
      : 'FAILED',
    {
      invalid: invalidEdgeProvenance
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
    observedOrigins: report.compatibility.observedOrigins,
    warnings
  };

  inspectDeclaredCounts(graph, {
    compartments: compartments.length,
    nodes: nodes.length,
    edges: edges.length
  });
}

function inspectDeclaredCounts(graph, actual) {
  const possibleCountFields = [
    'counts',
    'stats',
    'metadata'
  ];

  const declared = {};

  for (const field of possibleCountFields) {
    if (isObject(graph[field])) {
      Object.assign(declared, graph[field]);
    }
  }

  const comparisons = [
    ['compartments', actual.compartments],
    ['nodes', actual.nodes],
    ['edges', actual.edges]
  ];

  const mismatches = [];

  for (const [name, count] of comparisons) {
    if (
      typeof declared[name] === 'number' &&
      declared[name] !== count
    ) {
      mismatches.push({
        field: name,
        declared: declared[name],
        actual: count
      });
    }
  }

  check(
    'declared-counts',
    mismatches.length === 0
      ? 'PASSED'
      : 'WARNING',
    {
      declared,
      actual,
      mismatches
    }
  );
}

function inspectSchema(schema) {
  if (!isObject(schema)) {
    check(
      'schema-root',
      'FAILED',
      'JSON Schema root must be an object'
    );

    return;
  }

  check('schema-root', 'PASSED');

  const origins = unique(
    collectOriginEnums(schema)
      .filter(value => typeof value === 'string')
  ).sort();

  report.compatibility.schemaOrigins = origins;

  check(
    'schema-origin-enum-discovery',
    origins.length > 0 ? 'PASSED' : 'WARNING',
    {
      origins
    }
  );
}

async function inspectTypeScriptDeclarations(packageRoot) {
  const candidates = [
    join(
      packageRoot,
      'dist/knowledge/substrate/types.d.ts'
    ),

    join(
      packageRoot,
      'dist/knowledge/types.d.ts'
    ),

    join(
      packageRoot,
      'knowledge/substrate/types.d.ts'
    ),

    join(
      packageRoot,
      'knowledge/types.d.ts'
    )
  ];

  let found = false;

  for (const path of candidates) {
    if (!(await fileExists(path))) {
      continue;
    }

    found = true;

    const content = await readFile(path, 'utf8');

    const match = content.match(
      /(?:type|interface)\s+ClaimOrigin[^=]*=\s*([^;]+);?/s
    );

    if (match) {
      const values = [
        ...match[1].matchAll(/['"]([^'"]+)['"]/g)
      ].map(item => item[1]);

      report.compatibility.typescriptOrigins =
        unique(values).sort();

      check(
        'typescript-origin-declaration',
        values.length > 0 ? 'PASSED' : 'WARNING',
        {
          path,
          origins: report.compatibility.typescriptOrigins
        }
      );

      return;
    }
  }

  check(
    'typescript-origin-declaration',
    'WARNING',
    found
      ? 'Declaration found but ClaimOrigin could not be parsed'
      : 'Published declaration files not found in inspected paths'
  );
}

function compareOrigins() {
  const observed = report.compatibility.observedOrigins;
  const schema = report.compatibility.schemaOrigins;
  const typescript = report.compatibility.typescriptOrigins;

  const missingFromSchema = observed.filter(
    origin => !schema.includes(origin)
  );

  const missingFromTypes = typescript.filter(
    origin => !schema.includes(origin)
  );

  const typeSchemaMismatch = (
    typescript.length > 0 &&
    schema.length > 0
  )
    ? [
        ...typescript.filter(value => !schema.includes(value)),
        ...schema.filter(value => !typescript.includes(value))
      ]
    : [];

  if (missingFromSchema.length > 0) {
    report.compatibility.conflicts.push({
      id: 'ORIGIN_SCHEMA_MISMATCH',
      type: 'OBJECTIVE',
      status: 'CONFLICTING',
      description:
        'Observed graph provenance contains origins absent from JSON Schema.',
      observedButNotInSchema: missingFromSchema
    });
  }

  if (typeSchemaMismatch.length > 0) {
    report.compatibility.conflicts.push({
      id: 'ORIGIN_TYPESCRIPT_SCHEMA_MISMATCH',
      type: 'OBJECTIVE',
      status: 'CONFLICTING',
      description:
        'TypeScript declaration and JSON Schema origin definitions differ.',
      mismatches: unique(typeSchemaMismatch)
    });
  }

  if (
    missingFromSchema.length === 0 &&
    typeSchemaMismatch.length === 0
  ) {
    report.compatibility.status = 'ALIGNED';
  } else {
    report.compatibility.status = 'CONFLICTING';
  }

  check(
    'observed-origins-allowed-by-schema',
    missingFromSchema.length === 0
      ? 'PASSED'
      : 'WARNING',
    {
      observed: observed,
      schema,
      missingFromSchema
    }
  );

  check(
    'typescript-schema-origin-alignment',
    typeSchemaMismatch.length === 0
      ? 'PASSED'
      : 'WARNING',
    {
      typescript,
      schema,
      mismatches: unique(typeSchemaMismatch)
    }
  );
}

function determineReadiness() {
  const failed = report.validation.failed;
  const warnings = report.validation.warnings;
  const conflicts = report.compatibility.conflicts.length;

  if (failed > 0) {
    report.readiness.importReadiness = 'BLOCKED';
  } else if (warnings > 0 || conflicts > 0) {
    report.readiness.importReadiness = 'REVIEW_REQUIRED';
  } else {
    report.readiness.importReadiness = 'STRUCTURAL_CHECKS_PASSED';
  }

  report.limitations.push(
    'This validator does not establish factual correctness of game mechanics.'
  );

  report.limitations.push(
    'This validator does not independently verify formulas or numerical claims.'
  );

  report.limitations.push(
    'This validator does not establish redistribution rights for third-party datasets.'
  );

  report.limitations.push(
    'This validator does not perform full JSON Schema validation of every graph node.'
  );

  report.limitations.push(
    'TypeScript declaration inspection is limited to known candidate paths.'
  );

  report.limitations.push(
    'Unknown SDK fields and values are not normalized or rewritten by this validator.'
  );
}

async function saveReport() {
  await mkdir(dirname(OUTPUT_FILE), {
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

    compatibilityStatus: report.compatibility.status,

    importReadiness: report.readiness.importReadiness
  };

  await writeFile(
    OUTPUT_FILE,
    JSON.stringify(report, null, 2) + '\n',
    'utf8'
  );

  console.log('\n======================================');
  console.log(' SAMANTHA SDK RUNTIME VALIDATOR v4');
  console.log('======================================');

  console.log(`Package: ${report.package.name ?? 'UNKNOWN'}`);
  console.log(`Version: ${report.package.version ?? 'UNKNOWN'}`);

  console.log(
    `Graph nodes: ${report.graph.nodes ?? 'UNKNOWN'}`
  );

  console.log(
    `Graph edges: ${report.graph.edges ?? 'UNKNOWN'}`
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

  console.log(`\nReport: ${OUTPUT_FILE}`);
}

async function main() {
  console.log('Starting Samantha SDK Runtime Validator v4...');

  try {
    const {
      require,
      packageRoot
    } = await resolvePackage();

    const exports = await loadJsonExports(require);

    const graph = exports[MODULES[0]];
    const schema = exports[MODULES[1]];

    if (graph) {
      inspectGraph(graph);
    }

    if (schema) {
      inspectSchema(schema);
    }

    await inspectTypeScriptDeclarations(packageRoot);

    if (graph && schema) {
      compareOrigins();
    } else {
      report.compatibility.status = 'NOT_ASSESSED';

      check(
        'origin-compatibility',
        'WARNING',
        'Graph or schema export unavailable'
      );
    }
  } catch (error) {
    check(
      'validator-execution',
      'FAILED',
      {
        message: error.message,
        stack: error.stack
      }
    );
  }

  determineReadiness();

  await saveReport();

  process.exitCode =
    report.validation.failed > 0 ? 1 : 0;
}

await main();
