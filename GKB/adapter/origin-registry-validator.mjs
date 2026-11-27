/**
 * Samantha GKB — Origin Registry Validator
 * Version: 1.0.0
 * Validates the source-preserving registry; never maps origin values.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const require = createRequire(path.join(ROOT, 'runtime/package.json'));
const Ajv2020 = require('ajv/dist/2020.js').default;
const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema/origin-registry.schema.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'sources/origin-registry.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(schema);
const valid = validate(registry);
const errors = (validate.errors ?? []).map(error => ({
  instancePath: error.instancePath,
  keyword: error.keyword,
  message: error.message
}));

const ids = registry.sources.map(source => source.id);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
const sourceKinds = new Set(registry.sources.map(source => source.kind));
const requiredKinds = ['KNOWLEDGE_GRAPH', 'JSON_SCHEMA', 'TYPESCRIPT_DECLARATION'];
const missingKinds = requiredKinds.filter(kind => !sourceKinds.has(kind));
const allValues = [...new Set(registry.sources.flatMap(source => source.values))].sort();
const membership = allValues.map(value => ({
  value,
  presentIn: Object.fromEntries(registry.sources.map(source => [source.id, source.values.includes(value)])),
  mappingStatus: 'UNMAPPED_REQUIRES_REVIEW',
  semanticEquivalence: 'NOT_ASSESSED'
}));

const integrityErrors = [];
if (duplicateIds.length) integrityErrors.push({ code: 'DUPLICATE_SOURCE_ID', values: duplicateIds });
if (missingKinds.length) integrityErrors.push({ code: 'MISSING_SOURCE_KIND', values: missingKinds });
if (registry.comparisonPolicy.automaticMapping !== false) integrityErrors.push({ code: 'AUTOMATIC_MAPPING_MUST_REMAIN_DISABLED' });
if (registry.comparisonPolicy.semanticEquivalence !== 'NOT_ASSESSED') integrityErrors.push({ code: 'SEMANTIC_EQUIVALENCE_MUST_REMAIN_UNASSESSED' });

const passed = valid && integrityErrors.length === 0;
const report = {
  test: 'Samantha GKB Origin Registry Validation',
  validatorVersion: '1.0.0',
  status: passed ? 'PASSED' : 'FAILED',
  schemaValidation: valid ? 'PASSED' : 'FAILED',
  registryVersion: registry.registryVersion,
  sdk: registry.sdk,
  sourceCount: registry.sources.length,
  uniqueOriginValueCount: allValues.length,
  sourceValues: Object.fromEntries(registry.sources.map(source => [source.id, source.values])),
  membership,
  automaticMapping: registry.comparisonPolicy.automaticMapping,
  semanticEquivalence: registry.comparisonPolicy.semanticEquivalence,
  errors,
  integrityErrors
};
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exitCode = 1;

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
