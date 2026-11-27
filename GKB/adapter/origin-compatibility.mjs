/**
 * Samantha GKB — SDK Origin Compatibility Adapter
 *
 * Version: 0.4.0
 * Target SDK: thetowersdk@0.14.1
 *
 * Responsibilities:
 * - Discover origin values in SDK knowledge graphs.
 * - Compare graph origins with JSON Schema origins.
 * - Compare TypeScript origins when explicitly supplied.
 * - Preserve original origin values and locations.
 * - Classify compatibility conflicts.
 * - Record SDK provenance and inspection metadata.
 *
 * Safety:
 * - No automatic origin normalization.
 * - No semantic equivalence assumptions.
 * - No source graph or schema modification.
 * - No automatic conflict resolution.
 * - No bulk GKB import.
 */

import { pathToFileURL } from 'node:url';

const ADAPTER_NAME =
  'Samantha GKB Origin Compatibility Adapter';

const ADAPTER_VERSION = '0.4.0';

const EXPECTED_SDK_PACKAGE = 'thetowersdk';

const EXPECTED_SDK_VERSION = '0.14.1';

/**
 * Object check.
 */
function isObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

/**
 * Return unique sorted string values.
 */
function uniqueSorted(values) {
  return [
    ...new Set(
      values.filter(value => typeof value === 'string')
    ),
  ].sort();
}

/**
 * Convert a JavaScript path into a stable JSON-style path.
 */
function appendPath(path, key) {
  if (typeof key === 'number') {
    return `${path}[${key}]`;
  }

  return `${path}.${String(key)}`;
}

/**
 * Discover every value under a property named origin.
 *
 * Paths are retained for traceability.
 * Original source data is never modified.
 */
export function collectOriginOccurrences(root) {
  const occurrences = [];

  const seen = new WeakSet();

  function walk(value, path) {
    if (value === null || typeof value !== 'object') {
      return;
    }

    if (seen.has(value)) {
      return;
    }

    seen.add(value);

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        walk(item, appendPath(path, index));
      });

      return;
    }

    for (const [key, child] of Object.entries(value)) {
      const childPath = appendPath(path, key);

      if (key === 'origin') {
        occurrences.push({
          origin: child,
          path: childPath,
          valueType:
            child === null
              ? 'null'
              : Array.isArray(child)
                ? 'array'
                : typeof child,
          validString:
            typeof child === 'string' &&
            child.length > 0,
        });
      }

      walk(child, childPath);
    }
  }

  walk(root, '$');

  return occurrences;
}

/**
 * Discover origin enums in JSON Schema.
 *
 * This is a structural discovery function.
 * It does not resolve $ref or claim complete schema coverage.
 */
export function collectSchemaOriginDefinitions(schema) {
  const definitions = [];

  const seen = new WeakSet();

  function walk(value, path) {
    if (!isObject(value) && !Array.isArray(value)) {
      return;
    }

    if (seen.has(value)) {
      return;
    }

    seen.add(value);

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        walk(item, appendPath(path, index));
      });

      return;
    }

    if (
      path.split('.').at(-1) === 'origin' &&
      Array.isArray(value.enum)
    ) {
      definitions.push({
        path,
        values: uniqueSorted(
          value.enum.filter(
            item => typeof item === 'string'
          )
        ),
        nonStringEnumValues: value.enum.filter(
          item => typeof item !== 'string'
        ),
      });
    }

    for (const [key, child] of Object.entries(value)) {
      walk(child, appendPath(path, key));
    }
  }

  walk(schema, '$');

  return definitions;
}

/**
 * Collect the union of discovered schema origin enums.
 */
export function collectSchemaOrigins(schema) {
  return uniqueSorted(
    collectSchemaOriginDefinitions(schema)
      .flatMap(definition => definition.values)
  );
}

/**
 * Preserve source origin without assigning a mapping.
 */
function preserveReportValue(value) {
  return value === undefined
    ? { $type: 'undefined' }
    : value;
}

/**
 * Preserve source origin without assigning a mapping.
 * Undefined is represented explicitly for JSON-safe reporting.
 */
