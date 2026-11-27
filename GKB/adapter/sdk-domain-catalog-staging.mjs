/**
 * Samantha GKB — read-only staging for selected TheTowerSDK data catalogs.
 * Raw SDK records are wrapped with their source index; fields and values are not normalized.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME = path.join(ROOT, 'runtime');
const OUTPUT = path.join(ROOT, 'staging/sdk-domain-catalogs.json');
const require = createRequire(path.join(RUNTIME, 'package.json'));

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function buildSdkDomainCatalogStaging({ catalogs, sdkVersion, sdkGameVersion, retrievedAt }) {
  if (typeof sdkVersion !== 'string' || !sdkVersion) throw new TypeError('sdkVersion is required');
  if (typeof retrievedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(retrievedAt) ||
      Number.isNaN(new Date(retrievedAt + 'T00:00:00.000Z').getTime()) ||
      new Date(retrievedAt + 'T00:00:00.000Z').toISOString().slice(0, 10) !== retrievedAt) {
    throw new TypeError('retrievedAt must be a valid YYYY-MM-DD date');
  }
  if (!Array.isArray(catalogs) || catalogs.length === 0) throw new TypeError('catalogs must be a non-empty array');

  const seen = new Set();
  const stagedCatalogs = catalogs.map((catalog, catalogIndex) => {
    if (!isObject(catalog) || typeof catalog.domain !== 'string' || !catalog.domain ||
        typeof catalog.exportName !== 'string' || !catalog.exportName ||
        typeof catalog.sourceRef !== 'string' || !catalog.sourceRef ||
        !Array.isArray(catalog.records)) {
      throw new TypeError(`catalogs[${catalogIndex}] requires domain, exportName, sourceRef and records[]`);
    }
    const key = catalog.domain + ':' + catalog.exportName;
    if (seen.has(key)) throw new Error(`Duplicate catalog declaration: ${key}`);
    seen.add(key);
    const observedRecordKeys = [...new Set(catalog.records.flatMap(record => isObject(record) ? Object.keys(record) : []))].sort();
    return {
      domain: catalog.domain,
      exportName: catalog.exportName,
      sourceRef: catalog.sourceRef,
      recordCount: catalog.records.length,
      observedRecordKeys,
      records: catalog.records.map((rawRecord, sourceIndex) => ({
        sourceIndex,
        rawRecord: structuredClone(rawRecord)
      }))
    };
  });

  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date(retrievedAt + 'T00:00:00.000Z').toISOString(),
    source: {
      name: 'TheTowerSDK',
      sdkPackage: 'thetowersdk',
      sdkVersion,
      sdkGameVersion: typeof sdkGameVersion === 'string' ? sdkGameVersion : null,
      retrievedAt,
      classification: 'OBJECTIVE',
      verificationStatus: 'EXTERNAL-UNVERIFIED',
      note: 'Raw SDK catalog staging only. SDK package version and game-version marker are separate. No values are independently verified or promoted.'
    },
    catalogs: stagedCatalogs,
    policy: {
      rawRecordsPreserved: true,
      sourceOrderPreserved: true,
      unknownFieldsPreserved: true,
      recordDeduplication: false,
      identifierGeneration: false,
      normalizationPerformed: false,
      canonicalClaimsCreated: false,
      canonicalImportPerformed: false
    },
    limitations: [
      'This staging snapshot describes the selected exports from the pinned SDK package only.',
      'EXTERNAL-UNVERIFIED is not a judgement that a value is false; it means Samantha has not independently assessed it.',
      'No per-record game-version compatibility is inferred from the package-level game-version marker.',
      'No canonical Samantha catalog or claim is created by this operation.'
    ]
  };
}

async function main() {
  const pkg = JSON.parse(await readFile(path.join(RUNTIME, 'node_modules/thetowersdk/package.json'), 'utf8'));
  if (pkg.version !== '0.14.1') throw new Error(`Expected thetowersdk@0.14.1, got ${pkg.version}`);
  const data = await import(pathToFileURL(require.resolve('thetowersdk/data')).href);
  const knowledge = await import(pathToFileURL(require.resolve('thetowersdk/knowledge')).href);
  const workshop = data.getWorkshopStatDefinitions();
  const catalogSpecs = [
    { domain: 'Research', exportName: 'LAB_CATALOG', sourceRef: 'thetowersdk/data#LAB_CATALOG', records: data.LAB_CATALOG },
    { domain: 'Workshop', exportName: 'getWorkshopStatDefinitions()', sourceRef: 'thetowersdk/data#getWorkshopStatDefinitions', records: workshop },
    { domain: 'Cards and Masteries', exportName: 'CARD_TEMPLATES', sourceRef: 'thetowersdk/data#CARD_TEMPLATES', records: data.CARD_TEMPLATES },
    { domain: 'Perks', exportName: 'ALL_PERKS', sourceRef: 'thetowersdk/data#ALL_PERKS', records: data.ALL_PERKS }
  ];
  const report = buildSdkDomainCatalogStaging({
    catalogs: catalogSpecs,
    sdkVersion: pkg.version,
    sdkGameVersion: knowledge.CURRENT_GAME_VERSION ?? null,
    retrievedAt: new Date().toISOString().slice(0, 10)
  });
  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({
    test: 'Samantha GKB SDK Domain Catalog Staging',
    status: 'PASSED',
    sdkVersion: report.source.sdkVersion,
    sdkGameVersion: report.source.sdkGameVersion,
    retrievedAt: report.source.retrievedAt,
    catalogs: report.catalogs.map(({ domain, exportName, recordCount, observedRecordKeys }) => ({
      domain, exportName, recordCount, observedRecordKeys
    })),
    totalRecords: report.catalogs.reduce((sum, item) => sum + item.recordCount, 0),
    policy: report.policy
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(JSON.stringify({ test: 'Samantha GKB SDK Domain Catalog Staging', status: 'FAILED', error: error.message }, null, 2));
    process.exitCode = 1;
  });
}
