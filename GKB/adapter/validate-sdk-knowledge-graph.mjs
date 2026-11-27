/**
 * Samantha GKB — TheTowerSDK Knowledge Graph Validator
 *
 * Version: 1.5.0
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
import { parseStringUnionDeclaration } from './typescript-origin-parser.mjs';

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
  const typescriptDeclarationReference =
    'thetowersdk/dist/knowledge/substrate/types.d.ts';
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
        path: typescriptDeclarationReference
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

  // Samantha-owned registry is provenance metadata, not an authority for
  // rewriting SDK values. Compare its snapshot with live inspected exports.
  const originRegistryPath = resolve(
    process.cwd(),
    '../sources/origin-registry.json'
  );
  const originRegistry = JSON.parse(
    await readFile(originRegistryPath, 'utf8')
  );
  assert(
    originRegistry.sdk?.package === 'thetowersdk' &&
    originRegistry.sdk?.version === sdkManifest.version,
    'Origin Registry SDK identity/version does not match inspected SDK'
  );

  const registrySource = id => originRegistry.sources.find(
    source => source.id === id
  ) ?? null;

  const registryGraph = registrySource('sdk-knowledge-graph');
  const registrySchema = registrySource('sdk-json-schema');
  const registryTypescript = registrySource('sdk-typescript-claim-origin');

  function compareRegistryValues(source, liveValues) {
    if (!source) {
      return {
        status: 'REGISTRY_SOURCE_MISSING',
        registryValues: [],
        liveValues,
        addedSinceRegistry: liveValues,
        missingFromLive: [],
      };
    }

    const registryValues = source.values ?? [];
    return {
      status:
        JSON.stringify([...registryValues].sort()) ===
        JSON.stringify([...liveValues].sort())
          ? 'CURRENT'
          : 'CHANGED_SINCE_REGISTRY',
      registryValues,
      liveValues,
      addedSinceRegistry: liveValues.filter(value => !registryValues.includes(value)),
      missingFromLive: registryValues.filter(value => !liveValues.includes(value)),
    };
  }

  const liveOriginSources = {
    graph: {
      id: 'sdk-knowledge-graph',
      reference: GRAPH_EXPORT,
      values: originCompatibility.compatibility.observedOrigins,
      comparison: compareRegistryValues(
        registryGraph,
        originCompatibility.compatibility.observedOrigins
      ),
    },
    jsonSchema: {
      id: 'sdk-json-schema',
      reference: SCHEMA_EXPORT,
      values: originCompatibility.compatibility.schemaOrigins,
      comparison: compareRegistryValues(
        registrySchema,
        originCompatibility.compatibility.schemaOrigins
      ),
    },
    typescript: {
      id: 'sdk-typescript-claim-origin',
      reference: typescriptDeclarationReference,
      values: typescriptInspection.status === 'INSPECTED'
        ? typescriptInspection.values
        : [],
      inspectionStatus: typescriptInspection.status,
      comparison: typescriptInspection.status === 'INSPECTED'
        ? compareRegistryValues(
            registryTypescript,
            typescriptInspection.values
          )
        : { status: 'LIVE_SOURCE_NOT_INSPECTED' },
    },
  };

  const originProvenance = originCompatibility.preservation.groupedOccurrences.map(
    group => ({
      sourceValue: group.origin,
      valueType: group.valueType ?? 'string',
      mappedValue: null,
      mappingStatus: group.validString === false
        ? 'INVALID_OR_MISSING'
        : 'UNMAPPED_REQUIRES_REVIEW',
      occurrenceCount: group.occurrenceCount,
      locations: group.locations,
      provenance: {
        sourceId: 'sdk-knowledge-graph',
        sourceReference: GRAPH_EXPORT,
        sourceName: 'TheTowerSDK Knowledge Graph',
        sdkPackage: sdkManifest.name,
        sdkVersion: sdkManifest.version,
        registryVersion: originRegistry.registryVersion,
        registryVerification: originRegistry.verification,
        gameVersion: originRegistry.gameVersion,
        inspectedAt: originCompatibility.inspection.date,
      },
    })
  );

  const originRegistryEvidence = {
    registryVersion: originRegistry.registryVersion,
    registryReference: 'GKB/sources/origin-registry.json',
    registryVerification: originRegistry.verification,
    sdk: originRegistry.sdk,
    comparisonPolicy: originRegistry.comparisonPolicy,
    liveSources: liveOriginSources,
    snapshotStatus: Object.values(liveOriginSources).every(
      source => source.comparison.status === 'CURRENT'
    ) ? 'CURRENT' : 'REVIEW_REQUIRED',
    automaticMapping: false,
    semanticEquivalence: 'NOT_ASSESSED',
    originProvenance,
  };

  originCompatibility.compatibility.originRegistry = originRegistryEvidence;

  const graphSchemaConflict = originCompatibility.compatibility.conflicts.find(
    conflict => conflict.id === 'ORIGIN_GRAPH_SCHEMA_MISMATCH'
  );
  const originEvidenceIntegrity = {
    observedNotInSchema: [...originCompatibility.compatibility.observedNotInSchema],
    typescriptNotInSchema: [...originCompatibility.compatibility.typescriptNotInSchema],
    schemaNotInTypescript: [...originCompatibility.compatibility.schemaNotInTypescript],
    graphSchemaConflictOccurrenceCount: graphSchemaConflict?.occurrenceCount ?? 0,
    graphSchemaConflictLocationCount: graphSchemaConflict?.locations?.length ?? 0,
    expectedGraphSchemaConflictOccurrenceCount: 70,
    expectedGraphSchemaConflictLocationCount: 70,
    status:
      graphSchemaConflict?.occurrenceCount === 70 &&
      graphSchemaConflict?.locations?.length === 70 &&
      originCompatibility.compatibility.observedNotInSchema.includes('game') &&
      originCompatibility.compatibility.typescriptNotInSchema.includes('game') &&
      originCompatibility.compatibility.schemaNotInTypescript.includes('game-files') &&
      originCompatibility.compatibility.schemaNotInTypescript.includes('in-game')
        ? 'PASSED'
        : 'REVIEW_REQUIRED'
  };

  const onlyExpectedOriginConflicts =
    errors.length > 0 &&
    errors.every(error =>
      error.keyword === 'enum' &&
      /\/origin\/enum$/.test(error.schemaPath ?? '') &&
      /\/origin$/.test(error.instancePath ?? '')
    );

  const evidenceIntegrityPassed =
    originEvidenceIntegrity.status === 'PASSED';

  const compatibilityRunPassed =
    valid ||
    (onlyExpectedOriginConflicts && evidenceIntegrityPassed);

  const report = {
    test: 'Samantha GKB SDK Knowledge Graph Validation',
    testVersion: '1.5.0',
    status: valid
      ? 'PASSED'
      : compatibilityRunPassed
        ? 'COMPLETED_WITH_CONFLICTS'
        : 'FAILED',
    executionStatus: compatibilityRunPassed ? 'PASSED' : 'FAILED',
    schemaValidationStatus: valid ? 'PASSED' : 'FAILED',
    expectedOriginConflictsOnly: onlyExpectedOriginConflicts,
    originEvidenceIntegrityStatus: originEvidenceIntegrity.status,

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
      status: valid ? 'PASSED' : 'FAILED',
      valid,
      errorCount: errors.length,
      displayedErrorCount: Math.min(errors.length, 20),
      errors: errors.slice(0, 20),
      truncated: errors.length > 20
    },

    typescriptDeclaration: {
      typeName: 'ClaimOrigin',
      file: typescriptDeclarationReference,
      status: typescriptInspection.status,
      reason: typescriptInspection.reason ?? null,
      values: typescriptInspection.values,
      declarationLocations: typescriptInspection.declarationLocations
    },

    originEvidenceIntegrity,

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
      'TypeScript parsing supports named string-literal union declarations only.',
      'Origin Registry provenance is attached without changing raw SDK origin values.'
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

  if (!compatibilityRunPassed) process.exitCode = 1;
}

main().catch(error => {
  console.error(JSON.stringify({
    test: 'Samantha GKB SDK Knowledge Graph Validation',
    status: 'ERROR',
    error: error.message
  }, null, 2));

  process.exitCode = 1;
});
    