export function preserveOrigin(origin) {
  if (
    typeof origin !== 'string' ||
    origin.length === 0
  ) {
    return {
      sourceOrigin: origin,
      sourceOriginRaw: preserveReportValue(origin),
      mappedOrigin: null,
      mappingStatus: 'INVALID_OR_MISSING',
    };
  }

  return {
    sourceOrigin: origin,
    sourceOriginRaw: origin,
    mappedOrigin: null,
    mappingStatus: 'UNMAPPED_REQUIRES_REVIEW',
  };
}

/**
 * Group graph origin occurrences by value.
 */
function groupOriginOccurrences(occurrences) {
  const groups = new Map();
  const invalidGroups = [];

  for (const occurrence of occurrences) {
    if (!occurrence.validString) {
      invalidGroups.push({
        origin: preserveReportValue(occurrence.origin),
        valueType: occurrence.valueType,
        validString: false,
        occurrenceCount: 1,
        locations: [{
          path: occurrence.path,
          valueType: occurrence.valueType,
          validString: false,
        }],
      });
      continue;
    }

    const key = occurrence.origin;

    if (!groups.has(key)) {
      groups.set(key, {
        origin: key,
        occurrenceCount: 0,
        locations: [],
      });
    }

    const group = groups.get(key);
    group.occurrenceCount += 1;
    group.locations.push({
      path: occurrence.path,
      valueType: occurrence.valueType,
      validString: true,
    });
  }

  return [...groups.values(), ...invalidGroups];
}

/**
 * Analyze SDK origin compatibility.
 *
 * typescriptOrigins must be supplied explicitly from
 * an inspected TypeScript declaration.
 *
 * This adapter does not parse TypeScript automatically.
 */
