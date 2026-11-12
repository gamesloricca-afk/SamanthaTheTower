#!/usr/bin/env node

import {
  readFile,
  writeFile,
  mkdir,
} from 'node:fs/promises';

import {
  resolve,
  join,
  dirname,
} from 'node:path';

import { createRequire } from 'node:module';

const EXPECTED_PACKAGE = 'thetowersdk';
const EXPECTED_VERSION = '0.14.1';

const MODULES = [
  'knowledge',
  'data',
  'mechanics',
  'wiki',
  'contributions',
  'save',
  'node',
  'charts',
];

const packageDir = resolve(process.argv[2] ?? '');
const reportPath = resolve(
  process.argv[3] ?? 'sdk-runtime-smoke-report.json'
);

const report = {
  test: 'Samantha TheTowerSDK runtime smoke test',
  testVersion: '2.0.0',
  startedAt: new Date().toISOString(),

  runtime: {
    nodeVersion: process.version,
    nodeMajor: Number(process.versions.node.split('.')[0]),
    platform: process.platform,
    architecture: process.arch,
  },

  expected: {
    package: EXPECTED_PACKAGE,
    version: EXPECTED_VERSION,
  },

  package: null,
  dependencies: [],
  modules: [],

  summary: {
    tested: 0,
    passed: 0,
    failed: 0,
    notExported: 0,
  },

  status: 'FAILED',

  limitations: [
    'Tests package importability, not game mechanics correctness.',
    'Does not validate numerical data or formulas.',
    'Does not test actual player save decoding.',
    'Does not establish redistribution rights.',
    'Does not prove compatibility with every supported runtime.',
  ],
};

let fatalError = null;

function errorDetails(error) {
  return {
    name: error?.name ?? 'Error',
    message: error?.message ?? String(error),
    code: error?.code ?? null,
  };
}

function isObjectLike(value) {
  return value !== null &&
    (typeof value === 'object' || typeof value === 'function');
}

try {
  if (report.runtime.nodeMajor < 20) {
    throw new Error('Node.js >=20 is required.');
  }

  const packageJsonPath = join(packageDir, 'package.json');

  const packageJson = JSON.parse(
    await readFile(packageJsonPath, 'utf8')
  );

  if (packageJson.name !== EXPECTED_PACKAGE) {
    throw new Error(
      `Unexpected package name: ${packageJson.name}`
    );
  }

  if (packageJson.version !== EXPECTED_VERSION) {
    throw new Error(
      `Expected ${EXPECTED_VERSION}, got ${packageJson.version}`
    );
  }

  const packageExports = packageJson.exports ?? {};

  report.package = {
    name: packageJson.name,
    version: packageJson.version,
    license: packageJson.license ?? null,
    engines: packageJson.engines ?? null,
    packageType: packageJson.type ?? 'commonjs-default',
    exportPaths: Object.keys(packageExports).sort(),
    declaredDependencies: packageJson.dependencies ?? {},
    optionalDependencies: packageJson.optionalDependencies ?? {},
    peerDependencies: packageJson.peerDependencies ?? {},
  };

  const sdkRequire = createRequire(
    join(packageDir, '__samantha_smoke_test__.cjs')
  );

  // Inspect installed dependency versions.
  const dependencyNames = [
    ...new Set([
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.optionalDependencies ?? {}),
    ]),
  ].sort();

  for (const dependencyName of dependencyNames) {
    const result = {
      name: dependencyName,
      status: 'UNKNOWN',
      declaredVersion:
        packageJson.dependencies?.[dependencyName] ??
        packageJson.optionalDependencies?.[dependencyName] ??
        null,
      installedVersion: null,
      error: null,
    };

    try {
      const dependencyPackagePath = sdkRequire.resolve(
        `${dependencyName}/package.json`
      );

      const dependencyPackage = JSON.parse(
        await readFile(dependencyPackagePath, 'utf8')
      );

      result.installedVersion = dependencyPackage.version ?? null;
      result.status = 'VERIFIED';
    } catch (error) {
      // Some packages restrict package.json through exports.
      // Do not mistake that restriction for a missing dependency.
      try {
        sdkRequire.resolve(dependencyName);
        result.status = 'RESOLVED_PACKAGE_JSON_RESTRICTED';
        result.error = errorDetails(error);
      } catch (resolveError) {
        result.status = 'UNRESOLVED';
        result.error = errorDetails(resolveError);
      }
    }

    report.dependencies.push(result);
  }

  // Test root package and all priority modules.
  const specifiers = [
    EXPECTED_PACKAGE,
    ...MODULES.map(name => `${EXPECTED_PACKAGE}/${name}`),
  ];

  for (const specifier of specifiers) {
    const result = {
      specifier,
      status: 'FAILED',
      exportCount: 0,
      exportNames: [],
      error: null,
    };

    const isRoot = specifier === EXPECTED_PACKAGE;

    if (!isRoot && !Object.hasOwn(packageExports, `./${specifier.slice(EXPECTED_PACKAGE.length + 1)}`)) {
      result.status = 'NOT_EXPORTED';
      result.note = 'Subpath is not declared in package.json exports.';
      report.modules.push(result);
      continue;
    }

    try {
      const loaded = sdkRequire(specifier);

      const names = isObjectLike(loaded)
        ? Object.keys(loaded).sort()
        : [];

      result.status = 'PASSED';
      result.exportCount = names.length;
      result.exportNames = names;
      result.exportType = typeof loaded;

      if (names.length === 0) {
        result.note =
          'Imported successfully, but has no enumerable exports.';
      }
    } catch (error) {
      result.error = errorDetails(error);
    }

    report.modules.push(result);
  }

} catch (error) {
  fatalError = errorDetails(error);
}

report.finishedAt = new Date().toISOString();

report.summary.tested = report.modules.length;

report.summary.passed = report.modules.filter(
  item => item.status === 'PASSED'
).length;

report.summary.failed = report.modules.filter(
  item => item.status === 'FAILED'
).length;

report.summary.notExported = report.modules.filter(
  item => item.status === 'NOT_EXPORTED'
).length;

report.fatalError = fatalError;

report.status = fatalError
  ? 'FAILED'
  : report.summary.failed > 0
    ? 'FAILED'
    : report.summary.notExported > 0
      ? 'PARTIAL'
      : report.dependencies.some(
          item => item.status === 'UNRESOLVED'
        )
        ? 'PARTIAL'
        : 'PASSED';

// Always attempt to preserve the report.
try {
  await mkdir(dirname(reportPath), { recursive: true });

  await writeFile(
    reportPath,
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
} catch (error) {
  console.error(
    'REPORT_WRITE_FAILED:',
    JSON.stringify(errorDetails(error))
  );

  process.exitCode = 2;
}

console.log(JSON.stringify(report, null, 2));

if (report.status === 'FAILED') {
  process.exitCode = 1;
}