export function analyzeOriginCompatibility({
  sdkPackage = EXPECTED_SDK_PACKAGE,
  sdkVersion,
  graph,
  schema,
  typescriptOrigins,
  typescriptInspectionMethod = 'EXPLICITLY_SUPPLIED_VALUES',
  typescriptDeclarationLocations = null,
  sourceReference = null,
  inspectionDate = new Date().toISOString(),
}) {
  if (typeof sdkPackage !== 'string' || sdkPackage.trim() === '') {
    throw new TypeError('sdkPackage must be a non-empty string');
  }

  if (typeof sdkVersion !== 'string' || sdkVersion.trim() === '') {
    throw new TypeError('sdkVersion must be a non-empty string');
  }

  if (
    sourceReference !== null &&
    typeof sourceReference !== 'string'
  ) {
    throw new TypeError('sourceReference must be a string or null');
  }

  if (!isObject(graph)) {
    throw new TypeError('graph must be an object');
  }

  if (!isObject(schema)) {
    throw new TypeError('schema must be an object');
  }

  if (
    typescriptOrigins !== null &&
    typescriptOrigins !== undefined &&
    (!Array.isArray(typescriptOrigins) ||
      !typescriptOrigins.every(value => typeof value === 'string'))
  ) {
    throw new TypeError(
      'typescriptOrigins must be null or an array of strings'
    );
  }

  if (typeof typescriptInspectionMethod !== 'string' || typescriptInspectionMethod.trim() === '') {
    throw new TypeError('typescriptInspectionMethod must be a non-empty string');
  }

  if (typescriptDeclarationLocations !== null && !Array.isArray(typescriptDeclarationLocations)) {
    throw new TypeError('typescriptDeclarationLocations must be an array or null');
  }

  if (typeof inspectionDate !== 'string') {
    throw new TypeError(
      'inspectionDate must be a string'
    );
  }

  const occurrences = collectOriginOccurrences(graph);

  const observedOrigins = uniqueSorted(
    occurrences
      .filter(item => item.validString)
      .map(item => item.origin)
  );

  const invalidOccurrences = occurrences.filter(
    item => !item.validString
  );

  const schemaDefinitions =
    collectSchemaOriginDefinitions(schema);

  const schemaOrigins = uniqueSorted(
    schemaDefinitions.flatMap(
      definition => definition.values
    )
  );

  const typescriptInspected = Array.isArray(typescriptOrigins);

  const declaredTypes = typescriptInspected
    ? uniqueSorted(typescriptOrigins)
    : [];

  const observedNotInSchema = observedOrigins.filter(
    value => !schemaOrigins.includes(value)
  );

  const typescriptNotInSchema = typescriptInspected
    ? declaredTypes.filter(value => !schemaOrigins.includes(value))
    : [];

  const schemaNotInTypescript = typescriptInspected
    ? schemaOrigins.filter(value => !declaredTypes.includes(value))
    : [];

  const observedNotInTypescript = typescriptInspected
    ? observedOrigins.filter(value => !declaredTypes.includes(value))
    : [];

  // A source-by-source vocabulary matrix. Membership is descriptive only:
  // it does not assert that similarly named values are semantically equal.
  const vocabularyValues = uniqueSorted([
    ...observedOrigins,
    ...schemaOrigins,
    ...declaredTypes,
  ]);

  const originVocabulary = vocabularyValues.map(value => ({
    value,
    presentIn: {
      graph: observedOrigins.includes(value),
      jsonSchema: schemaOrigins.includes(value),
      typescript: typescriptInspected
        ? declaredTypes.includes(value)
        : null,
    },
    mappingStatus: 'UNMAPPED_REQUIRES_REVIEW',
    semanticEquivalence: 'NOT_ASSESSED',
  }));

  const vocabularySources = {
    graph: {
      sourceReference,
      inspectionStatus: 'INSPECTED',
      values: observedOrigins,
    },
    jsonSchema: {
      sourceReference,
      inspectionStatus: 'STRUCTURAL_DISCOVERY_ONLY',
      values: schemaOrigins,
      definitions: schemaDefinitions,
      limitations: [
        'External $ref references are not resolved.',
        'Schema discovery does not establish complete coverage.',
      ],
    },
    typescript: {
      sourceReference,
      inspectionStatus: typescriptInspected
        ? 'INSPECTED_DECLARATION'
        : 'NOT_INSPECTED',
      inspectionMethod: typescriptInspectionMethod,
      values: declaredTypes,
      declarationLocations: typescriptDeclarationLocations,
    },
  };

  const conflicts = [];

  const groupedOccurrences =
    groupOriginOccurrences(occurrences);

  function graphLocationsFor(origin) {
    return occurrences
      .filter(item => item.validString && item.origin === origin)
      .map(item => ({
        path: item.path,
        valueType: item.valueType,
      }));
  }

  function schemaDefinitionsFor(origin) {
    return schemaDefinitions
      .filter(definition => definition.values.includes(origin))
      .map(definition => ({
        path: definition.path,
        values: definition.values,
      }));
  }

  for (const origin of observedNotInSchema) {
    const group = groupedOccurrences.find(
      item => item.origin === origin
    );

    conflicts.push({
      id: 'ORIGIN_GRAPH_SCHEMA_MISMATCH',
      type: 'OBJECTIVE',
      status: 'CONFLICTING',
      graphOrigin: origin,
      schemaAllows: false,
      resolution: 'UNRESOLVED',
      occurrenceCount: group?.occurrenceCount ?? 0,
      locations: group?.locations ?? [],
      evidence: {
        graph: {
          sourceReference,
          locations: graphLocationsFor(origin),
        },
        schema: {
          sourceReference,
          definitions: schemaDefinitionsFor(origin),
          allowsOrigin: false,
        },
      },
    });
  }

  if (
    typescriptInspected &&
    (typescriptNotInSchema.length > 0 ||
      schemaNotInTypescript.length > 0)
  ) {
    conflicts.push({
      id: 'ORIGIN_TYPESCRIPT_SCHEMA_MISMATCH',
      type: 'OBJECTIVE',
      status: 'CONFLICTING',
      typescriptNotInSchema,
      schemaNotInTypescript,
      evidence: {
        typescript: {
          sourceReference,
          inspectionMethod: typescriptInspectionMethod,
          values: declaredTypes,
          declarationLocations: typescriptDeclarationLocations,
        },
        schema: {
          sourceReference,
          definitions: schemaDefinitions,
        },
      },
      resolution: 'UNRESOLVED',
    });
  }

  if (typescriptInspected && observedNotInTypescript.length > 0) {
    conflicts.push({
      id: 'ORIGIN_GRAPH_TYPESCRIPT_MISMATCH',
      type: 'OBJECTIVE',
      status: 'CONFLICTING',
      graphOriginsNotInTypescript:
        observedNotInTypescript,
      evidence: {
        graph: {
          sourceReference,
          origins: observedNotInTypescript.map(origin => ({
            value: origin,
            locations: graphLocationsFor(origin),
          })),
        },
        typescript: {
          sourceReference,
          inspectionMethod: typescriptInspectionMethod,
          declaredOrigins: declaredTypes,
          declarationLocations: typescriptDeclarationLocations,
        },
      },
      resolution: 'UNRESOLVED',
    });
  }

  if (invalidOccurrences.length > 0) {
    conflicts.push({
      id: 'ORIGIN_INVALID_OR_MISSING',
      type: 'OBJECTIVE',
      status: 'CONFLICTING',
      occurrenceCount: invalidOccurrences.length,
      occurrences: invalidOccurrences.map(item => ({
        originalValue: preserveReportValue(item.origin),
        valueType: item.valueType,
        path: item.path,
        sourceReference,
      })),
      resolution: 'UNRESOLVED',
    });
  }

  const versionMatches =
    sdkPackage === EXPECTED_SDK_PACKAGE &&
    sdkVersion === EXPECTED_SDK_VERSION;

  const hasConflicts = conflicts.length > 0;

  const compatibilityStatus = hasConflicts
    ? 'CONFLICTING'
    : versionMatches
      ? 'CONSISTENT'
      : 'REVIEW_REQUIRED';

  return {
    adapter: {
      name: ADAPTER_NAME,
      version: ADAPTER_VERSION,
    },

    inspection: {
      date: inspectionDate,
      sourceReference,
      inspectionType: 'STRUCTURAL_COMPATIBILITY',
    },

    source: {
      name: sdkPackage,
      expectedPackage: EXPECTED_SDK_PACKAGE,
      expectedVersion: EXPECTED_SDK_VERSION,
      actualVersion: sdkVersion ?? null,
      versionStatus: versionMatches
        ? 'MATCHED'
        : 'REVIEW_REQUIRED',
    },

    gameKnowledge: {
      gameVersion: null,
      status: 'NOT_ASSESSED',
    },

    compatibility: {
      status: compatibilityStatus,

      observedOrigins,
      schemaOrigins,
      typescriptOrigins: declaredTypes,
      typescriptInspectionStatus: typescriptInspected
        ? (typescriptInspectionMethod === 'AUTOMATIC_DTS_PARSE' ? 'INSPECTED_DECLARATION' : 'INSPECTED_EXPLICIT_VALUES')
        : 'NOT_INSPECTED',

      observedNotInSchema,
      typescriptNotInSchema,
      schemaNotInTypescript,
      observedNotInTypescript,

      schemaDefinitions,

      vocabularySources,
      originVocabulary,

      conflicts,
    },

    preservation: {
      occurrenceCount: occurrences.length,

      uniqueOriginCount: observedOrigins.length,

      invalidOccurrenceCount:
        invalidOccurrences.length,

      occurrences,

      groupedOccurrences,

      originalValuesPreserved: true,

      automaticNormalization: false,
    },

    mapping: {
      status: 'NOT_DEFINED',

      reason:
        'Samantha target-origin schema has not yet been formally defined.',

      automaticMappingAllowed: false,

      semanticEquivalenceEstablished: false,

      policy: 'PRESERVE_SOURCE_VALUES_AND_REPORT_MEMBERSHIP_ONLY',
      unresolvedValues: vocabularyValues,
    },

    importReadiness: {
      status: hasConflicts || !versionMatches
        ? 'REVIEW_REQUIRED'
        : 'NOT_AUTHORIZED',

      bulkImportAllowed: false,

      reason:
        'Structural compatibility inspection does not authorize GKB ingestion.',
    },

    limitations: [
      'JSON Schema $ref references are not resolved.',
      'Schema discovery does not establish complete schema coverage.',
      'TypeScript declaration parsing is limited to explicitly supported declaration syntax.',
      'No semantic equivalence between origin values is assumed.',
      'No factual game-mechanics verification is performed.',
      'No SDK redistribution rights are assessed.',
      'No GKB import is performed.',
    ],
  };
}

/**
 * Self-test.
 *
 * Run:
 * node GKB/adapter/origin-compatibility.mjs
 */
export function runSelfTest() {
  const graph = {
    compartments: [
      {
        nodes: [
          {
            id: 'test.node',
            sources: [
              { origin: 'game' },
              { origin: 'wiki' },
              { origin: 'game' },
            ],
          },
        ],
      },
    ],
  };

  const invalidGraph = {
    sources: [
      { origin: null },
      { origin: 123 },
      { origin: false },
      { origin: {} },
      { origin: undefined },
      { origin: '' },
    ],
  };

  const schema = {
    properties: {
      provenance: {
        properties: {
          origin: {
            type: 'string',
            enum: ['wiki', 'in-game'],
          },
        },
      },
    },
  };

  const report = analyzeOriginCompatibility({
    sdkPackage: EXPECTED_SDK_PACKAGE,
    sdkVersion: EXPECTED_SDK_VERSION,
    graph,
    schema,
    typescriptOrigins: ['wiki'],
    sourceReference: 'synthetic-self-test',
  });

  // Invalid provenance metadata must not enter a compatibility report.
  for (const invalidMetadata of [
    { sdkPackage: 14 },
    { sdkVersion: 14 },
    { sourceReference: 14 },
  ]) {
    let rejected = false;

    try {
      analyzeOriginCompatibility({
        sdkPackage: EXPECTED_SDK_PACKAGE,
        sdkVersion: EXPECTED_SDK_VERSION,
        graph,
        schema,
        typescriptOrigins: ['game', 'wiki'],
        ...invalidMetadata,
      });
    } catch {
      rejected = true;
    }

    if (!rejected) {
      throw new Error(
        'Self-test failed: invalid provenance metadata was accepted'
      );
    }
  }

  const uninspectedTypescriptReport = analyzeOriginCompatibility({
    sdkPackage: EXPECTED_SDK_PACKAGE,
    sdkVersion: EXPECTED_SDK_VERSION,
    graph,
    schema,
    typescriptOrigins: null,
    sourceReference: 'synthetic-typescript-not-inspected',
  });

  if (
    uninspectedTypescriptReport.compatibility.typescriptInspectionStatus !==
      'NOT_INSPECTED' ||
    uninspectedTypescriptReport.compatibility.conflicts.some(
      conflict => conflict.id.includes('TYPESCRIPT')
    )
  ) {
    throw new Error(
      'Self-test failed: uninspected TypeScript origins were treated as a conflict'
    );
  }

  const invalidReport = analyzeOriginCompatibility({
    sdkPackage: EXPECTED_SDK_PACKAGE,
    sdkVersion: EXPECTED_SDK_VERSION,
    graph: invalidGraph,
    schema,
    typescriptOrigins: [],
    sourceReference: 'synthetic-invalid-origin-self-test',
  });

  const invalidConflict =
    invalidReport.compatibility.conflicts.find(
      conflict => conflict.id === 'ORIGIN_INVALID_OR_MISSING'
    );

  const expectedInvalidTypes = [
    'null', 'number', 'boolean', 'object', 'undefined', 'string',
  ];

  if (
    !invalidConflict ||
    invalidConflict.occurrences.length !== expectedInvalidTypes.length ||
    invalidConflict.occurrences.some(
      (item, index) => item.valueType !== expectedInvalidTypes[index]
    )
  ) {
    throw new Error(
      'Self-test failed: invalid origin values were not preserved separately'
    );
  }

  if (
    invalidReport.preservation.groupedOccurrences.length !==
    expectedInvalidTypes.length
  ) {
    throw new Error(
      'Self-test failed: invalid origin occurrences were grouped together'
    );
  }

  const undefinedPreservation = preserveOrigin(undefined);

  if (
    undefinedPreservation.sourceOriginRaw?.$type !== 'undefined' ||
    undefinedPreservation.mappingStatus !== 'INVALID_OR_MISSING'
  ) {
    throw new Error(
      'Self-test failed: undefined origin was not represented explicitly'
    );
  }

  const graphSchemaConflict =
    report.compatibility.conflicts.find(
      conflict =>
        conflict.id === 'ORIGIN_GRAPH_SCHEMA_MISMATCH'
    );

  if (!graphSchemaConflict) {
    throw new Error(
      'Self-test failed: expected graph/schema conflict'
    );
  }

  if (
    graphSchemaConflict.evidence?.graph?.locations?.length !== 2 ||
    graphSchemaConflict.evidence?.schema?.definitions?.length !== 0 ||
    graphSchemaConflict.evidence?.graph?.sourceReference !==
      'synthetic-self-test'
  ) {
    throw new Error(
      'Self-test failed: graph/schema conflict evidence is incomplete'
    );
  }

  const graphTypescriptConflict =
    report.compatibility.conflicts.find(
      conflict =>
        conflict.id === 'ORIGIN_GRAPH_TYPESCRIPT_MISMATCH'
    );

  if (
    !graphTypescriptConflict ||
    graphTypescriptConflict.evidence?.graph?.origins?.[0]?.locations?.length !== 2 ||
    graphTypescriptConflict.evidence?.typescript?.inspectionMethod !==
      'EXPLICITLY_SUPPLIED_VALUES'
  ) {
    throw new Error(
      'Self-test failed: graph/TypeScript conflict evidence is incomplete'
    );
  }

  const typescriptSchemaConflict =
    report.compatibility.conflicts.find(
      conflict =>
        conflict.id === 'ORIGIN_TYPESCRIPT_SCHEMA_MISMATCH'
    );

  if (
    !typescriptSchemaConflict ||
    typescriptSchemaConflict.evidence?.typescript?.sourceReference !==
      'synthetic-self-test' ||
    !Array.isArray(typescriptSchemaConflict.evidence?.schema?.definitions)
  ) {
    throw new Error(
      'Self-test failed: TypeScript/schema conflict evidence is incomplete'
    );
  }

  if (
    graphSchemaConflict.graphOrigin !== 'game' ||
    graphSchemaConflict.occurrenceCount !== 2
  ) {
    throw new Error(
      'Self-test failed: incorrect origin conflict grouping'
    );
  }

  if (
    report.preservation.originalValuesPreserved !== true
  ) {
    throw new Error(
      'Self-test failed: original values not preserved'
    );
  }

  const vocabularyByValue = new Map(
    report.compatibility.originVocabulary.map(item => [
      item.value,
      item,
    ])
  );

  const gameVocabulary = vocabularyByValue.get('game');
  const inGameVocabulary = vocabularyByValue.get('in-game');
  const wikiVocabulary = vocabularyByValue.get('wiki');

  if (
    !gameVocabulary ||
    gameVocabulary.presentIn.graph !== true ||
    gameVocabulary.presentIn.jsonSchema !== false ||
    gameVocabulary.presentIn.typescript !== false ||
    gameVocabulary.mappingStatus !== 'UNMAPPED_REQUIRES_REVIEW' ||
    !inGameVocabulary ||
    inGameVocabulary.presentIn.graph !== false ||
    inGameVocabulary.presentIn.jsonSchema !== true ||
    inGameVocabulary.presentIn.typescript !== false ||
    !wikiVocabulary ||
    wikiVocabulary.presentIn.graph !== true ||
    wikiVocabulary.presentIn.jsonSchema !== true ||
    wikiVocabulary.presentIn.typescript !== true ||
    report.compatibility.vocabularySources.typescript.inspectionStatus !==
      'INSPECTED_DECLARATION'
  ) {
    throw new Error(
      'Self-test failed: source-by-source origin vocabulary was not preserved'
    );
  }

  if (
    report.mapping.automaticMappingAllowed !== false
  ) {
    throw new Error(
      'Self-test failed: automatic mapping must remain disabled'
    );
  }

  if (
    report.importReadiness.bulkImportAllowed !== false
  ) {
    throw new Error(
      'Self-test failed: bulk import must remain disabled'
    );
  }

  if (
    report.compatibility.status !== 'CONFLICTING'
  ) {
    throw new Error(
      'Self-test failed: expected CONFLICTING status'
    );
  }

  const output = {
    selfTest: 'PASSED',
    adapterVersion: ADAPTER_VERSION,
    compatibility: report.compatibility.status,
    observedOrigins: report.compatibility.observedOrigins,
    conflicts: report.compatibility.conflicts.length,
    gameConflictOccurrences:
      graphSchemaConflict.occurrenceCount,
    originalValuesPreserved:
      report.preservation.originalValuesPreserved,
    automaticNormalization:
      report.preservation.automaticNormalization,
    bulkImportAllowed:
      report.importReadiness.bulkImportAllowed,
  };

  console.log(JSON.stringify(output, null, 2));

  return output;
}

/**
 * Robust direct execution detection.
 */
const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(
    process.argv[1]
  ).href;

if (isDirectExecution) {
  try {
    runSelfTest();
  } catch (error) {
    console.error(
      JSON.stringify({
        selfTest: 'FAILED',
        adapterVersion: ADAPTER_VERSION,
        error: error.message,
      }, null, 2)
    );

    process.exitCode = 1;
  }
}
